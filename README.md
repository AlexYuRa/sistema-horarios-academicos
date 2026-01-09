# Sistema Inteligente de Planificación de Horarios Académicos

Sistema web completo para la automatización de horarios académicos universitarios utilizando algoritmos metaheurísticos de optimización.

## 📋 Descripción

Este sistema permite gestionar de forma eficiente la planificación de horarios académicos para instituciones universitarias, utilizando algoritmos de optimización (genéticos, recocido simulado, búsqueda tabú) para generar horarios óptimos que cumplan con restricciones duras y blandas.

### Características Principales

✅ **Gestión Académica Integral**
- Administración de cursos con metadatos completos
- Gestión de personal docente con disponibilidad horaria
- Control de infraestructura física (aulas y laboratorios)

✅ **Motor de Optimización Inteligente**
- Algoritmos metaheurísticos (genéticos, recocido simulado, búsqueda tabú)
- Procesamiento de restricciones duras y blandas
- Generación de múltiples soluciones alternativas
- Evaluación de calidad mediante métricas definidas

✅ **Sistema de Roles y Permisos**
- Super Administrador
- Coordinador Académico
- Asistente
- Docente
- Estudiante

✅ **Visualización Interactiva**
- Interfaz web responsive con Material-UI
- Vistas múltiples (por ciclo, docente, aula)
- Editor manual con drag-and-drop
- Validación automática de conflictos

✅ **Exportación de Reportes**
- PDF profesional
- Excel para análisis
- CSV para integración
- HTML para publicación

## 🏗️ Arquitectura

```
sistema-horarios-academicos/
├── backend/                 # API REST con FastAPI
│   ├── app/
│   │   ├── algorithms/     # Algoritmos metaheurísticos
│   │   ├── api/           # Endpoints REST
│   │   ├── core/          # Configuración y seguridad
│   │   ├── db/            # Base de datos
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── schemas/       # Schemas Pydantic
│   │   └── main.py        # Aplicación principal
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/               # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # Servicios de API
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── types/         # Definiciones TypeScript
│   │   └── App.tsx        # Componente raíz
│   ├── package.json
│   └── Dockerfile
│
├── nginx/                  # Configuración nginx
├── docker-compose.yml      # Orquestación de servicios
└── README.md
```

## 🚀 Tecnologías

### Backend
- **Python 3.11**
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **Redis** - Caché en memoria
- **DEAP** - Algoritmos evolutivos
- **NumPy/SciPy** - Computación científica
- **ReportLab** - Generación de PDFs
- **OpenPyXL** - Generación de Excel

### Frontend
- **React 18** con **TypeScript**
- **Material-UI (MUI)** - Componentes de interfaz
- **React Router** - Enrutamiento
- **Zustand** - Gestión de estado
- **TanStack Query** - Manejo de datos asíncronos
- **Axios** - Cliente HTTP
- **React Beautiful DnD** - Drag and drop

### Infraestructura
- **Docker** - Contenedorización
- **Docker Compose** - Orquestación
- **Nginx** - Reverse proxy
- **GitLab CI/CD** (opcional)

## 📦 Instalación

### Prerrequisitos

- Docker y Docker Compose instalados
- Git

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sistema-horarios-academicos
```

2. **Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones
```

3. **Iniciar con Docker Compose**
```bash
docker-compose up -d
```

Esto iniciará todos los servicios:
- PostgreSQL en puerto 5432
- Redis en puerto 6379
- Backend (FastAPI) en puerto 8000
- Frontend (React) en puerto 3000
- Nginx en puerto 80

4. **Verificar instalación**

Acceder a:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## 🔧 Configuración

### Variables de Entorno

Editar `backend/.env`:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@postgres:5432/horarios_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=horarios_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
SECRET_KEY=tu-clave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Algoritmos
GA_POPULATION_SIZE=50
GA_MAX_GENERATIONS=100
GA_CROSSOVER_PROB=0.8
GA_MUTATION_PROB=0.2
```

## 💻 Uso

### 1. Crear Usuario Administrador

```bash
# Ejecutar script de inicialización (crear este archivo)
docker-compose exec backend python scripts/create_admin.py
```

### 2. Iniciar Sesión

Acceder a http://localhost:3000/login con las credenciales creadas.

### 3. Gestionar Cursos

1. Ir a "Cursos" en el menú
2. Hacer clic en "Nuevo Curso"
3. Completar información del curso
4. Asignar docente responsable

### 4. Configurar Disponibilidad Docente

1. Ir a "Docentes"
2. Seleccionar un docente
3. Configurar horarios disponibles en la grilla interactiva

### 5. Registrar Aulas

1. Ir a "Aulas"
2. Agregar aulas con capacidad y tipo
3. Marcar equipamiento disponible

### 6. Generar Horario Automáticamente

1. Ir a "Horarios"
2. Hacer clic en "Generar Horario"
3. Completar formulario:
   - Nombre del horario
   - Semestre y año
   - Algoritmo a utilizar
4. Esperar generación (< 3 minutos)
5. Revisar resultado y métricas de calidad

### 7. Editar Manualmente

1. Abrir horario generado
2. Hacer clic en un slot
3. Arrastrar y soltar para reasignar
4. El sistema valida automáticamente conflictos

### 8. Publicar Horario

1. Revisar horario completo
2. Hacer clic en "Publicar"
3. El horario estará disponible para estudiantes y docentes

### 9. Exportar Reportes

- **PDF**: Formato profesional para impresión
- **Excel**: Para análisis de datos
- **CSV**: Para integración con otros sistemas
- **HTML**: Para publicación web

## 📊 Algoritmos de Optimización

### Algoritmo Genético

El sistema utiliza DEAP para implementar algoritmos genéticos:

**Parámetros configurables:**
- Tamaño de población: 50
- Generaciones máximas: 100
- Probabilidad de cruce: 0.8
- Probabilidad de mutación: 0.2

**Restricciones Duras:**
- Unicidad temporal de docentes
- Exclusividad de aulas
- Disponibilidad horaria
- Coherencia por ciclo

**Restricciones Blandas:**
- Preferencias de horario
- Distribución equilibrada
- Minimización de tiempos muertos
- Optimización de uso de aulas

**Función de Fitness:**
```python
fitness = -(α × R_duras + β × R_blandas)
```

## 🔐 Seguridad

- Autenticación JWT
- Hash de contraseñas con bcrypt
- Validación de roles y permisos
- CORS configurado
- SQL Injection prevention (SQLAlchemy ORM)
- XSS protection
- HTTPS recomendado en producción

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 📈 Métricas de Calidad

El sistema evalúa cada horario generado con:

- **Fitness Score**: Puntuación global de calidad
- **Violaciones de Restricciones Duras**: Debe ser 0
- **Violaciones de Restricciones Blandas**: Minimizar
- **Tiempo de Generación**: < 3 minutos
- **Número de Soluciones Alternativas**: Múltiples opciones

## 🎯 Roadmap

- [x] Implementación de algoritmo genético
- [x] API REST completa
- [x] Interfaz web responsiva
- [x] Sistema de autenticación
- [ ] Algoritmo de recocido simulado
- [ ] Algoritmo de búsqueda tabú
- [ ] Integración con LDAP/Active Directory
- [ ] Notificaciones por email
- [ ] Aplicación móvil (React Native)
- [ ] Módulo de reportes avanzados
- [ ] IA para predicción de conflictos
- [ ] Sistema multi-facultad

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- RAMOS PUENTES MARCO ANTONIO
- YUPANQUI RAMOS ALEX GIANMARCO

## 📧 Contacto

Para soporte o consultas, contactar a través de [email institucional].

## 🙏 Agradecimientos

- Universidad Nacional de Trujillo
- Facultad de Ciencias Físicas y Matemáticas
- Escuela de Ingeniería Informática
- Dr. GUEVARA RUIZ RICARDO MANUEL (Docente del curso)

---

**Ingeniería de Software II - 2025**
