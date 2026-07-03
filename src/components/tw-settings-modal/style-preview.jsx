/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React from 'react';

const BASE_CSS = {
    tabs: `
        .wrap { display: flex; flex-direction: column; padding: 14px 10px 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
        [class*="gui_tab-list"] { display: flex; align-items: flex-end; padding-left: 3px; position: relative; z-index: 1; }
        [class*="gui_tab_"] {
            position: relative; top: 1px;
            display: flex; align-items: center; justify-content: center;
            height: 28px; padding: 0 14px; font-size: 12px; font-weight: 500;
            border-radius: 10px; border: 1px solid var(--ui-black-transparent, rgba(0,0,0,0.15));
            background: var(--ui-tertiary, #e6e9f0); color: var(--text-primary-transparent, rgba(87,94,117,0.7));
            white-space: nowrap;
        }
        [class*="gui_tab_"] svg { width: 15px; height: 15px; fill: currentColor; margin-right: 6px; }
        [class*="react-tabs__tab--selected"] { background: var(--ui-white, #fff); color: var(--looks-secondary, #855cd6); }
        .preview-body { height: 24px; background: var(--ui-primary, #f8f9fa); border: 1px solid var(--ui-black-transparent, rgba(0,0,0,0.15)); border-radius: 0 8px 8px 8px; }
    `,
    window: `
        .wrap { padding: 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .addon-window {
            width: 100%; display: flex; flex-direction: column; overflow: hidden;
            background: var(--ui-modal-background, #ffffff);
            border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.08));
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        }
        .addon-window-header {
            background: var(--ui-primary, #f8f9fa);
            border-bottom: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.08));
            padding: 8px 16px; min-height: 44px; max-height: 44px; box-sizing: border-box;
            display: flex; align-items: center; justify-content: space-between;
        }
        .addon-window-title { flex: 1; text-align: left; font-weight: 600; font-size: 14px; color: var(--text-primary, #2d3748); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .addon-window-controls { display: flex; align-items: center; gap: 6px; }
        .addon-window-btn {
            display: flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 6px; padding: 0;
            background: transparent; border: none; color: var(--text-primary, #666);
            transition: background-color 0.2s ease, color 0.2s ease;
        }
        .addon-window-btn:hover { background: var(--ui-black-transparent, rgba(0, 0, 0, 0.08)); }
        .addon-window-btn-close:hover { background: var(--red-primary, #e64a4a); color: white; }
        .addon-window-btn svg { width: 12px; height: 12px; stroke: currentColor; fill: none; }
        .addon-window-content { padding: 10px 16px; color: var(--text-primary, #575e75); font-size: 13px; background: transparent; }
    `
};

const tabIcon = '<svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="3"/></svg>';

const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const barMinIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const boxMaxIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
const lucideMinIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/></svg>';
const lucideMaxIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></svg>';

const buildWindowMarkup = variant => {
    const isMac = variant === 'macos';
    const minIcon = isMac ? lucideMinIcon : barMinIcon;
    const maxIcon = isMac ? lucideMaxIcon : boxMaxIcon;
    return `
        <div class="wrap">
            <div class="addon-window">
                <div class="addon-window-header">
                    <div class="addon-window-title">Window</div>
                    <div class="addon-window-controls">
                        <div class="addon-window-btn addon-window-btn-minimize">${minIcon}</div>
                        <div class="addon-window-btn addon-window-btn-maximize">${maxIcon}</div>
                        <div class="addon-window-btn addon-window-btn-close">${closeIcon}</div>
                    </div>
                </div>
                <div class="addon-window-content">Preview</div>
            </div>
        </div>
    `;
};

const TABS_MARKUP = `
    <div class="wrap">
        <div class="gui_tab-list_preview">
            <div class="gui_tab_preview react-tabs__tab--selected_preview">${tabIcon}<span>Code</span></div>
        </div>
        <div class="preview-body"></div>
    </div>
`;

class StylePreview extends React.Component {
    componentDidMount () {
        this.renderContent();
    }
    componentDidUpdate (prevProps) {
        if (prevProps.css !== this.props.css || prevProps.type !== this.props.type ||
            prevProps.variant !== this.props.variant) {
            this.renderContent();
        }
    }
    renderContent () {
        if (!this.host) return;
        if (!this.shadow) {
            this.shadow = this.host.attachShadow({mode: 'open'});
        }
        const base = BASE_CSS[this.props.type] || '';
        const markup = this.props.type === 'window' ? buildWindowMarkup(this.props.variant) : TABS_MARKUP;
        const designWidth = this.props.type === 'window' ? 300 : 190;
        let tabFix = '';
        if (this.props.type === 'tabs') {
            tabFix = '[class*="gui_tab-list"]{width:auto !important;}' +
                '[class*="gui_tab_"]{flex-grow:0 !important;margin-left:0 !important;top:0 !important;}';
            if (this.props.variant === 'turbowarp') {
                tabFix += '[class*="gui_tab_"]{min-height: 30px; max-height:30px !important; border-bottom: none !important;}.preview-body{margin-top:-1px !important;}';
            } else {
                tabFix += '[class*="gui_tab_"]{height:28px !important; }.preview-body{margin-top:3px !important;}';
            }
        }
        this.shadow.innerHTML =
            `<style>:host{display:block;width:100%;overflow:hidden;}` +
            `.scaler{width:${designWidth}px;transform-origin:top left;}${base}${this.props.css || ''}${tabFix}</style>` +
            `<div class="scaler">${markup}</div>`;
        this.applyScale(designWidth);
    }
    applyScale (designWidth) {
        const scaler = this.shadow.querySelector('.scaler');
        if (!scaler) return;
        const hostWidth = this.host.clientWidth;
        if (!hostWidth) {
            requestAnimationFrame(() => this.applyScale(designWidth));
            return;
        }
        const scale = Math.min(1, hostWidth / designWidth);
        scaler.style.transform = `scale(${scale})`;
        this.host.style.height = `${scaler.offsetHeight * scale}px`;
    }
    render () {
        return (
            <div
                dir="ltr"
                ref={el => {
                    this.host = el;
                }}
            />
        );
    }
}

StylePreview.propTypes = {
    type: PropTypes.oneOf(['tabs', 'window']).isRequired,
    variant: PropTypes.string,
    css: PropTypes.string
};

export default StylePreview;
