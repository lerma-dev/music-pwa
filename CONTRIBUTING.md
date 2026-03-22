# 🤝 Contribuyendo a Music PWA

¡Gracias por querer mejorar el reproductor! Para mantener la estabilidad de las versiones en producción y beta, seguimos este flujo de trabajo.

## 🌿 Estructura de Ramas

* **`main`**: Rama de producción (Netlify). **Protegida.** Solo el Administrador y dueño de este reposotorio realiza despliegues aquí.
* **`music_beta`**: Rama de pruebas activa (GitHub Pages). Aquí probamos funciones como el ecualizador y notificaciones.
* **Ramas de trabajo**: `op_hector`, `aztrad` o cualquier `feat/nueva-mejora`.

## 🛠️ ¿Cómo colaborar?

1.  **Haz un Fork** del proyecto.
2.  **Crea una rama** desde `music_beta` para tu mejora: `git checkout -b feat/mi-mejora`.
3.  **Realiza tus cambios** respetando la estética *Dark Modern* (acentos `#bc13fe`).
4.  **Abre un Pull Request (PR)** apuntando siempre a la rama `music_beta`.

> [!IMPORTANT]
> No se aceptarán PRs directos a `main`. Todo cambio debe ser validado primero en la beta.

## 🎨 Guía de Estilo
* Usa **Vanilla JS** (evita librerías externas innecesarias).
* Mantén el diseño **Responsive** (Mobile First).
* Asegúrate de que el **Service Worker** siga funcionando tras tus cambios.