# 🎵 Modern Web Music Player (PWA)

Un reproductor de música web de alto rendimiento diseñado para gestionar librerías masivas de forma local, sin necesidad de servidores externos.

## 📊 Estado del Proyecto

<a href="https://local-tunes.netlify.app">
  <p>GET IT ON NETLIFY</p>
  <img src="https://img.shields.io/badge/GET_IT_ON-Netlify-00ad9f?style=for-the-badge&logo=netlify&logoColor=white" alt="Get it on Netlify" height="40">
</a>

<a href="https://lerma-dev.github.io/music-pwa/app">
  <p>GET IT ON GITHUB-PAGES</p>
  <img src="https://img.shields.io/badge/GET_IT_ON-GitHub_Pages-bc13fe?style=for-the-badge&logo=github&logoColor=white" alt="Get it on GitHub Pages" height="40">
</a>

- 🚀 **Producción (Estable):** Rama `main` (Desplegado en Netlify).
- 🧪 **Beta (Experimental):** Rama `music_beta` (Desplegado en GitHub Pages).
  - *Actualmente probando: Ecualizador de Aztrad y Notificaciones Push.*

![Licencia](https://img.shields.io/badge/license-MIT-blue.svg)
![Javascript](https://img.shields.io/badge/JS-Vanilla-yellow.svg)

## 🚀 Características Principales

- **Alto Rendimiento:** Implementación de **Virtual Scrolling** (Intersection Observer) para renderizar miles de canciones con 0% de lag.
- **Persistencia Local:** Utiliza **IndexedDB** para guardar los metadatos de tu música. Una vez cargada, la librería está disponible al instante cada vez que regresas.
- **Privacidad Total:** No subimos tu música a ningún servidor. Todo el procesamiento ocurre en el navegador mediante **File API**.
- **Experiencia de Usuario:** \* Visualizador de audio en tiempo real.
  - Sistema de favoritos persistente.
  - Buscador inteligente e instantáneo.
  - Animaciones de texto (Marquee) dinámicas.
- **Instalable (PWA):** Funciona como una aplicación nativa en dispositivos móviles.

## 🛠️ Tecnologías utilizadas

- **Vanilla JS:** Sin frameworks pesados para garantizar la máxima velocidad.
- **IndexedDB:** Base de datos NoSQL nativa del navegador.
- **Web Audio API:** Para el visualizador y procesamiento de sonido.
- **CSS Moderno:** Variables de color y diseño responsive.

## 📦 Instalación Local

1. Clona el repositorio en tu espacio de trabajo:
  ```bash
  git clone https://github.com/lerma-dev/music-pwa.git
  cd music-pwa
  ```
2. Inicia el servidor según tu sistema operativo:
  - **🪟 Windows (Git Bash / CMD)**
  ```bash
  start_app
  ```
  O usa directamente el script de Bash (recomendado para VS Code):
  ```bash
  ./server_start.sh
  ```
  
  - **🐧 Linux / macOS**
  Asegúrate de dar permisos de ejecución la primera vez:
  ```bash
  chmod +x server_start.sh
  ./server_start.sh
  ```
3. Método Manual (Python)
  - **Si prefieres no usar scripts, ejecuta el servidor nativo:**
  *En windows
  ```bash
  py -m http.server 80 --directory app
  ```
  *En Mac/linux
  ```bash
  python3 -m http.server 80 --directory app
  ```

3. Accede a la App:
  Abre tu navegador en http://localhost.

    Nota: El script detectará automáticamente si el puerto 80 está ocupado y, de ser así, lanzará la app en http://localhost:8080.  