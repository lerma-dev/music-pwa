import { state } from '../utils/state.js';
import { openDB, storeName } from '../db/database.js';
import { escapeJS } from '../utils/helpers.js';
import { playSong } from './player.js';

const favsSongListUI = document.getElementById('favs-song-list');
const favsSongSearch = document.getElementById('favs-song-search');

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
            if (request.result) {
                state.favorites = request.result.data;
            }
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

    // Re-render songs
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

    const fragment = document.createDocumentFragment();
    allFavs.forEach((song) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        const escapedFolder = escapeJS(song.folderName);
        const escapedTitle = escapeJS(song.title);

        li.innerHTML = `
            <div class="song-info-container">
                <div class="album-art-placeholder">
                    <l-icon name="musical-note"></l-icon>
                </div>
                <div class="marquee-container" style="overflow:hidden; flex:1;">
                    <strong class="marquee-text">${song.title}</strong>
                    <span style="display:block; font-size:0.8em; opacity:0.5;">${song.artist}</span>
                </div>
            </div>
            <button class="fav-btn" onclick="toggleFavoriteFromFavs('${escapedFolder}', '${escapedTitle}', event)">
                <l-icon name="heart" class="is-fav"></l-icon>
            </button>`;

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
}

favsSongSearch.addEventListener('input', (e) => {
    renderFavorites(e.target.value);
});

// Exponer globalmente
window.toggleFavoriteFromFavs = toggleFavoriteFromFavs;
