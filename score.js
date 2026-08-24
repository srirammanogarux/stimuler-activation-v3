/* ============================================================
   Activation v3 · step 5 — the score, India report anatomy.
   Score % + purple bar → (impromptu only: the 4-step report) →
   the passage with the two weak words highlighted → one
   pron-card at a time, India-style: word, phonetics, play chip,
   score, mic button, green done state. Bar climbs per word.
   Then: value line → journey → paywall.
   ============================================================ */
'use strict';

const SCORE = {
  manager:  { read:74, speak:58,
    drill:[{ w:'Friday',  ph:'/ˈfraɪ.deɪ/', from:54 }, { w:'wedding', ph:'/ˈwed.ɪŋ/', from:51 }],
    report:  [true, true, false, false],
    value:   'Five minutes ago this conversation made you nervous. You just handled it.',
    wk1:     'Manager conversations: leave, deadlines, updates' },
  meetings: { read:72, speak:55,
    drill:[{ w:'option',  ph:'/ˈɒp.ʃən/', from:53 }, { w:'earlier', ph:'/ˈɜː.li.ər/', from:50 }],
    report:  [true, true, false, false],
    value:   'You just did the thing you never do in meetings. You said it first.',
    wk1:     'Meetings: taking a position and holding it' },
  present:  { read:75, speak:56,
    drill:[{ w:'losing', ph:'/ˈluː.zɪŋ/', from:55 }, { w:'statuses', ph:'/ˈsteɪ.təs.ɪz/', from:52 }],
    report:  [true, true, false, false],
    value:   'That’s the first time your work got the words it deserves.',
    wk1:     'Presenting your work the way it deserves' },
};
const WORD_LIFT = 6;   /* the top score climbs this much per fixed word */

const JOURNEY_TAIL = [
  { wk:'Week 3', what:'Holding your own in any room at work' },
  { wk:'Week 5', what:'Thinking in English, not translating' },
  { wk:'Week 8', what:'Walking in with something to say, every time' },
];

window.playScore = function({ room, path, hintUsed, frame, name }){
  return new Promise(resolve => {
    const $ = id => document.getElementById(id);
    const sc = SCORE[room] || SCORE.manager;
    const pronounceLead = (path === 'read') || hintUsed;
    const base = path === 'read' ? sc.read : sc.speak;
    let score = 0;

    const setScore = (to, ms = 900) => {
      const from = score; score = to;
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / ms);
        const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        $('scNum').textContent = v;
        $('scBarFill').style.width = v + '%';
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    /* ---- header + report ---- */
    $('scNum').textContent = '0';
    $('scBarFill').style.width = '0%';
    $('scBar').classList.remove('win');
    if (pronounceLead){
      $('scOpen').textContent = path === 'read'
        ? 'You said the whole thing out loud. Two words held you back:'
        : 'Good. The structure was there. Two words held you back:';
      $('scReport').innerHTML = '';
      $('scReport').style.display = 'none';
    } else {
      $('scOpen').textContent = 'A real attempt. Here’s what landed, and what didn’t.';
      $('scReport').style.display = '';
      $('scReport').innerHTML = frame.map((f, i) => `
        <li class="${sc.report[i] ? 'hit' : ''}">
          <span class="scb-mark">${sc.report[i] ? '✓' : '✗'}</span>
          <span class="scb-text">${f.s}</span></li>`).join('');
    }

    /* ---- the passage, weak words highlighted ---- */
    const answer = frame.map(f => f.t).join(' ');
    const weak = sc.drill.map(d => d.w.toLowerCase());
    $('scPassageText').innerHTML = answer.split(' ').map(word => {
      const clean = word.replace(/[^\w’']/g, '').toLowerCase();
      return weak.includes(clean)
        ? `<span class="hlw idle" data-w="${clean}">${word}</span>`
        : word;
    }).join(' ');
    $('scState').textContent = 'Let’s fix them, one at a time.';

    $('scValue').textContent = sc.value;
    $('scValue').classList.add('is-off');
    $('scCta').classList.add('is-off');
    $('scDrillZone').innerHTML = '';

    /* ---- show + count the base score ---- */
    ['momentScreen','scoreScreen'].forEach(s =>
      $(s).classList.toggle('is-hidden', s !== 'scoreScreen'));
    setTimeout(() => setScore(base), 400);

    /* ---- the drill: one India pron-card at a time ---- */
    let wi = 0;
    function pronCard(){
      const d = sc.drill[wi];
      $('scDrillZone').innerHTML = `
        <div class="pron-card" id="pcCard">
          <div class="pc-top">
            <div>
              <p class="pc-word">${d.w}</p>
              <p class="pc-ph">${d.ph}</p>
            </div>
            <button class="pc-play" id="pcPlay">
              <img src="assets/sarah-avatar.png" alt="">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="pc-bottom">
            <div class="pc-score"><b id="pcScore">${d.from}</b><span>pronunciation</span></div>
            <div class="pc-right">
              <button class="pc-btn" id="pcBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
                Say the word
              </button>
              <p class="pc-tip">Say it <b>slowly</b> first</p>
            </div>
          </div>
          <div class="pc-burst"></div>
        </div>`;
      $('pcPlay').addEventListener('click', () => {
        $('pcPlay').style.opacity = .55;
        setTimeout(() => $('pcPlay').style.opacity = '', 900);
      });
      $('pcBtn').addEventListener('click', function(){
        const btn = $('pcBtn');
        if (btn.classList.contains('listening') || btn.classList.contains('done')) return;
        btn.classList.add('listening');
        btn.innerHTML = 'Listening…';
        setTimeout(() => {
          const card = $('pcCard');
          btn.classList.remove('listening'); btn.classList.add('done');
          btn.innerHTML = '✓ Heard it clearly';
          card.classList.add('done');
          card.insertAdjacentHTML('beforeend',
            '<div class="pc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg></div>');
          /* the word's score climbs, the passage word goes green, the top bar lifts */
          const b = $('pcScore'); let v = parseInt(b.textContent, 10);
          const iv = setInterval(() => { b.textContent = ++v; if (v >= 84) clearInterval(iv); }, 26);
          const hl = document.querySelector(`.hlw[data-w="${sc.drill[wi].w.toLowerCase()}"]`);
          if (hl){ hl.classList.remove('idle'); hl.classList.add('ok'); }
          setScore(base + WORD_LIFT * (wi + 1), 700);
          $('scState').textContent = wi === 0 ? 'One down. One to go.' : 'Both words fixed.';
          $('scState').classList.add('ok');
          setTimeout(() => {
            $('scState').classList.remove('ok');
            if (++wi < sc.drill.length){ pronCard(); }
            else {
              $('scBar').classList.add('win');
              $('scDrillZone').innerHTML = '';
              $('scState').textContent = '';
              $('scValue').classList.remove('is-off');
              $('scCta').classList.remove('is-off');
            }
          }, 1200);
        }, 1400);
      });
    }
    setTimeout(pronCard, 1400);

    /* ---- journey → paywall ---- */
    $('scCta').addEventListener('click', () => {
      const rows = [{ wk:'Week 1', what: sc.wk1 }, ...JOURNEY_TAIL];
      $('jnTitle').innerHTML = `You took the first step<br>five minutes ago${name ? ', ' + name : ''}.`;
      $('jnRows').innerHTML = rows.map((j, i) => `
        <div class="jn-row ${i === 0 ? 'lit' : ''}"><div class="jn-dot"></div>
        <div><p class="jn-wk">${j.wk}</p><p class="jn-what">${j.what}</p></div></div>`).join('');
      ['scoreScreen','journeyScreen'].forEach(s =>
        $(s).classList.toggle('is-hidden', s !== 'journeyScreen'));
    }, { once:true });

    $('jnCta').addEventListener('click', () => {
      ['journeyScreen','payScreen'].forEach(s =>
        $(s).classList.toggle('is-hidden', s !== 'payScreen'));
      resolve();
    }, { once:true });
  });
};
