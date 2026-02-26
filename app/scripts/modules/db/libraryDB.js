import { openDB, storeName } from './database.js';
import { state } from '../utils/state.js';

export async function loadFromDatabase() {
    const { loadingOverlay } = await import('../ui/views.js');
    const { renderFolders } = await import('../components/folders.js');

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get("current_lib");

    request.onsuccess = () => {
        if (request.result) {
            state.library = request.result.data;
            renderFolders();
        } else {
            loadingOverlay.style.display = 'none';
        }
    };
}
