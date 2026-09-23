/* ============================================================
   QCM SSIAP 1 — moteur d'entraînement (vanilla JS, sans dépendance)
   Données : window.QCM_QUESTIONS (corpus) + window.QCM_ANSWERS (corrections)
   answer = LISTE d'indices 0-based (une OU plusieurs bonnes réponses).
   ============================================================ */
(() => {
"use strict";

const QUESTIONS = window.QCM_QUESTIONS || [];
const ANSWERS   = window.QCM_ANSWERS   || {};
const QUESTION_TIME = 60;               // secondes par question
const EXAM_COUNT = 30;                  // examen blanc SSIAP 1

/* ---- fusionne corpus + corrections ---- */
function enrich(q){
  const a = ANSWERS[q.id] || {};
  let ans = (a.answer !== undefined ? a.answer : null);
  if(ans!=null && !Array.isArray(ans)) ans=[ans];   // tolère un entier isolé
  return {
    ...q,
    intitule: (a.intitule ?? q.intitule),
    options: (a.options ?? q.options),
    answer: ans,                                     // tableau d'index 0-based, ou null
    justification: (a.justification ?? ""),
  };
}
const isDeleted = id => ANSWERS[id] && ANSWERS[id].deleted;
const POOL = QUESTIONS.filter(q => !isDeleted(q.id)).map(enrich);
const READY = POOL.filter(q => Array.isArray(q.answer) && q.answer.length>0);

/* ---- état de session ---- */
const cfg = { len:10, format:"revision" };
let quiz = null;

/* ---- utilitaires ---- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const LETTERS = ["1","2","3","4","5","6","7","8"];
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function show(id){ ["screen-home","screen-quiz","screen-results"].forEach(s=>$("#"+s).classList.toggle("hidden", s!==id)); window.scrollTo(0,0); }
function sameSet(a,b){ if(a.length!==b.length) return false; const s=new Set(a); return b.every(x=>s.has(x)); }

/* ============================================================
   ÉCRAN ACCUEIL
   ============================================================ */
function updatePoolHint(){
  const warn = READY.length===0
    ? " ⚠︎ Corrections non chargées : mode aperçu."
    : "";
  let avail;
  if(cfg.format==="examen"){
    avail = Math.min(EXAM_COUNT, POOL.length);
    $("#pool-hint").textContent =
      `Examen : ${avail} questions tirées parmi ${POOL.length} disponibles.`+warn;
  }else{
    avail = POOL.length;
    $("#pool-hint").textContent =
      `${avail} question${avail>1?"s":""} disponible${avail>1?"s":""} dans la banque.`+warn;
  }
  $("#btn-generate").disabled = avail===0;
}

/* segmented controls */
function bindSeg(sel, key, cast){
  $$(sel+" button").forEach(b=>{
    b.onclick=()=>{ $$(sel+" button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
      cfg[key]=cast(b.dataset[key]); updatePoolHint(); };
  });
}

/* ============================================================
   QUIZ
   ============================================================ */
function startQuiz(){
  let selected;
  if(cfg.format==="examen"){
    selected = shuffle(POOL).slice(0, Math.min(EXAM_COUNT, POOL.length));
  }else{
    const n = cfg.len==="max" ? POOL.length : Math.min(parseInt(cfg.len,10), POOL.length);
    selected = shuffle(POOL).slice(0, n);
  }
  const items = selected.map(q=>{
    // mélange l'ordre des propositions, en gardant la trace des bonnes réponses
    const order = shuffle(q.options.map((_,i)=>i));
    const correctSet = (q.answer==null) ? null
      : q.answer.map(a=>order.indexOf(a)).filter(x=>x>=0).sort((x,y)=>x-y);
    return { ref:q, opts: order.map(i=>q.options[i]), correctSet };
  });
  quiz = { items, idx:0, answers:new Array(items.length).fill(null), timer:null, remaining:QUESTION_TIME };
  show("screen-quiz");
  $("#q-tot").textContent = items.length;
  renderQuestion();
}

function renderQuestion(){
  const it = quiz.items[quiz.idx];
  quiz.selected = new Set();
  $("#q-cur").textContent = quiz.idx+1;
  $("#progress-fill").style.width = ((quiz.idx)/quiz.items.length*100)+"%";
  const multi = it.correctSet && it.correctSet.length>1;
  const tag=$("#q-multi");
  tag.textContent = multi ? "Plusieurs réponses" : "Réponse(s) à cocher";
  $("#q-text").textContent = it.ref.intitule;
  $("#q-explain").classList.add("hidden");

  const box = $("#q-options"); box.innerHTML="";
  it.opts.forEach((txt,pos)=>{
    const b=document.createElement("button");
    b.className="opt"; b.type="button";
    b.innerHTML = `<span class="mark">${LETTERS[pos]}</span><span>${escapeHtml(txt)}</span>`;
    b.onclick=()=>toggleOption(pos);
    box.appendChild(b);
  });
  const next=$("#btn-next");
  next.classList.remove("hidden");
  next.textContent="Valider"; next.disabled=true; next.onclick=()=>validateAnswer();
  quiz.advancing=false;
  startTimer();
}

function toggleOption(pos){
  if(quiz.locked) return;
  if(quiz.selected.has(pos)) quiz.selected.delete(pos); else quiz.selected.add(pos);
  $$("#q-options .opt").forEach((el,i)=>el.classList.toggle("sel", quiz.selected.has(i)));
  $("#btn-next").disabled = quiz.selected.size===0;
}

function startTimer(){
  clearInterval(quiz.timer);
  quiz.remaining=QUESTION_TIME; quiz.locked=false;
  paintTimer();
  quiz.timer=setInterval(()=>{
    quiz.remaining--; paintTimer();
    if(quiz.remaining<=0){ clearInterval(quiz.timer); validateAnswer(true); }
  },1000);
}
function paintTimer(){
  const C=2*Math.PI*19;
  const frac=Math.max(0,quiz.remaining)/QUESTION_TIME;
  const bar=$("#ring-bar");
  bar.style.strokeDasharray=C; bar.style.strokeDashoffset=C*(1-frac);
  $("#timer-num").textContent=Math.max(0,quiz.remaining);
  $("#timer").classList.toggle("low", quiz.remaining<=10);
}

function validateAnswer(timeout=false){
  if(quiz.locked) return;
  quiz.locked=true; clearInterval(quiz.timer);
  const it=quiz.items[quiz.idx];
  const chosen = Array.from(quiz.selected).sort((a,b)=>a-b);
  quiz.answers[quiz.idx]=chosen;

  const opts=$$("#q-options .opt");
  const hasKey = it.correctSet!=null;
  const correct = new Set(it.correctSet||[]);
  const picked = new Set(chosen);
  opts.forEach((el,i)=>{
    el.disabled=true;
    el.classList.remove("sel");
    if(!hasKey){ if(picked.has(i)) el.classList.add("sel"); return; }
    if(correct.has(i)) el.classList.add("correct");            // toutes les bonnes en vert
    if(picked.has(i) && !correct.has(i)) el.classList.add("wrong"); // coché à tort en rouge
  });

  // correction affichée
  const ex=$("#q-explain"); ex.classList.remove("hidden");
  const goodLetters = hasKey ? it.correctSet.map(p=>LETTERS[p]).join(", ") : "?";
  const ok = hasKey && sameSet(chosen, it.correctSet);
  let msg = `<b>Bonne(s) réponse(s) : ${goodLetters}.</b>`;
  if(hasKey) msg += ok ? ' <span style="color:var(--ok)">✓ Réponse exacte.</span>'
                       : ' <span style="color:var(--ko)">✗ Sélection incomplète ou erronée.</span>';
  if(it.ref.justification) msg += " " + escapeHtml(it.ref.justification);
  ex.innerHTML = msg;

  $("#progress-fill").style.width=((quiz.idx+1)/quiz.items.length*100)+"%";
  const next=$("#btn-next");
  next.disabled=false;
  next.textContent = quiz.idx+1<quiz.items.length ? "Question suivante" : "Voir les résultats";
  next.onclick = advance;
}

function advance(){
  if(quiz.advancing) return; quiz.advancing=true;
  if(quiz.idx+1<quiz.items.length){ quiz.idx++; renderQuestion(); }
  else finishQuiz();
}

/* ============================================================
   RÉSULTATS
   ============================================================ */
function finishQuiz(){
  show("screen-results");
  let good=0, scored=0;
  quiz.items.forEach((it,i)=>{
    if(it.correctSet==null) return;
    scored++;
    if(sameSet(quiz.answers[i]||[], it.correctSet)) good++;
  });
  $("#score-big").textContent = `${good}/${scored||quiz.items.length}`;
  const pct = scored? Math.round(good/scored*100):0;
  $("#score-sub").textContent = scored
    ? `${pct}% de réponses exactes.` + (pct>=70?" Bravo, niveau examen atteint.":" Continue à réviser.")
    : "Corrections non disponibles pour ce lot.";

  const list=$("#review-list"); list.innerHTML="";
  quiz.items.forEach((it,i)=>{
    const card=document.createElement("div"); card.className="rev-item";
    const chosen=new Set(quiz.answers[i]||[]);
    const correct=new Set(it.correctSet||[]);
    const exact = it.correctSet!=null && sameSet(quiz.answers[i]||[], it.correctSet);
    let html=`<div class="rev-q">${i+1}. ${escapeHtml(it.ref.intitule)}`+
             (it.correctSet!=null ? (exact?' <span style="color:var(--ok)">✓</span>':' <span style="color:var(--ko)">✗</span>'):'')+`</div>`;
    it.opts.forEach((txt,pos)=>{
      let cls="rev-line", tag="";
      if(correct.has(pos)){ cls+=" ok"; tag=" ✓ bonne réponse"; }
      if(chosen.has(pos) && !correct.has(pos)){ cls+=" ko"; tag=" ✗ ta réponse"; }
      else if(chosen.has(pos) && correct.has(pos)){ tag=" ✓ (cochée)"; }
      html+=`<div class="${cls}">${LETTERS[pos]}. ${escapeHtml(txt)}${tag}</div>`;
    });
    if(!(quiz.answers[i]||[]).length) html+=`<div class="rev-line ko">✗ Aucune réponse (temps écoulé)</div>`;
    if(it.ref.justification) html+=`<div class="explain" style="margin-top:10px">${escapeHtml(it.ref.justification)}</div>`;
    card.innerHTML=html; list.appendChild(card);
  });
  buildPrintBlock(good,scored);
}

function buildPrintBlock(good,scored){
  const blk=$("#print-block");
  let html=`<h2 style="margin-bottom:4px">QCM SSIAP 1 — corrigé</h2>
    <div style="color:#5b6470;margin-bottom:14px">${new Date().toLocaleDateString("fr-FR")} · ${quiz.items.length} questions · score ${good}/${scored||quiz.items.length}</div>`;
  quiz.items.forEach((it,i)=>{
    const chosen=new Set(quiz.answers[i]||[]);
    const correct=new Set(it.correctSet||[]);
    html+=`<div class="print-q"><h3>${i+1}. ${escapeHtml(it.ref.intitule)}</h3>`;
    it.opts.forEach((txt,pos)=>{
      let cls="print-opt";
      if(correct.has(pos)) cls+=" correct";
      if(chosen.has(pos) && !correct.has(pos)) cls+=" wrong";
      html+=`<div class="${cls}">${LETTERS[pos]}. ${escapeHtml(txt)}</div>`;
    });
    if(it.ref.justification) html+=`<div style="font-size:12px;color:#333;margin-top:4px"><i>${escapeHtml(it.ref.justification)}</i></div>`;
    html+=`</div>`;
  });
  blk.innerHTML=html;
}

/* ============================================================
   OUTILS
   ============================================================ */
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* ============================================================
   INIT
   ============================================================ */
function applyFormatUI(){
  const exam = cfg.format==="examen";
  $("#len-field").classList.toggle("hidden", exam);
  $("#exam-intro").classList.toggle("hidden", !exam);
  $("#fmt-hint").classList.toggle("hidden", exam);
  $("#btn-generate").textContent = exam ? "Commencer l'examen" : "Générer le QCM";
  updatePoolHint();
}
function init(){
  bindSeg("#len-seg","len",v=>v);
  $$("#fmt-seg button").forEach(b=>{
    b.onclick=()=>{ $$("#fmt-seg button").forEach(x=>x.classList.remove("on")); b.classList.add("on");
      cfg.format=b.dataset.fmt; applyFormatUI(); };
  });
  applyFormatUI();
  $("#btn-generate").onclick=startQuiz;
  $("#btn-restart").onclick=()=>{ show("screen-home"); };
  $("#btn-print").onclick=()=>window.print();
  $("#nav-home").onclick=e=>{ e.preventDefault();
    if(quiz){ clearInterval(quiz.timer); }
    cfg.format="revision"; $$("#fmt-seg button").forEach(x=>x.classList.toggle("on",x.dataset.fmt==="revision"));
    applyFormatUI(); show("screen-home"); };
  console.log(`QCM SSIAP 1 — ${QUESTIONS.length} questions, ${READY.length} avec correction.`);
}

/* ---- accès apprenants par lien signé (voir access.js) ---- */
async function accessCheck(){
  const acfg = window.QCU_ACCESS || {};
  if(!acfg.enabled) return true;
  const lib = window.QCU_ACCESS_LIB;
  if(!lib || !(window.crypto && crypto.subtle)) return true;
  const urlTok = new URLSearchParams(location.search).get("acces");
  return !!(urlTok && await lib.verifyToken(urlTok));
}
async function bootAccess(){
  if(await accessCheck()){ init(); return; }
  $("#gate").style.display = "flex";
}
document.addEventListener("DOMContentLoaded", bootAccess);
})();
