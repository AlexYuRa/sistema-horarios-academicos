from pydantic import BaseModel, field_validator
from typing import Optional, List
from app.models.course import CourseType


class CourseBase(BaseModel):
    code: str
    name: str
    cycle: int
    credits: float
    theory_hours: int = 0
    practice_hours: int = 0
    course_type: CourseType

    @field_validator('code', 'name', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class CourseCreate(CourseBase):
    teacher_id: Optional[int] = None
    prerequisite_ids: Optional[List[int]] = []


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    cycle: Optional[int] = None
    credits: Optional[float] = None
    theory_hours: Optional[int] = None
    practice_hours: Optional[int] = None
    course_type: Optional[CourseType] = None
    teacher_id: Optional[int] = None
    prerequisite_ids: Optional[List[int]] = None

    @field_validator('code', 'name', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class Course(CourseBase):
    id: int
    teacher_id: Optional[int] = None

    class Config:
        from_attributes = True


class CourseDetail(Course):
    teacher: Optional[dict] = None
    prerequisites: List[Course] = []
