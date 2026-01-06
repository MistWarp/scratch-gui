/* eslint-disable */
import BlockItem from "./blockly/BlockItem.js";
import BlockInstance from "./blockly/BlockInstance.js";
import Utils from "./blockly/Utils.js";

// Using a simple inline SVG for the search icon (avoid depending on React here)

export default async function ({ addon, msg, console }) {
  // MistWarp: Find Bar is now implemented natively in scratch-gui.
  // Bail out to avoid duplicate UI and conflicting keybindings.
  return;

  const Blockly = await addon.tab.traps.getBlockly();

  function getMessages(blockJson) {
    return [
      Blockly.Msg,
      Object.fromEntries(blockJson.flatMap(b => b ? [
        [ b.type.toUpperCase(), b.type.split("_", 1)[0] + ": " +  b.message0 ]
      ] : [])),
    ];
  }

  function getColours(blockJson) {
    return Object.fromEntries(blockJson.flatMap(b => b ? [
      [ b.type.toUpperCase(), b.colour ]
    ] : []));
  }

  class FindBar {
    constructor() {
      this.utils = new Utils(addon);

      this.prevValue = "";
      this.searchHistory = JSON.parse(localStorage.getItem('sa-find-history') || '[]');
      this.currentHistoryIndex = -1;
      this.currentResults = [];
      this.currentResultIndex = -1;
      this.isRegexMode = false;
      this.isCaseSensitive = !!addon.settings.get("caseSensitive");

      this.findBarOuter = null;
      this.findWrapper = null;
      this.findInput = null;
      this.dropdownOut = null;
      this.dropdown = new Dropdown(this.utils);
      this.searchControls = null;
      this.searchStats = null;

      // Bind keyboard hook early
      document.addEventListener("keydown", (e) => this.eventKeyDown(e), true);
    }

    get workspace() {
      return Blockly.getMainWorkspace();
    }

    createDom(root) {
      this.findBarOuter = document.createElement("div");
      this.findBarOuter.className = "sa-find-bar";
      addon.tab.displayNoneWhileDisabled(this.findBarOuter, { display: "flex" });
      root.appendChild(this.findBarOuter);

      this.findWrapper = this.findBarOuter.appendChild(document.createElement("span"));
      this.findWrapper.className = "sa-find-wrapper";

      // Add a small magnifying glass icon before the dropdown so it appears left/outside the input
      this.searchIcon = this.findWrapper.appendChild(document.createElement("span"));
      this.searchIcon.className = "sa-find-icon";
      this.searchIcon.setAttribute('aria-hidden', 'true');
      this.searchIcon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
          <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

      this.dropdownOut = this.findWrapper.appendChild(document.createElement("label"));
      this.dropdownOut.className = "sa-find-dropdown-out";

      // Create an input wrapper so the input remains inside the dropdown label
      const inputWrap = this.dropdownOut.appendChild(document.createElement("span"));
      inputWrap.className = "sa-find-input-wrap";

      this.findInput = inputWrap.appendChild(document.createElement("input"));
      this.findInput.className = addon.tab.scratchClass("input_input-form", {
        others: "sa-find-input",
      });
      this.findInput.id = "sa-find-input";
      this.findInput.type = "search";
      this.findInput.placeholder = msg("find-placeholder");
      this.findInput.autocomplete = "off";

      this.dropdownOut.appendChild(this.dropdown.createDom());

      // Create search controls container
      this.searchControls = this.findBarOuter.appendChild(document.createElement("div"));
      this.searchControls.className = "sa-hidden-modifiers"; // hidden by default

      // Case sensitive toggle
      this.caseToggle = this.searchControls.appendChild(document.createElement("button"));
      this.caseToggle.className = "sa-find-toggle" + (this.isCaseSensitive ? " sa-find-toggle-active" : "");
      this.caseToggle.textContent = "Aa";
      this.caseToggle.title = msg("case-sensitive");
      this.caseToggle.type = "button";
      this.caseToggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleCaseSensitive();
        this.findInput.focus();
      });

      // Regex toggle
      this.regexToggle = this.searchControls.appendChild(document.createElement("button"));
      this.regexToggle.className = "sa-find-toggle" + (this.isRegexMode ? " sa-find-toggle-active" : "");
      this.regexToggle.textContent = ".*";
      this.regexToggle.title = msg("regex-mode");
      this.regexToggle.type = "button";
      this.regexToggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleRegexMode();
        this.findInput.focus();
      });

      this.searchStats = this.findWrapper.appendChild(document.createElement("span"));
      this.searchStats.className = "sa-find-stats";

      this.bindEvents();
      this.tabChanged();
    }

    bindEvents() {
      this.findInput.addEventListener("focus", () => {
        this.updateModifierVisibility();

        // Show all searchable items when focusing on empty search
        if (!this.findInput.value) {
          this.showDropDown();
          this.showAllItems();
        } else {
          this.inputChange();
        }
      });

      this.findInput.addEventListener("blur", () => {
        setTimeout(() => this.updateModifierVisibility(), 0);
        this.hideDropDown();
      });

      this.findInput.addEventListener("keydown", (e) => this.inputKeyDown(e));
      this.findInput.addEventListener("keyup", () => this.inputChange());

      this.findBarOuter.addEventListener('mousedown', (e) => {
        if (e.target === this.caseToggle || e.target === this.regexToggle) {
          e.preventDefault();
        }
      });
    }

    updateModifierVisibility() {
      const inputFocused = document.activeElement === this.findInput;
      if (inputFocused) {
        this.searchControls.classList.add('sa-find-controls');
      } else {
        this.searchControls.classList.remove('sa-find-controls');
      }
    }

    tabChanged() {
      if (!this.findBarOuter) {
        return;
      }
      const tab = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
      const visible = tab === 0 || tab === 1 || tab === 2;
      this.findBarOuter.hidden = !visible;
    }

    inputChange() {
      if (!this.findInput.value) {
        // Show all available items when search is empty
        this.showDropDown();
        this.showAllItems();
        return;
      }

      this.showDropDown();

      // Get search value and apply case sensitivity
      let val = this.findInput.value;
      let searchVal = this.isCaseSensitive ? val : val.toLowerCase();

      if (searchVal === this.prevValue) {
        // No change so don't re-filter
        return;
      }
      this.prevValue = searchVal;

      // Add to search history
      this.addToHistory(val);

      this.dropdown.blocks = null;

      // Create regex if regex mode is enabled
      let regex = null;
      if (this.isRegexMode) {
        try {
          regex = new RegExp(val, this.isCaseSensitive ? 'g' : 'gi');
        } catch (e) {
          // Invalid regex, fall back to string search
          regex = null;
        }
      }

      // Hide items in list that do not contain filter text
      let listLI = this.dropdown.items;
      let visibleCount = 0;

      for (const li of listLI) {
        let procCode = li.data.procCode;
        let searchText = this.isCaseSensitive ? procCode : procCode.toLowerCase();
        let matchIndex = -1;
        let matchLength = 0;

        if (regex) {
          let match = regex.exec(procCode);
          if (match) {
            matchIndex = match.index;
            matchLength = match[0].length;
          }
          regex.lastIndex = 0; // Reset regex for next iteration
        } else {
          matchIndex = searchText.indexOf(searchVal);
          matchLength = searchVal.length;
        }

        if (matchIndex >= 0) {
          li.style.display = "block";
          visibleCount++;

          // Clear and rebuild the content with highlighting
          while (li.firstChild) {
            li.removeChild(li.firstChild);
          }

          if (matchIndex > 0) {
            li.appendChild(document.createTextNode(procCode.substring(0, matchIndex)));
          }

          let bText = document.createElement("b");
          bText.appendChild(document.createTextNode(procCode.substr(matchIndex, matchLength)));
          li.appendChild(bText);

          if (matchIndex + matchLength < procCode.length) {
            li.appendChild(document.createTextNode(procCode.substr(matchIndex + matchLength)));
          }
        } else {
          li.style.display = "none";
        }
      }

      this.updateSearchStats(visibleCount, listLI.length);
    }

    showAllItems() {
      // Show all items without filtering when search is empty
      let listLI = this.dropdown.items;
      let visibleCount = 0;

      for (const li of listLI) {
        li.style.display = "block";
        visibleCount++;

        // Clear highlighting and show plain text
        let procCode = li.displayName;
        while (li.firstChild) {
          li.removeChild(li.firstChild);
        }
        li.appendChild(document.createTextNode(procCode));
      }

      this.updateSearchStats(visibleCount, listLI.length);
    }

    inputKeyDown(e) {
      this.dropdown.inputKeyDown(e);

      // Search history navigation with Ctrl+Up/Down
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && (e.ctrlKey || e.metaKey)) {
        if (this.searchHistory.length > 0) {
          const direction = e.key === "ArrowUp" ? -1 : 1;
          this.currentHistoryIndex = Math.max(-1, Math.min(this.searchHistory.length - 1, this.currentHistoryIndex + direction));

          if (this.currentHistoryIndex >= 0) {
            this.findInput.value = this.searchHistory[this.currentHistoryIndex];
          } else {
            this.findInput.value = "";
          }
          this.inputChange();
        }
        e.preventDefault();
        return;
      }

      // F3 for next result, Shift+F3 for previous result
      if (e.key === "F3") {
        this.navigateResults(e.shiftKey ? -1 : 1);
        e.preventDefault();
        return;
      }

      // Enter
      if (e.key === "Enter") {
        this.findInput.blur();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        if (this.findInput.value.length > 0) {
          this.findInput.value = ""; // Clear search first, then close on second press
          this.inputChange();
        } else {
          this.findInput.blur();
        }
        e.preventDefault();
        return;
      }
    }

    toggleCaseSensitive() {
      this.isCaseSensitive = !this.isCaseSensitive;
      this.caseToggle.classList.toggle('sa-find-toggle-active', this.isCaseSensitive);
      this.prevValue = null; // Force re-filter
      this.inputChange();
    }

    toggleRegexMode() {
      this.isRegexMode = !this.isRegexMode;
      this.regexToggle.classList.toggle('sa-find-toggle-active', this.isRegexMode);
      this.prevValue = null; // Force re-filter
      this.inputChange();
    }

    navigateResults(direction) {
      const visibleItems = this.dropdown.items.filter(item => item.style.display !== 'none');
      if (visibleItems.length === 0) return;

      let currentIndex = visibleItems.indexOf(this.dropdown.selected);
      if (currentIndex === -1) {
        currentIndex = direction > 0 ? -1 : 0;
      }

      const newIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
      this.dropdown.onItemClick(visibleItems[newIndex]);
      visibleItems[newIndex].scrollIntoView({ block: 'nearest' });
    }

    updateSearchStats(visible, total) {
      if (this.searchStats) {
        if (total === 0) {
          this.searchStats.textContent = '';
        } else {
          this.searchStats.textContent = `${visible}/${total}`;
        }
      }
    }

    addToHistory(searchTerm) {
      if (!searchTerm || searchTerm === this.searchHistory[0]) return;

      // Remove existing occurrence
      const existing = this.searchHistory.indexOf(searchTerm);
      if (existing !== -1) {
        this.searchHistory.splice(existing, 1);
      }

      // Add to beginning
      this.searchHistory.unshift(searchTerm);

      // Trim to max size
      const maxHistory = addon.settings.get("maxHistory") || 50;
      this.searchHistory = this.searchHistory.slice(0, maxHistory);

      // Save to localStorage
      localStorage.setItem('sa-find-history', JSON.stringify(this.searchHistory));
    }

    eventKeyDown(e) {
      if (addon.self.disabled || !this.findBarOuter) return;

      let ctrlKey = e.ctrlKey || e.metaKey;

      if (e.key.toLowerCase() === "f" && ctrlKey && !e.shiftKey) {
        // Ctrl + F (Override default Ctrl+F find)
        this.findInput.focus();
        this.findInput.select();
        e.cancelBubble = true;
        e.preventDefault();
        return true;
      }

      if (e.key === "ArrowLeft" && ctrlKey) {
        // Ctrl + Left Arrow Key
        if (document.activeElement.tagName === "INPUT") {
          return;
        }

        if (this.selectedTab === 0) {
          this.utils.navigationHistory.goBack();
          e.cancelBubble = true;
          e.preventDefault();
          return true;
        }
      }

      if (e.key === "ArrowRight" && ctrlKey) {
        // Ctrl + Right Arrow Key
        if (document.activeElement.tagName === "INPUT") {
          return;
        }

        if (this.selectedTab === 0) {
          this.utils.navigationHistory.goForward();
          e.cancelBubble = true;
          e.preventDefault();
          return true;
        }
      }
    }

    showDropDown(focusID, instanceBlock) {
      // Allow refreshing the dropdown even if already visible (for empty search)
      if (!focusID && this.dropdownOut.classList.contains("visible") && this.findInput.value) {
        return;
      }

      // special '' vs null... - null forces a reevaluation
      this.prevValue = focusID ? "" : null; // Clear the previous value of the input search

      this.dropdownOut.classList.add("visible");
      let scratchBlocks =
        this.selectedTab === 0
          ? this.getScratchBlocks()
          : this.selectedTab === 1
            ? this.getScratchCostumes()
            : this.selectedTab === 2
              ? this.getScratchSounds()
              : [];

      this.dropdown.empty();

      const blockJson = addon.tab.traps.vm.runtime.getBlocksJSON();

      const colours = getColours(blockJson);
      const messages = getMessages(blockJson);
      
      for (const proc of scratchBlocks) {
        let item = this.dropdown.addItem(proc, messages, colours);

        if (focusID) {
          if (proc.matchesID(focusID)) {
            this.dropdown.onItemClick(item, instanceBlock);
          } else {
            item.style.display = "none";
          }
        }
      }

      this.utils.offsetX = this.dropdownOut.getBoundingClientRect().width + 32;
      this.utils.offsetY = 32;
    }

    hideDropDown() {
      this.dropdownOut.classList.remove("visible");
    }

    get selectedTab() {
      return addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
    }

    getScratchBlocks() {
      let myBlocks = [];
      let myBlocksByProcCode = {};

      // Get current sprite's workspace or all sprites if searchAllSprites is enabled
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

      const clsOrder = { flag: 0, receive: 1, event: 2, define: 3, var: 4, VAR: 5, list: 6, LIST: 7 };

      myBlocks.sort((a, b) => {
        let t = clsOrder[a.cls] - clsOrder[b.cls];
        if (t !== 0) {
          return t;
        }
        if (a.lower < b.lower) {
          return -1;
        }
        if (a.lower > b.lower) {
          return 1;
        }
        return (a.y || 0) - (b.y || 0);
      });

      return myBlocks;
    }

    addBlocksFromWorkspace(workspace, myBlocks, myBlocksByProcCode, spriteName, isCurrentSprite) {
      let topBlocks = workspace.getTopBlocks();

      const addBlock = (cls, txt, root) => {
        let id = root.id ? root.id : root.getId ? root.getId() : null;

        const displayText = isCurrentSprite || !spriteName ? txt : `[${spriteName}] ${txt}`;

        let clone = myBlocksByProcCode[displayText];
        if (clone) {
          if (!clone.clones) clone.clones = [];
          clone.clones.push(id);
          return clone;
        }
        let items = new BlockItem(cls, displayText, id, 0);
        items.y = root.getRelativeToSurfaceXY ? root.getRelativeToSurfaceXY().y : null;
        items.spriteName = spriteName;
        items.isCurrentSprite = isCurrentSprite;
        myBlocks.push(items);
        myBlocksByProcCode[displayText] = items;
        return items;
      };

      const getDescFromField = (root) => {
        let fields = root.inputList[0];
        let desc = "";
        for (const fieldRow of fields.fieldRow) {
          desc = desc ? desc + " " : "";
          if (fieldRow instanceof Blockly.FieldImage && fieldRow.src_.endsWith("green-flag.svg")) {
            desc += msg("/_general/blocks/green-flag");
          } else {
            desc += fieldRow.getText();
          }
        }
        return desc;
      };

      for (const root of topBlocks) {
        if (root.type === "procedures_definition") {
          const label = root.getChildren()[0];
          const procCode = label.getProcCode();
          if (!procCode) continue;
          const indexOfLabel = root.inputList.findIndex((i) => i.fieldRow.length > 0);
          if (indexOfLabel === -1) continue;
          const translatedDefine = root.inputList[indexOfLabel].fieldRow[0].getText();
          const message = indexOfLabel === 0 ? `${translatedDefine} ${procCode}` : `${procCode} ${translatedDefine}`;
          addBlock("define", message, root);
          continue;
        }

        if (root.type === "event_whenflagclicked") {
          addBlock("flag", getDescFromField(root), root);
          continue;
        }

        if (root.type === "event_whenbroadcastreceived") {
          const fieldRow = root.inputList[0].fieldRow;
          let eventName = fieldRow.find((input) => input.name === "BROADCAST_OPTION").getText();
          addBlock("receive", msg("event", { name: eventName }), root).eventName = eventName;
          continue;
        }

        if (root.type.substr(0, 10) === "event_when") {
          addBlock("event", getDescFromField(root), root);
          continue;
        }

        if (root.type === "control_start_as_clone") {
          addBlock("event", getDescFromField(root), root);
          continue;
        }
      }

      const blocks = this.workspace.getAllBlocks().filter(v => !v.isShadow_);
      for (const block of blocks) {
        const blockType = block.type;
        if (!blockType.startsWith("data_") &&
          !blockType.startsWith("event_") &&
          !blockType.startsWith("procedures_") &&
          blockType !== "control_start_as_clone" &&
          blockType !== "event_broadcast" &&
          blockType !== "event_broadcastandwait") {
          addBlock(blockType, blockType, block);
        }
      }

      let map = this.workspace.getVariableMap();

      let vars = map.getVariablesOfType("");
      for (const row of vars) {
        addBlock(
          row.isLocal ? "var" : "VAR",
          row.isLocal ? msg("var-local", { name: row.name }) : msg("var-global", { name: row.name }),
          row
        );
      }

      let lists = map.getVariablesOfType("list");
      for (const row of lists) {
        addBlock(
          row.isLocal ? "list" : "LIST",
          row.isLocal ? msg("list-local", { name: row.name }) : msg("list-global", { name: row.name }),
          row
        );
      }

      const events = this.getCallsToEvents();
      for (const event of events) {
        addBlock("receive", msg("event", { name: event.eventName }), event.block).eventName = event.eventName;
      }

      return myBlocks;
    }

    addBlocksFromTarget(target, myBlocks, myBlocksByProcCode, spriteName) {
      const blocks = target.blocks;
      if (!blocks._blocks) return;

      const addBlock = (cls, txt, blockId) => {
        const displayText = `[${spriteName}] ${txt}`;
        let clone = myBlocksByProcCode[displayText];
        if (clone) {
          if (!clone.clones) clone.clones = [];
          clone.clones.push(blockId);
          return clone;
        }
        let items = new BlockItem(cls, displayText, blockId, 0);
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
          if (block.opcode === "procedures_definition") {
            const procCode = block.mutation?.proccode || "custom block";
            addBlock("define", `define ${procCode}`, blockId);
          } else if (block.opcode === "event_whenflagclicked") {
            addBlock("flag", "when flag clicked", blockId);
          } else if (block.opcode === "event_whenbroadcastreceived") {
            const eventName = block.fields?.BROADCAST_OPTION?.value || "message";
            addBlock("receive", `when I receive ${eventName}`, blockId).eventName = eventName;
          } else if (block.opcode.startsWith("event_when")) {
            addBlock("event", block.opcode.replace("event_when", "when "), blockId);
          }
        }
      }

      const variables = target.variables;
      if (variables) {
        for (const varId of Object.keys(variables)) {
          const variable = variables[varId];
          if (variable.type === "") {
            addBlock("var", `var ${variable.name}`, varId);
          } else if (variable.type === "list") {
            addBlock("list", `list ${variable.name}`, varId);
          }
        }
      }
    }

    getScratchCostumes() {
      let costumes = this.utils.getEditingTarget().getCostumes();

      let items = [];

      let i = 0;
      for (const costume of costumes) {
        let item = new BlockItem("costume", costume.name, costume.assetId, i);
        items.push(item);
        i++;
      }

      return items;
    }

    getScratchSounds() {
      let sounds = this.utils.getEditingTarget().getSounds();

      let items = [];

      let i = 0;
      for (const sound of sounds) {
        let item = new BlockItem("sound", sound.name, sound.assetId, i);
        items.push(item);
        i++;
      }

      return items;
    }

    getCallsToEvents() {
      const uses = [];
      const alreadyFound = new Set();

      for (const block of this.workspace.getAllBlocks()) {
        if (block.type !== "event_broadcast" && block.type !== "event_broadcastandwait") {
          continue;
        }

        const broadcastInput = block.getChildren()[0];
        if (!broadcastInput) {
          continue;
        }

        let eventName = "";
        if (broadcastInput.type === "event_broadcast_menu") {
          eventName = broadcastInput.inputList[0].fieldRow[0].getText();
        } else {
          eventName = msg("complex-broadcast");
        }
        if (!alreadyFound.has(eventName)) {
          alreadyFound.add(eventName);
          uses.push({ eventName: eventName, block: block });
        }
      }

      return uses;
    }
  }

  class Dropdown {
    constructor(utils) {
      this.utils = utils;

      this.el = null;
      this.items = [];
      this.selected = null;
      this.carousel = new Carousel(this.utils);
    }

    get workspace() {
      return Blockly.getMainWorkspace();
    }

    createDom() {
      this.el = document.createElement("ul");
      this.el.className = "sa-find-dropdown";
      return this.el;
    }

    inputKeyDown(e) {
      // Up Arrow
      if (e.key === "ArrowUp") {
        this.navigateFilter(-1);
        e.preventDefault();
        return;
      }

      // Down Arrow
      if (e.key === "ArrowDown") {
        this.navigateFilter(1);
        e.preventDefault();
        return;
      }

      // Enter
      if (e.key === "Enter") {
        // Any selected on enter? if not select now
        if (this.selected) {
          this.navigateFilter(1);
        }
        e.preventDefault();
        return;
      }

      this.carousel.inputKeyDown(e);
    }

    navigateFilter(dir) {
      let nxt;
      if (this.selected && this.selected.style.display !== "none") {
        nxt = dir === -1 ? this.selected.previousSibling : this.selected.nextSibling;
      } else {
        nxt = this.items[0];
        dir = 1;
      }
      while (nxt && nxt.style.display === "none") {
        nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
      }
      if (nxt) {
        nxt.scrollIntoView({ block: "nearest"});
        this.onItemClick(nxt);
      }
    }

    addItem(proc, messages, colours) {
      const item = document.createElement("li");
      item.innerText = proc.procCode;
      item.data = proc;
      const name = proc.procCode.toUpperCase()
      item.displayName = messages[0][name] || messages[1][name] || proc.procCode;
      const colorIds = {
        receive: "events",
        event: "events",
        define: "more",
        var: "data",
        VAR: "data",
        list: "data-lists",
        LIST: "data-lists",
        costume: "looks",
        sound: "sounds",
        block: "more"
      };
      if (proc.cls === "flag") {
        item.className = "sa-find-flag";
      } else {
        let colorId = colorIds[proc.cls];
        if (!colorId) {
          const code = proc.procCode.split("_", 1)[0];
          if ([
              "motion",
              "control",
              "looks",
              "event",
              "sound",
              "sensing",
              "data",
              "pen",
              "extensions",
              "other"].includes(code)) {
            colorId = code;
            if (colorId === "sound") colorId = "sounds";
          } else if (code === "operator") {
            colorId = "operators";
          } else {
            colorId = "more";
          }
        }
        if (colorId === "more") {
          item.className = "sa-block-color sa-block-color-more";
          item.style.color = colours[name];
        } else {
          item.className = `sa-block-color sa-block-color-${colorId}`;
        }
      }
      item.addEventListener("mousedown", (e) => {
        this.onItemClick(item);
        e.preventDefault();
        return false;
      });
      this.items.push(item);
      this.el.appendChild(item);
      return item;
    }

    onItemClick(item, instanceBlock) {
      if (this.selected && this.selected !== item) {
        this.selected.classList.remove("sel");
        this.selected = null;
      }
      if (this.selected !== item) {
        item.classList.add("sel");
        this.selected = item;
      }

      // Handle cross-sprite navigation
      if (item.data.targetId && item.data.targetId !== this.utils.getEditingTarget().id) {
        const vm = addon.tab.traps.vm;
        const target = vm.runtime.getTargetById(item.data.targetId);
        if (target) {
          vm.setEditingTarget(target.id);
          setTimeout(() => {
            this.navigateToBlock(item, instanceBlock);
          }, 100);
          return;
        }
      }

      this.navigateToBlock(item, instanceBlock);
    }

    navigateToBlock(item, instanceBlock) {
      let cls = item.data.cls;
      if (cls === "costume" || cls === "sound") {
        const assetPanel = document.querySelector("[class^=asset-panel_wrapper]");
        if (assetPanel) {
          const reactInstance = assetPanel[addon.tab.traps.getInternalKey(assetPanel)];
          const reactProps = reactInstance.child.stateNode.props;
          reactProps.onItemClick(item.data.y);
          const selectorList = assetPanel.firstChild.firstChild;
          selectorList.children[item.data.y].scrollIntoView({
            behavior: "auto",
            block: "center",
            inline: "start",
          });
          let wrapper = assetPanel.closest("div[class*=gui_flex-wrapper]");
          wrapper.scrollTop = 0;
        }
      } else if (cls === "var" || cls === "VAR" || cls === "list" || cls === "LIST") {
        let blocks = this.getVariableUsesById(item.data.labelID);
        this.carousel.build(item, blocks, instanceBlock);
      } else if (cls === "define") {
        let blocks = this.getCallsToProcedureById(item.data.labelID);
        this.carousel.build(item, blocks, instanceBlock);
      } else if (cls === "receive") {
        let blocks = this.getCallsToEventsByName(item.data.eventName);
        if (!instanceBlock) {
          const currentTargetID = this.utils.getEditingTarget().id;
          for (const block of blocks) {
            if (block.targetId === currentTargetID) {
              instanceBlock = block;
              break;
            }
          }
        }
        this.carousel.build(item, blocks, instanceBlock);
      } else if (item.data.clones) {
        let blocks = [this.workspace.getBlockById(item.data.labelID)];
        for (const cloneID of item.data.clones) {
          blocks.push(this.workspace.getBlockById(cloneID));
        }
        this.carousel.build(item, blocks, instanceBlock);
      } else {
        this.utils.scrollBlockIntoView(item.data.labelID);
        this.carousel.remove();
      }
    }

    getVariableUsesById(id) {
      let uses = [];

      let topBlocks = this.workspace.getTopBlocks();
      for (const topBlock of topBlocks) {
        let kids = topBlock.getDescendants();
        for (const block of kids) {
          let blockVariables = block.getVarModels();
          if (blockVariables) {
            for (const blockVar of blockVariables) {
              if (blockVar.getId() === id) {
                uses.push(block);
              }
            }
          }
        }
      }

      return uses;
    }

    getCallsToProcedureById(id) {
      let procBlock = this.workspace.getBlockById(id);
      let label = procBlock.getChildren()[0];
      let procCode = label.getProcCode();

      let uses = [procBlock];
      let topBlocks = this.workspace.getTopBlocks();
      for (const topBlock of topBlocks) {
        let kids = topBlock.getDescendants();
        for (const block of kids) {
          if (block.type === "procedures_call") {
            if (block.getProcCode() === procCode) {
              uses.push(block);
            }
          }
        }
      }

      return uses;
    }

    getCallsToEventsByName(name) {
      let uses = [];

      const runtime = addon.tab.traps.vm.runtime;
      const targets = runtime.targets;

      for (const target of targets) {
        if (!target.isOriginal) continue;
        const blocks = target.blocks;
        if (!blocks._blocks) continue;

        for (const id of Object.keys(blocks._blocks)) {
          const block = blocks._blocks[id];
          if (block.opcode === "event_whenbroadcastreceived" && block.fields.BROADCAST_OPTION.value === name) {
            uses.push(new BlockInstance(target, block));
          } else if (block.opcode === "event_broadcast" || block.opcode === "event_broadcastandwait") {
            const broadcastInputBlockId = block.inputs.BROADCAST_INPUT.block;
            const broadcastInputBlock = blocks._blocks[broadcastInputBlockId];
            if (broadcastInputBlock) {
              let eventName;
              if (broadcastInputBlock.opcode === "event_broadcast_menu") {
                eventName = broadcastInputBlock.fields.BROADCAST_OPTION.value;
              } else {
                eventName = msg("complex-broadcast");
              }
              if (eventName === name) {
                uses.push(new BlockInstance(target, block));
              }
            }
          }
        }
      }

      return uses;
    }

    empty() {
      for (const item of this.items) {
        if (this.el.contains(item)) {
          this.el.removeChild(item);
        }
      }
      this.items = [];
      this.selected = null;
    }
  }

  class Carousel {
    constructor(utils) {
      this.utils = utils;

      this.el = null;
      this.count = null;
      this.blocks = [];
      this.idx = 0;
    }

    build(item, blocks, instanceBlock) {
      if (this.el && this.el.parentNode === item) {
        this.navRight();
      } else {
        this.remove();
        this.blocks = blocks;
        item.appendChild(this.createDom());

        this.idx = 0;
        if (instanceBlock) {
          for (const idx of Object.keys(this.blocks)) {
            const block = this.blocks[idx];
            if (block.id === instanceBlock.id) {
              this.idx = Number(idx);
              break;
            }
          }
        }

        if (this.idx < this.blocks.length) {
          this.utils.scrollBlockIntoView(this.blocks[this.idx]);
        }
      }
    }

    createDom() {
      this.el = document.createElement("span");
      this.el.className = "sa-find-carousel";

      const leftControl = this.el.appendChild(document.createElement("span"));
      leftControl.className = "sa-find-carousel-control";
      leftControl.textContent = "◀";
      leftControl.addEventListener("mousedown", (e) => this.navLeft(e));

      this.count = this.el.appendChild(document.createElement("span"));
      this.count.innerText = this.blocks.length > 0 ? this.idx + 1 + " / " + this.blocks.length : "0";

      const rightControl = this.el.appendChild(document.createElement("span"));
      rightControl.className = "sa-find-carousel-control";
      rightControl.textContent = "▶";
      rightControl.addEventListener("mousedown", (e) => this.navRight(e));

      return this.el;
    }

    inputKeyDown(e) {
      if (e.key === "ArrowLeft") {
        if (this.el && this.blocks) this.navLeft(e);
      }
      if (e.key === "ArrowRight") {
        if (this.el && this.blocks) this.navRight(e);
      }
    }

    navLeft(e) {
      return this.navSideways(e, -1);
    }

    navRight(e) {
      return this.navSideways(e, 1);
    }

    navSideways(e, dir) {
      if (this.blocks.length > 0) {
        this.idx = (this.idx + dir + this.blocks.length) % this.blocks.length;
        this.count.innerText = this.idx + 1 + " / " + this.blocks.length;
        this.utils.scrollBlockIntoView(this.blocks[this.idx]);
      }

      if (e) {
        e.cancelBubble = true;
        e.preventDefault();
      }
    }

    remove() {
      if (this.el) {
        this.el.remove();
        this.blocks = [];
        this.idx = 0;
      }
    }
  }

  const findBar = new FindBar();

  const _doBlockClick_ = Blockly.Gesture.prototype.doBlockClick_;
  Blockly.Gesture.prototype.doBlockClick_ = function () {
    if (!addon.self.disabled && (this.mostRecentEvent_.button === 1 || this.mostRecentEvent_.shiftKey)) {
      let block = this.startBlock_;
      for (; block; block = block.getSurroundParent()) {
        if (block.type === "procedures_definition" || (!this.jumpToDef && block.type === "procedures_call")) {
          let id = block.id ? block.id : block.getId ? block.getId() : null;

          findBar.findInput.focus();
          findBar.showDropDown(id);

          return;
        }

        if (
          block.type === "data_variable" ||
          block.type === "data_changevariableby" ||
          block.type === "data_setvariableto"
        ) {
          let id = block.getVars()[0];

          findBar.findInput.focus();
          findBar.showDropDown(id, block);

          findBar.selVarID = id;

          return;
        }

        if (
          block.type === "event_whenbroadcastreceived" ||
          block.type === "event_broadcastandwait" ||
          block.type === "event_broadcast"
        ) {
          let id = block.id;

          findBar.findInput.focus();
          findBar.showDropDown(id, block);

          findBar.selVarID = id;

          return;
        }
      }
    }

    _doBlockClick_.call(this);
  };

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB") {
      findBar.tabChanged();
    }
  });

  while (true) {
    const root = await addon.tab.waitForElement("ul[class*=gui_tab-list_]", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    findBar.createDom(root);
  }
}
