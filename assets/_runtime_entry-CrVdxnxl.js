async function x({addon:s,console:M,msg:v,safeMsg:T}){const n=await s.tab.traps.getBlockly(),E=8,k=24,i=s.tab.traps.vm;let y=!1;const m=e=>{const t=e.findIndex(a=>a.getAttribute("callbackkey")==="CREATE_LIST"||a.getAttribute("type")==="data_addtolist");return{variables:e.slice(0,t),lists:e.slice(t,e.length)}},_=(e,t)=>{const{variables:a,lists:o}=m(t),h=r=>{const l=document.createElement("label");return l.setAttribute("text",v(r)),l},p=r=>{if(r.length>0){for(var l=0;l<r.length-1;l++)r[l].setAttribute("gap",E);r[l].setAttribute("gap",k)}},c=r=>{const l=[],u=[],f=[],d=[];for(const g of r)if(g.hasAttribute("id")){const G=g.getAttribute("id"),B=e.getVariableById(G);!B||!B.isLocal?u.push(g):f.push(g)}else u.length||f.length?d.push(g):l.push(g);const b=l;return u.length&&(b.push(h("for-all-sprites")),p(u),b.push(...u)),f.length&&(b.push(h("for-this-sprite-only")),p(f),b.push(...f)),b.concat(d)};return c(a).concat(c(o))},S=e=>{const{variables:t,lists:a}=m(e),o=h=>{const p=[],c=[];for(const r of h)r.hasAttribute("id")||r.tagName==="BUTTON"?p.push(r):c.push(r);return c.length&&c[c.length-1].setAttribute("gap",k),c.concat(p)};return o(t).concat(o(a))},w=n.DataCategory;let C,L;const I=e=>{let t=w(e);if(!s.self.disabled&&s.settings.get("moveReportersDown")&&(t=S(t)),!s.self.disabled&&s.settings.get("separateLocalVariables")&&(t=_(e,t)),s.self.disabled||!y)return t;const{variables:a,lists:o}=m(t);return C=a,L=o,C},R=()=>L,V=n.Flyout.prototype.show;n.Flyout.prototype.show=function(e){return this.workspace_.registerToolboxCategoryCallback("VARIABLE",I),this.workspace_.registerToolboxCategoryCallback("LIST",R),V.call(this,e)};const D=i.runtime.getBlocksXML;i.runtime.getBlocksXML=function(e){const t=D.call(this,e);return y=s.settings.get("separateListCategory"),!s.self.disabled&&y&&(t.push({id:"data",xml:`
        <category
          name="%{BKY_CATEGORY_VARIABLES}"
          id="variables"
          colour="${n.Colours.data.primary}"
          secondaryColour="${n.Colours.data.tertiary}"
          custom="VARIABLE">
        </category>
        <category
          name="${T("list-category")}"
          id="lists"
          colour="${n.Colours.data_lists.primary}"
          secondaryColour="${n.Colours.data_lists.tertiary}"
          custom="LIST">
        </category>`}),t.map=a=>Array.prototype.map.call(t,o=>o.id==="data"?o:a(o))),t},i.editingTarget&&i.emitWorkspaceUpdate(),s.settings.addEventListener("change",e=>{if(s.settings.get("separateListCategory")!==y)i.editingTarget&&i.emitWorkspaceUpdate();else{const t=Blockly.getMainWorkspace();t&&t.refreshToolboxSelection_()}});const A=()=>{if(s.settings.get("separateListCategory")&&i.editingTarget&&i.emitWorkspaceUpdate(),s.settings.get("separateLocalVariables")||s.settings.get("moveReportersDown")){const e=Blockly.getMainWorkspace();e&&e.refreshToolboxSelection_()}};s.self.addEventListener("disabled",()=>{A()}),s.self.addEventListener("reenabled",()=>{A()})}const W={"userscript.js":x};export{W as resources};
