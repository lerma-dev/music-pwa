@echo off
setlocal
title Music App
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

:: Intentar con el puerto 80
netstat -ano | findstr :80 >nul
if %errorlevel% neq 0 (
  set PUERTO=80
  set URL= http://localhost
) else (
  set PUERTO=8080
  set URL=http://localhost:8080
)
echo URL:%ESC%[92m %URL% %ESC%[0m
echo Carpeta: /app
echo.
echo Apagar servidor %ESC%[93m ctrl + c %ESC%[0m

:: Inicia el servidor de Python
python -m http.server %PUERTO% --directory ./app
pause