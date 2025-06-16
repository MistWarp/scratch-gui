import WindowManager from '../../window-system/window-manager.js';

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  let inspectorWindow = null;

  // Create the inspector content
  function createInspectorContent() {
    const container = document.createElement('div');
    container.className = 'dev-inspector-container';
    container.innerHTML = `
      <div class="dev-inspector-info">
        <div class="dev-inspector-info-grid">
          <div class="dev-inspector-info-item">
            <label>Block ID:</label>
            <span class="dev-inspector-block-id"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Block Type:</label>
            <span class="dev-inspector-block-type"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Category:</label>
            <span class="dev-inspector-block-category"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Opcode:</label>
            <span class="dev-inspector-block-opcode"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Position:</label>
            <span class="dev-inspector-block-position"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Has Parent:</label>
            <span class="dev-inspector-block-parent"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Has Children:</label>
            <span class="dev-inspector-block-children"></span>
          </div>
          <div class="dev-inspector-info-item">
            <label>Is Shadow:</label>
            <span class="dev-inspector-block-shadow"></span>
          </div>
        </div>
      </div>
      <div class="dev-inspector-json">
        <h3>JSON Representation</h3>
        <div class="dev-inspector-actions">
          <button class="dev-inspector-copy">Copy JSON</button>
          <button class="dev-inspector-download">Download JSON</button>
        </div>
        <pre class="dev-inspector-json-content"></pre>
      </div>
    `;
    
    // Add event listeners
    const copyBtn = container.querySelector('.dev-inspector-copy');
    const downloadBtn = container.querySelector('.dev-inspector-download');
    
    copyBtn.addEventListener('click', () => {
      const jsonContent = container.querySelector('.dev-inspector-json-content').textContent;
      navigator.clipboard.writeText(jsonContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy JSON';
        }, 2000);
      });
    });
    
    downloadBtn.addEventListener('click', () => {
      const jsonContent = container.querySelector('.dev-inspector-json-content').textContent;
      const blockId = container.querySelector('.dev-inspector-block-id').textContent;
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `block-${blockId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    
    // Add theming and proper styles
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      padding: 16px;
      height: 100%;
      overflow: hidden;
      background: var(--ui-primary, #ffffff);
      color: var(--text-primary, #575e75);
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    `;
    
    // Style the info section
    const infoSection = container.querySelector('.dev-inspector-info');
    infoSection.style.cssText = `
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));
    `;
    
    // Style the info grid
    const infoGrid = container.querySelector('.dev-inspector-info-grid');
    infoGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 12px;
    `;
    
    // Style info items
    const infoItems = container.querySelectorAll('.dev-inspector-info-item');
    infoItems.forEach(item => {
      item.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 6px;
      `;
      
      const label = item.querySelector('label');
      const span = item.querySelector('span');
      
      if (label) {
        label.style.cssText = `
          font-weight: 600;
          font-size: 11px;
          color: var(--text-primary-transparent, rgba(87, 94, 117, 0.75));
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        `;
      }
      
      if (span) {
        span.style.cssText = `
          padding: 8px 10px;
          background: var(--ui-secondary, #f9f9f9);
          border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          color: var(--text-primary, #575e75);
          word-break: break-all;
        `;
      }
    });
    
    // Style the JSON section
    const jsonSection = container.querySelector('.dev-inspector-json');
    jsonSection.style.cssText = `
      flex: 2;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Style action buttons
    const actionsDiv = container.querySelector('.dev-inspector-actions');
    actionsDiv.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const isDownload = button.textContent.includes('Download');
      button.style.cssText = `
        padding: 8px 16px;
        background: ${isDownload ? 'var(--ui-green, #0fbd8c)' : 'var(--ui-blue, #4c97ff)'};
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      `;
      
      // Add hover effects
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = 'none';
      });
    });
    
    // Style JSON content area
    const jsonContent = container.querySelector('.dev-inspector-json-content');
    jsonContent.style.cssText = `
      flex: 1;
      background: var(--ui-secondary, #f9f9f9);
      border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));
      border-radius: 6px;
      padding: 12px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 11px;
      line-height: 1.5;
      overflow: auto;
      white-space: pre-wrap;
      color: var(--text-primary, #575e75);
      margin: 0;
      resize: none;
    `;
    
    // Style headings
    const headings = container.querySelectorAll('h3');
    headings.forEach(h => {
      h.style.cssText = `
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #575e75);
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      `;
    });
    
    return container;
  }

  // Function to get comprehensive block information
  function getBlockInfo(block) {
    if (!block) return null;

    const blockInfo = {
      // Basic block information
      id: block.id,
      type: block.type,
      opcode: block.opcode || block.type,
      category: block.category_ || 'unknown',
      
      // Position and dimensions
      position: {
        x: block.getRelativeToSurfaceXY().x,
        y: block.getRelativeToSurfaceXY().y
      },
      
      // Hierarchy information
      parentBlock: block.getParent() ? block.getParent().id : null,
      childBlocks: block.getChildren().map(child => ({
        id: child.id,
        type: child.type,
        connection: child.getParent() === block ? 'direct' : 'unknown'
      })),
      
      // Block properties
      isShadow: block.isShadow(),
      isInsertionMarker: block.isInsertionMarker_ || false,
      isCollapsed: block.isCollapsed(),
      isMovable: block.isMovable(),
      isDeletable: block.isDeletable(),
      isEditable: block.isEditable(),
      
      // Input and field information
      inputs: {},
      fields: {},
      
      // Connection information
      connections: {
        output: block.outputConnection ? {
          connected: !!block.outputConnection.targetConnection,
          targetBlock: block.outputConnection.targetConnection ? 
            block.outputConnection.targetConnection.getSourceBlock().id : null
        } : null,
        previous: block.previousConnection ? {
          connected: !!block.previousConnection.targetConnection,
          targetBlock: block.previousConnection.targetConnection ? 
            block.previousConnection.targetConnection.getSourceBlock().id : null
        } : null,
        next: block.nextConnection ? {
          connected: !!block.nextConnection.targetConnection,
          targetBlock: block.nextConnection.targetConnection ? 
            block.nextConnection.targetConnection.getSourceBlock().id : null
        } : null
      },
      
      // Raw block data
      rawData: {}
    };

    // Get input information
    for (const inputName of block.inputList.map(input => input.name)) {
      const input = block.getInput(inputName);
      if (input) {
        blockInfo.inputs[inputName] = {
          type: input.type,
          connection: input.connection ? {
            connected: !!input.connection.targetConnection,
            targetBlock: input.connection.targetConnection ? 
              input.connection.targetConnection.getSourceBlock().id : null
          } : null,
          fields: input.fieldRow.map(field => field.name || 'unnamed')
        };
      }
    }

    // Get field information
    for (const fieldName of Object.keys(block.fieldRow || {})) {
      const field = block.getField(fieldName);
      if (field) {
        blockInfo.fields[fieldName] = {
          value: field.getValue(),
          text: field.getText ? field.getText() : field.getValue(),
          type: field.constructor.name
        };
      }
    }

    // Try to get Scratch VM block data if available
    try {
      if (vm && vm.runtime && vm.editingTarget) {
        const target = vm.editingTarget;
        const vmBlock = target.blocks.getBlock(block.id);
        if (vmBlock) {
          blockInfo.scratchData = {
            opcode: vmBlock.opcode,
            inputs: vmBlock.inputs,
            fields: vmBlock.fields,
            next: vmBlock.next,
            parent: vmBlock.parent,
            topLevel: vmBlock.topLevel,
            shadow: vmBlock.shadow,
            x: vmBlock.x,
            y: vmBlock.y
          };
        }
      }
    } catch (e) {
      console.warn('Could not get Scratch VM data:', e);
    }

    // Get raw block data (try to serialize to get full structure)
    try {
      const xmlBlock = Blockly.Xml.blockToDom(block);
      blockInfo.rawData.xml = Blockly.Xml.domToText(xmlBlock);
    } catch (e) {
      console.warn('Could not serialize block to XML:', e);
    }

    return blockInfo;
  }

  // Function to show the inspector
  function showInspector(block) {
    const blockInfo = getBlockInfo(block);
    if (!blockInfo) return;

    // Create or update the window
    if (inspectorWindow) {
      inspectorWindow.show().bringToFront();
    } else {
      inspectorWindow = WindowManager.createWindow({
        id: 'dev-inspector',
        title: 'Block Inspector',
        width: 600,
        height: 800,
        minWidth: 400,
        minHeight: 400,
        maxWidth: 1000,
        maxHeight: 1200,
        className: 'dev-inspector-window',
        onClose: () => {
          inspectorWindow = null;
        }
      });
      
      // Set the content
      const content = createInspectorContent();
      inspectorWindow.setContent(content);
      
      // Show the window
      inspectorWindow.show();
    }

    // Update the content with block info
    const container = inspectorWindow.element.querySelector('.dev-inspector-container');
    
    // Populate the information fields
    container.querySelector('.dev-inspector-block-id').textContent = blockInfo.id;
    container.querySelector('.dev-inspector-block-type').textContent = blockInfo.type;
    container.querySelector('.dev-inspector-block-category').textContent = blockInfo.category;
    container.querySelector('.dev-inspector-block-opcode').textContent = blockInfo.opcode;
    container.querySelector('.dev-inspector-block-position').textContent = 
      `(${blockInfo.position.x}, ${blockInfo.position.y})`;
    container.querySelector('.dev-inspector-block-parent').textContent = 
      blockInfo.parentBlock ? 'Yes' : 'No';
    container.querySelector('.dev-inspector-block-children').textContent = 
      blockInfo.childBlocks.length > 0 ? `Yes (${blockInfo.childBlocks.length})` : 'No';
    container.querySelector('.dev-inspector-block-shadow').textContent = 
      blockInfo.isShadow ? 'Yes' : 'No';
    
    // Populate the JSON content
    const jsonContent = container.querySelector('.dev-inspector-json-content');
    jsonContent.textContent = JSON.stringify(blockInfo, null, 2);
  }

  // Add context menu item
  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
      
      const inspectIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex = inspectIndex !== -1 ? inspectIndex : items.length;

      items.splice(
        insertBeforeIndex,
        0,
        {
          enabled: true,
          text: "Inspect Block",
          callback: () => {
            showInspector(block);
          },
          separator: true,
        }
      );

      return items;
    },
    { blocks: true }
  );
}
