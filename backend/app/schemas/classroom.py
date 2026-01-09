from pydantic import BaseModel, field_validator
from typing import Optional
from app.models.classroom import ClassroomType


class ClassroomBase(BaseModel):
    code: str
    name: str
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: int
    classroom_type: ClassroomType
    equipment: Optional[str] = None
    is_available: bool = True

    @field_validator('code', 'name', 'building', 'equipment', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    classroom_type: Optional[ClassroomType] = None
    equipment: Optional[str] = None
    is_available: Optional[bool] = None

    @field_validator('code', 'name', 'building', 'equipment', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class Classroom(ClassroomBase):
    id: int

    class Config:
        from_attributes = True
