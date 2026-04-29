// backup.js — Sistema de respaldos de Music
import { state } from './state.js';
import { openDB, storeName } from '../db/database.js';
import { agregarToast } from '../components/toast.js';

const KEYS = {
  LAST_BACKUP:  'music_last_backup_date',
  LAST_VERSION: 'music_last_known_version',
};

const APP_NAME    = 'Music';
const APP_VERSION = localStorage.getItem('appVersion') ?? '0.0.0';
const DAYS_LIMIT  = 15;

// ─── Comparación de fechas ────────────────────────────────────────────────────

function daysSince(timestampMs) {
  if (!timestampMs) return Infinity;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((Date.now() - timestampMs) / MS_PER_DAY);
}

// ─── Chequeo recordatorio 15 días ────────────────────────────────────────────

export function checkBackupReminder() {
  const lastBackup = Number(localStorage.getItem(KEYS.LAST_BACKUP));
  const elapsed    = daysSince(lastBackup);
  if (elapsed < DAYS_LIMIT) return;

  const descripcion = lastBackup
    ? `Han pasado ${elapsed} días desde tu último respaldo.`
    : 'Nunca has realizado un respaldo de tus datos.';

  agregarToast({
    tipo: 'Error',
    titulo: '¡Respaldo pendiente!',
    descripcion,
    autoClose: false,
  });
}

// ─── Chequeo de cambio de versión ────────────────────────────────────────────

export function checkVersionChange() {
  const savedVersion = localStorage.getItem(KEYS.LAST_VERSION);
  if (savedVersion && savedVersion !== APP_VERSION) {
    agregarToast({
      tipo: 'Error',
      titulo: `Music actualizado a v${APP_VERSION}`,
      descripcion: `Versión anterior: v${savedVersion}. Exporta tus datos para proteger favoritos y playlists.`,
      autoClose: false,
    });
  }
  localStorage.setItem(KEYS.LAST_VERSION, APP_VERSION);
}

// ─── Exportar respaldo ────────────────────────────────────────────────────────

export async function exportBackup() {
  try {
    const library   = state.library   ?? {};
    const favorites = state.favorites ?? [];  // array de strings "folder-title"
    const playlists = await getAllPlaylists();

    const librarySongCount  = Object.values(library).reduce((acc, s) => acc + s.length, 0);
    const playlistSongCount = playlists.reduce((acc, pl) => acc + (pl.data?.song?.length ?? 0), 0);
    const totalSongs        = librarySongCount + favorites.length + playlistSongCount;

    const now      = new Date();
    const dateStr  = now.toISOString().slice(0, 10);
    const fileName = `Music_Backup_${dateStr}_${totalSongs}songs.json`;

    const payload = {
      _meta: {
        app:       APP_NAME,
        version:   APP_VERSION,
        createdAt: now.toISOString(),
        counters: {
          library:   librarySongCount,
          favorites: favorites.length,
          playlists: playlists.length,
          totalSongs,
        },
      },
      // Favoritos: array de strings "folder-title" — formato exacto de la app
      favorites,
      // Playlists: estructura exacta de IndexedDB, sin el objeto File (no serializable)
      playlists: playlists.map(pl => ({
        id:   pl.id,
        data: {
          name: pl.data?.name ?? pl.id,
          // Cada canción guarda title + artist; el File se re-vincula al reimportar música
          song: (pl.data?.song ?? []).map(({ title, artist }) => ({ title, artist })),
        },
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    localStorage.setItem(KEYS.LAST_BACKUP, String(Date.now()));

    agregarToast({
      tipo: 'Exito',
      titulo: 'Respaldo creado',
      descripcion: `${fileName} descargado.`,
      autoClose: true,
    });

  } catch (err) {
    agregarToast({
      tipo: 'Error',
      titulo: 'Error al exportar',
      descripcion: err.message,
      autoClose: false,
    });
  }
}

// ─── Importar respaldo ────────────────────────────────────────────────────────

export async function importBackup(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validar que el archivo pertenece a Music
    if (data._meta?.app !== APP_NAME) {
      throw new Error('El archivo no es un respaldo válido de Music.');
    }

    const db = await openDB();

    if (Array.isArray(data.favorites)) {
      await dbPut(db, { id: 'songs_favs', data: data.favorites });
      state.favorites = [...data.favorites];
    }

    if (Array.isArray(data.playlists)) {
      for (const playlist of data.playlists) {
        await dbPut(db, {
          id:   playlist.id,
          data: {
            name: playlist.data?.name ?? playlist.id,
            song: playlist.data?.song ?? [],
          },
        });
      }
    }

    localStorage.setItem(KEYS.LAST_BACKUP, String(Date.now()));

    const favCount      = data.favorites?.length  ?? 0;
    const playlistCount = data.playlists?.length  ?? 0;

    agregarToast({
      tipo: 'Exito',
      titulo: 'Backup restaurado',
      descripcion: `${favCount} favoritos y ${playlistCount} playlists recuperados. Agrega tu música para reproducirlas.`,
      autoClose: false,
    });

    // Refrescar UI de playlists
    import('../components/playlists.js')
      .then(({ renderAllPlaylists }) => renderAllPlaylists());

    // Refrescar UI de favoritos (aparecerán vacíos hasta que se cargue la música)
    import('../components/favorites.js')
      .then(({ renderFavorites }) => renderFavorites());

  } catch (err) {
    agregarToast({
      tipo: 'Error',
      titulo: 'Error al importar',
      descripcion: err.message,
      autoClose: false,
    });
  }
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

function getAllPlaylists() {
  return new Promise(async (resolve, reject) => {
    try {
      const db    = await openDB();
      const tx    = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req   = store.getAll();
      req.onsuccess = () => {
        const playlists = req.result.filter(
          item => item.id !== 'current_lib' && item.id !== 'songs_favs'
        );
        resolve(playlists);
      };
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

function dbPut(db, record) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req   = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
