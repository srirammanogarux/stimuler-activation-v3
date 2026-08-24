/* ============================================================
   Activation v3 · step 2 — the funnel.
   language → name → goal → situation → scenario → level → win.
   Only built options are shown. Ends before the story, which is
   the next approved step.
   ============================================================ */
'use strict';

const $  = id => document.getElementById(id);
const el = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const SARAH = 'assets/sarah-avatar.png';
const chatStream = $('chatStream');
const chatScroll = $('chatScroll');

/* the answers */
const A = { lang:null, name:null, goal:null, situation:null, room:null, level:null, win:null };

/* ---------- primitives (unchanged from the approved shell) ---------- */
function scrollToEnd(){
  requestAnimationFrame(() => chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' }));
}
function dimLast(){
  const last = chatStream.querySelector('.msg:last-of-type');
  if (last) last.classList.add('dim');
}
async function sarah(text, typingMs = 680){
  dimLast();
  const row = el(`<div class="msg"><div class="dp"><img src="${SARAH}" alt="Sarah"></div>
                  <div class="bubble typing"><i></i><i></i><i></i></div></div>`);
  chatStream.appendChild(row); scrollToEnd();
  await wait(typingMs);
  const b = row.querySelector('.bubble');
  b.classList.remove('typing'); b.innerHTML = `<p>${text}</p>`;
  scrollToEnd();
  await wait(Math.max(900, text.split(' ').length * 118));
}
function userChip(label){
  chatStream.appendChild(el(`<div class="chip-row"><div class="chip">${label}</div></div>`));
  scrollToEnd();
}
function options(items){
  return new Promise(resolve => {
    const wrap = el(`<div class="options"><p class="opt-head">Select an option</p><div class="opt-list"></div></div>`);
    const list = wrap.querySelector('.opt-list');
    items.forEach(it => {
      const btn = el(it.desc
        ? `<button class="opt stacked"><span class="opt-top"><span class="opt-label">${it.label}</span></span><span class="opt-desc">${it.desc}</span></button>`
        : `<button class="opt"><span class="opt-label">${it.label}</span></button>`);
      btn.addEventListener('click', () => {
        btn.classList.add('selected');
        setTimeout(() => { wrap.remove(); userChip(it.label); resolve(it.v ?? it.label); }, 180);
      });
      list.appendChild(btn);
    });
    chatStream.appendChild(wrap); scrollToEnd();
  });
}
function nameInput(){
  return new Promise(resolve => {
    const wrap = el(`<div class="input-block">
      <div class="phone-field-wrap"><input type="text" placeholder="Your name" maxlength="24" aria-label="Your name"></div>
      <button class="btn-continue">Continue</button></div>`);
    const input = wrap.querySelector('input'), btn = wrap.querySelector('.btn-continue');
    input.addEventListener('input', () => btn.classList.toggle('ready', input.value.trim().length > 1));
    const go = () => {
      const v = input.value.trim(); if (v.length < 2) return;
      wrap.remove(); userChip(v); resolve(v);
    };
    btn.addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    chatStream.appendChild(wrap); scrollToEnd();
    setTimeout(() => input.focus(), 150);
  });
}
function setProgress(pct, label){
  $('progressFill').style.width = pct + '%';
  if (label) $('progressLabel').textContent = label;
}

/* ============================================================
   THE FUNNEL
   ============================================================ */
async function flow(){
  setProgress(0, 'Let’s get started');
  await wait(500);

  /* intro */
  await sarah('Hey! I’m Sarah. I’m here to help you speak English with confidence — in the moments that actually matter to you.');

  /* 1 · native language */
  setProgress(10, '10% completed');
  await sarah('First — what’s your native language?');
  A.lang = await options([{ v:'es', label:'Spanish' }]);

  /* 2 · name */
  setProgress(22, '22% completed');
  await sarah('And what should I call you?');
  A.name = await nameInput();

  /* 3 · goal */
  setProgress(36, 'Your goal');
  await sarah(`Good to meet you, ${A.name}. What are you learning English for?`);
  A.goal = await options([{ v:'career', label:'Grow in my career' }]);

  /* 4 · situation */
  setProgress(50, '50% completed');
  await sarah('And what’s your situation right now?');
  A.situation = await options([{ v:'office', label:'Working a job' }]);

  /* 5 · scenario */
  setProgress(64, 'Almost there');
  await sarah('Work, then. Where do you want to win first?');
  A.room = await options([
    { v:'manager',  label:'Talking to my manager' },
    { v:'meetings', label:'Speaking up in meetings' },
    { v:'present',  label:'Presenting my work' },
  ]);

  /* 6 · level */
  setProgress(78, '78% completed');
  await sarah('How would you describe your English right now?');
  A.level = await options([
    { v:'beginner',     label:'Beginner',     desc:'I know some words, but I can’t make sentences.' },
    { v:'intermediate', label:'Intermediate', desc:'I can make short sentences about simple things.' },
    { v:'advanced',     label:'Advanced',     desc:'I can hold a short conversation and understand others.' },
  ]);

  /* 7 · the win */
  setProgress(90, 'One last thing');
  await sarah('Last one. In that moment — what’s the one thing you want to get right?');
  A.win = await options([
    { v:'start',   label:'Start without freezing up' },
    { v:'sustain', label:'Say more than one nervous line' },
    { v:'land',    label:'Get to the point quickly' },
    { v:'clear',   label:'Be understood the first time' },
  ]);

  /* the story */
  setProgress(100, 'Your first scenario');
  await sarah(`Perfect, ${A.name}. Let’s make it real —`);
  await window.playStory(A.room, A.win);

  /* end of this build step */
  document.getElementById('storyScreen').classList.add('is-hidden');
  document.getElementById('chatScreen').classList.remove('is-hidden');
  await sarah('<b>[ Next build step: the moment — the judge’s line and the mic. Not built yet. ]</b>');
}

flow();
