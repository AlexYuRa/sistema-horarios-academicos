from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_active_user, check_role
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.teacher import Teacher
from app.schemas.course import CourseCreate, CourseUpdate, Course as CourseSchema, CourseDetail

router = APIRouter()


@router.get("/", response_model=List[CourseSchema])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    cycle: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener lista de cursos"""
    query = db.query(Course)

    if cycle:
        query = query.filter(Course.cycle == cycle)

    courses = query.offset(skip).limit(limit).all()
    return courses


@router.get("/{course_id}", response_model=CourseDetail)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener curso por ID"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )

    return course


@router.post("/", response_model=CourseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR, UserRole.ASSISTANT]))
):
    """Crear nuevo curso"""
    # Verificar si el código ya existe
    existing_course = db.query(Course).filter(Course.code == course_data.code).first()

    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un curso con ese código"
        )

    # Crear curso
    new_course = Course(
        code=course_data.code,
        name=course_data.name,
        cycle=course_data.cycle,
        credits=course_data.credits,
        theory_hours=course_data.theory_hours,
        practice_hours=course_data.practice_hours,
        course_type=course_data.course_type,
        teacher_id=course_data.teacher_id
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    # Agregar prerrequisitos si existen
    if course_data.prerequisite_ids:
        prerequisites = db.query(Course).filter(Course.id.in_(course_data.prerequisite_ids)).all()
        new_course.prerequisites = prerequisites
        db.commit()

    return new_course


@router.put("/{course_id}", response_model=CourseSchema)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR, UserRole.ASSISTANT]))
):
    """Actualizar curso"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )

    # Actualizar campos
    update_data = course_data.dict(exclude_unset=True)
    prerequisite_ids = update_data.pop('prerequisite_ids', None)

    for field, value in update_data.items():
        setattr(course, field, value)

    # Actualizar prerrequisitos si se proporcionan
    if prerequisite_ids is not None:
        prerequisites = db.query(Course).filter(Course.id.in_(prerequisite_ids)).all()
        course.prerequisites = prerequisites

    db.commit()
    db.refresh(course)

    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.SUPER_ADMIN, UserRole.COORDINATOR]))
):
    """Eliminar curso"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )

    # Verificar si tiene cursos dependientes
    if course.dependent_courses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el curso porque es prerrequisito de otros cursos"
        )

    db.delete(course)
    db.commit()

    return None


@router.post("/{course_id}/assign-self", response_model=CourseSchema)
async def teacher_self_assign(
    course_id: int,
    assign: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.TEACHER]))
):
    """Permite a un docente asignarse o desasignarse de un curso"""
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado"
        )

    # Obtener registro de teacher del usuario actual
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no es docente"
        )

    if assign:
        # Verificar si el curso ya tiene un docente
        if course.teacher_id and course.teacher_id != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El curso ya tiene un docente asignado"
            )
        course.teacher_id = teacher.id
    else:
        # Solo permitir desasignar si son el docente asignado
        if course.teacher_id != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes desasignarte de un curso que no dictas"
            )
        course.teacher_id = None

    db.commit()
    db.refresh(course)

    return course
