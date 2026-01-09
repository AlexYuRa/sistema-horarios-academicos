from pydantic import BaseModel, field_validator
from typing import Optional, List


class TeacherAvailabilityBase(BaseModel):
    day_of_week: int  # 0=Lunes, 6=Domingo
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    is_available: bool = True


class TeacherAvailabilityCreate(TeacherAvailabilityBase):
    pass


class TeacherAvailability(TeacherAvailabilityBase):
    id: int
    teacher_id: int

    class Config:
        from_attributes = True


class TeacherBase(BaseModel):
    employee_code: str
    phone: Optional[str] = None
    max_weekly_hours: int = 20

    @field_validator('employee_code', 'phone', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class TeacherCreate(TeacherBase):
    user_id: int


class TeacherUpdate(BaseModel):
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    max_weekly_hours: Optional[int] = None

    @field_validator('employee_code', 'phone', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class Teacher(TeacherBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class TeacherDetail(Teacher):
    user: Optional[dict] = None
    availability: List[TeacherAvailability] = []
    courses: List[dict] = []
