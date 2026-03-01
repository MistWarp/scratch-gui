class FlameGraphRenderer {
    constructor(canvas, vm, theme, onStatsUpdate) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vm = vm;
        this.theme = theme;
        this.onStatsUpdate = onStatsUpdate;
        
        // Data structures
        this.executionEvents = [];
        
        // Time window (10 seconds, but data is limited to 5s by VM patch)
        this.timeWindow = 10000;
        
        // Visual state
        this.hoveredItem = null;
        this.resizeCanvas();
        
        // Stats
        this.totalExecutionTime = 0;
        this.procedureCount = 0;
        
        // Flattened flame graph data (for icicle view)
        this.flattenedData = [];
        
        // Debug
        this.debug = true;
        console.log('[FlameGraph] Initializing renderer with VM poll approach');
        
        // Setup
        this.setupCanvasResize();
        this.setupMouseEvents();
        this.startDataPolling();
        // Render initially, then only on data changes or interactions
        this.render();
    }
    
    setupMouseEvents() {
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseLeaveHandler = this.handleMouseLeave.bind(this);
        this.clickHandler = this.handleClick.bind(this);
        
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);
        this.canvas.addEventListener('click', this.clickHandler);
    }
    
    log(...args) {
        if (this.debug) {
            console.log('[FlameGraph]', ...args);
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        this.log('Canvas resized to:', rect.width, 'x', rect.height);
    }

    getThemeColors() {
        const isDark = this.theme && this.theme.isDark && this.theme.isDark();
        
        const colors = this.theme ? this.theme.getGuiColors() : {};
        
        return {
            isDark,
            textPrimary: colors['text-primary'] || '#575E75',
            textSecondary: colors['text-primary-transparent'] || (isDark ? '#aaaaaa' : '#666666'),
            textTertiary: isDark ? '#888888' : '#999999',
            divider: colors['ui-black-transparent'] || (isDark ? '#333333' : '#ddd'),
            separator: colors['ui-tertiary'] || (isDark ? '#444444' : '#e0e0e0'),
            hoverBorder: isDark ? '#ffffff' : '#fff',
            noDataText: isDark ? '#888888' : '#999999',
            flameFast: colors['flamegraph-color-fast'] || (isDark ? 'hsl(220, 70%, 55%)' : 'hsl(240, 80%, 50%)'),
            flameMediumFast: colors['flamegraph-color-medium-fast'] || (isDark ? 'hsl(200, 70%, 58%)' : 'hsl(180, 80%, 53%)'),
            flameMedium: colors['flamegraph-color-medium'] || (isDark ? 'hsl(160, 70%, 55%)' : 'hsl(120, 80%, 56%)'),
            flameMediumSlow: colors['flamegraph-color-medium-slow'] || (isDark ? 'hsl(100, 70%, 57%)' : 'hsl(60, 80%, 59%)'),
            flameSlow: colors['flamegraph-color-slow'] || (isDark ? 'hsl(40, 85%, 60%)' : 'hsl(0, 80%, 62%)')
        };
    }

    setTheme(theme) {
        this.theme = theme;
        this.render();
    }
    
    setupCanvasResize() {
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
            this.render();
        });
        this.resizeObserver.observe(this.canvas.parentElement);
    }
    
    startDataPolling() {
        // Poll for data every 100ms
        this.pollInterval = setInterval(() => {
            this.updateData();
        }, 100);
        this.log('Started data polling (100ms interval)');
    }
    
    updateData() {
        if (!this.vm || !this.vm.runtime) {
            return;
        }
        
        const getFlameGraphData = this.vm.runtime.getFlameGraphData;
        if (!getFlameGraphData) {
            return;
        }
        
        const data = getFlameGraphData();
        if (!data) {
            return;
        }
        
        console.log('[FlameGraph Renderer] Polling data - procedures:', data.procedures.length, 'hats:', data.hats.length);
        
        // Combine procedures and hats
        const allExecutions = [...data.procedures, ...data.hats];
        
        // Only render if data changed
        const prevLength = this.executionEvents.length;
        this.executionEvents = allExecutions;
        
        if (allExecutions.length !== prevLength) {
            this.updateStats();
            this.buildFlattenedData();
            this.render();
        }
    }
    
    updateStats() {
        const now = performance.now();
        const cutoffTime = now - this.timeWindow;
        
        let totalTime = 0;
        let count = 0;
        
        for (const execution of this.executionEvents) {
            if (execution.endTime >= cutoffTime) {
                totalTime += execution.duration;
                count++;
            }
        }
        
        this.totalExecutionTime = totalTime;
        this.procedureCount = count;
        
        const stats = {
            timeWindow: this.timeWindow,
            totalExecutionTime: this.totalExecutionTime,
            procedureCount: this.procedureCount
        };
        
        if (this.onStatsUpdate) {
            this.onStatsUpdate(stats);
        }
    }

    buildFlattenedData() {
        // Group all executions by procedure name and calculate statistics
        const procedureStats = new Map();
        
        for (const execution of this.executionEvents) {
            const key = execution.name;
            const stats = procedureStats.get(key) || {
                durations: [],
                totalDuration: 0,
                count: 0,
                executions: [],
                targetNames: new Set()
            };
            stats.durations.push(execution.duration);
            stats.totalDuration += execution.duration;
            stats.count++;
            stats.executions.push(execution);
            stats.targetNames.add(execution.targetName);
            
            procedureStats.set(key, stats);
        }
        
        // Calculate additional stats for each procedure
        let maxDuration = 0;
        for (const [name, stats] of procedureStats.entries()) {
            stats.minDuration = Math.min(...stats.durations);
            stats.maxDuration = Math.max(...stats.durations);
            stats.avgDuration = stats.totalDuration / stats.count;
            stats.percentage = (stats.totalDuration / this.totalExecutionTime) * 100;
            
            if (stats.maxDuration > maxDuration) {
                maxDuration = stats.maxDuration;
            }
        }
        
        // Sort by total duration (largest first)
        this.flattenedData = Array.from(procedureStats.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.totalDuration - a.totalDuration);
        
        this.maxDuration = maxDuration;
    }
    
    // Calculate color based on execution time
    calculateColor(duration, maxDuration) {
        const colors = this.getThemeColors();
        const isDark = colors.isDark;
        
        if (maxDuration === 0) return isDark ? 'hsl(220, 70%, 55%)' : 'hsl(240, 80%, 50%)';
        
        // Use theme-specific colors based on execution time
        if (duration < 1) {
            return colors.flameFast;
        } else if (duration < 5) {
            return colors.flameMediumFast;
        } else if (duration < 10) {
            return colors.flameMedium;
        } else if (duration < 50) {
            return colors.flameMediumSlow;
        } else {
            return colors.flameSlow;
        }
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.getThemeColors();
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Check if there's data
        if (this.executionEvents.length === 0) {
            this.renderNoData();
            return;
        }
        
        const padding = { left: 20, top: 20, right: 20, bottom: 60 };
        const availableWidth = width - padding.left - padding.right;
        const availableHeight = height - padding.top - padding.bottom;
        
        // Calculate box dimensions
        const boxHeight = Math.min(40, Math.max(24, availableHeight / Math.min(this.flattenedData.length, 15)));
        const boxGap = 4;
        const boxesPerRow = Math.floor(availableWidth / (150 + boxGap));
        const rowsNeeded = Math.ceil(this.flattenedData.length / boxesPerRow);
        
        // Draw title
        ctx.fillStyle = colors.textPrimary;
        ctx.font = 'bold 16px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Procedure Runtime Distribution', padding.left, padding.top - 15);
        
        // Draw total time info
        ctx.fillStyle = colors.textSecondary;
        ctx.font = '12px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
            `Total: ${(this.totalExecutionTime / 1000).toFixed(3)}s | ${this.procedureCount} executions`,
            width - padding.right,
            padding.top - 15
        );
        
        let yOffset = padding.top;
        let xOffset = padding.left;
        this.renderedBoxes = [];
        
        for (const item of this.flattenedData) {
            const boxWidth = Math.max(100, Math.min(300, (item.totalDuration / Math.max(this.flattenedData[0].totalDuration, 1)) * 250));
            
            if (xOffset + boxWidth > width - padding.right) {
                xOffset = padding.left;
                yOffset += boxHeight + boxGap;
            }
            
            const yEnd = yOffset + boxHeight;
            if (yEnd > height - padding.bottom) {
                break;
            }
            
            const color = this.calculateColor(item.avgDuration, this.maxDuration || 100);
            
            // Draw box background
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(xOffset, yOffset, boxWidth, boxHeight, 6);
            ctx.fill();
            
            // Hover effect
            if (this.hoveredItem && this.hoveredItem.name === item.name) {
                ctx.strokeStyle = colors.hoverBorder;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(xOffset, yOffset, boxWidth, boxHeight, 6);
                ctx.stroke();
            }
            
            // Store box position for hit testing
            this.renderedBoxes.push({
                name: item.name,
                x: xOffset,
                y: yOffset,
                width: boxWidth,
                height: boxHeight,
                data: item
            });
            
            // Draw percentage in the center (prominent)
            ctx.fillStyle = colors.isDark ? '#ffffff' : '#000000';
            ctx.font = 'bold 14px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                `${item.percentage.toFixed(1)}%`,
                xOffset + boxWidth / 2,
                yOffset + boxHeight / 2
            );
            
            // Draw procedure name at bottom if space allows
            const nameEl = this.truncateText(item.name, Math.floor(boxWidth / 7));
            if (boxWidth > 80) {
                ctx.fillStyle = colors.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)';
                ctx.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
                ctx.fillText(
                    nameEl,
                    xOffset + boxWidth / 2,
                    yOffset + boxHeight - 5
                );
            }
            
            xOffset += boxWidth + boxGap;
        }
        
        // Draw "more" indicator if there are more procedures
        if (this.flattenedData.length > this.renderedBoxes.length) {
            const moreCount = this.flattenedData.length - this.renderedBoxes.length;
            ctx.fillStyle = colors.textTertiary;
            ctx.font = '12px "Helvetica Neue", Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                `... and ${moreCount} more procedures`,
                width / 2,
                height - padding.bottom + 20
            );
        }
        
        // Draw legend at bottom
        this.drawLegend(ctx, width, height, padding, colors);
    }
    
    drawLegend(ctx, width, height, padding, colors) {
        const legendY = height - padding.bottom + 35;
        const legendItems = [
            { label: '< 1ms', color: colors.flameFast },
            { label: '1-5ms', color: colors.flameMediumFast },
            { label: '5-10ms', color: colors.flameMedium },
            { label: '10-50ms', color: colors.flameMediumSlow },
            { label: '> 50ms', color: colors.flameSlow }
        ];
        
        ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const totalWidth = legendItems.length * 100 + (legendItems.length - 1) * 20;
        let startX = (width - totalWidth) / 2;
        
        for (const item of legendItems) {
            // Color box
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.roundRect(startX, legendY - 8, 16, 16, 3);
            ctx.fill();
            
            // Label
            ctx.fillStyle = colors.textSecondary;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, startX + 22, legendY);
            
            startX += 100;
        }
    }
    
    renderNoData() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const colors = this.getThemeColors();
        
        ctx.fillStyle = colors.noDataText;
        ctx.font = '14px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            'No execution data yet. Run your project to see performance data.',
            width / 2,
            height / 2
        );
        
        ctx.fillText(
            'Start your project with the green flag to begin collecting data.',
            width / 2,
            height / 2 + 25
        );
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if hovering over any box
        let found = false;
        if (this.renderedBoxes) {
            for (const box of this.renderedBoxes) {
                if (x >= box.x && x <= box.x + box.width &&
                    y >= box.y && y <= box.y + box.height) {
                    if (!this.hoveredItem || this.hoveredItem.name !== box.name) {
                        this.hoveredItem = { name: box.name, data: box.data };
                        this.render();
                    }
                    this.canvas.style.cursor = 'pointer';
                    this.showTooltip(e.clientX, e.clientY, box.data);
                    found = true;
                    break;
                }
            }
        }
        
        if (!found && this.hoveredItem) {
            this.hoveredItem = null;
            this.render();
            this.hideTooltip();
        }
        
        if (!found) {
            this.canvas.style.cursor = 'default';
        }
    }
    
    showTooltip(clientX, clientY, data) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'flamegraph-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: var(--ui-tertiary);
            color: var(--ui-modal-foreground);
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            pointer-events: none;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid var(--ui-black-transparent);
            max-width: 300px;
        `;
        
        const colors = this.getThemeColors();
        const color = this.calculateColor(data.avgDuration, this.maxDuration || 100);
        
        tooltip.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid ${colors.divider}; padding-bottom: 6px;">
                ${this.escapeHtml(data.name)}
            </div>
            <div style="display: flex; align-items: center; margin: 4px 0;">
                <div style="width: 12px; height: 12px; border-radius: 2px; background: ${color}; margin-right: 8px;"></div>
                <span><strong>${data.percentage.toFixed(2)}%</strong> of total runtime</span>
            </div>
            <div style="margin: 4px 0;">
                Total time: ${data.totalDuration.toFixed(2)}ms
            </div>
            <div style="margin: 4px 0;">
                Calls: <strong>${data.count}</strong>
            </div>
            <div style="margin: 4px 0;">
                Avg: <strong>${data.avgDuration.toFixed(3)}ms</strong>
            </div>
            <div style="margin: 4px 0; font-size: 11px; color: ${colors.textTertiary};">
                Range: ${data.minDuration.toFixed(2)}ms - ${data.maxDuration.toFixed(2)}ms
            </div>
            <div style="margin: 4px 0; font-size: 11px; color: ${colors.textTertiary};">
                Sprites: ${Array.from(data.targetNames).join(', ')}
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = clientX + 15;
        let top = clientY + 15;
        
        // Keep within viewport
        if (left + tooltipRect.width > window.innerWidth) {
            left = clientX - tooltipRect.width - 15;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = clientY - tooltipRect.height - 15;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        
        this.tooltipElement = tooltip;
    }
    
    hideTooltip() {
        if (this.tooltipElement) {
            document.body.removeChild(this.tooltipElement);
            this.tooltipElement = null;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    handleMouseLeave() {
        if (this.hoveredItem) {
            this.hoveredItem = null;
            this.render();
        }
        this.hideTooltip();
    }
    
    handleClick(e) {
        if (this.hoveredItem) {
            this.log('Clicked on:', this.hoveredItem.name, this.hoveredItem.stats);
        }
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            timeWindow: this.timeWindow,
            totalExecutionTime: this.totalExecutionTime,
            procedureCount: this.procedureCount,
            executions: this.executionEvents
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flame-graph-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('Exported', data.executions.length, 'executions');
    }
    
    clearData() {
        this.executionEvents = [];
        this.flattenedData = [];
        this.totalExecutionTime = 0;
        this.procedureCount = 0;
        
        if (this.vm && this.vm.runtime && this.vm.runtime.clearFlameGraphData) {
            this.vm.runtime.clearFlameGraphData();
        }
        
        this.updateStats();
        this.render();
        this.log('All data cleared');
    }
    
    destroy() {
        this.log('Destroying renderer');
        this.hideTooltip();
        
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        
        // Stop VM profiling
        if (this.vm && this.vm.runtime && this.vm.runtime.setFlameGraphEnabled) {
            this.vm.runtime.setFlameGraphEnabled(false);
        }
        
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

export default FlameGraphRenderer;
