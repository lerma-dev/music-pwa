// --- UTILIDADES ---

export function applyMarqueeIfNeeded(element) {
    if (!element) return;
    const container = element.parentElement;
    element.classList.remove('animate-marquee');
    if (element.scrollWidth > container.clientWidth) {
        element.classList.add('animate-marquee');
    }
}

export function escapeJS(str) {
    return str.replace(/'/g, "\\'");
}

export function formatTime(s) {
    const m = Math.floor(s / 60);
    const sc = Math.floor(s % 60);
    return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}
