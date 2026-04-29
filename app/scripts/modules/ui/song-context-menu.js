/**
 * song-context-menu.js
 * Menú contextual de tres puntitos para canciones.
 * Funciona en view-detail (carpeta) y view-playlist-full (playlist).
 */

import { state } from '../utils/state.js';
import { openDB, storeName } from '../db/database.js';
import { agregarToast } from '../components/toast.js';
import { renderSongs } from '../components/songs.js';
import { renderSongPlaylist } from '../components/playlists.js';
import { openModal } from './modals.js';

// ── Estado interno del menú ──────────────────────────────────────────────────
const _ctx = {
    song: null,          // objeto { title, artist }
    context: null,       // 'detail' | 'playlist'
    playlistId: null,    // sólo cuando context === 'playlist'
    songIndexInFolder: null,  // índice en state.library[folder] para context==='detail'
    folderName: null,    // sólo cuando context === 'detail'
};

// ── Referencias DOM ──────────────────────────────────────────────────────────
const menu      = document.getElementById('song-context-menu');
const overlay   = document.getElementById('song-ctx-overlay');
const editBtn   = document.getElementById('ctx-edit-btn');
const deleteBtn = document.getElementById('ctx-delete-btn');
const deleteLabel = document.getElementById('ctx-delete-label');
const playlistBtn = document.getElementById('ctx-playlist-btn');

// ── Abrir menú ───────────────────────────────────────────────────────────────
export function openSongContextMenu(event, song, context, extra = {}) {
    event.stopPropagation();

    _ctx.song         = song;
    _ctx.context      = context;
    _ctx.playlistId   = extra.playlistId   ?? null;
    _ctx.folderName   = extra.folderName   ?? null;
    _ctx.songIndexInFolder = extra.songIndex ?? null;

    // Configurar etiquetas según contexto
    if (context === 'playlist') {
        deleteLabel.textContent = 'Eliminar de playlist';
        playlistBtn.style.display = 'none';
    } else {
        deleteLabel.textContent = 'Eliminar canción';
        playlistBtn.style.display = 'flex';
    }

    // Posicionar el menú junto al botón
    const rect = event.currentTarget.getBoundingClientRect();
    const menuW = 190;
    let left = rect.right - menuW;
    let top  = rect.bottom + 4;

    // Evitar que salga de la pantalla
    if (left < 8) left = 8;
    if (top + 150 > window.innerHeight) top = rect.top - 150;

    menu.style.left = `${left}px`;
    menu.style.top  = `${top}px`;
    menu.style.display = 'block';

    // Forzar reflow para la animación
    menu.offsetHeight; // eslint-disable-line no-unused-expressions
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');

    overlay.style.display = 'block';
}

function closeContextMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    overlay.style.display = 'none';
    setTimeout(() => { menu.style.display = 'none'; }, 200);
}

overlay.addEventListener('click', closeContextMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeContextMenu(); });

// ── Acción: Editar datos ─────────────────────────────────────────────────────
editBtn.addEventListener('click', () => {
    closeContextMenu();
    openEditSongModal(_ctx.song);
});

// ── Acción: Agregar a playlist (sólo view-detail) ────────────────────────────
playlistBtn.addEventListener('click', (e) => {
    closeContextMenu();
    // Reutilizamos el modal existente de playlists
    state.selectedSong = _ctx.song;
    openModal(e, _ctx.song.title);
});

// ── Acción: Eliminar ─────────────────────────────────────────────────────────
deleteBtn.addEventListener('click', () => {
    closeContextMenu();
    const msg = _ctx.context === 'playlist'
        ? `¿Seguro que quieres eliminar "${_ctx.song.title}" de esta playlist?`
        : `¿Seguro que quieres eliminar "${_ctx.song.title}" de la carpeta?`;
    openConfirmDeleteModal(msg, handleDelete);
});

async function handleDelete() {
    if (_ctx.context === 'playlist') {
        await deleteSongFromPlaylist();
    } else {
        await deleteSongFromFolder();
    }
}

async function deleteSongFromPlaylist() {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.get(_ctx.playlistId);

    req.onsuccess = () => {
        const playlist = req.result;
        if (!playlist?.data?.song) return;

        // Eliminar por título+artista
        playlist.data.song = playlist.data.song.filter(s =>
            !(s.title === _ctx.song.title && s.artist === _ctx.song.artist)
        );

        store.put(playlist).onsuccess = () => {
            agregarToast({ tipo: 'Exito', titulo: '¡Eliminada!', descripcion: `"${_ctx.song.title}" eliminada de la playlist.`, autoClose: true });
            renderSongPlaylist(_ctx.playlistId);
        };
    };
}

async function deleteSongFromFolder() {
    const folder = _ctx.folderName;
    if (!folder || !state.library[folder]) return;

    state.library[folder] = state.library[folder].filter(s =>
        !(s.title === _ctx.song.title && s.artist === _ctx.song.artist)
    );

    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put({ id: 'current_lib', data: state.library });

    tx.oncomplete = () => {
        agregarToast({ tipo: 'Exito', titulo: '¡Eliminada!', descripcion: `"${_ctx.song.title}" eliminada.`, autoClose: true });
        // Re-renderizar la vista de detalle
        const songs = state.library[folder] || [];
        state.currentQueue = songs;
        renderSongs(songs);
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Editar Datos
// ═══════════════════════════════════════════════════════════════════════════════
const editModal   = document.getElementById('edit-song-modal');
const editTitle   = document.getElementById('edit-song-title');
const editArtist  = document.getElementById('edit-song-artist');

function openEditSongModal(song) {
    editTitle.value  = song.title  || '';
    editArtist.value = song.artist || '';
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => editTitle.focus(), 100);
}

export function closeEditSongModal() {
    editModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

export async function saveEditSong() {
    const newTitle  = editTitle.value.trim();
    const newArtist = editArtist.value.trim();

    if (!newTitle) {
        agregarToast({ tipo: 'Error', titulo: 'Nombre requerido', descripcion: 'El nombre de la canción no puede estar vacío.', autoClose: false });
        return;
    }

    if (_ctx.context === 'playlist') {
        await editSongInPlaylist(newTitle, newArtist);
    } else {
        await editSongInFolder(newTitle, newArtist);
    }

    closeEditSongModal();
}

async function editSongInPlaylist(newTitle, newArtist) {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.get(_ctx.playlistId);

    req.onsuccess = () => {
        const playlist = req.result;
        if (!playlist?.data?.song) return;

        playlist.data.song = playlist.data.song.map(s => {
            if (s.title === _ctx.song.title && s.artist === _ctx.song.artist) {
                return { ...s, title: newTitle, artist: newArtist };
            }
            return s;
        });

        store.put(playlist).onsuccess = () => {
            agregarToast({ tipo: 'Exito', titulo: '¡Guardado!', descripcion: 'Datos de la canción actualizados.', autoClose: true });
            _ctx.song = { ..._ctx.song, title: newTitle, artist: newArtist };
            renderSongPlaylist(_ctx.playlistId);
        };
    };
}

async function editSongInFolder(newTitle, newArtist) {
    const folder = _ctx.folderName;
    if (!folder || !state.library[folder]) return;

    state.library[folder] = state.library[folder].map(s => {
        if (s.title === _ctx.song.title && s.artist === _ctx.song.artist) {
            return { ...s, title: newTitle, artist: newArtist };
        }
        return s;
    });

    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put({ id: 'current_lib', data: state.library });

    tx.oncomplete = () => {
        agregarToast({ tipo: 'Exito', titulo: '¡Guardado!', descripcion: 'Datos de la canción actualizados.', autoClose: true });
        _ctx.song = { ..._ctx.song, title: newTitle, artist: newArtist };
        const songs = state.library[folder] || [];
        state.currentQueue = songs;
        renderSongs(songs);
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL: Confirmar Eliminación
// ═══════════════════════════════════════════════════════════════════════════════
const confirmModal  = document.getElementById('confirm-delete-modal');
const confirmMsg    = document.getElementById('confirm-delete-msg');
const confirmOkBtn  = document.getElementById('confirm-delete-ok');

let _pendingDeleteFn = null;

function openConfirmDeleteModal(msg, onConfirm) {
    confirmMsg.textContent = msg;
    _pendingDeleteFn = onConfirm;
    confirmModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

export function closeConfirmDeleteModal() {
    confirmModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    _pendingDeleteFn = null;
}

confirmOkBtn.addEventListener('click', async () => {
    if (_pendingDeleteFn) await _pendingDeleteFn();
    closeConfirmDeleteModal();
});

// ── Exponer globalmente ───────────────────────────────────────────────────────
window.openSongContextMenu   = openSongContextMenu;
window.closeEditSongModal    = closeEditSongModal;
window.saveEditSong          = saveEditSong;
window.closeConfirmDeleteModal = closeConfirmDeleteModal;
