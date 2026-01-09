from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.classroom import Classroom, ClassroomType
from pydantic import BaseModel, field_validator

router = APIRouter()


# Pydantic schemas
class ClassroomCreate(BaseModel):
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


class ClassroomResponse(BaseModel):
    id: int
    code: str
    name: str
    building: Optional[str]
    floor: Optional[int]
    capacity: int
    classroom_type: ClassroomType
    equipment: Optional[str]
    is_available: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(
    skip: int = 0,
    limit: int = 100,
    classroom_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener lista de aulas"""
    query = db.query(Classroom)

    if classroom_type:
        query = query.filter(Classroom.classroom_type == classroom_type)

    classrooms = query.offset(skip).limit(limit).all()
    return classrooms


@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """Obtener un aula por ID"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aula no encontrada"
        )
    return classroom


@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(classroom_data: ClassroomCreate, db: Session = Depends(get_db)):
    """Crear una nueva aula"""
    # Verificar si el código ya existe
    existing = db.query(Classroom).filter(Classroom.code == classroom_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de aula ya existe"
        )

    classroom = Classroom(**classroom_data.dict())
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


@router.put("/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(
    classroom_id: int,
    classroom_data: ClassroomUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un aula"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aula no encontrada"
        )

    # Actualizar campos
    update_data = classroom_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classroom, field, value)

    db.commit()
    db.refresh(classroom)
    return classroom


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """Eliminar un aula"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aula no encontrada"
        )

    db.delete(classroom)
    db.commit()
    return None
