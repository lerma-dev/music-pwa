// app/scripts/app.js
import { loadViews } from './modules/ui/loader.js';
import { loadFavorites } from './modules/components/favorites.js';
import { loadFromDatabase } from './modules/db/libraryDB.js';
import { saveLibraryToDB, openDB, storeName } from './modules/db/database.js';
import { initSidebar } from './modules/ui/sidebar.js';
import { applyStoredTheme } from './modules/utils/theme.js';

// Aplicar tema guardado antes de pintar la UI
applyStoredTheme();

(async () => {
    // 1. Inyectar HTML de todas las vistas
    await loadViews();

    const { initPlayer, togglePlay, playNext, playPrev, mode } = await import('./modules/components/player.js');
    const { initFavorites } = await import('./modules/components/favorites.js');
    const { initVisualizerVar } = await import('./modules/components/visualizer.js');
    const { initToast,  eliminarToast, agregarToast} = await import('./modules/components/toast.js');
    const { initbannerUpdates } = await import('./modules/components/banner-updates.js');
    await import('./modules/ui/views.js');
    await import('./modules/ui/modals.js');
    await import('./modules/ui/song-context-menu.js');
    await import('./modules/components/playlists.js');


    const { initSettings } = await import('./modules/components/settings.js');

    initPlayer();
    initFavorites();
    initVisualizerVar();
    initSettings();
    // toast
    initToast();
    eliminarToast();
    // Banner de actualizaciones
    initbannerUpdates();  
    // Sidebar desktop
    initSidebar();
    // Cargar database
    await loadFavorites();
    loadFromDatabase();

    const folderInput = document.getElementById('folder-input');
    const clear_db_btn  = document.getElementById('clear-db-btn');

    folderInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) saveLibraryToDB(files);
    };

    clear_db_btn.onclick = async () => {
        if (!confirm("¿Borrar todo?")) return;
        const db = await openDB();
        await db.transaction(storeName, "readwrite").objectStore(storeName).delete("current_lib");
        location.reload();
    };
    // Exponer funciones para Android MediaSession
    window.togglePlay = togglePlay;
    window.playNext = playNext;
    window.playPrev = playPrev;
    window.mode = mode;
    window.agregarToast = agregarToast;
    window.eliminarToast = eliminarToast;
})();
