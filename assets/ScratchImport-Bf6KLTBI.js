import{a as p,u}from"./mistwarp-logo-b6UkobUU.js";import{f as i,R as e,t as h,P as d}from"./app-target-BNwPAISg.js";/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],_=p("arrow-right",f);/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m8 11 4 4 4-4",key:"1dohi6"}],["path",{d:"M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4",key:"1ywtjm"}]],k=p("import",y),S="ScratchImport_form_pSfhT",I={form:S},j=r=>{const t=String(r).trim().match(/^(?:https?:\/\/)?(?:www\.)?scratch\.mit\.edu\/projects\/(\d+)|^(\d+)$/);return t?t[1]||t[2]:null},v=({source:r})=>{const{text:t}=u(),[o,l]=i.useState(""),[c,s]=i.useState(!1),m=a=>{a.preventDefault();const n=j(o);if(!n){s(!0);return}h("scratch_import",{source:r}),window.location.href=`/editor#${n}`};return e.createElement("form",{className:I.form,onSubmit:m},e.createElement("input",{type:"text",inputMode:"url",value:o,placeholder:t("Paste a Scratch project link"),"aria-label":t("Scratch project link or ID"),"aria-invalid":c,onChange:a=>{l(a.target.value),s(!1)}}),e.createElement("button",{type:"submit"},e.createElement(k,{size:15}),t("Open in MistWarp")),c?e.createElement("p",{role:"alert"},t("Enter a link like scratch.mit.edu/projects/123456 or a project ID.")):null)};v.propTypes={source:d.string.isRequired};export{_ as A,v as S};
