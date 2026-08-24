/* ============================================================
   Activation v3 · step 4 — the moment.
   Full-screen speaking task, USA-onboarding anatomy.
   Beginner: framework card + assembled answer, read aloud.
   Int/Adv: mic first, framework behind the hint bulb.
   Exposes window.playMoment(roomId, winId, level) → resolves
   { path:'read'|'speak' } on mic confirm.
   ============================================================ */
'use strict';

const MOMENT = {
  manager: {
    eyebrow: 'Talking to your manager',
    role: 'Your manager · between meetings',
    ctx: 'He looks up from his laptop.',
    q: 'Yeah, I heard you want a day off next week. What’s it about?',
    frame: [
      { s:'Make the ask',    h:'Name the exact day, straight away.',
        t:'I’d like to take next Friday off.' },
      { s:'Give the reason', h:'One line. Don’t over-explain.',
        t:'It’s my cousin’s wedding.' },
      { s:'Cover the gap',   h:'Show the work is handled before he asks.',
        t:'My tasks for the week are done, and I’ll hand the client file to Maria on Thursday.' },
      { s:'Confirm',         h:'End on a question, so he answers.',
        t:'Would that be okay?' },
    ],
  },
  meetings: {
    eyebrow: 'Speaking up in meetings',
    role: 'Your manager · at the team sync',
    ctx: 'The room goes quiet. He turns to you.',
    q: 'We’re leaning towards option A. Thoughts?',
    frame: [
      { s:'Take a position',   h:'Say which option, straight away. No wind-up.',
        t:'I’d go with option B.' },
      { s:'Give one reason',   h:'Your strongest one. Not all of them.',
        t:'It gets us to launch two weeks earlier.' },
      { s:'Name the trade-off',h:'Show you’ve seen the catch before they raise it.',
        t:'The risk is the migration, but we can stage that.' },
      { s:'Invite the room',   h:'End open, so it’s a discussion, not a speech.',
        t:'Does that work for everyone?' },
    ],
  },
  present: {
    eyebrow: 'Presenting your work',
    role: 'Your manager · at the demo',
    ctx: 'Your work is on the screen. Everyone waits.',
    q: 'Alright, walk us through it.',
    frame: [
      { s:'Say what it is',       h:'One plain sentence. No preamble.',
        t:'This is the new order-tracking screen.' },
      { s:'Why it matters',       h:'The problem it kills, in numbers if you have them.',
        t:'We were losing an hour a day checking statuses by hand.' },
      { s:'What you did',         h:'Your part, said plainly. Don’t shrink it.',
        t:'I built one view that shows every order live.' },
      { s:'End with what’s next', h:'Give the room somewhere to go.',
        t:'Next month we roll it out to the whole team.' },
    ],
  },
};

const MOMENT_TIPS = {
  speak: 'Say it like you would in the room. Nobody hears this but you.',
  read:  'Just read it. Nobody hears this but you.',
};

window.momentFrame = roomId => (MOMENT[roomId] || MOMENT.manager).frame;

window.playMoment = function(roomId, level){
  return new Promise(resolve => {
    const $  = id => document.getElementById(id);
    const mo = MOMENT[roomId] || MOMENT.manager;
    const beginner = level === 'beginner';
    let path = beginner ? 'read' : 'speak';
    let hintUsed = false;

    /* fill the slots */
    $('moEyebrow').textContent = mo.eyebrow;
    $('moRole').textContent    = mo.role;
    $('moCtx').textContent     = mo.ctx;
    $('moQ').textContent       = mo.q;
    $('moSteps').innerHTML     = mo.frame.map((f, i) => `
      <li><span class="mo-sn">${i + 1}</span>
      <div><span class="mo-ss">${f.s}</span><span class="mo-sh">${f.h}</span></div></li>`).join('');
    const answer = mo.frame.map(f => f.t).join(' ');
    $('moRt').innerHTML        = `<span class="said"></span><span class="rest">${answer}</span>`;
    $('moTip').textContent     = beginner ? MOMENT_TIPS.read : MOMENT_TIPS.speak;

    /* int/adv starts bare with the bulb; beginner gets the teach sequence */
    $('moFrame').classList.add('gone');            /* the old stacked card stays off */
    $('moRead').style.display = 'none';
    $('moBulb').classList.toggle('gone', beginner);
    $('moTeach').classList.add('gone');
    $('moChips').classList.add('gone');
    document.querySelector('.mo-mic-row').style.visibility = beginner ? 'hidden' : '';

    /* teach: one step at a time, then collapse to chips + answer + mic */
    function teach(){
      return new Promise(done => {
        let i = 0;
        $('moTeach').classList.remove('gone');
        const paint = () => {
          $('moTeachN').textContent = `Step ${i + 1} of ${mo.frame.length}`;
          $('moTeachS').textContent = mo.frame[i].s;
          $('moTeachH').textContent = mo.frame[i].h;
          $('moTeachT').textContent = '“' + mo.frame[i].t + '”';
          $('moTeachNext').textContent = i < mo.frame.length - 1 ? 'Next' : 'Got it';
          const card = document.querySelector('.mo-tcard');
          card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
        };
        paint();
        $('moTeachNext').onclick = () => {
          if (++i < mo.frame.length){ paint(); return; }
          $('moTeachNext').onclick = null;
          $('moTeach').classList.add('gone');
          $('moChips').innerHTML = mo.frame.map((f, k) =>
            `<span class="mo-chip"><i>${k + 1}</i>${f.s}</span>`).join('');
          $('moChips').classList.remove('gone');
          $('moRead').style.display = '';
          document.querySelector('.mo-mic-row').style.visibility = '';
          done();
        };
      });
    }
    if (beginner) teach();

    $('moBulb').addEventListener('click', () => {
      hintUsed = true;
      $('moFrame').classList.toggle('gone');
    });

    /* escape: switch this same screen to the beginner teach sequence */
    const onEscape = () => {
      path = 'read';
      $('moBulb').classList.add('gone');
      $('moFrame').classList.add('gone');
      $('moTip').textContent = MOMENT_TIPS.read;
      $('moEscape').classList.add('gone');
      $('moInner').scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('.mo-mic-row').style.visibility = 'hidden';
      teach();
    };
    $('moEscape').addEventListener('click', onEscape);

    /* show */
    ['chatScreen','storyScreen','momentScreen'].forEach(s =>
      $(s).classList.toggle('is-hidden', s !== 'momentScreen'));

    /* the mic — orb → live pill, count-up, ✓/✕ */
    const orb = $('moOrb'), w = $('moWave');
    w.innerHTML = '';
    for (let i = 0; i < 20; i++) w.appendChild(document.createElement('span'));
    let waveT = null, tickT = null, t0 = 0;

    const onTap = () => {
      if (orb.classList.contains('live')) return;
      orb.classList.add('live');
      $('moTip').classList.add('hidden');
      $('moEscape').classList.add('gone');
      $('moBulb').classList.add('gone');
      $('moTimer').classList.add('on');
      const bars = [...w.children];
      waveT = setInterval(() => bars.forEach(b => b.style.height = (16 + Math.random() * 66) + '%'), 100);
      t0 = Date.now();
      tickT = setInterval(() => $('moTimer').textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's', 100);

      /* the read card fills as they "speak" */
      if (path === 'read'){
        const said = $('moRt').querySelector('.said');
        const rest = $('moRt').querySelector('.rest');
        const words = answer.split(' ');
        let i = 0;
        const fill = setInterval(() => {
          if (!orb.classList.contains('live') || i >= words.length){ clearInterval(fill); return; }
          i++;
          said.textContent = words.slice(0, i).join(' ') + ' ';
          rest.textContent = words.slice(i).join(' ');
        }, 300);
      }

      $('moOk').addEventListener('click', e => {
        e.stopPropagation();
        clearInterval(waveT); clearInterval(tickT);
        resolve({ path, hintUsed });
      }, { once:true });
      $('moX').addEventListener('click', e => {
        e.stopPropagation();
        clearInterval(waveT); clearInterval(tickT);
        orb.classList.remove('live');
        $('moTimer').classList.remove('on');
        $('moTip').classList.remove('hidden');
        if (path === 'speak'){ $('moEscape').classList.remove('gone'); $('moBulb').classList.remove('gone'); }
        const said = $('moRt').querySelector('.said'), rest = $('moRt').querySelector('.rest');
        if (said){ said.textContent = ''; rest.textContent = answer; }
        orb.addEventListener('click', onTap, { once:true });
      }, { once:true });
    };
    orb.addEventListener('click', onTap, { once:true });
  });
};
