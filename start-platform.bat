@echo off
echo ==========================================================
echo  Starting Mule Sentinel Platform (Backend + Frontend)
echo ==========================================================
echo Starting FastAPI Backend on http://127.0.0.1:8000...
start "Mule Backend" /min python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
echo Starting Web Workspace on http://127.0.0.1:5173...
pnpm --filter web dev
