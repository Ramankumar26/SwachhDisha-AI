@echo off
echo Starting SwachhDisha AI Backend...
cd /d "d:\MCD_IIT delhi_project\backend"
python -m uvicorn main:app --reload
pause
