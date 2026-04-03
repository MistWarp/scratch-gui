export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  const getProjectComplexity = () => {
    let blockCount = 0;
    let scriptCount = 0;
    let maxDepth = 0;
    let totalDepth = 0;
    let blockTypeCount = {};
    let customBlockCount = 0;
    let conditionalBlockCount = 0;
    let loopBlockCount = 0;
    let eventBlockCount = 0;
    let longestScript = 0;
    let costumeCount = 0;
    let soundCount = 0;
    
    let sprites = new Set(vm.runtime.targets.map((i) => i.sprite.blocks._blocks));
    
    sprites.forEach((sprite, i) => {
      const blocks = Object.values(sprite).filter((o) => !o.shadow); // shadow blocks should be filtered out
      blockCount += blocks.length;
      
      // Count script stacks
      const scriptBlocks = blocks.filter((o) => !o.parent);
      scriptCount += scriptBlocks.length;
      
      // Analyze each script for complexity metrics
      scriptBlocks.forEach(scriptBlock => {
        const { depth, length } = analyzeScript(sprite, scriptBlock.id);
        maxDepth = Math.max(maxDepth, depth);
        totalDepth += depth;
        longestScript = Math.max(longestScript, length);
      });
      
      // Count block types
      blocks.forEach(block => {
        const opcode = block.opcode;
        blockTypeCount[opcode] = (blockTypeCount[opcode] || 0) + 1;
        
        // Categorize special block types
        if (opcode.includes('procedures_call')) {
          customBlockCount++;
        } else if (opcode.includes('control_if') || opcode.includes('control_if_else')) {
          conditionalBlockCount++;
        } else if (opcode.includes('control_repeat') || opcode.includes('control_forever') || opcode.includes('control_while')) {
          loopBlockCount++;
        } else if (opcode.includes('event_when')) {
          eventBlockCount++;
        }
      });
    });
    
    // Count costumes and sounds from all targets
    vm.runtime.targets.forEach(target => {
      if (target.sprite) {
        costumeCount += target.sprite.costumes.length;
        soundCount += target.sprite.sounds.length;
      }
    });
    
    const averageDepth = scriptCount > 0 ? totalDepth / scriptCount : 0;
    const complexityScore = calculateComplexityScore({
      blockCount,
      scriptCount,
      maxDepth,
      averageDepth,
      customBlockCount,
      conditionalBlockCount,
      loopBlockCount,
      longestScript
    });

    return {
      blockCount,
      scriptCount,
      spriteCount: sprites.size - 1, // Backdrop counts as a target so we can subtract it
      maxDepth,
      averageDepth: Math.round(averageDepth * 10) / 10,
      longestScript,
      customBlockCount,
      conditionalBlockCount,
      loopBlockCount,
      eventBlockCount,
      costumeCount,
      soundCount,
      complexityScore,
      blockTypeCount
    };
  };

  const analyzeScript = (sprite, blockId, depth = 0) => {
    const block = sprite[blockId];
    if (!block) return { depth: 0, length: 0 };
    
    let maxDepth = depth;
    let length = 1;
    
    // Check nested blocks (like inside if/else, loops)
    if (block.inputs) {
      Object.values(block.inputs).forEach(input => {
        if (input.block) {
          const nested = analyzeScript(sprite, input.block, depth + 1);
          maxDepth = Math.max(maxDepth, nested.depth);
          length += nested.length;
        }
      });
    }
    
    // Check next block in sequence
    if (block.next) {
      const next = analyzeScript(sprite, block.next, depth);
      maxDepth = Math.max(maxDepth, next.depth);
      length += next.length;
    }
    
    return { depth: maxDepth, length };
  };

  const calculateComplexityScore = (metrics) => {
    // Enhanced complexity scoring algorithm
    let score = 0;
    
    // Base complexity from block count (weight: low)
    score += metrics.blockCount * 0.1;
    
    // Script count (weight: medium) - more scripts = more complexity
    score += metrics.scriptCount * 2;
    
    // Nesting depth (weight: high) - deep nesting is harder to understand
    score += metrics.maxDepth * 8;
    score += metrics.averageDepth * 4;
    
    // Custom blocks (weight: medium) - can reduce or increase complexity
    score += metrics.customBlockCount * 3;
    
    // Control flow complexity (weight: high)
    score += metrics.conditionalBlockCount * 4; // if/else statements
    score += metrics.loopBlockCount * 5; // loops are complex
    
    // Script length penalty - very long scripts are hard to maintain
    const longScriptPenalty = Math.max(0, metrics.longestScript - 15) * 1.2;
    score += longScriptPenalty;
    
    // Bonus for good practices
    if (metrics.customBlockCount > 0 && metrics.blockCount > 50) {
      score -= 10; // Bonus for using custom blocks in larger projects
    }
    
    return Math.max(0, Math.round(score));
  };

  const createComplexityModal = () => {
    const modal = document.createElement('div');
    modal.className = 'sa-block-count-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--ui-modal-background, white);
      color: var(--ui-modal-foreground, black);
      border: 1px solid var(--ui-black-transparent, #ccc);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    `;
    
    return modal;
  };

  const showComplexityDetails = () => {
    const metrics = getProjectComplexity();
    const modal = createComplexityModal();
    
    // Determine complexity level for styling
    let complexityClass = 'sa-block-count-complexity-low';
    if (metrics.complexityScore > 100) {
      complexityClass = 'sa-block-count-complexity-high';
    } else if (metrics.complexityScore > 50) {
      complexityClass = 'sa-block-count-complexity-medium';
    }
    
    modal.innerHTML = `
      <h2>${msg('complexity-title')}</h2>
      
      <div class="sa-block-count-stats-grid">
        <div class="sa-block-count-stat-card">
          <h3>${msg('basic-stats')}</h3>
          <div class="sa-block-count-stat-list">
            <div><strong>${msg('total-blocks')}:</strong> ${metrics.blockCount}</div>
            <div><strong>${msg('total-scripts')}:</strong> ${metrics.scriptCount}</div>
            <div><strong>${msg('total-sprites')}:</strong> ${metrics.spriteCount}</div>
            <div><strong>${msg('total-costumes')}:</strong> ${metrics.costumeCount}</div>
            <div><strong>${msg('total-sounds')}:</strong> ${metrics.soundCount}</div>
          </div>
        </div>
        
        <div class="sa-block-count-stat-card">
          <h3>${msg('complexity-metrics')}</h3>
          <div class="sa-block-count-stat-list">
            <div><strong>${msg('complexity-score')}:</strong> 
              <span class="sa-block-count-complexity-score ${complexityClass}">${metrics.complexityScore}</span>
            </div>
            <div><strong>${msg('max-nesting')}:</strong> ${metrics.maxDepth}</div>
            <div><strong>${msg('avg-nesting')}:</strong> ${metrics.averageDepth}</div>
            <div><strong>${msg('longest-script')}:</strong> ${metrics.longestScript} blocks</div>
          </div>
        </div>
      </div>
      
      <div class="sa-block-count-block-types">
        <h3>${msg('block-types')}</h3>
        <div class="sa-block-count-types-grid">
          <div><strong>${msg('custom-blocks')}:</strong> ${metrics.customBlockCount}</div>
          <div><strong>${msg('conditional-blocks')}:</strong> ${metrics.conditionalBlockCount}</div>
          <div><strong>${msg('loop-blocks')}:</strong> ${metrics.loopBlockCount}</div>
          <div><strong>${msg('event-blocks')}:</strong> ${metrics.eventBlockCount}</div>
        </div>
      </div>
      
      <div style="text-align: right;">
        <button class="sa-block-count-close sa-block-count-close-btn">${msg('close')}</button>
      </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;
    
    const closeModal = () => {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
      document.removeEventListener('keydown', handleKeydown);
    };
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    backdrop.addEventListener('click', closeModal);
    modal.querySelector('.sa-block-count-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', handleKeydown);
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  };

  const addLiveBlockCount = async () => {
    if (vm.editingTarget) {
      let handler = null;
      let isLoading = false;
      while (true) {
        const topBar = await addon.tab.waitForElement("[class^='menu-bar_main-menu']", {
          markAsSeen: true,
          reduxEvents: [
            "scratch-gui/mode/SET_PLAYER",
            "fontsLoaded/SET_FONTS_LOADED",
            "scratch-gui/locales/SELECT_LOCALE",
          ],
          reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });

        let display = topBar.appendChild(document.createElement("span"));
        addon.tab.displayNoneWhileDisabled(display);
        display.style.order = 1;
        display.style.cursor = 'pointer';
        display.style.padding = '4px 8px';
        display.style.borderRadius = '4px';
        display.style.transition = 'background-color 0.2s';

        const updateDisplay = () => {
          const metrics = getProjectComplexity();
          const parts = [];

          const hideBlocks = addon.settings.get('hide_block_count');
          const showCostumes = addon.settings.get('show_costume_count');
          const showSounds = addon.settings.get('show_sound_count');
          const showComplexity = addon.settings.get('show_complexity_score');

          if (!hideBlocks) {
            parts.push(msg("blocks", { num: metrics.blockCount }));
          }

          if (showCostumes) parts.push(msg("costumes", { num: metrics.costumeCount }));
          if (showSounds) parts.push(msg("sounds", { num: metrics.soundCount }));

          let displayText = parts.join(', ');

          if (showComplexity) {
            displayText += ` (${msg("complexity-short")}: ${metrics.complexityScore})`;
          }

          display.innerText = displayText;
        };

        updateDisplay();

        display.addEventListener('click', showComplexityDetails);
        display.addEventListener('mouseenter', () => {
          display.style.backgroundColor = 'var(--ui-black-transparent, rgba(0,0,0,0.1))';
        });
        display.addEventListener('mouseleave', () => {
          display.style.backgroundColor = 'transparent';
        });

        let debounce;
        if (handler) {
          vm.off("PROJECT_CHANGED", handler);
          vm.runtime.off("PROJECT_LOADED", handler);
        }
        handler = async () => {
          if (isLoading) return;
          clearTimeout(debounce);
          debounce = setTimeout(updateDisplay, 1000);
        };
        vm.on("PROJECT_CHANGED", handler);
        vm.runtime.on("PROJECT_LOADED", () => {
          isLoading = false;
          updateDisplay();
        });
        
        if (addon.tab.redux) {
          addon.tab.redux.addEventListener("statechanged", (e) => {
            const actionType = e.detail.action.type;
            if (actionType.startsWith("scratch-gui/project-state/") && 
                (actionType.includes("LOADING") || actionType.includes("START"))) {
              isLoading = true;
            }
          });
        }
      }
    } else {
      let timeout = setTimeout(function () {
        addLiveBlockCount();
        clearTimeout(timeout);
      }, 1000);
    }
  };

  addLiveBlockCount();
}
