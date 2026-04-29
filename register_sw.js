// app/register_sw.js
if ('serviceWorker' in navigator) {
  // Registro del Service Worker
  navigator.serviceWorker.register('./sw.js').then(reg => {
    // Si ya hay un SW activo pero no tenemos la versión (usuario nuevo o caché limpia)
    if (reg.active && !localStorage.getItem('appVersion')) {
        // Forzamos el envío de la versión desde el SW
        reg.active.postMessage({ action: 'requestVersion' });
    }
  });

  // Mensaje para actualizar version en el DOM mediante localStorage
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.action === 'setVersion') {
      localStorage.setItem('appVersion', event.data.version);
      // Opcional: Disparar un evento personalizado para avisar a settings.js
      window.dispatchEvent(new CustomEvent('versionUpdated', { detail: event.data.version }));
    }
  });


  // Recarga automática cuando el nuevo SW toma el control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
