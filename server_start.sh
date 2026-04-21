#!/bin/bash
# Configuración de colores (Estilo Ubuntu/ANSI)
GREEN='\033[01;34m'
YELLOW='\033[01;33m'
RESET='\033[0m'

echo -e "${GREEN}Iniciando servidor para Music...${RESET}"

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

cleanup() {
    echo -e "\n${YELLOW}Apagando procesos...${RESET}"
    taskkill //F //IM python.exe //T 2>/dev/null
    exit
}

trap cleanup SIGINT

# Inicia el servidor de Python
python -m http.server "$PUERTO" --directory ./app