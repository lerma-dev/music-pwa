// --- APP.JS - PUNTO DE ENTRADA ---
import { loadFavorites } from './modules/components/favorites.js';
import { loadFromDatabase } from './modules/db/libraryDB.js';
import { saveLibraryToDB } from './modules/db/database.js';
import { openDB, storeName } from './modules/db/database.js';
import agregarToast from './modules/components/toast.js';

// Importar módulos UI (registra event listeners)
import './modules/ui/views.js';
import './modules/ui/modals.js';
import './modules/components/player.js';
import './modules/components/playlists.js';
import './modules/components/favorites.js';

// --- VARIABLES GLOBALES DE DOM ---
const folderInput = document.getElementById('folder-input');
const clearDbBtn = document.getElementById('clear-db-btn');

// --- EVENTOS INICIALES ---
window.onload = async () => {
    await loadFavorites();
    loadFromDatabase();
};

folderInput.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) saveLibraryToDB(files);
};

clearDbBtn.onclick = async () => {
    if (!confirm("¿Borrar toda la base de datos?")) return;
    const db = await openDB();
    await db.transaction(storeName, "readwrite").objectStore(storeName).delete("current_lib");
    location.reload();
};

//exponer globalmente para el uso de onclick en el html
window.agregarToast = agregarToast;
