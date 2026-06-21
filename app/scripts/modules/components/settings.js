// scripts/modules/components/settings.js
import { state } from "../utils/state.js";
import { setTheme, getStoredTheme } from "../utils/theme.js";
import { setMode, getStoredMode, syncModeIcon } from "../utils/mode.js";
import { aplicarDiseñoCompleto, sincronizarFondoConCSharp } from "../core/windows.core.js";

import {
  exportBackup,
  importBackup,
  checkBackupReminder,
  checkVersionChange,
} from "../utils/backup.js";
import { initVersionApp } from "../utils/version_app.js";

export function initSettings() {
  const panel = document.getElementById("settings-panel");
  const panelTitlebar = document.getElementById("setting-titlebar");
  const overlay = document.getElementById("settings-overlay");
  const openBtn = document.getElementById("settings-btn");
  const closeBtn = document.getElementById("settings-close-btn");
  const titlebarRow = document.getElementById("setting-titlebar-style");
  const titlebarDropdown = document.getElementById("titlebar-style-dropdown");

  initVersionApp();

  // --- Abrir / cerrar ---
  function openSettings() {
    panel.classList.add("is-open");
    panelTitlebar.classList.add("is-open");
    overlay.classList.add("is-open");
  }

  function closeSettings() {
    panel.classList.remove("is-open");
    panelTitlebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
  }

  // 2. CAMBIA ESTO: Escucha global de clicks para los botones de configuración
  document.addEventListener("click", (e) => {
    // Si hacen click en el botón viejo del sidebar O en el nuevo de la barra de título
    if (
      e.target.closest("#settings-btn") ||
      e.target.closest("#setting-titlebar")
    ) {
      openSettings();
      checkBackupReminder();
      checkVersionChange();
    }
  });

  // El resto de tus listeners de cierre se quedan exactamente igual
  closeBtn.addEventListener("click", closeSettings);
  overlay.addEventListener("click", closeSettings);
  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    if (e.key === "Escape") closeSettings();
  });
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      openSettings();
    }
  });

  // --- Toggle: Tema (usa theme.js para leer/guardar) ---
  const toggleTheme = document.getElementById("toggle-theme");
  const themeIcon = document.getElementById("theme-icon");

  const isDarkOnLoad = getStoredTheme() !== "light";
  toggleTheme.checked = isDarkOnLoad;
  themeIcon.setAttribute("name", isDarkOnLoad ? "mode-dark" : "mode-ligth");

  toggleTheme.addEventListener("change", () => {
    const isDark = toggleTheme.checked;
    setTheme(isDark ? "dark" : "light");
    themeIcon.setAttribute("name", isDark ? "mode-dark" : "mode-ligth");
    sincronizarFondoConCSharp();
  });

  // --- Toggle: Notificaciones ---
  const toggleNotif = document.getElementById("toggle-notif");
  const notifIcon = document.getElementById("notif-icon");

  toggleNotif.addEventListener("change", () => {
    notifIcon.setAttribute(
      "name",
      toggleNotif.checked ? "notifications" : "notifications-off",
    );
  });

  state.playMode = getStoredMode();
  syncModeIcon();

  // --- Respaldo: Dropdown custom ---
  const backupRow = document.getElementById("backup-row");
  const backupDropdown = document.getElementById("backup-dropdown");
  const importFileInput = document.getElementById("import-file-input");

  function openBackupDropdown() {
    backupRow.classList.add("is-open");
    backupDropdown.classList.add("is-open");
    backupDropdown.setAttribute("aria-hidden", "false");
  }

  function closeBackupDropdown() {
    backupRow.classList.remove("is-open");
    backupDropdown.classList.remove("is-open");
    backupDropdown.setAttribute("aria-hidden", "true");
  }

  backupRow.addEventListener("click", (e) => {
    if (e.target.closest(".backup-option")) return;
    backupDropdown.classList.contains("is-open")
      ? closeBackupDropdown()
      : openBackupDropdown();
  });

  backupDropdown.querySelectorAll(".backup-option").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      closeBackupDropdown();
      if (action === "export") {
        await exportBackup();
      } else if (action === "import") {
        importFileInput.click();
      }
    });
  });

  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files[0];
    if (!file) return;
    await importBackup(file);
    importFileInput.value = "";
  });

  document.addEventListener("click", (e) => {
    if (!backupRow.contains(e.target)) closeBackupDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBackupDropdown();
  });

  openBtn.addEventListener("click", () => {
    checkBackupReminder();
    checkVersionChange();
  });

  // --- Toggle: Aleatorio ---
  const toggleShuffle = document.getElementById("toggle-shuffle");
  toggleShuffle.checked = state.playMode === "shuffle";

  toggleShuffle.addEventListener("change", () => {
    const icon = document.getElementById("mode-icon");
    if (toggleShuffle.checked) {
      state.playMode = "shuffle";
      if (toggleRepeat.checked) toggleRepeat.checked = false;
      if (icon) icon.setAttribute("name", "shuffle");
    } else {
      state.playMode = "list";
      if (icon) icon.setAttribute("name", "repeat");
    }
    setMode(state.playMode);
    syncModeIcon();
  });

  // --- Toggle: Repetir ---
  const toggleRepeat = document.getElementById("toggle-repeat");
  toggleRepeat.checked = state.playMode === "repeat-one";

  toggleRepeat.addEventListener("change", () => {
    const icon = document.getElementById("mode-icon");
    if (toggleRepeat.checked) {
      state.playMode = "repeat-one";
      if (toggleShuffle.checked) toggleShuffle.checked = false;
      if (icon) icon.setAttribute("name", "repeat-one");
    } else {
      state.playMode = "list";
      if (icon) icon.setAttribute("name", "repeat");
    }
    setMode(state.playMode);
    syncModeIcon();
  });

  // --- Botón Ecualizador en Ajustes ---
  const eqRow = [...document.querySelectorAll(".settings-row")].find(
    (row) =>
      row.querySelector(".settings-row__label")?.textContent.trim() ===
      "Ecualizador",
  );
  if (eqRow) {
    eqRow.addEventListener("click", () => {
      closeSettings();
      setTimeout(() => {
        import("./equalizer-ui.js").then(({ toggleEQPanel }) =>
          toggleEQPanel(),
        );
      }, 350);
    });
  }

  // --- SELECCIÓN DE ESTILO DE BARRA DE TÍTULO ---
  if (titlebarRow && titlebarDropdown) {
    const esDesarrollo =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 🚀 CORREGIDO: Detección nativa del motor WebView2 (.NET)
    const esAppNativa = window.chrome?.webview !== undefined;

    // Si no estamos en web local ni corriendo en el cascarón de Windows, se oculta la fila
    if (!esDesarrollo && !esAppNativa) {
      titlebarRow.style.display = "none";
    }

    function openTitlebarDropdown() {
      titlebarRow.classList.add("is-open");
      titlebarDropdown.classList.add("is-open");
      titlebarDropdown.setAttribute("aria-hidden", "false");
    }

    function closeTitlebarDropdown() {
      titlebarRow.classList.remove("is-open");
      titlebarDropdown.classList.remove("is-open");
      titlebarDropdown.setAttribute("aria-hidden", "true");
    }

    titlebarRow.addEventListener("click", (e) => {
      if (e.target.closest(".titlebar-style-option")) return;
      titlebarDropdown.classList.contains("is-open")
        ? closeTitlebarDropdown()
        : openTitlebarDropdown();
    });

    // CONTROL DEL CLICK EN LAS OPCIONES
    titlebarDropdown
      .querySelectorAll(".titlebar-style-option")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const estiloSeleccionado = btn.dataset.style;
          closeTitlebarDropdown();

          // Guardar preferencia
          localStorage.setItem("titlebar", estiloSeleccionado);

          // Ejecutar el cambio visual e informar a C# de inmediato
          aplicarDiseñoCompleto(estiloSeleccionado);
        });
      });

    document.addEventListener("click", (e) => {
      if (!titlebarRow.contains(e.target)) closeTitlebarDropdown();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeTitlebarDropdown();
    });
  }
}
