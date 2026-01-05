import BlockItem from '../../lib/find-bar/BlockItem';

import Dropdown from './Dropdown';

const getMessages = (ScratchBlocks, blockJson) => [
    ScratchBlocks.Msg,
    Object.fromEntries(
        blockJson.flatMap(b => (b ? [[b.type.toUpperCase(), `${b.type.split('_', 1)[0]}: ${b.message0}`]] : []))
    )
];

const getColours = blockJson => Object.fromEntries(
    blockJson.flatMap(b => (b ? [[b.type.toUpperCase(), b.colour]] : []))
);

export default class FindBarController {
    constructor ({ScratchBlocks, utils, vm, msg, msgAny, inputClassName, activeTabIndexRef, isPlayerOnlyRef}) {
        this.ScratchBlocks = ScratchBlocks;
        this.utils = utils;
        this.vm = vm;
        this.msg = msg;
        this.msgAny = msgAny;
        this.inputClassName = inputClassName;
        this.activeTabIndexRef = activeTabIndexRef;
        this.isPlayerOnlyRef = isPlayerOnlyRef;

        this.prevValue = '';

        this.currentResults = [];
        this.currentResultIndex = -1;

        this.isRegexMode = false;
        this.isCaseSensitive = localStorage.getItem('sa-find-case-sensitive') === '1';

        this.findBarOuter = null;
        this.findWrapper = null;
        this.findInput = null;
        this.dropdownOut = null;
        this.dropdown = new Dropdown({ScratchBlocks, utils, vm, msg});
        this.searchControls = null;

        this._onDocumentKeyDown = e => this.eventKeyDown(e);
        document.addEventListener('keydown', this._onDocumentKeyDown, true);
    }

    get workspace () {
        return this.ScratchBlocks.getMainWorkspace();
    }

    createDom (root) {
        if (this.findBarOuter) return;

        this.findBarContainer = document.createElement('li');
        this.findBarContainer.className = 'mw-native-find-bar-container';
        this.findBarContainer.setAttribute('role', 'presentation');
        root.appendChild(this.findBarContainer);

        this.findBarOuter = document.createElement('div');
        this.findBarOuter.className = 'sa-find-bar mw-native-find-bar';
        this.findBarContainer.appendChild(this.findBarOuter);

        this.findWrapper = this.findBarOuter.appendChild(document.createElement('span'));
        this.findWrapper.className = 'sa-find-wrapper';

        this.searchIcon = this.findWrapper.appendChild(document.createElement('span'));
        this.searchIcon.className = 'sa-find-icon';
        this.searchIcon.setAttribute('aria-hidden', 'true');
        this.searchIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        this.dropdownOut = this.findWrapper.appendChild(document.createElement('label'));
        this.dropdownOut.className = 'sa-find-dropdown-out';

        const inputWrap = this.dropdownOut.appendChild(document.createElement('span'));
        inputWrap.className = 'sa-find-input-wrap';

        this.findInput = inputWrap.appendChild(document.createElement('input'));
        this.findInput.className = `${this.inputClassName} sa-find-input`;
        this.findInput.id = 'sa-find-input';
        this.findInput.type = 'search';
        this.findInput.placeholder = this.msg('find-placeholder');
        this.findInput.autocomplete = 'off';

        this.dropdownOut.appendChild(this.dropdown.createDom());

        this.searchControls = this.findBarOuter.appendChild(document.createElement('div'));
        this.searchControls.className = 'sa-hidden-modifiers';

        this.caseToggle = this.searchControls.appendChild(document.createElement('button'));
        this.caseToggle.className = `sa-find-toggle${this.isCaseSensitive ? ' sa-find-toggle-active' : ''}`;
        this.caseToggle.textContent = 'Aa';
        this.caseToggle.title = this.msg('case-sensitive');
        this.caseToggle.type = 'button';
        this.caseToggle.addEventListener('click', e => {
            e.preventDefault();
            this.toggleCaseSensitive();
            this.findInput.focus();
        });

        this.regexToggle = this.searchControls.appendChild(document.createElement('button'));
        this.regexToggle.className = `sa-find-toggle${this.isRegexMode ? ' sa-find-toggle-active' : ''}`;
        this.regexToggle.textContent = '.*';
        this.regexToggle.title = this.msg('regex-mode');
        this.regexToggle.type = 'button';
        this.regexToggle.addEventListener('click', e => {
            e.preventDefault();
            this.toggleRegexMode();
            this.findInput.focus();
        });

        this.searchStats = this.findWrapper.appendChild(document.createElement('span'));
        this.searchStats.className = 'sa-find-stats';

        this.bindEvents();
        this.tabChanged();
    }

    destroy () {
        document.removeEventListener('keydown', this._onDocumentKeyDown, true);
        if (this.findBarOuter) {
            this.findBarOuter.remove();
            this.findBarOuter = null;
        }
        if (this.findBarContainer) {
            this.findBarContainer.remove();
            this.findBarContainer = null;
        }
    }

    bindEvents () {
        this.findInput.addEventListener('focus', () => {
            this.updateModifierVisibility();
            if (this.findInput.value) {
                this.inputChange();
            } else {
                this.showDropDown();
                this.showAllItems();
            }
        });

        this.findInput.addEventListener('blur', () => {
            setTimeout(() => this.updateModifierVisibility(), 0);
            this.hideDropDown();
        });

        this.findInput.addEventListener('keydown', e => this.inputKeyDown(e));
        this.findInput.addEventListener('keyup', () => this.inputChange());

        this.findBarOuter.addEventListener('mousedown', e => {
            if (e.target === this.caseToggle || e.target === this.regexToggle) {
                e.preventDefault();
            }
        });
    }

    updateModifierVisibility () {
        const inputFocused = document.activeElement === this.findInput;
        if (inputFocused) {
            this.searchControls.classList.add('sa-find-controls');
        } else {
            this.searchControls.classList.remove('sa-find-controls');
        }
    }

    tabChanged () {
        if (!this.findBarOuter) return;
        const tab = this.activeTabIndexRef.current;
        const visible = tab === 0 || tab === 1 || tab === 2;
        this.findBarOuter.hidden = !visible;
    }

    clearChildren (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    appendHighlightedText (container, text, matchIndex, matchLength) {
        if (matchIndex > 0) {
            container.appendChild(document.createTextNode(text.substring(0, matchIndex)));
        }

        const bText = document.createElement('b');
        bText.appendChild(document.createTextNode(text.substr(matchIndex, matchLength)));
        container.appendChild(bText);

        if (matchIndex + matchLength < text.length) {
            container.appendChild(document.createTextNode(text.substr(matchIndex + matchLength)));
        }
    }

    getSearchRegex (pattern) {
        if (!this.isRegexMode) return null;
        try {
            return new RegExp(pattern, this.isCaseSensitive ? 'g' : 'gi');
        } catch (e) {
            return null;
        }
    }

    findMatch ({displayName, procCode, opcode, searchNeedle, regex}) {
        const primaryText = displayName || procCode;

        if (regex) {
            let match = regex.exec(primaryText);
            if (match) {
                regex.lastIndex = 0;
                return {matchIndex: match.index, matchLength: match[0].length, matchInOpcode: false};
            }

            if (procCode && procCode !== primaryText) {
                regex.lastIndex = 0;
                match = regex.exec(procCode);
                regex.lastIndex = 0;
                if (match) {
                    return {matchIndex: match.index, matchLength: match[0].length, matchInOpcode: true};
                }
            }

            if (opcode) {
                regex.lastIndex = 0;
                match = regex.exec(opcode);
                regex.lastIndex = 0;
                if (match) {
                    return {matchIndex: match.index, matchLength: match[0].length, matchInOpcode: true};
                }
            }

            return null;
        }

        const primarySearchText = this.isCaseSensitive ? primaryText : primaryText.toLowerCase();
        let matchIndex = primarySearchText.indexOf(searchNeedle);
        if (matchIndex >= 0) {
            return {matchIndex, matchLength: searchNeedle.length, matchInOpcode: false};
        }

        if (procCode && procCode !== primaryText) {
            const procSearchText = this.isCaseSensitive ? procCode : procCode.toLowerCase();
            matchIndex = procSearchText.indexOf(searchNeedle);
            if (matchIndex >= 0) {
                return {matchIndex, matchLength: searchNeedle.length, matchInOpcode: true};
            }
        }

        if (opcode) {
            const opcodeSearchText = this.isCaseSensitive ? opcode : opcode.toLowerCase();
            matchIndex = opcodeSearchText.indexOf(searchNeedle);
            if (matchIndex >= 0) {
                return {matchIndex, matchLength: searchNeedle.length, matchInOpcode: true};
            }
        }

        return null;
    }

    inputChange () {
        if (!this.findInput.value) {
            this.showDropDown();
            this.showAllItems();
            return;
        }

        this.showDropDown();

        const val = this.findInput.value;
        const searchVal = this.isCaseSensitive ? val : val.toLowerCase();

        if (searchVal === this.prevValue) {
            return;
        }
        this.prevValue = searchVal;

        const regex = this.getSearchRegex(val);

        const listLI = this.dropdown.items;

        for (const li of listLI) {
            const procCode = li.data.procCode;
            const opcode = li.data.opcode;
            const displayName = li.displayName || procCode;
            const match = this.findMatch({displayName, procCode, opcode, searchNeedle: searchVal, regex});

            if (match) {
                li.style.display = 'block';

                this.clearChildren(li);

                if (match.matchInOpcode && opcode) {
                    li.appendChild(document.createTextNode(displayName));
                    li.appendChild(document.createTextNode(' ('));

                    const opcodeSpan = document.createElement('span');
                    opcodeSpan.className = 'sa-find-opcode';

                    this.appendHighlightedText(opcodeSpan, opcode, match.matchIndex, match.matchLength);

                    li.appendChild(opcodeSpan);
                    li.appendChild(document.createTextNode(')'));
                } else {
                    this.appendHighlightedText(li, displayName, match.matchIndex, match.matchLength);
                }
            } else {
                li.style.display = 'none';
            }
        }
    }

    showAllItems () {
        const listLI = this.dropdown.items;

        for (const li of listLI) {
            if (li.data && li.data.isTextInputEntry) {
                li.style.display = 'none';
                continue;
            }
            li.style.display = 'block';

            const displayName = li.displayName;
            this.clearChildren(li);
            li.appendChild(document.createTextNode(displayName));
        }
    }

    inputKeyDown (e) {
        this.dropdown.inputKeyDown(e);

        if (e.key === 'F3') {
            this.navigateResults(e.shiftKey ? -1 : 1);
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            this.findInput.blur();
            return;
        }

        if (e.key === 'Escape') {
            if (this.findInput.value.length > 0) {
                this.findInput.value = '';
                this.inputChange();
            } else {
                this.findInput.blur();
            }
            e.preventDefault();
            return;
        }
    }

    toggleCaseSensitive () {
        this.isCaseSensitive = !this.isCaseSensitive;
        localStorage.setItem('sa-find-case-sensitive', this.isCaseSensitive ? '1' : '0');
        this.caseToggle.classList.toggle('sa-find-toggle-active', this.isCaseSensitive);
        this.prevValue = null;
        this.inputChange();
    }

    toggleRegexMode () {
        this.isRegexMode = !this.isRegexMode;
        this.regexToggle.classList.toggle('sa-find-toggle-active', this.isRegexMode);
        this.prevValue = null;
        this.inputChange();
    }

    navigateResults (direction) {
        const visibleItems = this.dropdown.items.filter(item => item.style.display !== 'none');
        if (visibleItems.length === 0) return;

        let currentIndex = visibleItems.indexOf(this.dropdown.selected);
        if (currentIndex === -1) {
            currentIndex = direction > 0 ? -1 : 0;
        }

        const newIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
        this.dropdown.onItemClick(visibleItems[newIndex]);
        visibleItems[newIndex].scrollIntoView({block: 'nearest'});
    }

    eventKeyDown (e) {
        if (this.isPlayerOnlyRef.current || !this.findBarOuter) return;

        const ctrlKey = e.ctrlKey || e.metaKey;

        if (e.key.toLowerCase() === 'f' && ctrlKey && !e.shiftKey) {
            this.findInput.focus();
            this.findInput.select();
            e.cancelBubble = true;
            e.preventDefault();
            return true;
        }

        if (e.key === 'ArrowLeft' && ctrlKey) {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                return;
            }

            if (this.activeTabIndexRef.current === 0) {
                this.utils.navigationHistory.goBack();
                e.cancelBubble = true;
                e.preventDefault();
                return true;
            }
        }

        if (e.key === 'ArrowRight' && ctrlKey) {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                return;
            }

            if (this.activeTabIndexRef.current === 0) {
                this.utils.navigationHistory.goForward();
                e.cancelBubble = true;
                e.preventDefault();
                return true;
            }
        }
    }

    showDropDown (focusID, instanceBlock) {
        if (!focusID && this.dropdownOut.classList.contains('visible') && this.findInput.value) {
            return;
        }

        this.prevValue = focusID ? '' : null;

        this.dropdownOut.classList.add('visible');

        let scratchBlocks;
        switch (this.activeTabIndexRef.current) {
        case 0:
            scratchBlocks = this.getScratchBlocks();
            break;
        case 1:
            scratchBlocks = this.getScratchCostumes();
            break;
        case 2:
            scratchBlocks = this.getScratchSounds();
            break;
        default:
            scratchBlocks = [];
            break;
        }

        this.dropdown.empty();

        const blockJson = this.vm.runtime.getBlocksJSON();
        const colours = getColours(blockJson);
        const messagesList = getMessages(this.ScratchBlocks, blockJson);

        for (const proc of scratchBlocks) {
            const item = this.dropdown.addItem(proc, messagesList, colours);

            if (focusID) {
                if (proc.matchesID(focusID)) {
                    this.dropdown.onItemClick(item, instanceBlock);
                } else {
                    item.style.display = 'none';
                }
            }
        }

        this.utils.offsetX = this.dropdownOut.getBoundingClientRect().width + 32;
        this.utils.offsetY = 32;
    }

    hideDropDown () {
        this.dropdownOut.classList.remove('visible');
    }

    getScratchBlocks () {
        const myBlocks = [];
        const myBlocksByProcCode = {};

        const currentTarget = this.utils.getEditingTarget();
        const targets = [currentTarget];

        for (const target of targets) {
            const workspace = target === currentTarget ? this.workspace : target.blocks;
            const spriteName = target.sprite ? target.sprite.name : null;
            const isCurrentSprite = target === currentTarget;

            if (!isCurrentSprite && workspace && workspace._blocks) {
                this.addBlocksFromTarget(target, myBlocks, myBlocksByProcCode, spriteName);
            } else if (isCurrentSprite) {
                this.addBlocksFromWorkspace(this.workspace, myBlocks, myBlocksByProcCode, spriteName, isCurrentSprite);
            }
        }

        const clsOrder = {flag: 0, receive: 1, event: 2, define: 3, var: 4, VAR: 5, list: 6, LIST: 7};

        myBlocks.sort((a, b) => {
            const t = clsOrder[a.cls] - clsOrder[b.cls];
            if (t !== 0) return t;
            if (a.lower < b.lower) return -1;
            if (a.lower > b.lower) return 1;
            return (a.y || 0) - (b.y || 0);
        });

        return myBlocks;
    }

    addBlocksFromWorkspace (workspace, myBlocks, myBlocksByProcCode, spriteName, isCurrentSprite) {
        const topBlocks = workspace.getTopBlocks();

        const addBlock = (cls, txt, root, opcode = null) => {
            const id = root.id ? root.id : root.getId ? root.getId() : null;
            const displayText = isCurrentSprite || !spriteName ? txt : `[${spriteName}] ${txt}`;

            const clone = myBlocksByProcCode[displayText];
            if (clone) {
                if (!clone.clones) clone.clones = [];
                clone.clones.push(id);
                return clone;
            }

            const items = new BlockItem(cls, displayText, id, 0, opcode);
            items.y = root.getRelativeToSurfaceXY ? root.getRelativeToSurfaceXY().y : null;
            items.spriteName = spriteName;
            items.isCurrentSprite = isCurrentSprite;
            myBlocks.push(items);
            myBlocksByProcCode[displayText] = items;
            return items;
        };

        const getDescFromField = root => {
            const fields = root.inputList[0];
            let desc = '';
            for (const fieldRow of fields.fieldRow) {
                desc = desc ? `${desc} ` : '';
                if (
                    fieldRow instanceof this.ScratchBlocks.FieldImage &&
                    fieldRow.src_.endsWith('green-flag.svg')
                ) {
                    desc += this.msgAny('/_general/blocks/green-flag');
                } else {
                    desc += fieldRow.getText();
                }
            }
            return desc;
        };

        for (const root of topBlocks) {
            if (root.type === 'procedures_definition') {
                const label = root.getChildren()[0];
                const procCode = label.getProcCode();
                if (!procCode) continue;
                const indexOfLabel = root.inputList.findIndex(i => i.fieldRow.length > 0);
                if (indexOfLabel === -1) continue;
                const translatedDefine = root.inputList[indexOfLabel].fieldRow[0].getText();
                const message = indexOfLabel === 0 ?
                    `${translatedDefine} ${procCode}` :
                    `${procCode} ${translatedDefine}`;
                addBlock('define', message, root);
                continue;
            }

            if (root.type === 'event_whenflagclicked') {
                addBlock('flag', getDescFromField(root), root, root.type);
                continue;
            }

            if (root.type === 'event_whenbroadcastreceived') {
                const fieldRow = root.inputList[0].fieldRow;
                const eventName = fieldRow.find(input => input.name === 'BROADCAST_OPTION').getText();
                addBlock('receive', this.msg('event', {name: eventName}), root, root.type).eventName = eventName;
                continue;
            }

            if (root.type.substr(0, 10) === 'event_when') {
                addBlock('event', getDescFromField(root), root, root.type);
                continue;
            }

            if (root.type === 'control_start_as_clone') {
                addBlock('event', getDescFromField(root), root, root.type);
                continue;
            }
        }

        const blocks = this.workspace.getAllBlocks().filter(v => !v.isShadow_);
        for (const block of blocks) {
            const blockType = block.type;
            if (
                !blockType.startsWith('data_') &&
                !blockType.startsWith('event_') &&
                !blockType.startsWith('procedures_') &&
                blockType !== 'control_start_as_clone' &&
                blockType !== 'event_broadcast' &&
                blockType !== 'event_broadcastandwait'
            ) {
                addBlock(blockType, blockType, block, blockType);
            }
        }

        const map = this.workspace.getVariableMap();

        const vars = map.getVariablesOfType('');
        for (const row of vars) {
            addBlock(
                row.isLocal ? 'var' : 'VAR',
                row.isLocal ? this.msg('var-local', {name: row.name}) : this.msg('var-global', {name: row.name}),
                row
            );
        }

        const lists = map.getVariablesOfType('list');
        for (const row of lists) {
            addBlock(
                row.isLocal ? 'list' : 'LIST',
                row.isLocal ? this.msg('list-local', {name: row.name}) : this.msg('list-global', {name: row.name}),
                row
            );
        }

        const events = this.getCallsToEvents();
        for (const event of events) {
            addBlock('receive', this.msg('event', {name: event.eventName}), event.block).eventName = event.eventName;
        }

        const textInputsByBlockId = new Map();

        const isTextInputField = field => {
            if (!field || typeof field.getText !== 'function') return false;
            if (this.ScratchBlocks.FieldTextInput && field instanceof this.ScratchBlocks.FieldTextInput) return true;
            if (this.ScratchBlocks.FieldNumber && field instanceof this.ScratchBlocks.FieldNumber) return true;
            const ctorName = field.constructor && field.constructor.name;
            return ctorName === 'FieldTextInput' || ctorName === 'FieldNumber' || ctorName === 'FieldAngle';
        };

        const collectTextInputsFromBlock = block => {
            const inputList = block.inputList;
            if (!inputList) return [];

            const values = [];
            for (const input of inputList) {
                const fieldRow = input.fieldRow;
                if (!fieldRow) continue;
                for (const field of fieldRow) {
                    if (!isTextInputField(field)) continue;
                    const text = String(field.getText()).trim();
                    if (text) values.push(text);
                }
            }
            return values;
        };

        const allBlocksIncludingShadows = this.workspace.getAllBlocks();
        for (const block of allBlocksIncludingShadows) {
            if (!block || !block.id) continue;

            const values = collectTextInputsFromBlock(block);
            if (values.length === 0) continue;

            let entry = textInputsByBlockId.get(block.id);
            if (!entry) {
                entry = {block, values: new Set()};
                textInputsByBlockId.set(block.id, entry);
            }
            for (const value of values) entry.values.add(value);
        }

        for (const {block, values} of textInputsByBlockId.values()) {
            const inputsText = Array.from(values).join(', ');
            if (!inputsText) continue;

            const displayText = `${block.type}: ${inputsText}`;
            const item = addBlock(block.type, displayText, block, block.type);
            item.isTextInputEntry = true;
        }

        return myBlocks;
    }

    addBlocksFromTarget (target, myBlocks, myBlocksByProcCode, spriteName) {
        const blocks = target.blocks;
        if (!blocks._blocks) return;

        const addBlock = (cls, txt, blockId, opcode = null) => {
            const displayText = `[${spriteName}] ${txt}`;
            const clone = myBlocksByProcCode[displayText];
            if (clone) {
                if (!clone.clones) clone.clones = [];
                clone.clones.push(blockId);
                return clone;
            }
            const items = new BlockItem(cls, displayText, blockId, 0, opcode);
            items.spriteName = spriteName;
            items.isCurrentSprite = false;
            items.targetId = target.id;
            myBlocks.push(items);
            myBlocksByProcCode[displayText] = items;
            return items;
        };

        for (const blockId of Object.keys(blocks._blocks)) {
            const block = blocks._blocks[blockId];

            if (block.topLevel) {
                if (block.opcode === 'procedures_definition') {
                    const procCode = block.mutation?.proccode || 'custom block';
                    addBlock('define', `define ${procCode}`, blockId, block.opcode);
                } else if (block.opcode === 'event_whenflagclicked') {
                    addBlock('flag', 'when flag clicked', blockId, block.opcode);
                } else if (block.opcode.startsWith('event_when')) {
                    addBlock('event', block.opcode.replace('event_when', 'when '), blockId, block.opcode);
                }
            }
        }

        const variables = target.variables;
        if (variables) {
            for (const varId of Object.keys(variables)) {
                const variable = variables[varId];
                if (variable.type === '') {
                    addBlock('var', `var ${variable.name}`, varId);
                } else if (variable.type === 'list') {
                    addBlock('list', `list ${variable.name}`, varId);
                }
            }
        }
    }

    getScratchCostumes () {
        const costumes = this.utils.getEditingTarget().getCostumes();
        const items = [];
        let i = 0;
        for (const costume of costumes) {
            items.push(new BlockItem('costume', costume.name, costume.assetId, i));
            i++;
        }
        return items;
    }

    getScratchSounds () {
        const sounds = this.utils.getEditingTarget().getSounds();
        const items = [];
        let i = 0;
        for (const sound of sounds) {
            items.push(new BlockItem('sound', sound.name, sound.assetId, i));
            i++;
        }
        return items;
    }

    getCallsToEvents () {
        const uses = [];
        const alreadyFound = new Set();

        for (const block of this.workspace.getAllBlocks()) {
            if (block.type !== 'event_broadcast' && block.type !== 'event_broadcastandwait') {
                continue;
            }

            const broadcastInput = block.getChildren()[0];
            if (!broadcastInput) continue;

            let eventName = '';
            if (broadcastInput.type === 'event_broadcast_menu') {
                eventName = broadcastInput.inputList[0].fieldRow[0].getText();
            } else {
                eventName = this.msg('complex-broadcast');
            }

            if (!alreadyFound.has(eventName)) {
                alreadyFound.add(eventName);
                uses.push({eventName, block});
            }
        }

        return uses;
    }
}
