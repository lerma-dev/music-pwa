// app/scripts/modules/components/banner-updates.js
let bannerUpdatesElement;

export const initbannerUpdates = () => {
    bannerUpdatesElement = document.getElementById('banner-updates');
    if (bannerUpdatesElement) bannerUpdatesElement.style.display = 'none';

    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return;

        if (reg.waiting) {
            showBannerUpdates();
            return;
        }

        reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
                if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller &&
                    reg.waiting
                ) {
                    showBannerUpdates();
                }
            });
        });
    });
};

export const showBannerUpdates = () => {
    if (!bannerUpdatesElement) return;
    bannerUpdatesElement.style.display = 'flex';
    bannerUpdatesElement.innerHTML = `
        <div class="content-update">
            <img src="assets/icons/icon-192.png" alt="updates" class="updates-icon">
            <span>
                <strong>¡Nueva actualización esperándote!</strong><br>
                <i>No te pierdas las mejoras — actualiza ahora y sigue disfrutando tu música.</i>
            </span>
            <button class="whats-new-btn" id="btn-whats-new">
                <l-icon name="sparkles"></l-icon>
            </button>
        </div>
    `;

    document.getElementById('btn-whats-new').addEventListener('click', () => {
        bannerUpdatesElement.style.display = 'none';
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg && reg.waiting) {
                reg.waiting.postMessage({ action: 'skipWaiting' });
            }
        });
        // Mostrar toast de actualización aplicada
         agregarToast({
            tipo: 'Info',
            titulo: '¡Actualización aplicada!',
            descripcion: 'La nueva versión de la aplicación ha sido instalada.',
            autoClose: true,
        });
    });
};
