import { state } from '../utils/state.js';
import { openDB, storeName } from '../db/database.js';
import { escapeJS } from '../utils/helpers.js';
import { playSong } from './player.js';
import { initMiniVisualizer} from './mini-visualizer.js';
import { updateActiveSongInList } from './player.js';

// --- REFERENCIAS DOM (se asignan en initFavorites) ---
let favsSongListUI, favsSongSearch;

export function initFavorites() {
    favsSongListUI = document.getElementById('favs-song-list');
    favsSongSearch = document.getElementById('favs-song-search');

    favsSongSearch.addEventListener('input', (e) => {
        renderFavorites(e.target.value);
    });
}

export async function saveFavorites() {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    await tx.objectStore(storeName).put({ id: "songs_favs", data: state.favorites });
}

export async function loadFavorites() {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get("songs_favs");

    return new Promise((resolve) => {
        request.onsuccess = () => {
            if (request.result) state.favorites = request.result.data;
            resolve();
        };
        request.onerror = () => resolve();
    });
}

export function toggleFavorite(folder, songTitle, event) {
    event.stopPropagation();
    const favId = `${folder}-${songTitle}`;
    const index = state.favorites.indexOf(favId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(favId);
    }
    saveFavorites();
    import('./songs.js').then(({ renderSongs }) => renderSongs(state.currentQueue));
}

export async function toggleFavoriteFromFavs(folder, title, event) {
    event.stopPropagation();
    const favId = `${folder}-${title}`;
    const index = state.favorites.indexOf(favId);
    if (index > -1) {
        state.favorites.splice(index, 1);
        await saveFavorites();
        renderFavorites(favsSongSearch.value);
    }
}

export function renderFavorites(searchTerm = "") {
    favsSongListUI.innerHTML = '';
    let allFavs = [];

    for (const folder in state.library) {
        state.library[folder].forEach(song => {
            const favId = `${folder}-${song.title}`;
            if (state.favorites.includes(favId)) {
                allFavs.push({ ...song, folderName: folder });
            }
        });
    }

    if (searchTerm) {
        allFavs = allFavs.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    document.getElementById('favs-stats-info').textContent = `${allFavs.length} canciones • Favoritos`;

    const currentSong = state.currentQueue[state.currentIndex];

    const fragment = document.createDocumentFragment();
    allFavs.forEach((song) => {
        const isPlaying = state.currentIndex !== -1 &&
            currentSong?.title === song.title &&
            currentSong?.artist === song.artist;

        const li = document.createElement('li');
        li.className = 'song-item';
        if (isPlaying) li.classList.add('is-playing');

        const escapedFolder = escapeJS(song.folderName);
        const escapedTitle  = escapeJS(song.title);

        li.innerHTML = `
            <div class="song-info-container">
                <div class="album-art-placeholder">
                    ${isPlaying
                        ? `<canvas class="mini-viz" width="80" height="80"></canvas>`
                        : `<l-icon name="musical-note"></l-icon>`
                    }
                </div>
                <div class="marquee-container" style="overflow:hidden; flex:1;">
                    <strong class="marquee-text">${song.title}</strong>
                    <span style="display:block; font-size:0.8em; opacity:0.5;">${song.artist}</span>
                </div>
            </div>
            <button class="fav-btn" onclick="toggleFavoriteFromFavs('${escapedFolder}', '${escapedTitle}', event)">
                <l-icon name="heart" class="is-fav"></l-icon>
            </button>`;

        if (isPlaying) {
            requestAnimationFrame(() => {
                const miniCanvas = li.querySelector('.mini-viz');
                if (miniCanvas) initMiniVisualizer(miniCanvas);
            });
        }

        li.querySelector('.song-info-container').onclick = () => {
            state.currentQueue = allFavs;
            const index = allFavs.findIndex(s =>
                s.title === song.title &&
                s.folderName === song.folderName
            );
            playSong(index);
        };

        fragment.appendChild(li);
    });

    favsSongListUI.appendChild(fragment);
    setTimeout(() => updateActiveSongInList(), 50);
}

// Exponer globalmente
window.toggleFavoriteFromFavs = toggleFavoriteFromFavs;