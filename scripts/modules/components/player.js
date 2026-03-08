import { state } from '../utils/state.js';
import { applyMarqueeIfNeeded } from '../utils/helpers.js';

// --- VISUALIZADOR ---
let audioCtx, analyser, source;
let canvas, canvasCtx;

// --- REFERENCIAS DOM (se asignan en initPlayer, después de loadViews) ---
let audio, trackName, fullTrackName, artistName, FullArtistName;
let progressBar, fullProgressBar, progressContainer, fullProgressContainer;
let playBtn, fullPlayBtn, nextBtn, fullNextBtn, fullPrevBtn;

export function initPlayer() {
    audio = document.getElementById('audio-engine');
    trackName = document.getElementById('track-name');
    fullTrackName = document.getElementById('full-track-name');
    artistName = document.getElementById('artist-name');
    FullArtistName = document.getElementById('full-artist-name');
    progressBar = document.getElementById('progress-bar');
    fullProgressBar = document.getElementById('full-progress-bar');
    progressContainer = document.getElementById('progress-container');
    fullProgressContainer = document.getElementById('full-progress-container');
    playBtn = document.getElementById('play-btn');
    fullPlayBtn = document.getElementById('full-play-btn');
    nextBtn = document.getElementById('next-btn');
    fullNextBtn = document.getElementById('full-next-btn');
    fullPrevBtn = document.getElementById('full-prev-btn');
    canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');

    // Botones
    playBtn.onclick     = (e) => { e.stopPropagation(); togglePlay(); };
    nextBtn.onclick     = (e) => { e.stopPropagation(); playNext(); };
    fullNextBtn.onclick = playNext;
    fullPlayBtn.onclick = togglePlay;
    fullPrevBtn.onclick = playPrev;
    audio.onended       = playNext;

    // Progreso
    audio.ontimeupdate = () => {
        if (isNaN(audio.duration)) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (progressBar)     progressBar.style.width     = pct + '%';
        if (fullProgressBar) fullProgressBar.style.width = pct + '%';
        document.getElementById('current-time').textContent = formatTime(audio.currentTime);
        document.getElementById('total-time').textContent   = formatTime(audio.duration);
    };

    audio.onloadedmetadata = () => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setPositionState({
                duration:     audio.duration,
                playbackRate: audio.playbackRate,
                position:     audio.currentTime
            });
        }
    };

    progressContainer.onclick = (e) => {
        const rect = progressContainer.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    };

    fullProgressContainer.onclick = (e) => {
        const rect = fullProgressContainer.getBoundingClientRect();
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    };
}

// --- VISUALIZADOR ---
export function initVisualizer() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.AudioContext)();
    analyser = audioCtx.createAnalyser();
    source   = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;
    draw();
}

function draw() {
    requestAnimationFrame(draw);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] / 2;
        // Gradiente por barra: violeta → rosa
        const ratio = i / bufferLength;
        const r = Math.round(167 + (232 - 167) * ratio);
        const g = Math.round(139 + (121 - 139) * ratio);
        const b = Math.round(250 + (249 - 250) * ratio);
        canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + (barHeight / 128) * 0.7})`;
        // Barras redondeadas en la punta
        const bx = x;
        const by = canvas.height - barHeight;
        const bw = Math.max(barWidth - 1, 1);
        const bh = barHeight;
        const radius = Math.min(4, bw / 2);
        canvasCtx.beginPath();
        canvasCtx.moveTo(bx + radius, by);
        canvasCtx.lineTo(bx + bw - radius, by);
        canvasCtx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
        canvasCtx.lineTo(bx + bw, by + bh);
        canvasCtx.lineTo(bx, by + bh);
        canvasCtx.lineTo(bx, by + radius);
        canvasCtx.quadraticCurveTo(bx, by, bx + radius, by);
        canvasCtx.closePath();
        canvasCtx.fill();
        x += barWidth + 1;
    }
}

// --- REPRODUCCIÓN ---
export function playSong(i) {
    if (i < 0 || i >= state.currentQueue.length) return;
    state.currentIndex = i;
    const song = state.currentQueue[i];

    if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(song.file);
    audio.play().catch(e => console.log("Error:", e));

    trackName.textContent      = song.title;
    fullTrackName.textContent  = song.title;
    artistName.textContent     = song.artist;
    FullArtistName.textContent = song.artist;

    const defaultIcon      = document.getElementById('default-icon');
    const visualizerCanvas = document.getElementById('visualizer');
    if (defaultIcon)      defaultIcon.style.display      = 'none';
    if (visualizerCanvas) visualizerCanvas.style.display = 'block';
    initVisualizer();

    requestAnimationFrame(() => {
        applyMarqueeIfNeeded(trackName);
        applyMarqueeIfNeeded(fullTrackName);
    });

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title:   song.title,
            artist:  song.artist,
            album:   document.getElementById('current-folder-title').textContent,
            artwork: [{ src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
        });

        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);

        // ✅ Android bridge (solo se ejecuta si está en la app, no afecta la web)
        if (window.AndroidMedia) {
            fetch('assets/icons/icon-512.png')
                .then(r => r.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result.split(',')[1];
                        AndroidMedia.updateMetadata(
                            song.title,
                            song.artist,
                            document.getElementById('current-folder-title').textContent,
                            base64
                        );
                    };
                    reader.readAsDataURL(blob);
                });
        }
    }

    // Cuando reproduces
    if (window.AndroidMedia) AndroidMedia.setPlaying(true);

    updatePlayButtons(true);
}

export function playNext() {
    const next = (state.playMode === 'shuffle')
        ? Math.floor(Math.random() * state.currentQueue.length)
        : (state.currentIndex + 1) % state.currentQueue.length;
    playSong(next);
}

export function playPrev() {
    const prev = (state.currentIndex - 1 + state.currentQueue.length) % state.currentQueue.length;
    playSong(prev);
}

export function togglePlay() {
    if (!audio.src) return;
    audio.paused ? audio.play() : audio.pause();

    if (window.AndroidMedia) AndroidMedia.setPlaying(!audio.paused);

    updatePlayButtons(!audio.paused);
    document.getElementById('default-icon').style.display = audio.paused ? 'block' : 'none';
    document.getElementById('visualizer').style.display   = audio.paused ? 'none'  : 'block';
}

export function updatePlayButtons(isPlaying) {
    const pIcon  = document.getElementById('play-icon');
    const fPIcon = document.getElementById('full-play-icon');
    const name   = isPlaying ? 'pause' : 'play';
    if (pIcon)  pIcon.setAttribute('name',  name);
    if (fPIcon) fPIcon.setAttribute('name', name);
}

function formatTime(s) {
    const m  = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}