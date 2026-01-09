"""
Script para actualizar el rol del usuario admin a super_admin
Ejecutar: python -m scripts.fix_admin_role
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


def fix_admin_role():
    """Actualizar rol del usuario admin a super_admin"""
    db = SessionLocal()

    try:
        # Buscar usuario admin
        admin = db.query(User).filter(User.username == "admin").first()

        if not admin:
            print("❌ No se encontró el usuario 'admin'")
            return

        print(f"Usuario encontrado: {admin.username}")
        print(f"Rol actual: {admin.role}")

        # Actualizar rol
        admin.role = UserRole.SUPER_ADMIN
        db.commit()

        print(f"✅ Rol actualizado a: {admin.role}")
        print("\n🔄 Cierra sesión y vuelve a iniciar sesión para que los cambios surtan efecto.")

    except Exception as e:
        print(f"❌ Error al actualizar rol: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=== Actualización de Rol del Usuario Admin ===\n")
    fix_admin_role()
    print("\n=== Completado ===")
