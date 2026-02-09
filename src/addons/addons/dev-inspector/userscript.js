import WindowManager from '../../window-system/window-manager.js';
import JSONEditor from 'jsoneditor';

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  let inspectorWindow = null;
  let projectJSONCache = null;
  let projectJSONCacheString = null;
  let projectJSONEditor = null;
  let blockJSONEditor = null;

  const createTextJSONEditor = (editorContainer) => {
    const editor = new JSONEditor(editorContainer, {
      mode: 'text',
      modes: ['text'],
      search: true,
      mainMenuBar: true,
      navigationBar: false,
      statusBar: true,
      onModeChange: function (newMode) {
      }
    });
    setTimeout(() => {
      try {
        editor.update();
      } catch (e) {
      }
    }, 50);
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

  const getEditorText = editor => {
    if (!editor) return '';
    if (typeof editor.getText === 'function') return editor.getText();
    return JSON.stringify(editor.get(), null, 2);
  };

  function getProjectJSON() {
    if (!vm || !vm.runtime) return null;
    try {
      return JSON.parse(vm.toJSON(undefined, {allowOptimization: false}));
    } catch (e) {
      console.error('Error getting project JSON:', e);
      return null;
    }
  }

  function findBlockInProjectJSON(projectJson, blockId) {
    if (!projectJson || !projectJson.targets) return null;
    
    const targetKeys = Object.keys(projectJson.targets);
    for (let i = 0; i < targetKeys.length; i++) {
      const target = projectJson.targets[targetKeys[i]];
      if (target && target.blocks && target.blocks[blockId]) {
        return { block: target.blocks[blockId], target, targetId: targetKeys[i] };
      }
    }
    return null;
  }

  function createInspectorContent() {
    const container = document.createElement('div');
    container.className = 'dev-inspector-container';
    container.innerHTML = `
      <div class="dev-inspector-tabs">
        <button class="dev-inspector-tab dev-inspector-tab-active" data-tab="block">Block</button>
        <button class="dev-inspector-tab" data-tab="project">Project</button>
      </div>
      <div class="dev-inspector-content-panel" data-panel="block">
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
        <div class="dev-inspector-actions">
          <button class="dev-inspector-copy">Copy JSON</button>
          <button class="dev-inspector-download">Download JSON</button>
          <button class="dev-inspector-save">Save JSON</button>
        </div>
        <div class="dev-inspector-json-editor"></div>
        </div>
      </div>
      <div class="dev-inspector-content-panel dev-inspector-hidden" data-panel="project">
        <div class="dev-inspector-actions">
          <button class="dev-inspector-project-refresh">Refresh JSON</button>
          <button class="dev-inspector-project-copy">Copy JSON</button>
          <button class="dev-inspector-project-download">Download JSON</button>
          <button class="dev-inspector-project-reload">Reload Project</button>
        </div>
        <div class="dev-inspector-project-editor"></div>
      </div>
    `;
    
    const copyBtn = container.querySelector('.dev-inspector-copy');
    const downloadBtn = container.querySelector('.dev-inspector-download');
    const blockEditorContainer = container.querySelector('.dev-inspector-json-editor');

    copyBtn.addEventListener('click', () => {
      ensureBlockJSONEditor(blockEditorContainer);
      if (!blockJSONEditor) {
        copyBtn.textContent = 'Editor not ready!';
        setTimeout(() => copyBtn.textContent = 'Copy JSON', 2000);
        return;
      }
      navigator.clipboard.writeText(getEditorText(blockJSONEditor)).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy JSON';
        }, 2000);
      });
    });

    downloadBtn.addEventListener('click', () => {
      const blockId = container.querySelector('.dev-inspector-block-id').textContent;
      ensureBlockJSONEditor(blockEditorContainer);
      if (!blockJSONEditor) {
        downloadBtn.textContent = 'Editor not ready!';
        setTimeout(() => downloadBtn.textContent = 'Download JSON', 2000);
        return;
      }
      const blob = new Blob([getEditorText(blockJSONEditor)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `block-${blockId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    const saveBtn = container.querySelector('.dev-inspector-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        ensureBlockJSONEditor(blockEditorContainer);
        if (!blockJSONEditor) {
          saveBtn.textContent = 'Editor not ready!';
          setTimeout(() => saveBtn.textContent = 'Save JSON', 2000);
          return;
        }
        const blockIdSpan = container.querySelector('.dev-inspector-block-id');
        try {
          const newBlockData = blockJSONEditor.get();

          if (!vm || !vm.runtime || !blockIdSpan.textContent) {
            saveBtn.textContent = 'VM not available!';
            setTimeout(() => {
              saveBtn.textContent = 'Save JSON';
            }, 2000);
            return;
          }

          const blockId = blockIdSpan.textContent;
          let projectJson = getProjectJSON();

          if (!projectJson) {
            saveBtn.textContent = 'Failed to get project JSON!';
            setTimeout(() => {
              saveBtn.textContent = 'Save JSON';
            }, 2000);
            return;
          }

          const blockResult = findBlockInProjectJSON(projectJson, blockId);
          if (!blockResult) {
            saveBtn.textContent = 'Block not found in project!';
            setTimeout(() => {
              saveBtn.textContent = 'Save JSON';
            }, 2000);
            return;
          }

          const currentBlockData = blockResult.block;
          const currentDataStr = JSON.stringify(currentBlockData);
          const newDataStr = JSON.stringify(newBlockData);

          if (currentDataStr === newDataStr) {
            saveBtn.textContent = 'No changes detected!';
            setTimeout(() => {
              saveBtn.textContent = 'Save JSON';
            }, 2000);
            return;
          }

          blockResult.target.blocks[blockId] = newBlockData;

          saveBtn.textContent = 'Reloading...';
          saveBtn.disabled = true;

          projectJSONCache = null;
          projectJSONCacheString = null;

          await vm.runtime.stopAll();
          await vm.loadProject(projectJson);

          saveBtn.textContent = 'Saved & Reloaded!';
          setTimeout(() => {
            saveBtn.textContent = 'Save JSON';
            saveBtn.disabled = false;
          }, 2000);
        } catch (e) {
          saveBtn.textContent = 'Invalid JSON!';
          setTimeout(() => {
            saveBtn.textContent = 'Save JSON';
          }, 2000);
          console.error('Error saving block JSON:', e);
        }
      });
    }
    
    const tabs = container.querySelectorAll('.dev-inspector-tab');
    const panels = container.querySelectorAll('.dev-inspector-content-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        tabs.forEach(t => {
          t.classList.remove('dev-inspector-tab-active');
        });
        tab.classList.add('dev-inspector-tab-active');
        
        panels.forEach(panel => {
          const panelType = panel.getAttribute('data-panel');
          if (panelType === targetTab) {
            panel.classList.remove('dev-inspector-hidden');
            panel.style.cssText = `
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              min-height: 0;
              gap: 16px;
            `;
          } else {
            panel.classList.add('dev-inspector-hidden');
            panel.style.cssText = `
              flex: 0;
              display: none;
              flex-direction: column;
              overflow: hidden;
              min-height: 0;
              gap: 16px;
            `;
          }
        });
        
        if (targetTab === 'project') {
          const projectEditorContainer = container.querySelector('.dev-inspector-project-editor');
          if (projectEditorContainer && (!projectEditorContainer.dataset.loaded || projectEditorContainer.dataset.loaded !== 'true')) {
            ensureProjectJSONEditor(projectEditorContainer);
            loadProjectJSONAsync(projectEditorContainer);
          }
        }
      });
    });
    const projectRefreshBtn = container.querySelector('.dev-inspector-project-refresh');
    const projectCopyBtn = container.querySelector('.dev-inspector-project-copy');
    const projectDownloadBtn = container.querySelector('.dev-inspector-project-download');
    const projectReloadBtn = container.querySelector('.dev-inspector-project-reload');
    const projectEditorContainer = container.querySelector('.dev-inspector-project-editor');

    function loadProjectJSONAsync(editorContainer) {
      if (!vm || !vm.runtime) {
        ensureProjectJSONEditor(editorContainer);
        try {
          projectJSONEditor.set({$error: 'VM not available'});
        } catch (e) {
        }
        return;
      }

      ensureProjectJSONEditor(editorContainer);
      try {
        projectJSONEditor.set({$status: 'Loading project JSON...'});
      } catch (e) {
      }

      requestAnimationFrame(() => {
        try {
          const projectJson = vm.toJSON();
          projectJSONCache = projectJson;

          requestAnimationFrame(() => {
            try {
              const parsed = JSON.parse(projectJson);
              projectJSONCacheString = JSON.stringify(parsed, null, 2);

              requestAnimationFrame(() => {
                try {
                  projectJSONEditor.set(parsed);
                } catch (e) {
                  projectJSONEditor.set({$error: 'Error showing project JSON: ' + e.message});
                }
                editorContainer.dataset.loaded = 'true';
              });
            } catch (e) {
              try {
                projectJSONEditor.set({$error: 'Error parsing project JSON: ' + e.message});
              } catch (e2) {
              }
              console.error('Error parsing project JSON:', e);
            }
          });
        } catch (e) {
          try {
            projectJSONEditor.set({$error: 'Error loading project JSON: ' + e.message});
          } catch (e2) {
          }
          console.error('Error loading project JSON:', e);
        }
      });
    }
    
    projectRefreshBtn.addEventListener('click', () => {
      projectRefreshBtn.textContent = 'Refreshing...';
      projectRefreshBtn.disabled = true;
      projectJSONCache = null;
      projectJSONCacheString = null;

      ensureProjectJSONEditor(projectEditorContainer);
      loadProjectJSONAsync(projectEditorContainer);

      setTimeout(() => {
        if (projectEditorContainer.dataset.loaded === 'true') {
          projectRefreshBtn.textContent = 'Refreshed!';
        } else {
          projectRefreshBtn.textContent = 'Refresh Failed!';
        }
        setTimeout(() => {
          projectRefreshBtn.textContent = 'Refresh JSON';
          projectRefreshBtn.disabled = false;
        }, 1000);
      }, 100);
    });

    projectCopyBtn.addEventListener('click', () => {
      ensureProjectJSONEditor(projectEditorContainer);
      if (!projectJSONEditor) {
        projectCopyBtn.textContent = 'Editor not ready!';
        setTimeout(() => projectCopyBtn.textContent = 'Copy JSON', 2000);
        return;
      }
      navigator.clipboard.writeText(getEditorText(projectJSONEditor)).then(() => {
        projectCopyBtn.textContent = 'Copied!';
        setTimeout(() => {
          projectCopyBtn.textContent = 'Copy JSON';
        }, 2000);
      });
    });

    projectDownloadBtn.addEventListener('click', () => {
      ensureProjectJSONEditor(projectEditorContainer);
      if (!projectJSONEditor) {
        projectDownloadBtn.textContent = 'Editor not ready!';
        setTimeout(() => projectDownloadBtn.textContent = 'Download JSON', 2000);
        return;
      }
      const blob = new Blob([getEditorText(projectJSONEditor)], { type: 'application/json' });
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
          projectReloadBtn.textContent = 'Editor not ready!';
          setTimeout(() => projectReloadBtn.textContent = 'Reload Project', 2000);
          return;
        }
        const newProjectData = projectJSONEditor.get();

        if (!vm || !vm.runtime) {
          projectReloadBtn.textContent = 'VM not available!';
          setTimeout(() => {
            projectReloadBtn.textContent = 'Reload Project';
          }, 2000);
          return;
        }

        projectReloadBtn.textContent = 'Reloading...';
        projectReloadBtn.disabled = true;

        projectJSONCache = null;
        projectJSONCacheString = null;

        await vm.runtime.stopAll();
        await vm.loadProject(newProjectData);

        projectReloadBtn.textContent = 'Project Reloaded!';
        projectEditorContainer.dataset.loaded = 'false';

        setTimeout(() => {
          projectReloadBtn.textContent = 'Reload Project';
          projectReloadBtn.disabled = false;
        }, 2000);
      } catch (e) {
        projectReloadBtn.textContent = 'Invalid JSON!';
        setTimeout(() => {
          projectReloadBtn.textContent = 'Reload Project';
          projectReloadBtn.disabled = false;
        }, 2000);
        console.error('Error reloading project:', e);
      }
    });
    

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
          overflow-wrap: anywhere;
          min-height: 20px;
          box-sizing: border-box;
        `;
      }
    });
    
    

    
    const contentPanels = container.querySelectorAll('.dev-inspector-content-panel');
    const activeTab = container.querySelector('.dev-inspector-tab-active')?.getAttribute('data-tab') || 'block';
    contentPanels.forEach(panel => {
      const panelType = panel.getAttribute('data-panel');
      const isVisible = panelType === activeTab;
      if (isVisible) {
        panel.classList.remove('dev-inspector-hidden');
        panel.style.cssText = `
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
          gap: 16px;
        `;
      } else {
        panel.classList.add('dev-inspector-hidden');
        panel.style.cssText = `
          flex: 0;
          display: none;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
          gap: 16px;
        `;
      }
    });
    
    
    
    const actionDivs = container.querySelectorAll('.dev-inspector-actions');
    actionDivs.forEach(actionsDiv => {
    actionsDiv.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    `;
    });
    
    
    return container;
  }

  function getBlockInfo(block) {
    if (!block) return null;

    const blockInfo = {
      id: block.id,
      type: block.type,
      opcode: block.opcode || block.type,
      category: block.category_ || 'unknown',
      
      position: {
        x: block.getRelativeToSurfaceXY().x,
        y: block.getRelativeToSurfaceXY().y
      },
      
      parentBlock: block.getParent() ? block.getParent().id : null,
      childBlocks: block.getChildren().map(child => ({
        id: child.id,
        type: child.type,
        connection: child.getParent() === block ? 'direct' : 'unknown'
      })),
      
      isShadow: block.isShadow(),
      isInsertionMarker: block.isInsertionMarker_ || false,
      isCollapsed: block.isCollapsed(),
      isMovable: block.isMovable(),
      isDeletable: block.isDeletable(),
      isEditable: block.isEditable(),
      
      inputs: {},
      fields: {},
      
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
      
      rawData: {}
    };

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

    try {
      const xmlBlock = Blockly.Xml.blockToDom(block);
      blockInfo.rawData.xml = Blockly.Xml.domToText(xmlBlock);
    } catch (e) {
      console.warn('Could not serialize block to XML:', e);
    }

    return blockInfo;
  }

  function showInspector(block) {
    const blockInfo = getBlockInfo(block);
    if (!blockInfo) return;

    if (inspectorWindow) {
      inspectorWindow.show().bringToFront();
    } else {
      const cleanup = () => {
        inspectorWindow = null;
        projectJSONCache = null;
        projectJSONCacheString = null;

        if (projectJSONEditor) {
          try {
            projectJSONEditor.destroy();
          } catch (e) {
            // ignore
          }
          projectJSONEditor = null;
        }
        if (blockJSONEditor) {
          try {
            blockJSONEditor.destroy();
          } catch (e) {
            // ignore
          }
          blockJSONEditor = null;
        }
      };

      inspectorWindow = WindowManager.createWindow({
        id: 'dev-inspector',
        title: 'Block Inspector',
        width: 650,
        height: 750,
        minWidth: 350,
        minHeight: 300,
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

      const container = inspectorWindow.element.querySelector('.dev-inspector-container');
      const infoGrid = container.querySelector('.dev-inspector-info-grid');

      const updateGridColumns = () => {
        if (!infoGrid) return;

        const containerWidth = container.offsetWidth - 32;
        if (containerWidth < 400) {
          infoGrid.style.gridTemplateColumns = '1fr';
        } else if (containerWidth < 600) {
          infoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (containerWidth < 800) {
          infoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
          infoGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }

        requestAnimationFrame(() => {
          if (blockJSONEditor && typeof blockJSONEditor.update === 'function') {
            try {
              blockJSONEditor.update();
            } catch (e) {
            }
          }
          if (projectJSONEditor && typeof projectJSONEditor.update === 'function') {
            try {
              projectJSONEditor.update();
            } catch (e) {
            }
          }
        });
      };

      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(updateGridColumns);
        resizeObserver.observe(container);
      }

      setTimeout(updateGridColumns, 0);
    }

    const container = inspectorWindow.element.querySelector('.dev-inspector-container');

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

    const blockEditorContainer = container.querySelector('.dev-inspector-json-editor');

    setTimeout(() => {
      ensureBlockJSONEditor(blockEditorContainer);

      if (!blockJSONEditor) {
        console.error('Failed to initialize JSONEditor');
        return;
      }

      const projectJson = getProjectJSON();
      const blockResult = findBlockInProjectJSON(projectJson, blockInfo.id);

      if (blockResult && blockResult.block) {
        try {
          blockJSONEditor.set(blockResult.block);
        } catch (e) {
          blockJSONEditor.set({$error: 'Error showing block JSON: ' + e.message});
        }
      } else {
        try {
          blockJSONEditor.set(blockInfo.scratchData || blockInfo);
        } catch (e) {
          blockJSONEditor.set({$error: 'Error showing block JSON: ' + e.message});
        }
      }
    }, 150);

    container.currentBlock = block;
  }
  
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
