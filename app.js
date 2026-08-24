/* ============================================================
   Stimuler · Activation v3 — flow
   goal → situation → scenario pick → level → win → 3-beat story
   → the moment (framework-taught read for beginners, hinted
   free-speak for the rest) → score → drill → journey → paywall.
   Content lives in content.js; this file only sequences it.
   ============================================================ */
'use strict';

const $  = id => document.getElementById(id);
const el = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const SARAH = 'assets/sarah-avatar.png';
const MANAGER = 'assets/manager.png';

const chatStream = $('chatStream');
const chatScroll = $('chatScroll');

/* ---------- URL state ---------- */
const Q = new URLSearchParams(location.search);
const DBG = { goal:Q.get('goal'), sit:Q.get('sit'), room:Q.get('room'),
              lvl:Q.get('lvl'), win:Q.get('win'), step:Q.get('step') };

const A = { name:'Ana', lang:null, goal:null, situation:null, cohort:null,
            room:null, level:null, win:null, path:null };

/* ---------- fast-forward ---------- */
const STEPS = ['intro','language','name','goal','situation','room','level','win',
               'story','moment','score','journey','paywall'];
let FF = false, rushing = false;
const targetIdx = DBG.step ? STEPS.indexOf(DBG.step) : -1;
if (targetIdx > 0) FF = true;
const reach = n => { if (FF && STEPS.indexOf(n) >= targetIdx) FF = false; };

/* ---------- chat primitives ---------- */
function scrollToEnd(smooth = true){
  requestAnimationFrame(() => chatScroll.scrollTo({
    top: chatScroll.scrollHeight, behavior: smooth && !FF ? 'smooth' : 'auto' }));
}
function dimLast(){
  const last = chatStream.querySelector('.msg:last-of-type');
  if (last) last.classList.add('dim');
}
async function sarah(text, { typingMs = 600, perWord = 112 } = {}){
  dimLast();
  if (FF || rushing){
    chatStream.appendChild(el(`<div class="msg dim"><div class="dp"><img src="${SARAH}" alt=""></div><div class="bubble"><p>${text}</p></div></div>`));
    scrollToEnd(false); return;
  }
  const row = el(`<div class="msg"><div class="dp"><img src="${SARAH}" alt=""></div><div class="bubble typing"><i></i><i></i><i></i></div></div>`);
  chatStream.appendChild(row); scrollToEnd();
  await wait(typingMs);
  const b = row.querySelector('.bubble');
  b.classList.remove('typing'); b.innerHTML = `<p>${text}</p>`;
  scrollToEnd();
  await wait(Math.max(900, text.split(' ').length * perWord));
}
async function judgeSays(name, text){
  dimLast();
  const row = el(`<div class="msg judge"><div class="dp"><img src="${MANAGER}" alt=""></div>
    <div class="bubble"><p class="judge-name">${name}</p><p>${text}</p></div></div>`);
  chatStream.appendChild(row); scrollToEnd();
  if (!FF) await wait(Math.max(1300, text.split(' ').length * 130));
}
function userChip(label){
  chatStream.appendChild(el(`<div class="chip-row"><div class="chip">${label}</div></div>`));
  scrollToEnd();
}
function options(items, { head = 'Select an option', forced = null } = {}){
  if (FF){
    const it = items.find(i => i.v === forced) || items[0];
    userChip(it.label); return Promise.resolve(it.v);
  }
  return new Promise(resolve => {
    const wrap = el(`<div class="options"><p class="opt-head">${head}</p><div class="opt-list"></div></div>`);
    const list = wrap.querySelector('.opt-list');
    items.forEach(it => {
      const btn = el(it.desc
        ? `<button class="opt">${it.label}<span class="opt-desc">${it.desc}</span></button>`
        : `<button class="opt">${it.label}</button>`);
      btn.addEventListener('click', () => {
        btn.classList.add('selected');
        setTimeout(() => { wrap.remove(); userChip(it.label); resolve(it.v); }, 180);
      });
      list.appendChild(btn);
    });
    chatStream.appendChild(wrap); scrollToEnd();
  });
}
function nameInput(){
  if (FF) return Promise.resolve('Ana');
  return new Promise(resolve => {
    const wrap = el(`<div class="input-block">
      <input type="text" placeholder="Your name" maxlength="24" aria-label="Your name">
      <button class="btn-continue">Continue</button></div>`);
    const input = wrap.querySelector('input'), btn = wrap.querySelector('.btn-continue');
    input.addEventListener('input', () => btn.classList.toggle('ready', input.value.trim().length > 1));
    btn.addEventListener('click', () => {
      const v = input.value.trim(); if (v.length < 2) return;
      wrap.remove(); userChip(v); resolve(v);
    });
    chatStream.appendChild(wrap); scrollToEnd();
    setTimeout(() => input.focus(), 120);
  });
}
function setProgress(pct, label){
  $('progressFill').style.width = pct + '%';
  if (label) $('progressLabel').textContent = label;
}
function showScreen(id){
  ['chatScreen','storyScreen','scoreScreen','journeyScreen','payScreen']
    .forEach(s => $(s).classList.toggle('is-hidden', s !== id));
}

/* ---------- mic (count UP; quiet exit) ---------- */
let waveTimer = null;
function micTurn({ escapeAllowed = true } = {}){
  if (FF) return Promise.resolve('spoke');
  return new Promise(resolve => {
    const area = $('micArea'), orb = $('micOrb');
    const w = $('micWave'); w.innerHTML = '';
    for (let i = 0; i < 22; i++) w.appendChild(document.createElement('span'));
    area.classList.remove('gone');
    orb.className = 'mic-orb idle';
    $('micTip').classList.remove('hidden');
    $('micTimer').classList.remove('on');
    $('micEscape').classList.toggle('gone', !escapeAllowed);

    let t0 = 0, tick = null;
    const close = how => {
      clearInterval(waveTimer); clearInterval(tick);
      area.classList.add('gone');
      resolve(how);
    };
    const onEscape = () => close('escape');
    const onTap = () => {
      if (!orb.classList.contains('idle')) return;
      orb.className = 'mic-orb live';
      $('micTip').classList.add('hidden');
      $('micEscape').classList.add('gone');
      $('micTimer').classList.add('on');
      const bars = [...w.children];
      waveTimer = setInterval(() => bars.forEach(b => b.style.height = (16 + Math.random() * 66) + '%'), 100);
      t0 = Date.now();
      tick = setInterval(() => $('micTimer').textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's', 100);
      $('micOk').addEventListener('click', e => { e.stopPropagation(); close('spoke'); }, { once:true });
      $('micX').addEventListener('click', e => {
        e.stopPropagation();
        clearInterval(waveTimer); clearInterval(tick);
        orb.className = 'mic-orb idle';
        $('micTimer').classList.remove('on');
        $('micTip').classList.remove('hidden');
        if (escapeAllowed) $('micEscape').classList.remove('gone');
        orb.addEventListener('click', onTap, { once:true });
      }, { once:true });
    };
    orb.addEventListener('click', onTap, { once:true });
    $('micEscape').addEventListener('click', onEscape, { once:true });
  });
}

/* ---------- the 3-beat story ---------- */
function playStory(sc, win){
  if (FF) return Promise.resolve();
  return new Promise(resolve => {
    const s = sc.story;
    $('b1Eyebrow').textContent = s.beat1.eyebrow;
    $('b1Place').textContent   = s.beat1.place;
    $('b1Line').textContent    = s.beat1.line;
    $('b2Them').textContent    = sc.them;
    $('b2Tag').textContent     = s.beat2.tag;
    $('b3Objective').innerHTML = s.beat3.objective;
    $('b3Win').textContent     = win.label;
    $('b3Tip').textContent     = win.tip;
    $('b3Timer').textContent   = s.beat3.timer;

    const dots = [$('dot1'), $('dot2'), $('dot3')];
    const beats = [$('beat1'), $('beat2'), $('beat3')];
    let i = -1, autoT = null;
    const show = n => {
      i = n;
      beats.forEach((b, k) => b.classList.toggle('is-off', k !== n));
      dots.forEach((d, k) => d.classList.toggle('on', k <= n));
      if (n === 1) requestAnimationFrame(() => requestAnimationFrame(() => $('beat2').classList.add('go')));
      clearTimeout(autoT);
      if (n === 0) autoT = setTimeout(() => show(1), 3400);
      if (n === 1) autoT = setTimeout(() => show(2), 3000);
    };
    /* tap advances early; beat 3 waits for its CTA */
    $('storyScreen').addEventListener('click', function adv(e){
      if (e.target.id === 'b3Cta') return;
      if (i < 2) show(i + 1);
      if (i === 2) $('storyScreen').removeEventListener('click', adv);
    });
    $('b3Cta').addEventListener('click', () => { clearTimeout(autoT); resolve(); }, { once:true });
    showScreen('storyScreen');
    show(0);
  });
}

/* ---------- framework teaching (beginner) ---------- */
async function teachFramework(sc){
  for (let i = 0; i < sc.framework.length; i++){
    const f = sc.framework[i];
    if (!FF){
      dimLast();
      chatStream.appendChild(el(`<div class="fw-card">
        <span class="fw-n">${i + 1}</span><span class="fw-step">${f.step}</span>
        <p class="fw-how">${f.how}</p>
        <p class="fw-sample">“${f.sample}”</p></div>`));
      scrollToEnd();
      await wait(1900);
    }
  }
}
function showHints(sc){
  chatStream.appendChild(el(`<div class="hints">` +
    sc.framework.map((f, i) => `<span class="hint"><b>${i + 1}</b> ${f.step}</span>`).join('') +
    `</div>`));
  scrollToEnd();
}
function fullAnswer(sc){ return sc.framework.map(f => f.sample).join(' '); }

/* read-aloud card with words filling as "spoken" */
async function readAloud(sc){
  const text = fullAnswer(sc);
  const card = el(`<div class="read-card"><p class="read-label">Read it to him — out loud</p>
    <p class="read-text"><span class="said"></span><span class="rest">${text}</span></p></div>`);
  chatStream.appendChild(card); scrollToEnd();
  const how = await micTurn({ escapeAllowed:false });
  if (!FF && how === 'spoke'){ /* fill words while "listening" happened — quick replay */
    const said = card.querySelector('.said'), rest = card.querySelector('.rest');
    said.textContent = text; rest.textContent = '';
  }
  return how;
}

/* ---------- score screen ---------- */
function countTo(elm, to, ms = 900){
  const from = parseInt(elm.textContent, 10) || 0;
  const t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / ms);
    elm.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
async function scoreAndDrill(sc, win, path){
  reach('score');
  const spoke = path === 'speak';
  const score = spoke ? sc.spoken.score : sc.readScore;
  const hit   = spoke ? sc.spoken.hit   : [true, true, true, true];
  const open  = spoke ? win.openMiss(sc.spoken.metrics[win.v]) : win.open(
    { start:'two seconds', sustain:'all four lines', land:'in your first line', clear:'Zero' }[win.v]);

  $('scOpen').textContent = open;
  $('scBeats').innerHTML = sc.framework.map((f, i) => `
    <li class="${hit[i] ? 'hit' : ''}"><span class="scb-mark">${hit[i] ? '✓' : '✗'}</span>
    <span class="scb-text">${f.step}</span></li>`).join('');
  $('scWords').innerHTML = sc.drill.map(w =>
    `<button class="word-chip"><span class="w-ic">🎙</span>${w}</button>`).join('');
  $('scValue').textContent = sc.valueLine;
  $('scValue').classList.add('is-off');
  $('scCta').classList.add('is-off');
  $('scNum').textContent = '0';

  showScreen('scoreScreen');
  if (!FF){ await wait(400); countTo($('scNum'), score); }
  else $('scNum').textContent = score;

  /* the drill: tap each word, "say" it, it goes green, score climbs */
  let done = 0;
  const chips = [...$('scWords').children];
  const finishDrill = () => {
    countTo($('scNum'), DRILL_TO[spoke ? 'speak' : 'read'], 1100);
    $('scValue').classList.remove('is-off');
    $('scCta').classList.remove('is-off');
  };
  if (FF){ chips.forEach(c => c.classList.add('done')); finishDrill(); }
  else chips.forEach(chip => chip.addEventListener('click', async () => {
    if (chip.classList.contains('done') || chip.classList.contains('saying')) return;
    chip.classList.add('saying');
    await wait(1300);
    chip.classList.remove('saying'); chip.classList.add('done');
    chip.querySelector('.w-ic').textContent = '✓';
    if (++done === chips.length) finishDrill();
  }));

  await new Promise(r => $('scCta').addEventListener('click', r, { once:true }));
}

/* ---------- journey + paywall ---------- */
async function journey(sc){
  reach('journey');
  const rows = JOURNEY.map((j, i) => ({ ...j, what: j.what || sc.journeyWk1 }));
  $('jnRows').innerHTML = rows.map((j, i) => `
    <div class="jn-row ${i === 0 ? 'lit' : ''}"><div class="jn-dot"></div>
    <div><p class="jn-wk">${j.wk}</p><p class="jn-what">${j.what}</p></div></div>`).join('');
  showScreen('journeyScreen');
  if (!FF) await new Promise(r => $('jnCta').addEventListener('click', r, { once:true }));
}
function paywall(){
  reach('paywall');
  $('pwTitle').innerHTML = PAYWALL.title;
  $('pwCta').textContent = PAYWALL.cta;
  showScreen('payScreen');
}

/* ============================================================
   THE FLOW
   ============================================================ */
async function flow(){
  showScreen('chatScreen');
  setProgress(0, 'Let’s get started');
  await wait(400);

  reach('intro');
  await sarah('Hey! I’m Sarah. I’m here to help you speak English with confidence — in the moments that actually matter to you.');

  reach('language');
  setProgress(8, '8% completed');
  await sarah('First — what’s your native language?');
  A.lang = await options(LANGS.map(l => ({ v:l.v, label:l.label })), { forced:'es' });

  reach('name');
  setProgress(16, '16% completed');
  await sarah('And what should I call you?');
  A.name = await nameInput();

  /* A · goal */
  reach('goal');
  setProgress(28, 'Your goal');
  await sarah(`Good to meet you, ${A.name}. What are you learning English for?`);
  A.goal = await options(GOALS.map(g => ({ v:g.v, label:g.label })), { forced: DBG.goal || 'career' });

  /* B · situation */
  reach('situation');
  setProgress(40, '40% completed');
  await sarah('And what’s your situation right now?');
  A.situation = await options(SITUATIONS.map(s => ({ v:s.v, label:s.label })), { forced: DBG.sit || 'office' });

  A.cohort = cohortFor(A.goal, A.situation);
  paintResolved();

  /* C · the scenario (subgoal) */
  reach('room');
  const rooms = ROOMS[A.cohort];
  if (rooms.ask){
    setProgress(52, 'Almost there');
    await sarah(rooms.ask);
    A.room = await options(rooms.list.map(r => ({ v:r.v, label:r.label })), { forced: DBG.room || 'manager' });
  } else {
    A.room = rooms.list[0].v;
  }
  const roomDef = rooms.list.find(r => r.v === A.room);
  paintResolved();

  if (!roomDef || !roomDef.built){
    await sarah(`<b>${roomDef ? roomDef.label : 'That one'}</b> isn’t built in this prototype yet. The three office scenarios are — pick “Working a job” + “Grow in my career”, then any of the first three.`);
    chatStream.appendChild(el('<div class="options"><button class="opt" onclick="location.search=\'\'">↺ Start again</button></div>'));
    scrollToEnd();
    return;
  }
  const sc = SCENARIOS[A.room];

  /* D · level */
  reach('level');
  setProgress(64, '64% completed');
  await sarah('How would you describe your English right now?');
  A.level = await options(LEVELS.map(l => ({ v:l.v, label:l.label, desc:l.desc })), { forced: DBG.lvl || 'beginner' });

  /* E · the win (speech job) */
  reach('win');
  setProgress(78, 'One last thing');
  await sarah('Last one. In that moment — what’s the one thing you want to get right?');
  A.win = await options(WINS.map(w => ({ v:w.v, label:w.label })), { forced: DBG.win || 'sustain' });
  const win = winFor(A.win);
  A.path = A.level === 'beginner' ? 'read' : 'speak';
  paintResolved();

  /* F · the story */
  reach('story');
  setProgress(88, 'Your first scenario');
  await sarah('Let’s make this real. Your first scenario —');
  await playStory(sc, win);

  /* G · the moment */
  reach('moment');
  showScreen('chatScreen');
  chatStream.innerHTML = '';
  setProgress(94, 'Your turn');
  await judgeSays(sc.them, sc.judgeLine);

  if (A.path === 'read'){
    await sarah('Here’s how to handle this — four small steps.');
    await teachFramework(sc);
    await sarah('That’s the whole answer. Now say it to him — just read it. Nobody hears this but me.');
    await readAloud(sc);
  } else {
    await sarah(win.tip);
    if (!FF) showHints(sc);
    await sarah('Nobody hears this but me. Tap the mic when you’re ready.');
    const how = await micTurn();
    if (how === 'escape'){
      A.path = 'read';
      await sarah('No problem at all. Let’s build it together first — four small steps.');
      await teachFramework(sc);
      await sarah('Now just read it to him. That’s all.');
      await readAloud(sc);
    } else {
      userChip(sc.spoken.transcript);
      await wait(500);
    }
  }

  /* score → drill → value */
  await scoreAndDrill(sc, win, A.path);
  await journey(sc);
  paywall();
}

/* ============================================================
   REVIEW PANEL
   ============================================================ */
function chips(group, list, key){
  const box = $(group);
  list.forEach(it => {
    const b = el(`<button class="dp-chip${DBG[key] === it.v ? ' on' : ''}">${it.label}</button>`);
    b.addEventListener('click', () => {
      const p = new URLSearchParams(location.search);
      p.set(key, it.v);
      if (key !== 'step') p.delete('step');
      location.search = p.toString();
    });
    box.appendChild(b);
  });
}
function paintResolved(){
  $('dpResolved').innerHTML =
    `<b>${A.goal || '—'}</b> + <b>${A.situation || '—'}</b> → <span class="dp-out">${A.cohort || '?'}</span>` +
    (A.room ? `<br>scenario → <span class="dp-out">${A.room}</span>` : '') +
    (A.path ? `<br>path → <span class="dp-out">${A.path === 'read' ? 'learn first, then read' : 'speak, hints ready'}</span>` : '');
}
chips('dpGoal', GOALS, 'goal');
chips('dpSit',  SITUATIONS, 'sit');
chips('dpRoom', ROOMS.atwork.list, 'room');
chips('dpLvl',  LEVELS, 'lvl');
chips('dpWin',  WINS, 'win');
chips('dpStep', STEPS.map(s => ({ v:s, label:s })), 'step');

$('skipBtn').addEventListener('click', () => { rushing = true; });
$('pwRestart').addEventListener('click', () => { location.search = ''; });
$('pwCta').addEventListener('click', () => {});

flow();
