from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.schedule import ScheduleStatus


class ScheduleSlotBase(BaseModel):
    course_id: int
    teacher_id: int
    classroom_id: int
    day_of_week: int
    start_time: str
    end_time: str
    session_type: Optional[str] = None
    group: Optional[str] = None

    @field_validator('session_type', 'group', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class ScheduleSlotCreate(ScheduleSlotBase):
    schedule_id: int


class ScheduleSlot(ScheduleSlotBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True


class ScheduleSlotDetail(ScheduleSlot):
    course: Optional[dict] = None
    teacher: Optional[dict] = None
    classroom: Optional[dict] = None


class ScheduleBase(BaseModel):
    name: str
    semester: str
    year: int

    @field_validator('name', 'semester', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    semester: Optional[str] = None
    year: Optional[int] = None
    status: Optional[ScheduleStatus] = None

    @field_validator('name', 'semester', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class Schedule(ScheduleBase):
    id: int
    status: ScheduleStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    fitness_score: Optional[float] = None
    hard_constraints_violations: int = 0
    soft_constraints_violations: int = 0
    algorithm_config: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ScheduleDetail(Schedule):
    slots: List[ScheduleSlotDetail] = []


class ScheduleGenerateRequest(BaseModel):
    """Request para generar horario automáticamente"""
    name: str
    semester: str
    year: int
    algorithm: str = "genetic_algorithm"  # genetic_algorithm, simulated_annealing, tabu_search
    config: Optional[Dict[str, Any]] = None

    @field_validator('name', 'semester', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class ScheduleGenerateResponse(BaseModel):
    """Response de generación de horario"""
    schedule_id: int
    fitness_score: float
    hard_constraints_violations: int
    soft_constraints_violations: int
    total_slots: int
    generation_time: float
    message: str
