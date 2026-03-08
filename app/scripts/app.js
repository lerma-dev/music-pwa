import { loadViews } from './modules/ui/loader.js';
import { loadFavorites } from './modules/components/favorites.js';
import { loadFromDatabase } from './modules/db/libraryDB.js';
import { saveLibraryToDB, openDB, storeName } from './modules/db/database.js';
import agregarToast from './modules/components/toast.js';
import { initSidebar } from './modules/ui/sidebar.js';

window.agregarToast = agregarToast;

(async () => {
    // 1. Inyectar HTML de todas las vistas
    await loadViews();

    const { initPlayer, togglePlay, playNext, playPrev }    = await import('./modules/components/player.js');
    const { initFavorites } = await import('./modules/components/favorites.js');
    await import('./modules/ui/views.js');
    await import('./modules/ui/modals.js');
    await import('./modules/components/playlists.js');

    initPlayer();
    initFavorites();

    // Sidebar desktop
    initSidebar();

    await loadFavorites();
    loadFromDatabase();

    const folderInput = document.getElementById('folder-input');
    const clearDbBtn  = document.getElementById('clear-db-btn');

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

    // Exponer funciones para Android MediaSession
    window.togglePlay = togglePlay;
    window.playNext   = playNext;
    window.playPrev   = playPrev;
})();