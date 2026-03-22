# 🏗️ Guía de Desarrollo Técnico

Esta guía explica la arquitectura interna para desarrolladores que deseen profundizar en la lógica del reproductor.

## 📁 Estructura de Archivos
* `/app/scripts/`: Lógica dividida por módulos.
* `/app/sw.js`: Manejo de caché y estrategias PWA.
* `/app/manifest.json`: Configuración para instalación nativa.

## 🔊 Procesamiento de Audio
El reproductor utiliza la **Web Audio API**. Si vas a trabajar en el **Ecualizador**:
1.  Usa `BiquadFilterNode` para las bandas de frecuencia.
2.  Conecta los nodos en cadena: `Source -> Filters -> Visualizer -> Destination`.

## 💾 Persistencia (IndexedDB)
La base de datos guarda:
* `folders`: Rutas y nombres de carpetas locales.
* `songs`: Metadatos extraídos con File API.
* `settings`: Preferencias de usuario.

## 🔄 Ciclo de Actualización (Skip Waiting)
Para forzar la actualización del Service Worker cuando hay cambios críticos:
1.  El SW detecta una nueva versión.
2.  Se muestra un aviso en el DOM.
3.  Al aceptar, se envía un mensaje `SKIP_WAITING` para activar el nuevo worker inmediatamente.