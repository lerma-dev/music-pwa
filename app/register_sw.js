if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registrado:', registration.scope);

        // Si hay un cambio en el SW, detectamos cuándo se instala el nuevo
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión detectada y lista
              console.log('Nueva versión encontrada... Recargando.');
              // No hacemos reload aquí directamente para dejar que el SW se active
            }
          };
        };
      })
      .catch(error => console.log('Error:', error));
  });

  // Este evento detecta cuando el nuevo SW toma el mando
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload(); // <--- EL TRUCO MÁGICO
      refreshing = true;
    }
  });
}