from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.teacher import Teacher, TeacherAvailability
from app.models.user import User, UserRole
from app.core.security import get_password_hash, get_current_active_user
from pydantic import BaseModel, EmailStr, field_validator

router = APIRouter()


# Pydantic schemas
class TeacherCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str
    employee_code: str
    phone: Optional[str] = None
    max_weekly_hours: int = 20
    specialties: Optional[List[str]] = None

    @field_validator('username', 'full_name', 'employee_code', 'phone', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v

    @field_validator('specialties', mode='before')
    @classmethod
    def specialties_to_uppercase(cls, v):
        if v is not None and isinstance(v, list):
            return [item.upper() if isinstance(item, str) else item for item in v]
        return v


class TeacherUpdate(BaseModel):
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    max_weekly_hours: Optional[int] = None
    specialties: Optional[List[str]] = None

    @field_validator('employee_code', 'phone', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v

    @field_validator('specialties', mode='before')
    @classmethod
    def specialties_to_uppercase(cls, v):
        if v is not None and isinstance(v, list):
            return [item.upper() if isinstance(item, str) else item for item in v]
        return v


class TeacherResponse(BaseModel):
    id: int
    user_id: int
    employee_code: str
    phone: Optional[str]
    max_weekly_hours: int
    availability: Optional[List[dict]] = []

    class Config:
        from_attributes = True


class TeacherAvailabilitySchema(BaseModel):
    id: Optional[int] = None
    teacher_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True

    class Config:
        from_attributes = True


class UpdateAvailabilityRequest(BaseModel):
    availabilities: List[TeacherAvailabilitySchema]


@router.get("", response_model=List[TeacherResponse])
def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener lista de docentes"""
    teachers = db.query(Teacher).offset(skip).limit(limit).all()

    # Formatear la respuesta incluyendo availability
    result = []
    for teacher in teachers:
        teacher_dict = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "employee_code": teacher.employee_code,
            "phone": teacher.phone,
            "max_weekly_hours": teacher.max_weekly_hours,
            "availability": [
                {
                    "id": avail.id,
                    "teacher_id": avail.teacher_id,
                    "day_of_week": avail.day_of_week,
                    "start_time": avail.start_time,
                    "end_time": avail.end_time,
                    "is_available": avail.is_available
                }
                for avail in teacher.availability
            ] if teacher.availability else []
        }
        result.append(teacher_dict)

    return result


@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """Obtener un docente por ID"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    # Formatear respuesta con availability
    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "employee_code": teacher.employee_code,
        "phone": teacher.phone,
        "max_weekly_hours": teacher.max_weekly_hours,
        "availability": [
            {
                "id": avail.id,
                "teacher_id": avail.teacher_id,
                "day_of_week": avail.day_of_week,
                "start_time": avail.start_time,
                "end_time": avail.end_time,
                "is_available": avail.is_available
            }
            for avail in teacher.availability
        ] if teacher.availability else []
    }


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    """Crear un nuevo docente"""
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(
        (User.email == teacher_data.email) | (User.username == teacher_data.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email o username ya existe"
        )

    # Crear usuario
    user = User(
        email=teacher_data.email,
        username=teacher_data.username,
        full_name=teacher_data.full_name,
        hashed_password=get_password_hash(teacher_data.password),
        role=UserRole.TEACHER,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Crear docente
    teacher = Teacher(
        user_id=user.id,
        employee_code=teacher_data.employee_code,
        phone=teacher_data.phone,
        max_weekly_hours=teacher_data.max_weekly_hours
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "employee_code": teacher.employee_code,
        "phone": teacher.phone,
        "max_weekly_hours": teacher.max_weekly_hours,
        "availability": []
    }


@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    teacher_id: int,
    teacher_data: TeacherUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un docente"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    # Actualizar campos
    if teacher_data.employee_code is not None:
        teacher.employee_code = teacher_data.employee_code
    if teacher_data.phone is not None:
        teacher.phone = teacher_data.phone
    if teacher_data.max_weekly_hours is not None:
        teacher.max_weekly_hours = teacher_data.max_weekly_hours

    db.commit()
    db.refresh(teacher)

    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "employee_code": teacher.employee_code,
        "phone": teacher.phone,
        "max_weekly_hours": teacher.max_weekly_hours,
        "availability": [
            {
                "id": avail.id,
                "teacher_id": avail.teacher_id,
                "day_of_week": avail.day_of_week,
                "start_time": avail.start_time,
                "end_time": avail.end_time,
                "is_available": avail.is_available
            }
            for avail in teacher.availability
        ] if teacher.availability else []
    }


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """Eliminar un docente"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    # Eliminar también el usuario asociado
    user = db.query(User).filter(User.id == teacher.user_id).first()
    if user:
        db.delete(user)

    db.delete(teacher)
    db.commit()
    return None


@router.put("/{teacher_id}/availability", status_code=status.HTTP_200_OK)
def update_teacher_availability(
    teacher_id: int,
    request: UpdateAvailabilityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Actualizar disponibilidad horaria de un docente"""
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    # Verificar permisos: solo el mismo teacher o admins pueden editar
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.COORDINATOR]
    is_own_profile = teacher.user_id == current_user.id

    if not (is_admin or is_own_profile):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar esta disponibilidad"
        )

    # Eliminar disponibilidades existentes
    db.query(TeacherAvailability).filter(
        TeacherAvailability.teacher_id == teacher_id
    ).delete()

    # Crear nuevas disponibilidades
    for avail_data in request.availabilities:
        availability = TeacherAvailability(
            teacher_id=teacher_id,
            day_of_week=avail_data.day_of_week,
            start_time=avail_data.start_time,
            end_time=avail_data.end_time,
            is_available=avail_data.is_available
        )
        db.add(availability)

    db.commit()

    return {"message": "Disponibilidad actualizada exitosamente", "count": len(request.availabilities)}
