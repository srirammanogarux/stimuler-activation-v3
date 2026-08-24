/* ============================================================
   Activation v3 — results, ported from the USA flow shape,
   worn in the current palette.
   read path : speech meter (novice → proficient) → pron fixes
               → "first step done" → plan flow
   speak path: report card → plan flow
   plan flow : loader → plan → promise → paywall
   ============================================================ */
'use strict';

const RESULTS = {
  manager:  { read:74, speak:58,
    drill:[{ w:'Friday',  ph:'/ˈfraɪ.deɪ/', from:54 }, { w:'wedding', ph:'/ˈwed.ɪŋ/', from:51 }],
    report:[true, true, false, false] },
  meetings: { read:72, speak:55,
    drill:[{ w:'option',  ph:'/ˈɒp.ʃən/', from:53 }, { w:'earlier', ph:'/ˈɜː.li.ər/', from:50 }],
    report:[true, true, false, false] },
  present:  { read:75, speak:56,
    drill:[{ w:'losing', ph:'/ˈluː.zɪŋ/', from:55 }, { w:'statuses', ph:'/ˈsteɪ.təs.ɪz/', from:52 }],
    report:[true, true, false, false] },
};

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

const LADDER = [
  ['Proficient', 'C2'], ['Advanced', 'C1'], ['Upper intermediate', 'B2'],
  ['Intermediate', 'B1'], ['Beginner', 'A2'], ['Novice', 'A1'],
];

window.playResults = function({ room, path, frame, name }){
  return new Promise(resolve => {
    const $  = id => document.getElementById(id);
    const rs = RESULTS[room] || RESULTS.manager;
    const show = id => ['chatScreen','storyScreen','learnScreen','momentScreen',
      'reportScreen','meterScreen','pronScreen','loaderScreen','planScreen','promiseScreen','payScreen']
      .forEach(s => { const e = $(s); if (e) e.classList.toggle('is-hidden', s !== id); });

    /* ---------- speak: the report card ---------- */
    function report(){
      const score = rs.speak;
      $('rpNum').textContent = '0';
      $('rpList').innerHTML = frame.map((f, i) => `
        <li class="${rs.report[i] ? 'hit' : ''}">
          <span class="scb-mark">${rs.report[i] ? '✓' : '✗'}</span>
          <span class="scb-text">${f.s}</span></li>`).join('');
      show('reportScreen');
      count($('rpNum'), score, 900);
      $('rpCta').onclick = () => planFlow(score);
    }

    /* ---------- read: the speech meter ---------- */
    function meter(){
      const score = rs.read;
      $('mtRail').innerHTML = '<span class="trophy">🏆</span>' +
        LADDER.map(() => '<b></b><i></i>').join('').slice(0, -7);
      $('mtLabels').innerHTML = LADDER.map(([n, c]) =>
        `<p class="${n === 'Advanced' ? 'tgt' : ''}">${n}<small>${c}</small></p>`).join('');
      show('meterScreen');
      const badge = $('mtBadge');
      badge.textContent = score + '%';
      badge.style.top = '78%';
      /* the badge is where they ARE, one rung under the target */
      setTimeout(() => { badge.style.top = Math.min(80, Math.max(24, (100 - score) * 1.65)) + '%'; }, 500);
      $('mtCta').onclick = () => pron(score);
    }

    /* ---------- read: pronunciation fixes ---------- */
    function pron(score){
      show('pronScreen');
      $('pnValue').classList.add('is-off');
      $('pnCta').classList.add('is-off');
      let wi = 0;
      const card = () => {
        const d = rs.drill[wi];
        $('pnZone').innerHTML = `
          <div class="pron-card" id="pnCard">
            <div class="pc-top">
              <div><p class="pc-word">${d.w}</p><p class="pc-ph">${d.ph}</p></div>
              <button class="pc-play"><img src="assets/sarah-avatar.png" alt="">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            </div>
            <div class="pc-bottom">
              <div class="pc-score"><b id="pnScore">${d.from}</b><span>pronunciation</span></div>
              <div class="pc-right">
                <button class="pc-btn" id="pnBtn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
                  Say the word
                </button>
                <p class="pc-tip">Say it <b>slowly</b> first</p>
              </div>
            </div>
            <div class="pc-burst"></div>
          </div>`;
        $('pnBtn').onclick = () => {
          const btn = $('pnBtn');
          if (btn.classList.contains('listening') || btn.classList.contains('done')) return;
          btn.classList.add('listening'); btn.innerHTML = 'Listening…';
          setTimeout(() => {
            btn.classList.remove('listening'); btn.classList.add('done');
            btn.innerHTML = '✓ Heard it clearly';
            $('pnCard').classList.add('done');
            $('pnCard').insertAdjacentHTML('beforeend',
              '<div class="pc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg></div>');
            let v = parseInt($('pnScore').textContent, 10);
            const iv = setInterval(() => { $('pnScore').textContent = ++v; if (v >= 84) clearInterval(iv); }, 26);
            setTimeout(() => {
              if (++wi < rs.drill.length){ card(); }
              else {
                $('pnValue').classList.remove('is-off');
                $('pnCta').classList.remove('is-off');
              }
            }, 1300);
          }, 1400);
        };
      };
      card();
      $('pnCta').onclick = () => planFlow(score);
    }

    /* ---------- shared: loader → plan → promise → paywall ---------- */
    function planFlow(score){
      const items = ['Reading your speech', 'Picking your scenarios', 'Shaping week one'];
      $('ldList').innerHTML = items.map(t => `<li><i>✓</i>${t}</li>`).join('');
      show('loaderScreen');
      [...$('ldList').children].forEach((li, i) =>
        setTimeout(() => li.classList.add('on'), 600 + i * 750));
      setTimeout(() => plan(score), 600 + items.length * 750 + 500);
    }

    function plan(score){
      const pl = PLAN[room] || PLAN.manager;
      $('plEyebrow').textContent = name ? `Your plan, ${name}` : 'Your plan';
      $('plTitle').innerHTML = pl.title;
      $('plSub').textContent = 'Built from what you showed today.';
      $('plFrom').textContent = `Today · ${score}%`;
      $('plChecks').innerHTML = pl.checks.map(c => `<li>${c}</li>`).join('');
      $('plDone').textContent = '';
      $('plDone').insertAdjacentText('beforeend', pl.done);
      $('plNext').textContent = pl.next;
      show('planScreen');
      $('plCta').onclick = () => promise();
    }

    function promise(){
      $('prTitle').textContent = name ? `One small promise, ${name}.` : 'One small promise.';
      show('promiseScreen');
      $('prCta').onclick = () => { show('payScreen'); resolve(); };
    }

    function count(elm, to, ms){
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / ms);
        elm.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    if (path === 'read') meter();
    else report();
  });
};
