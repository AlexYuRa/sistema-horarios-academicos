from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class UserRole(str, enum.Enum):
    """Roles de usuario en el sistema"""
    SUPER_ADMIN = "super_admin"
    COORDINATOR = "coordinator"
    ASSISTANT = "assistant"
    TEACHER = "teacher"
    STUDENT = "student"


class User(Base):
    """Modelo de usuario"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)

    # Relación con docente (si es docente)
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
