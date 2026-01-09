from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class CourseType(str, enum.Enum):
    """Tipo de curso"""
    THEORY = "theory"
    PRACTICE = "practice"
    LAB = "lab"
    THEORY_PRACTICE = "theory_practice"


# Tabla intermedia para prerrequisitos
course_prerequisites = Table(
    'course_prerequisites',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id')),
    Column('prerequisite_id', Integer, ForeignKey('courses.id'))
)


class Course(Base):
    """Modelo de curso"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    cycle = Column(Integer, nullable=False)  # 1-10
    credits = Column(Float, nullable=False)
    theory_hours = Column(Integer, default=0)
    practice_hours = Column(Integer, default=0)
    course_type = Column(SQLEnum(CourseType), nullable=False)

    # Relaciones
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=True)
    teacher = relationship("Teacher", back_populates="courses")

    # Prerrequisitos (autorreferencia)
    prerequisites = relationship(
        "Course",
        secondary=course_prerequisites,
        primaryjoin=(course_prerequisites.c.course_id == id),
        secondaryjoin=(course_prerequisites.c.prerequisite_id == id),
        backref="dependent_courses"
    )

    # Relación con horarios
    schedule_slots = relationship("ScheduleSlot", back_populates="course")
