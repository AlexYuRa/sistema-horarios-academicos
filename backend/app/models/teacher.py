from sqlalchemy import Column, Integer, String, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


# Tabla intermedia para especialidades de docentes
teacher_specialties = Table(
    'teacher_specialties',
    Base.metadata,
    Column('teacher_id', Integer, ForeignKey('teachers.id')),
    Column('specialty', String)
)


class Teacher(Base):
    """Modelo de docente"""
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    employee_code = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    max_weekly_hours = Column(Integer, default=20)  # Carga académica máxima

    # Relaciones
    user = relationship("User", back_populates="teacher_profile")
    courses = relationship("Course", back_populates="teacher")
    availability = relationship("TeacherAvailability", back_populates="teacher")
    schedule_slots = relationship("ScheduleSlot", back_populates="teacher")


class TeacherAvailability(Base):
    """Disponibilidad horaria de docentes"""
    __tablename__ = "teacher_availability"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Lunes, 6=Domingo
    start_time = Column(String, nullable=False)  # Formato HH:MM
    end_time = Column(String, nullable=False)  # Formato HH:MM
    is_available = Column(Boolean, default=True)

    # Relación
    teacher = relationship("Teacher", back_populates="availability")
