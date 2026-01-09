import os
import sys

# Forzar encoding UTF-8 en Windows
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"
    if hasattr(sys, '_MEIPASS'):  # PyInstaller
        os.environ["PYTHONUTF8"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.api import auth, courses, schedules, teachers, classrooms, users

# Importar todos los modelos para que SQLAlchemy los registre
from app.models.user import User, UserRole
from app.models.teacher import Teacher, TeacherAvailability
from app.models.course import Course
from app.models.classroom import Classroom
from app.models.schedule import Schedule, ScheduleSlot
from app.core.security import get_password_hash

def init_db():
    """Inicializar base de datos: crear tablas y usuario admin"""
    print("🔄 Inicializando base de datos...")
    
    try:
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas correctamente")
        
        # Crear usuario admin si no existe
        db = SessionLocal()
        try:
            existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
            if not existing_admin:
                admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
                admin_user = User(
                    email="ADMIN@SISTEMA.EDU",
                    username="ADMIN",
                    full_name="ADMINISTRADOR DEL SISTEMA",
                    hashed_password=get_password_hash(admin_password),
                    role=UserRole.SUPER_ADMIN,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
                print("✅ Usuario administrador creado")
            else:
                print("ℹ️  Usuario administrador ya existe")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error al inicializar base de datos: {e}")
        import traceback
        traceback.print_exc()

# Inicializar DB al arrancar
init_db()

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema inteligente de planificación de horarios académicos utilizando algoritmos metaheurísticos"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios"])
app.include_router(courses.router, prefix="/api/courses", tags=["Cursos"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Docentes"])
app.include_router(classrooms.router, prefix="/api/classrooms", tags=["Aulas"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["Horarios"])


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Sistema de Planificación de Horarios Académicos",
        "version": settings.APP_VERSION,
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
