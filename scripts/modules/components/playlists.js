import { state } from '../utils/state.js';
import { openDB, storeName } from '../db/database.js';
import { escapeJS } from '../utils/helpers.js';
import { playSong } from './player.js';
import { closeModal, closeModalView } from '../ui/modals.js';
import { showFullPlaylist } from '../ui/views.js';
import {agregarToast} from './toast.js';
import { openSongContextMenu } from '../ui/song-context-menu.js';

const PlaySongListUI = document.getElementById('playlist-song');

// --- GUARDAR PLAYLIST DESDE MODAL ---
export async function savePlaylist(playlistName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const playlistData = { name: playlistName, song: [state.selectedSong] };
    const request = store.put({ id: `${playlistName}`, data: playlistData });
    request.onsuccess = () => {
        agregarToast({ tipo: "Exito", titulo: "¡Lista actualizada!", descripcion: `Playlist ${playlistName} guardada.`, autoClose: true });
        closeModal();
        state.selectedSong = null;
        const input = document.getElementById('playlist-name');
        if (input) input.value = "";
    };
}

export function Btn_savePlaylist() {
    const playlist_name = document.getElementById('playlist-name');
    const name = playlist_name.value.trim();
    if (name === "") {
        closeModal();
        agregarToast({ tipo: "Error", titulo: "¡Ups! Falta el nombre", descripcion: `El campo no puede estar vacío`, autoClose: false });
        return;
    }
    savePlaylist(name);
}

// --- RENDERIZAR PLAYLISTS EN MODAL ---
export async function renderPlaylist() {
    const container = document.getElementById('existing-playlists-container');
    container.innerHTML = "<h3>Guardar en Playlist</h3>";

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const allItems = request.result;
        const userPlaylists = allItems.filter(item =>
            item.id !== 'current_lib' && item.id !== 'songs_favs'
        );

        if (userPlaylists.length === 0) {
            container.innerHTML = `<p>No hay playlists creadas aún.</p>`;
            return;
        }

        userPlaylists.forEach(playlist => {
            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.innerHTML = `<span>${playlist.id}</span><small>${playlist.data?.song?.length || 0}</small>`;
            card.onclick = () => addSongPlaylist(playlist.id);
            container.appendChild(card);
        });
    };
}

export async function addSongPlaylist(playlistId) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const getReq = store.get(playlistId);

    getReq.onsuccess = () => {
        const playlist = getReq.result;
        playlist.data.song.push(state.selectedSong);

        const updateReq = store.put(playlist);
        updateReq.onsuccess = () => {
            closeModal();
            agregarToast({ tipo: "Exito", titulo: "¡Listo!", descripcion: `Guardada en ${playlistId}.`, autoClose: true });
        };
        updateReq.onerror = () => {
            agregarToast({ tipo: "Error", titulo: "¡Error!", descripcion: "No se pudo guardar.", autoClose: false });
        };
    };
}

// --- GUARDAR NUEVA PLAYLIST DESDE VISTA ---
export async function savePlay(playlistName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const playlistData = { name: playlistName, song: [] };
    const request = store.put({ id: `${playlistName}`, data: playlistData });

    request.onsuccess = () => {
        agregarToast({ tipo: "Exito", titulo: "¡Lista actualizada!", descripcion: `Playlist ${playlistName} guardada.`, autoClose: true });
        renderAllPlaylists();
        closeModalView();
        state.selectedSong = null;
        const input = document.getElementById('playlist-name-view');
        if (input) input.value = "";
    };
}

export function Btn_savePlay() {
    const playlist_name = document.getElementById('playlist-name-view');
    const name = playlist_name.value.trim();
    if (name === "") {
        closeModalView();
        agregarToast({ tipo: "Error", titulo: "¡Ups! Falta el nombre", descripcion: `El campo no puede estar vacío`, autoClose: false });
        return;
    }
    savePlay(name);
}

// --- RENDERIZAR TODAS LAS PLAYLISTS ---
export async function renderAllPlaylists() {
    const container = document.getElementById('created-playlists');
    if (!container) return;
    container.innerHTML = "";

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const allItems = request.result;
        const userPlaylists = allItems.filter(item =>
            item.id !== 'current_lib' && item.id !== 'songs_favs'
        );

        if (userPlaylists.length === 0) {
            container.innerHTML = `<p style="margin: auto; text-align: center; color: #888; margin-top: 20px;">Aún no has creado ninguna playlist.</p>`;
            return;
        }

        userPlaylists.forEach(playlist => {
            const count = playlist.data?.song?.length || 0;
            const card = document.createElement('div');
            card.className = 'folder-card-grid';
            card.innerHTML = `
                <div style="font-size:2rem;"><l-icon name="musical-notes"></l-icon></div>
                <div class="f-name">${playlist.id}</div>
                <div class="f-count">${count} canciones</div>`;
            card.onclick = () => {
                showFullPlaylist();
                renderSongPlaylist(playlist.id);
            };
            container.appendChild(card);
        });
    };
}

// --- RENDERIZAR CANCIONES DE UNA PLAYLIST ---
export async function renderSongPlaylist(playlistId, filterText = "") {
    PlaySongListUI.innerHTML = '';

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(playlistId);

    request.onsuccess = () => {
        const playlist = request.result;

        if (!playlist || !playlist.data || !playlist.data.song || playlist.data.song.length === 0) {
            PlaySongListUI.innerHTML = '<p style="text-align:center; padding:20px; color: #888;">Esta playlist no tiene canciones aún.</p>';
            document.getElementById('play-stats-info').textContent = `${playlistId} • 0 canciones`;
            return;
        }

        let canciones = playlist.data.song;

        if (filterText && filterText.trim() !== "") {
            const term = filterText.toLowerCase().trim();
            canciones = canciones.filter(song =>
                (song.title || "").toLowerCase().includes(term) ||
                (song.artist || "").toLowerCase().includes(term)
            );
        }

        document.getElementById('play-stats-info').textContent = `${playlistId} • ${canciones.length} canciones`;

        if (canciones.length === 0) {
            PlaySongListUI.innerHTML = '<p style="text-align:center; padding:20px; color: #888;">No se encontraron coincidencias.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        canciones.forEach((song) => {
            const RealIndex = playlist.data.song.indexOf(song);
            const li = document.createElement('li');
            li.className = 'song-item';
            li.innerHTML = `
            <div class="song-info-container" onclick="playSongFromPlaylist('${playlistId}', ${RealIndex})">
                <div class="album-art-placeholder"><l-icon name="musical-note"></l-icon></div>
                <div class="marquee-container">
                    <strong class="marquee-text">${song.title}</strong>
                    <span class="song-artist">${song.artist || "Artista desconocido"}</span>
                </div>
            </div>
            <button class="fav-btn song-ctx-btn" aria-label="Opciones"><l-icon name="menu"></l-icon></button>`;

            const capturedSong = { title: song.title, artist: song.artist || '' };
            const capturedPlaylistId = playlistId;
            li.querySelector('.song-ctx-btn').addEventListener('click', (e) => {
                openSongContextMenu(e, capturedSong, 'playlist', { playlistId: capturedPlaylistId });
            });

            fragment.appendChild(li);
        });
        PlaySongListUI.appendChild(fragment);
    };
}

export async function playSongFromPlaylist(playlistId, index) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(playlistId);

    request.onsuccess = () => {
        const playlist = request.result;
        if (!playlist?.data?.song) return;

        // Índice plano de la librería por título para re-vincular el File
        const libraryFlat = {};
        for (const folder in state.library) {
            state.library[folder].forEach(song => {
                libraryFlat[song.title] = song;
            });
        }

        // Enriquecer cada canción con el File real si fue importada sin él
        const enriched = playlist.data.song.map(song => {
            if (song.file) return song;
            const match = libraryFlat[song.title];
            return match ? { ...match } : song;
        });

        // Si la canción pedida no tiene file, avisar y no reproducir
        if (!enriched[index]?.file) {
            const songMeta = enriched[index];
            const existsInLibrary = Object.values(state.library).some(songs =>
                songs.some(s => s.title === songMeta?.title)
            );
            const libraryIsEmpty = Object.keys(state.library).length === 0;

            let titulo, descripcion, autoClose;
            if (libraryIsEmpty) {
                // El usuario importó playlists/favoritos antes de agregar carpetas
                titulo = 'Carpeta no importada';
                descripcion = 'Agrega la carpeta de música para poder reproducir esta canción.';
                autoClose = false;
            } else if (!existsInLibrary) {
                // La canción fue eliminada de la carpeta raíz
                titulo = 'Canción no encontrada';
                descripcion = `"${songMeta?.title}" ya no existe en la carpeta de origen.`;
                autoClose = true;
            } else {
                // Existe en la librería pero el File binario no está (importación sin binarios)
                titulo = 'Canción no disponible';
                descripcion = 'Importa la carpeta de música para poder reproducir esta canción.';
                autoClose = false;
            }

            window.agregarToast({ tipo: 'Error', titulo, descripcion, autoClose });
            return;
        }

        state.currentQueue = enriched;
        setTimeout(() => { playSong(index); }, 0);
    };
}

// Exponer globalmente
window.Btn_savePlaylist = Btn_savePlaylist;
window.Btn_savePlay = Btn_savePlay;
window.playSongFromPlaylist = playSongFromPlaylist;

// Búsqueda en playlist
document.getElementById('play-song-search').addEventListener('input', (e) => {
    const textoBusqueda = e.target.value;
    const currentStats = document.getElementById('play-stats-info').textContent;
    const playlistIdActual = currentStats.split(' • ')[0];
    if (playlistIdActual) renderSongPlaylist(playlistIdActual, textoBusqueda);
});
