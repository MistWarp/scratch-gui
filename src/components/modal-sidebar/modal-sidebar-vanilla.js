import styles from './modal-sidebar.module.css';

/**
 * Vanilla-JS twin of the ModalSidebar React components, for windows that are
 * built with plain DOM (e.g. the block inspector) instead of React.
 *
 * Emits the same markup and shares the same CSS module, so the sidebar looks
 * and behaves exactly like the settings window's. Every group heading is
 * collapsible.
 *
 * @param {object} options The sidebar options.
 * @param {string} options.ariaLabel Accessible label for the nav.
 * @param {Array} options.groups Groups of `{label, items: [{value, label}]}`.
 * @param {string} options.selectedValue Initially selected item value.
 * @param {function} options.onSelect Called with the item value on click.
 * @param {string} [options.width] One of "default", "wide", "narrow".
 * @returns {{element: HTMLElement, setSelected: function, destroy: function}} The sidebar element and controls.
 */
export const createModalSidebar = ({ariaLabel, groups, onSelect, selectedValue, width}) => {
    const widthClass = width === 'wide' ?
        styles.sidebarWide :
        width === 'narrow' ?
            styles.sidebarNarrow :
            null;

    const aside = document.createElement('div');
    aside.className = widthClass ? `${styles.sidebar} ${widthClass}` : styles.sidebar;

    const nav = document.createElement('nav');
    nav.className = styles.items;
    if (ariaLabel) {
        nav.setAttribute('aria-label', ariaLabel);
    }
    aside.appendChild(nav);

    const itemButtons = new Map();

    const setSelected = value => {
        for (const [itemValue, button] of itemButtons) {
            button.classList.toggle(styles.itemSelected, itemValue === value);
        }
    };

    const chevronSVG =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        '<path d="m6 9 6 6 6-6"/></svg>';

    for (const group of groups) {
        const groupEl = document.createElement('div');
        groupEl.className = styles.group;

        const header = document.createElement('button');
        header.type = 'button';
        header.className = `${styles.groupHeader} ${styles.groupHeaderButton}`;
        header.setAttribute('aria-expanded', 'true');

        const chevron = document.createElement('span');
        chevron.className = styles.groupChevron;
        chevron.innerHTML = chevronSVG;

        const headerLabel = document.createElement('span');
        headerLabel.textContent = group.label;

        header.appendChild(chevron);
        header.appendChild(headerLabel);
        groupEl.appendChild(header);

        const itemEls = [];
        for (const item of group.items) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = styles.item;
            button.title = item.label;
            button.value = item.value;

            const label = document.createElement('span');
            label.className = styles.label;
            label.textContent = item.label;
            button.appendChild(label);

            button.addEventListener('click', () => onSelect(item.value));
            itemButtons.set(item.value, button);
            itemEls.push(button);
            groupEl.appendChild(button);
        }

        header.addEventListener('click', () => {
            const willCollapse = header.getAttribute('aria-expanded') === 'true';
            header.setAttribute('aria-expanded', String(!willCollapse));
            chevron.classList.toggle(styles.groupChevronCollapsed, willCollapse);
            for (const el of itemEls) {
                el.hidden = willCollapse;
            }
        });

        nav.appendChild(groupEl);
    }

    setSelected(selectedValue);

    return {
        element: aside,
        setSelected,
        destroy () {
            aside.remove();
            itemButtons.clear();
        }
    };
};
