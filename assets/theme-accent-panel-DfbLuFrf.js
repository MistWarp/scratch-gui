var $=Object.defineProperty;var V=(o,t,e)=>t in o?$(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var f=(o,t,e)=>V(o,typeof t!="symbol"?t+"":t,e);import{a as P,K as S}from"./mistwarp-logo-ObP-R103.js";import{c as C}from"./normalize.module-_RiYtHMt.js";import{aK as g,P as y,T,R as c,aL as j,aM as X}from"./app-target-Bj3NC30x.js";const Y=`
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
`,L=document.createElement("style");L.textContent=Y;document.head.appendChild(L);const A=8e3,G=8999;let p=A;const H=9600,Z=9999;let _=H,O=0;const l=new Map,K=new Set(["customProceduresModal"]),U=()=>typeof window<"u"&&typeof window.EditorPreload<"u";window.addEventListener("pagehide",()=>{for(const o of l.values())o.closePopup&&o.closePopup()});const I=o=>{for(const t of document.querySelectorAll('head style, head link[rel="stylesheet"], body style')){const e=o.importNode(t,!0);e.setAttribute("data-mw-copied-style",""),o.head.appendChild(e)}},B=o=>{for(const t of document.documentElement.attributes)o.documentElement.setAttribute(t.name,t.value);o.body.className=document.body.className};let b=null,k=!1;const q=()=>{k||(k=!0,requestAnimationFrame(()=>{k=!1;for(const o of l.values())o.resyncStyles&&o.resyncStyles()}))},J=()=>{if(b)return;b=new MutationObserver(q),b.observe(document.documentElement,{attributes:!0}),b.observe(document.head,{childList:!0,subtree:!0,characterData:!0}),b.observe(document.body,{childList:!0});const o=document.querySelector(".addons-styles");o&&b.observe(o,{childList:!0,subtree:!0,characterData:!0})};class Q{constructor(t={}){f(this,"handleDrag",t=>{if(!this.isDragging||this.dragPointerId!==null&&t.pointerId!==this.dragPointerId)return;const e=t.clientX-this.dragOffset.x,i=t.clientY-this.dragOffset.y,n=50,a=-(this.width-n),s=window.innerWidth-n,r=0,d=window.innerHeight-n;this.x=Math.max(a,Math.min(e,s)),this.y=Math.max(r,Math.min(i,d)),this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this.onMove(this.x,this.y)});f(this,"handleDragEnd",t=>{if(!(t&&this.dragPointerId!==null&&t.pointerId!==this.dragPointerId)){if(this.isDragging=!1,this.dragPointerId!==null){try{this.headerElement.releasePointerCapture(this.dragPointerId)}catch{}this.dragPointerId=null}this.headerElement.removeEventListener("pointermove",this.handleDrag),this.headerElement.removeEventListener("pointerup",this.handleDragEnd),this.headerElement.removeEventListener("pointercancel",this.handleDragEnd)}});f(this,"handleResize",t=>{if(!this.isResizing||this.resizePointerId!==null&&t.pointerId!==this.resizePointerId)return;const e=t.clientX-this.resizeStart.x,i=t.clientY-this.resizeStart.y,n=this.resizeDirection;let a=this.resizeStart.width,s=this.resizeStart.height,r=this.resizeStart.left,d=this.resizeStart.top;n.includes("e")&&(a+=e),n.includes("w")&&(a-=e,r=this.resizeStart.left+e),n.includes("s")&&(s+=i),n.includes("n")&&(s-=i,d=this.resizeStart.top+i);const x=a,u=s;a=Math.max(this.minWidth,a),s=Math.max(this.minHeight,s),this.maxWidth&&(a=Math.min(this.maxWidth,a)),this.maxHeight&&(s=Math.min(this.maxHeight,s)),n.includes("w")&&a!==x&&(r=this.resizeStart.left+(this.resizeStart.width-a)),n.includes("n")&&s!==u&&(d=this.resizeStart.top+(this.resizeStart.height-s)),this.width=a,this.height=s,this.x=r,this.y=d,this.element.style.width=`${a}px`,this.element.style.height=`${s}px`,this.element.style.left=`${r}px`,this.element.style.top=`${d}px`,this.onResize(a,s)});f(this,"handleResizeEnd",t=>{if(t&&this.resizePointerId!==null&&t.pointerId!==this.resizePointerId)return;this.isResizing=!1;const e=this.resizeHandle;if(e&&this.resizePointerId!==null){try{e.releasePointerCapture(this.resizePointerId)}catch{}e.removeEventListener("pointermove",this.handleResize),e.removeEventListener("pointerup",this.handleResizeEnd),e.removeEventListener("pointercancel",this.handleResizeEnd)}this.resizePointerId=null,this.resizeHandle=null});this.id=t.id||`addon-window-${++O}`,this.title=t.title||"Addon Window",this.width=t.width||400,this.height=t.height||300,this.minWidth=t.minWidth||200,this.minHeight=t.minHeight||150,this.maxWidth=t.maxWidth||null,this.maxHeight=t.maxHeight||null,this.x=t.x||Math.random()*100+50,this.y=t.y||Math.random()*100+50,this.resizable=t.resizable!==!1,this.modal=t.modal||!1,this.closable=t.closable!==!1,this.minimizable=t.minimizable!==!1,this.maximizable=t.maximizable!==!1,this.className=t.className||"",this.destroyOnMinimize=t.destroyOnMinimize||!1,this.alwaysOnTop=t.alwaysOnTop||this.modal,this.isVisible=!1,this.isMinimized=!1,this.isMaximized=!1,this.zIndex=this.alwaysOnTop?++_:++p,this.onClose=t.onClose||(()=>{}),this.onMinimize=t.onMinimize||(()=>{}),this.onMaximize=t.onMaximize||(()=>{}),this.onRestore=t.onRestore||(()=>{}),this.onResize=t.onResize||(()=>{}),this.onMove=t.onMove||(()=>{}),this.element=null,this.headerElement=null,this.contentElement=null,this.isDragging=!1,this.isResizing=!1,this.dragOffset={x:0,y:0},this.dragPointerId=null,this.resizePointerId=null,this.resizeHandle=null,this.savedState=null,this.viewportResizeHandler=()=>this.fitToViewport(),this.createWindow(),l.set(this.id,this)}createWindow(){this.element=document.createElement("div"),this.element.className=`addon-window ${this.className}`,this.element.style.cssText=`
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
        `;const t=document.createElement("div");t.className="addon-window-title",t.textContent=this.title,t.style.cssText=`
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary, #2d3748);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            z-index: 1;
        `;const e=document.createElement("div");if(e.className="addon-window-controls",e.style.cssText=`
            display: flex;
            gap: 6px;
            align-items: center;
            z-index: 1;
            overflow: hidden;
        `,this.minimizable){const i=this.createControlButton("minimize","Minimize",()=>this.minimize());e.appendChild(i)}if(this.maximizable){const i=this.createControlButton("maximize","Maximize",()=>this.toggleMaximize());this.maximizeBtn=i,e.appendChild(i)}if(this.closable){const i=this.createControlButton("close","Close",()=>this.close());e.appendChild(i)}this.headerElement.appendChild(t),this.headerElement.appendChild(e),this.contentElement=document.createElement("div"),this.contentElement.className="addon-window-content",this.contentElement.style.cssText=`
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
        `,this.element.appendChild(this.headerElement),this.element.appendChild(this.contentElement),this.resizable&&this.addResizeHandles(),this.addDragFunctionality(),document.body.appendChild(this.element),this.fitToViewport(),window.addEventListener("resize",this.viewportResizeHandler),this.escapeHandler=i=>{if(i.key!=="Escape"||!this.closable||!this.isVisible)return;Array.from(l.values()).filter(a=>a.isVisible).sort((a,s)=>s.zIndex-a.zIndex)[0]===this&&this.close()},document.addEventListener("keydown",this.escapeHandler)}createControlButton(t,e,i){const n=document.createElement("button");n.title=e,n.className=`addon-window-btn addon-window-btn-${t}`;let a="";switch(t){case"minimize":a=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>`;break;case"maximize":a=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>`;break;case"restore":a=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>`;break;case"close":a=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>`;break}return n.innerHTML=a,n.style.cssText=`
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
        `,n.addEventListener("pointerdown",s=>{s.stopPropagation()}),n.addEventListener("click",s=>{s.stopPropagation(),i()}),n}updateMaximizeButton(){if(this.maximizeBtn){const t=this.isMaximized?`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>`:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    </svg>`;this.maximizeBtn.innerHTML=t,this.maximizeBtn.title=this.isMaximized?"Restore":"Maximize"}}addDragFunctionality(){this.headerElement.addEventListener("pointerdown",t=>{if(t.button!==0||t.target.closest("button"))return;this.isDragging=!0,this.dragPointerId=t.pointerId,this.bringToFront();const e=parseInt(this.element.style.left,10)||this.x,i=parseInt(this.element.style.top,10)||this.y;this.dragOffset={x:t.clientX-e,y:t.clientY-i};try{this.headerElement.setPointerCapture(t.pointerId)}catch{}this.headerElement.addEventListener("pointermove",this.handleDrag),this.headerElement.addEventListener("pointerup",this.handleDragEnd),this.headerElement.addEventListener("pointercancel",this.handleDragEnd),t.preventDefault()})}addResizeHandles(){["n","ne","e","se","s","sw","w","nw"].forEach(e=>{const i=document.createElement("div");i.className=`resize-handle resize-${e}`;const n={position:"absolute",backgroundColor:"transparent",zIndex:"10"};switch(e){case"n":Object.assign(n,{top:"0",left:"8px",right:"8px",height:"4px",cursor:"n-resize"});break;case"ne":Object.assign(n,{top:"0",right:"0",width:"8px",height:"8px",cursor:"ne-resize"});break;case"e":Object.assign(n,{right:"0",top:"8px",bottom:"8px",width:"4px",cursor:"e-resize"});break;case"se":Object.assign(n,{bottom:"0",right:"0",width:"8px",height:"8px",cursor:"se-resize"});break;case"s":Object.assign(n,{bottom:"0",left:"8px",right:"8px",height:"4px",cursor:"s-resize"});break;case"sw":Object.assign(n,{bottom:"0",left:"0",width:"8px",height:"8px",cursor:"sw-resize"});break;case"w":Object.assign(n,{left:"0",top:"8px",bottom:"8px",width:"4px",cursor:"w-resize"});break;case"nw":Object.assign(n,{top:"0",left:"0",width:"8px",height:"8px",cursor:"nw-resize"});break}Object.assign(i.style,n),i.style.touchAction="none",i.addEventListener("pointerdown",a=>{a.button===0&&(a.stopPropagation(),this.startResize(a,e,i))}),this.element.appendChild(i)})}startResize(t,e,i){this.isResizing=!0,this.resizeDirection=e,this.resizePointerId=t.pointerId,this.resizeHandle=i,this.bringToFront();const n=this.element.getBoundingClientRect();this.resizeStart={x:t.clientX,y:t.clientY,width:n.width,height:n.height,left:n.left,top:n.top};try{i.setPointerCapture(t.pointerId)}catch{}i.addEventListener("pointermove",this.handleResize),i.addEventListener("pointerup",this.handleResizeEnd),i.addEventListener("pointercancel",this.handleResizeEnd),t.preventDefault()}bringToFront(){const t=this.alwaysOnTop,e=t?H:A;if((t?_:p)>=(t?Z:G)){const n=Array.from(l.values()).filter(s=>s.alwaysOnTop===t),a=n.indexOf(this);if(a!==-1&&n.splice(a,1),n.sort((s,r)=>s.zIndex-r.zIndex),t){_=e;for(const s of n)s.zIndex=++_,s.element.style.zIndex=s.zIndex}else{p=e;for(const s of n)s.zIndex=++p,s.element.style.zIndex=s.zIndex}}this.zIndex=t?++_:++p,this.element.style.zIndex=this.zIndex,this.backdrop&&(this.backdrop.style.zIndex=String(this.zIndex-.5))}fitToViewport(){if(!this.element||this.isMaximized||window.innerWidth<=900)return this;const t=16,e=Math.max(0,window.innerWidth-t*2),i=Math.max(0,window.innerHeight-t*2),n=Math.min(this.width,e),a=Math.min(this.height,i),s=Math.max(t,Math.min(this.x,window.innerWidth-n-t)),r=Math.max(t,Math.min(this.y,window.innerHeight-a-t)),d=n!==this.width||a!==this.height;return this.width=n,this.height=a,this.x=s,this.y=r,this.minWidth=Math.min(this.minWidth,e),this.minHeight=Math.min(this.minHeight,i),this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`,this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,d&&this.onResize(this.width,this.height),this}showModalBackdrop(){if(!this.modal||this.backdrop)return;this.previouslyFocused=document.activeElement,this.backdrop=document.createElement("div"),Object.assign(this.backdrop.style,{position:"fixed",inset:"0",background:"rgba(0,0,0,0.2)",zIndex:String(this.zIndex-.5)}),this.element.parentNode.insertBefore(this.backdrop,this.element),this.element.setAttribute("role","dialog"),this.element.setAttribute("aria-modal","true"),this.element.tabIndex=-1;const t=()=>!Array.from(l.values()).some(i=>i!==this&&i.modal&&i.isVisible&&i.zIndex>this.zIndex),e=()=>Array.from(this.element.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')).filter(i=>!i.disabled&&i.getClientRects().length);this.modalFocusHandler=i=>{!t()||this.element.contains(i.target)||i.target.closest(".blocklyWidgetDiv, .blocklyDropDownDiv, .ReactModalPortal")||(e()[0]||this.element).focus()},this.modalKeyHandler=i=>{if(i.key!=="Tab"||!t())return;const n=e(),a=n[0]||this.element,s=n[n.length-1]||this.element;(i.shiftKey?document.activeElement===a||document.activeElement===this.element:document.activeElement===s||document.activeElement===this.element)&&(i.preventDefault(),(i.shiftKey?s:a).focus())},document.addEventListener("focusin",this.modalFocusHandler),document.addEventListener("keydown",this.modalKeyHandler),(e()[0]||this.element).focus()}hideModalBackdrop(){this.backdrop&&(this.backdrop.remove(),this.backdrop=null,document.removeEventListener("focusin",this.modalFocusHandler),document.removeEventListener("keydown",this.modalKeyHandler),this.previouslyFocused&&this.previouslyFocused.isConnected&&this.previouslyFocused.focus())}show(){l.set(this.id,this),this.fitToViewport();const t=this.isVisible;return this.isVisible=!0,this.element.style.display="flex",t||(this.bringToFront(),this.showModalBackdrop()),this}hide(){return this.isVisible=!1,this.element.style.display="none",this.hideModalBackdrop(),this}destroy(t=!0){this.hide(),window.removeEventListener("resize",this.viewportResizeHandler),this.escapeHandler&&(document.removeEventListener("keydown",this.escapeHandler),this.escapeHandler=null),t&&this.onClose(),l.delete(this.id),this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element)}close(){this.destroy(!0)}minimize(){return this.destroyOnMinimize?(this.onMinimize(),this.destroy(!1),this):(this.hide(),this.isMinimized=!0,this.onMinimize(),this.updateMaximizeButton(),this)}restore(){return this.isMaximized&&(this.isMaximized=!1,this.savedState&&(this.x=this.savedState.x,this.y=this.savedState.y,this.width=this.savedState.width,this.height=this.savedState.height,this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this.element.style.width=`${this.width}px`,this.element.style.height=`${this.height}px`),this.updateMaximizeButton()),this.isMinimized&&(this.isMinimized=!1,this.show()),this.onRestore(),this}maximize(){return this.isMaximized?this:(this.savedState={x:this.x,y:this.y,width:this.width,height:this.height},this.isMaximized=!0,this.x=0,this.y=0,this.width=window.innerWidth,this.height=window.innerHeight,this.element.style.left="0px",this.element.style.top="0px",this.element.style.width="100vw",this.element.style.height="100vh",this.updateMaximizeButton(),this.onMaximize(),this)}toggleMaximize(){return this.isMaximized?this.restore():this.maximize(),this}setContent(t){return this.contentElement.innerHTML="",typeof t=="string"?this.contentElement.innerHTML=t:t instanceof HTMLElement&&this.contentElement.appendChild(t),this}setTitle(t){this.title=t;const e=this.headerElement.querySelector(".addon-window-title");return e&&(e.textContent=t),this}getContentElement(){return this.contentElement}center(){return this.x=Math.max(0,(window.innerWidth-this.width)/2),this.y=Math.max(0,(window.innerHeight-this.height)/2),this.element.style.left=`${this.x}px`,this.element.style.top=`${this.y}px`,this}moveTo(t,e){return this.x=t,this.y=e,this.element.style.left=`${t}px`,this.element.style.top=`${e}px`,this}focus(){return this.bringToFront(),this}isClosed(){return!this.isVisible}}class tt{constructor(t={}){this.id=t.id||`addon-window-${++O}`,this.title=t.title||"Addon Window",this.width=t.width||400,this.height=t.height||300,this.minWidth=t.minWidth||200,this.minHeight=t.minHeight||150,this.maxWidth=t.maxWidth||null,this.maxHeight=t.maxHeight||null,this.x=t.x||Math.random()*100+50,this.y=t.y||Math.random()*100+50,this.resizable=t.resizable!==!1,this.modal=t.modal||!1,this.closable=t.closable!==!1,this.destroyOnMinimize=t.destroyOnMinimize||!1,this.alwaysOnTop=t.alwaysOnTop||this.modal,this.className=t.className||"",this.isVisible=!1,this.isMinimized=!1,this.isMaximized=!1,this.zIndex=++p,this.onClose=t.onClose||(()=>{}),this.onMinimize=t.onMinimize||(()=>{}),this.onMaximize=t.onMaximize||(()=>{}),this.onRestore=t.onRestore||(()=>{}),this.onResize=t.onResize||(()=>{}),this.onMove=t.onMove||(()=>{}),this.popup=null,this.centerOnShow=!1,this.element=document.createElement("div"),this.element.className=`addon-window ${this.className}`,this.element.style.cssText=`
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
        `,this.element.appendChild(this.contentElement),l.set(this.id,this)}show(){if(l.set(this.id,this),this.popup&&!this.popup.closed)return this.isVisible=!0,this;const t=Math.round(this.width),e=Math.round(this.height);let i,n;this.centerOnShow?(i=Math.round((window.screen.availWidth-t)/2),n=Math.round((window.screen.availHeight-e)/2)):(i=Math.round(window.screenX+this.x),n=Math.round(window.screenY+this.y));const a=["mistwarpAddonWindow=1","popup=1",`width=${t}`,`height=${e}`,`left=${i}`,`top=${n}`,`minWidth=${Math.round(this.minWidth)}`,`minHeight=${Math.round(this.minHeight)}`,`resizable=${this.resizable?1:0}`,`alwaysOnTop=${this.alwaysOnTop?1:0}`].join(","),s=window.open("about:blank",this.id,a);if(!s)return this;this.popup=s,this.isVisible=!0,this.isMinimized=!1,this.zIndex=++p;const r=s.document;r.open(),r.write("<!DOCTYPE html><html><head></head><body></body></html>"),r.close(),r.documentElement.setAttribute("data-mw-native-window",""),r.title=this.title;const d=r.createElement("base");return d.href=document.baseURI,r.head.appendChild(d),I(r),B(r),r.body.style.cssText="margin:0;width:100%;height:100vh;overflow:hidden;",r.body.appendChild(this.element),J(),r.addEventListener("keydown",x=>{x.key==="Escape"&&this.closable&&this.close()}),s.addEventListener("resize",()=>{this.width=s.innerWidth,this.height=s.innerHeight,this.onResize(this.width,this.height)}),s.addEventListener("pagehide",()=>{this.popup===s&&(this.popup=null,this.isVisible=!1,document.adoptNode(this.element),l.delete(this.id),this.onClose())}),this}resyncStyles(){if(!this.popup||this.popup.closed)return;const t=this.popup.document;for(const e of t.querySelectorAll("[data-mw-copied-style]"))e.remove();I(t),B(t)}closePopup(){const t=this.popup;this.popup=null,this.isVisible=!1,t&&!t.closed&&(document.adoptNode(this.element),t.close())}hide(){return this.popup&&!this.popup.closed&&this.destroy(!0),this.isVisible=!1,this}destroy(t=!0){l.delete(this.id),this.closePopup(),t&&this.onClose()}close(){this.destroy(!0)}minimize(){return this.destroyOnMinimize?(this.onMinimize(),this.destroy(!1),this):(this.isMinimized=!0,this.onMinimize(),this)}restore(){return this.isMinimized=!1,this.show(),this.onRestore(),this}maximize(){return this}toggleMaximize(){return this}setContent(t){return this.contentElement.innerHTML="",typeof t=="string"?this.contentElement.innerHTML=t:t instanceof HTMLElement&&this.contentElement.appendChild(t),this}setTitle(t){return this.title=t,this.popup&&!this.popup.closed&&(this.popup.document.title=t),this}getContentElement(){return this.contentElement}center(){return this.popup&&!this.popup.closed?this.popup.moveTo(Math.round((window.screen.availWidth-this.popup.outerWidth)/2),Math.round((window.screen.availHeight-this.popup.outerHeight)/2)):this.centerOnShow=!0,this}moveTo(t,e){if(this.x=t,this.y=e,this.popup&&!this.popup.closed){const i=window.outerHeight-window.innerHeight;this.popup.moveTo(Math.round(window.screenX+t),Math.round(window.screenY+i+e))}return this}bringToFront(){return this.zIndex=++p,this.popup&&!this.popup.closed&&this.popup.focus(),this}focus(){return this.bringToFront()}isClosed(){return!this.popup||this.popup.closed}}const R={createWindow(o={}){return U()&&!K.has(o.id)?new tt(o):new Q(o)},getWindow(o){return l.get(o)},getAllWindows(){return Array.from(l.values())},closeWindow(o){const t=l.get(o);t&&t.close()},closeAllWindows(){for(const o of l.values())o.close()},bringToFront(o){const t=l.get(o);t&&t.bringToFront()}};typeof window<"u"&&(window.wm=R);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],en=P("shield",et);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const it=[["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],nn=P("trash",it),nt="settings-menu_button_OcAlK",st="settings-menu_icon_ePELc",ot="settings-menu_option_O0_ay",at="settings-menu_dropdown-label_bkBsQ",rt="settings-menu_fonts-container_Sf1Up",ct="settings-menu_font-section_eoMs-",lt="settings-menu_font-section-title_t0OQy",dt="settings-menu_font-section-title-left_Ho_rX",ht="settings-menu_inlineIcon_i9Pq5",mt="settings-menu_reset-button_vCROh",pt="settings-menu_font-input-container_rqG-g",gt="settings-menu_font-input_NT3et",ut="settings-menu_add-button_ef9Da",wt="settings-menu_font-list_-8fO9",bt="settings-menu_font-item_AGZ-I",ft="settings-menu_selected-fonts-list_9Yeqk",_t="settings-menu_selected-font_BQL8H",xt="settings-menu_remove-button_XkgJO",yt="settings-menu_fontHint_35QMq",vt="settings-menu_gcRoot_PB4Le",zt="settings-menu_gcBody_2YyNz",Et="settings-menu_gcPreview_NcAJ7",St="settings-menu_gcPreviewFill_V7o-L",kt="settings-menu_gcStopHandle_jFZU5",Mt="settings-menu_gcStopHandleActive_xvmAN",Ct="settings-menu_gcStops_xqk7x",It="settings-menu_gcStopChip_DgV7T",Bt="settings-menu_gcStopColor_8LCcM",Pt="settings-menu_gcStopPos_dDyGf",Tt="settings-menu_gcStopRemove_fKv_g",Lt="settings-menu_gcAddStop_SL3J-",At="settings-menu_gcField_QxOEA",Ht="settings-menu_gcLabel_Cdnkj",Ot="settings-menu_gcInput_6F1z-",Rt="settings-menu_gcTextarea__U9p-",Nt="settings-menu_gcDirectionRow__q8_l",Dt="settings-menu_gcSlider_67U1E",Wt="settings-menu_gcDegrees_iR1c1",Ft="settings-menu_gcDirectionPresets_wOjbr",$t="settings-menu_gcDirBtn_a0RoS",Vt="settings-menu_gcDirBtnActive_jVLV4",jt="settings-menu_gcPresets_IaYux",Xt="settings-menu_gcPresetSwatch_n2YyL",Yt="settings-menu_gcPresetSwatchActive_HQdQp",Gt="settings-menu_gcAccentRow_l4296",Zt="settings-menu_gcHex_dRktL",Kt="settings-menu_gcFooter_RHFdL",Ut="settings-menu_gcFooterSpacer_R-YRT",qt="settings-menu_gcBtn_4_W0f",Jt="settings-menu_gcBtnActive_OJaRb",Qt="settings-menu_gcBtnPrimary_lws9t",sn={button:nt,icon:st,option:ot,dropdownLabel:at,fontsContainer:rt,fontSection:ct,fontSectionTitle:lt,fontSectionTitleLeft:dt,inlineIcon:ht,resetButton:mt,fontInputContainer:pt,fontInput:gt,addButton:ut,fontList:wt,fontItem:bt,selectedFontsList:ft,selectedFont:_t,removeButton:xt,fontHint:yt,gcRoot:vt,gcBody:zt,gcPreview:Et,gcPreviewFill:St,gcStopHandle:kt,gcStopHandleActive:Mt,gcStops:Ct,gcStopChip:It,gcStopColor:Bt,gcStopPos:Pt,gcStopRemove:Tt,gcAddStop:Lt,gcField:At,gcLabel:Ht,gcInput:Ot,gcTextarea:Rt,gcDirectionRow:Nt,gcSlider:Dt,gcDegrees:Wt,gcDirectionPresets:Ft,gcDirBtn:$t,gcDirBtnActive:Vt,gcPresets:jt,gcPresetSwatch:Xt,gcPresetSwatchActive:Yt,gcAccentRow:Gt,gcHex:Zt,gcFooter:Kt,gcFooterSpacer:Ut,gcBtn:qt,gcBtnActive:Jt,gcBtnPrimary:Qt},on=(o,t={})=>new Promise(e=>{const i=t.title||"Alert",n=t.width||420,a=t.height||160,s=R.createWindow({title:i,width:n,height:a,resizable:!1,maximizable:!1,minimizable:!1,closable:!0,modal:!0,alwaysOnTop:!0,className:"mw-alert-window"});let r=null;const d=()=>{r&&(document.removeEventListener("pointerdown",r),r=null)};r=m=>{const E=m.target.closest(".addon-window");if(E&&E!==s.element){try{s.close()}catch{}e(),d()}},setTimeout(()=>{document.addEventListener("pointerdown",r)},100);const u=document.createElement("div");u.style.cssText="padding:18px;display:flex;flex-direction:column;gap:12px;align-items:stretch;justify-content:center;min-height:100%;box-sizing:border-box;font-family:inherit;color:var(--ui-modal-foreground, #111);";const v=document.createElement("div");v.innerText=String(o===null?"":o),v.style.cssText="white-space:pre-wrap;font-size:14px;line-height:1.4;";const z=document.createElement("div");z.style.cssText="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;";const w=document.createElement("button");w.innerText=t.okLabel||"OK",w.className="mw-alert-ok-btn",w.style.cssText="padding:8px 14px;border-radius:8px;border:none;background:var(--ui-primary, #4C97FF);color:white;cursor:pointer;font-weight:600;",w.addEventListener("click",()=>{try{s.close()}catch{}d(),e()});const M=m=>{if(m.key==="Enter"||m.key==="Escape"){m.preventDefault();try{s.close()}catch{}d(),e()}};z.appendChild(w),u.appendChild(v),u.appendChild(z),s.setContent(u),s.center().show(),setTimeout(()=>{try{w.focus()}catch{}document.addEventListener("keydown",M)},10);const F=s.onClose;s.onClose=()=>{document.removeEventListener("keydown",M),d();try{F()}catch{}e()}}),te="settings-modal_body_youXk",ee="settings-modal_contentArea_pU8UR",ie="settings-modal_modal-content_13of6",ne="settings-modal_page-content_gP56Q",se="settings-modal_setting_SF4n4",oe="settings-modal_active_KkTJX",ae="settings-modal_menu-bar-layout_uuKgK",re="settings-modal_menu-bar-setting-row_-ZV73",ce="settings-modal_label_PSjVh",le="settings-modal_settingText_XEcj2",de="settings-modal_detail_PeeJS",he="settings-modal_textSettingLabel_f6A6X",me="settings-modal_text-input_7mJn3",pe="settings-modal_number-input_b-4_i",ge="settings-modal_select_j1TKJ",ue="settings-modal_style-picker_CFJD2",we="settings-modal_style-option_ZnYgA",be="settings-modal_style-option-selected_lqZPl",fe="settings-modal_style-preview_kP6N-",_e="settings-modal_style-option-label_FcqD7",xe="settings-modal_menu-bar-hint_UNYiA",ye="settings-modal_menu-bar-zone-label_yAd6B",ve="settings-modal_menu-bar-move-buttons_5hcuE",ze="settings-modal_menu-bar-move-button_czBip",Ee="settings-modal_align-selector_lC7tX",Se="settings-modal_align-option_ncPTx",ke="settings-modal_align-option-selected_JQkPD",Me="settings-modal_menu-bar-row_dT4PU",Ce="settings-modal_menu-bar-grip_mGyDp",Ie="settings-modal_menu-bar-row-label_4NSfn",Be="settings-modal_checkbox_dbn5m",Pe="settings-modal_help-icon_5p95X",Te="settings-modal_custom-stage-size_z-Fsg",Le="settings-modal_custom-stage-size-input_xurvO",Ae="settings-modal_header_l-Ove",He="settings-modal_divider_cc_pg",Oe="settings-modal_button_PBhjw",Re="settings-modal_warning_LsS9B",Ne="settings-modal_icon-button_bNwM1",De="settings-modal_theme-card-preview_KgnvY",We="settings-modal_theme-card-icon_Pitmm",Fe="settings-modal_accent-grid_PQpsp",$e="settings-modal_accent-option_C7ILi",Ve="settings-modal_accent-option-selected_dXG6E",je="settings-modal_accent-swatch_RGpZ-",Xe="settings-modal_accent-name_kcyiU",Ye="settings-modal_wallpaper-input-row_eF6D6",Ge="settings-modal_slider-row_KP7vs",Ze="settings-modal_slider-label_AA92i",Ke="settings-modal_slider-value__yhBA",Ue="settings-modal_wallpaper-list_HrR-A",qe="settings-modal_wallpaper-item_mIZi9",Je="settings-modal_wallpaper-item-selected_mNl6t",Qe="settings-modal_wallpaper-choice_wxhjI",ti="settings-modal_wallpaper-thumb_Zj9zB",ei="settings-modal_wallpaper-item-url_2-Xhz",ii="settings-modal_font-list_0Xa9Q",ni="settings-modal_font-row_PwvV7",si="settings-modal_ct-page_tYAKH",oi="settings-modal_ct-tabs_Krrk-",ai="settings-modal_ct-tab_VSlVX",ri="settings-modal_ct-tab-selected_4G0yZ",ci="settings-modal_ct-tab-badge_ifKBm",li="settings-modal_ct-status_gEPm_",di="settings-modal_ct-content_BWI2x",hi="settings-modal_ct-library_5xoS1",mi="settings-modal_ct-card_jtGcT",pi="settings-modal_ct-card-selected_6YaYl",gi="settings-modal_ct-card-main_rZoqP",ui="settings-modal_ct-card-swatch_WUbSR",wi="settings-modal_ct-card-body_cslpe",bi="settings-modal_ct-card-title-row_-bzkJ",fi="settings-modal_ct-card-name_EItf7",_i="settings-modal_ct-active-pill_Onot3",xi="settings-modal_ct-card-desc_wf4SC",yi="settings-modal_ct-card-desc-muted_fnTSv",vi="settings-modal_ct-card-actions_3VDYV",zi="settings-modal_ct-delete-confirm_C4P15",Ei="settings-modal_ct-delete-error_oIFdE",Si="settings-modal_ct-delete-actions_o7MhC",ki="settings-modal_ct-button-secondary_Itfao",Mi="settings-modal_ct-empty_57IRx",Ci="settings-modal_ct-empty-actions_LlLkJ",Ii="settings-modal_ct-form-actions_bE4vT",Bi="settings-modal_ct-action-card_dFQgS",Pi="settings-modal_ct-create_4C2Lb",Ti="settings-modal_ct-mode-switch_V6PLB",Li="settings-modal_ct-mode-btn_gvjEB",Ai="settings-modal_ct-mode-btn-selected_IimPm",Hi="settings-modal_ct-panel_Ap-AY",Oi="settings-modal_ct-panel-header_Saj8x",Ri="settings-modal_ct-snapshot_0tbmg",Ni="settings-modal_ct-snapshot-swatch_z-rFy",Di="settings-modal_ct-snapshot-meta_orbSl",Wi="settings-modal_ct-field_WCFP4",Fi="settings-modal_ct-label_seht1",$i="settings-modal_ct-input_UDcW4",Vi="settings-modal_ct-textarea_qYbCB",ji="settings-modal_ct-import_5YGb5",Xi="settings-modal_ct-action-icon_3q2iG",Yi="settings-modal_ct-action-body_VGnFZ",Gi="settings-modal_accent-group-label_FAOz_",Zi="settings-modal_mobile-back-button_uLa16",h={body:te,contentArea:ee,modalContent:ie,pageContent:ne,setting:se,active:oe,menuBarLayout:ae,menuBarSettingRow:re,label:ce,settingText:le,detail:de,textSettingLabel:he,textInput:me,numberInput:pe,select:ge,stylePicker:ue,styleOption:we,styleOptionSelected:be,stylePreview:fe,styleOptionLabel:_e,menuBarHint:xe,menuBarZoneLabel:ye,menuBarMoveButtons:ve,menuBarMoveButton:ze,alignSelector:Ee,alignOption:Se,alignOptionSelected:ke,menuBarRow:Me,menuBarGrip:Ce,menuBarRowLabel:Ie,checkbox:Be,helpIcon:Pe,customStageSize:Te,customStageSizeInput:Le,header:Ae,divider:He,button:Oe,warning:Re,iconButton:Ne,themeCardPreview:De,themeCardIcon:We,accentGrid:Fe,accentOption:$e,accentOptionSelected:Ve,accentSwatch:je,accentName:Xe,wallpaperInputRow:Ye,sliderRow:Ge,sliderLabel:Ze,sliderValue:Ke,wallpaperList:Ue,wallpaperItem:qe,wallpaperItemSelected:Je,wallpaperChoice:Qe,wallpaperThumb:ti,wallpaperItemUrl:ei,fontList:ii,fontRow:ni,ctPage:si,ctTabs:oi,ctTab:ai,ctTabSelected:ri,ctTabBadge:ci,ctStatus:li,ctContent:di,ctLibrary:hi,ctCard:mi,ctCardSelected:pi,ctCardMain:gi,ctCardSwatch:ui,ctCardBody:wi,ctCardTitleRow:bi,ctCardName:fi,ctActivePill:_i,ctCardDesc:xi,ctCardDescMuted:yi,ctCardActions:vi,ctDeleteConfirm:zi,ctDeleteError:Ei,ctDeleteActions:Si,ctButtonSecondary:ki,ctEmpty:Mi,ctEmptyActions:Ci,ctFormActions:Ii,ctActionCard:Bi,ctCreate:Pi,ctModeSwitch:Ti,ctModeBtn:Li,ctModeBtnSelected:Ai,ctPanel:Hi,ctPanelHeader:Oi,ctSnapshot:Ri,ctSnapshotSwatch:Ni,ctSnapshotMeta:Di,ctField:Wi,ctLabel:Fi,ctInput:$i,ctTextarea:Vi,ctImport:ji,ctActionIcon:Xi,ctActionBody:Yi,accentGroupLabel:Gi,mobileBackButton:Zi},N={};for(const o of Object.keys(g))N[o]={id:g[o].id,defaultMessage:g[o].defaultMessage,description:g[o].description};const D=({children:o})=>c.createElement("div",{className:h.header},o,c.createElement("div",{className:h.divider}));D.propTypes={children:y.node};const W=({id:o})=>c.createElement("svg",{className:h.themeCardIcon,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",dangerouslySetInnerHTML:{__html:X[o].icon}});W.propTypes={id:y.string};const Ki=({theme:o,onChangeTheme:t})=>c.createElement(c.Fragment,null,c.createElement("div",{className:h.stylePicker},Object.entries(T.defaults).map(([e,i])=>c.createElement("button",{key:e,type:"button",className:C(h.styleOption,{[h.styleOptionSelected]:o.gui===e}),onClick:()=>t(o.set("gui",e))},c.createElement("div",{className:h.themeCardPreview},c.createElement(W,{id:e})),c.createElement("span",{className:h.styleOptionLabel},i.name||i.gui)))),c.createElement(D,null,c.createElement(S,{defaultMessage:"Accent",description:"Label for menu to choose accent color (eg. TurboWarp's red, Scratch's purple)",id:"tw.menuBar.accent"})),j.map(e=>c.createElement(c.Fragment,{key:e.label.id},c.createElement("div",{className:h.accentGroupLabel},c.createElement(S,{...e.label})),c.createElement("div",{className:h.accentGrid},e.accents.filter(i=>g[i]).map(i=>c.createElement("button",{key:i,type:"button",className:C(h.accentOption,{[h.accentOptionSelected]:o.accent===i}),onClick:()=>t(o.set("accent",i))},c.createElement("div",{className:h.accentSwatch,style:{backgroundColor:g[i].guiColors["looks-secondary"],backgroundImage:g[i].guiColors["menu-bar-background-image"]}}),c.createElement("span",{className:h.accentName},c.createElement(S,{...N[i]}))))))));Ki.propTypes={theme:y.instanceOf(T),onChangeTheme:y.func};export{D as P,en as S,nn as T,R as W,on as a,h as b,Ki as c,sn as s};
