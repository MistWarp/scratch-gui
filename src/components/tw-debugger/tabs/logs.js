import LogView from '../log-view.js';
import logsIcon from '../icons/logs.svg';
import deleteIcon from '../icons/delete.svg';
import downloadIcon from '../icons/download-white.svg';

const SEVERITIES = ['log', 'warn', 'error'];

const pad = n => String(n).padStart(2, '0');
const formatTime = timestamp => {
    const date = new Date(timestamp);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const downloadText = (filename, text) => {
    const blob = new Blob([text], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const createLogsTab = controller => {
    const vm = controller.vm;

    const logView = new LogView();
    logView.placeholderElement.textContent = 'No logs yet';

    const filters = {
        search: '',
        severity: {log: true, warn: true, error: true},
        sprite: 'all'
    };

    const matches = row => {
        if (!filters.severity[row.type]) return false;
        if (filters.sprite !== 'all') {
            const name = row.targetInfo ? row.targetInfo.name : null;
            if (name !== filters.sprite) return false;
        }
        if (filters.search) {
            if (!String(row.text).toLowerCase()
                .includes(filters.search)) return false;
        }
        return true;
    };

    const rebuild = () => {
        logView.rows = controller.rows.filter(matches);
        logView.oldLength = -1;
        logView.rowToMetadata.clear();
        logView.innerElement.querySelectorAll('.sa-debugger-log').forEach(el => el.remove());
        logView.queueUpdateContent();
    };

    const getInputOfBlock = (targetId, blockId) => {
        const target = vm.runtime.getTargetById(targetId);
        if (!target) return null;
        const block = controller.getBlock(target, blockId);
        if (!block) return null;
        return Object.values(block.inputs)[0] && Object.values(block.inputs)[0].block;
    };

    logView.generateRow = row => {
        const root = document.createElement('div');
        root.className = 'sa-debugger-log';
        if (row.internal) {
            root.classList.add('sa-debugger-log-internal');
        }
        root.dataset.type = row.type;

        const time = document.createElement('span');
        time.className = 'sa-debugger-log-time';
        time.textContent = formatTime(row.timestamp);
        root.appendChild(time);

        const icon = document.createElement('div');
        icon.className = 'sa-debugger-log-icon';
        root.appendChild(icon);

        if (row.preview && row.blockId && row.targetInfo) {
            const originalId = row.targetInfo.originalId;
            const inputBlock = getInputOfBlock(originalId, row.blockId);
            if (inputBlock) {
                const preview = controller.createBlockPreview(originalId, inputBlock);
                if (preview) {
                    root.appendChild(preview);
                }
            }
        }

        const text = document.createElement('div');
        text.className = 'sa-debugger-log-text';
        if (String(row.text).length === 0) {
            text.classList.add('sa-debugger-log-text-empty');
            text.textContent = 'empty string';
        } else {
            text.textContent = row.text;
            text.title = row.text;
        }
        root.appendChild(text);

        if (row.targetInfo && row.blockId) {
            root.appendChild(controller.createBlockLink(row.targetInfo, row.blockId));
        }

        return {root};
    };

    const filterBar = document.createElement('div');
    filterBar.className = 'sa-debugger-filter-bar';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'sa-debugger-search';
    searchInput.placeholder = 'Search logs';
    searchInput.addEventListener('input', () => {
        filters.search = searchInput.value.trim().toLowerCase();
        rebuild();
    });
    filterBar.appendChild(searchInput);

    const severityGroup = document.createElement('div');
    severityGroup.className = 'sa-debugger-severity-group';
    for (const severity of SEVERITIES) {
        const toggle = document.createElement('button');
        toggle.className = `sa-debugger-severity sa-debugger-severity-${severity} sa-debugger-severity-active`;
        toggle.textContent = severity;
        toggle.addEventListener('click', () => {
            filters.severity[severity] = !filters.severity[severity];
            toggle.classList.toggle('sa-debugger-severity-active', filters.severity[severity]);
            rebuild();
        });
        severityGroup.appendChild(toggle);
    }
    filterBar.appendChild(severityGroup);

    const spriteSelect = document.createElement('select');
    spriteSelect.className = 'sa-debugger-sprite-select';
    const refreshSprites = () => {
        const current = filters.sprite;
        const names = new Set();
        for (const target of vm.runtime.targets) {
            if (target.isOriginal && !target.isStage) {
                names.add(target.getName());
            }
        }
        spriteSelect.textContent = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All sprites';
        spriteSelect.appendChild(allOption);
        for (const name of names) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            spriteSelect.appendChild(option);
        }
        spriteSelect.value = names.has(current) || current === 'all' ? current : 'all';
        filters.sprite = spriteSelect.value;
    };
    spriteSelect.addEventListener('change', () => {
        filters.sprite = spriteSelect.value;
        rebuild();
    });
    filterBar.appendChild(spriteSelect);

    const content = document.createElement('div');
    content.className = 'sa-debugger-logs-content';
    content.appendChild(filterBar);
    content.appendChild(logView.outerElement);

    const onLog = event => {
        if (matches(event.log)) {
            logView.append(event.log);
        }
    };
    const onClear = () => {
        logView.clear();
    };
    controller.events.addEventListener('log', onLog);
    controller.events.addEventListener('clear', onClear);

    const exportButton = {
        label: 'Export',
        icon: downloadIcon,
        onClick: () => {
            const file = controller.rows
                .map(({text, targetInfo, type}) =>
                    `${targetInfo ? targetInfo.name : 'Unknown sprite'}: ${text} (${type})\n`)
                .join('');
            downloadText('logs.txt', file);
        }
    };

    const clearButton = {
        label: 'Clear',
        icon: deleteIcon,
        onClick: () => {
            controller.clearLogs();
        }
    };

    return {
        id: 'logs',
        label: 'Logs',
        icon: logsIcon,
        content,
        buttons: [exportButton, clearButton],
        show: () => {
            refreshSprites();
            rebuild();
            logView.show();
            controller.setHasUnreadMessage(false);
        },
        hide: () => {
            logView.hide();
        },
        destroy: () => {
            controller.events.removeEventListener('log', onLog);
            controller.events.removeEventListener('clear', onClear);
        }
    };
};

export default createLogsTab;
