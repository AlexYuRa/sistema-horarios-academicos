from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole

    @field_validator('username', 'full_name', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """
        Validar fortaleza de contraseña:
        - Mínimo 8 caracteres
        - Al menos una letra mayúscula
        - Al menos una letra minúscula
        - Al menos un número
        """
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')

        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')

        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')

        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')

        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator('username', 'full_name', mode='before')
    @classmethod
    def to_uppercase(cls, v):
        if v is not None and isinstance(v, str):
            return v.upper()
        return v


class UserInDB(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class User(UserInDB):
    pass


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
