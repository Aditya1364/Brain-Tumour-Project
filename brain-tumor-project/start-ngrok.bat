@echo off
echo.
echo ========================================
echo   NeuralOnco - Starting with ngrok
echo ========================================
echo.

REM Step 1: Start backend
echo [1/3] Starting Backend...
cd /d "%~dp0"
cd backend
start "NeuralOnco Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Step 2: Start frontend
echo [2/3] Starting Frontend...
cd frontend
start "NeuralOnco Frontend" cmd /k "npm run dev"
cd ..

REM Wait for frontend
timeout /t 3 /nobreak > nul

REM Step 3: Start ngrok and show URL
echo [3/3] Starting ngrok tunnel...
echo.
echo !! IMPORTANT - After ngrok starts:
echo    1. Copy the https://xxxxx.ngrok-free.app URL
echo    2. Update backend\.env  APP_URL=https://xxxxx.ngrok-free.app
echo    3. Restart backend (Ctrl+C then uvicorn again)
echo.
ngrok http 5173

pause
