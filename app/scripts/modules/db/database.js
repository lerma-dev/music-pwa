// --- CONFIGURACIÓN DE indexedDB ---
export const dbName = "MusicAppDB";
export const storeName = "library_meta";

export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.result);
    });
}

export async function saveLibraryToDB(newFiles) {
    const { loadingOverlay } = await import('../ui/views.js');
    const { renderFolders } = await import('../components/folders.js');
    const { loadFromDatabase } = await import('./libraryDB.js');

    loadingOverlay.style.display = 'flex';
    await new Promise(r => setTimeout(r, 50));

    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const existingLibRequest = store.get("current_lib");

    existingLibRequest.onsuccess = async () => {
        let libraryData = existingLibRequest.result ? existingLibRequest.result.data : {};

        const newFoldersFound = new Set();
        newFiles.forEach(f => {
            const parts = f.webkitRelativePath.split('/');
            if (parts.length > 1) newFoldersFound.add(parts[parts.length - 2]);
        });

        for (const folderName of newFoldersFound) {
            if (libraryData[folderName]) {
                const choice = confirm(`La carpeta "${folderName}" ya existe. \n\n¿Deseas COMBINAR (Aceptar) o REEMPLAZAR (Cancelar)?`);
                if (!choice) libraryData[folderName] = [];
            }
        }

        const validFiles = newFiles.filter(f => f.name.match(/\.(mp3|wav|ogg|m4a)$/i));
        validFiles.forEach(file => {
            const parts = file.webkitRelativePath.split('/');
            const folder = parts.length > 1 ? parts[parts.length - 2] : "Music";
            let fileName = file.name.replace(/\.[^/.]+$/, "");
            let artist = "Artista Desconocido";
            let title = fileName;

            if (fileName.includes(" - ")) {
                const splitName = fileName.split(" - ");
                artist = splitName[0].trim();
                title = splitName[1].trim();
            }

            if (!libraryData[folder]) libraryData[folder] = [];
            const isDuplicate = libraryData[folder].some(s => s.title === title && s.artist === artist);
            if (!isDuplicate) {
                libraryData[folder].push({ title, artist, file: file });
            }
        });

        const putRequest = store.put({ id: "current_lib", data: libraryData });
        putRequest.onsuccess = () => loadFromDatabase();
    };
}
