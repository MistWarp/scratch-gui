const clamp = (i, min, max) => Math.max(min, Math.min(max, i));

const appendSortedElement = (parent, newChild) => {
    const newChildIndex = +newChild.dataset.index;
    let foundSpot = false;
    for (const existingChild of parent.children) {
        const existingChildIndex = +existingChild.dataset.index;
        if (existingChildIndex > newChildIndex) {
            foundSpot = true;
            parent.insertBefore(newChild, existingChild);
            break;
        }
    }
    if (!foundSpot) {
        parent.appendChild(newChild);
    }
};

class LogView {
    constructor () {
        this.rows = [];
        this.canAutoScrollToEnd = true;
        this.rowHeight = 24;

        this.outerElement = document.createElement('div');
        this.outerElement.className = 'sa-debugger-log-outer';

        this.innerElement = document.createElement('div');
        this.innerElement.className = 'sa-debugger-log-inner';
        this.outerElement.appendChild(this.innerElement);
        this.innerElement.addEventListener('scroll', this._handleScroll.bind(this), {passive: true});
        this.innerElement.addEventListener('wheel', this._handleWheel.bind(this), {passive: true});

        this.endElement = document.createElement('div');
        this.endElement.className = 'sa-debugger-log-end';
        this.endElement.dataset.index = '-1';
        this.innerElement.appendChild(this.endElement);

        this.placeholderElement = document.createElement('div');
        this.placeholderElement.className = 'sa-debugger-log-empty';

        this.visible = false;
        this.isScrolledToEnd = true;
        this.scrollTopWhenHidden = 'end';
        this.scrollTop = 0;
        this.updateContentQueued = false;
        this.scrollToEndQueued = false;
        this.oldLength = -1;
        this.rowToMetadata = new Map();
    }

    append (log) {
        this.queueUpdateContent();
        this._queueScrollToEnd();

        this.rows.push(log);

        const MAX_LOGS = 200000;
        while (this.rows.length > MAX_LOGS) {
            this.rows.shift();
        }
    }

    clear () {
        this.rows.length = 0;
        this.scrollTop = 0;
        this.isScrolledToEnd = true;
        this.queueUpdateContent();
    }

    show () {
        this.visible = true;
        this.height = this.innerElement.offsetHeight;
        this.queueUpdateContent();
        if (this.scrollTopWhenHidden === 'end') {
            this._queueScrollToEnd();
        } else {
            this.innerElement.scrollTop = this.scrollTopWhenHidden;
        }
    }

    hide () {
        this.visible = false;
        this.scrollTopWhenHidden = this.isScrolledToEnd ? 'end' : this.scrollTop;
    }

    _handleScroll (e) {
        this.scrollTop = e.target.scrollTop;
        this.isScrolledToEnd = e.target.scrollTop + 5 >= e.target.scrollHeight - e.target.clientHeight;
        this.queueUpdateContent();
    }

    _handleWheel (e) {
        if (e.deltaY < 0) {
            this.isScrolledToEnd = false;
        }
    }

    isInView (index, margin = 0) {
        const topEdgeFromTop = index * this.rowHeight;
        const bottomEdgeFromTop = topEdgeFromTop + this.rowHeight;
        const viewportStart = this.scrollTop;
        const viewportEnd = viewportStart + this.height;
        return topEdgeFromTop >= viewportStart + margin && bottomEdgeFromTop <= viewportEnd - margin;
    }

    scrollTo (index) {
        const maximumScrollTop = Math.max(0, ((this.rows.length * this.rowHeight) - this.height) + 1);
        this.scrollTop = Math.min(maximumScrollTop, (index * this.rowHeight) - (this.rowHeight * 0.3));
        this.innerElement.scrollTop = this.scrollTop;
    }

    _queueScrollToEnd () {
        if (this.visible && this.canAutoScrollToEnd && this.isScrolledToEnd && !this.scrollToEndQueued) {
            this.scrollToEndQueued = true;
            queueMicrotask(() => {
                this.scrollToEndQueued = false;
                if (this.isScrolledToEnd) {
                    const scrollEnd = this.innerElement.scrollHeight - this.innerElement.offsetHeight;
                    this.innerElement.scrollTop = scrollEnd;
                    this.scrollTop = scrollEnd;
                }
            });
        }
    }

    queueUpdateContent () {
        if (this.visible && !this.updateContentQueued) {
            this.updateContentQueued = true;
            queueMicrotask(() => {
                this.updateContentQueued = false;
                this.updateContent();
            });
        }
    }

    generateRow () {
        return null;
    }

    renderRow () {
        return null;
    }

    updateContent () {
        if (this.rows.length !== this.oldLength) {
            this.oldLength = this.rows.length;

            const totalHeight = this.rows.length * this.rowHeight;
            this.endElement.style.transform = `translateY(${totalHeight}px)`;

            if (this.rows.length) {
                this.placeholderElement.remove();
            } else {
                this.innerElement.appendChild(this.placeholderElement);

                for (const metadata of this.rowToMetadata.values()) {
                    metadata.elements.root.remove();
                }
                this.rowToMetadata.clear();
            }
        }

        if (this.rows.length === 0) {
            return;
        }

        const EXTRA_ROWS_ABOVE = 5;
        const EXTRA_ROWS_BELOW = 5;

        const scrollStartIndex = Math.floor(this.scrollTop / this.rowHeight);
        const rowsVisible = Math.ceil(this.height / this.rowHeight);
        const startIndex = clamp(scrollStartIndex - EXTRA_ROWS_BELOW, 0, this.rows.length);
        const endIndex = clamp(scrollStartIndex + rowsVisible + EXTRA_ROWS_ABOVE, 0, this.rows.length);

        const allVisibleRows = new Set();
        const newElements = [];
        for (let i = startIndex; i < endIndex; i++) {
            const row = this.rows[i];
            allVisibleRows.add(row);

            let metadata = this.rowToMetadata.get(row);
            if (!metadata) {
                const elements = this.generateRow(row);
                newElements.push(elements.root);
                metadata = {
                    stringify: null,
                    elements
                };
                this.rowToMetadata.set(row, metadata);
            }

            const currentStringify = JSON.stringify(row);
            if (currentStringify !== metadata.stringify) {
                metadata.stringify = currentStringify;
                this.renderRow(metadata.elements, row);
            }

            const root = metadata.elements.root;
            root.style.transform = `translateY(${i * this.rowHeight}px)`;
            root.dataset.index = i;
        }

        for (const [row, metadata] of this.rowToMetadata.entries()) {
            if (!allVisibleRows.has(row)) {
                metadata.elements.root.remove();
                this.rowToMetadata.delete(row);
            }
        }

        for (const root of newElements) {
            appendSortedElement(this.innerElement, root);
        }
    }
}

export default LogView;
