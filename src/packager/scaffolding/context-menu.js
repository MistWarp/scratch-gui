import styles from './style.css';

const ICON_PATHS = {
  import: ['M12 3v12', 'm17 8-5-5-5 5', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'],
  export: ['M12 15V3', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5']
};

const createIcon = (name) => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', styles.contextMenuItemIcon);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICON_PATHS[name] || []) {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
};

class ContextMenu {
  constructor (parent) {
    this.parent = parent;

    this.root = document.createElement('div');
    this.root.className = styles.contextMenu;

    this._onmousedown = this._onmousedown.bind(this);
    this._onresize = this._onresize.bind(this);
    this._onblur = this._onblur.bind(this);
  }

  _onmousedown (e) {
    if (!this.root.contains(e.target)) {
      this.destroy();
    }
  }

  _onresize () {
    this.destroy();
  }

  _onblur () {
    this.destroy();
  }

  add (option) {
    const item = document.createElement('button');
    item.className = styles.contextMenuItem;
    if (option.icon) {
      item.appendChild(createIcon(option.icon));
    }
    item.appendChild(document.createTextNode(option.text));
    item.addEventListener('click', () => {
      this.destroy();
      option.callback();
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.root.appendChild(item);
  }

  show (mouseEvent) {
    document.addEventListener('mousedown', this._onmousedown);
    window.addEventListener('resize', this._onresize);
    window.addEventListener('blur', this._onblur);
    this.parent._addLayer(this.root);
    const layersRect = this.parent.layersRect;
    const menuRect = this.root.getBoundingClientRect();
    let x = mouseEvent.clientX - layersRect.left;
    let y = mouseEvent.clientY - layersRect.top;
    if (x + menuRect.width > layersRect.width) {
      x -= menuRect.width;
    }
    if (y + menuRect.height > layersRect.height) {
      y -= menuRect.height;
    }
    this.root.style.transform = `translate(${x}px, ${y}px)`;
    getComputedStyle(this.root).opacity;
    this.root.style.opacity = '1';
  }

  destroy () {
    document.removeEventListener('mousedown', this._onmousedown);
    window.removeEventListener('resize', this._onresize);
    window.removeEventListener('blur', this._onblur);
    this.root.style.opacity = '0';
    this.root.style.pointerEvents = 'none';
    setTimeout(() => {
      this.root.remove();
    }, 200);
  }
}

export default ContextMenu;
