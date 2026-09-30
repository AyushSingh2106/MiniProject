@echo off

echo Starting Image Correctness Marketplace...

start "Backend" cmd /k "cd /d C:\Users\hp\Desktop\imagecorrectnessmarketplace && backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload"

start "Frontend" cmd /k "cd /d C:\Users\hp\Desktop\imagecorrectnessmarketplace\frontend && npm run dev"

timeout /t 5 /nobreak >nul

start "" http://localhost:5173/

exit