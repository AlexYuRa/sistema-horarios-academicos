from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class ScheduleStatus(str, enum.Enum):
    """Estado del horario"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Schedule(Base):
    """Modelo de horario general"""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    semester = Column(String, nullable=False)  # Ejemplo: "2025-I"
    year = Column(Integer, nullable=False)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey('users.id'))

    # Métricas de calidad
    fitness_score = Column(Float, nullable=True)
    hard_constraints_violations = Column(Integer, default=0)
    soft_constraints_violations = Column(Integer, default=0)

    # Configuración del algoritmo usado
    algorithm_config = Column(JSON, nullable=True)

    # Relaciones
    slots = relationship("ScheduleSlot", back_populates="schedule", cascade="all, delete-orphan")


class ScheduleSlot(Base):
    """Modelo de slot de horario (asignación específica)"""
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey('schedules.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=False)
    classroom_id = Column(Integer, ForeignKey('classrooms.id'), nullable=False)

    # Tiempo
    day_of_week = Column(Integer, nullable=False)  # 0=Lunes, 6=Domingo
    start_time = Column(String, nullable=False)  # Formato HH:MM
    end_time = Column(String, nullable=False)  # Formato HH:MM

    # Información adicional
    session_type = Column(String, nullable=True)  # Teoría, práctica, laboratorio
    group = Column(String, nullable=True)  # Grupo A, B, etc.

    # Relaciones
    schedule = relationship("Schedule", back_populates="slots")
    course = relationship("Course", back_populates="schedule_slots")
    teacher = relationship("Teacher", back_populates="schedule_slots")
    classroom = relationship("Classroom", back_populates="schedule_slots")


class ScheduleHistory(Base):
    """Historial de cambios en horarios"""
    __tablename__ = "schedule_history"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey('schedules.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE
    changes = Column(JSON, nullable=True)  # Detalle de los cambios
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
