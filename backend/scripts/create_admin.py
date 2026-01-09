"""
Script para crear usuario administrador inicial
Ejecutar: python -m scripts.create_admin
"""
import sys
import os

# Forzar encoding UTF-8 en Windows
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"
    os.environ["PYTHONUTF8"] = "1"

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.teacher import Teacher, TeacherAvailability
from app.models.course import Course, CourseType
from app.models.classroom import Classroom, ClassroomType
from app.models.schedule import Schedule, ScheduleSlot
from app.core.security import get_password_hash


def create_admin_user():
    """Crear usuario administrador por defecto"""
    db = SessionLocal()

    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()

        if existing_admin:
            print("Ya existe un usuario administrador.")
            print(f"Usuario: {existing_admin.username}")
            return

        # Crear nuevo admin
        admin_user = User(
            email="admin@universidad.edu",
            username="admin",
            full_name="Administrador del Sistema",
            hashed_password=get_password_hash("admin123"),  # CAMBIAR EN PRODUCCIÓN
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("✅ Usuario administrador creado exitosamente")
        print(f"Usuario: {admin_user.username}")
        print(f"Contraseña: admin123")
        print("\nIMPORTANTE: Cambiar la contraseña inmediatamente en producción")

    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
        db.rollback()
    finally:
        db.close()


def create_sample_data():
    """Crear datos de ejemplo para pruebas"""
    db = SessionLocal()

    try:

        # Crear cursos de ejemplo
        sample_courses = [
            {
                "code": "IS001",
                "name": "Ingeniería de Software II",
                "cycle": 5,
                "credits": 4.0,
                "theory_hours": 2,
                "practice_hours": 4,
                "course_type": CourseType.THEORY_PRACTICE
            },
            {
                "code": "BD001",
                "name": "Base de Datos II",
                "cycle": 5,
                "credits": 4.0,
                "theory_hours": 2,
                "practice_hours": 4,
                "course_type": CourseType.THEORY_PRACTICE
            },
            {
                "code": "IA001",
                "name": "Inteligencia Artificial",
                "cycle": 6,
                "credits": 4.0,
                "theory_hours": 2,
                "practice_hours": 4,
                "course_type": CourseType.THEORY_PRACTICE
            },
        ]

        for course_data in sample_courses:
            existing = db.query(Course).filter(Course.code == course_data["code"]).first()
            if not existing:
                course = Course(**course_data)
                db.add(course)

        # Crear aulas de ejemplo
        sample_classrooms = [
            {"code": "A101", "name": "Aula 101", "building": "A", "floor": 1, "capacity": 30, "classroom_type": ClassroomType.THEORY},
            {"code": "A102", "name": "Aula 102", "building": "A", "floor": 1, "capacity": 30, "classroom_type": ClassroomType.THEORY},
            {"code": "L201", "name": "Lab Computo 1", "building": "B", "floor": 2, "capacity": 25, "classroom_type": ClassroomType.LAB, "equipment": "25 PCs"},
            {"code": "L202", "name": "Lab Computo 2", "building": "B", "floor": 2, "capacity": 25, "classroom_type": ClassroomType.LAB, "equipment": "25 PCs"},
        ]

        for classroom_data in sample_classrooms:
            existing = db.query(Classroom).filter(Classroom.code == classroom_data["code"]).first()
            if not existing:
                classroom = Classroom(**classroom_data)
                db.add(classroom)

        db.commit()
        print("✅ Datos de ejemplo creados exitosamente")

    except Exception as e:
        print(f"❌ Error al crear datos de ejemplo: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Inicialización del Sistema de Horarios ===\n")
    create_admin_user()
    print()
    create_sample_data()
    print("\n=== Inicialización completada ===")
