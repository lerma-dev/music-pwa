#!/bin/bash

# Configuración de colores (Estilo Ubuntu/ANSI)
GREEN='\033[01;32m'
YELLOW='\033[01;33m'
RESET='\033[0m'

# Título de la ventana (funciona en la mayoría de terminales)
echo -ne "\033]0;Music App\007"

echo -e "${GREEN}Iniciando servidor para Music...${RESET}"

# Verificar si el puerto 80 está ocupado
# Usamos netstat.exe para comunicarnos con la red de Windows desde Bash
if ! netstat.exe -ano | grep -q ":80 "; then
    PUERTO=80
    URL="http://localhost"
else
    PUERTO=8080
    URL="http://localhost:8080"
fi

# Mostrar información al usuario
echo -e "URL: ${GREEN}${URL}${RESET}"
echo -e "Carpeta: /app"
echo ""
echo -e "Apagar servidor: ${YELLOW}Ctrl + C${RESET}"

# Inicia el servidor de Python
py -m http.server "$PUERTO" --directory app
