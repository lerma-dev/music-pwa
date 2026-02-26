import { state } from '../utils/state.js';
import { applyMarqueeIfNeeded } from '../utils/helpers.js';

const audio = document.getElementById('audio-engine');
const trackName = document.getElementById('track-name');
const fullTrackName = document.getElementById('full-track-name');
const artistName = document.getElementById('artist-name');
const FullArtistName = document.getElementById('full-artist-name');
const progressBar = document.getElementById('progress-bar');
const fullProgressBar = document.getElementById('full-progress-bar');
const progressContainer = document.getElementById('progress-container');
const fullProgressContainer = document.getElementById('full-progress-container');
const playBtn = document.getElementById('play-btn');
const fullPlayBtn = document.getElementById('full-play-btn');
const nextBtn = document.getElementById('next-btn');
const fullNextBtn = document.getElementById('full-next-btn');
const fullPrevBtn = document.getElementById('full-prev-btn');

// --- VISUALIZADOR ---
let audioCtx, analyser, source;
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

export function initVisualizer() {
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

// --- REPRODUCCIÓN ---
export function playSong(i) {
    if (i < 0 || i >= state.currentQueue.length) return;
    state.currentIndex = i;
    const song = state.currentQueue[i];

    if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(song.file);
    audio.play().catch(e => console.log("Error:", e));

    trackName.textContent = song.title;
    fullTrackName.textContent = song.title;
    artistName.textContent = song.artist;
    FullArtistName.textContent = song.artist;

    const defaultIcon = document.getElementById('default-icon');
    const visualizerCanvas = document.getElementById('visualizer');
    if (defaultIcon) defaultIcon.style.display = 'none';
    if (visualizerCanvas) visualizerCanvas.style.display = 'block';
    initVisualizer();

    requestAnimationFrame(() => {
        applyMarqueeIfNeeded(trackName);
        applyMarqueeIfNeeded(fullTrackName);
    });

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

export function playNext() {
    let next = (state.playMode === 'shuffle')
        ? Math.floor(Math.random() * state.currentQueue.length)
        : (state.currentIndex + 1) % state.currentQueue.length;
    playSong(next);
}

export function playPrev() {
    let prev = (state.currentIndex - 1 + state.currentQueue.length) % state.currentQueue.length;
    playSong(prev);
}

export function togglePlay() {
    if (!audio.src) return;
    audio.paused ? audio.play() : audio.pause();
    updatePlayButtons(!audio.paused);

    if (audio.paused) {
        document.getElementById('default-icon').style.display = 'block';
        document.getElementById('visualizer').style.display = 'none';
    } else {
        document.getElementById('default-icon').style.display = 'none';
        document.getElementById('visualizer').style.display = 'block';
    }
}

export function updatePlayButtons(isPlaying) {
    const pIcon = document.getElementById('play-icon');
    const fPIcon = document.getElementById('full-play-icon');
    const name = isPlaying ? 'pause' : 'play';
    if (pIcon) pIcon.setAttribute('name', name);
    if (fPIcon) fPIcon.setAttribute('name', name);
}

// --- BARRA DE PROGRESO ---
audio.ontimeupdate = () => {
    if (isNaN(audio.duration)) return;
    const { formatTime } = import('../utils/helpers.js').catch(() => ({ formatTime: () => '' }));
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.style.width = pct + '%';
    if (fullProgressBar) fullProgressBar.style.width = pct + '%';

    document.getElementById('current-time').textContent = formatTimeSync(audio.currentTime);
    document.getElementById('total-time').textContent = formatTimeSync(audio.duration);
};

function formatTimeSync(s) {
    const m = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

audio.onloadedmetadata = () => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
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

// --- EVENTOS DE BOTONES ---
playBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };
nextBtn.onclick = (e) => { e.stopPropagation(); playNext(); };
fullNextBtn.onclick = playNext;
fullPlayBtn.onclick = togglePlay;
fullPrevBtn.onclick = playPrev;
audio.onended = playNext;
