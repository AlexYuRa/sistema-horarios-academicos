# Guía de Inicio Rápido

## 🚀 Instalación y Ejecución en 5 Minutos

### 1. Prerrequisitos

Asegúrate de tener instalado:
- Docker Desktop
- Git

### 2. Clonar y Configurar

```bash
# Clonar repositorio
git clone <repository-url>
cd sistema-horarios-academicos

# Copiar archivo de configuración
cp backend/.env.example backend/.env
```

### 3. Iniciar Sistema

```bash
# Iniciar todos los servicios con Docker Compose
docker-compose up -d

# Esperar a que los servicios estén listos (30-60 segundos)
docker-compose logs -f backend
```

### 4. Crear Usuario Administrador

```bash
# Crear usuario admin y datos de ejemplo
docker-compose exec backend python -m scripts.create_admin
```

Credenciales por defecto:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambiar contraseña después del primer login

### 5. Acceder al Sistema

Abrir navegador en: **http://localhost:3000**

## 📋 Primeros Pasos

### 1. Iniciar Sesión
- Usuario: `admin`
- Contraseña: `admin123`

### 2. Verificar Datos de Ejemplo

El sistema incluye datos de ejemplo:
- ✅ 3 cursos de ingeniería
- ✅ 4 aulas/laboratorios

### 3. Crear un Docente

1. Ir a **"Usuarios"** → **"Nuevo Usuario"**
2. Seleccionar rol: **"Docente"**
3. Completar información
4. En **"Docentes"**, configurar disponibilidad horaria

### 4. Asignar Docente a Curso

1. Ir a **"Cursos"**
2. Editar un curso
3. Asignar docente responsable

### 5. Generar Primer Horario

1. Ir a **"Horarios"** → **"Generar Horario"**
2. Completar formulario:
   ```
   Nombre: Horario 2025-I
   Semestre: 2025-I
   Año: 2025
   Algoritmo: Genético
   ```
3. Hacer clic en **"Generar"**
4. Esperar generación (< 3 minutos)

### 6. Visualizar Resultado

El sistema mostrará:
- ✅ Horario completo en formato de grilla
- ✅ Métricas de calidad
- ✅ Violaciones de restricciones
- ✅ Tiempo de generación

### 7. Editar Manualmente (Opcional)

- Hacer clic en cualquier slot
- Arrastrar y soltar para reubicar
- El sistema valida automáticamente

### 8. Exportar Horario

Opciones disponibles:
- 📄 **PDF** - Para imprimir
- 📊 **Excel** - Para análisis
- 📋 **CSV** - Para integración
- 🌐 **HTML** - Para web

## 🔍 Verificar Servicios

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs backend

# Ver logs del frontend
docker-compose logs frontend

# Ver logs de PostgreSQL
docker-compose logs postgres
```

## 📡 Endpoints Importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛠️ Comandos Útiles

```bash
# Detener servicios
docker-compose stop

# Reiniciar servicios
docker-compose restart

# Ver logs en tiempo real
docker-compose logs -f

# Eliminar todo (CUIDADO: Borra base de datos)
docker-compose down -v

# Reconstruir contenedores
docker-compose up -d --build

# Entrar al contenedor del backend
docker-compose exec backend bash

# Entrar a PostgreSQL
docker-compose exec postgres psql -U user -d horarios_db
```

## 🧪 Probar API Directamente

### Obtener Token

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

### Listar Cursos

```bash
curl -X GET "http://localhost:8000/api/courses" \
  -H "Authorization: Bearer <TOKEN>"
```

### Generar Horario

```bash
curl -X POST "http://localhost:8000/api/schedules/generate" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Horario 2025-I",
    "semester": "2025-I",
    "year": 2025,
    "algorithm": "genetic_algorithm"
  }'
```

## ❓ Solución de Problemas

### El frontend no carga

```bash
# Verificar logs
docker-compose logs frontend

# Reconstruir frontend
docker-compose up -d --build frontend
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs de PostgreSQL
docker-compose logs postgres
```

### Puerto ya en uso

```bash
# Cambiar puertos en docker-compose.yml
# Ejemplo: cambiar "3000:3000" a "3001:3000"
```

### Resetear base de datos

```bash
# CUIDADO: Esto borra todos los datos
docker-compose down -v
docker-compose up -d
docker-compose exec backend python -m scripts.create_admin
```

## 📚 Recursos Adicionales

- [README Principal](README.md) - Documentación completa
- [Swagger UI](http://localhost:8000/docs) - Documentación interactiva de la API
- [Informe del Proyecto](docs/informe.pdf) - Detalles técnicos y académicos

## 💡 Consejos

1. **Usar navegador moderno**: Chrome, Firefox, Edge (última versión)
2. **Habilitar JavaScript**: Requerido para el frontend
3. **Pantalla recomendada**: Mínimo 1366x768 para mejor experiencia
4. **Datos de prueba**: El sistema incluye cursos y aulas de ejemplo
5. **Backup regular**: Exportar horarios importantes en múltiples formatos

## 🎯 Próximos Pasos

Después de la configuración inicial:

1. ✅ Crear usuarios adicionales (coordinadores, docentes)
2. ✅ Registrar todos los cursos del plan curricular
3. ✅ Configurar disponibilidad de todos los docentes
4. ✅ Registrar todas las aulas disponibles
5. ✅ Generar horario para cada ciclo académico
6. ✅ Revisar y ajustar manualmente si es necesario
7. ✅ Publicar horarios finales
8. ✅ Exportar y distribuir a estudiantes

## 📧 Soporte

Para preguntas o problemas:
- Revisar logs: `docker-compose logs -f`
- Consultar documentación completa
- Contactar a administradores del sistema

---

**¡Listo! El sistema está funcionando y puedes comenzar a planificar horarios académicos de forma inteligente.**
