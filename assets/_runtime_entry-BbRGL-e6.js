import{u as g}from"./update-all-blocks-iu5E8_sJ.js";import{cy as b}from"./render-gui-Cr9aZsk4.js";import"./app-target-D-g55BvD.js";import"./update-toast-0C_DyEQL.js";import"./normalize.module-Wygpwixg.js";import"./checkbox-CquDRavo.js";import"./mwp-CJnlN2O1.js";import"./blocks-CtOtVANM.js";import"./project-data-Dt1gPrFg.js";import"./restore-points-Gh6o6gve.js";import"./brand-DgcPEUvn.js";import"./index-CsBCuB0E.js";import"./recent-projects-CV7dbu6B.js";import"./window-manager-vfu5o8sk.js";import"./database-BGaQ2Xl7.js";import"./index-Bhn2gYED.js";import"./download-blob--RDv2ZSV.js";import"./palette-D3KWtIQu.js";import"./file-braces-tim_asjv.js";import"./triangle-alert-B2wGDGGw.js";import"./circle-check-big-Bk19O1wl.js";import"./extension-bridge-C0WOCqEj.js";import"./data-client-Nnut7ddu.js";import"./activity-BMgHbo0d.js";import"./cloud-CmJw_HIJ.js";import"./git-branch-DIlskAvf.js";import"./flag-Ck0i6CZy.js";import"./gamepad-2-CM5biKdu.js";import"./keyboard-t4ijQAp_.js";async function u({addon:t,console:d}){let m=100;const a=t.tab.traps.vm,o=await t.tab.traps.getBlockly(),s=document.createElement("style");s.textContent=`
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
