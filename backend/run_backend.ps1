# Script para ejecutar el backend con las configuraciones correctas de encoding
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
$env:LC_ALL = "en_US.UTF-8"
$env:LANG = "en_US.UTF-8"

# Activar el entorno virtual
& .\venv\Scripts\Activate.ps1

# Ejecutar uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
