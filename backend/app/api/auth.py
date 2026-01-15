from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

from app.db.session import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.models.user import User
from app.schemas.user import Token, UserCreate, User as UserSchema

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Obtener usuario actual desde el token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


@router.post("/login", response_model=Token,
              summary="Iniciar sesión",
              description="Autentica un usuario y devuelve un token JWT de acceso",
              responses={
                  200: {
                      "description": "Login exitoso",
                      "content": {
                          "application/json": {
                              "example": {
                                  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                  "token_type": "bearer"
                              }
                          }
                      }
                  },
                  401: {
                      "description": "Credenciales inválidas",
                      "content": {
                          "application/json": {
                              "example": {"detail": "Usuario o contraseña incorrectos"}
                          }
                      }
                  },
                  400: {
                      "description": "Usuario inactivo",
                      "content": {
                          "application/json": {
                              "example": {"detail": "Usuario inactivo"}
                          }
                      }
                  }
              })
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autenticar un usuario y obtener un token de acceso JWT.

    **Parámetros:**
    - **username**: Nombre de usuario (se convierte automáticamente a mayúsculas)
    - **password**: Contraseña del usuario

    **Retorna:**
    - **access_token**: Token JWT válido por 30 minutos
    - **token_type**: Tipo de token (siempre "bearer")

    **Ejemplo de uso con curl:**
    ```bash
    curl -X POST "http://localhost:8000/api/auth/login" \\
      -H "Content-Type: application/x-www-form-urlencoded" \\
      -d "username=ADMIN&password=admin123"
    ```

    **Ejemplo de uso con Python requests:**
    ```python
    import requests

    response = requests.post(
        "http://localhost:8000/api/auth/login",
        data={"username": "ADMIN", "password": "admin123"}
    )
    token = response.json()["access_token"]
    ```
    """
    # Convertir el username a mayúsculas para la búsqueda
    username_upper = form_data.username.upper()
    user = db.query(User).filter(User.username == username_upper).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED,
              summary="Registrar nuevo usuario",
              description="Crea un nuevo usuario en el sistema",
              responses={
                  201: {
                      "description": "Usuario creado exitosamente",
                      "content": {
                          "application/json": {
                              "example": {
                                  "id": 1,
                                  "email": "usuario@example.com",
                                  "username": "USUARIO123",
                                  "full_name": "JUAN PÉREZ",
                                  "role": "student",
                                  "is_active": True
                              }
                          }
                      }
                  },
                  400: {
                      "description": "Email o username ya existe, o contraseña débil",
                      "content": {
                          "application/json": {
                              "examples": {
                                  "duplicate": {
                                      "summary": "Usuario duplicado",
                                      "value": {"detail": "El email o nombre de usuario ya está registrado"}
                                  },
                                  "weak_password": {
                                      "summary": "Contraseña débil",
                                      "value": {"detail": ["La contraseña debe tener al menos 8 caracteres"]}
                                  }
                              }
                          }
                      }
                  }
              })
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo usuario en el sistema.

    **Validaciones de contraseña:**
    - Mínimo 8 caracteres
    - Al menos una letra mayúscula
    - Al menos una letra minúscula
    - Al menos un número

    **Roles disponibles:**
    - `super_admin`: Administrador con acceso total
    - `coordinator`: Coordinador académico
    - `assistant`: Asistente
    - `teacher`: Docente
    - `student`: Estudiante

    **Ejemplo de request:**
    ```json
    {
      "email": "docente@unt.edu.pe",
      "username": "JPEREZ",
      "full_name": "JUAN PEREZ GOMEZ",
      "password": "Password123",
      "role": "teacher"
    }
    ```
    """
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email o nombre de usuario ya está registrado"
        )

    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/me", response_model=UserSchema,
             summary="Obtener perfil del usuario actual",
             description="Retorna la información del usuario autenticado",
             responses={
                 200: {
                     "description": "Información del usuario",
                     "content": {
                         "application/json": {
                             "example": {
                                 "id": 1,
                                 "email": "admin@sistema.edu",
                                 "username": "ADMIN",
                                 "full_name": "ADMINISTRADOR DEL SISTEMA",
                                 "role": "super_admin",
                                 "is_active": True
                             }
                         }
                     }
                 },
                 401: {
                     "description": "No autenticado o token inválido"
                 }
             })
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Obtener información del usuario autenticado actual.

    **Requiere:** Token JWT en el header Authorization

    **Header requerido:**
    ```
    Authorization: Bearer <tu_token_jwt>
    ```

    **Ejemplo con curl:**
    ```bash
    curl -X GET "http://localhost:8000/api/auth/me" \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    ```

    **Ejemplo con Python requests:**
    ```python
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("http://localhost:8000/api/auth/me", headers=headers)
    user_info = response.json()
    ```
    """
    return current_user
