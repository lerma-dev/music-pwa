export const initVersionApp = () => {
    /*
        Obtener version de localStorage para mostrarla en ajustes
        y en localhost muestra 0.0.0 para marcar que es modo desarrollo
        Determinar canal de la app según el hostname
    */
    const tag_version = document.getElementById('version_app');
    const appVersion =  localStorage.getItem('appVersion') ?? '0.0.0';
    const hostname = window.location.hostname;
    let appChannel;

    const appendWaterMark = (text) => {
        // Crear marca de agua para Beta y Dev
        const badge = document.createElement('span');
        badge.className = 'waterMark';
        badge.textContent = text;
        document.body.appendChild(badge);
    };

    if(hostname.includes('github.io')){
        appChannel = 'Beta';
        appendWaterMark(`Beta v${appVersion}`);
    } else if(hostname === 'localhost' || hostname === '127.0.0.1' ){
        appChannel = 'Dev';
        appendWaterMark('Dev Mode');
    } else {
        appChannel = 'Stable';
    }

    tag_version.textContent = `Mi Música v${appVersion} (${appChannel})`;
};
