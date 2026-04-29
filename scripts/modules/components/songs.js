import { state, ITEMS_PER_BATCH } from '../utils/state.js';
import { escapeJS, applyMarqueeIfNeeded } from '../utils/helpers.js';
import { toggleFavorite } from './favorites.js';
import { playSong } from './player.js';
import { openModal } from '../ui/modals.js';
import { openSongContextMenu } from '../ui/song-context-menu.js';

const songListUI = document.getElementById('song-list');

export function renderSongs(songs) {
    songListUI.innerHTML = '';
    state.songsToRenderGlobal = songs;
    state.itemsDisplayed = 0;
    renderNextBatch();
}

export function renderNextBatch() {
    const fragment = document.createDocumentFragment();
    const currentFolderName = document.getElementById('current-folder-title').textContent;
    const escapedFolder = escapeJS(currentFolderName);

    const batch = state.songsToRenderGlobal.slice(state.itemsDisplayed, state.itemsDisplayed + ITEMS_PER_BATCH);
    const newTitles = [];

    batch.forEach((song) => {
        const realIndex = state.currentQueue.findIndex(s =>
            s.title === song.title &&
            s.artist === song.artist
        );
        const favId = `${currentFolderName}-${song.title}`;
        const isFav = state.favorites.includes(favId);
        const escapedTitle = escapeJS(song.title);
        const lerma = isFav ? 'heart' : 'heart-outline';
        const classFav = isFav ? 'is-fav' : '';

        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
        <div class="song-info-container" onclick="playSong(${realIndex})">
            <div class="album-art-placeholder">
                <l-icon name="musical-note"></l-icon>
            </div>
            <div class="marquee-container">
                <strong class="marquee-text">${song.title}</strong>
                <span class="song-artist">${song.artist}</span>
            </div>
        </div>
        <button class="fav-btn" onclick="toggleFavorite('${escapedFolder}', '${escapedTitle}', event)">
            <l-icon name="${lerma}" class="${classFav}"></l-icon>
        </button>
        <button class="fav-btn song-ctx-btn" aria-label="Opciones">
            <l-icon name="menu"></l-icon>
        </button>`;

        // Capturar el nombre de la carpeta en el closure
        const capturedFolder = currentFolderName;
        const capturedSong = { title: song.title, artist: song.artist };
        li.querySelector('.song-ctx-btn').addEventListener('click', (e) => {
            openSongContextMenu(e, capturedSong, 'detail', { folderName: capturedFolder });
        });

        fragment.appendChild(li);
        newTitles.push(li.querySelector('.marquee-text'));
    });

    songListUI.appendChild(fragment);
    state.itemsDisplayed += batch.length;

    requestAnimationFrame(() => {
        newTitles.forEach(el => applyMarqueeIfNeeded(el));
    });

    if (state.itemsDisplayed < state.songsToRenderGlobal.length) {
        setupInfiniteScroll();
    }
}

function setupInfiniteScroll() {
    if (state.scrollObserver) state.scrollObserver.disconnect();
    state.scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            state.scrollObserver.disconnect();
            renderNextBatch();
        }
    }, { rootMargin: '300px' });
    if (songListUI.lastElementChild) state.scrollObserver.observe(songListUI.lastElementChild);
}

// Exponer globalmente para uso en onclick HTML
window.playSong = playSong;
window.toggleFavorite = toggleFavorite;
window.openModal = openModal;
