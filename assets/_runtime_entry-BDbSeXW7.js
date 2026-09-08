async function s({addon:e}){function c(){const r=e.settings.get("iconSpacing"),i=e.settings.get("iconScale"),n=r/100*.5,t=i/100*2.5,o=document.getElementById("no-category-text-dynamic");o&&o.remove();const a=document.createElement("style");a.id="no-category-text-dynamic",a.textContent=`
      .scratchCategoryMenuItem {
        padding: ${n}rem 0 !important;
        min-height: ${t+n*2}rem;
      }
      
      .scratchCategoryMenuHorizontal .scratchCategoryMenuItem {
        padding: ${n}rem !important;
        min-width: ${t+n*2}rem;
      }
      
      .scratchCategoryItemBubble,
      .scratchCategoryItemIcon {
        width: ${t}rem !important;
        height: ${t}rem !important;
        margin: ${n}rem auto !important;
      }
      
      .scratchCategoryMenuHorizontal .scratchCategoryItemBubble,
      .scratchCategoryMenuHorizontal .scratchCategoryItemIcon {
        width: ${t*.8}rem !important;
        height: ${t*.8}rem !important;
        margin: 0 auto !important;
      }
    `,document.head.appendChild(a)}c(),e.settings.addEventListener("change",c),e.self.addEventListener("disabled",()=>{const r=document.getElementById("no-category-text-dynamic");r&&r.remove()}),e.self.addEventListener("reenabled",c)}const m=".scratchCategoryMenuItemLabel{display:none!important}.scratchCategoryMenuItem{display:flex;flex-direction:column;justify-content:center;align-items:center}.scratchCategoryMenuHorizontal .scratchCategoryMenuItem{min-height:auto}.scratchCategoryItemBubble:after{background-size:60%!important}",g={"userscript.js":s,"userstyle.css":m};export{g as resources};
