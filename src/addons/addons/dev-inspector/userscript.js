import WindowManager from '../../window-system/window-manager.js';
import JSONEditor from 'jsoneditor';

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  let inspectorWindow = null;
  let projectJSONCache = null;
  let projectJSONCacheString = null;
  let projectJSONEditor = null;
  let blockJSONEditor = null;
  let projectLoaded = false;
  let activePanel = 'overview';
  let currentBlockInfo = null;
  // Filesystem-style navigation: history of visited block ids + path crumbs
  let navHistory = [];
  let navIndex = -1;

  const INPUT_TYPE_NAMES = {
    1: 'value',
    2: 'statement',
    3: 'dummy',
    5: 'end-row'
  };

  // ── helpers ──────────────────────────────────────────────────────────────

  /**
   * jsoneditor textmode.update(json) replaces the document with JSON.stringify(json).
   * Calling update() with no args stringifies undefined -> textarea shows "undefined".
   * Never call update/set without data. Resize only.
   */
  const refreshJSONEditor = editor => {
    if (!editor) return;
    try {
      if (typeof editor.resize === 'function') editor.resize();
    } catch (e) {
      /* ignore */
    }
    try {
      if (editor.aceEditor && typeof editor.aceEditor.resize === 'function') {
        editor.aceEditor.resize(true);
      }
    } catch (e) {
      /* ignore */
    }
  };

  /** Safe write: always pass a real JSON value (never bare undefined). */
  const setEditorJSON = (editor, data) => {
    if (!editor) return;
    const value = data === undefined ? null : data;
    const indent = (editor.options && editor.options.indentation) || 4;
    try {
      // Prefer set(object) so tree mode builds a real graph (not re-parsed text)
      if (typeof editor.set === 'function') {
        editor.set(value);
      } else if (typeof editor.setText === 'function') {
        editor.setText(JSON.stringify(value, null, indent));
      }
      // Expand top level in tree so nested keys are one click away
      if (editor.node && typeof editor.node.expand === 'function') {
        try {
          editor.node.expand(false);
        } catch (e) {
          /* ignore */
        }
      }
      // Code mode: match Ace tab size to indentation
      if (editor.aceEditor && editor.aceEditor.session) {
        try {
          editor.aceEditor.session.setTabSize(indent);
          editor.aceEditor.session.setUseSoftTabs(true);
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      try {
        if (typeof editor.set === 'function') {
          editor.set({$error: String(e && e.message || e)});
        } else if (typeof editor.setText === 'function') {
          editor.setText(JSON.stringify({$error: String(e && e.message || e)}, null, indent));
        }
      } catch (e2) {
        /* ignore */
      }
    }
    refreshJSONEditor(editor);
  };

  const createTextJSONEditor = editorContainer => {
    const editor = new JSONEditor(editorContainer, {
      // Tree = expand/collapse graph; code = raw JSON with highlighting
      mode: 'tree',
      modes: ['tree', 'code'],
      // Wider indent in code/text output (default is 2)
      indentation: 4,
      search: true,
      mainMenuBar: true,
      navigationBar: true,
      statusBar: true,
      // Allow editing nested values in tree mode
      onEditable: () => true
    });
    requestAnimationFrame(() => refreshJSONEditor(editor));
    return editor;
  };

  const ensureProjectJSONEditor = editorContainer => {
    if (projectJSONEditor) return;
    projectJSONEditor = createTextJSONEditor(editorContainer);
  };

  const ensureBlockJSONEditor = editorContainer => {
    if (blockJSONEditor) return;
    blockJSONEditor = createTextJSONEditor(editorContainer);
  };

  const observeEditorSize = (editorContainer, getEditor) => {
    if (!editorContainer || typeof ResizeObserver === 'undefined') return;
    if (editorContainer._diResizeObs) return;
    const obs = new ResizeObserver(() => {
      // Resize only - never update() without data
      refreshJSONEditor(getEditor());
    });
    obs.observe(editorContainer);
    editorContainer._diResizeObs = obs;
  };

  const getEditorText = editor => {
    if (!editor) return '';
    if (typeof editor.getText === 'function') return editor.getText();
    try {
      return JSON.stringify(editor.get(), null, 2);
    } catch (e) {
      return '';
    }
  };

  const flashButton = (btn, text, restore, ms = 1600) => {
    const original = restore || btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = text;
    clearTimeout(btn._flashTimer);
    btn._flashTimer = setTimeout(() => {
      btn.textContent = original;
    }, ms);
  };

  const escapeHtml = str => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const formatValue = value => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  const shortId = id => {
    if (!id) return '-';
    if (id.length <= 14) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  const findBlockById = blockId => {
    if (!blockId) return null;
    try {
      const workspace = addon.tab.traps.getWorkspace && addon.tab.traps.getWorkspace();
      if (workspace && workspace.getBlockById) {
        const b = workspace.getBlockById(blockId);
        if (b) return b;
      }
    } catch (e) {
      /* ignore */
    }
    // Flyout / other workspaces
    try {
      if (Blockly && Blockly.Workspace && Blockly.Workspace.getAll) {
        const workspaces = Blockly.Workspace.getAll();
        for (const ws of workspaces) {
          if (ws && ws.getBlockById) {
            const b = ws.getBlockById(blockId);
            if (b) return b;
          }
        }
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  };

  const describeConnection = connection => {
    if (!connection) return null;
    const target = connection.targetConnection
      ? connection.targetConnection.getSourceBlock()
      : null;
    return {
      connected: !!connection.targetConnection,
      targetId: target ? target.id : null,
      targetType: target ? target.type : null
    };
  };

  const getProjectJSON = () => {
    if (!vm || !vm.runtime) return null;
    try {
      return JSON.parse(vm.toJSON(undefined, {allowOptimization: false}));
    } catch (e) {
      console.error('Error getting project JSON:', e);
      return null;
    }
  };

  const findBlockInProjectJSON = (projectJson, blockId) => {
    if (!projectJson || !projectJson.targets) return null;
    for (let i = 0; i < projectJson.targets.length; i++) {
      const target = projectJson.targets[i];
      if (target && target.blocks && target.blocks[blockId]) {
        return {block: target.blocks[blockId], target, targetIndex: i};
      }
    }
    return null;
  };

  const findTargetForBlock = blockId => {
    if (!vm || !vm.runtime) return null;
    const targets = vm.runtime.targets || [];
    for (const target of targets) {
      if (target.blocks && target.blocks.getBlock && target.blocks.getBlock(blockId)) {
        return target;
      }
    }
    return vm.editingTarget || null;
  };

  const getShape = block => {
    if (block.outputConnection) {
      if (block.outputConnection.check_ && block.outputConnection.check_.includes('Boolean')) {
        return 'boolean';
      }
      return 'reporter';
    }
    if (block.startHat_) return 'hat';
    if (!block.nextConnection) return 'cap';
    return 'stack';
  };

  // Walk the next-chain from a root block (not into statement inputs)
  const getLinearStack = rootBlock => {
    const list = [];
    let b = rootBlock;
    while (b) {
      list.push(b);
      b = b.getNextBlock ? b.getNextBlock() : null;
    }
    return list;
  };

  // Depth along previous-chain within the same stack segment
  const getStackIndex = block => {
    let idx = 0;
    let b = block;
    while (b && b.getPreviousBlock && b.getPreviousBlock()) {
      b = b.getPreviousBlock();
      idx++;
    }
    return idx;
  };

  const collectFields = block => {
    const fields = [];
    if (!block.inputList) return fields;
    for (const input of block.inputList) {
      if (!input.fieldRow) continue;
      for (const field of input.fieldRow) {
        if (!field.name) continue;
        let value;
        try {
          value = field.getValue();
        } catch (e) {
          value = null;
        }
        let text = value;
        try {
          if (typeof field.getText === 'function') text = field.getText();
        } catch (e) {
          /* ignore */
        }
        fields.push({
          name: field.name,
          value,
          text,
          type: field.constructor ? field.constructor.name : 'Field',
          input: input.name || '(dummy)'
        });
      }
    }
    return fields;
  };

  const collectInputs = block => {
    const inputs = [];
    if (!block.inputList) return inputs;
    for (const input of block.inputList) {
      if (!input.name) continue;
      const conn = describeConnection(input.connection);
      let shadowValue = null;
      if (conn && conn.connected) {
        const target = input.connection.targetConnection.getSourceBlock();
        if (target && target.isShadow && target.isShadow()) {
          // Collect shadow field values for quick reading
          const shadowFields = collectFields(target);
          if (shadowFields.length === 1) {
            shadowValue = shadowFields[0].text;
          } else if (shadowFields.length > 1) {
            shadowValue = shadowFields.map(f => `${f.name}=${f.text}`).join(', ');
          }
        }
      }
      inputs.push({
        name: input.name,
        type: INPUT_TYPE_NAMES[input.type] || String(input.type),
        connected: conn ? conn.connected : false,
        targetId: conn ? conn.targetId : null,
        targetType: conn ? conn.targetType : null,
        shadowValue
      });
    }
    return inputs;
  };

  const getRunningThreads = blockId => {
    if (!vm || !vm.runtime || !vm.runtime.threads) return [];
    return vm.runtime.threads.filter(t => {
      if (!t || !t.stack) return false;
      return t.stack.includes(blockId) || t.topBlock === blockId;
    }).map(t => ({
      topBlock: t.topBlock,
      stack: (t.stack || []).slice(),
      status: t.status,
      stackClick: !!t.stackClick,
      updateMonitor: !!t.updateMonitor,
      targetId: t.target ? t.target.id : null,
      targetName: t.target && t.target.getName ? t.target.getName() : null
    }));
  };

  // ── block info extraction ────────────────────────────────────────────────

  function getBlockInfo (block) {
    if (!block) return null;

    const pos = block.getRelativeToSurfaceXY
      ? block.getRelativeToSurfaceXY()
      : {x: 0, y: 0};

    const parent = block.getParent ? block.getParent() : null;
    const previous = block.getPreviousBlock ? block.getPreviousBlock() : null;
    const next = block.getNextBlock ? block.getNextBlock() : null;
    const root = block.getRootBlock ? block.getRootBlock() : block;
    const surround = block.getSurroundParent ? block.getSurroundParent() : null;

    const children = (block.getChildren ? block.getChildren(false) : []).map(child => ({
      id: child.id,
      type: child.type
    }));

    const linearStack = getLinearStack(root);
    const stackIndex = getStackIndex(block);

    const target = findTargetForBlock(block.id);
    const targetName = target
      ? (target.isStage ? 'Stage' : (target.getName ? target.getName() : target.sprite?.name))
      : null;
    const targetId = target ? target.id : null;

    let vmBlock = null;
    try {
      if (target && target.blocks) {
        vmBlock = target.blocks.getBlock(block.id) || null;
      }
    } catch (e) {
      /* ignore */
    }

    let commentText = null;
    try {
      if (block.comment && typeof block.comment.getText === 'function') {
        commentText = block.comment.getText();
      } else if (vmBlock && vmBlock.comment) {
        const comments = target.comments || {};
        const c = comments[vmBlock.comment];
        if (c) commentText = c.text;
      }
    } catch (e) {
      /* ignore */
    }

    let mutation = null;
    try {
      if (block.mutationToDom) {
        const mutDom = block.mutationToDom();
        if (mutDom) {
          mutation = Blockly.Xml.domToText(mutDom);
        }
      }
      if (vmBlock && vmBlock.mutation) {
        mutation = vmBlock.mutation;
      }
    } catch (e) {
      /* ignore */
    }

    const procedureName = (() => {
      try {
        if (block.type === 'procedures_definition' || block.type === 'procedures_call' ||
            block.type === 'procedures_prototype') {
          const field = block.getField && (block.getField('NAME') || block.getField('PROCCODE'));
          if (field) return field.getValue();
          // Scratch uses mutation proccode
          if (vmBlock && vmBlock.mutation && vmBlock.mutation.proccode) {
            return vmBlock.mutation.proccode;
          }
        }
        if (vmBlock && vmBlock.mutation && vmBlock.mutation.proccode) {
          return vmBlock.mutation.proccode;
        }
      } catch (e) {
        /* ignore */
      }
      return null;
    })();

    const threads = getRunningThreads(block.id);

    const fields = collectFields(block);
    const inputs = collectInputs(block);

    const info = {
      id: block.id,
      type: block.type,
      opcode: (vmBlock && vmBlock.opcode) || block.type,
      shape: getShape(block),
      category: block.category_ || null,
      colour: block.getColour ? block.getColour() : null,

      position: {
        x: Math.round(pos.x * 100) / 100,
        y: Math.round(pos.y * 100) / 100
      },

      targetId,
      targetName,
      isStage: !!(target && target.isStage),

      parent: parent ? {id: parent.id, type: parent.type} : null,
      previous: previous ? {id: previous.id, type: previous.type} : null,
      next: next ? {id: next.id, type: next.type} : null,
      root: root ? {id: root.id, type: root.type} : null,
      surround: surround ? {id: surround.id, type: surround.type} : null,
      children,

      connections: {
        output: describeConnection(block.outputConnection),
        previous: describeConnection(block.previousConnection),
        next: describeConnection(block.nextConnection)
      },

      flags: {
        shadow: !!(block.isShadow && block.isShadow()),
        insertionMarker: !!(block.isInsertionMarker && block.isInsertionMarker()),
        collapsed: !!(block.isCollapsed && block.isCollapsed()),
        disabled: !!block.disabled,
        movable: block.isMovable ? !!block.isMovable() : true,
        deletable: block.isDeletable ? !!block.isDeletable() : true,
        editable: block.isEditable ? !!block.isEditable() : true,
        topLevel: !!(vmBlock && vmBlock.topLevel) || !parent
      },

      fields,
      inputs,
      comment: commentText,
      mutation,
      procedureName,

      stack: {
        rootId: root ? root.id : block.id,
        rootType: root ? root.type : block.type,
        length: linearStack.length,
        index: stackIndex,
        blocks: linearStack.map((b, i) => ({
          id: b.id,
          type: b.type,
          index: i,
          isCurrent: b.id === block.id
        }))
      },

      threads,

      scratchData: vmBlock ? {
        opcode: vmBlock.opcode,
        inputs: vmBlock.inputs,
        fields: vmBlock.fields,
        next: vmBlock.next,
        parent: vmBlock.parent,
        topLevel: vmBlock.topLevel,
        shadow: vmBlock.shadow,
        x: vmBlock.x,
        y: vmBlock.y,
        mutation: vmBlock.mutation || undefined,
        comment: vmBlock.comment || undefined
      } : null
    };

    return info;
  }

  // ── UI builders ──────────────────────────────────────────────────────────

  /** Clickable block reference (filesystem-style navigation) */
  const blockLink = (id, type, opts = {}) => {
    if (!id) return null;
    const label = opts.label || type || id;
    const idPart = opts.hideId
      ? ''
      : ` <span class="dev-inspector-block-link-id">(${escapeHtml(shortId(id))})</span>`;
    return (
      `<button type="button" class="dev-inspector-block-link" data-block-id="${escapeHtml(id)}" ` +
      `title="Inspect ${escapeHtml(type || '')} ${escapeHtml(id)}">` +
      `${escapeHtml(label)}${idPart}</button>`
    );
  };

  const propRow = (key, value, opts = {}) => {
    const valClass = opts.plain
      ? 'dev-inspector-prop-val dev-inspector-prop-val-plain'
      : 'dev-inspector-prop-val';
    let display;
    if (value == null || value === '') {
      display = `<span class="dev-inspector-muted">-</span>`;
    } else if (opts.html) {
      display = value;
    } else {
      display = escapeHtml(formatValue(value));
    }
    return `
      <div class="dev-inspector-prop">
        <div class="dev-inspector-prop-key">${escapeHtml(key)}</div>
        <div class="${valClass}">${display}</div>
      </div>
    `;
  };

  const propsTable = rows => {
    // rows: [{key, value, plain?, html?}]
    if (!rows || !rows.length) {
      return `<div class="dev-inspector-empty">No data</div>`;
    }
    return `<div class="dev-inspector-props">${rows.map(r => propRow(r.key, r.value, r)).join('')}</div>`;
  };

  const flagsHtml = flags => {
    if (!flags) return '';
    const entries = [
      ['shadow', flags.shadow],
      ['top-level', flags.topLevel],
      ['collapsed', flags.collapsed],
      ['disabled', flags.disabled],
      ['movable', flags.movable],
      ['deletable', flags.deletable],
      ['editable', flags.editable],
      ['insertion', flags.insertionMarker]
    ];
    return `
      <div class="dev-inspector-flags">
        ${entries.map(([name, on]) =>
    `<span class="dev-inspector-flag${on ? ' dev-inspector-flag-on' : ''}">${escapeHtml(name)}</span>`
  ).join('')}
      </div>
    `;
  };

  const refLink = ref => {
    if (!ref || !ref.id) return null;
    return blockLink(ref.id, ref.type);
  };

  /** Local tree: parent (if any) > current > children */
  const renderLocalTree = info => {
    const rows = [];
    if (info.parent) {
      rows.push({
        id: info.parent.id,
        type: info.parent.type,
        depth: 0,
        current: false,
        role: 'parent'
      });
    }
    rows.push({
      id: info.id,
      type: info.type,
      depth: info.parent ? 1 : 0,
      current: true,
      role: 'current'
    });
    const childDepth = (info.parent ? 1 : 0) + 1;
    for (const c of info.children) {
      rows.push({
        id: c.id,
        type: c.type,
        depth: childDepth,
        current: false,
        role: 'child'
      });
    }

    if (rows.length <= 1 && !info.children.length) {
      return `<div class="dev-inspector-empty">No linked blocks to browse</div>`;
    }

    return `
      <div class="dev-inspector-tree" role="tree">
        ${rows.map(r => {
    const indent = r.depth > 0 ? `${'  '.repeat(r.depth - 1)}└ ` : '';
    const meta = r.role === 'parent' ? 'up' : r.role === 'child' ? 'in' : 'here';
    if (r.current) {
      return `
            <div class="dev-inspector-tree-row dev-inspector-tree-row-current" role="treeitem" aria-current="true">
              <span class="dev-inspector-tree-indent">${escapeHtml(indent)}</span>
              <span class="dev-inspector-tree-label">${escapeHtml(r.type)}</span>
              <span class="dev-inspector-tree-meta">${meta}</span>
            </div>
          `;
    }
    return `
          <button type="button" class="dev-inspector-tree-row" role="treeitem"
            data-block-id="${escapeHtml(r.id)}"
            title="Inspect ${escapeHtml(r.type)}">
            <span class="dev-inspector-tree-indent">${escapeHtml(indent)}</span>
            <span class="dev-inspector-tree-label">${escapeHtml(r.type)}</span>
            <span class="dev-inspector-tree-meta">${meta}</span>
          </button>
        `;
  }).join('')}
      </div>
    `;
  };

  const renderOverview = info => {
    const el = document.createElement('div');
    el.className = 'dev-inspector-panel-scroll';
    el.innerHTML = `
      <h2 class="dev-inspector-section-title">Overview</h2>
      <p class="dev-inspector-section-sub">${escapeHtml(info.opcode)}${info.procedureName ? ` · ${escapeHtml(info.procedureName)}` : ''}</p>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Identity</div>
        ${propsTable([
    {key: 'Opcode', value: info.opcode},
    {key: 'Type', value: info.type},
    {key: 'Block ID', value: info.id},
    {key: 'Shape', value: info.shape, plain: true},
    {key: 'Category', value: info.category},
    {key: 'Procedure', value: info.procedureName}
  ])}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Location</div>
        ${propsTable([
    {key: 'Target', value: info.targetName, plain: true},
    {key: 'Target ID', value: info.targetId},
    {key: 'Position', value: `(${info.position.x}, ${info.position.y})`},
    {key: 'Top of stack', value: refLink(info.root), html: true},
    {key: 'Stack index', value: `${info.stack.index} / ${Math.max(info.stack.length - 1, 0)}`}
  ])}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Browse</div>
        <p class="dev-inspector-section-sub" style="margin:0 0 8px">Click a block to inspect it (parent / children).</p>
        ${renderLocalTree(info)}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Flags</div>
        ${flagsHtml(info.flags)}
      </div>

      ${info.comment ? `
        <div class="dev-inspector-block">
          <div class="dev-inspector-block-label">Comment</div>
          ${propsTable([{key: 'Text', value: info.comment, plain: true}])}
        </div>
      ` : ''}

      ${info.mutation ? `
        <div class="dev-inspector-block">
          <div class="dev-inspector-block-label">Mutation</div>
          ${propsTable([{
    key: 'Data',
    value: typeof info.mutation === 'string' ? info.mutation : JSON.stringify(info.mutation)
  }])}
        </div>
      ` : ''}
    `;
    return el;
  };

  const renderConnections = info => {
    const el = document.createElement('div');
    el.className = 'dev-inspector-panel-scroll';

    const outputConn = info.connections.output;
    const connRows = [
      {key: 'Parent', value: refLink(info.parent), html: true},
      {key: 'Previous', value: refLink(info.previous), html: true},
      {key: 'Next', value: refLink(info.next), html: true},
      {key: 'Surround', value: refLink(info.surround), html: true},
      {key: 'Root', value: refLink(info.root), html: true},
      {
        key: 'Output',
        value: outputConn
          ? (outputConn.connected
            ? blockLink(outputConn.targetId, outputConn.targetType)
            : 'disconnected')
          : null,
        html: !!(outputConn && outputConn.connected)
      }
    ];

    let childrenHtml;
    if (!info.children.length) {
      childrenHtml = `<div class="dev-inspector-empty">No child blocks</div>`;
    } else {
      childrenHtml = `
        <div class="dev-inspector-table-wrap">
          <table class="dev-inspector-table">
            <thead><tr><th>#</th><th>Type</th><th>ID</th></tr></thead>
            <tbody>
              ${info.children.map((c, i) => `
                <tr class="dev-inspector-row-link" data-block-id="${escapeHtml(c.id)}" title="Inspect ${escapeHtml(c.type)}">
                  <td>${i}</td>
                  <td>${blockLink(c.id, c.type, {hideId: true})}</td>
                  <td>${escapeHtml(c.id)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    el.innerHTML = `
      <h2 class="dev-inspector-section-title">Connections</h2>
      <p class="dev-inspector-section-sub">Click any linked block to inspect it.</p>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Tree</div>
        ${renderLocalTree(info)}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Linked blocks</div>
        ${propsTable(connRows)}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Children (${info.children.length})</div>
        ${childrenHtml}
      </div>
    `;
    return el;
  };

  const renderInputs = info => {
    const el = document.createElement('div');
    el.className = 'dev-inspector-panel-scroll';

    let fieldsHtml;
    if (!info.fields.length) {
      fieldsHtml = `<div class="dev-inspector-empty">No fields</div>`;
    } else {
      fieldsHtml = `
        <div class="dev-inspector-table-wrap">
          <table class="dev-inspector-table">
            <thead><tr><th>Name</th><th>Value</th><th>Text</th><th>Type</th></tr></thead>
            <tbody>
              ${info.fields.map(f => `
                <tr>
                  <td>${escapeHtml(f.name)}</td>
                  <td>${escapeHtml(formatValue(f.value))}</td>
                  <td>${escapeHtml(formatValue(f.text))}</td>
                  <td>${escapeHtml(f.type)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let inputsHtml;
    if (!info.inputs.length) {
      inputsHtml = `<div class="dev-inspector-empty">No inputs</div>`;
    } else {
      inputsHtml = `
        <div class="dev-inspector-table-wrap">
          <table class="dev-inspector-table">
            <thead><tr><th>Name</th><th>Kind</th><th>Connected</th><th>Target / value</th></tr></thead>
            <tbody>
              ${info.inputs.map(inp => {
    let target = '<span class="dev-inspector-muted">-</span>';
    const rowAttrs = inp.connected && inp.targetId
      ? ` class="dev-inspector-row-link" data-block-id="${escapeHtml(inp.targetId)}" title="Inspect ${escapeHtml(inp.targetType || '')}"`
      : '';
    if (inp.connected && inp.targetId) {
      const valueHint = inp.shadowValue != null
        ? ` = ${escapeHtml(String(inp.shadowValue))}`
        : '';
      target = `${blockLink(inp.targetId, inp.targetType)}${valueHint}`;
    }
    return `
                  <tr${rowAttrs}>
                    <td>${escapeHtml(inp.name)}</td>
                    <td>${escapeHtml(inp.type)}</td>
                    <td>${inp.connected ? 'yes' : 'no'}</td>
                    <td>${target}</td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // VM-level inputs/fields snapshot
    let vmHtml = '';
    if (info.scratchData) {
      const vmFieldEntries = Object.entries(info.scratchData.fields || {});
      const vmInputEntries = Object.entries(info.scratchData.inputs || {});
      vmHtml = `
        <div class="dev-inspector-block">
          <div class="dev-inspector-block-label">VM fields</div>
          ${vmFieldEntries.length ? propsTable(vmFieldEntries.map(([k, v]) => ({
    key: k,
    value: v && typeof v === 'object' && 'value' in v ? v.value : v
  }))) : `<div class="dev-inspector-empty">None</div>`}
        </div>
        <div class="dev-inspector-block">
          <div class="dev-inspector-block-label">VM inputs</div>
          ${vmInputEntries.length ? propsTable(vmInputEntries.map(([k, v]) => {
    if (!v) return {key: k, value: '-'};
    const parts = [];
    if (v.block) parts.push(blockLink(v.block, 'block'));
    if (v.shadow && v.shadow !== v.block) parts.push(`shadow: ${blockLink(v.shadow, 'shadow')}`);
    return {
      key: k,
      value: parts.length ? parts.join(' ') : '-',
      html: true
    };
  })) : `<div class="dev-inspector-empty">None</div>`}
        </div>
      `;
    }

    el.innerHTML = `
      <h2 class="dev-inspector-section-title">Inputs &amp; fields</h2>
      <p class="dev-inspector-section-sub">Click a connected block to inspect it.</p>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Fields (${info.fields.length})</div>
        ${fieldsHtml}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Inputs (${info.inputs.length})</div>
        ${inputsHtml}
      </div>

      ${vmHtml}
    `;
    return el;
  };

  const renderStack = info => {
    const el = document.createElement('div');
    el.className = 'dev-inspector-panel-scroll';

    const stack = info.stack;
    let stackHtml;
    if (!stack.blocks.length) {
      stackHtml = `<div class="dev-inspector-empty">Empty stack</div>`;
    } else {
      stackHtml = `
        <div class="dev-inspector-table-wrap">
          <table class="dev-inspector-table">
            <thead><tr><th>#</th><th>Type</th><th>ID</th></tr></thead>
            <tbody>
              ${stack.blocks.map(b => `
                <tr class="${b.isCurrent ? 'dev-inspector-row-current' : 'dev-inspector-row-link'}"
                  ${b.isCurrent ? '' : `data-block-id="${escapeHtml(b.id)}" title="Inspect ${escapeHtml(b.type)}"`}>
                  <td>${b.index}</td>
                  <td>${b.isCurrent
    ? `${escapeHtml(b.type)}  &lt;-`
    : blockLink(b.id, b.type, {hideId: true})}</td>
                  <td>${escapeHtml(b.id)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let threadsHtml;
    if (!info.threads.length) {
      threadsHtml = `<div class="dev-inspector-empty">No running threads reference this block</div>`;
    } else {
      threadsHtml = `
        <div class="dev-inspector-table-wrap">
          <table class="dev-inspector-table">
            <thead><tr><th>Target</th><th>Status</th><th>Stack depth</th><th>Top block</th><th>Flags</th></tr></thead>
            <tbody>
              ${info.threads.map(t => `
                <tr>
                  <td>${escapeHtml(t.targetName || shortId(t.targetId))}</td>
                  <td>${escapeHtml(String(t.status))}</td>
                  <td>${t.stack.length}</td>
                  <td>${t.topBlock ? blockLink(t.topBlock, 'top') : '-'}</td>
                  <td>${[
    t.stackClick ? 'click' : null,
    t.updateMonitor ? 'monitor' : null
  ].filter(Boolean).join(', ') || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    el.innerHTML = `
      <h2 class="dev-inspector-section-title">Stack</h2>
      <p class="dev-inspector-section-sub">Linear stack from the root hat/top block through next-links.</p>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Summary</div>
        ${propsTable([
    {key: 'Root', value: blockLink(stack.rootId, stack.rootType), html: true},
    {key: 'Length', value: String(stack.length), plain: true},
    {key: 'This block', value: `index ${stack.index}`, plain: true},
    {key: 'Surround', value: refLink(info.surround), html: true}
  ])}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Stack outline</div>
        <p class="dev-inspector-section-sub" style="margin:0 0 8px">Click a row to jump to that block in the stack.</p>
        ${stackHtml}
      </div>

      <div class="dev-inspector-block">
        <div class="dev-inspector-block-label">Running threads (${info.threads.length})</div>
        ${threadsHtml}
      </div>
    `;
    return el;
  };

  // ── shell ────────────────────────────────────────────────────────────────

  function createInspectorContent () {
    const container = document.createElement('div');
    container.className = 'dev-inspector-container';
    // Ensure we fill the window content flex area (jsoneditor needs real height)
    container.style.flex = '1 1 0%';
    container.style.minHeight = '0';
    container.style.height = '100%';
    container.innerHTML = `
      <aside class="dev-inspector-sidebar">
        <nav class="dev-inspector-sidebar-nav" aria-label="Inspector sections">
          <div class="dev-inspector-group">
            <div class="dev-inspector-group-header">Inspect</div>
            <button type="button" class="dev-inspector-nav-item dev-inspector-nav-item-active" data-panel="overview">Overview</button>
            <button type="button" class="dev-inspector-nav-item" data-panel="connections">Connections</button>
            <button type="button" class="dev-inspector-nav-item" data-panel="inputs">Inputs</button>
            <button type="button" class="dev-inspector-nav-item" data-panel="stack">Stack</button>
          </div>
          <div class="dev-inspector-group">
            <div class="dev-inspector-group-header">Data</div>
            <button type="button" class="dev-inspector-nav-item" data-panel="block-json">Block JSON</button>
            <button type="button" class="dev-inspector-nav-item" data-panel="project-json">Project JSON</button>
          </div>
        </nav>
      </aside>
      <div class="dev-inspector-main">
        <div class="dev-inspector-pathbar">
          <button type="button" class="dev-inspector-path-btn dev-inspector-nav-back" title="Back" disabled>&#8592;</button>
          <button type="button" class="dev-inspector-path-btn dev-inspector-nav-forward" title="Forward" disabled>&#8594;</button>
          <button type="button" class="dev-inspector-path-btn dev-inspector-nav-up" title="Parent block" disabled>&#8593;</button>
          <div class="dev-inspector-crumbs" aria-label="Navigation path"></div>
        </div>
        <div class="dev-inspector-panel dev-inspector-panel-active" data-panel="overview"></div>
        <div class="dev-inspector-panel" data-panel="connections"></div>
        <div class="dev-inspector-panel" data-panel="inputs"></div>
        <div class="dev-inspector-panel" data-panel="stack"></div>
        <div class="dev-inspector-panel" data-panel="block-json">
          <div class="dev-inspector-toolbar">
            <button type="button" class="dev-inspector-copy">Copy</button>
            <button type="button" class="dev-inspector-download">Download</button>
            <button type="button" class="dev-inspector-save dev-inspector-btn-primary">Save &amp; reload</button>
          </div>
          <div class="dev-inspector-editor-wrap">
            <div class="dev-inspector-json-editor"></div>
          </div>
        </div>
        <div class="dev-inspector-panel" data-panel="project-json">
          <div class="dev-inspector-toolbar">
            <button type="button" class="dev-inspector-project-refresh">Refresh</button>
            <button type="button" class="dev-inspector-project-copy">Copy</button>
            <button type="button" class="dev-inspector-project-download">Download</button>
            <button type="button" class="dev-inspector-project-reload dev-inspector-btn-danger">Reload project</button>
          </div>
          <div class="dev-inspector-editor-wrap">
            <div class="dev-inspector-project-editor"></div>
          </div>
        </div>
      </div>
    `;

    const navItems = container.querySelectorAll('.dev-inspector-nav-item');
    const panels = container.querySelectorAll('.dev-inspector-panel');
    const blockEditorContainer = container.querySelector('.dev-inspector-json-editor');
    const projectEditorContainer = container.querySelector('.dev-inspector-project-editor');
    const copyBtn = container.querySelector('.dev-inspector-copy');
    const downloadBtn = container.querySelector('.dev-inspector-download');
    const saveBtn = container.querySelector('.dev-inspector-save');
    const projectRefreshBtn = container.querySelector('.dev-inspector-project-refresh');
    const projectCopyBtn = container.querySelector('.dev-inspector-project-copy');
    const projectDownloadBtn = container.querySelector('.dev-inspector-project-download');
    const projectReloadBtn = container.querySelector('.dev-inspector-project-reload');

    const loadProjectJSONAsync = editorContainer => {
      if (!vm || !vm.runtime) {
        ensureProjectJSONEditor(editorContainer);
        setEditorJSON(projectJSONEditor, {$error: 'VM not available'});
        return;
      }
      ensureProjectJSONEditor(editorContainer);
      setEditorJSON(projectJSONEditor, {$status: 'Loading project JSON...'});
      requestAnimationFrame(() => {
        try {
          const projectJson = vm.toJSON();
          projectJSONCache = projectJson;
          requestAnimationFrame(() => {
            try {
              const parsed = JSON.parse(projectJson);
              projectJSONCacheString = JSON.stringify(parsed, null, 2);
              setEditorJSON(projectJSONEditor, parsed);
              projectLoaded = true;
            } catch (e) {
              setEditorJSON(projectJSONEditor, {$error: 'Error parsing project JSON: ' + e.message});
              console.error('Error parsing project JSON:', e);
            }
          });
        } catch (e) {
          setEditorJSON(projectJSONEditor, {$error: 'Error loading project JSON: ' + e.message});
          console.error('Error loading project JSON:', e);
        }
      });
    };

    const setPanel = panelId => {
      activePanel = panelId;
      navItems.forEach(item => {
        item.classList.toggle('dev-inspector-nav-item-active', item.dataset.panel === panelId);
      });
      panels.forEach(panel => {
        panel.classList.toggle('dev-inspector-panel-active', panel.dataset.panel === panelId);
      });

      // Wait for layout so jsoneditor gets a non-zero clientHeight
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (panelId === 'block-json') {
            observeEditorSize(blockEditorContainer, () => blockJSONEditor);
            initBlockJSON(container);
            refreshJSONEditor(blockJSONEditor);
          }
          if (panelId === 'project-json') {
            observeEditorSize(projectEditorContainer, () => projectJSONEditor);
            ensureProjectJSONEditor(projectEditorContainer);
            if (!projectLoaded) {
              loadProjectJSONAsync(projectEditorContainer);
            }
            refreshJSONEditor(projectJSONEditor);
          }
        });
      });
    };

    navItems.forEach(item => {
      item.addEventListener('click', () => setPanel(item.dataset.panel));
    });

    copyBtn.addEventListener('click', () => {
      ensureBlockJSONEditor(blockEditorContainer);
      if (!blockJSONEditor) {
        flashButton(copyBtn, 'Not ready');
        return;
      }
      navigator.clipboard.writeText(getEditorText(blockJSONEditor)).then(() => {
        flashButton(copyBtn, 'Copied');
      }).catch(() => flashButton(copyBtn, 'Failed'));
    });

    downloadBtn.addEventListener('click', () => {
      ensureBlockJSONEditor(blockEditorContainer);
      if (!blockJSONEditor) {
        flashButton(downloadBtn, 'Not ready');
        return;
      }
      const blockId = currentBlockInfo ? currentBlockInfo.id : 'block';
      const blob = new Blob([getEditorText(blockJSONEditor)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `block-${blockId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    saveBtn.addEventListener('click', async () => {
      ensureBlockJSONEditor(blockEditorContainer);
      if (!blockJSONEditor) {
        flashButton(saveBtn, 'Not ready');
        return;
      }
      if (!vm || !vm.runtime || !currentBlockInfo) {
        flashButton(saveBtn, 'No block');
        return;
      }
      try {
        const newBlockData = blockJSONEditor.get();
        const projectJson = getProjectJSON();
        if (!projectJson) {
          flashButton(saveBtn, 'No project');
          return;
        }
        const blockResult = findBlockInProjectJSON(projectJson, currentBlockInfo.id);
        if (!blockResult) {
          flashButton(saveBtn, 'Not found');
          return;
        }
        if (JSON.stringify(blockResult.block) === JSON.stringify(newBlockData)) {
          flashButton(saveBtn, 'No changes');
          return;
        }
        blockResult.target.blocks[currentBlockInfo.id] = newBlockData;
        saveBtn.disabled = true;
        flashButton(saveBtn, 'Reloading…', 'Save & reload', 5000);
        projectJSONCache = null;
        projectJSONCacheString = null;
        projectLoaded = false;
        await vm.runtime.stopAll();
        await vm.loadProject(projectJson);
        flashButton(saveBtn, 'Saved');
        saveBtn.disabled = false;
      } catch (e) {
        flashButton(saveBtn, 'Invalid JSON');
        saveBtn.disabled = false;
        console.error('Error saving block JSON:', e);
      }
    });

    projectRefreshBtn.addEventListener('click', () => {
      projectJSONCache = null;
      projectJSONCacheString = null;
      projectLoaded = false;
      projectRefreshBtn.disabled = true;
      flashButton(projectRefreshBtn, 'Refreshing…');
      ensureProjectJSONEditor(projectEditorContainer);
      loadProjectJSONAsync(projectEditorContainer);
      setTimeout(() => {
        projectRefreshBtn.disabled = false;
        flashButton(projectRefreshBtn, projectLoaded ? 'Refreshed' : 'Done');
      }, 200);
    });

    projectCopyBtn.addEventListener('click', () => {
      ensureProjectJSONEditor(projectEditorContainer);
      if (!projectJSONEditor) {
        flashButton(projectCopyBtn, 'Not ready');
        return;
      }
      navigator.clipboard.writeText(getEditorText(projectJSONEditor)).then(() => {
        flashButton(projectCopyBtn, 'Copied');
      }).catch(() => flashButton(projectCopyBtn, 'Failed'));
    });

    projectDownloadBtn.addEventListener('click', () => {
      ensureProjectJSONEditor(projectEditorContainer);
      if (!projectJSONEditor) {
        flashButton(projectDownloadBtn, 'Not ready');
        return;
      }
      const blob = new Blob([getEditorText(projectJSONEditor)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    projectReloadBtn.addEventListener('click', async () => {
      try {
        ensureProjectJSONEditor(projectEditorContainer);
        if (!projectJSONEditor) {
          flashButton(projectReloadBtn, 'Not ready');
          return;
        }
        if (!vm || !vm.runtime) {
          flashButton(projectReloadBtn, 'No VM');
          return;
        }
        const newProjectData = projectJSONEditor.get();
        projectReloadBtn.disabled = true;
        flashButton(projectReloadBtn, 'Reloading…', 'Reload project', 5000);
        projectJSONCache = null;
        projectJSONCacheString = null;
        projectLoaded = false;
        await vm.runtime.stopAll();
        await vm.loadProject(newProjectData);
        flashButton(projectReloadBtn, 'Reloaded');
        projectReloadBtn.disabled = false;
      } catch (e) {
        flashButton(projectReloadBtn, 'Invalid JSON');
        projectReloadBtn.disabled = false;
        console.error('Error reloading project:', e);
      }
    });

    // Filesystem-style block navigation
    const backBtn = container.querySelector('.dev-inspector-nav-back');
    const forwardBtn = container.querySelector('.dev-inspector-nav-forward');
    const upBtn = container.querySelector('.dev-inspector-nav-up');

    backBtn.addEventListener('click', () => {
      if (navIndex <= 0) return;
      navIndex -= 1;
      const entry = navHistory[navIndex];
      const block = findBlockById(entry.id);
      if (block) {
        showInspector(block, {fromNav: true});
      }
    });
    forwardBtn.addEventListener('click', () => {
      if (navIndex >= navHistory.length - 1) return;
      navIndex += 1;
      const entry = navHistory[navIndex];
      const block = findBlockById(entry.id);
      if (block) {
        showInspector(block, {fromNav: true});
      }
    });
    upBtn.addEventListener('click', () => {
      if (!currentBlockInfo || !currentBlockInfo.parent) return;
      navigateToBlockId(currentBlockInfo.parent.id, {history: 'push'});
    });

    // Event delegation for all block links / tree rows / table rows
    container.addEventListener('click', e => {
      const link = e.target.closest('[data-block-id]');
      if (!link || !container.contains(link)) return;
      // Don't re-navigate to current via tree "here" rows (they have no data-block-id)
      const blockId = link.getAttribute('data-block-id');
      if (!blockId) return;
      if (currentBlockInfo && blockId === currentBlockInfo.id) return;
      e.preventDefault();
      navigateToBlockId(blockId, {history: 'push'});
    });

    container._setPanel = setPanel;
    container._updatePathbar = () => updatePathbar(container);
    return container;
  }

  function updatePathbar (container) {
    if (!container) return;
    const backBtn = container.querySelector('.dev-inspector-nav-back');
    const forwardBtn = container.querySelector('.dev-inspector-nav-forward');
    const upBtn = container.querySelector('.dev-inspector-nav-up');
    const crumbs = container.querySelector('.dev-inspector-crumbs');
    if (!crumbs) return;

    if (backBtn) backBtn.disabled = navIndex <= 0;
    if (forwardBtn) forwardBtn.disabled = navIndex >= navHistory.length - 1 || navIndex < 0;
    if (upBtn) upBtn.disabled = !(currentBlockInfo && currentBlockInfo.parent);

    // Build structural path root -> ... -> current (via parent chain)
    const structural = [];
    if (currentBlockInfo) {
      let cursor = findBlockById(currentBlockInfo.id);
      const seen = new Set();
      while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id);
        structural.unshift({id: cursor.id, type: cursor.type});
        cursor = cursor.getParent ? cursor.getParent() : null;
      }
      // Fallback if Blockly parent chain empty: use history trail
      if (structural.length <= 1 && navHistory.length) {
        structural.length = 0;
        for (let i = 0; i <= navIndex && i < navHistory.length; i++) {
          structural.push(navHistory[i]);
        }
      }
    }

    if (!structural.length) {
      crumbs.innerHTML = `<span class="dev-inspector-muted">No block selected</span>`;
      return;
    }

    crumbs.innerHTML = structural.map((entry, i) => {
      const isLast = i === structural.length - 1;
      const sep = i > 0 ? `<span class="dev-inspector-crumb-sep">/</span>` : '';
      if (isLast) {
        return `${sep}<span class="dev-inspector-crumb dev-inspector-crumb-current" title="${escapeHtml(entry.id)}">${escapeHtml(entry.type || shortId(entry.id))}</span>`;
      }
      return `${sep}<button type="button" class="dev-inspector-crumb" data-block-id="${escapeHtml(entry.id)}" title="${escapeHtml(entry.id)}">${escapeHtml(entry.type || shortId(entry.id))}</button>`;
    }).join('');
  }

  function navigateToBlockId (blockId, opts = {}) {
    const mode = opts.history || 'push';
    const block = findBlockById(blockId);
    if (!block) {
      console.warn('Dev Inspector: block not found', blockId);
      return;
    }

    const entry = {id: block.id, type: block.type};

    if (mode === 'push') {
      // Drop any forward entries when branching
      if (navIndex < navHistory.length - 1) {
        navHistory = navHistory.slice(0, navIndex + 1);
      }
      // Don't push duplicate of current
      if (!navHistory.length || navHistory[navIndex].id !== entry.id) {
        navHistory.push(entry);
        navIndex = navHistory.length - 1;
      }
    } else if (mode === 'replace') {
      navHistory = [entry];
      navIndex = 0;
    }

    showInspector(block, {fromNav: true});
  }

  function getBlockJSONPayload () {
    if (!currentBlockInfo) return {$error: 'No block selected'};
    try {
      const projectJson = getProjectJSON();
      const blockResult = findBlockInProjectJSON(projectJson, currentBlockInfo.id);
      if (blockResult && blockResult.block) return blockResult.block;
    } catch (e) {
      /* fall through */
    }
    if (currentBlockInfo.scratchData) return currentBlockInfo.scratchData;
    return {
      id: currentBlockInfo.id,
      opcode: currentBlockInfo.opcode,
      fields: currentBlockInfo.fields,
      inputs: currentBlockInfo.inputs
    };
  }

  function initBlockJSON (container) {
    const blockEditorContainer = container.querySelector('.dev-inspector-json-editor');
    if (!blockEditorContainer) return;

    // Recreate if a prior instance was built while the host had no size
    // (jsoneditor measures container once; a 0-height host leaves a dead editor).
    if (blockJSONEditor && blockEditorContainer.clientHeight > 0) {
      const frame = blockEditorContainer.querySelector('.jsoneditor');
      if (frame && frame.clientHeight < 80) {
        try {
          if (typeof blockJSONEditor.destroy === 'function') blockJSONEditor.destroy();
        } catch (e) {
          /* ignore */
        }
        blockJSONEditor = null;
        blockEditorContainer.innerHTML = '';
      }
    }

    ensureBlockJSONEditor(blockEditorContainer);
    if (!blockJSONEditor || !currentBlockInfo) return;

    setEditorJSON(blockJSONEditor, getBlockJSONPayload());
  }

  function fillInfoPanels (container, info) {
    const overview = container.querySelector('.dev-inspector-panel[data-panel="overview"]');
    const connections = container.querySelector('.dev-inspector-panel[data-panel="connections"]');
    const inputs = container.querySelector('.dev-inspector-panel[data-panel="inputs"]');
    const stack = container.querySelector('.dev-inspector-panel[data-panel="stack"]');

    overview.innerHTML = '';
    connections.innerHTML = '';
    inputs.innerHTML = '';
    stack.innerHTML = '';

    overview.appendChild(renderOverview(info));
    connections.appendChild(renderConnections(info));
    inputs.appendChild(renderInputs(info));
    stack.appendChild(renderStack(info));

    if (container._updatePathbar) {
      container._updatePathbar();
    }
  }

  function showInspector (block, opts = {}) {
    const blockInfo = getBlockInfo(block);
    if (!blockInfo) return;
    currentBlockInfo = blockInfo;

    // Fresh open from context menu: reset history to this block
    if (!opts.fromNav) {
      navHistory = [{id: blockInfo.id, type: blockInfo.type}];
      navIndex = 0;
    }

    if (inspectorWindow) {
      inspectorWindow.show().bringToFront();
    } else {
      const cleanup = () => {
        inspectorWindow = null;
        projectJSONCache = null;
        projectJSONCacheString = null;
        projectLoaded = false;
        currentBlockInfo = null;
        navHistory = [];
        navIndex = -1;
        if (projectJSONEditor) {
          try {
            projectJSONEditor.destroy();
          } catch (e) {
            /* ignore */
          }
          projectJSONEditor = null;
        }
        if (blockJSONEditor) {
          try {
            blockJSONEditor.destroy();
          } catch (e) {
            /* ignore */
          }
          blockJSONEditor = null;
        }
      };

      inspectorWindow = WindowManager.createWindow({
        id: 'dev-inspector',
        title: 'Block Inspector',
        width: 720,
        height: 560,
        minWidth: 420,
        minHeight: 320,
        maxWidth: 1400,
        maxHeight: 1000,
        className: 'dev-inspector-window',
        destroyOnMinimize: true,
        onClose: cleanup,
        onMinimize: cleanup
      });

      const content = createInspectorContent();
      inspectorWindow.setContent(content);
      inspectorWindow.show();
    }

    const container = inspectorWindow.element.querySelector('.dev-inspector-container');
    fillInfoPanels(container, blockInfo);

    if (typeof inspectorWindow.setTitle === 'function') {
      inspectorWindow.setTitle(`Block Inspector - ${blockInfo.opcode}`);
    }

    // Refresh JSON if that panel is active
    if (activePanel === 'block-json') {
      initBlockJSON(container);
    }

    // Keep current panel selection
    if (container._setPanel) {
      container._setPanel(activePanel);
    }
  }

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;

      const inspectIndex = items.findIndex(obj => obj._isDevtoolsFirstItem);
      const insertBeforeIndex = inspectIndex !== -1 ? inspectIndex : items.length;

      items.splice(insertBeforeIndex, 0, {
        enabled: true,
        text: 'Inspect Block',
        callback: () => {
          showInspector(block);
        },
        separator: true
      });

      return items;
    },
    {blocks: true}
  );
}
