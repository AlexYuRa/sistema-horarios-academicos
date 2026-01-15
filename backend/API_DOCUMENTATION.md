# 📚 Documentación de la API - Sistema de Horarios Académicos

## URL Base

- **Desarrollo:** `http://localhost:8000`
- **Producción:** `https://sistema-horarios-academicos-production.up.railway.app`

## Swagger UI Interactivo

Accede a la documentación interactiva completa en:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

---

## 🔐 Autenticación

Todos los endpoints (excepto `/api/auth/login` y `/api/auth/register`) requieren autenticación mediante JWT.

### 1. Login

```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=ADMIN&password=admin123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Ejemplo con curl:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ADMIN&password=admin123"
```

**Ejemplo con Python:**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/auth/login",
    data={"username": "ADMIN", "password": "admin123"}
)
token = response.json()["access_token"]

# Usar el token en requests posteriores
headers = {"Authorization": f"Bearer {token}"}
```

### 2. Registro de Usuario

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "docente@unt.edu.pe",
  "username": "JPEREZ",
  "full_name": "JUAN PEREZ GOMEZ",
  "password": "Password123",
  "role": "teacher"
}
```

**Roles disponibles:**
- `super_admin`: Administrador con acceso total
- `coordinator`: Coordinador académico
- `assistant`: Asistente
- `teacher`: Docente
- `student`: Estudiante

**Requisitos de contraseña:**
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número

### 3. Obtener Usuario Actual

```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

## 👥 Usuarios

### Listar Usuarios

```http
GET /api/users
Authorization: Bearer {token}
```

**Query Parameters:**
- `skip` (opcional): Número de registros a saltar (default: 0)
- `limit` (opcional): Número máximo de registros (default: 100)

**Requiere:** Rol de `super_admin` o `coordinator`

---

## 📖 Cursos

### Listar Cursos

```http
GET /api/courses
Authorization: Bearer {token}
```

**Query Parameters:**
- `cycle` (opcional): Filtrar por ciclo (1-10)
- `skip` (opcional): Paginación
- `limit` (opcional): Límite de resultados

### Crear Curso

```http
POST /api/courses
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "ING201",
  "name": "INGENIERÍA DE SOFTWARE I",
  "cycle": 5,
  "credits": 4,
  "theory_hours": 4,
  "practice_hours": 2,
  "course_type": "theory_practice",
  "teacher_id": 1
}
```

**Tipos de curso:**
- `theory`: Solo teoría
- `practice`: Solo práctica
- `lab`: Laboratorio
- `theory_practice`: Teoría y práctica combinadas

### Actualizar Curso

```http
PUT /api/courses/{course_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "INGENIERÍA DE SOFTWARE II",
  "credits": 5
}
```

### Eliminar Curso

```http
DELETE /api/courses/{course_id}
Authorization: Bearer {token}
```

---

## 👨‍🏫 Docentes

### Listar Docentes

```http
GET /api/teachers
Authorization: Bearer {token}
```

### Crear Docente

```http
POST /api/teachers
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 5,
  "employee_code": "DOC12345",
  "phone": "987654321",
  "max_weekly_hours": 20
}
```

### Actualizar Disponibilidad de Docente

```http
POST /api/teachers/{teacher_id}/availability
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "day_of_week": 0,
    "start_time": "07:00",
    "end_time": "13:00",
    "is_available": true
  },
  {
    "day_of_week": 1,
    "start_time": "07:00",
    "end_time": "13:00",
    "is_available": true
  }
]
```

**Días de la semana:**
- `0`: Lunes
- `1`: Martes
- `2`: Miércoles
- `3`: Jueves
- `4`: Viernes
- `5`: Sábado
- `6`: Domingo

---

## 🏫 Aulas

### Listar Aulas

```http
GET /api/classrooms
Authorization: Bearer {token}
```

**Query Parameters:**
- `classroom_type` (opcional): Filtrar por tipo
- `is_available` (opcional): Filtrar por disponibilidad

### Crear Aula

```http
POST /api/classrooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "A301",
  "name": "AULA 301 - EDIFICIO A",
  "building": "A",
  "floor": 3,
  "capacity": 40,
  "classroom_type": "theory",
  "equipment": ["proyector", "pizarra digital"],
  "is_available": true
}
```

**Tipos de aula:**
- `theory`: Aula teórica
- `practice`: Aula práctica
- `lab`: Laboratorio
- `auditorium`: Auditorio

---

## 📅 Horarios

### Listar Horarios

```http
GET /api/schedules
Authorization: Bearer {token}
```

**Query Parameters:**
- `semester` (opcional): Filtrar por semestre (ej: "2025-I")
- `status_filter` (opcional): Filtrar por estado (`draft`, `published`, `archived`)

### Obtener Horario Detallado

```http
GET /api/schedules/{schedule_id}
Authorization: Bearer {token}
```

**Response:** Retorna el horario con todos sus slots, incluyendo información de curso, docente y aula.

### Generar Horario con Algoritmo Genético

```http
POST /api/schedules/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "HORARIO 2025-I",
  "semester": "2025-I",
  "year": 2025,
  "algorithm": "genetic_algorithm"
}
```

**Requiere:** Rol de `super_admin` o `coordinator`

**Response:**
```json
{
  "schedule_id": 1,
  "name": "HORARIO 2025-I",
  "semester": "2025-I",
  "year": 2025,
  "status": "draft",
  "fitness_score": 12.5,
  "hard_constraints_violations": 0,
  "soft_constraints_violations": 125,
  "generation_time": 145.2,
  "slots_count": 48,
  "message": "Horario generado exitosamente"
}
```

**Métricas de Calidad:**
- `fitness_score`: Puntuación de fitness (menor es mejor)
- `hard_constraints_violations`: Conflictos críticos (debe ser 0)
- `soft_constraints_violations`: Penalizaciones menores (optimizable)
- `generation_time`: Tiempo de generación en segundos

**Proceso de generación:**
1. Obtiene todos los cursos con docente asignado
2. Obtiene disponibilidad de todos los docentes
3. Obtiene todas las aulas disponibles
4. Ejecuta algoritmo genético (DEAP)
   - Población: 50 individuos
   - Generaciones: 100
   - Cruce: 80%
   - Mutación: 20%
5. Retorna la mejor solución encontrada

### Actualizar Horario

```http
PUT /api/schedules/{schedule_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "HORARIO 2025-I - ACTUALIZADO",
  "status": "published"
}
```

### Editar Slot Individual

```http
PUT /api/schedules/{schedule_id}/slots/{slot_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "classroom_id": 5,
  "start_time": "09:00",
  "end_time": "11:00"
}
```

### Publicar Horario

```http
POST /api/schedules/{schedule_id}/publish
Authorization: Bearer {token}
```

Cambia el estado del horario de `draft` a `published`.

### Eliminar Horario

```http
DELETE /api/schedules/{schedule_id}
Authorization: Bearer {token}
```

---

## 📊 Códigos de Error HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - No tiene permisos suficientes |
| 404 | Not Found - Recurso no encontrado |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error del servidor |

---

## 🔑 Headers Requeridos

Para endpoints autenticados:

```
Authorization: Bearer {tu_token_jwt}
Content-Type: application/json
```

---

## 📝 Ejemplos Completos

### Ejemplo 1: Flujo de Login y Obtener Perfil

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Login
response = requests.post(
    f"{BASE_URL}/api/auth/login",
    data={"username": "ADMIN", "password": "admin123"}
)
token = response.json()["access_token"]

# 2. Obtener perfil
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
user_info = response.json()

print(f"Bienvenido, {user_info['full_name']}")
print(f"Rol: {user_info['role']}")
```

### Ejemplo 2: Crear Curso y Asignar Docente

```python
# Headers con token
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Crear curso
curso_data = {
    "code": "ING301",
    "name": "INGENIERÍA DE SOFTWARE III",
    "cycle": 7,
    "credits": 5,
    "theory_hours": 4,
    "practice_hours": 2,
    "course_type": "theory_practice",
    "teacher_id": 3
}

response = requests.post(
    f"{BASE_URL}/api/courses",
    headers=headers,
    json=curso_data
)

curso = response.json()
print(f"Curso creado: {curso['name']} (ID: {curso['id']})")
```

### Ejemplo 3: Generar Horario Automáticamente

```python
# Generar horario
horario_request = {
    "name": "HORARIO 2025-I",
    "semester": "2025-I",
    "year": 2025,
    "algorithm": "genetic_algorithm"
}

response = requests.post(
    f"{BASE_URL}/api/schedules/generate",
    headers=headers,
    json=horario_request
)

horario = response.json()
print(f"Horario generado en {horario['generation_time']} segundos")
print(f"Fitness score: {horario['fitness_score']}")
print(f"Conflictos duros: {horario['hard_constraints_violations']}")
print(f"Slots generados: {horario['slots_count']}")

# Obtener detalle del horario
schedule_id = horario['schedule_id']
response = requests.get(
    f"{BASE_URL}/api/schedules/{schedule_id}",
    headers=headers
)

detalle = response.json()
print(f"\\nTotal de slots: {len(detalle['slots'])}")
for slot in detalle['slots'][:5]:  # Mostrar primeros 5 slots
    print(f"- {slot['course']['name']} con {slot['teacher']['employee_code']} "
          f"en {slot['classroom']['code']} - Día {slot['day_of_week']} "
          f"{slot['start_time']}-{slot['end_time']}")
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar todos los tests
pytest backend/tests/

# Ejecutar tests del algoritmo genético
pytest backend/tests/test_genetic_algorithm.py -v

# Ejecutar tests con coverage
pytest --cov=app backend/tests/
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la documentación interactiva en `/docs`
2. Revisa los logs del servidor
3. Consulta el README principal del proyecto

---

## 🔄 Rate Limiting

**Nota:** Actualmente no hay rate limiting implementado. Para uso en producción con más usuarios, se recomienda implementar limitación de solicitudes.

---

## 🌐 CORS

Orígenes permitidos por defecto:
- `http://localhost:3000` (desarrollo frontend)
- `http://localhost:5173` (Vite dev server)
- `https://sistemas-horarios-academicos.vercel.app` (producción)

Para agregar más orígenes, modifica la variable `ALLOWED_ORIGINS` en el archivo `.env`.
