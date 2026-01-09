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
from app.db.session import engine, Base
from app.api import auth, courses, schedules, teachers, classrooms, users

# Crear tablas
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")
    print("The application will start but database operations may fail.")

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
