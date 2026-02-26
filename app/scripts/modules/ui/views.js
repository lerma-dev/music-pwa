import { state } from '../utils/state.js';
import { renderSongs } from '../components/songs.js';
import { renderFavorites } from '../components/favorites.js';
import { renderAllPlaylists } from '../components/playlists.js';

export const loadingOverlay = document.getElementById('loading-overlay');
const songSearch = document.getElementById('song-search');

export function showDetailView(name) {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'block';
    document.getElementById('current-folder-title').textContent = name;
    state.currentQueue = state.library[name];
    songSearch.value = '';
    renderSongs(state.currentQueue);
}

export function showMainView() {
    document.getElementById('view-main').style.display = 'block';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-songs-favs').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'none';
}

export function showFavoritesView() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-songs-favs').style.display = 'block';
    renderFavorites();
}

export function showPlaylistsView() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'block';
    document.getElementById('view-playlist-full').style.display = 'none';
    renderAllPlaylists();
}

export function showFullPlaylist() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'none';
    document.getElementById('view-playlist-full').style.display = 'block';
    document.body.style.overflow = 'auto';
}

export function showFullPlayer() {
    document.getElementById('view-player-full').classList.add('active');
    document.querySelector('.mini-player').style.display = 'none';
    document.body.style.overflow = 'hidden';
}

export function hideFullPlayer() {
    document.getElementById('view-player-full').classList.remove('active');
    document.querySelector('.mini-player').style.display = 'block';
    document.body.style.overflow = 'auto';
}

// Exponer globalmente
window.showMainView = showMainView;
window.showFavoritesView = showFavoritesView;
window.showPlaylistsView = showPlaylistsView;
window.showFullPlaylist = showFullPlaylist;
window.showFullPlayer = showFullPlayer;
window.hideFullPlayer = hideFullPlayer;

// Búsqueda de canciones
songSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filteredSongs = state.currentQueue.filter(song =>
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term)
    );
    renderSongs(filteredSongs);
});
