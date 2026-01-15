"""
Tests unitarios para el Algoritmo Genético de planificación de horarios
"""
import pytest
from app.algorithms.genetic_algorithm import ScheduleGeneticAlgorithm
from app.models.course import Course, CourseType
from app.models.teacher import Teacher
from app.models.classroom import Classroom, ClassroomType


class MockCourse:
    """Mock de Course para testing"""
    def __init__(self, id, code, name, theory_hours, practice_hours, teacher_id):
        self.id = id
        self.code = code
        self.name = name
        self.theory_hours = theory_hours
        self.practice_hours = practice_hours
        self.teacher_id = teacher_id


class MockTeacher:
    """Mock de Teacher para testing"""
    def __init__(self, id, user_id, employee_code):
        self.id = id
        self.user_id = user_id
        self.employee_code = employee_code


class MockClassroom:
    """Mock de Classroom para testing"""
    def __init__(self, id, code, name, capacity, classroom_type):
        self.id = id
        self.code = code
        self.name = name
        self.capacity = capacity
        self.classroom_type = classroom_type


@pytest.fixture
def sample_courses():
    """Fixture con cursos de ejemplo"""
    return [
        MockCourse(1, "ING001", "Ingeniería de Software I", 4, 2, 1),
        MockCourse(2, "MAT101", "Matemática Discreta", 4, 0, 2),
        MockCourse(3, "PRG201", "Programación Avanzada", 2, 4, 1),
    ]


@pytest.fixture
def sample_teachers():
    """Fixture con docentes de ejemplo"""
    return [
        MockTeacher(1, 1, "DOC001"),
        MockTeacher(2, 2, "DOC002"),
    ]


@pytest.fixture
def sample_classrooms():
    """Fixture con aulas de ejemplo"""
    return [
        MockClassroom(1, "A101", "Aula 101", 30, ClassroomType.THEORY),
        MockClassroom(2, "L201", "Laboratorio 201", 25, ClassroomType.LAB),
        MockClassroom(3, "A102", "Aula 102", 35, ClassroomType.THEORY),
    ]


@pytest.fixture
def sample_availability():
    """Fixture con disponibilidad de docentes"""
    return {
        1: [  # Docente 1 disponible lunes a viernes 7:00-17:00
            {'day_of_week': day, 'start_time': '07:00', 'end_time': '17:00'}
            for day in range(5)
        ],
        2: [  # Docente 2 disponible lunes, miércoles, viernes 9:00-15:00
            {'day_of_week': 0, 'start_time': '09:00', 'end_time': '15:00'},
            {'day_of_week': 2, 'start_time': '09:00', 'end_time': '15:00'},
            {'day_of_week': 4, 'start_time': '09:00', 'end_time': '15:00'},
        ]
    }


@pytest.fixture
def ga_instance(sample_courses, sample_teachers, sample_classrooms, sample_availability):
    """Fixture con una instancia del algoritmo genético"""
    return ScheduleGeneticAlgorithm(
        courses=sample_courses,
        teachers=sample_teachers,
        classrooms=sample_classrooms,
        teacher_availability=sample_availability
    )


class TestScheduleGeneticAlgorithm:
    """Tests para el algoritmo genético"""

    def test_initialization(self, ga_instance):
        """Test: El algoritmo se inicializa correctamente"""
        assert ga_instance is not None
        assert len(ga_instance.courses) == 3
        assert len(ga_instance.teachers) == 2
        assert len(ga_instance.classrooms) == 3
        assert len(ga_instance.days) == 5  # Lunes a Viernes
        assert len(ga_instance.time_slots) == 7  # 7:00-21:00 en bloques de 2h

    def test_time_slots_generation(self, ga_instance):
        """Test: Las franjas horarias se generan correctamente"""
        time_slots = ga_instance.time_slots

        # Verificar que hay 7 franjas (7-9, 9-11, 11-13, 13-15, 15-17, 17-19, 19-21)
        assert len(time_slots) == 7

        # Verificar formato de la primera franja
        assert time_slots[0] == ('07:00', '09:00')

        # Verificar formato de la última franja
        assert time_slots[-1] == ('19:00', '21:00')

    def test_create_individual(self, ga_instance):
        """Test: Se crea un individuo (horario) válido"""
        individual = ga_instance._create_individual()

        # Verificar que el individuo no está vacío
        assert len(individual) > 0

        # Verificar que cada gen tiene la estructura correcta
        for gene in individual:
            assert 'course_id' in gene
            assert 'teacher_id' in gene
            assert 'classroom_id' in gene
            assert 'day' in gene
            assert 'time_slot' in gene
            assert 'start_time' in gene
            assert 'end_time' in gene

            # Verificar rangos válidos
            assert 0 <= gene['day'] <= 4  # Lunes (0) a Viernes (4)
            assert 0 <= gene['time_slot'] < len(ga_instance.time_slots)

    def test_calculate_total_sessions(self, ga_instance):
        """Test: Se calculan correctamente las sesiones necesarias"""
        individual = ga_instance._create_individual()

        # Curso 1: 4h teoría + 2h práctica = 6h = 3 sesiones de 2h
        # Curso 2: 4h teoría = 2 sesiones de 2h
        # Curso 3: 2h teoría + 4h práctica = 6h = 3 sesiones de 2h
        # Total esperado: 3 + 2 + 3 = 8 sesiones

        expected_sessions = 8
        assert len(individual) == expected_sessions

    def test_fitness_no_conflicts(self, ga_instance):
        """Test: Fitness de un horario sin conflictos"""
        # Crear un individuo manualmente sin conflictos
        individual = [
            {
                'course_id': 1,
                'teacher_id': 1,
                'classroom_id': 1,
                'day': 0,  # Lunes
                'time_slot': 0,  # 7:00-9:00
                'start_time': '07:00',
                'end_time': '09:00'
            },
            {
                'course_id': 2,
                'teacher_id': 2,
                'classroom_id': 2,
                'day': 0,  # Lunes
                'time_slot': 0,  # 7:00-9:00 (diferente docente y aula)
                'start_time': '07:00',
                'end_time': '09:00'
            }
        ]

        fitness = ga_instance._evaluate_fitness(individual)

        # El fitness debe ser bajo (sin conflictos graves)
        # Puede tener penalizaciones blandas pero no duras
        assert fitness[0] < 100  # Menos de 100 = no hay violaciones duras críticas

    def test_fitness_teacher_conflict(self, ga_instance):
        """Test: Fitness penaliza cuando un docente está en dos lugares al mismo tiempo"""
        # Crear conflicto: mismo docente, mismo día, misma hora, diferente aula
        individual = [
            {
                'course_id': 1,
                'teacher_id': 1,
                'classroom_id': 1,
                'day': 0,
                'time_slot': 0,
                'start_time': '07:00',
                'end_time': '09:00'
            },
            {
                'course_id': 3,
                'teacher_id': 1,  # Mismo docente
                'classroom_id': 2,
                'day': 0,  # Mismo día
                'time_slot': 0,  # Misma hora
                'start_time': '07:00',
                'end_time': '09:00'
            }
        ]

        fitness = ga_instance._evaluate_fitness(individual)

        # Debe haber penalización alta (100 puntos por conflicto duro)
        assert fitness[0] >= 100

    def test_fitness_classroom_conflict(self, ga_instance):
        """Test: Fitness penaliza cuando un aula tiene dos clases simultáneas"""
        # Crear conflicto: misma aula, mismo día, misma hora
        individual = [
            {
                'course_id': 1,
                'teacher_id': 1,
                'classroom_id': 1,  # Misma aula
                'day': 0,
                'time_slot': 0,
                'start_time': '07:00',
                'end_time': '09:00'
            },
            {
                'course_id': 2,
                'teacher_id': 2,
                'classroom_id': 1,  # Misma aula
                'day': 0,  # Mismo día
                'time_slot': 0,  # Misma hora
                'start_time': '07:00',
                'end_time': '09:00'
            }
        ]

        fitness = ga_instance._evaluate_fitness(individual)

        # Debe haber penalización alta
        assert fitness[0] >= 100

    def test_fitness_teacher_availability(self, ga_instance):
        """Test: Fitness penaliza cuando se asigna fuera de disponibilidad del docente"""
        # Docente 2 NO está disponible los martes (day=1)
        individual = [
            {
                'course_id': 2,
                'teacher_id': 2,
                'classroom_id': 1,
                'day': 1,  # Martes (no disponible)
                'time_slot': 0,
                'start_time': '07:00',
                'end_time': '09:00'
            }
        ]

        fitness = ga_instance._evaluate_fitness(individual)

        # Debe haber penalización (50 puntos)
        assert fitness[0] >= 50

    def test_crossover(self, ga_instance):
        """Test: El operador de cruce funciona correctamente"""
        ind1 = ga_instance._create_individual()
        ind2 = ga_instance._create_individual()

        original_len1 = len(ind1)
        original_len2 = len(ind2)

        # Hacer cruce
        child1, child2 = ga_instance._crossover(ind1, ind2)

        # Los hijos deben mantener el tamaño
        assert len(child1) == original_len1
        assert len(child2) == original_len2

    def test_mutate(self, ga_instance):
        """Test: El operador de mutación funciona correctamente"""
        individual = ga_instance._create_individual()
        original_gene = individual[0].copy()

        # Mutar
        mutated, = ga_instance._mutate(individual)

        # El individuo debe seguir siendo válido
        assert len(mutated) > 0
        for gene in mutated:
            assert 0 <= gene['day'] <= 4
            assert 0 <= gene['time_slot'] < len(ga_instance.time_slots)

    def test_run_algorithm(self, ga_instance):
        """Test: El algoritmo se ejecuta y retorna resultados"""
        # Este test puede tardar unos segundos
        best_individual, best_fitness, statistics = ga_instance.run()

        # Verificar que retorna resultados válidos
        assert best_individual is not None
        assert len(best_individual) > 0
        assert isinstance(best_fitness, (int, float))
        assert isinstance(statistics, dict)

        # Verificar estructura de estadísticas
        assert 'fitness_score' in statistics
        assert 'hard_constraints_violations' in statistics
        assert 'soft_constraints_violations' in statistics
        assert 'generations' in statistics
        assert 'population_size' in statistics
        assert 'algorithm' in statistics

        # El fitness debe ser finito
        assert best_fitness < float('inf')

    def test_soft_constraints_time_gaps(self, ga_instance):
        """Test: Penalización por tiempos muertos entre clases"""
        # Crear horario con hueco grande para un docente
        individual = [
            {
                'course_id': 1,
                'teacher_id': 1,
                'classroom_id': 1,
                'day': 0,
                'time_slot': 0,  # 7:00-9:00
                'start_time': '07:00',
                'end_time': '09:00'
            },
            {
                'course_id': 3,
                'teacher_id': 1,  # Mismo docente
                'classroom_id': 1,
                'day': 0,  # Mismo día
                'time_slot': 3,  # 13:00-15:00 (hueco de 4 horas)
                'start_time': '13:00',
                'end_time': '15:00'
            }
        ]

        fitness_with_gap = ga_instance._evaluate_fitness(individual)

        # Crear horario sin hueco
        individual_no_gap = [
            {
                'course_id': 1,
                'teacher_id': 1,
                'classroom_id': 1,
                'day': 0,
                'time_slot': 0,  # 7:00-9:00
                'start_time': '07:00',
                'end_time': '09:00'
            },
            {
                'course_id': 3,
                'teacher_id': 1,
                'classroom_id': 1,
                'day': 0,
                'time_slot': 1,  # 9:00-11:00 (consecutivo)
                'start_time': '09:00',
                'end_time': '11:00'
            }
        ]

        fitness_no_gap = ga_instance._evaluate_fitness(individual_no_gap)

        # El horario con hueco debe tener peor fitness
        assert fitness_with_gap[0] > fitness_no_gap[0]

    def test_empty_courses(self):
        """Test: Manejo de lista vacía de cursos"""
        ga = ScheduleGeneticAlgorithm(
            courses=[],
            teachers=[MockTeacher(1, 1, "DOC001")],
            classrooms=[MockClassroom(1, "A101", "Aula 101", 30, ClassroomType.THEORY)],
            teacher_availability={1: []}
        )

        individual = ga._create_individual()
        assert len(individual) == 0

    def test_fitness_deterministic(self, ga_instance):
        """Test: La función de fitness es determinística"""
        individual = ga_instance._create_individual()

        fitness1 = ga_instance._evaluate_fitness(individual)
        fitness2 = ga_instance._evaluate_fitness(individual)

        # El mismo individuo debe dar el mismo fitness
        assert fitness1[0] == fitness2[0]
