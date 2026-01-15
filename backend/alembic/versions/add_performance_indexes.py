"""Add performance indexes

Revision ID: add_performance_indexes
Revises:
Create Date: 2025-01-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = None  # Cambiar al ID de tu última migración
branch_labels = None
depends_on = None


def upgrade():
    """
    Agregar índices para mejorar el rendimiento de queries comunes
    """

    # Índices para schedules
    # Query común: filtrar por semestre y estado
    op.create_index(
        'idx_schedules_semester_status',
        'schedules',
        ['semester', 'status']
    )

    # Índice para búsqueda por fecha de creación (ordenamiento)
    op.create_index(
        'idx_schedules_created_at',
        'schedules',
        ['created_at']
    )

    # Índices para schedule_slots
    # Query común: obtener slots de un horario específico
    # (Ya debería existir por FK, pero aseguramos)
    op.create_index(
        'idx_schedule_slots_schedule_id',
        'schedule_slots',
        ['schedule_id'],
        unique=False
    )

    # Query común: buscar por día y hora para validar conflictos
    op.create_index(
        'idx_schedule_slots_day_time',
        'schedule_slots',
        ['day_of_week', 'start_time', 'end_time']
    )

    # Query común: obtener horario de un docente específico
    op.create_index(
        'idx_schedule_slots_teacher',
        'schedule_slots',
        ['teacher_id', 'day_of_week']
    )

    # Query común: obtener uso de aulas
    op.create_index(
        'idx_schedule_slots_classroom',
        'schedule_slots',
        ['classroom_id', 'day_of_week']
    )

    # Índices para teacher_availability
    # Query común: obtener disponibilidad de un docente
    op.create_index(
        'idx_teacher_availability_teacher_day',
        'teacher_availability',
        ['teacher_id', 'day_of_week', 'is_available']
    )

    # Índices para courses
    # Query común: filtrar cursos por ciclo
    op.create_index(
        'idx_courses_cycle',
        'courses',
        ['cycle']
    )

    # Query común: obtener cursos de un docente
    op.create_index(
        'idx_courses_teacher',
        'courses',
        ['teacher_id']
    )

    # Índices para classrooms
    # Query común: filtrar aulas disponibles por tipo
    op.create_index(
        'idx_classrooms_type_available',
        'classrooms',
        ['classroom_type', 'is_available']
    )


def downgrade():
    """
    Eliminar índices creados
    """

    # Eliminar en orden inverso
    op.drop_index('idx_classrooms_type_available', table_name='classrooms')
    op.drop_index('idx_courses_teacher', table_name='courses')
    op.drop_index('idx_courses_cycle', table_name='courses')
    op.drop_index('idx_teacher_availability_teacher_day', table_name='teacher_availability')
    op.drop_index('idx_schedule_slots_classroom', table_name='schedule_slots')
    op.drop_index('idx_schedule_slots_teacher', table_name='schedule_slots')
    op.drop_index('idx_schedule_slots_day_time', table_name='schedule_slots')
    op.drop_index('idx_schedule_slots_schedule_id', table_name='schedule_slots')
    op.drop_index('idx_schedules_created_at', table_name='schedules')
    op.drop_index('idx_schedules_semester_status', table_name='schedules')
