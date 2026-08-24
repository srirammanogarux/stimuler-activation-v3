/* ============================================================
   Activation v3 · step 3 — the story.
   One spine for the whole career cohort; captions name the
   scenario. Auto-advances, tap hurries, mission waits for Start.
   Exposes window.playStory(roomId, winId) → resolves on Start.
   ============================================================ */
'use strict';

/* per-scenario captions — the ONLY thing that changes between rooms */
const STORY = {
  manager: {
    them: 'THE MANAGER',
    beats: {
      pressure: { eyebrow:'Next Friday',        text:'the wedding is next Friday… and I still haven’t asked.' },
      dread:    { eyebrow:'Thursday · 11:48 pm', text:'how do i even ask him?' },
      walk:     { eyebrow:'Friday · 4:52 pm',    text:'okay… here goes.' },
    },
    tag: 'One ask. Say it right.',
    objective: 'Walk out with a <b>yes</b> for Friday',
    timer: 'He’s between meetings. You have 5 minutes.',
  },
  meetings: {
    them: 'THE TEAM',
    beats: {
      pressure: { eyebrow:'Monday · 10:00 am',   text:'team sync in ten. the plan is wrong… and I know it.' },
      dread:    { eyebrow:'Sunday · 11:48 pm',   text:'why can i never just say it?' },
      walk:     { eyebrow:'Monday · 9:58 am',    text:'okay… this time i speak.' },
    },
    tag: 'Say it before the moment passes.',
    objective: 'Say what you think, and <b>be heard</b>',
    timer: 'The decision lands in 5 minutes.',
  },
  present: {
    them: 'THE ROOM',
    beats: {
      pressure: { eyebrow:'Thursday · 2:00 pm',  text:'the demo. my work on the screen. everyone watching.' },
      dread:    { eyebrow:'Wednesday · 11:48 pm', text:'what if i freeze up there?' },
      walk:     { eyebrow:'Thursday · 1:58 pm',  text:'okay… my work, my voice.' },
    },
    tag: 'Your work. Your voice.',
    objective: 'Walk them through it <b>without freezing</b>',
    timer: 'You have 3 minutes on the agenda.',
  },
};

window.playStory = function(roomId){
  return new Promise(resolve => {
    const st  = STORY[roomId] || STORY.manager;
    const $   = id => document.getElementById(id);
    const screen = $('storyScreen');

    /* fill the slots */
    $('stThem').textContent      = st.them;
    $('stTag').textContent       = st.tag;
    $('smObjective').innerHTML   = st.objective;
    $('smStars').innerHTML       = (window.momentFrame ? window.momentFrame(roomId) : [])
      .map(f => `<li><span class="star">★</span>${f.s}</li>`).join('');
    $('smTimer').textContent     = st.timer;

    const beats = [
      { el:$('stB1'), dur:3600, video:$('stV1'), cap:st.beats.pressure, eye:$('stE1'), txt:$('stT1') },
      { el:$('stB2'), dur:3400, video:$('stV2'), cap:st.beats.dread,    eye:$('stE2'), txt:$('stT2') },
      { el:$('stB3'), dur:3000, video:$('stV3'), cap:st.beats.walk,     eye:$('stE3'), txt:$('stT3') },
      { el:$('stB4'), dur:3800 },
      { el:$('stB5'), dur:0    },
    ];
    const dots = [...document.querySelectorAll('.st-dots i')];

    /* show the screen */
    ['chatScreen','storyScreen'].forEach(s =>
      $(s).classList.toggle('is-hidden', s !== 'storyScreen'));

    let i = -1, autoT = null, typeT = null;

    function typeText(node, text){
      clearInterval(typeT);
      node.innerHTML = '<span class="t"></span><span class="cursor"></span>';
      const t = node.querySelector('.t');
      let k = 0;
      typeT = setInterval(() => {
        t.textContent = text.slice(0, ++k);
        if (k >= text.length) clearInterval(typeT);
      }, 34);
    }

    function show(n){
      if (n >= beats.length) n = beats.length - 1;
      i = n;
      clearTimeout(autoT);
      beats.forEach((b, k) => b.el.classList.toggle('on', k === n));
      dots.forEach((d, k) => {
        d.classList.remove('run', 'done');
        if (k < n) d.classList.add('done');
      });
      const b = beats[n];
      if (b.dur){
        dots[n].style.setProperty('--st-dur', b.dur + 'ms');
        requestAnimationFrame(() => requestAnimationFrame(() => dots[n].classList.add('run')));
        autoT = setTimeout(() => show(n + 1), b.dur);
      } else {
        dots[n].classList.add('done');
      }
      if (b.video){ try{ b.video.currentTime = 0; b.video.play(); }catch(e){} }
      if (b.cap){
        b.eye.textContent = b.cap.eyebrow;
        typeText(b.txt, b.cap.text);
      }
      if (n === 3) requestAnimationFrame(() => requestAnimationFrame(() => $('stB4').classList.add('go')));
    }

    /* tap hurries; the mission card only responds to Start */
    const onTap = e => {
      if (e.target.id === 'smCta') return;
      if (i < beats.length - 1) show(i + 1);
    };
    screen.addEventListener('click', onTap);
    $('smCta').addEventListener('click', () => {
      clearTimeout(autoT); clearInterval(typeT);
      screen.removeEventListener('click', onTap);
      resolve();
    }, { once:true });

    show(0);
  });
};
