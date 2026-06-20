// scripts/modules/core/windows.core.js
let isDesktop = false;
let titlebar = null;

function sendCommand(accion) {
  if (window.chrome?.webview?.postMessage) {
    const payload = JSON.stringify({ action: accion });
    window.chrome.webview.postMessage(payload);
    console.log("📤 Comando enviado a C#:", payload);
  } else {
    console.warn("⚠️ WebView2 no disponible para enviar:", accion);
  }
}

function renderTitleBar() {
  titlebar = document.getElementById("desktop-titlebar");
  if (!titlebar) return;

  titlebar.innerHTML = `
  <img src="./assets/icons/favicon.ico" class="logo-titlebar" alt="Lerma Music" /> 
  <div class="title">Local Tunes</div>
  <div class="window-controls" style="-webkit-app-region: no-drag">
    <button onclick="window.sendCommand('close')" class="ctrl-btn btn-close" title="Cerrar">
      <l-icon id="icon-close" name="close"></l-icon>
    </button>
    <button onclick="window.sendCommand('minimize')" class="ctrl-btn btn-minimize" title="Minimizar">
      <l-icon id="icon-minimize" name="minimize"></l-icon>
    </button>
    <button onclick="window.sendCommand('maximize')" class="ctrl-btn btn-maximize" title="Maximizar">
      <l-icon id="icon-maximize" name="miximize"></l-icon>
    </button>
  </div>
  `;
}

export function initTitlebar() {
  window.sendCommand = sendCommand;
  renderTitleBar();

  if (titlebar) {
    // 🚀 LA CLAVE WEB: Quitamos cualquier clase de inicio para evitar que el CSS con !important la fuerce en la Web
    titlebar.classList.remove("custom", "native");
  }

  // Detectamos si estamos dentro del WebView2 de Microsoft
  if (window.chrome?.webview) {
    window.modeDesktopActive = () => {
      isDesktop = true;

      const settingsPanel = document.getElementById("setting-titlebar-style");
      if (settingsPanel) settingsPanel.style.display = "flex";

      const diseñoGuardado = localStorage.getItem("titlebar") || "custom";
      aplicarDiseñoCompleto(diseñoGuardado);
    };
  }
}

export function aplicarDiseñoCompleto(estilo) {
  if (!titlebar) {
    titlebar = document.getElementById("desktop-titlebar");
    if (!titlebar) return;
  }

  localStorage.setItem("titlebar", estilo);

  if (estilo === "native") {
    titlebar.classList.remove("custom", "native");
    titlebar.style.display = "none";
    sendCommand("native_bar"); 
    return;
  }

  // Si es custom o variante personalizada de escritorio:
  sendCommand("custom_bar"); 
  
  titlebar.style.display = "flex";
  titlebar.classList.remove("custom", "native");
  titlebar.classList.add(estilo); // Aquí vuelve a ganar la clase custom en la App Nativa
}