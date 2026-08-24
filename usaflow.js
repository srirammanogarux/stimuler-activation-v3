/* ============================================================
   USA practice subsystem — driver lifted from onboarding-form
   (v1) with a thin shim binding it to this prototype's data.
   Entry:  window.enterUSA({room, mode, name, level})
           → resolves when the loader finishes (plan is next)
   Then:   window.usaLetter() → resolves after the seal
   ============================================================ */
'use strict';

/* ---------------- shim: state + content ---------------- */
const answers = { name:'', qlevel:'B1', qskill:'fluency', minutes:15,
                  qtime:'quarter', qgoal:'career', jtbdLabel:'', q5:'', usedHint:false };
const reduced = false;
let   EMBED = false;
const appEl = () => document.getElementById('usaFlow');

const USA_WORD = {
  Friday:   { w:'Friday',   parts:['Fri','da','y'],   ph:'fry.day',      tip:'Two beats: ‘fry’ then ‘day’',   start:54 },
  wedding:  { w:'wedding',  parts:['we','ddi','ng'],  ph:'weh.ding',     tip:'The ‘dd’ stays soft',           start:51 },
  option:   { w:'option',   parts:['op','tio','n'],   ph:'op.shun',      tip:'The ‘tio’ says ‘shun’',         start:53 },
  earlier:  { w:'earlier',  parts:['ear','li','er'],  ph:'ur.lee.ur',    tip:'Starts on ‘ur’, not ‘ear’',     start:50 },
  losing:   { w:'losing',   parts:['lo','si','ng'],   ph:'loo.zing',     tip:'The ‘s’ is a soft ‘z’',         start:55 },
  statuses: { w:'statuses', parts:['sta','tus','es'], ph:'stay.tus.iz',  tip:'Three beats, ends on ‘iz’',     start:52 },
};
const USA_SCEN = {
  manager: { label:'Talking to your manager',
    ctx:'Your manager looks up from his laptop.',
    q:'Yeah, I heard you want a day off next week. What’s it about?',
    steps:['Make the ask','Give the reason','Cover the gap','Confirm'],
    parts:['I’d like to take next Friday off.','It’s my cousin’s wedding.',
           'My tasks for the week are done, and I’ll hand the client file to Maria on Thursday.',
           'Would that be okay?'],
    pron:[USA_WORD.Friday, USA_WORD.wedding] },
  meetings: { label:'Speaking up in meetings',
    ctx:'The room goes quiet. He turns to you.',
    q:'We’re leaning towards option A. Thoughts?',
    steps:['Take a position','Give one reason','Name the trade-off','Invite the room'],
    parts:['I’d go with option B.','It gets us to launch two weeks earlier.',
           'The risk is the migration, but we can stage that.','Does that work for everyone?'],
    pron:[USA_WORD.option, USA_WORD.earlier] },
  present: { label:'Presenting your work',
    ctx:'Your work is on the screen. Everyone waits.',
    q:'Alright, walk us through it.',
    steps:['Say what it is','Why it matters','What you did','End with what’s next'],
    parts:['This is the new order-tracking screen.','We were losing an hour a day checking statuses by hand.',
           'I built one view that shows every order live.','Next month we roll it out to the whole team.'],
    pron:[USA_WORD.losing, USA_WORD.statuses] },
};
let usaScen = USA_SCEN.manager;
let usaResolve = null;

const practiceSet   = () => usaScen;
const practiceQ     = () => usaScen.q;
const practiceCtx   = () => usaScen.ctx || '';
const practiceMode  = () => 'hint';
const isBeginner    = () => false;
const readingParts  = () => usaScen.parts;
const pronSet       = () => usaScen.pron;
const practiceES = () => null, readingES = () => null, affirmES = () => null;
const esOn = () => false, applyES = () => {};
const FAMILIES = {}, INDUSTRIES = {}; const occKey = () => 'other';

const SCORE_BASE = { fluency:64, vocabulary:58, pronunciation:61, grammar:71 };
const SCORE_MSG = {
  fluency:{ weak:'Long pauses broke your answer up.', mid:'You paused a few times mid-sentence.', strong:'You kept going without stopping.' },
  vocabulary:{ weak:'You reached for the same few words.', mid:'Your words worked, but they repeated.', strong:'You reached for the right words.' },
  pronunciation:{ weak:'Some words were hard to catch.', mid:'A few sounds landed soft.', strong:'You were easy to understand.' },
  grammar:{ weak:'Tenses slipped more than once.', mid:'A couple of tense slips crept in.', strong:'Your sentences held together.' },
};
const SCORE_LABEL = { fluency:'Fluency', vocabulary:'Vocabulary', pronunciation:'Pronunciation', grammar:'Grammar' };
const ANALYSING = [
  { t:'You spoke your very first sentence in English.', ms:1900 },
  { t:'Analysing your speech.', ms:1300 },
  { t:'Evaluating your grammar.', ms:1300 },
  { t:'Evaluating your pronunciation.', ms:1300 },
  { t:'Almost there.', ms:0 },
];

const HS_LEVELS=['Proficient','Advanced','Upper intermediate','Intermediate','Beginner','Novice'];
const HS_CEFR={'Proficient':'C2','Advanced':'C1','Upper intermediate':'B2','Intermediate':'B1','Beginner':'A2','Novice':'A1'};
const HS_POS=[8,25.5,43,60.5,78,95.5];
const LVLSCORE={A1:22,A2:32,B1:45,B2:58,C1:74,C2:86};
const RUNG_SCORE={Novice:0,Beginner:32,Intermediate:52,'Upper intermediate':68,Advanced:82,Proficient:93};
const LVLNAME={A1:'Novice',A2:'Beginner',B1:'Intermediate',B2:'Upper intermediate',C1:'Advanced',C2:'Proficient'};
function targetLevelName(){
  const i=HS_LEVELS.indexOf(LVLNAME[answers.qlevel]||'Beginner');
  return HS_LEVELS[Math.max(0,i-2)];
}
const isAdvancedLearner=()=>['B2','C1','C2'].includes(answers.qlevel);
const curLevelName=()=>LVLNAME[answers.qlevel]||'Beginner';
const goalLevelName=()=>targetLevelName();

const U = id => document.getElementById(id);

/* screen switching inside #usaFlow; 'plan' and 'paywall' exit to the host */
function go(id){
  appEl().querySelectorAll(':scope > .screen').forEach(s=>s.classList.toggle('is-active', s.id===id));
  renderUSA(id);
}
function leaveUSA(){
  appEl().classList.add('is-hidden');
  appEl().querySelectorAll(':scope > .screen').forEach(s=>s.classList.remove('is-active'));
}
window.enterUSA = function({ room, mode, name, level }){
  usaScen = USA_SCEN[room] || USA_SCEN.manager;
  answers.name = name || 'friend';
  answers.qlevel = { beginner:'A2', intermediate:'B1', advanced:'C1' }[level] || 'B1';
  answers.jtbdLabel = usaScen.label;
  appEl().classList.remove('is-hidden');
  return new Promise(res=>{
    usaResolve = res;
    if(mode==='learn'){ ahFromBulb=false; go('acthint'); }
    else go('act');
  });
};

function renderUSA(id){
  if(id==='act'){
    const actCtx=U('actCtx');
    actCtx.textContent=practiceCtx(); actCtx.hidden=!practiceCtx();
    U('actEs').hidden=true;
    U('actQ').textContent='“'+practiceQ()+'”';
    U('actMode').innerHTML='';
    U('actTip').textContent='Answer in your own words';
    const b=U('actBulb');
    b.classList.remove('show');b.hidden=true;
    U('micRow').classList.remove('hint-active');
    clearTimeout(actHintT);
    const tip=document.querySelector('#actBulb .hint-tip');
    if(tip)tip.textContent=isAdvancedLearner()?'See a model answer':'Can’t find words? Try this';
    actHintT=setTimeout(()=>{
      if(!U('act').classList.contains('is-active'))return;
      b.hidden=false;void b.offsetWidth;b.classList.add('show');
      U('micRow').classList.add('hint-active');
    },5000);
  }
  if(id==='acthint')enterActHint();
  if(id==='hintscore')enterHintScore();
  if(id==='listen')startListen();
  if(id==='analysing')enterAnalysing();
  if(id==='score')runScore({label:usaScen.label},null,false);
  if(id==='loader')runLoader(answers.name);
  if(id==='plan')fillPlanUSA();
  if(id==='letter')fillLetter();
  if(id==='paywall')fillPaywall();
}

/* ---------------- plan (v1 anatomy, our content) ---------------- */
const PLAN_COPY = {
  manager:  { claim:'asking your manager stops needing a rehearsal',
    checks:['Ask for time off in one clear breath','Hold deadline conversations without tensing up','Give updates people can follow','Push back politely, and keep the room warm'],
    sessions:['Asking for a day off','Moving a deadline','Giving your Monday update'] },
  meetings: { claim:'the room waits for what you think',
    checks:['Take a position without a wind-up','Give the reason that lands','Name the trade-off before they do','Bring the room with you'],
    sessions:['Backing option B','Disagreeing with the plan','Thinking aloud in a sync'] },
  present:  { claim:'your work gets the words it deserves',
    checks:['Open without freezing','Explain the impact in numbers','Say your part without shrinking','Close with a next step'],
    sessions:['The three-minute demo','Handling the first question','Closing with the rollout'] },
};
function fillPlanUSA(){
  const pc = PLAN_COPY[Object.keys(USA_SCEN).find(k=>USA_SCEN[k]===usaScen)] || PLAN_COPY.manager;
  const name = answers.name || 'friend';
  U('planEyebrow').textContent='Your personal plan is ready';
  U('planTitle').innerHTML=name+', in <em>3 months</em>, '+pc.claim+'.';
  U('planSub').hidden=true;
  U('outHeadB').textContent='By November, here is what changes';
  U('planTraj').innerHTML=trajHTML('2',curLevelName(),null,goalLevelName());
  U('outLead').textContent='By then you will be able to';
  const CH='<i><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i>';
  U('planChecks').innerHTML=pc.checks.map(t=>`<li>${CH}<span>${t}</span></li>`).join('');
  U('pjTitle').textContent=usaScen.label;
  U('pjBody').textContent='Everything above is built out of this. Here are the first three sessions.';
  U('pjList').innerHTML=pc.sessions.map((t,i)=>`<li><b>${t}</b><em>Day ${i+1} · ${answers.minutes} min</em></li>`).join('');
  /* the deeper personalization cards need the full funnel; hide them here */
  ['pbento','pfocus'].forEach(c=>{const el=document.querySelector('#usaFlow .'+c); if(el)el.style.display='none';});
  const fits=document.querySelector('#usaFlow #planFits'); if(fits)fits.closest('.pcard').style.display='none';
  U('ppSub').textContent='learners started exactly here';
  document.querySelector('#plan .plan-cta .btn').onclick=()=>go('letter');
}

/* ---------------- letter fill ---------------- */
function fillLetter(){
  holdDone=false;
  U('letter').classList.remove('sealed','sealing');
  seal.classList.remove('on','grow','said');
  U('holdHint').textContent='Press and hold to commit';
  U('letterHead').textContent='A note from future '+(answers.name||'you');
  U('letterBody').textContent='“The meeting came. I asked, plainly, and got my yes. Ten minutes a day got me here.”';
  U('letterSign').textContent=(answers.name||'You')+', 12 weeks from now';
  U('pledgeLine').textContent='I, '+(answers.name||'friend')+', will practice '+answers.minutes+' minutes a day.';
}

/* ---------------- paywall (v1, verbatim shell) ---------------- */
function fillPaywall(){
  U('pwTitle').textContent='Unlock '+(answers.name||'your')+'’s plan';
  const FEATS=[
    ['🎙','Unlimited speaking scenarios, starting with yours'],
    ['🗣','Real-time feedback on every sentence'],
    ['📈','Your level, tracked week by week'],
    ['🧑‍🏫','Sarah in every session'],
  ];
  U('pwFeats').innerHTML=FEATS.map(([ic,t])=>
    `<div style="display:flex;align-items:center;gap:10px;font-size:14.5px;color:var(--text-mid)"><span>${ic}</span><span>${t}</span></div>`).join('');
  document.querySelector('#paywall .fcta .btn').onclick=()=>{
    if(usaResolve){const r=usaResolve;usaResolve=null;r();}
  };
}

/* ---------------- confetti (lifted) ---------------- */
let confC=null,confCtx=null,confParts=[],confRaf=null;
function confetti(n=90,mode='burst'){
  if(reduced)return;
  const host=appEl();
  if(!confC){confC=document.createElement('canvas');confC.id='confettiC';host.appendChild(confC);confCtx=confC.getContext('2d');}
  confC.width=host.clientWidth;confC.height=host.clientHeight;
  const cols=['#FF5A5F','#FFC400','#4FC3F7','#9C6BFF','#4CD964','#F0A32F','#A8A1FF','#F5F4FA'];
  const rain=mode==='rain';
  for(let i=0;i<n;i++)confParts.push({
    x:rain?Math.random()*confC.width:confC.width/2+(Math.random()-.5)*120,
    y:rain?-30-Math.random()*confC.height*.6:confC.height*.38,
    vx:(Math.random()-.5)*(rain?2.4:9),
    vy:rain?2+Math.random()*3:-4-Math.random()*7,
    g:rain?.045+Math.random()*.05:.22+Math.random()*.12,
    s:6+Math.random()*7,ar:.5+Math.random()*1.4,
    r:Math.random()*Math.PI,vr:(Math.random()-.5)*.35,
    sway:rain?.6+Math.random()*1.6:0,ph:Math.random()*6.28,
    c:cols[i%cols.length],life:1,decay:rain?.0058:.012
  });
  if(!confRaf)confTick();
}
function confTick(){
  confCtx.clearRect(0,0,confC.width,confC.height);
  confParts=confParts.filter(p=>p.life>0);
  confParts.forEach(p=>{
    p.x+=p.vx+(p.sway?Math.sin(p.ph+=.045)*p.sway*.45:0);
    p.y+=p.vy;p.vy+=p.g;p.r+=p.vr;p.life-=p.decay;
    confCtx.save();confCtx.translate(p.x,p.y);confCtx.rotate(p.r);
    confCtx.globalAlpha=Math.max(0,Math.min(1,p.life*1.6));confCtx.fillStyle=p.c;
    confCtx.fillRect(-p.s/2,-p.s*p.ar/2,p.s,p.s*p.ar);confCtx.restore();
  });
  confRaf=confParts.length?requestAnimationFrame(confTick):null;
}

/* ---------------- listen (lifted) ---------------- */
let recInt=null,waveInt=null,recSec=0,recPaused=false;
function startListen(){
  const lisCtx=U('lisCtx');
  lisCtx.textContent=practiceCtx(); lisCtx.hidden=!practiceCtx();
  U('lisQ').textContent='“'+practiceQ()+'”';
  recSec=0;recPaused=false;
  U('recTimer').textContent='0:00';
  U('pauseLink').textContent='Pause';
  U('lisState').textContent='listening…';
  clearInterval(recInt);
  recInt=setInterval(()=>{
    if(recPaused)return;
    recSec++;
    U('recTimer').textContent=`${Math.floor(recSec/60)}:${String(recSec%60).padStart(2,'0')}`;
    if(recSec>=25)stopListen();
  },1000);
  const dots=[...document.querySelectorAll('#listen .pr-wave i')];
  let wt=0;
  clearInterval(waveInt);
  waveInt=setInterval(()=>{
    if(recPaused)return;
    wt+=90;
    const gate=Math.sin(wt/1400)>-0.35?1:0.14;
    dots.forEach((d,i)=>{
      const amp=gate*(0.5+Math.random()*2.6)*(0.65+0.35*Math.sin(wt/300+i*1.7));
      d.style.transform=`scaleY(${Math.max(.6,amp).toFixed(2)})`;
    });
  },90);
}
function stopListen(){clearInterval(recInt);clearInterval(waveInt);recInt=null;go('score');}
U('stopBtn').addEventListener('click',stopListen);
U('recX').addEventListener('click',()=>{clearInterval(recInt);clearInterval(waveInt);recInt=null;go('act');});
U('pauseLink').addEventListener('click',()=>{
  recPaused=!recPaused;
  U('pauseLink').textContent=recPaused?'Resume':'Pause';
  U('lisState').textContent=recPaused?'paused':'listening…';
  if(recPaused)document.querySelectorAll('#listen .pr-wave i').forEach(d=>d.style.transform='scaleY(.6)');
});

/* ---------------- analysing (lifted) ---------------- */
const ANA_MIN=3000, ANA_MAX=12000;
let anaTimers=[],anaReady=false,anaLeft=false,anaT0=0,anaIdx=0;
function anaClear(){anaTimers.forEach(clearTimeout);anaTimers=[];}
function anaShow(i){
  anaIdx=i;
  const el=U('anaLine');
  el.classList.add('out');
  setTimeout(()=>{ el.textContent=ANALYSING[i].t; el.classList.remove('out'); },i===0?0:320);
  U('anaBar').style.width=Math.round(((i+1)/ANALYSING.length)*88)+'%';
}
function enterAnalysing(){
  anaClear();anaReady=false;anaLeft=false;anaT0=performance.now();
  U('anaLine').textContent='';
  U('anaBar').style.width='0%';
  let at=0;
  ANALYSING.forEach((l,i)=>{ anaTimers.push(setTimeout(()=>anaShow(i),at)); at+=l.ms||0; });
  anaTimers.push(setTimeout(resultsReady,ANA_MAX));
  anaTimers.push(setTimeout(resultsReady,5000+Math.floor(Math.random()*3000)));
}
function resultsReady(){ if(anaReady)return; anaReady=true; anaFinish(); }
function anaFinish(){
  if(anaLeft||!anaReady)return;
  const waited=performance.now()-anaT0;
  if(waited<ANA_MIN){setTimeout(anaFinish,ANA_MIN-waited);return;}
  anaLeft=true; anaClear();
  const last=ANALYSING.length-1;
  if(anaIdx!==last)anaShow(last);
  U('anaBar').style.width='100%';
  const dest = usaFromRead ? 'hintscore' : 'score';
  setTimeout(()=>go(dest),anaIdx===last?420:800);
}
let usaFromRead=false;

/* ---------------- hintscore (lifted) ---------------- */
let hsT1,hsT2,hsWordIdx=0,hsScoreT,hsRaf;
function hsPosForScore(sc){
  const A=[[0,95.5],[52,70],[80,43],[100,8]];
  for(let i=1;i<A.length;i++){
    if(sc<=A[i][0]){
      const[s0,p0]=A[i-1],[s1,p1]=A[i];
      return p0+(p1-p0)*((sc-s0)/(s1-s0));
    }
  }
  return 8;
}
function hsAnimateScore(from,to,dur,done){
  const bub=U('hsBub'),pct=U('hsPct');
  const t0=performance.now();
  cancelAnimationFrame(hsRaf);
  const step=now=>{
    const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);
    const sc=from+(to-from)*e;
    pct.textContent=Math.round(sc)+'%';
    bub.style.top=hsPosForScore(sc)+'%';
    if(k<1)hsRaf=requestAnimationFrame(step);
    else if(done)done();
  };
  hsRaf=requestAnimationFrame(step);
}
function enterHintScore(){
  answers.usedHint=true;
  const track=U('hsTrack'),labels=U('hsLabels');
  if(!track.children.length){
    let t='<svg class="lv-cup" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2h3v3c0 2.4-1.9 4.3-4.3 4.5A6 6 0 0 1 13 16v2.5h3.5V21h-9v-2.5H11V16a6 6 0 0 1-3.7-3.5C4.9 12.3 3 10.4 3 8V5h3V3zm-1 4v1c0 1.2.8 2.3 2 2.7V7H5zm14 0h-2v3.7c1.2-.4 2-1.5 2-2.7V7z"/></svg>';
    let l='';
    HS_POS.forEach((pos,i)=>{
      if(i>0)t+=`<i class="lv-dot" style="top:${pos}%"></i>`;
      if(i<5){t+=`<i class="lv-tick" style="top:${pos+5.5}%"></i><i class="lv-tick" style="top:${pos+11}%"></i>`;}
      l+=`<span style="top:${pos}%" data-lv="${HS_LEVELS[i]}">${HS_LEVELS[i]}<i>${HS_CEFR[HS_LEVELS[i]]}</i></span>`;
    });
    track.innerHTML=t;labels.innerHTML=l;
  }
  ['hsMeterView','hsErrorsView','hsPracticeView','hsDoneView'].forEach((v,i)=>U(v).hidden=i>0);
  U('hintscore').classList.remove('pron-flat');
  U('hsPracticeView').classList.remove('alldone');
  U('hsFill').parentElement.classList.remove('win');
  const view=U('hsMeterView');
  view.classList.remove('gold');
  U('hsSay').textContent=isAdvancedLearner()
    ? 'You already speak well. I scored the delivery, which is where the last few points hide.'
    : 'You used the hint, so I scored your speech on pronunciation first. Here is where you stand.';
  U('hsFixSub').textContent='Two words from your answer need work.';
  U('hsHead').innerHTML='Your<br>speech<br>level';
  U('hsNext1').style.visibility='hidden';
  document.querySelectorAll('#hsLabels span').forEach(sp=>sp.classList.remove('tgt'));
  U('hsPct').textContent='0%';
  U('hsBub').style.top='95.5%';
  clearTimeout(hsT1);clearTimeout(hsT2);
  const lvl=answers.qlevel||'B1';
  const myScore=LVLSCORE[lvl]||45;
  const tgtName=targetLevelName();
  const tgtScore=RUNG_SCORE[tgtName]||80;
  hsT1=setTimeout(()=>{
    hsAnimateScore(0,myScore,1700,()=>{
      confetti(80);
      U('hsSay').textContent='You placed yourself at '+lvl+'. Under pressure you came in just below it. That gap is the whole game.';
      hsT2=setTimeout(()=>{
        view.classList.add('gold');
        U('hsSay').textContent='And this is where we are taking you. '+tgtName+', in about three months.';
        U('hsHead').innerHTML="Let's take<br>you to<br><em>"+tgtName+"</em>";
        const tl=document.querySelector('#hsLabels span[data-lv="'+tgtName+'"]');
        if(tl)tl.classList.add('tgt');
        hsAnimateScore(myScore,tgtScore,1500,()=>{U('hsNext1').style.visibility='visible';});
      },1800);
    });
  },500);
}
function hsPassageHTML(){
  const words=pronSet();
  const all=readingParts().join(' ').split(/(?<=[.?!])\s+/).filter(Boolean);
  const keep=all.filter(sn=>words.some(pw=>new RegExp('\\b'+pw.w+'\\b','i').test(sn)));
  let text=(keep.length?keep:all).join(' ');
  words.forEach((pw,i)=>{text=text.replace(new RegExp('\\b'+pw.w+'\\b','i'),m=>`<b class="hlw" data-i="${i}">${m}</b>`);});
  return '<p class="ah-para">'+text+'</p>';
}
U('hsNext1').addEventListener('click',()=>{
  U('hintscore').classList.add('pron-flat');
  U('hsMeterView').hidden=true;
  U('hsPassage').innerHTML=hsPassageHTML();
  U('hsErrorsView').hidden=false;
});
U('hsFix').addEventListener('click',()=>{
  U('hsErrorsView').hidden=true;
  U('hsPracticeView').hidden=false;
  U('hsPracPassage').innerHTML=hsPassageHTML();
  hsWordIdx=0;hsLoadWord();
});
function hsLoadWord(){
  const words=pronSet();
  const pw=words[hsWordIdx];
  const fill=U('hsFill');
  fill.parentElement.classList.remove('win');
  fill.style.width=(hsWordIdx===0?8:50)+'%';
  document.querySelectorAll('#hsPracPassage .hlw').forEach(el=>{
    const i=+el.dataset.i;
    el.classList.toggle('ok',i<hsWordIdx);
    el.classList.toggle('idle',i>hsWordIdx);
  });
  U('pcWord').innerHTML=pw.parts[0]+'<i>'+pw.parts[1]+'</i>'+pw.parts[2];
  U('pcPh').textContent=pw.ph;
  U('pcTip').innerHTML=pw.tip.replace(/‘([^’]+)’/,'<b>‘$1’</b>');
  U('pcScore').textContent=pw.start+'%';
  const card=U('pronCard');
  card.classList.remove('done');
  card.querySelector('.pc-check').hidden=true;
  const btn=U('pcBtn');
  btn.classList.remove('listening','done');
  U('pcBtnT').textContent='Tap to speak';
  const st=U('hsState');st.classList.remove('ok');st.textContent='Let’s practice this word';
}
U('pcBtn').addEventListener('click',()=>{
  const btn=U('pcBtn');
  if(btn.classList.contains('listening')||btn.classList.contains('done'))return;
  btn.classList.add('listening');
  U('pcBtnT').textContent='Listening…';
  U('hsState').textContent='Speak the word clearly…';
  setTimeout(hsWordDone,2600);
});
function hsWordDone(){
  const words=pronSet();
  const pw=words[hsWordIdx];
  const btn=U('pcBtn');
  btn.classList.remove('listening');btn.classList.add('done');
  U('pcBtnT').textContent='Completed';
  const card=U('pronCard');
  card.classList.add('done');
  card.querySelector('.pc-check').hidden=false;
  const st=U('hsState');st.classList.add('ok');st.textContent='Nice. That sounded clear.';
  let sc=pw.start;
  clearInterval(hsScoreT);
  hsScoreT=setInterval(()=>{
    sc+=2;
    U('pcScore').textContent=Math.min(80,sc)+'%';
    if(sc>=80)clearInterval(hsScoreT);
  },40);
  const fill=U('hsFill');
  fill.style.width=(hsWordIdx===0?50:100)+'%';
  fill.parentElement.classList.add('win');
  const hl=document.querySelector(`#hsPracPassage .hlw[data-i="${hsWordIdx}"]`);
  if(hl)hl.classList.add('ok');
  setTimeout(()=>{
    if(hsWordIdx===0){hsWordIdx=1;hsLoadWord();}
    else hsShowDone();
  },hsWordIdx===0?1700:2200);
}
U('pcSkip').addEventListener('click',()=>{
  if(hsWordIdx===0){hsWordIdx=1;hsLoadWord();}
  else hsShowDone();
});
function trajHTML(uid,p0,p1,p2){
  return `<div class="tr-wrap">
    <svg viewBox="0 0 300 262" class="hs-trajsvg">
      <defs><linearGradient id="trFill${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(139,132,255,.22)"/><stop offset="1" stop-color="rgba(139,132,255,0)"/></linearGradient></defs>
      <g class="tr-axis"><line x1="32" y1="232" x2="32" y2="30"/><line x1="32" y1="232" x2="288" y2="232"/></g>
      <path class="tr-arrow" d="M32 25l-3.6 6h7.2z"/><path class="tr-arrow" d="M293 232l-6-3.6v7.2z"/>
      <text class="tr-axlab" x="42" y="36">Level</text><text class="tr-axlab" x="42" y="248">Time</text>
      <path class="tr-area" d="M58,208 C96,204 120,188 150,152 C180,116 210,62 252,54 L252,232 L58,232 Z" fill="url(#trFill${uid})"/>
      <g class="tr-drop">${p1?'<line x1="150" y1="154" x2="150" y2="232"/>':''}<line x1="252" y1="58" x2="252" y2="232"/></g>
      <path class="tr-line" pathLength="1" d="M58,208 C96,204 120,188 150,152 C180,116 210,62 252,54"/>
      <circle class="tr-d0" cx="58" cy="208" r="5"/>
      <text class="tr-lab tr-l0" x="38" y="190">${p0}</text>
      ${p1?`<circle class="tr-d1" cx="150" cy="152" r="6.5"/><text class="tr-lab tr-l1" x="136" y="126" text-anchor="end">${p1}</text>`:''}
      <circle class="tr-glow" cx="252" cy="54" r="18"/>
      <circle class="tr-d2" cx="252" cy="54" r="9"/>
      <path class="tr-tick" d="M248 54.4l3 3 5.4-5.6" fill="none" stroke="#241500" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="tr-pill p2">${p2}</span>
  </div>`;
}
function hsShowDone(){
  const words=pronSet();
  U('hintscore').classList.remove('pron-flat');
  U('hsPracticeView').classList.add('alldone');
  U('hsFill').style.width='100%';
  document.querySelectorAll('#hsPracPassage .hlw').forEach(w=>w.classList.add('ok'));
  U('hsPracticeView').hidden=true;
  U('hsDoneSub').textContent=`You practiced “${words[0].w}” and “${words[1].w}”. Real progress already.`;
  U('hsTraj').innerHTML=trajHTML('1',curLevelName(),'First step',goalLevelName());
  U('hsDoneView').hidden=false;
  setTimeout(()=>confetti(100),400);
}
U('hsGo').addEventListener('click',()=>go('loader'));

/* ---------------- acthint (lifted) ---------------- */
let actHintT,ahIdx=0,ahPhase='explain',ahReadT,ahFromBulb=false;
function enterActHint(){
  const sc=practiceSet();
  U('ahCard').innerHTML=sc.parts.map((pt,i)=>
    `<div class="seg"><span class="st">${sc.steps[i]}</span><p>${pt}</p></div>`).join('');
  U('ahCard').classList.remove('readmode');
  U('ahCard').style.minHeight='';
  U('acthint').classList.remove('done');
  U('ahCtx').hidden=true;
  U('acthint').classList.remove('reading');
  U('ahTitle').hidden=false;
  U('ahEye').textContent='How to answer';
  U('ahTitle').textContent='A simple 4-part answer.';
  ahIdx=0;ahPhase='explain';clearInterval(ahReadT);
  U('ahNext').hidden=false;
  U('ahMicRow').hidden=true;
  U('ahTip').style.opacity='';
  U('ahPill').hidden=true;
  U('ahPause').hidden=true;
  ahRender();
}
function ahRender(){
  document.querySelectorAll('#ahCard .seg').forEach((el,i)=>{
    el.classList.toggle('cur',i===ahIdx);
    el.classList.toggle('dim',i>ahIdx);
  });
  U('ahFill').style.width=Math.max(6,ahIdx/8*100)+'%';
  U('ahNext').innerHTML=ahIdx===3?'Read it aloud':'Next';
}
U('ahNext').addEventListener('click',()=>{
  if(ahPhase!=='explain')return;
  if(ahIdx<3){ahIdx++;ahRender();}
  else ahEnterRead();
});
function ahEnterRead(){
  ahPhase='read';
  const card=U('ahCard');
  card.style.minHeight=card.offsetHeight+'px';
  U('acthint').classList.add('reading');
  const cx=U('ahCtx'), ttl=U('ahTitle');
  ttl.hidden=false;
  U('ahEye').textContent='Try reading this';
  cx.textContent=practiceCtx(); cx.hidden=ahFromBulb||!practiceCtx();
  ttl.textContent='“'+practiceQ()+'”';
  card.innerHTML='<p class="ah-para" id="ahPara">'+readingParts().join(' ').split(' ').map(w=>`<span class="w">${w}</span>`).join(' ')+'</p>';
  card.classList.remove('showes');
  card.classList.add('readmode');
  U('ahNext').hidden=true;
  U('ahMicRow').hidden=false;
  U('ahFill').style.width='50%';
}
let ahPaused=false,ahWaveT;
function ahFinishRead(){
  clearInterval(ahReadT);clearInterval(ahWaveT);
  document.querySelectorAll('#ahPara .w').forEach(w=>w.classList.add('g'));
  U('ahFill').style.width='100%';
  U('acthint').classList.add('done');
  U('ahPill').hidden=true;
  U('ahPause').hidden=true;
  usaFromRead=true;
  setTimeout(()=>go('hintscore'),1400);
}
U('ahMic').addEventListener('click',()=>{
  if(ahPhase!=='read')return;
  startAhRead();
});
function startAhRead(){
  ahPhase='reading';ahPaused=false;
  U('ahMicRow').hidden=true;
  U('ahPill').hidden=false;
  U('ahPause').hidden=false;
  U('ahPause').textContent='Pause';
  const words=[...document.querySelectorAll('#ahPara .w')];
  let k=0;
  ahReadT=setInterval(()=>{
    if(ahPaused)return;
    words[k].classList.add('g');
    k++;
    U('ahFill').style.width=(50+k/words.length*50)+'%';
    if(k>=words.length)ahFinishRead();
  },240);
  const dots=[...document.querySelectorAll('#ahPill .pr-wave i')];
  let wt=0;
  clearInterval(ahWaveT);
  ahWaveT=setInterval(()=>{
    if(ahPaused)return;
    wt+=90;
    const gate=Math.sin(wt/1400)>-0.35?1:0.14;
    dots.forEach((d,i)=>{
      const amp=gate*(0.5+Math.random()*2.6)*(0.65+0.35*Math.sin(wt/300+i*1.7));
      d.style.transform=`scaleY(${Math.max(.6,amp).toFixed(2)})`;
    });
  },90);
}
U('ahX').addEventListener('click',()=>{
  clearInterval(ahReadT);clearInterval(ahWaveT);
  ahPhase='read';
  document.querySelectorAll('#ahPara .w').forEach(w=>w.classList.remove('g'));
  U('ahFill').style.width='50%';
  U('ahPill').hidden=true;
  U('ahPause').hidden=true;
  U('ahMicRow').hidden=false;
  U('ahTip').style.opacity='';
});
U('ahOk').addEventListener('click',ahFinishRead);
U('ahPause').addEventListener('click',()=>{
  ahPaused=!ahPaused;
  U('ahPause').textContent=ahPaused?'Resume':'Pause';
  if(ahPaused)document.querySelectorAll('#ahPill .pr-wave i').forEach(d=>d.style.transform='scaleY(.6)');
});

/* act mic + bulb; the permission dialog is honored */
let micGranted=false,micThen=null;
U('actMic').addEventListener('click',()=>{
  if(!micGranted){micThen=()=>{usaFromRead=false;go('listen');};U('micPerm').hidden=false;return;}
  clearTimeout(actHintT);usaFromRead=false;go('listen');
});
U('micAllow').addEventListener('click',()=>{
  micGranted=true;
  U('micPerm').hidden=true;
  if(micThen){const f=micThen;micThen=null;clearTimeout(actHintT);f();return;}
});
U('micDeny').addEventListener('click',()=>{U('micPerm').hidden=true;});
U('actBulb').addEventListener('click',()=>{ahFromBulb=true;clearTimeout(actHintT);go('acthint');});

/* ---------------- score (lifted) ---------------- */
function scoreSet(){
  const pick='fluency';
  const out={};
  Object.keys(SCORE_BASE).forEach(k=>{
    out[k]=Math.max(38,SCORE_BASE[k]-(k===pick?14:0));
  });
  out.overall=Math.round(Object.keys(SCORE_BASE).reduce((a,k)=>a+out[k],0)/4);
  return out;
}
function scoreBand(n){ return n>=70?'strong':n>=50?'mid':'weak'; }
function runScore(fam,sk,iel){
  const S=scoreSet(), ORDER=['vocabulary','grammar','pronunciation','fluency'];
  U('scoreEyebrow').textContent='Your first score';
  U('scoreNote').textContent='Your starting point, before any practice.';
  U('scoreLine').innerHTML=`That was a real rep of <b style="color:var(--text-hi)">${fam.label}</b>. Imagine week three.`;
  const CH='<svg viewBox="0 0 16 16" fill="none"><path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  U('scCards').innerHTML=ORDER.map(k=>{
    const n=S[k], band=scoreBand(n);
    return `<div class="sc-card"><span class="sc-ch">${CH}</span>`+
      `<span class="sc-txt"><b>${SCORE_LABEL[k]}</b><em>${SCORE_MSG[k][band]}</em></span>`+
      `<span class="sc-ring sc-${band}"><svg viewBox="0 0 46 46">`+
      `<circle class="rb" cx="23" cy="23" r="18"/><circle class="rf" cx="23" cy="23" r="18" data-p="${n}"/>`+
      `</svg><i data-to="${n}">0%</i></span></div>`;
  }).join('');
  const fg=U('gFill'), num=U('scoreNum');
  fg.style.strokeDashoffset='369'; num.textContent='0%';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    fg.style.strokeDashoffset=(369*(1-S.overall/100)).toFixed(0);
    document.querySelectorAll('#scCards .rf').forEach((c,i)=>
      setTimeout(()=>{c.style.strokeDashoffset=(113*(1-(+c.dataset.p)/100)).toFixed(1);},140+i*110));
  }));
  countUpPct(num,S.overall,1100);
  document.querySelectorAll('#scCards .sc-ring i').forEach((el,i)=>
    setTimeout(()=>countUpPct(el,+el.dataset.to,850),140+i*110));
  setTimeout(()=>confetti(90),900);
}
function countUpPct(el,to,dur){
  const t0=performance.now(); let done=false;
  const finish=()=>{if(done)return;done=true;el.textContent=to+'%';};
  const step=()=>{
    if(done)return;
    const k=Math.max(0,Math.min(1,(performance.now()-t0)/dur));
    el.textContent=Math.round(to*(1-Math.pow(1-k,3)))+'%';
    if(k<1)requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
  setTimeout(finish,dur+120);
}
document.querySelector('#score .btn[data-next="loader"]').addEventListener('click',()=>go('loader'));

/* ---------------- loader (lifted) ---------------- */
let loadTimers=[],ldRaf,ldTestiT;
const LD_TESTI=[
  {t:'Por fin me entienden',b:'Mi pronunciación mejoró tanto que ya nadie me pide repetir. Practico 10 minutos al día.',n:'Diego A. · CDMX'},
  {t:'Pasé mi entrevista en inglés',b:'En 3 meses dejé de congelarme. Hablé con calma y conseguí el puesto.',n:'María R. · Monterrey'},
  {t:'Mejor que clases caras',b:'Practico hablando de verdad, sin vergüenza y a mi ritmo. Increíble.',n:'Lucía P. · Guadalajara'},
  {t:'Ahora hablo con mis clientes',b:'Antes evitaba el teléfono. Hoy atiendo a todos en inglés sin dudar.',n:'Camila S. · Puebla'}
];
function runLoader(name){
  const items=[
    'Analyzing your speech sample',
    `Building "${answers.jtbdLabel||'your goal'}" scenarios`,
    `Calibrating your ${answers.minutes||15} min a day pace`,
    'Setting your 3 month target'
  ];
  const box=U('loaderChecks');
  box.innerHTML=items.map(t=>
    `<div class="ld-step"><span class="ld-ic"><svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>${t}</span></div>`).join('');
  const steps=[...box.querySelectorAll('.ld-step')];
  loadTimers.forEach(clearTimeout);loadTimers=[];
  clearInterval(ldTestiT);cancelAnimationFrame(ldRaf);
  const DUR=7200;
  steps.forEach((st,i)=>{
    loadTimers.push(setTimeout(()=>{st.classList.add('on');},DUR*(i/steps.length)+60));
    loadTimers.push(setTimeout(()=>{st.classList.remove('on');st.classList.add('done');},DUR*((i+1)/steps.length)-120));
  });
  const dots=U('ldDots');
  dots.innerHTML=LD_TESTI.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('');
  let ti=0;
  const card=U('ldCard');
  const fill=()=>{
    const t=LD_TESTI[ti];
    card.innerHTML=`<div class="ldt-t">${t.t}</div><div class="ldt-stars">★★★★★</div><div class="ldt-b">${t.b}</div><div class="ldt-n">${t.n}</div>`;
    dots.querySelectorAll('i').forEach((d,i)=>d.classList.toggle('on',i===ti));
  };
  card.classList.remove('out');fill();
  ldTestiT=setInterval(()=>{
    card.classList.add('out');
    setTimeout(()=>{ti=(ti+1)%LD_TESTI.length;fill();card.classList.remove('out');},320);
  },DUR/LD_TESTI.length);
  const arc=U('ldArc'),pct=U('ldPct');
  const t0=performance.now();
  const tick=now=>{
    const k=Math.min(1,(now-t0)/DUR);
    pct.textContent=Math.round(k*100)+'%';
    arc.style.strokeDashoffset=327*(1-k);
    if(k<1)ldRaf=requestAnimationFrame(tick);
    else{clearInterval(ldTestiT);go('plan');}
  };
  ldRaf=requestAnimationFrame(tick);
}

/* ---------------- letter (lifted) ---------------- */
const fingerHold=U('fingerHold');
const seal=U('seal');
let holdT=null,holdDone=false;
function sealOrigin(){
  const f=fingerHold.getBoundingClientRect(), s=U('letter').getBoundingClientRect();
  seal.style.setProperty('--sx',(f.left+f.width/2-s.left)+'px');
  seal.style.setProperty('--sy',(f.top+f.height/2-s.top)+'px');
}
function holdStart(e){
  if(holdDone)return;
  e.preventDefault();
  const scr=U('letter');
  fingerHold.classList.add('holding');
  scr.classList.add('sealing');
  U('holdHint').textContent='Keep holding';
  sealOrigin();
  seal.classList.add('on');
  requestAnimationFrame(()=>seal.classList.add('grow'));
  holdT=setTimeout(()=>{
    holdDone=true;
    scr.classList.remove('sealing');
    scr.classList.add('sealed');
    U('sealSub').textContent=(answers.name?answers.name+', your':'Your')+' plan starts the moment you begin.';
    seal.classList.add('said');
    setTimeout(()=>go('paywall'),1600);
  },1150);
}
function holdEnd(){
  if(holdDone)return;
  clearTimeout(holdT);
  fingerHold.classList.remove('holding');
  U('letter').classList.remove('sealing');
  U('holdHint').textContent='Press and hold to commit';
  seal.classList.remove('grow');
  setTimeout(()=>{if(!holdDone)seal.classList.remove('on');},420);
}
fingerHold.addEventListener('pointerdown',holdStart);
fingerHold.addEventListener('pointerup',holdEnd);
fingerHold.addEventListener('pointerleave',holdEnd);
fingerHold.addEventListener('pointercancel',holdEnd);
document.querySelector('#letter .skip[data-next="paywall"]').addEventListener('click',()=>go('paywall'));
