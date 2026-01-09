from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import time

from app.db.session import get_db
from app.core.security import get_current_active_user, check_role
from app.models.user import User, UserRole
from app.models.schedule import Schedule, ScheduleSlot, ScheduleStatus
from app.models.course import Course
from app.models.teacher import Teacher, TeacherAvailability
from app.models.classroom import Classroom
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, Schedule as ScheduleSchema,
    ScheduleDetail, ScheduleGenerateRequest, ScheduleGenerateResponse,
    ScheduleSlotCreate, ScheduleSlot as ScheduleSlotSchema
)
from app.algorithms.genetic_algorithm import ScheduleGeneticAlgorithm

router = APIRouter()


@router.get("/", response_model=List[ScheduleSchema])
async def get_schedules(
    skip: int = 0,
    limit: int = 100,
    semester: str = None,
    status_filter: ScheduleStatus = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener lista de horarios"""
    query = db.query(Schedule)

    if semester:
        query = query.filter(Schedule.semester == semester)

    if status_filter:
        query = query.filter(Schedule.status == status_filter)

    schedules = query.offset(skip).limit(limit).all()
    return schedules


@router.get("/{schedule_id}", response_model=ScheduleDetail)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener horario por ID con todos sus slots"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    return schedule


@router.post("/generate", response_model=ScheduleGenerateResponse)
async def generate_schedule(
    request: ScheduleGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Generar horario automáticamente usando algoritmos metaheurísticos"""
    start_time = time.time()

    # Obtener todos los cursos
    courses = db.query(Course).filter(Course.teacher_id.isnot(None)).all()

    if not courses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay cursos disponibles para generar horario"
        )

    # Obtener todos los docentes
    teachers = db.query(Teacher).all()

    # Obtener todas las aulas
    classrooms = db.query(Classroom).filter(Classroom.is_available == True).all()

    if not classrooms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay aulas disponibles"
        )

    # Obtener disponibilidad de docentes
    teacher_availability = {}
    for teacher in teachers:
        availability = db.query(TeacherAvailability).filter(
            TeacherAvailability.teacher_id == teacher.id,
            TeacherAvailability.is_available == True
        ).all()

        teacher_availability[teacher.id] = [
            {
                'day_of_week': avail.day_of_week,
                'start_time': avail.start_time,
                'end_time': avail.end_time
            }
            for avail in availability
        ]

    # Ejecutar algoritmo seleccionado
    if request.algorithm == "genetic_algorithm":
        ga = ScheduleGeneticAlgorithm(courses, teachers, classrooms, teacher_availability)
        best_schedule, fitness_score, statistics = ga.run()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Algoritmo '{request.algorithm}' no soportado"
        )

    # Crear horario en la base de datos
    new_schedule = Schedule(
        name=request.name,
        semester=request.semester,
        year=request.year,
        status=ScheduleStatus.DRAFT,
        created_by=current_user.id,
        fitness_score=fitness_score,
        hard_constraints_violations=statistics['hard_constraints_violations'],
        soft_constraints_violations=statistics['soft_constraints_violations'],
        algorithm_config={
            'algorithm': request.algorithm,
            **statistics
        }
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    # Guardar slots del horario
    for gene in best_schedule:
        slot = ScheduleSlot(
            schedule_id=new_schedule.id,
            course_id=gene['course_id'],
            teacher_id=gene['teacher_id'],
            classroom_id=gene['classroom_id'],
            day_of_week=gene['day'],
            start_time=gene['start_time'],
            end_time=gene['end_time']
        )
        db.add(slot)

    db.commit()

    generation_time = time.time() - start_time

    return ScheduleGenerateResponse(
        schedule_id=new_schedule.id,
        fitness_score=fitness_score,
        hard_constraints_violations=statistics['hard_constraints_violations'],
        soft_constraints_violations=statistics['soft_constraints_violations'],
        total_slots=len(best_schedule),
        generation_time=generation_time,
        message="Horario generado exitosamente"
    )


@router.put("/{schedule_id}", response_model=ScheduleSchema)
async def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Actualizar información del horario"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    update_data = schedule_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return schedule


@router.post("/{schedule_id}/publish", response_model=ScheduleSchema)
async def publish_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Publicar horario (cambia estado a PUBLISHED)"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    schedule.status = ScheduleStatus.PUBLISHED
    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Eliminar horario"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )

    db.delete(schedule)
    db.commit()

    return None


@router.put("/{schedule_id}/slots/{slot_id}", response_model=ScheduleSlotSchema)
async def update_schedule_slot(
    schedule_id: int,
    slot_id: int,
    slot_data: ScheduleSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Actualizar un slot específico del horario (para edición manual)"""
    slot = db.query(ScheduleSlot).filter(
        ScheduleSlot.id == slot_id,
        ScheduleSlot.schedule_id == schedule_id
    ).first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot no encontrado"
        )

    # Actualizar slot
    update_data = slot_data.dict(exclude={'schedule_id'})
    for field, value in update_data.items():
        setattr(slot, field, value)

    db.commit()
    db.refresh(slot)

    return slot
