var E=Object.defineProperty;var M=(r,e,t)=>e in r?E(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var m=(r,e,t)=>M(r,typeof e!="symbol"?e+"":e,t);const k=`
.addon-window-btn {
  background: transparent;
  color: var(--text-primary, #666);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.addon-window-btn:hover {
  background: var(--ui-black-transparent, rgba(0, 0, 0, 0.08));
}

.addon-window-btn-close:hover {
  background: var(--red-primary, #e64a4a);
  color: white;
}

.addon-window-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.addon-window-content::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.addon-window-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  margin: 2px;
}

.addon-window-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: content-box;
  min-height: 20px;
}

.addon-window-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
  background-clip: content-box;
}

.addon-window-content::-webkit-scrollbar-thumb:active {
  background: rgba(0, 0, 0, 0.4);
  background-clip: content-box;
}

.addon-window-content::-webkit-scrollbar-corner {
  background: transparent;
}

@media only screen and (max-width: 900px) {
  .addon-window {
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: none !important;
    min-width: 0 !important;
    min-height: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .addon-window .resize-handle {
    display: none !important;
  }

  .addon-window-header {
    cursor: default !important;
    touch-action: auto !important;
    min-height: calc(48px + env(safe-area-inset-top)) !important;
    padding-top: env(safe-area-inset-top) !important;
    padding-right: max(8px, env(safe-area-inset-right)) !important;
    padding-left: max(12px, env(safe-area-inset-left)) !important;
  }

  .addon-window-btn {
    width: 44px !important;
    height: 44px !important;
  }

  .addon-window-btn-maximize,
  .addon-window-btn-minimize {
    display: none !important;
  }

  .addon-window-content {
    min-width: 0;
    width: 100%;
    border-radius: 0 !important;
    -webkit-overflow-scrolling: touch;
    padding-bottom: env(safe-area-inset-bottom) !important;
  }
}
`,g=document.createElement("style");g.textContent=k;document.head.appendChild(g);const b=8e3,I=8999;let l=b;const y=9600,H=9999;let p=y,z=0;const a=new Map,W=new Set(["customProceduresModal"]),C=()=>typeof window<"u"&&typeof window.EditorPreload<"u";window.addEventListener("pagehide",()=>{for(const r of a.values())r.closePopup&&r.closePopup()});const x=r=>{for(const e of document.querySelectorAll('head style, head link[rel="stylesheet"], body style')){const t=r.importNode(e,!0);t.setAttribute("data-mw-copied-style",""),r.head.appendChild(t)}},f=r=>{for(const e of document.documentElement.attributes)r.documentElement.setAttribute(e.name,e.value);r.body.className=document.body.className};let c=null,w=!1;const T=()=>{w||(w=!0,requestAnimationFrame(()=>{w=!1;for(const r of a.values())r.resyncStyles&&r.resyncStyles()}))},O=()=>{if(c)return;c=new MutationObserver(T),c.observe(document.documentElement,{attributes:!0}),c.observe(document.head,{childList:!0,subtree:!0,characterData:!0}),c.observe(document.body,{childList:!0});const r=document.querySelector(".addons-styles");r&&c.observe(r,{childList:!0,subtree:!0,characterData:!0})};class S{constructor(e={}){m(this,"handleDrag",e=>{if(!this.isDragging||this.dragPointerId!==null&&e.pointerId!==this.dragPointerId)return;const t=e.clientX-this.dragOffset.x,i=e.clientY-this.dragOffset.y,s=50,o=-(this.width-s),n=window.innerWidth-s,h=0,d=window.innerHeight-s;this.x=Math.max(o,Math.min(t,n)),this.y=Math.max(h,Math.min(i,d)),this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this.onMove(this.x,this.y)});m(this,"handleDragEnd",e=>{if(!(e&&this.dragPointerId!==null&&e.pointerId!==this.dragPointerId)){if(this.isDragging=!1,this.dragPointerId!==null){try{this.headerElement.releasePointerCapture(this.dragPointerId)}catch{}this.dragPointerId=null}this.headerElement.removeEventListener("pointermove",this.handleDrag),this.headerElement.removeEventListener("pointerup",this.handleDragEnd),this.headerElement.removeEventListener("pointercancel",this.handleDragEnd)}});m(this,"handleResize",e=>{if(!this.isResizing||this.resizePointerId!==null&&e.pointerId!==this.resizePointerId)return;const t=e.clientX-this.resizeStart.x,i=e.clientY-this.resizeStart.y,s=this.resizeDirection;let o=this.resizeStart.width,n=this.resizeStart.height,h=this.resizeStart.left,d=this.resizeStart.top;s.includes("e")&&(o+=t),s.includes("w")&&(o-=t,h=this.resizeStart.left+t),s.includes("s")&&(n+=i),s.includes("n")&&(n-=i,d=this.resizeStart.top+i);const u=o,v=n;o=Math.max(this.minWidth,o),n=Math.max(this.minHeight,n),this.maxWidth&&(o=Math.min(this.maxWidth,o)),this.maxHeight&&(n=Math.min(this.maxHeight,n)),s.includes("w")&&o!==u&&(h=this.resizeStart.left+(this.resizeStart.width-o)),s.includes("n")&&n!==v&&(d=this.resizeStart.top+(this.resizeStart.height-n)),this.width=o,this.height=n,this.x=h,this.y=d,this.element.style.width=`${o}px`,this.element.style.height=`${n}px`,this.element.style.left=`${h}px`,this.element.style.top=`${d}px`,this.onResize(o,n)});m(this,"handleResizeEnd",e=>{if(e&&this.resizePointerId!==null&&e.pointerId!==this.resizePointerId)return;this.isResizing=!1;const t=this.resizeHandle;if(t&&this.resizePointerId!==null){try{t.releasePointerCapture(this.resizePointerId)}catch{}t.removeEventListener("pointermove",this.handleResize),t.removeEventListener("pointerup",this.handleResizeEnd),t.removeEventListener("pointercancel",this.handleResizeEnd)}this.resizePointerId=null,this.resizeHandle=null});this.id=e.id||`addon-window-${++z}`,this.title=e.title||"Addon Window",this.width=e.width||400,this.height=e.height||300,this.minWidth=e.minWidth||200,this.minHeight=e.minHeight||150,this.maxWidth=e.maxWidth||null,this.maxHeight=e.maxHeight||null,this.x=e.x||Math.random()*100+50,this.y=e.y||Math.random()*100+50,this.resizable=e.resizable!==!1,this.modal=e.modal||!1,this.closable=e.closable!==!1,this.minimizable=e.minimizable!==!1,this.maximizable=e.maximizable!==!1,this.className=e.className||"",this.destroyOnMinimize=e.destroyOnMinimize||!1,this.alwaysOnTop=e.alwaysOnTop||this.modal,this.isVisible=!1,this.isMinimized=!1,this.isMaximized=!1,this.zIndex=this.alwaysOnTop?++p:++l,this.onClose=e.onClose||(()=>{}),this.onMinimize=e.onMinimize||(()=>{}),this.onMaximize=e.onMaximize||(()=>{}),this.onRestore=e.onRestore||(()=>{}),this.onResize=e.onResize||(()=>{}),this.onMove=e.onMove||(()=>{}),this.element=null,this.headerElement=null,this.contentElement=null,this.isDragging=!1,this.isResizing=!1,this.dragOffset={x:0,y:0},this.dragPointerId=null,this.resizePointerId=null,this.resizeHandle=null,this.savedState=null,this.viewportResizeHandler=()=>this.fitToViewport(),this.createWindow(),a.set(this.id,this)}createWindow(){this.element=document.createElement("div"),this.element.className=`addon-window ${this.className}`,this.element.style.cssText=`
            position: fixed;
            left: ${this.x}px;
            top: ${this.y}px;
            width: ${this.width}px;
            height: ${this.height}px;
            z-index: ${this.zIndex};
            background: var(--ui-modal-background, #ffffff);
            border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.08));
            border-radius: 12px;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16),
                        0 2px 8px rgba(0, 0, 0, 0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
            display: none;
            flex-direction: column;
            overflow: hidden;
            transition: none !important;
        `,this.element.addEventListener("pointerdown",()=>this.bringToFront()),this.headerElement=document.createElement("div"),this.headerElement.className="addon-window-header",this.headerElement.style.cssText=`
            background: var(--ui-primary, #f8f9fa);
            border-bottom: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.08));
            padding: 8px 16px;
            cursor: move;
            user-select: none;
            touch-action: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 44px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
        `;const e=document.createElement("div");e.className="addon-window-title",e.textContent=this.title,e.style.cssText=`
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #2d3748);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            z-index: 1;
        `;const t=document.createElement("div");if(t.className="addon-window-controls",t.style.cssText=`
            display: flex;
            gap: 6px;
            align-items: center;
            z-index: 1;
            overflow: hidden;
        `,this.minimizable){const i=this.createControlButton("minimize","Minimize",()=>this.minimize());t.appendChild(i)}if(this.maximizable){const i=this.createControlButton("maximize","Maximize",()=>this.toggleMaximize());this.maximizeBtn=i,t.appendChild(i)}if(this.closable){const i=this.createControlButton("close","Close",()=>this.close());t.appendChild(i)}this.headerElement.appendChild(e),this.headerElement.appendChild(t),this.contentElement=document.createElement("div"),this.contentElement.className="addon-window-content",this.contentElement.style.cssText=`
            flex: 1;
            overflow: auto;
            padding: 0;
            box-sizing: border-box;
            background: transparent;
            border-radius: 0 0 12px 12px;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            min-height: 0;
            max-height: 100%;
            display: flex;
            flex-direction: column;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        `,this.element.appendChild(this.headerElement),this.element.appendChild(this.contentElement),this.resizable&&this.addResizeHandles(),this.addDragFunctionality(),document.body.appendChild(this.element),this.fitToViewport(),window.addEventListener("resize",this.viewportResizeHandler),this.escapeHandler=i=>{if(i.key!=="Escape"||!this.closable||!this.isVisible)return;Array.from(a.values()).filter(o=>o.isVisible).sort((o,n)=>n.zIndex-o.zIndex)[0]===this&&this.close()},document.addEventListener("keydown",this.escapeHandler)}createControlButton(e,t,i){const s=document.createElement("button");s.title=t,s.className=`addon-window-btn addon-window-btn-${e}`;let o="";switch(e){case"minimize":o=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>`;break;case"maximize":o=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>`;break;case"restore":o=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>`;break;case"close":o=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>`;break}return s.innerHTML=o,s.style.cssText=`
            border: none;
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-size: 0;
            margin: 0;
            padding: 0;
        `,s.addEventListener("pointerdown",n=>{n.stopPropagation()}),s.addEventListener("click",n=>{n.stopPropagation(),i()}),s}updateMaximizeButton(){if(this.maximizeBtn){const e=this.isMaximized?`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>`:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>`;this.maximizeBtn.innerHTML=e,this.maximizeBtn.title=this.isMaximized?"Restore":"Maximize"}}addDragFunctionality(){this.headerElement.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("button"))return;this.isDragging=!0,this.dragPointerId=e.pointerId,this.bringToFront();const t=parseInt(this.element.style.left,10)||this.x,i=parseInt(this.element.style.top,10)||this.y;this.dragOffset={x:e.clientX-t,y:e.clientY-i};try{this.headerElement.setPointerCapture(e.pointerId)}catch{}this.headerElement.addEventListener("pointermove",this.handleDrag),this.headerElement.addEventListener("pointerup",this.handleDragEnd),this.headerElement.addEventListener("pointercancel",this.handleDragEnd),e.preventDefault()})}addResizeHandles(){["n","ne","e","se","s","sw","w","nw"].forEach(t=>{const i=document.createElement("div");i.className=`resize-handle resize-${t}`;const s={position:"absolute",backgroundColor:"transparent",zIndex:"10"};switch(t){case"n":Object.assign(s,{top:"0",left:"8px",right:"8px",height:"4px",cursor:"n-resize"});break;case"ne":Object.assign(s,{top:"0",right:"0",width:"8px",height:"8px",cursor:"ne-resize"});break;case"e":Object.assign(s,{right:"0",top:"8px",bottom:"8px",width:"4px",cursor:"e-resize"});break;case"se":Object.assign(s,{bottom:"0",right:"0",width:"8px",height:"8px",cursor:"se-resize"});break;case"s":Object.assign(s,{bottom:"0",left:"8px",right:"8px",height:"4px",cursor:"s-resize"});break;case"sw":Object.assign(s,{bottom:"0",left:"0",width:"8px",height:"8px",cursor:"sw-resize"});break;case"w":Object.assign(s,{left:"0",top:"8px",bottom:"8px",width:"4px",cursor:"w-resize"});break;case"nw":Object.assign(s,{top:"0",left:"0",width:"8px",height:"8px",cursor:"nw-resize"});break}Object.assign(i.style,s),i.style.touchAction="none",i.addEventListener("pointerdown",o=>{o.button===0&&(o.stopPropagation(),this.startResize(o,t,i))}),this.element.appendChild(i)})}startResize(e,t,i){this.isResizing=!0,this.resizeDirection=t,this.resizePointerId=e.pointerId,this.resizeHandle=i,this.bringToFront();const s=this.element.getBoundingClientRect();this.resizeStart={x:e.clientX,y:e.clientY,width:s.width,height:s.height,left:s.left,top:s.top};try{i.setPointerCapture(e.pointerId)}catch{}i.addEventListener("pointermove",this.handleResize),i.addEventListener("pointerup",this.handleResizeEnd),i.addEventListener("pointercancel",this.handleResizeEnd),e.preventDefault()}bringToFront(){const e=this.alwaysOnTop,t=e?y:b;if((e?p:l)>=(e?H:I)){const s=Array.from(a.values()).filter(n=>n.alwaysOnTop===e),o=s.indexOf(this);if(o!==-1&&s.splice(o,1),s.sort((n,h)=>n.zIndex-h.zIndex),e){p=t;for(const n of s)n.zIndex=++p,n.element.style.zIndex=n.zIndex}else{l=t;for(const n of s)n.zIndex=++l,n.element.style.zIndex=n.zIndex}}this.zIndex=e?++p:++l,this.element.style.zIndex=this.zIndex,this.backdrop&&(this.backdrop.style.zIndex=String(this.zIndex-.5))}fitToViewport(){if(!this.element||this.isMaximized||window.innerWidth<=900)return this;const e=16,t=Math.max(0,window.innerWidth-e*2),i=Math.max(0,window.innerHeight-e*2),s=Math.min(this.width,t),o=Math.min(this.height,i),n=Math.max(e,Math.min(this.x,window.innerWidth-s-e)),h=Math.max(e,Math.min(this.y,window.innerHeight-o-e)),d=s!==this.width||o!==this.height;return this.width=s,this.height=o,this.x=n,this.y=h,this.minWidth=Math.min(this.minWidth,t),this.minHeight=Math.min(this.minHeight,i),this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`,this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,d&&this.onResize(this.width,this.height),this}showModalBackdrop(){if(!this.modal||this.backdrop)return;this.previouslyFocused=document.activeElement,this.backdrop=document.createElement("div"),Object.assign(this.backdrop.style,{position:"fixed",inset:"0",background:"rgba(0,0,0,0.2)",zIndex:String(this.zIndex-.5)}),this.element.parentNode.insertBefore(this.backdrop,this.element),this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.tabIndex=-1;const e=()=>!Array.from(a.values()).some(i=>i!==this&&i.modal&&i.isVisible&&i.zIndex>this.zIndex),t=()=>Array.from(this.element.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')).filter(i=>!i.disabled&&i.getClientRects().length);this.modalFocusHandler=i=>{!e()||this.element.contains(i.target)||i.target.closest(".blocklyWidgetDiv, .blocklyDropDownDiv, .ReactModalPortal")||(t()[0]||this.element).focus()},this.modalKeyHandler=i=>{if(i.key!=="Tab"||!e())return;const s=t(),o=s[0]||this.element,n=s[s.length-1]||this.element;(i.shiftKey?document.activeElement===o||document.activeElement===this.element:document.activeElement===n||document.activeElement===this.element)&&(i.preventDefault(),(i.shiftKey?n:o).focus())},document.addEventListener("focusin",this.modalFocusHandler),document.addEventListener("keydown",this.modalKeyHandler),(t()[0]||this.element).focus()}hideModalBackdrop(){this.backdrop&&(this.backdrop.remove(),this.backdrop=null,document.removeEventListener("focusin",this.modalFocusHandler),document.removeEventListener("keydown",this.modalKeyHandler),this.previouslyFocused&&this.previouslyFocused.isConnected&&this.previouslyFocused.focus())}show(){a.set(this.id,this),this.fitToViewport();const e=this.isVisible;return this.isVisible=!0,this.element.style.display="flex",e||(this.bringToFront(),this.showModalBackdrop()),this}hide(){return this.isVisible=!1,this.element.style.display="none",this.hideModalBackdrop(),this}destroy(e=!0){this.hide(),window.removeEventListener("resize",this.viewportResizeHandler),this.escapeHandler&&(document.removeEventListener("keydown",this.escapeHandler),this.escapeHandler=null),e&&this.onClose(),a.delete(this.id),this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element)}close(){this.destroy(!0)}minimize(){return this.destroyOnMinimize?(this.onMinimize(),this.destroy(!1),this):(this.hide(),this.isMinimized=!0,this.onMinimize(),this.updateMaximizeButton(),this)}restore(){return this.isMaximized&&(this.isMaximized=!1,this.savedState&&(this.x=this.savedState.x,this.y=this.savedState.y,this.width=this.savedState.width,this.height=this.savedState.height,this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`),this.updateMaximizeButton()),this.isMinimized&&(this.isMinimized=!1,this.show()),this.onRestore(),this}maximize(){return this.isMaximized?this:(this.savedState={x:this.x,y:this.y,width:this.width,height:this.height},this.isMaximized=!0,this.x=0,this.y=0,this.width=window.innerWidth,this.height=window.innerHeight,this.element.style.left="0px",this.element.style.top="0px",this.element.style.width="100vw",this.element.style.height="100vh",this.updateMaximizeButton(),this.onMaximize(),this)}toggleMaximize(){return this.isMaximized?this.restore():this.maximize(),this}setContent(e){return this.contentElement.innerHTML="",typeof e=="string"?this.contentElement.innerHTML=e:e instanceof HTMLElement&&this.contentElement.appendChild(e),this}setTitle(e){this.title=e;const t=this.headerElement.querySelector(".addon-window-title");return t&&(t.textContent=e),this}getContentElement(){return this.contentElement}center(){return this.x=Math.max(0,(window.innerWidth-this.width)/2),this.y=Math.max(0,(window.innerHeight-this.height)/2),this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this}moveTo(e,t){return this.x=e,this.y=t,this.element.style.left=`${e}px`,this.element.style.top=`${t}px`,this}focus(){return this.bringToFront(),this}isClosed(){return!this.isVisible}}class N{constructor(e={}){this.id=e.id||`addon-window-${++z}`,this.title=e.title||"Addon Window",this.width=e.width||400,this.height=e.height||300,this.minWidth=e.minWidth||200,this.minHeight=e.minHeight||150,this.maxWidth=e.maxWidth||null,this.maxHeight=e.maxHeight||null,this.x=e.x||Math.random()*100+50,this.y=e.y||Math.random()*100+50,this.resizable=e.resizable!==!1,this.modal=e.modal||!1,this.closable=e.closable!==!1,this.destroyOnMinimize=e.destroyOnMinimize||!1,this.alwaysOnTop=e.alwaysOnTop||this.modal,this.className=e.className||"",this.isVisible=!1,this.isMinimized=!1,this.isMaximized=!1,this.zIndex=++l,this.onClose=e.onClose||(()=>{}),this.onMinimize=e.onMinimize||(()=>{}),this.onMaximize=e.onMaximize||(()=>{}),this.onRestore=e.onRestore||(()=>{}),this.onResize=e.onResize||(()=>{}),this.onMove=e.onMove||(()=>{}),this.popup=null,this.centerOnShow=!1,this.element=document.createElement("div"),this.element.className=`addon-window ${this.className}`,this.element.style.cssText=`
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: var(--ui-modal-background, #ffffff);
            color: var(--text-primary, #2d3748);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
        `,this.element.style.setProperty("margin","0","important"),this.element.style.setProperty("width","100%","important"),this.element.style.setProperty("height","100%","important"),this.headerElement=document.createElement("div"),this.contentElement=document.createElement("div"),this.contentElement.className="addon-window-content",this.contentElement.style.cssText=`
            flex: 1;
            overflow: auto;
            box-sizing: border-box;
            min-height: 0;
            display: flex;
            flex-direction: column;
        `,this.element.appendChild(this.contentElement),a.set(this.id,this)}show(){if(a.set(this.id,this),this.popup&&!this.popup.closed)return this.isVisible=!0,this;const e=Math.round(this.width),t=Math.round(this.height);let i,s;this.centerOnShow?(i=Math.round((window.screen.availWidth-e)/2),s=Math.round((window.screen.availHeight-t)/2)):(i=Math.round(window.screenX+this.x),s=Math.round(window.screenY+this.y));const o=["mistwarpAddonWindow=1","popup=1",`width=${e}`,`height=${t}`,`left=${i}`,`top=${s}`,`minWidth=${Math.round(this.minWidth)}`,`minHeight=${Math.round(this.minHeight)}`,`resizable=${this.resizable?1:0}`,`alwaysOnTop=${this.alwaysOnTop?1:0}`].join(","),n=window.open("about:blank",this.id,o);if(!n)return this;this.popup=n,this.isVisible=!0,this.isMinimized=!1,this.zIndex=++l;const h=n.document;h.open(),h.write("<!DOCTYPE html><html><head></head><body></body></html>"),h.close(),h.documentElement.setAttribute("data-mw-native-window",""),h.title=this.title;const d=h.createElement("base");return d.href=document.baseURI,h.head.appendChild(d),x(h),f(h),h.body.style.cssText="margin:0;width:100%;height:100vh;overflow:hidden;",h.body.appendChild(this.element),O(),h.addEventListener("keydown",u=>{u.key==="Escape"&&this.closable&&this.close()}),n.addEventListener("resize",()=>{this.width=n.innerWidth,this.height=n.innerHeight,this.onResize(this.width,this.height)}),n.addEventListener("pagehide",()=>{this.popup===n&&(this.popup=null,this.isVisible=!1,document.adoptNode(this.element),a.delete(this.id),this.onClose())}),this}resyncStyles(){if(!this.popup||this.popup.closed)return;const e=this.popup.document;for(const t of e.querySelectorAll("[data-mw-copied-style]"))t.remove();x(e),f(e)}closePopup(){const e=this.popup;this.popup=null,this.isVisible=!1,e&&!e.closed&&(document.adoptNode(this.element),e.close())}hide(){return this.popup&&!this.popup.closed&&this.destroy(!0),this.isVisible=!1,this}destroy(e=!0){a.delete(this.id),this.closePopup(),e&&this.onClose()}close(){this.destroy(!0)}minimize(){return this.destroyOnMinimize?(this.onMinimize(),this.destroy(!1),this):(this.isMinimized=!0,this.onMinimize(),this)}restore(){return this.isMinimized=!1,this.show(),this.onRestore(),this}maximize(){return this}toggleMaximize(){return this}setContent(e){return this.contentElement.innerHTML="",typeof e=="string"?this.contentElement.innerHTML=e:e instanceof HTMLElement&&this.contentElement.appendChild(e),this}setTitle(e){return this.title=e,this.popup&&!this.popup.closed&&(this.popup.document.title=e),this}getContentElement(){return this.contentElement}center(){return this.popup&&!this.popup.closed?this.popup.moveTo(Math.round((window.screen.availWidth-this.popup.outerWidth)/2),Math.round((window.screen.availHeight-this.popup.outerHeight)/2)):this.centerOnShow=!0,this}moveTo(e,t){if(this.x=e,this.y=t,this.popup&&!this.popup.closed){const i=window.outerHeight-window.innerHeight;this.popup.moveTo(Math.round(window.screenX+e),Math.round(window.screenY+i+t))}return this}bringToFront(){return this.zIndex=++l,this.popup&&!this.popup.closed&&this.popup.focus(),this}focus(){return this.bringToFront()}isClosed(){return!this.popup||this.popup.closed}}const L={createWindow(r={}){return C()&&!W.has(r.id)?new N(r):new S(r)},getWindow(r){return a.get(r)},getAllWindows(){return Array.from(a.values())},closeWindow(r){const e=a.get(r);e&&e.close()},closeAllWindows(){for(const r of a.values())r.close()},bringToFront(r){const e=a.get(r);e&&e.bringToFront()}};typeof window<"u"&&(window.wm=L);export{L as W};
