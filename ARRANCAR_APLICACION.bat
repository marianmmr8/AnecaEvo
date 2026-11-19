@echo off
title Aneca Evo - Arranque Completo
echo ============================================================
echo   ANECA EVO - Iniciando Base de Datos, Backend y Frontend
echo ============================================================
echo.
echo [1/3] Comprobando base de datos `aneca evo` e insertando datos iniciales si faltan...
cd /d c:\xampp\htdocs\AnecaEvo\backend
call npm run init-db
if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo conectar a MySQL.
    echo Por favor, abre el Panel de Control de XAMPP y pulsa START en MySQL.
    pause
    exit /b 1
)

echo.
echo [2/3] Abriendo servidor Backend en puerto 4000...
start "Aneca Evo - Backend (4000)" cmd /k "cd /d c:\xampp\htdocs\AnecaEvo\backend && npm run dev"

echo [3/3] Abriendo servidor Frontend en puerto 5173...
start "Aneca Evo - Frontend (5173)" cmd /k "cd /d c:\xampp\htdocs\AnecaEvo\frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173
echo.
echo Listo! Ya puedes usar la aplicacion en http://localhost:5173
pause
