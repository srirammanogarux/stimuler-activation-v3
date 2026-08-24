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
    value:   'Five minutes ago this conversation made you nervous. You just handled it.' },
  meetings: { read:72, speak:55,
    drill:[{ w:'option',  ph:'/ˈɒp.ʃən/', from:53 }, { w:'earlier', ph:'/ˈɜː.li.ər/', from:50 }],
    report:  [true, true, false, false],
    value:   'You just did the thing you never do in meetings. You said it first.' },
  present:  { read:75, speak:56,
    drill:[{ w:'losing', ph:'/ˈluː.zɪŋ/', from:55 }, { w:'statuses', ph:'/ˈsteɪ.təs.ɪz/', from:52 }],
    report:  [true, true, false, false],
    value:   'That’s the first time your work got the words it deserves.' },
};
const WORD_LIFT = 6;   /* the top score climbs this much per fixed word */

/* the plan screen, USA anatomy: title, trajectory, checks, scenarios */
const PLAN = {
  manager: {
    title: 'Eight weeks to <em>ask without rehearsing</em>',
    checks: ['Asking for time off', 'Deadline conversations', 'Giving clear updates', 'Pushing back politely'],
    done:   'Talking to your manager',
    next:   'Speaking up in meetings · Presenting my work',
  },
  meetings: {
    title: 'Eight weeks to <em>a voice the room waits for</em>',
    checks: ['Taking a position', 'Disagreeing without friction', 'Thinking aloud clearly', 'Bringing the room with you'],
    done:   'Speaking up in meetings',
    next:   'Talking to my manager · Presenting my work',
  },
  present: {
    title: 'Eight weeks to <em>presenting without freezing</em>',
    checks: ['Opening strong', 'Explaining the impact', 'Handling questions', 'Closing with next steps'],
    done:   'Presenting your work',
    next:   'Talking to my manager · Speaking up in meetings',
  },
};

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
    ['chatScreen','storyScreen','scoreScreen'].forEach(s =>
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

    /* ---- the plan → paywall ---- */
    $('scCta').addEventListener('click', () => {
      const pl = PLAN[room] || PLAN.manager;
      $('plEyebrow').textContent = name ? `Your plan, ${name}` : 'Your plan';
      $('plTitle').innerHTML = pl.title;
      $('plSub').textContent = 'Built from what you showed today.';
      $('plFrom').textContent = `Today · ${score}%`;
      $('plChecks').innerHTML = pl.checks.map(c => `<li>${c}</li>`).join('');
      $('plDone').insertAdjacentText('beforeend', pl.done);
      $('plNext').textContent = pl.next;
      ['scoreScreen','planScreen'].forEach(s =>
        $(s).classList.toggle('is-hidden', s !== 'planScreen'));
    }, { once:true });

    $('plCta').addEventListener('click', () => {
      ['planScreen','payScreen'].forEach(s =>
        $(s).classList.toggle('is-hidden', s !== 'payScreen'));
      resolve();
    }, { once:true });
  });
};
