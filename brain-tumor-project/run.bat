@echo off
echo.
echo 🧠  NeuralOnco — Starting...
echo.

:: Start Backend
echo Starting Backend (FastAPI)...
cd backend
if not exist venv (
    echo   Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)
start "NeuralOnco Backend" cmd /k "uvicorn app.main:app --reload --port 8000"
cd ..

:: Wait 3 seconds
timeout /t 3 /nobreak > nul

:: Start Frontend
echo Starting Frontend (Vite)...
cd frontend
if not exist node_modules (
    echo   Installing npm packages...
    npm install
)
start "NeuralOnco Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Both servers are starting in separate windows!
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
pause
