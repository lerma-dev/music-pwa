import { state } from '../utils/state.js';
import { renderSongs } from '../components/songs.js';
import { renderFavorites } from '../components/favorites.js';
import { renderAllPlaylists } from '../components/playlists.js';
import { updateSidebarNav } from './sidebar.js';

export const loadingOverlay = document.getElementById('loading-overlay');
const songSearch = document.getElementById('song-search');

function isDesktop() {
    return window.innerWidth >= 1024;
}

// En desktop: hide todas las secciones de contenido, luego muestra la indicada
function hideAllViews() {
    ['view-main','view-detail','view-songs-favs','view-playlist','view-playlist-full'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

export function showDetailView(name) {
    hideAllViews();
    document.getElementById('view-detail').style.display = 'block';
    document.getElementById('current-folder-title').textContent = name;
    state.currentQueue = state.library[name];
    songSearch.value = '';
    renderSongs(state.currentQueue);
    updateSidebarNav('main');
}

export function showMainView() {
    hideAllViews();
    document.getElementById('view-main').style.display = 'block';
    updateSidebarNav('main');
}

export function showFavoritesView() {
    hideAllViews();
    document.getElementById('view-songs-favs').style.display = 'block';
    renderFavorites();
    updateSidebarNav('favs');
}

export function showPlaylistsView() {
    hideAllViews();
    document.getElementById('view-playlist').style.display = 'block';
    renderAllPlaylists();
    updateSidebarNav('playlists');
}

export function showFullPlaylist() {
    hideAllViews();
    document.getElementById('view-playlist-full').style.display = 'block';
    document.body.style.overflow = 'auto';
    updateSidebarNav('playlists');
}

export function showFullPlayer() {
    if (isDesktop()) return; // en desktop el player siempre está visible
    document.getElementById('view-player-full').classList.add('active');
    const mini = document.querySelector('.mini-player');
    if (mini) mini.style.display = 'none';
    document.body.style.overflow = 'hidden';
}

export function hideFullPlayer() {
    if (isDesktop()) return;
    document.getElementById('view-player-full').classList.remove('active');
    const mini = document.querySelector('.mini-player');
    if (mini) mini.style.display = 'block';
    document.body.style.overflow = 'auto';
}

// Exponer globalmente
window.showMainView      = showMainView;
window.showDetailView    = showDetailView;
window.showFavoritesView = showFavoritesView;
window.showPlaylistsView = showPlaylistsView;
window.showFullPlaylist  = showFullPlaylist;
window.showFullPlayer    = showFullPlayer;
window.hideFullPlayer    = hideFullPlayer;

// Búsqueda de canciones
songSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filteredSongs = state.currentQueue.filter(song =>
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term)
    );
    renderSongs(filteredSongs);
});

// Resize: si se pasa a desktop ocultar el full player overlay
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        const fp = document.getElementById('view-player-full');
        if (fp) fp.classList.remove('active');
        const mini = document.querySelector('.mini-player');
        if (mini) mini.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
