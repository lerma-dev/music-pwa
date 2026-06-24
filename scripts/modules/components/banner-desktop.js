// app/scripts/modules/components/banner-desktop.js
function showSecurityModal() {
  const container = document.getElementById("aviso-seguridad");

  const modal = document.createElement("div");
  modal.id = "modal-download-info";
  modal.className = "modal-overlay";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Aviso de seguridad</h3>
      <p>La descarga iniciará en un momento. Windows podría mostrar una advertencia de "Editor desconocido".</p>
      <p class="es-seguro">
        <strong>Para instalarla:</strong> Haz clic en "Más información" y luego en "Ejecutar de todas formas".
      </p>
      <p>
        <em>Mi software es seguro y ha sido compilado por mí.</class=em>
      </p>
      <div class="modal-actions">
        <button class="confirm-btn confirm-btn--success" id="btn-confirm-download">Entendido, descargar</button>
        <button class="confirm-btn confirm-btn--cancel"  id="btn-cancel-download">Cancelar</button>
      </div>
    </div>
  `;

  container.appendChild(modal);
  const confirmDown = document.getElementById("btn-confirm-download");
  const cancelDown = document.getElementById("btn-cancel-download");
  confirmDown.addEventListener("click", () => {
    window.location.href =
      "https://github.com/lerma-dev/music-pwa/releases/download/v1.6.6/local_tunes_v1.6.6.exe";
    modal.remove();
  });

  cancelDown.addEventListener("click", () => {
    modal.remove();
  });
}

export const initDesktopBanner = () => {
  const banner = document.getElementById("banner-desktop");
  if (!banner) return;

  // Verificar si es escritorio (simple check de ancho o touch)
  const isDesktop =
    window.matchMedia("(min-width: 1024px)").matches &&
    !("ontouchstart" in window);

  // Ocultar si es móvil o si ya está instalado
  if (
    !isDesktop ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.chrome.webview
  ) {
    banner.style.display = "none";
    return;
  }

  // Mostrar banner
  banner.style.display = "flex";
  banner.innerHTML = `
  <div class="desktop-banner-content">
    <l-icon name="desktop-outline"></l-icon>
    <p>
      <strong>¿Prefieres la versión de escritorio?</strong><br>
      Instala nuestra app para una mejor experiencia local.
    </p>
    <button id="btn-download-exe"> 
      Descargar 
    </button>
    <button id="btn-close-banner">
      <l-icon name="close"></l-icon>
    </button>
  </div>
  `;

  const download = document.getElementById("btn-download-exe");
  download.addEventListener("click", () => {
    showSecurityModal();
  });

  document.getElementById("btn-close-banner").addEventListener("click", () => {
    banner.style.display = "none";
  });
};
