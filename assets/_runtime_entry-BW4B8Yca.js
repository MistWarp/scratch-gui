import{u as g}from"./update-all-blocks-iu5E8_sJ.js";import{cz as b}from"./render-gui-BKTkOiAE.js";import"./app-target-CM2jOmMJ.js";import"./update-toast-PrpdS0K0.js";import"./normalize.module-Cz_xOu3L.js";import"./checkbox-C9VrgMqo.js";import"./mwp-DsGsx556.js";import"./blocks-BfiThKvJ.js";import"./project-data-Crlr5t3q.js";import"./restore-points-BN4-UR-V.js";import"./brand-DgcPEUvn.js";import"./index-C808PB9e.js";import"./recent-projects-CpHR7fuF.js";import"./window-manager-vfu5o8sk.js";import"./database-dohm5H15.js";import"./index-BnQhYBQu.js";import"./download-blob--RDv2ZSV.js";import"./palette-EnIX5DrX.js";import"./file-braces-Cm3vtP0D.js";import"./triangle-alert-CdSiWFfh.js";import"./circle-check-big-BFRAr31p.js";import"./extension-bridge-BSsx4QdK.js";import"./data-client-Bvwy5W6l.js";import"./activity-BPgFwgZn.js";import"./cloud-C_1_7ObM.js";import"./git-branch-BTNb1e6_.js";import"./flag-CqiRiMhx.js";import"./gamepad-2-D8YYHW-w.js";import"./keyboard-DiT0tsw-.js";async function u({addon:t,console:d}){let m=100;const a=t.tab.traps.vm,o=await t.tab.traps.getBlockly(),s=document.createElement("style");s.textContent=`
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
