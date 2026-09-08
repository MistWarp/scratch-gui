import{u as g}from"./update-all-blocks-iu5E8_sJ.js";import{cy as b}from"./render-gui-CQl1CpLc.js";import"./app-target-CiBs6_l8.js";import"./update-toast-DzeI9pz9.js";import"./index-CKySVYNd.js";import"./checkbox-k8umqIoz.js";import"./mwp-BFxu5zav.js";import"./blocks-BOqHSDlY.js";import"./project-data-CtOrB_NI.js";import"./restore-points-Ca2pZMhk.js";import"./brand-DgcPEUvn.js";import"./index-CuD79183.js";import"./recent-projects-BlSv0juS.js";import"./window-manager-vfu5o8sk.js";import"./database-BuUAGcGH.js";import"./index-RERW2iEh.js";import"./download-blob--RDv2ZSV.js";import"./palette-Cu-0Z0Si.js";import"./file-braces-CddbpslD.js";import"./triangle-alert-D4bCTktI.js";import"./circle-check-big-F1nIeMdI.js";import"./extension-bridge-CSI4ZvQ-.js";import"./data-client-PCSNwQRw.js";import"./activity-BotWmJAv.js";import"./cloud-omxZRPIy.js";import"./git-branch-C_ibJEyf.js";import"./flag-FukElkEy.js";import"./gamepad-2-_qp_tIQb.js";import"./keyboard-BHKLqK_b.js";async function u({addon:t,console:d}){let m=100;const a=t.tab.traps.vm,o=await t.tab.traps.getBlockly(),s=document.createElement("style");s.textContent=`
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
