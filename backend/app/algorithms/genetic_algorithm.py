"""
Algoritmo Genético para la planificación de horarios académicos
Utiliza DEAP (Distributed Evolutionary Algorithms in Python)
"""
import random
from typing import List, Tuple, Dict, Any
from deap import base, creator, tools, algorithms
import numpy as np
from datetime import datetime, timedelta

from app.models.course import Course
from app.models.teacher import Teacher, TeacherAvailability
from app.models.classroom import Classroom
from app.core.config import settings


class ScheduleGeneticAlgorithm:
    """Algoritmo genético para generar horarios óptimos"""

    def __init__(self, courses: List[Course], teachers: List[Teacher],
                 classrooms: List[Classroom], teacher_availability: Dict):
        self.courses = courses
        self.teachers = teachers
        self.classrooms = classrooms
        self.teacher_availability = teacher_availability

        # Franjas horarias (Lunes a Viernes, 7:00-21:00)
        self.time_slots = self._generate_time_slots()
        self.days = [0, 1, 2, 3, 4]  # Lunes a Viernes

        # Configurar DEAP
        self._setup_deap()

    def _generate_time_slots(self) -> List[str]:
        """Generar franjas horarias de 2 horas"""
        slots = []
        start_hour = 7
        end_hour = 21
        slot_duration = 2

        for hour in range(start_hour, end_hour, slot_duration):
            start = f"{hour:02d}:00"
            end = f"{(hour + slot_duration):02d}:00"
            slots.append((start, end))

        return slots

    def _setup_deap(self):
        """Configurar DEAP para el algoritmo genético"""
        # Crear tipos de fitness y individuos
        if not hasattr(creator, "FitnessMin"):
            creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
        if not hasattr(creator, "Individual"):
            creator.create("Individual", list, fitness=creator.FitnessMin)

        self.toolbox = base.Toolbox()

        # Registrar operadores
        self.toolbox.register("individual", self._create_individual)
        self.toolbox.register("population", tools.initRepeat, list, self.toolbox.individual)
        self.toolbox.register("evaluate", self._evaluate_fitness)
        self.toolbox.register("mate", self._crossover)
        self.toolbox.register("mutate", self._mutate)
        self.toolbox.register("select", tools.selTournament, tournsize=3)

    def _create_individual(self) -> Any:
        """Crear un individuo (horario completo) aleatorio"""
        individual = []

        for course in self.courses:
            # Calcular horas necesarias
            total_hours = course.theory_hours + course.practice_hours
            sessions_needed = (total_hours + 1) // 2  # Sesiones de 2 horas

            for _ in range(sessions_needed):
                # Asignar aleatoriamente: día, franja horaria, aula
                day = random.choice(self.days)
                time_slot_idx = random.randint(0, len(self.time_slots) - 1)
                classroom = random.choice(self.classrooms)

                gene = {
                    'course_id': course.id,
                    'teacher_id': course.teacher_id,
                    'classroom_id': classroom.id,
                    'day': day,
                    'time_slot': time_slot_idx,
                    'start_time': self.time_slots[time_slot_idx][0],
                    'end_time': self.time_slots[time_slot_idx][1]
                }
                individual.append(gene)

        return creator.Individual(individual)

    def _evaluate_fitness(self, individual: List[Dict]) -> Tuple[float]:
        """
        Evaluar la calidad de un horario
        Menor fitness = mejor solución
        """
        hard_violations = 0
        soft_violations = 0

        # RESTRICCIONES DURAS (obligatorias)

        # 1. Un docente no puede estar en dos lugares al mismo tiempo
        teacher_schedule = {}
        for gene in individual:
            key = (gene['teacher_id'], gene['day'], gene['time_slot'])
            if key in teacher_schedule:
                hard_violations += 100  # Penalización alta
            else:
                teacher_schedule[key] = gene

        # 2. Un aula no puede tener dos clases simultáneas
        classroom_schedule = {}
        for gene in individual:
            key = (gene['classroom_id'], gene['day'], gene['time_slot'])
            if key in classroom_schedule:
                hard_violations += 100
            else:
                classroom_schedule[key] = gene

        # 3. Validar disponibilidad del docente
        for gene in individual:
            teacher_id = gene['teacher_id']
            day = gene['day']
            start_time = gene['start_time']

            if teacher_id in self.teacher_availability:
                availability = self.teacher_availability[teacher_id]
                is_available = any(
                    avail['day_of_week'] == day and
                    avail['start_time'] <= start_time < avail['end_time']
                    for avail in availability
                )
                if not is_available:
                    hard_violations += 50

        # RESTRICCIONES BLANDAS (preferencias)

        # 1. Minimizar tiempos muertos entre clases del mismo docente
        for teacher_id in set(gene['teacher_id'] for gene in individual):
            teacher_genes = [g for g in individual if g['teacher_id'] == teacher_id]

            for day in self.days:
                day_slots = sorted([g['time_slot'] for g in teacher_genes if g['day'] == day])

                if len(day_slots) > 1:
                    # Penalizar si hay huecos entre clases
                    for i in range(len(day_slots) - 1):
                        gap = day_slots[i + 1] - day_slots[i]
                        if gap > 1:
                            soft_violations += (gap - 1) * 5

        # 2. Distribución equilibrada de carga semanal
        for teacher_id in set(gene['teacher_id'] for gene in individual):
            teacher_genes = [g for g in individual if g['teacher_id'] == teacher_id]
            daily_distribution = [len([g for g in teacher_genes if g['day'] == d]) for d in self.days]

            # Penalizar distribución desigual
            std_dev = np.std(daily_distribution)
            soft_violations += int(std_dev * 3)

        # 3. Preferir horarios matutinos (7-13h) sobre vespertinos
        afternoon_sessions = len([g for g in individual if int(g['start_time'].split(':')[0]) >= 13])
        soft_violations += afternoon_sessions * 1

        # Fitness total (menor es mejor)
        fitness = hard_violations + (soft_violations * 0.1)

        return (fitness,)

    def _crossover(self, ind1: List[Dict], ind2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Operador de cruce de un punto"""
        if len(ind1) > 1 and len(ind2) > 1:
            point = random.randint(1, min(len(ind1), len(ind2)) - 1)
            ind1[point:], ind2[point:] = ind2[point:], ind1[point:]

        return ind1, ind2

    def _mutate(self, individual: List[Dict]) -> Tuple[List[Dict]]:
        """Operador de mutación"""
        if len(individual) > 0:
            # Seleccionar un gen aleatorio para mutar
            idx = random.randint(0, len(individual) - 1)
            gene = individual[idx]

            # Mutar aleatoriamente uno de los atributos
            mutation_type = random.choice(['day', 'time', 'classroom'])

            if mutation_type == 'day':
                gene['day'] = random.choice(self.days)
            elif mutation_type == 'time':
                time_slot_idx = random.randint(0, len(self.time_slots) - 1)
                gene['time_slot'] = time_slot_idx
                gene['start_time'] = self.time_slots[time_slot_idx][0]
                gene['end_time'] = self.time_slots[time_slot_idx][1]
            elif mutation_type == 'classroom':
                gene['classroom_id'] = random.choice(self.classrooms).id

        return (individual,)

    def run(self) -> Tuple[List[Dict], float, Dict]:
        """
        Ejecutar el algoritmo genético

        Returns:
            Tuple con: mejor horario, fitness score, estadísticas
        """
        # Crear población inicial
        population = self.toolbox.population(n=settings.GA_POPULATION_SIZE)

        # Estadísticas
        stats = tools.Statistics(lambda ind: ind.fitness.values)
        stats.register("avg", np.mean)
        stats.register("min", np.min)
        stats.register("max", np.max)

        # Ejecutar algoritmo genético
        population, logbook = algorithms.eaSimple(
            population,
            self.toolbox,
            cxpb=settings.GA_CROSSOVER_PROB,
            mutpb=settings.GA_MUTATION_PROB,
            ngen=settings.GA_MAX_GENERATIONS,
            stats=stats,
            verbose=False
        )

        # Obtener mejor individuo
        best_individual = tools.selBest(population, k=1)[0]
        best_fitness = best_individual.fitness.values[0]

        # Calcular violaciones
        hard_violations = int(best_fitness // 100)
        soft_violations = int((best_fitness % 100) / 0.1)

        statistics = {
            'fitness_score': best_fitness,
            'hard_constraints_violations': hard_violations,
            'soft_constraints_violations': soft_violations,
            'generations': settings.GA_MAX_GENERATIONS,
            'population_size': settings.GA_POPULATION_SIZE,
            'algorithm': 'genetic_algorithm',
            'logbook': logbook
        }

        return best_individual, best_fitness, statistics
