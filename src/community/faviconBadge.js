import logo from './assets/mistwarp-logo.png';

let link = null;
let badged = false;

const getLink = () => {
    if (!link) {
        link = document.querySelector('link[rel~="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
    }
    return link;
};

const setFaviconBadge = show => {
    if (show === badged) return;
    badged = show;
    if (!show) {
        getLink().href = '/favicon.ico';
        return;
    }
    const img = new Image();
    img.onload = () => {
        if (!badged) return;
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size - 18, 18, 18, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff3b30';
        ctx.fill();
        getLink().href = canvas.toDataURL('image/png');
    };
    img.src = logo;
};

export default setFaviconBadge;
