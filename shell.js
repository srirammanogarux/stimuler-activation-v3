/* ============================================================
   Activation v3 — the chat shell, demo only.
   One Sarah exchange to prove the UI. No flow decisions here;
   those get asked before they get built.
   ============================================================ */
'use strict';

const $  = id => document.getElementById(id);
const el = h => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const SARAH = 'assets/sarah-avatar.png';
const chatStream = $('chatStream');
const chatScroll = $('chatScroll');

function scrollToEnd(){
  requestAnimationFrame(() => chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: 'smooth' }));
}
function dimLast(){
  const last = chatStream.querySelector('.msg:last-of-type');
  if (last) last.classList.add('dim');
}
async function sarah(text, typingMs = 700){
  dimLast();
  const row = el(`<div class="msg"><div class="dp"><img src="${SARAH}" alt="Sarah"></div>
                  <div class="bubble typing"><i></i><i></i><i></i></div></div>`);
  chatStream.appendChild(row); scrollToEnd();
  await wait(typingMs);
  const b = row.querySelector('.bubble');
  b.classList.remove('typing'); b.innerHTML = `<p>${text}</p>`;
  scrollToEnd();
  await wait(Math.max(900, text.split(' ').length * 120));
}
function userChip(label){
  chatStream.appendChild(el(`<div class="chip-row"><div class="chip">${label}</div></div>`));
  scrollToEnd();
}
function options(items){
  return new Promise(resolve => {
    const wrap = el(`<div class="options"><p class="opt-head">Select an option</p><div class="opt-list"></div></div>`);
    const list = wrap.querySelector('.opt-list');
    items.forEach(label => {
      const btn = el(`<button class="opt"><span class="opt-label">${label}</span></button>`);
      btn.addEventListener('click', () => {
        btn.classList.add('selected');
        setTimeout(() => { wrap.remove(); userChip(label); resolve(label); }, 180);
      });
      list.appendChild(btn);
    });
    chatStream.appendChild(wrap); scrollToEnd();
  });
}
function setProgress(pct, label){
  $('progressFill').style.width = pct + '%';
  if (label) $('progressLabel').textContent = label;
}

/* ---------- shell demo: one exchange, nothing more ---------- */
(async function demo(){
  setProgress(0, 'Let’s get started');
  await wait(600);
  await sarah('Hey! I’m Sarah. This is the chat shell — same UI as the India onboarding.');
  await sarah('One sample question so every piece is on screen:');
  setProgress(8, '8% completed');
  await options(['An answer chip', 'Another option']);
  setProgress(16, 'Great!');
  await sarah('That’s the whole shell. The flow gets decided question by question — nothing else is built yet.');
})();
