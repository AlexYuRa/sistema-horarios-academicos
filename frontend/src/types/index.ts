// Tipos de usuario y autenticación
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COORDINATOR = 'coordinator',
  ASSISTANT = 'assistant',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Tipos de cursos
export enum CourseType {
  THEORY = 'theory',
  PRACTICE = 'practice',
  LAB = 'lab',
  THEORY_PRACTICE = 'theory_practice',
}

export interface Course {
  id: number;
  code: string;
  name: string;
  cycle: number;
  credits: number;
  theory_hours: number;
  practice_hours: number;
  course_type: CourseType;
  teacher_id?: number;
}

export interface CourseCreate {
  code: string;
  name: string;
  cycle: number;
  credits: number;
  theory_hours: number;
  practice_hours: number;
  course_type: CourseType;
  teacher_id?: number;
  prerequisite_ids?: number[];
}

// Tipos de aulas
export enum ClassroomType {
  THEORY = 'theory',
  PRACTICE = 'practice',
  LAB = 'lab',
  AUDITORIUM = 'auditorium',
}

export interface Classroom {
  id: number;
  code: string;
  name: string;
  building?: string;
  floor?: number;
  capacity: number;
  classroom_type: ClassroomType;
  equipment?: string;
  is_available: boolean;
}

export interface ClassroomCreate {
  code: string;
  name: string;
  building?: string;
  floor?: number;
  capacity: number;
  classroom_type: ClassroomType;
  equipment?: string;
  is_available?: boolean;
}

// Tipos de docentes
export interface TeacherAvailability {
  id: number;
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface Teacher {
  id: number;
  user_id: number;
  employee_code: string;
  full_name?: string;
  phone?: string;
  max_weekly_hours: number;
  availability?: TeacherAvailability[];
}

// Tipos de horarios
export enum ScheduleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ScheduleSlot {
  id: number;
  schedule_id: number;
  course_id: number;
  teacher_id: number;
  classroom_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  session_type?: string;
  group?: string;
  course?: Course;
  teacher?: Teacher;
  classroom?: Classroom;
}

export interface Schedule {
  id: number;
  name: string;
  semester: string;
  year: number;
  status: ScheduleStatus;
  created_at: string;
  updated_at?: string;
  created_by?: number;
  fitness_score?: number;
  hard_constraints_violations: number;
  soft_constraints_violations: number;
  algorithm_config?: any;
  slots?: ScheduleSlot[];
}

export interface ScheduleGenerateRequest {
  name: string;
  semester: string;
  year: number;
  algorithm?: string;
  config?: any;
}

export interface ScheduleGenerateResponse {
  schedule_id: number;
  fitness_score: number;
  hard_constraints_violations: number;
  soft_constraints_violations: number;
  total_slots: number;
  generation_time: number;
  message: string;
}

// Utilidades
export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const TIME_SLOTS = [
  { start: '07:00', end: '09:00' },
  { start: '09:00', end: '11:00' },
  { start: '11:00', end: '13:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:00', end: '19:00' },
  { start: '19:00', end: '21:00' },
];
