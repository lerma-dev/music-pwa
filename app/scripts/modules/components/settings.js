import { state } from '../utils/state.js';
import { setTheme, getStoredTheme } from '../utils/theme.js';
import { setMode, getStoredMode, syncModeIcon } from '../utils/mode.js';
import { exportBackup, importBackup, checkBackupReminder, checkVersionChange } from '../utils/backup.js';

export function initSettings() {
  const panel    = document.getElementById('settings-panel');
  const overlay  = document.getElementById('settings-overlay');
  const openBtn  = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close-btn');

  // --- Abrir / cerrar ---
  function openSettings() {
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
  }

  function closeSettings() {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  openBtn.addEventListener('click', openSettings);
  closeBtn.addEventListener('click', closeSettings);
  overlay.addEventListener('click', closeSettings);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });

  // --- Toggle: Tema (usa theme.js para leer/guardar) ---
  const toggleTheme = document.getElementById('toggle-theme');
  const themeIcon   = document.getElementById('theme-icon');

  const isDarkOnLoad = getStoredTheme() !== 'light';
  toggleTheme.checked = isDarkOnLoad;
  themeIcon.setAttribute('name', isDarkOnLoad ? 'mode-dark' : 'mode-ligth');

  toggleTheme.addEventListener('change', () => {
    const isDark = toggleTheme.checked;
    setTheme(isDark ? 'dark' : 'light');
    themeIcon.setAttribute('name', isDark ? 'mode-dark' : 'mode-ligth');
  });

  // --- Toggle: Notificaciones ---
  const toggleNotif = document.getElementById('toggle-notif');
  const notifIcon   = document.getElementById('notif-icon');

  toggleNotif.addEventListener('change', () => {
    notifIcon.setAttribute('name', toggleNotif.checked ? 'notifications' : 'notifications-off');
  });

  state.playMode = getStoredMode();
  syncModeIcon();
  // --- Respaldo: Dropdown custom ---
  const backupRow      = document.getElementById('backup-row');
  const backupDropdown = document.getElementById('backup-dropdown');
  const importFileInput = document.getElementById('import-file-input');

  function openBackupDropdown() {
    backupRow.classList.add('is-open');
    backupDropdown.classList.add('is-open');
    backupDropdown.setAttribute('aria-hidden', 'false');
  }

  function closeBackupDropdown() {
    backupRow.classList.remove('is-open');
    backupDropdown.classList.remove('is-open');
    backupDropdown.setAttribute('aria-hidden', 'true');
  }

  backupRow.addEventListener('click', (e) => {
    // No cerrar si el click fue en un botón de opción (se maneja abajo)
    if (e.target.closest('.backup-option')) return;
    backupDropdown.classList.contains('is-open')
      ? closeBackupDropdown()
      : openBackupDropdown();
  });

  backupDropdown.querySelectorAll('.backup-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      closeBackupDropdown();
      if (action === 'export') {
        await exportBackup();
      } else if (action === 'import') {
        importFileInput.click();
      }
    });
  });

  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files[0];
    if (!file) return;
    await importBackup(file);
    importFileInput.value = '';
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!backupRow.contains(e.target)) closeBackupDropdown();
  });

  // Cerrar dropdown al presionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBackupDropdown();
  });

  // Chequeos al abrir los ajustes
  openBtn.addEventListener('click', () => {
    checkBackupReminder();
    checkVersionChange();
  });

  // --- Toggle: Aleatorio
  const toggleShuffle = document.getElementById('toggle-shuffle');
  toggleShuffle.checked = state.playMode === 'shuffle';

  toggleShuffle.addEventListener('change', () => {
    const icon = document.getElementById('mode-icon');
    if (toggleShuffle.checked) {
      state.playMode = 'shuffle';
      if (toggleRepeat.checked) toggleRepeat.checked = false;
      if (icon) icon.setAttribute('name', 'shuffle');
    } else {
      state.playMode = 'list';
      if (icon) icon.setAttribute('name', 'repeat');
    }
    setMode(state.playMode);
    syncModeIcon();
  });

  // --- Toggle: Repetir ---
  const toggleRepeat = document.getElementById('toggle-repeat');
  toggleRepeat.checked = state.playMode === 'repeat-one';

  toggleRepeat.addEventListener('change', () => {
    const icon = document.getElementById('mode-icon');
    if (toggleRepeat.checked) {
      state.playMode = 'repeat-one';
      if (toggleShuffle.checked) toggleShuffle.checked = false;
      if (icon) icon.setAttribute('name', 'repeat-one');
    } else {
      state.playMode = 'list';
      if (icon) icon.setAttribute('name', 'repeat');
    }
    setMode(state.playMode);
    syncModeIcon();
  });
  // --- Botón Ecualizador en Ajustes ---
  // Import dinámico para no romper la cadena de audio al inicio
  const eqRow = [...document.querySelectorAll('.settings-row')].find(row =>
    row.querySelector('.settings-row__label')?.textContent.trim() === 'Ecualizador'
  );
  if (eqRow) {
    eqRow.addEventListener('click', () => {
      closeSettings();
      setTimeout(() => {
        import('./equalizer-ui.js').then(({ toggleEQPanel }) => toggleEQPanel());
      }, 350);
    });
  }

}