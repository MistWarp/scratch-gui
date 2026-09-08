import{u as g}from"./update-all-blocks-iu5E8_sJ.js";import{cz as b}from"./render-gui-CPlbvSzi.js";import"./app-target-CM2jOmMJ.js";import"./update-toast-D1qSAp2d.js";import"./normalize.module-Cz_xOu3L.js";import"./checkbox-C9VrgMqo.js";import"./mwp-vqCMOuEv.js";import"./blocks-C-LAtAbN.js";import"./project-data-nD2aDm43.js";import"./restore-points-BN4-UR-V.js";import"./brand-DgcPEUvn.js";import"./index-DPOabrGz.js";import"./recent-projects-0ubIvaGW.js";import"./window-manager-vfu5o8sk.js";import"./database-DFIW73Jd.js";import"./index-BnQhYBQu.js";import"./download-blob--RDv2ZSV.js";import"./palette-Bv2pOMps.js";import"./file-braces-Xxny4gjM.js";import"./triangle-alert-DjkRaSse.js";import"./circle-check-big-DTTS2nn8.js";import"./extension-bridge-Cd3Qqgf7.js";import"./data-client-Bvwy5W6l.js";import"./activity-jXDhLQK6.js";import"./cloud-NhLoAX5I.js";import"./git-branch-B50Jt59-.js";import"./flag-B9VuBbAG.js";import"./gamepad-2-COeZW6LI.js";import"./keyboard-D2-gXu3x.js";async function u({addon:t,console:d}){let m=100;const a=t.tab.traps.vm,o=await t.tab.traps.getBlockly(),s=document.createElement("style");s.textContent=`
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
