import{u as g}from"./update-all-blocks-iu5E8_sJ.js";import{cA as b}from"./render-gui-B9-j5s6J.js";import"./app-target-DUJH1SYE.js";import"./update-toast-kE3XNdw-.js";import"./index-Brtndpys.js";import"./checkbox-Bi_QKzAI.js";import"./mwp-BDq1043V.js";import"./blocks-Dz_pTdew.js";import"./project-data-DSteV30G.js";import"./restore-points-BkDCEjqS.js";import"./brand-DgcPEUvn.js";import"./index-QGBoGBPU.js";import"./recent-projects-BacAhiO1.js";import"./window-manager-vfu5o8sk.js";import"./database-ogJ5jasP.js";import"./index-Ciay2ptx.js";import"./download-blob--RDv2ZSV.js";import"./palette-71GgU-XA.js";import"./file-braces-BWD1_YsQ.js";import"./triangle-alert-D_Oe8cwI.js";import"./circle-check-big-z3tGIcjU.js";import"./extension-bridge-DGo4F4lX.js";import"./data-client-CLcruw1Z.js";import"./activity-wKA9Q9aO.js";import"./cloud-BE9oy8tu.js";import"./git-branch-B1O8A4HG.js";import"./flag-BrJX3jhO.js";import"./gamepad-2-C_Nd7Bmm.js";import"./keyboard-D_jariC9.js";async function u({addon:t,console:d}){let m=100;const a=t.tab.traps.vm,o=await t.tab.traps.getBlockly(),s=document.createElement("style");s.textContent=`
    .blocklyText,
    .blocklyHtmlInput {
      font-size: calc(var(--customBlockText-sizeSetting) * 0.12pt) !important;
    }
    .blocklyFlyoutLabelText {
      font-size: calc(var(--customBlockText-sizeSetting) * 0.14pt) !important;
    }`,s.disabled=!0,document.head.appendChild(s);const i=document.createElement("style");i.textContent=`
    .blocklyText,
    .blocklyHtmlInput {
      font-weight: bold;
    }`,i.disabled=!0,document.head.appendChild(i);const l=document.createElement("style");l.textContent=`
    .blocklyDraggable > .blocklyText,
    .blocklyDraggable > g > text {
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.4);
    }`,l.disabled=!0,document.head.appendChild(l);const r=()=>{typeof o.Field.clearFontCache=="function"?o.Field.clearFontCache():o.Field.cacheWidths_={},b(),g(a,t.tab.traps.getWorkspace(),o)},c=e=>{if(e!==100&&document.documentElement.style.setProperty("--customBlockText-sizeSetting",e),e===100){s.disabled=!0,m=100;return}else if(e===m)return;m=e,s.disabled=!1},n=e=>{i.disabled=!e},p=e=>{l.disabled=!e};t.settings.addEventListener("change",()=>{c(t.settings.get("size")),n(t.settings.get("bold")),p(t.settings.get("shadow")),r()}),t.self.addEventListener("disabled",()=>{c(100),n(!1),p(!1),r()}),t.self.addEventListener("reenabled",()=>{c(t.settings.get("size")),n(t.settings.get("bold")),p(t.settings.get("shadow")),r()}),c(t.settings.get("size")),n(t.settings.get("bold")),p(t.settings.get("shadow")),r()}const O={"userscript.js":u};export{O as resources};
