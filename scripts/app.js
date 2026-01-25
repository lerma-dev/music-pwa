// --- VARIABLES GLOBALES ---
const folderInput = document.getElementById('folder-input');
const detectedFoldersDiv = document.getElementById('detected-folders');
const songListUI = document.getElementById('song-list');
const favsSongListUI = document.getElementById('favs-song-list');
const favsSongSearch = document.getElementById('favs-song-search');
const PlaySongListUI = document.getElementById('playlist-song');
const audio = document.getElementById('audio-engine');
const loadingOverlay = document.getElementById('loading-overlay');
const playBtn = document.getElementById('play-btn');
const fullPlayBtn = document.getElementById('full-play-btn');
const nextBtn = document.getElementById('next-btn');
const fullNextBtn = document.getElementById('full-next-btn');
const fullPrevBtn = document.getElementById('full-prev-btn');
const songSearch = document.getElementById('song-search');
const progressBar = document.getElementById('progress-bar');
const fullProgressBar = document.getElementById('full-progress-bar');
const progressContainer = document.getElementById('progress-container');
const fullProgressContainer = document.getElementById('full-progress-container');
const trackName = document.getElementById('track-name');
const fullTrackName = document.getElementById('full-track-name');
const artistName = document.getElementById('artist-name');
const FullArtistName =document.getElementById('full-artist-name');

let favorites = [];
let library = {}; 
let selectedSong = null;
let currentQueue = []; 
let currentIndex = -1; 
let playMode = 'list'; 

// --- VARIABLES VIRTUAL SCROLL ---
let songsToRenderGlobal = []; 
let itemsDisplayed = 0;       
const ITEMS_PER_BATCH = 50;   
let scrollObserver;

// --- CONFIGURACIÓN DE indexedDB ---
const dbName = "MusicAppDB";
const storeName = "library_meta";

function openDB() {
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

// --- GUARDAR Y PROCESAR ---
async function saveLibraryToDB(newFiles) {
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
        const total = validFiles.length;
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

async function loadFromDatabase() {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get("current_lib");

    request.onsuccess = () => {
        if (request.result) {
            library = request.result.data;
            renderFolders();
        } else {
            loadingOverlay.style.display = 'none';
        }
    };
}

// --- RENDERIZADO DE CARPETAS ---
function renderFolders() {
    detectedFoldersDiv.innerHTML = '';
    const folderKeys = Object.keys(library);

    if (folderKeys.length === 0) {
        detectedFoldersDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 20px;">No hay carpetas.</p>';
        loadingOverlay.style.display = 'none';
        return;
    }

    folderKeys.forEach(name => {
        const card = document.createElement('div');
        card.className = 'folder-card-grid';
        card.innerHTML = `
            <button class="delete-folder-btn" onclick="deleteFolder('${name}', event)">
                <l-icon name="trash-outline"></l-icon>
            </button>
            <div style="font-size:2rem;"><l-icon name="folder-open"></l-icon></div>
            <div class="f-name">${name}</div>
            <div class="f-count">${library[name].length} canciones</div>`;
        
        card.onclick = () => showDetailView(name);
        detectedFoldersDiv.appendChild(card);
    });

    requestAnimationFrame(() => {
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 300);
    });
}

// --- RENDERIZADO VIRTUAL DE CANCIONES (INFINITE SCROLL) ---
function showDetailView(name) {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'block';
    document.getElementById('current-folder-title').textContent = name;
    currentQueue = library[name];
    songSearch.value = '';
    renderSongs(currentQueue);
}

function renderSongs(songs) {
    songListUI.innerHTML = '';
    songsToRenderGlobal = songs;
    itemsDisplayed = 0;
    renderNextBatch();
}

function renderNextBatch() {
    const fragment = document.createDocumentFragment();
    const currentFolderName = document.getElementById('current-folder-title').textContent;
    const escapedFolder = escapeJS(currentFolderName);
    
    const batch = songsToRenderGlobal.slice(itemsDisplayed, itemsDisplayed + ITEMS_PER_BATCH);
    const newTitles = [];

    batch.forEach((song) => {
        const realIndex = currentQueue.findIndex(s => 
            s.title === song.title && 
            s.artist === song.artist
        );
        const favId = `${currentFolderName}-${song.title}`;
        const isFav = favorites.includes(favId);
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
            <div class="marquee-container" >
                <strong class="marquee-text">${song.title}</strong>
                <span class="song-artist">${song.artist}</span>
            </div>
        </div>
        <button class="fav-btn" onclick="toggleFavorite('${escapedFolder}', '${escapedTitle}', event)">
            <l-icon name="${lerma}" class="${classFav}"></l-icon>
        </button> 
        <button class="fav-btn" onclick="openModal(event, '${escapedTitle}')"> 
            <l-icon name="menu"></l-icon>
        </button>`;
        
        fragment.appendChild(li);
        newTitles.push(li.querySelector('.marquee-text'));
    });

    songListUI.appendChild(fragment);
    itemsDisplayed += batch.length;

    requestAnimationFrame(() => {
        newTitles.forEach(el => applyMarqueeIfNeeded(el));
    });

    if (itemsDisplayed < songsToRenderGlobal.length) {
        setupInfiniteScroll();
    }
}

function setupInfiniteScroll() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            scrollObserver.disconnect();
            renderNextBatch();
        }
    }, { rootMargin: '300px' });
    if (songListUI.lastElementChild) scrollObserver.observe(songListUI.lastElementChild);
}

// --- RENDERIZADO DE FAVORITOS ---
function renderFavorites(searchTerm = "") {
    favsSongListUI.innerHTML = '';
    let allFavs = [];

    // 1. Recolectar todas las canciones marcadas como favoritas de todas las carpetas
    for (const folder in library) {
        library[folder].forEach(song => {
            const favId = `${folder}-${song.title}`;
            if (favorites.includes(favId)) {
                // Guardamos una copia con el nombre de la carpeta para poder reproducirla
                allFavs.push({ ...song, folderName: folder });
            }
        });
    }

    // 2. Aplicar filtro de búsqueda si existe
    if (searchTerm) {
        allFavs = allFavs.filter(s => 
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // 3. Actualizar contador
    document.getElementById('favs-stats-info').textContent = `${allFavs.length} canciones • Favoritos`;

    // 4. Renderizar (Usamos la misma lógica que en renderSongs pero adaptada)
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
        
        // Al hacer clic en el contenedor, buscamos la canción en la cola actual y la reproducimos
        li.querySelector('.song-info-container').onclick = () => {
            currentQueue = allFavs; // La cola ahora son tus favoritos
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

async function toggleFavoriteFromFavs(folder, title, event) {
    event.stopPropagation();
    const favId = `${folder}-${title}`;
    const index = favorites.indexOf(favId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        await saveFavorites();
        renderFavorites(favsSongSearch.value); // Refresca la lista
    }
}

// --- REPRODUCCIÓN ---
function playSong(i) {
    if (i < 0 || i >= currentQueue.length) return;
    currentIndex = i;
    const song = currentQueue[i];

    if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(song.file);
    audio.play().catch(e => console.log("Error:", e));

    trackName.textContent = song.title;
    fullTrackName.textContent = song.title;
    artistName.textContent = song.artist;
    FullArtistName.textContent = song.artist;

    // MOSTRAR VISUALIZADOR
    const defaultIcon = document.getElementById('default-icon');
    const visualizerCanvas = document.getElementById('visualizer');
    
    if (defaultIcon) defaultIcon.style.display = 'none';
    if (visualizerCanvas) visualizerCanvas.style.display = 'block';
    initVisualizer();
    requestAnimationFrame(() => {
        applyMarqueeIfNeeded(trackName);
        applyMarqueeIfNeeded(fullTrackName);
    });

    // MEDIA SESSION API
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: document.getElementById('current-folder-title').textContent,
            artwork: [{ src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
        });
    
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
    }
    updatePlayButtons(true);
}

audio.onloadedmetadata = () => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
        });
    }
}

// --- LÓGICA DE LA BARRA DE PROGRESO ---
audio.ontimeupdate = () => {
    if (isNaN(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    if (fullProgressBar) fullProgressBar.style.width = pct + '%';

    document.getElementById('current-time').textContent = formatTime(audio.currentTime);
    document.getElementById('total-time').textContent = formatTime(audio.duration);
};

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

progressContainer.onclick = (e) => {
    const rect = progressContainer.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

fullProgressContainer.onclick = (e) => {
    const rect = fullProgressContainer.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

// --- UTILIDADES ---
function applyMarqueeIfNeeded(element) {
    if (!element) return;
    const container = element.parentElement;
    element.classList.remove('animate-marquee');
    if (element.scrollWidth > container.clientWidth) {
        element.classList.add('animate-marquee');
    }
}

function escapeJS(str) {
    return str.replace(/'/g, "\\'"); 
}

function togglePlay() {
    if (!audio.src) return;
    audio.paused ? audio.play() : audio.pause();
    updatePlayButtons(!audio.paused);

    // Mostrar u ocultar visualizador
    if(audio.paused){
        document.getElementById('default-icon').style.display = 'block';
        document.getElementById('visualizer').style.display = 'none';
    } else {
        document.getElementById('default-icon').style.display = 'none';
        document.getElementById('visualizer').style.display = 'block';
    }
}

function playNext() {
    let next = (playMode === 'shuffle') ? Math.floor(Math.random() * currentQueue.length) : (currentIndex + 1) % currentQueue.length;
    playSong(next);
}

function playPrev() {
    let prev = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    playSong(prev);
}

function updatePlayButtons(isPlaying) {
    const pIcon = document.getElementById('play-icon');
    const fPIcon = document.getElementById('full-play-icon');
    const name = isPlaying ? 'pause' : 'play';
    if (pIcon) pIcon.setAttribute('name', name);
    if (fPIcon) fPIcon.setAttribute('name', name);
}

// --- FAVORITOS ---
async function saveFavorites() {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    await tx.objectStore(storeName).put({ id: "songs_favs", data: favorites });
}

async function loadFavorites() {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get("songs_favs");

    return new Promise((resolve) => {
        request.onsuccess = () => {
            if (request.result) {
                favorites = request.result.data;
            }
            resolve(); // Avisamos que ya cargaron
        };
        request.onerror = () => resolve();
    });
}

function toggleFavorite(folder, songTitle, event) {
    event.stopPropagation();
    const favId = `${folder}-${songTitle}`;
    
    const index = favorites.indexOf(favId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(favId);
    }
    
    saveFavorites();
    renderSongs(currentQueue); 
}

// --- PLAYLISTS MODAL ---
async function savePlaylist(playlistName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const playlistData = {
        name: playlistName,
        song: [selectedSong]
    };
    const request = store.put({ id: `${playlistName}`, data: playlistData });
    request.onsuccess = () => {
        agregarToast({
            tipo: "Exito",
            titulo: "¡Lista actualizada!",
            descripcion: `Playlist ${playlistName} guardada.`,
            autoClose: true
        });
        closeModal();
        selectedSong = null;
        // Limpiamos el input para la próxima vez
        const input = document.getElementById('playlist-name');
        if (input) input.value = "";
    }
}

function Btn_savePlaylist() {
    const playlist_name = document.getElementById('playlist-name');
    const name =  playlist_name.value.trim();
    if (name === "") {
        closeModal();
        agregarToast({
            tipo: "Error",
            titulo: "¡Ups! Falta el nombre",
            descripcion: `El campo no puede estar vacío`,
            autoClose: false
        });
        return;
    }
    savePlaylist(name);
}

async function renderPlaylist() {
    const container = document.getElementById('existing-playlists-container');
    container.innerHTML = "<h3>Guardar en Playlist</h3>";

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const allItems = request.result;
        const userPlaylists = allItems.filter(item => 
            item.id !== 'current_lib' &&
            item.id !== 'songs_favs'
        );

        if (userPlaylists.length === 0) {
            container.innerHTML = `<p>No hay playlists creadas aún.</p>`;
            return;
        }

        userPlaylists.forEach(playlist => {
            const card = document.createElement('div');
            card.className = 'playlist-card'; 
            card.innerHTML = `
                <span>${playlist.id}</span>
                <small>${playlist.data?.song?.length || 0}</small>
            `;
            card.onclick = () => addSongPlaylist(playlist.id);
            container.appendChild(card);
        });
    };
}

async function addSongPlaylist(playlistId) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    const getReq = store.get(playlistId);
    getReq.onsuccess = () => {
        const playlist = getReq.result;
        
        // Añadimos la canción seleccionada al array
        playlist.data.song.push(selectedSong);

        const updateReq = store.put(playlist);
        updateReq.onsuccess = () => {
            closeModal();
            agregarToast({
                tipo: "Exito",
                titulo: "¡Listo!",
                descripcion: `Guardada en ${playlistId}.`,
                autoClose: true
            });
        };

        updateReq.onerror = () => {
            agregarToast({
                tipo: "Error",
                titulo: "¡Error!",
                descripcion: "No se pudo guardar.",
                autoClose: false
            });
        };
    };
}

// --- PLAYLISTS  ---
async function savePlay(playlistName) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const playlistData = {
        name: playlistName,
        song: []
    };
    const request = store.put({ id: `${playlistName}`, data: playlistData });
    request.onsuccess = () => {
        agregarToast({
            tipo: "Exito",
            titulo: "¡Lista actualizada!",
            descripcion: `Playlist ${playlistName} guardada.`,
            autoClose: true
        });
        renderAllPlaylists();
        closeModalView();
        selectedSong = null;
        const input = document.getElementById('playlist-name-view');
        if (input) input.value = "";
    }
}

function Btn_savePlay() {
    const playlist_name = document.getElementById('playlist-name-view');
    const name =  playlist_name.value.trim();
    if (name === "") {
        closeModalView();
        agregarToast({
            tipo: "Error",
            titulo: "¡Ups! Falta el nombre",
            descripcion: `El campo no puede estar vacío`,
            autoClose: false
        });
        return;
    }
    savePlay(name);
}

async function renderAllPlaylists() {
    const container = document.getElementById('created-playlists');
    if (!container) return;

    container.innerHTML = ""; // Limpiamos duplicados

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly"); // Usamos tu variable storeName
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const allItems = request.result;

        // FILTRO: Solo las que NO sean 'current_lib' ni 'songs_favs'
        const userPlaylists = allItems.filter(item => 
            item.id !== 'current_lib' && item.id !== 'songs_favs'
        );

        if (userPlaylists.length === 0) {
            container.innerHTML = `
                <p style="margin: auto; text-align: center; color: #888; margin-top: 20px;">
                    Aún no has creado ninguna playlist.
                </p>`;
            return;
        }

        userPlaylists.forEach(playlist => {
            const count = playlist.data?.song?.length || 0;

            const card = document.createElement('div');
            card.className = 'folder-card-grid';

            card.innerHTML = `
                <div style="font-size:2rem;">
                    <l-icon name="musical-notes"></l-icon>
                </div>
                <div class="f-name">${playlist.id}</div>
                <div class="f-count">${count} canciones</div>`;

            /* Acción al hacer clic para ver canciones (por implementar) */
            card.onclick = () => {
                showFullPlaylist();
                renderSongPlaylist(playlist.id);
            };
            
            container.appendChild(card);
        });
    };
}

async function renderSongPlaylist(playlistId, filterText = "") {
    PlaySongListUI.innerHTML = ''; // Limpiar lista

    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(playlistId);

    request.onsuccess = () => {
        const playlist = request.result;

        // Validar si la playlist existe y tiene canciones
        if (!playlist || !playlist.data || !playlist.data.song || playlist.data.song.length === 0) {
            PlaySongListUI.innerHTML = '<p style="text-align:center; padding:20px; color: #888;">Esta playlist no tiene canciones aún.</p>';
            document.getElementById('play-stats-info').textContent = `${playlistId} • 0 canciones`;
            return;
        }

        let canciones = playlist.data.song;

        if (filterText) {
            const term = filterText.toLowerCase();
            canciones = canciones.filter(song => 
                (song.title || "").toLowerCase().includes(term) || 
                (song.artist || "").toLowerCase().includes(term)
            );
        }

        if (filterText && filterText.trim() !== "") {
            const term = filterText.toLowerCase().trim();
            canciones = canciones.filter(song => 
                (song.title || "").toLowerCase().includes(term) || 
                (song.artist || "").toLowerCase().includes(term)
            );
        }

        // Actualizamos el contador con el número de canciones filtradas
        document.getElementById('play-stats-info').textContent = `${playlistId} • ${canciones.length} canciones`;

        if (canciones.length === 0) {
            PlaySongListUI.innerHTML = '<p style="text-align:center; padding:20px; color: #888;">No se encontraron coincidencias.</p>';
            return;
        }

        // 3. Renderizar las canciones reales
        const fragment = document.createDocumentFragment();
        
        canciones.forEach((song) => {
            const RealIndex = playlist.data.song.indexOf(song);
            const li = document.createElement('li');
            li.className = 'song-item';
            
            // Escapamos los datos para evitar errores con comillas
            const escapedTitle = escapeJS(song.title);

            li.innerHTML = `
            <div class="song-info-container" onclick="playSongFromPlaylist('${playlistId}', ${RealIndex})">
                <div class="album-art-placeholder">
                    <l-icon name="musical-note"></l-icon>
                </div>
                <div class="marquee-container">
                    <strong class="marquee-text">${song.title}</strong>
                    <span class="song-artist">${song.artist || "Artista desconocido"}</span>
                </div>
            </div>
            <button class="fav-btn"> 
                <l-icon name="menu"></l-icon>
            </button>`;

            fragment.appendChild(li);
        });

        PlaySongListUI.appendChild(fragment);
    };
}

document.getElementById('play-song-search').addEventListener('input', (e) => {
    const textoBusqueda = e.target.value;
    
    // Obtenemos el nombre de la playlist actual del texto de 'play-stats-info'
    // que suele tener el formato "NombrePlaylist • X canciones"
    const currentStats = document.getElementById('play-stats-info').textContent;
    const playlistIdActual = currentStats.split(' • ')[0];

    if (playlistIdActual) {
        renderSongPlaylist(playlistIdActual, textoBusqueda);
    }
});

async function playSongFromPlaylist(playlistId, index) {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(playlistId);

    request.onsuccess = () => {
        const playlist = request.result;
        if (playlist && playlist.data && playlist.data.song) {
            // 1. Actualizamos la cola global de reproducción
            currentQueue = playlist.data.song; 
            
            // 2. Iniciamos la canción seleccionada por su índice
            setTimeout(() => {
                playSong(index);
            }, 0);
        }
    };
}

// --- VISUALIZADOR ---
let audioCtx, analyser, source;
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function initVisualizer() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.AudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;
    draw();
}

function draw() {
    requestAnimationFrame(draw);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgba(240, 201, 165, ${barHeight / 100})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// --- ELIMINACIÓN Y LIMPIEZA ---
async function deleteFolder(folderName, event) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar "${folderName}"?`)) return;
    delete library[folderName];
    const db = await openDB();
    await db.transaction(storeName, "readwrite").objectStore(storeName).put({ id: "current_lib", data: library });
    renderFolders();
}

const clearDbBtn = document.getElementById('clear-db-btn');
clearDbBtn.onclick = async () => {
    if (!confirm("¿Borrar toda la base de datos?")) return;
    const db = await openDB();
    await db.transaction(storeName, "readwrite").objectStore(storeName).delete("current_lib");
    location.reload();
};

// --- EVENTOS INICIALES ---
function openModal(event, songTitle) {
    event.stopPropagation();
    const modal = document.getElementById('playlist-modal');
    const body = document.body;
    modal.style.display = 'flex';
    body.style.overflow = 'hidden';
    selectedSong = currentQueue.find(s => s.title === songTitle);
    renderPlaylist();
}

function closeModal() {
    const modal = document.getElementById('playlist-modal');
    const body = document.body;
    modal.style.display = 'none';
    body.style.overflow = 'auto';
}

function openModalView() {
    const modal = document.getElementById('playlist-modal-view');
    const body = document.body;
    modal.style.display = 'flex';
    body.style.overflow = 'hidden';
}

function closeModalView() {
    const modal = document.getElementById('playlist-modal-view');
    const body = document.body;
    modal.style.display = 'none';
    body.style.overflow = 'auto';
}

function showMainView() { 
    document.getElementById('view-main').style.display = 'block'; 
    document.getElementById('view-detail').style.display = 'none'; 
    document.getElementById('view-songs-favs').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'none';
}

function showFavoritesView() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-songs-favs').style.display = 'block';

    renderFavorites();
}

function showPlaylistsView() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'block';
    document.getElementById('view-playlist-full').style.display = 'none';

    renderAllPlaylists();
}

function showFullPlaylist() {
    document.getElementById('view-main').style.display = 'none';
    document.getElementById('view-detail').style.display = 'none';
    document.getElementById('view-playlist').style.display = 'none';
    document.getElementById('view-playlist-full').style.display = 'block';

    // body scroll lock
    document.body.style.overflow = 'auto';
}

function showFullPlayer() { 
    document.getElementById('view-player-full').classList.add('active'); 
    document.querySelector('.mini-player').style.display = 'none'; 
    // body scroll lock
    document.body.style.overflow = 'hidden';
}

function hideFullPlayer() { 
    document.getElementById('view-player-full').classList.remove('active'); 
    document.querySelector('.mini-player').style.display = 'block'; 
    // body scroll unlock
    document.body.style.overflow = 'auto';
}

folderInput.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) saveLibraryToDB(files);
};

songSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filteredSongs = currentQueue.filter(song => 
        song.title.toLowerCase().includes(term) || 
        song.artist.toLowerCase().includes(term)
    );
    renderSongs(filteredSongs);
});

window.onload = async () => {
    await loadFavorites();
    loadFromDatabase();
};

playBtn.onclick = (e) => { 
    e.stopPropagation(); 
    togglePlay(); 
};

nextBtn.onclick = (e) => { 
    e.stopPropagation(); 
    playNext(); 
};

fullNextBtn.onclick = playNext;
fullPlayBtn.onclick = togglePlay;
fullPrevBtn.onclick = playPrev;
audio.onended = playNext;
