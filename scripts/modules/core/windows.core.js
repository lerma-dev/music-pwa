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
  <div class="window-controls">
    <button id="setting-titlebar" class="ctrl-btn btn-settings" title="Abrir Configuración (ALT + S)">
      <l-icon name="settings-outline"></l-icon>
    </button>
    <button onclick="window.sendCommand('close')" class="ctrl-btn btn-close" title="Cerrar">
      <l-icon name="close"></l-icon>
    </button>
    <button onclick="window.sendCommand('minimize')" class="ctrl-btn btn-minimize" title="Minimizar">
      <l-icon name="minimize"></l-icon>
    </button>
    <button onclick="window.sendCommand('maximize')" class="ctrl-btn btn-maximize" title="Maximizar">
      <l-icon name="miximize"></l-icon>
    </button>
  </div>
  `;
}

export function sincronizarFondoConCSharp() {
  const estiloComputado = getComputedStyle(document.documentElement);
  const colorBgHex = estiloComputado.getPropertyValue('--bg').trim();

  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage(JSON.stringify({
      action: "sync_background_color",
      color: colorBgHex
    }));
  }
}

export function initTitlebar() {
  window.sendCommand = sendCommand;
  renderTitleBar();
  if (titlebar) {
    titlebar.classList.remove("custom", "native");
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ctrl-btn") || e.target.closest(".logo-titlebar")) {
        return;
      }
      sendCommand("drag_window");
    });

    titlebar.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".ctrl-btn") || e.target.closest(".logo-titlebar")) {
        return;
      }
      e.preventDefault();

      if (window.chrome?.webview?.postMessage) {
        const payload = JSON.stringify({
          action: "show_system_menu",
          screenX: e.screenX,
          screenY: e.screenY,
        });
        window.chrome.webview.postMessage(payload);
      }
    });
  }

  // Detectamos si estamos dentro del WebView2 de Microsoft
  if (window.chrome?.webview) {
    window.modeDesktopActive = () => {
      isDesktop = true;

      const settingsPanel = document.getElementById("setting-titlebar-style");
      if (settingsPanel) settingsPanel.style.display = "flex";

      const diseñoGuardado = localStorage.getItem("titlebar") || "custom";
      const verificarWebview = () => {
        const sidebarBottom = document.getElementById("sidebar-bottom");
        if (sidebarBottom) {
          aplicarDiseñoCompleto(diseñoGuardado);
          clearInterval(intentoSincronizacion);
        }
      };
      verificarWebview();

      const intentoSincronizacion = setInterval(verificarWebview, 30);
      setTimeout(() => clearInterval(intentoSincronizacion), 1500);
    };
  } else {
    const verificarWeb = () => {
      const sidebarBottom = document.getElementById("sidebar-bottom");
      if (sidebarBottom) {
        sidebarBottom.style.display = "flex";
        clearInterval(intentoWeb);
      }
    };
    verificarWeb();
    const intentoWeb = setInterval(verificarWeb, 30);
    setTimeout(() => clearInterval(intentoWeb), 1000);
  }
}

export function aplicarDiseñoCompleto(estilo) {
  if (!titlebar) {
    titlebar = document.getElementById("desktop-titlebar");
    if (!titlebar) return;
  }

  localStorage.setItem("titlebar", estilo);
  const sidebarBottom = document.getElementById("sidebar-bottom");

  if (estilo === "native") {
    titlebar.classList.remove("custom", "native");
    titlebar.style.display = "none";

    if (sidebarBottom) {
      sidebarBottom.style.display = "flex";
    }

    sendCommand("native_bar");
    return;
  }

  sendCommand("custom_bar");

  titlebar.style.display = "flex";
  if (sidebarBottom) {
    sidebarBottom.style.display = "none";
  }

  titlebar.classList.remove("custom", "native");
  titlebar.classList.add(estilo); 
}
