const STORAGE_KEY = 'mw:two-column-categories';
const LEGACY_ADDON_SETTINGS_KEY = 'tw:addons';
const LEGACY_ADDON_ID = 'columns';
const TWO_COLUMN_CATEGORIES_CHANGED = 'mw:two-column-categories-changed';

const BODY_CLASS = 'mw-two-column-categories';
const TOOLBOX_CLASS = 'mwTwoColumnCategories';
const EXTENSION_MENU_CLASS = 'mwExtensionCategoryMenu';
const FLYOUT_TOP_PROPERTY = '--mw-two-column-flyout-top';
const PALETTE_WIDTH_PROPERTY = '--mw-two-column-palette-width';

// The category column is folded into the palette, so the flyout takes over its width.
const CATEGORY_MENU_WIDTH = 60;

// Built-in categories share the two-column grid. Everything else (extensions, addon blocks)
// goes in a full-width list underneath, like Scratch 2.0's "More Blocks".
const BUILT_IN_CATEGORIES = new Set([
    'motion',
    'looks',
    'sound',
    'assets',
    'events',
    'control',
    'sensing',
    'operators',
    'mwStrings',
    'variables',
    'lists',
    'myBlocks'
]);

const readLegacyAddonEnabled = () => {
    try {
        const raw = localStorage.getItem(LEGACY_ADDON_SETTINGS_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        const entry = parsed && parsed[LEGACY_ADDON_ID];
        return !!(entry && entry.enabled);
    } catch (err) {
        return false;
    }
};

let cached = null;

const getTwoColumnCategories = () => {
    if (cached !== null) return cached;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) {
            cached = readLegacyAddonEnabled();
            if (cached) localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            cached = stored === 'true';
        }
    } catch (err) {
        cached = false;
    }
    return cached;
};

const setTwoColumnCategories = enabled => {
    cached = !!enabled;
    try {
        localStorage.setItem(STORAGE_KEY, String(cached));
    } catch (err) {
        // ignore
    }
    if (!cached) document.body.classList.remove(BODY_CLASS);
    window.dispatchEvent(new CustomEvent(TWO_COLUMN_CATEGORIES_CHANGED));
};

const isTwoColumnToolbox = toolbox => Boolean(
    toolbox &&
    !toolbox.horizontalLayout_ &&
    getTwoColumnCategories()
);

const setLayoutProperties = (toolbox, flyoutTop) => {
    const root = document.documentElement;
    const width = `${toolbox.getWidth()}px`;
    const top = `${flyoutTop}px`;
    if (root.style.getPropertyValue(FLYOUT_TOP_PROPERTY) !== top) {
        root.style.setProperty(FLYOUT_TOP_PROPERTY, top);
    }
    if (root.style.getPropertyValue(PALETTE_WIDTH_PROPERTY) !== width) {
        root.style.setProperty(PALETTE_WIDTH_PROPERTY, width);
    }
    document.body.classList.add(BODY_CLASS);
};

let installed = false;
let baseFlyoutGetWidth = null;

// The width the palette resizer works with: the flyout alone, without the category
// column that the two-column menu folds into it.
const getResizableFlyoutWidth = flyout => (
    baseFlyoutGetWidth ? baseFlyoutGetWidth.call(flyout) : flyout.getWidth()
);

const installTwoColumnCategories = ScratchBlocks => {
    if (installed) return;
    const {Toolbox, VerticalFlyout, Flyout} = ScratchBlocks;
    if (!Toolbox || !Toolbox.CategoryMenu || !VerticalFlyout || !Flyout) return;
    installed = true;
    baseFlyoutGetWidth = Flyout.prototype.getWidth;

    const CategoryMenuProto = Toolbox.CategoryMenu.prototype;
    const originalCreateDom = CategoryMenuProto.createDom;
    const originalPopulate = CategoryMenuProto.populate;
    const originalMenuDispose = CategoryMenuProto.dispose;

    CategoryMenuProto.createDom = function () {
        originalCreateDom.call(this);
        const enabled = isTwoColumnToolbox(this.parent_);
        this.parentHtml_.classList.toggle(TOOLBOX_CLASS, enabled);
        if (!enabled) {
            this.parentHtml_.style.width = '';
            return;
        }
        this.extensionTable = document.createElement('div');
        this.extensionTable.className = `scratchCategoryMenu ${EXTENSION_MENU_CLASS}`;
        this.parentHtml_.appendChild(this.extensionTable);
    };

    CategoryMenuProto.populate = function (domTree) {
        if (!domTree || !isTwoColumnToolbox(this.parent_)) {
            originalPopulate.call(this, domTree);
            return;
        }
        const builtInTree = domTree.cloneNode(true);
        const extensionNodes = [];
        for (const child of Array.from(builtInTree.childNodes)) {
            if (child.tagName && child.tagName.toUpperCase() === 'CATEGORY' &&
                !BUILT_IN_CATEGORIES.has(child.getAttribute('id'))) {
                extensionNodes.push(child);
                child.remove();
            }
        }
        // Populates the built-in table and recreates this.extensionTable via createDom.
        originalPopulate.call(this, builtInTree);
        for (const child of extensionNodes) {
            const row = document.createElement('div');
            row.className = 'scratchCategoryMenuRow';
            this.extensionTable.appendChild(row);
            this.categories_.push(new Toolbox.Category(this, row, child));
        }
        this.height_ = this.parentHtml_.offsetHeight;
    };

    CategoryMenuProto.dispose = function () {
        originalMenuDispose.call(this);
        if (this.extensionTable) {
            this.extensionTable.remove();
            this.extensionTable = null;
        }
    };

    const ToolboxProto = Toolbox.prototype;
    const originalPosition = ToolboxProto.position;
    const originalToolboxDispose = ToolboxProto.dispose;

    ToolboxProto.position = function () {
        const div = this.HtmlDiv;
        if (div && isTwoColumnToolbox(this)) {
            div.style.width = `${this.getWidth()}px`;
        }
        originalPosition.call(this);
        // The category menu height decides where the flyout starts, and it changes when
        // extensions are added or fonts load, so follow it.
        if (div && !this.mwCategoryResizeObserver && typeof ResizeObserver === 'function') {
            let frame = null;
            this.mwCategoryResizeObserver = new ResizeObserver(() => {
                if (frame !== null || !isTwoColumnToolbox(this)) return;
                frame = requestAnimationFrame(() => {
                    frame = null;
                    if (this.flyout_) this.flyout_.position();
                });
            });
            this.mwCategoryResizeObserver.observe(div);
        }
    };

    ToolboxProto.dispose = function () {
        if (this.mwCategoryResizeObserver) {
            this.mwCategoryResizeObserver.disconnect();
            this.mwCategoryResizeObserver = null;
        }
        originalToolboxDispose.call(this);
    };

    const VerticalFlyoutProto = VerticalFlyout.prototype;
    const originalFlyoutPosition = VerticalFlyoutProto.position;

    // Flyout.getWidth already honours the palette resizer, so widen whatever it returns.
    VerticalFlyoutProto.getWidth = function () {
        const width = baseFlyoutGetWidth.call(this);
        return isTwoColumnToolbox(this.parentToolbox_) ? width + CATEGORY_MENU_WIDTH : width;
    };

    VerticalFlyoutProto.position = function () {
        originalFlyoutPosition.call(this);
        const toolbox = this.parentToolbox_;
        if (!isTwoColumnToolbox(toolbox) || !toolbox.HtmlDiv || !this.isVisible()) return;
        const metrics = this.targetWorkspace_.getMetrics();
        if (!metrics) return;

        const atRight = this.toolboxPosition_ === ScratchBlocks.TOOLBOX_AT_RIGHT;
        const x = atRight ? metrics.viewWidth : 0;
        const y = toolbox.HtmlDiv.offsetHeight;

        this.width_ = toolbox.getWidth();
        this.height_ = Math.max(0, metrics.viewHeight - y);
        this.setBackgroundPath_(this.width_, this.height_);
        this.svgGroup_.setAttribute('width', this.width_);
        this.svgGroup_.setAttribute('height', this.height_);
        ScratchBlocks.utils.setCssTransform(this.svgGroup_, `translate(${x}px,${y}px)`);
        if (this.scrollbar_) {
            this.scrollbar_.setOrigin(x, y);
            this.scrollbar_.resize();
        }
        setLayoutProperties(toolbox, y);
    };
};

// Rebuilds the category menu of a live workspace after the setting changes.
const refreshTwoColumnCategories = workspace => {
    const toolbox = workspace && workspace.getToolbox && workspace.getToolbox();
    if (!toolbox || !toolbox.categoryMenu_) return;
    const categoryId = toolbox.getSelectedCategoryId();
    toolbox.populate_(workspace.options.languageTree);
    toolbox.position();
    workspace.resize();
    if (categoryId) toolbox.setSelectedCategoryById(categoryId);
};

export {
    getTwoColumnCategories,
    setTwoColumnCategories,
    installTwoColumnCategories,
    refreshTwoColumnCategories,
    getResizableFlyoutWidth,
    TWO_COLUMN_CATEGORIES_CHANGED
};
