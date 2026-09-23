/* ============================================================
   Console formateur QCM SSIAP 1
   - questions : window.QCM_QUESTIONS · corrections : window.QCM_ANSWERS
   - answer = LISTE d'index (0-based) : clic sur une option = bascule bonne/pas bonne
   - éditions en localStorage, export answers.js
   - génération de liens d'accès uniques qui expirent (access.js)
   ============================================================ */
(() => {
"use strict";
const Q = window.QCM_QUESTIONS || [];
const SEED = window.QCM_ANSWERS || {};
const LS_KEY = "qcm_ssiap1_answers_edits_v1";
const LETTERS = ["1","2","3","4","5","6","7","8"];

const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const asList=v=> v==null ? [] : (Array.isArray(v)? v.slice() : [v]);

/* edits overlay */
let edits = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
function record(id){ return Object.assign({}, SEED[id]||{}, edits[id]||{}); }
function setField(id,k,v){
  edits[id] = Object.assign({}, edits[id]||{}, {[k]:v});
  localStorage.setItem(LS_KEY, JSON.stringify(edits));
  renderProgress();
}
function toggleAnswer(id,i){
  const cur = asList(record(id).answer);
  const pos = cur.indexOf(i);
  if(pos>=0) cur.splice(pos,1); else cur.push(i);
  cur.sort((a,b)=>a-b);
  setField(id,"answer",cur);
}

/* ---- questions personnalisées (ajoutées à la main) ---- */
const CUSTOM_LS = "qcm_ssiap1_custom_v1";
let localCustom = JSON.parse(localStorage.getItem(CUSTOM_LS) || "[]");
function saveCustom(){ localStorage.setItem(CUSTOM_LS, JSON.stringify(localCustom)); }
const knownIds = new Set(Q.map(q=>q.id));
const seedCustom = Object.entries(SEED)
  .filter(([id,a]) => !knownIds.has(id) && a.options && a.intitule && !a.deleted)
  .map(([id,a]) => ({id, intitule:a.intitule, options:a.options.slice(), sources:["ajout manuel"]}));
const customById = {};
seedCustom.forEach(c => customById[c.id] = c);
localCustom.forEach(c => customById[c.id] = c);
localCustom = Object.values(customById);
saveCustom();
const CUSTOM_IDS = new Set(localCustom.map(c=>c.id));
let ALL = Q.concat(localCustom);

/* ---- questions supprimées ---- */
const DELETED_LS = "qcm_ssiap1_deleted_v1";
let deletedSet = new Set(JSON.parse(localStorage.getItem(DELETED_LS) || "[]"));
Object.entries(SEED).forEach(([id,a]) => { if(a && a.deleted) deletedSet.add(id); });
function saveDeleted(){ localStorage.setItem(DELETED_LS, JSON.stringify([...deletedSet])); }

const byId = {}; ALL.forEach(q => byId[q.id] = q);

let order = [];
let pos = 0;
function rebuildOrder(){
  const trash = $("#only-deleted") && $("#only-deleted").checked;
  order = ALL.filter(q => {
    if(trash) return deletedSet.has(q.id);
    if(deletedSet.has(q.id)) return false;
    return true;
  });
  if(pos >= order.length) pos = Math.max(0, order.length-1);
}
rebuildOrder();

function isDone(id){ return asList(record(id).answer).length>0; }
function isFlagged(id){ return /à confirmer|à revérifier|revérifier/i.test(record(id).justification||""); }
function effOptions(q){ const r=record(q.id); return (r.options && r.options.length)?r.options:q.options; }
function effIntitule(q){ return record(q.id).intitule || q.intitule; }

function renderProgress(){
  const active = ALL.filter(q=>!deletedSet.has(q.id));
  const done = active.filter(q=>isDone(q.id)).length;
  const flagged = active.filter(q=>isFlagged(q.id)).length;
  const nCustom = [...CUSTOM_IDS].filter(id=>!deletedSet.has(id)).length;
  const nDel = deletedSet.size;
  $("#prog").style.width = (active.length? done/active.length*100:0)+"%";
  $("#prog-txt").textContent = `${done} / ${active.length} renseignées`
    + (nCustom ? ` · +${nCustom} ajoutée${nCustom>1?"s":""}` : "")
    + (nDel ? ` · 🗑 ${nDel} supprimée${nDel>1?"s":""}` : "")
    + (flagged ? ` · ⚠ ${flagged} à revérifier` : ` · ✓ aucune à revérifier`);
}

function current(){ return order[pos]; }

function render(){
  const q=current();
  if(!q){ $("#q-src").textContent=""; $("#q-text").textContent="(aucune question ici)";
    $("#q-options").innerHTML=""; renderProgress(); return; }
  const r=record(q.id);
  const del = deletedSet.has(q.id);
  const ans = new Set(asList(r.answer));
  const seedAns = new Set(asList((SEED[q.id]||{}).answer));
  $("#q-src").textContent = (del?"🗑 SUPPRIMÉE · ":"") + `#${pos+1}/${order.length} · id ${q.id}`
    + ` · ${ans.size} bonne${ans.size>1?"s":""} réponse${ans.size>1?"s":""}`;
  const qt=$("#q-text");
  if(qt.textContent!==effIntitule(q)) qt.textContent = effIntitule(q);
  $("#goto").value = pos+1;

  const opts=effOptions(q);
  const box=$("#q-options"); box.innerHTML="";
  opts.forEach((txt,i)=>{
    const el=document.createElement("div");
    const proposed = seedAns.has(i);
    const chosen = ans.has(i);
    el.className="admin-opt"+(chosen?" chosen":(proposed?" proposed":""));
    el.style.cursor="pointer"; el.title="Clic = (dé)cocher bonne réponse · double-clic sur le texte = corriger";
    el.onclick=()=>{
      if(el._editing) return;
      clearTimeout(el._t);
      el._t=setTimeout(()=>{ toggleAnswer(q.id,i); render(); }, 230);
    };
    const mark=document.createElement("span"); mark.className="mark";
    mark.style.cssText="flex:0 0 22px;height:22px"; mark.textContent=LETTERS[i];
    const span=document.createElement("span");
    span.style.cssText="flex:1;outline:none"; span.spellcheck=true; span.textContent=txt;
    span.ondblclick=(e)=>{
      e.stopPropagation(); clearTimeout(el._t); el._editing=true;
      span.contentEditable="true"; span.focus();
      const rg=document.createRange(); rg.selectNodeContents(span); rg.collapse(false);
      const sel=getSelection(); sel.removeAllRanges(); sel.addRange(rg);
    };
    span.onmousedown=(e)=>{ if(span.isContentEditable) e.stopPropagation(); };
    span.onclick=(e)=>{ if(span.isContentEditable) e.stopPropagation(); };
    span.onkeydown=(e)=>{ if(e.key==="Enter"){ e.preventDefault(); span.blur(); } };
    span.onblur=()=>{ span.contentEditable="false"; el._editing=false;
      const cur=effOptions(q).slice(); if(span.textContent.trim()!==cur[i]){ cur[i]=span.textContent.trim(); setField(q.id,"options",cur);} };
    el.appendChild(mark); el.appendChild(span);
    if(proposed && !chosen){ const b=document.createElement("span"); b.className="badge prop"; b.textContent="proposé"; el.appendChild(b); }
    if(chosen){ const b=document.createElement("span"); b.className="badge"; b.style.cssText="background:var(--ok-soft);color:var(--ok)"; b.textContent="✓ bonne"; el.appendChild(b); }
    box.appendChild(el);
  });

  $("#just").value = r.justification||"";
  const custom = CUSTOM_IDS.has(q.id);
  $("#btn-del").style.display = del ? "none" : "";
  $("#btn-restore").style.display = del ? "" : "none";
  $("#reset-text").style.display = (custom||del) ? "none" : "";
  renderProgress();
}

function go(delta){
  let p=pos+delta;
  if($("#only-flagged").checked){
    while(p>=0 && p<order.length && !isFlagged(order[p].id)) p+=delta;
  }
  if(p<0)p=0; if(p>=order.length)p=order.length-1;
  pos=p; render();
}
function jumpToFirstFlagged(){
  const i=order.findIndex(q=>isFlagged(q.id));
  if(i>=0){ pos=i; render(); }
}

/* ---- recherche par mots-clés ---- */
let searchHits=[], searchPtr=-1, lastQuery="";
function normSearch(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function computeHits(){
  const qy=normSearch($("#search").value.trim());
  searchHits=[];
  if(qy) order.forEach((q,i)=>{
    if(normSearch(effIntitule(q)+" "+effOptions(q).join(" ")).includes(qy)) searchHits.push(i);
  });
  return qy;
}
function searchInput(){
  const qy=computeHits(); lastQuery=qy; searchPtr=-1;
  $("#search-count").textContent = !qy ? "" : (searchHits.length ? String(searchHits.length) : "0");
}
function searchNext(){
  const qy=computeHits();
  if(qy!==lastQuery){ lastQuery=qy; searchPtr=-1; }
  if(!searchHits.length){ $("#search-count").textContent = qy?"0":""; return; }
  searchPtr=(searchPtr+1)%searchHits.length;
  pos=searchHits[searchPtr]; render();
  $("#search-count").textContent=`${searchPtr+1}/${searchHits.length}`;
}
function newQuestion(){
  const id = "c" + Date.now().toString(36);
  const q = {id, intitule:"", options:["","","","","Aucune des réponses précédentes"], sources:["ajout manuel"]};
  localCustom.push(q); saveCustom(); CUSTOM_IDS.add(id);
  ALL.push(q); byId[id]=q;
  if($("#only-flagged").checked) $("#only-flagged").checked = false;
  if($("#only-deleted").checked) $("#only-deleted").checked = false;
  rebuildOrder(); pos = order.indexOf(q);
  render();
  $("#q-text").focus();
}
function deleteCurrent(){ const q=current(); if(!q) return; deletedSet.add(q.id); saveDeleted(); rebuildOrder(); render(); }
function restoreCurrent(){ const q=current(); if(!q) return; deletedSet.delete(q.id); saveDeleted(); rebuildOrder(); render(); }

/* export answers.js */
function exportAnswers(){
  const out={};
  ALL.forEach(q=>{
    const custom = CUSTOM_IDS.has(q.id);
    if(deletedSet.has(q.id)){ if(!custom) out[q.id]={deleted:true}; return; }
    const r=record(q.id);
    const e=edits[q.id]||{};
    const ans=asList(r.answer);
    if(!custom && ans.length===0 && !r.justification && !e.intitule && !e.options) return;
    out[q.id]={};
    if(ans.length) out[q.id].answer=ans;
    if(r.justification) out[q.id].justification=r.justification;
    if(custom){ out[q.id].intitule = effIntitule(q); out[q.id].options = effOptions(q); }
    else { if(e.intitule) out[q.id].intitule=e.intitule; if(e.options) out[q.id].options=e.options; }
  });
  const head = "// Clé de correction QCM SSIAP 1 — answer = LISTE d'index 0-based.\n"
             + "// Exporté depuis la console formateur le "+new Date().toLocaleString('fr-FR')+".\n";
  const blob=new Blob([head+"window.QCM_ANSWERS = "+JSON.stringify(out,null,1)+";\n"],{type:"text/javascript"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="answers.js"; a.click();
  URL.revokeObjectURL(a.href);
}

let _reloadArmed=false, _reloadTimer=null;
function reloadFromFile(){
  const btn=$("#btn-reload");
  if(!_reloadArmed){
    _reloadArmed=true; btn.dataset.label = btn.textContent;
    btn.textContent = "⚠ Confirmer — efface le cache local"; btn.style.color = "var(--ko)";
    _reloadTimer = setTimeout(()=>{ _reloadArmed=false; btn.textContent=btn.dataset.label; btn.style.color=""; }, 6000);
    return;
  }
  clearTimeout(_reloadTimer); _reloadArmed=false;
  localStorage.removeItem(LS_KEY); localStorage.removeItem(DELETED_LS); localStorage.removeItem(CUSTOM_LS);
  location.reload();
}

function renderAccessCodes(){
  const lib=window.QCU_ACCESS_LIB, cfg=window.QCU_ACCESS||{};
  if(!lib || !cfg.enabled || !(window.crypto&&crypto.subtle)){
    // accès désactivé : on l'indique clairement
    const box=$("#access-codes"); if(box){ box.style.display="block";
      box.innerHTML='<b style="color:var(--accent)">🔑 Accès apprenants</b> '
        +'<span style="color:var(--ink-soft)">— désactivé (accès libre). Pour exiger un lien, mets '
        +'<code>enabled:true</code> dans <code>access-config.js</code>.</span>'; }
    return;
  }
  const days = cfg.linkDays || 26;
  $("#access-days").textContent = days;
  $("#access-codes").style.display="block";
  $("#gen-access").onclick = async () => {
    const r = await lib.generateLink(days);
    $("#access-link").value = r.link;
    $("#access-exp").textContent = "valable jusqu'au " + lib.dayToDate(r.expiryDay-1).toLocaleDateString('fr-FR');
    $("#access-out").style.display = "block";
    $("#copied-link").style.display = "none";
    $("#access-link").focus(); $("#access-link").select();
  };
  $("#copy-link").onclick = () => {
    const i=$("#access-link"); i.select();
    navigator.clipboard.writeText(i.value).then(()=>{ $("#copied-link").style.display="inline"; });
  };
}
function init(){
  renderAccessCodes();
  $("#prev").onclick=()=>go(-1);
  $("#next").onclick=()=>go(1);
  $("#goto").onchange=e=>{ let v=parseInt(e.target.value,10); if(v>=1&&v<=order.length){pos=v-1;render();} };
  $("#just").oninput=e=>setField(current().id,"justification",e.target.value);
  $("#q-text").onblur=()=>{ const q=current(); const v=$("#q-text").textContent.trim();
    if(v && v!==q.intitule) setField(q.id,"intitule",v); };
  $("#reset-text").onclick=()=>{ const q=current();
    const e=edits[q.id]||{}; delete e.intitule; delete e.options; edits[q.id]=e;
    localStorage.setItem(LS_KEY,JSON.stringify(edits)); render(); };
  $("#btn-export").onclick=exportAnswers;
  $("#btn-reload").onclick=reloadFromFile;
  $("#btn-new").onclick=newQuestion;
  $("#btn-del").onclick=deleteCurrent;
  $("#btn-restore").onclick=restoreCurrent;
  const otherFilters=(keep)=>["only-flagged","only-deleted"].forEach(k=>{ if(k!==keep) { const c=$("#"+k); if(c) c.checked=false; } });
  $("#only-flagged").onchange=e=>{ if(e.target.checked) otherFilters("only-flagged");
    rebuildOrder(); if(e.target.checked) jumpToFirstFlagged(); else render(); };
  $("#only-deleted").onchange=e=>{ if(e.target.checked) otherFilters("only-deleted");
    rebuildOrder(); pos=0; render(); };
  $("#search").oninput=searchInput;
  $("#search").onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); searchNext(); } };

  document.addEventListener("keydown",e=>{
    if(e.target.tagName==="TEXTAREA"||e.target.tagName==="INPUT"||e.target.isContentEditable){
      if(e.key==="Enter"&&e.target.id==="just"){e.preventDefault();$("#just").blur();}
      return;
    }
    const k=e.key.toUpperCase();
    if(LETTERS.includes(k)){ const i=LETTERS.indexOf(k); if(i<effOptions(current()).length){toggleAnswer(current().id,i);render();} }
    else if(e.key==="ArrowLeft")go(-1);
    else if(e.key==="ArrowRight")go(1);
  });

  render();
  console.log(`Console QCM SSIAP 1 — ${Q.length} questions.`);
}

/* ---- verrou mot de passe (SHA-256, côté navigateur) ---- */
async function _sha256(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function bootGate(){
  const hash = window.QCU_ADMIN_HASH || "";
  const authed = sessionStorage.getItem('qcm_ssiap1_admin_ok') === '1';
  if(!hash || authed || !(window.crypto && crypto.subtle)){ init(); return; }
  const gate = $("#gate"); gate.style.display = 'flex'; $("#gate-pass").focus();
  $("#gate-form").onsubmit = async (e) => {
    e.preventDefault();
    const h = await _sha256($("#gate-pass").value);
    if(h === hash){ sessionStorage.setItem('qcm_ssiap1_admin_ok','1'); gate.style.display='none'; init(); }
    else { $("#gate-err").style.display='block'; $("#gate-pass").value=''; $("#gate-pass").focus(); }
  };
}
document.addEventListener("DOMContentLoaded", bootGate);
})();
