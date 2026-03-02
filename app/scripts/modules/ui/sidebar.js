// Sidebar para desktop — se inyecta dinámicamente en 1024px+
// y sincroniza con las funciones de navegación existentes

export function initSidebar() {
  if (window.innerWidth < 1024) return;

  const app = document.getElementById('app');

  // Crear sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.id = 'app-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <h1>Mi Música</h1>
      <p>Reproductor local</p>
    </div>

    <nav class="sidebar-nav">
      <button class="sidebar-nav-btn nav-active" id="nav-main" onclick="showMainView()">
        <l-icon name="musical-notes"></l-icon>
        Biblioteca
      </button>
      <button class="sidebar-nav-btn" id="nav-favs" onclick="showFavoritesView()">
        <l-icon name="heart"></l-icon>
        Favoritos
      </button>
      <button class="sidebar-nav-btn" id="nav-playlists" onclick="showPlaylistsView()">
        <l-icon name="albums"></l-icon>
        Playlists
      </button>
    </nav>

    <div class="sidebar-divider"></div>
    <div class="sidebar-label">Agregar música</div>

    <label for="folder-input-sidebar" class="sidebar-import-btn">
      <l-icon name="folder-open"></l-icon>
      Importar carpeta
    </label>
    <input type="file" id="folder-input-sidebar" webkitdirectory directory multiple hidden>

    <div class="sidebar-bottom">
      <button class="sidebar-icon-btn danger" id="clear-db-btn-sidebar" title="Eliminar todo">
        <l-icon name="trash"></l-icon>
      </button>
    </div>
  `;

  // Insertar antes de todo el contenido del app
  app.insertBefore(sidebar, app.firstChild);

  // Sincronizar el input de carpeta con el original
  const sidebarInput = document.getElementById('folder-input-sidebar');
  const originalInput = document.getElementById('folder-input');
  if (sidebarInput && originalInput) {
    sidebarInput.addEventListener('change', (e) => {
      // Copiar los archivos al input original y disparar el evento
      const dt = new DataTransfer();
      [...e.target.files].forEach(f => dt.items.add(f));
      originalInput.files = dt.files;
      originalInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  // Sincronizar botón clear
  const sidebarClear = document.getElementById('clear-db-btn-sidebar');
  const originalClear = document.getElementById('clear-db-btn');
  if (sidebarClear && originalClear) {
    sidebarClear.addEventListener('click', () => originalClear.click());
  }

  // Highlight de nav activo
  updateSidebarNav('main');
}

export function updateSidebarNav(view) {
  if (window.innerWidth < 1024) return;
  const btns = {
    'main': 'nav-main',
    'favs': 'nav-favs',
    'playlists': 'nav-playlists',
  };
  Object.values(btns).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('nav-active');
  });
  if (btns[view]) {
    const el = document.getElementById(btns[view]);
    if (el) el.classList.add('nav-active');
  }
}
