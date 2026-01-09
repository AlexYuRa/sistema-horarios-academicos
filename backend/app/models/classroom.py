from sqlalchemy import Column, Integer, String, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class ClassroomType(str, enum.Enum):
    """Tipo de aula"""
    THEORY = "theory"
    PRACTICE = "practice"
    LAB = "lab"
    AUDITORIUM = "auditorium"


class Classroom(Base):
    """Modelo de aula/laboratorio"""
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    building = Column(String, nullable=True)
    floor = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=False)
    classroom_type = Column(SQLEnum(ClassroomType), nullable=False)
    equipment = Column(String, nullable=True)  # Proyector, computadoras, etc.
    is_available = Column(Boolean, default=True)

    # Relación con horarios
    schedule_slots = relationship("ScheduleSlot", back_populates="classroom")
