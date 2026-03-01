# 🎵 Modern Web Music Player (PWA)

Un reproductor de música web de alto rendimiento diseñado para gestionar librerías masivas de forma local, sin necesidad de servidores externos.

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

1. Clona este repositorio en tu servidor local (XAMPP/htdocs o similar):
  ```bash
  git clone https://github.com/lerma-dev/music-pwa.git
  cd music-pwa
  ```
2. Inicia el servidor
  - **Usando el script para `Windows`**
  ```bash
  start_app
  ```
  o 
  - **Usando el comando de Python**
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
  Si el puerto 80 está ocupado, el  `script` intentará usar el http://localhost:8080.