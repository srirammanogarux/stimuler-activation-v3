/* ============================================================
   Activation v3 · step 2 — the funnel.
   language → name → goal → situation → scenario → level → win.
   Only built options are shown. Ends before the story, which is
   the next approved step.
   ============================================================ */
'use strict';

const $  = id => document.getElementById(id);
const el = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const wait = ms => new Promise(r => setTimeout(r, FF ? 0 : ms));

const SARAH = 'assets/sarah-avatar.png';
const chatStream = $('chatStream');
const chatScroll = $('chatScroll');

/* the answers */
const A = { lang:null, name:null, goal:null, situation:null, room:null, level:null, mode:null, path:null };

/* ---------- review-panel state: chips write the URL, the URL drives ---------- */
const Q = new URLSearchParams(location.search);
const DBG = { room:Q.get('room'), lvl:Q.get('lvl'), mode:Q.get('mode'), step:Q.get('step') };
const STEPS = ['intro','language','name','goal','situation','rooms','level','choice','story','moment','score'];
const hasParams = !!(DBG.room || DBG.lvl || DBG.mode || DBG.step);
const target = DBG.step && STEPS.includes(DBG.step) ? DBG.step : (hasParams ? 'story' : null);
let FF = !!target;
const reach = name => { if (FF && STEPS.indexOf(name) >= STEPS.indexOf(target)) FF = false; };
const past  = name => !!target && STEPS.indexOf(target) > STEPS.indexOf(name);

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
  if (FF){
    chatStream.appendChild(el(`<div class="msg dim"><div class="dp"><img src="${SARAH}" alt="Sarah"></div><div class="bubble"><p>${text}</p></div></div>`));
    scrollToEnd(); return;
  }
  const row = el(`<div class="msg"><div class="dp"><img src="${SARAH}" alt="Sarah"></div>
                  <div class="bubble typing"><i></i><i></i><i></i></div></div>`);
  chatStream.appendChild(row); scrollToEnd();
  await wait(typingMs);
  const b = row.querySelector('.bubble');
  b.classList.remove('typing'); b.innerHTML = `<p>${text}</p>`;
  row.classList.add('speaking');
  scrollToEnd();
  await wait(Math.max(900, text.split(' ').length * 118));
  row.classList.remove('speaking');
}
function userChip(label){
  chatStream.appendChild(el(`<div class="chip-row"><div class="chip">${label}</div></div>`));
  scrollToEnd();
}
function options(items, forced = null){
  if (FF){
    const it = items.find(x => (x.v ?? x.label) === forced) || items[0];
    userChip(it.label);
    return Promise.resolve(it.v ?? it.label);
  }
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
  if (FF){ userChip('Ana'); return Promise.resolve('Ana'); }
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
  reach('intro');
  setProgress(0, 'Let’s get started');
  await wait(500);

  /* intro */
  await sarah('Hey! I’m Sarah. I’m here to help you speak English with confidence, in the moments that actually matter to you.');

  /* 1 · native language */
  reach('language');
  setProgress(10, '10% completed');
  await sarah('First, what’s your native language?');
  A.lang = await options([
    { v:'es', label:'Spanish' },
    { v:'pt', label:'Portuguese' },
    { v:'id', label:'Indonesian' },
    { v:'hi', label:'Hindi' },
    { v:'fr', label:'French' },
    { v:'ar', label:'Arabic' },
  ], 'es');

  /* 2 · name */
  reach('name');
  setProgress(22, '22% completed');
  await sarah('And what should I call you?');
  A.name = await nameInput();

  /* 3 · goal */
  reach('goal');
  setProgress(36, 'Your goal');
  await sarah(`Good to meet you, ${A.name}. What are you learning English for?`);
  A.goal = await options([
    { v:'exam',     label:'Prepare for an English exam' },
    { v:'career',   label:'Grow in my career' },
    { v:'personal', label:'Personal growth' },
    { v:'school',   label:'Excel at my school' },
    { v:'travel',   label:'Travel confidently' },
  ], 'career');

  /* 4 · situation */
  reach('situation');
  setProgress(50, '50% completed');
  await sarah('And what’s your situation right now?');
  A.situation = await options([
    { v:'student',    label:'Studying' },
    { v:'office',     label:'Working a job' },
    { v:'freelancer', label:'Freelancing' },
    { v:'business',   label:'Running my own business' },
    { v:'home',       label:'At home with family' },
    { v:'break',      label:'On a career break' },
    { v:'jobseek',    label:'Looking for work' },
  ], 'office');

  /* only career + working-a-job is built end to end */
  if (!(A.goal === 'career' && A.situation === 'office')){
    await sarah('That path isn’t built in this prototype yet. The working flow is <b>Grow in my career</b> + <b>Working a job</b>.');
    chatStream.appendChild(el('<div class="options"><button class="opt" onclick="location.reload()"><span class="opt-label">↺ Start again</span></button></div>'));
    scrollToEnd();
    return;
  }

  /* 5 · scenario */
  reach('rooms');
  setProgress(66, 'Almost there');
  await sarah('Work, then. Which of these do you want to handle with ease first?');
  const ROOM_OPTS = [
    { v:'manager',  label:'Talking to my manager',      built:true },
    { v:'meetings', label:'Speaking up in meetings',    built:true },
    { v:'present',  label:'Presenting my work',         built:true },
    { v:'client',   label:'Handling client calls',      built:false },
    { v:'smalltalk',label:'Small talk with colleagues', built:false },
  ];
  A.room = await options(ROOM_OPTS, DBG.room || 'manager');
  while (!ROOM_OPTS.find(r => r.v === A.room).built){
    await sarah('That one’s coming soon. Pick another for now.');
    A.room = await options(ROOM_OPTS, DBG.room || 'manager');
  }

  /* 6 · level */
  reach('level');
  setProgress(84, '84% completed');
  await sarah('How would you describe your English right now?');
  A.level = await options([
    { v:'beginner',     label:'Beginner',     desc:'I know some words, but I can’t make sentences.' },
    { v:'intermediate', label:'Intermediate', desc:'I can make short sentences about simple things.' },
    { v:'advanced',     label:'Advanced',     desc:'I can hold a short conversation and understand others.' },
  ], DBG.lvl || 'beginner');

  /* meet the character, and choose how to play it */
  const mo = window.momentData(A.room);
  reach('choice');
  setProgress(92, 'Almost ready');
  await sarah(`Perfect, ${A.name}.`);
  await sarah('Now we practise it live. As a first step, I want you to handle the very first situation you said you wanted to win.');
  await sarah('You’re about to meet someone.');
  await wait(400);
  chatStream.appendChild(el(`<div class="meet-card">
    <img src="assets/manager.png" alt="">
    <div><p class="meet-n">${mo.role}</p><p class="meet-r">${mo.eyebrow} · ${mo.where}</p></div>
  </div>`));
  scrollToEnd();
  await wait(1100);
  await sarah('Before you walk in: do you want me to teach you how to handle him, or will you try it yourself?');
  const LEARN = { v:'learn', label:'Teach me how to handle it',
                  desc:'Learn it in 4 steps, then say it.' };
  const TRY   = { v:'try',   label:'I’ll try it myself',
                  desc:'Answer your way. A hint is there if you want it.' };
  A.mode = await options(A.level === 'beginner' ? [LEARN, TRY] : [TRY, LEARN], DBG.mode || (A.level === 'beginner' ? 'learn' : 'try'));

  /* the story */
  setProgress(100, 'Your first scenario');
  await sarah('Here’s the situation you’re walking into.');
  reach('story');
  if (past('story')){ /* jumped beyond the story */ }
  else await window.playStory(A.room);

  /* the moment: the USA practice screen */
  reach('moment');
  let result;
  if (past('moment')){
    result = { path: A.mode === 'learn' ? 'read' : 'speak' };
  } else {
    result = await momentScreen(mo, A.mode);
  }
  A.path = result.path;

  /* results → loader → plan → promise → paywall */
  reach('score');
  await window.playResults({
    room: A.room, path: A.path, frame: mo.frame, name: A.name,
  });
}

/* ============================================================
   THE MOMENT — question up top, mic + hint bulb below.
   learn mode goes straight to the teach screens.
   ============================================================ */
function momentScreen(mo, mode){
  return new Promise(async resolve => {
    if (mode === 'learn'){
      await learnScreens(mo);
      resolve({ path:'read' }); return;
    }
    $('mmQ').textContent = mo.q;
    ['chatScreen','storyScreen'].forEach(id => $(id).classList.add('is-hidden'));
    $('momentScreen').classList.remove('is-hidden');

    const orb = $('mmOrb'), w = $('mmWave');
    w.innerHTML = '';
    for (let i = 0; i < 20; i++) w.appendChild(document.createElement('span'));
    orb.classList.remove('live');
    $('mmTip').textContent = 'Tap to speak';
    $('mmTip').classList.remove('hidden');
    $('mmTimer').classList.remove('on');
    $('mmBulb').classList.remove('gone');
    $('mmEscape').classList.remove('gone');
    let wt = null, tt = null;

    const leave = async path => {
      clearInterval(wt); clearInterval(tt);
      orb.onclick = null;
      $('momentScreen').classList.add('is-hidden');
      resolve({ path });
    };

    /* hint or escape: the teach screens take over, then the read */
    const toLearn = async ({ skipTeach = false } = {}) => {
      clearInterval(wt); clearInterval(tt);
      orb.onclick = null;
      $('momentScreen').classList.add('is-hidden');
      await learnScreens(mo, { skipTeach });
      resolve({ path:'read' });
    };
    $('mmBulb').onclick = () => toLearn();
    $('mmEscape').onclick = () => toLearn();

    orb.onclick = () => {
      if (orb.classList.contains('live')) return;
      orb.classList.add('live');
      $('mmTip').classList.add('hidden');
      $('mmBulb').classList.add('gone');
      $('mmEscape').classList.add('gone');
      $('mmTimer').classList.add('on');
      const bars = [...w.children];
      wt = setInterval(() => bars.forEach(b => b.style.height = (16 + Math.random() * 66) + '%'), 100);
      const t0 = Date.now();
      tt = setInterval(() => $('mmTimer').textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's', 100);
      $('mmOk').onclick = e => { e.stopPropagation(); leave('speak'); };
      $('mmX').onclick = e => {
        e.stopPropagation();
        clearInterval(wt); clearInterval(tt);
        orb.classList.remove('live');
        $('mmTimer').classList.remove('on');
        $('mmTip').classList.remove('hidden');
        $('mmBulb').classList.remove('gone');
        $('mmEscape').classList.remove('gone');
      };
    };
  });
}

/* ============================================================
   THE MOMENT, IN CHAT
   ============================================================ */


/* the learn screens: teach (4 steps, Next through them), then read.
   skipTeach jumps straight to the read phase (hints already taught). */
function learnScreens(mo, { skipTeach = false } = {}){
  return new Promise(resolve => {
    const card = $('lsCard');
    const segs = mo.frame;
    const text = segs.map(f => f.t).join(' ');
    let i = 0;

    $('chatScreen').classList.add('is-hidden');
    $('learnScreen').classList.remove('is-hidden');

    function paintTeach(){
      $('lsEyebrow').textContent = 'How to answer';
      $('lsTitle').textContent = 'A simple 4-part answer.';
      $('lsProgFill').style.width = ((i + 1) / segs.length * 50) + '%';
      card.classList.remove('readmode');
      card.innerHTML = segs.map((f, k) =>
        `<div class="seg ${k === i ? 'cur' : ''} ${k > i ? 'dim' : ''}">
           <span class="st">${f.s}</span><p>${f.t}</p></div>`).join('');
      $('lsCta').textContent = 'Continue';
      $('lsCta').classList.remove('is-hidden');
      $('lsMicRow').classList.add('is-hidden');
    }

    function paintRead(){
      $('lsEyebrow').textContent = 'Try reading this';
      $('lsTitle').textContent = '“' + mo.q + '”';
      $('lsProgFill').style.width = '65%';
      card.classList.add('readmode');
      card.innerHTML = `<p class="rd-text"><span class="said"></span><span class="rest">${text}</span></p>`;
      $('lsCta').classList.add('is-hidden');
      $('lsMicRow').classList.remove('is-hidden');
      armReadMic();
    }

    function armReadMic(){
      const orb = $('lsOrb'), w = $('lsWave');
      w.innerHTML = '';
      for (let k = 0; k < 20; k++) w.appendChild(document.createElement('span'));
      orb.classList.remove('live');
      $('lsTip').classList.remove('hidden');
      $('lsTimer').classList.remove('on');
      let wt = null, tt = null, fill = null;
      orb.onclick = () => {
        if (orb.classList.contains('live')) return;
        orb.classList.add('live');
        $('lsTip').classList.add('hidden');
        $('lsTimer').classList.add('on');
        const bars = [...w.children];
        wt = setInterval(() => bars.forEach(b => b.style.height = (16 + Math.random() * 66) + '%'), 100);
        const t0 = Date.now();
        tt = setInterval(() => $('lsTimer').textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's', 100);
        const said = card.querySelector('.said'), rest = card.querySelector('.rest');
        const words = text.split(' ');
        let n = 0;
        fill = setInterval(() => {
          if (n >= words.length){ clearInterval(fill); return; }
          n++;
          said.textContent = words.slice(0, n).join(' ') + ' ';
          rest.textContent = words.slice(n).join(' ');
        }, 300);
        $('lsOk').onclick = e => {
          e.stopPropagation();
          clearInterval(wt); clearInterval(tt); clearInterval(fill);
          orb.onclick = null;
          $('learnScreen').classList.add('is-hidden');
          $('chatScreen').classList.remove('is-hidden');
          resolve({ path:'read' });
        };
        $('lsX').onclick = e => {
          e.stopPropagation();
          clearInterval(wt); clearInterval(tt); clearInterval(fill);
          orb.classList.remove('live');
          $('lsTimer').classList.remove('on');
          $('lsTip').classList.remove('hidden');
          card.querySelector('.said').textContent = '';
          card.querySelector('.rest').textContent = text;
          armReadMic();
        };
      };
    }

    if (skipTeach){ paintRead(); return; }
    paintTeach();
    $('lsCta').onclick = () => {
      if (++i < segs.length){ paintTeach(); return; }
      $('lsCta').onclick = null;
      paintRead();
    };
  });
}



/* ---------- review panel ---------- */
(function panel(){
  const groups = [
    ['dpRoom','room',[['manager','Manager'],['meetings','Meetings'],['present','Presenting']]],
    ['dpLvl','lvl',[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']]],
    ['dpMode','mode',[['learn','Teach me'],['try','Try myself']]],
    ['dpStep','step',[
      ['language','Lang'],['name','Name'],['goal','Goal'],['situation','Situation'],
      ['rooms','Rooms'],['level','Level'],['choice','Choice'],
      ['story','Story'],['moment','Moment'],['score','Score']]],
  ];
  groups.forEach(([boxId, key, items]) => {
    const box = $(boxId);
    if (!box) return;
    items.forEach(([v, label]) => {
      const b = el(`<button class="${DBG[key] === v ? 'active' : ''}">${label}</button>`);
      b.addEventListener('click', () => {
        const p = new URLSearchParams(location.search);
        p.set(key, v);
        /* picking a flow chip without a step keeps you at the story start */
        location.search = p.toString();
      });
      box.appendChild(b);
    });
  });
})();

flow();
