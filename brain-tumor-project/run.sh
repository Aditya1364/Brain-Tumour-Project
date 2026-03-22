#!/bin/bash
# ── run.sh — Start both frontend and backend ──────────────────────────
# Usage: bash run.sh

echo ""
echo "🧠  NeuralOnco — Starting..."
echo ""

# Start backend
echo "▶ Starting Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
  echo "  Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt -q
else
  source venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start frontend
echo "▶ Starting Frontend (Vite)..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "  Installing npm packages..."
  npm install -q
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅  Both servers running!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM
wait
