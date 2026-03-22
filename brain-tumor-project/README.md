# 🧠 Brain Tumor Detection ML Project

Full-stack ML application for brain tumor detection using MRI scans.

## Stack
- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **ML Model**: PyTorch CNN (ResNet-50 fine-tuned)
- **Database**: SQLite (dev) / PostgreSQL (prod)

## Quick Start
cd brain-tumor-project

# 2. Backend
cd backend
python -m venv venv
Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev


Open http://localhost:5173

## Project Structure

brain-tumor-project/
├── frontend/          # React app
├── backend/           # FastAPI server
├── ml/                # Training notebooks & scripts
└── docs/              # Documentation




# Terminal 1 - Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - ngrok (optional)
ngrok http 5173