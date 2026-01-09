# Guía de Despliegue en Producción

## 🚀 Despliegue en Servidor

### Opción 1: Servidor con Docker

#### Prerrequisitos
- Servidor Linux (Ubuntu 20.04+ recomendado)
- Docker y Docker Compose instalados
- Dominio configurado (opcional)
- Certificado SSL (Let's Encrypt recomendado)

#### Pasos de Instalación

1. **Conectar al servidor**
```bash
ssh usuario@servidor.com
```

2. **Instalar Docker**
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
```

3. **Clonar repositorio**
```bash
git clone <repository-url>
cd sistema-horarios-academicos
```

4. **Configurar variables de entorno de producción**
```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Configuración de producción:
```env
# IMPORTANTE: Cambiar estos valores
SECRET_KEY=<generar-clave-segura-larga>
POSTGRES_PASSWORD=<contraseña-segura>
DATABASE_URL=postgresql://user:<contraseña-segura>@postgres:5432/horarios_db

# Configurar origen permitido
ALLOWED_ORIGINS=https://tudominio.com

# Deshabilitar debug
DEBUG=False
```

5. **Generar clave secreta segura**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

6. **Iniciar servicios**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

7. **Crear usuario administrador**
```bash
docker-compose exec backend python -m scripts.create_admin
```

8. **Configurar Nginx como reverse proxy**

Crear archivo `/etc/nginx/sites-available/horarios`:
```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

9. **Habilitar sitio y recargar Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/horarios /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

10. **Configurar SSL con Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### Opción 2: Despliegue en Cloud (AWS, GCP, Azure)

#### AWS Elastic Beanstalk

1. **Instalar EB CLI**
```bash
pip install awsebcli
```

2. **Inicializar aplicación**
```bash
eb init -p docker sistema-horarios
```

3. **Crear ambiente**
```bash
eb create produccion
```

4. **Desplegar**
```bash
eb deploy
```

#### Google Cloud Run

1. **Construir imágenes**
```bash
gcloud builds submit --tag gcr.io/proyecto-id/horarios-backend backend/
gcloud builds submit --tag gcr.io/proyecto-id/horarios-frontend frontend/
```

2. **Desplegar servicios**
```bash
gcloud run deploy horarios-backend --image gcr.io/proyecto-id/horarios-backend --platform managed
gcloud run deploy horarios-frontend --image gcr.io/proyecto-id/horarios-frontend --platform managed
```

### Opción 3: Kubernetes

1. **Crear archivos de configuración**

`k8s/deployment.yml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: horarios-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: horarios-backend
  template:
    metadata:
      labels:
        app: horarios-backend
    spec:
      containers:
      - name: backend
        image: <tu-imagen>:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: horarios-secrets
              key: database-url
```

2. **Aplicar configuración**
```bash
kubectl apply -f k8s/
```

## 🔒 Seguridad en Producción

### 1. Variables de Entorno Seguras

- ✅ Usar secretos seguros (mínimo 32 caracteres)
- ✅ No commitear archivos `.env`
- ✅ Usar gestores de secretos (AWS Secrets Manager, Vault)

### 2. Base de Datos

- ✅ Contraseñas fuertes
- ✅ Backups automáticos diarios
- ✅ Conexiones SSL
- ✅ Acceso restringido por IP

### 3. API

- ✅ Rate limiting
- ✅ CORS configurado correctamente
- ✅ HTTPS obligatorio
- ✅ Headers de seguridad

### 4. Frontend

- ✅ Build optimizado para producción
- ✅ Variables de entorno separadas
- ✅ CDN para assets estáticos

## 📊 Monitoreo

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Logs de backend
docker-compose logs backend

# Logs de PostgreSQL
docker-compose logs postgres
```

### Métricas

Configurar Prometheus y Grafana:
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 💾 Backups

### Backup Automático de PostgreSQL

Crear script `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U user horarios_db > backup_$DATE.sql
gzip backup_$DATE.sql
# Subir a S3 o almacenamiento cloud
aws s3 cp backup_$DATE.sql.gz s3://mi-bucket/backups/
```

Configurar cron:
```bash
# Ejecutar backup diario a las 2 AM
0 2 * * * /ruta/backup.sh
```

### Restaurar Backup

```bash
gunzip backup_FECHA.sql.gz
docker-compose exec -T postgres psql -U user horarios_db < backup_FECHA.sql
```

## 🔄 Actualizaciones

### Actualizar Código

```bash
# Pull cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs -f
```

### Migración de Base de Datos

```bash
# Si usas Alembic
docker-compose exec backend alembic upgrade head
```

## ⚡ Optimización de Rendimiento

### 1. PostgreSQL

Editar `postgresql.conf`:
```ini
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 2. Redis

Configurar límite de memoria:
```bash
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 3. Nginx

Habilitar compresión:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 4. Frontend

Build optimizado:
```bash
cd frontend
npm run build
# Los archivos optimizados estarán en dist/
```

## 📈 Escalabilidad

### Escalar Horizontalmente

```bash
# Aumentar réplicas del backend
docker-compose up -d --scale backend=3
```

### Load Balancer

Configurar Nginx como load balancer:
```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## 🧪 Testing en Producción

### Health Checks

```bash
# Backend
curl https://tudominio.com/api/health

# Frontend
curl https://tudominio.com/

# PostgreSQL
docker-compose exec postgres pg_isready
```

### Load Testing

Usar herramientas como:
- Apache Bench
- JMeter
- k6

```bash
# Ejemplo con Apache Bench
ab -n 1000 -c 10 https://tudominio.com/api/courses
```

## 📱 Notificaciones

Configurar alertas con:
- Slack webhooks
- Email (SendGrid, AWS SES)
- SMS (Twilio)

## 🔧 Troubleshooting

### Problema: Contenedores no inician

```bash
docker-compose logs
docker-compose ps
docker system prune -a
```

### Problema: Base de datos corrupta

```bash
# Restaurar desde backup
docker-compose down
docker volume rm horarios_postgres_data
docker-compose up -d
# Restaurar backup
```

### Problema: Alto uso de CPU

```bash
# Ver uso de recursos
docker stats

# Limitar recursos
docker-compose.yml:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## 📞 Soporte de Producción

- Documentación: Consultar README.md
- Logs: Revisar logs de contenedores
- Monitoreo: Configurar Grafana/Prometheus
- Backups: Verificar backups diarios

---

**Sistema de Horarios Académicos - Guía de Despliegue v1.0**
