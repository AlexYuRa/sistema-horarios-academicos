from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # Información de la aplicación
    APP_NAME: str = "Sistema de Planificación de Horarios Académicos"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Base de datos
    DATABASE_URL: str
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None

    # Redis (opcional para desarrollo con SQLite)
    REDIS_URL: Optional[str] = None

    # JWT y seguridad
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Algoritmos de optimización
    GA_POPULATION_SIZE: int = 50
    GA_MAX_GENERATIONS: int = 100
    GA_CROSSOVER_PROB: float = 0.8
    GA_MUTATION_PROB: float = 0.2

    # Límites del sistema
    MAX_COURSES: int = 800
    MAX_TEACHERS: int = 150
    MAX_CLASSROOMS: int = 50

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
