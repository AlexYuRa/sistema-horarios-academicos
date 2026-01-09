"""
Script para crear un nuevo usuario super administrador
Ejecutar: python -m scripts.create_superadmin
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


def create_superadmin():
    """Crear un nuevo super administrador"""
    db = SessionLocal()

    try:
        # Verificar si ya existe
        existing = db.query(User).filter(User.username == "superadmin").first()

        if existing:
            print("⚠️  Ya existe un usuario con username 'superadmin'")
            print(f"   Usuario: {existing.username}")
            print(f"   Rol: {existing.role}")
            return

        # Crear nuevo super admin
        superadmin = User(
            email="superadmin@universidad.edu",
            username="superadmin",
            full_name="Super Administrador",
            hashed_password=get_password_hash("super123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )

        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)

        print("=" * 60)
        print("✅ Super Administrador creado exitosamente!")
        print("=" * 60)
        print(f"\n📋 CREDENCIALES:")
        print(f"   Usuario:    superadmin")
        print(f"   Contraseña: super123")
        print(f"   Rol:        {superadmin.role}")
        print(f"   Email:      {superadmin.email}")
        print(f"\n🔐 Usa estas credenciales para iniciar sesión")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error al crear super administrador: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("   CREACIÓN DE SUPER ADMINISTRADOR")
    print("=" * 60 + "\n")
    create_superadmin()
    print()
