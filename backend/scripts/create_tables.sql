-- Crear tablas del sistema de horarios

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT true
);

-- Tabla de docentes
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    employee_code VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    max_weekly_hours INTEGER DEFAULT 20
);

-- Tabla de disponibilidad de docentes
CREATE TABLE IF NOT EXISTS teacher_availability (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    day_of_week INTEGER NOT NULL,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    is_available BOOLEAN DEFAULT true
);

-- Tabla de aulas
CREATE TABLE IF NOT EXISTS classrooms (
    id SERIAL PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    building VARCHAR NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    classroom_type VARCHAR NOT NULL,
    equipment VARCHAR,
    is_available BOOLEAN DEFAULT true
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    cycle INTEGER NOT NULL,
    credits FLOAT NOT NULL,
    theory_hours INTEGER NOT NULL,
    practice_hours INTEGER NOT NULL,
    course_type VARCHAR NOT NULL,
    teacher_id INTEGER REFERENCES teachers(id),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    academic_year VARCHAR NOT NULL,
    period VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'draft',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fitness_score FLOAT,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de slots de horario
CREATE TABLE IF NOT EXISTS schedule_slots (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    teacher_id INTEGER NOT NULL REFERENCES teachers(id),
    classroom_id INTEGER NOT NULL REFERENCES classrooms(id),
    day_of_week INTEGER NOT NULL,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    session_type VARCHAR NOT NULL
);

-- Tabla intermedia para especialidades de docentes
CREATE TABLE IF NOT EXISTS teacher_specialties (
    teacher_id INTEGER REFERENCES teachers(id),
    specialty VARCHAR
);

-- Insertar usuario admin
INSERT INTO users (email, username, full_name, hashed_password, role, is_active)
VALUES (
    'admin@universidad.edu',
    'admin',
    'Administrador del Sistema',
    '$2b$12$InJVHj21ofTfslKoxzyRXeKstSSbPVTT29qaETNQb23LAtG6QciJO',
    'super_admin',
    true
) ON CONFLICT (username) DO NOTHING;
