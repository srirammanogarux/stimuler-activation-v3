/* ============================================================
   Activation v3 · step 5 — the score, and the close.
   Two variants, per the decision:
   · read / hinted → PRONUNCIATION lead: score ring + two words,
     tap-and-say, score climbs. (The framework was given to them,
     so pronunciation is the honest signal.)
   · impromptu (no hints) → REPORT lead: score + the win line +
     the 4 steps as ✓/✗, then the same two-word drill.
   Then: value line → journey → paywall stub.
   Exposes window.playScore(ctx) → resolves when paywall shows.
   ============================================================ */
'use strict';

const SCORE = {
  manager:  { read:74, speak:58, drill:['Friday','covered'],
    winMiss: { start:'You took four seconds to start. Let’s get that to two.',
               sustain:'You gave two lines, then stopped. There was more to say.',
               land:'Your ask arrived late. Put it first next time.',
               clear:'Two words didn’t land. Both are fixable right now.' },
    report:  [true, true, false, false],
    value:   'Five minutes ago, this conversation made you nervous. You just handled it.',
    wk1:     'Manager conversations — leave, deadlines, updates' },
  meetings: { read:72, speak:55, drill:['option','earlier'],
    winMiss: { start:'You took six seconds to start. Let’s get that to two.',
               sustain:'You gave two lines, then stopped. There was more to say.',
               land:'Your position came wrapped in a maybe. Say it straight.',
               clear:'Two words didn’t land. Both are fixable right now.' },
    report:  [true, true, false, false],
    value:   'You just did the thing you never do in meetings — said it first.',
    wk1:     'Meetings — taking a position and holding it' },
  present:  { read:75, speak:56, drill:['tracking','launch'],
    winMiss: { start:'You took five seconds to start. Let’s get that to two.',
               sustain:'You gave three lines, then trailed off. Finish the arc.',
               land:'Your point arrived only at the end. Put it first.',
               clear:'Two words didn’t land. Both are fixable right now.' },
    report:  [true, true, false, false],
    value:   'That’s the first time your work got the words it deserves.',
    wk1:     'Presenting — your work, said the way it deserves' },
};
const DRILL_LIFT = 12;

const JOURNEY_TAIL = [
  { wk:'Week 3', what:'Holding your own in any room at work' },
  { wk:'Week 5', what:'Thinking in English, not translating' },
  { wk:'Week 8', what:'Walking in with something to say — every time' },
];

window.playScore = function({ room, win, path, hintUsed, frame, name }){
  return new Promise(resolve => {
    const $ = id => document.getElementById(id);
    const sc = SCORE[room] || SCORE.manager;
    const pronounceLead = (path === 'read') || hintUsed;
    const base = path === 'read' ? sc.read : sc.speak;

    /* ---- fill ---- */
    $('scEyebrow').textContent = 'Your speech score';
    $('scNum').textContent = '0';

    if (pronounceLead){
      /* pronunciation flow: no report; straight to the two words */
      $('scOpen').textContent = path === 'read'
        ? 'You said the whole thing out loud. Two words to sharpen —'
        : 'Good — the structure was there. Two words to sharpen —';
      $('scReport').innerHTML = '';
      $('scReport').style.display = 'none';
    } else {
      /* impromptu report: the win line + the four steps */
      $('scOpen').textContent = sc.winMiss[win] || sc.winMiss.sustain;
      $('scReport').style.display = '';
      $('scReport').innerHTML = frame.map((f, i) => `
        <li class="${sc.report[i] ? 'hit' : ''}">
          <span class="scb-mark">${sc.report[i] ? '✓' : '✗'}</span>
          <span class="scb-text">${f.s}</span></li>`).join('');
    }

    $('scDrillLabel').textContent = 'Tap each word and say it —';
    $('scWords').innerHTML = sc.drill.map(w =>
      `<button class="word-chip"><span class="w-ic">🎙</span>${w}</button>`).join('');
    $('scValue').textContent = sc.value;
    $('scValue').classList.add('is-off');
    $('scCta').classList.add('is-off');

    /* ---- show + count ---- */
    ['momentScreen','scoreScreen'].forEach(s =>
      $(s).classList.toggle('is-hidden', s !== 'scoreScreen'));
    setTimeout(() => countTo($('scNum'), base, 900), 350);

    /* ---- the drill ---- */
    let done = 0;
    [...$('scWords').children].forEach(chip => chip.addEventListener('click', async () => {
      if (chip.classList.contains('done') || chip.classList.contains('saying')) return;
      chip.classList.add('saying');
      await new Promise(r => setTimeout(r, 1250));
      chip.classList.remove('saying'); chip.classList.add('done');
      chip.querySelector('.w-ic').textContent = '✓';
      if (++done === sc.drill.length){
        countTo($('scNum'), Math.min(96, base + DRILL_LIFT), 1000);
        $('scValue').classList.remove('is-off');
        $('scCta').classList.remove('is-off');
      }
    }));

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

    function countTo(elm, to, ms){
      const from = parseInt(elm.textContent, 10) || 0;
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / ms);
        elm.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  });
};
