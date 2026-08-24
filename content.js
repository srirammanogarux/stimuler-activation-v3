/* ============================================================
   Stimuler · Activation v3 — content
   THE TEST OF THE MODEL: one backdrop (the office), one judge
   character (the manager), THREE built scenarios riding on them —
   manager 1:1 · speaking up in meetings · presenting my work.
   Everything the flow says lives here; app.js only sequences it.
   ============================================================ */
'use strict';

/* ---------- the funnel ---------- */

const LANGS = [
  { v:'es', label:'Spanish' },
  { v:'pt', label:'Portuguese' },
  { v:'hi', label:'Hindi' },
  { v:'id', label:'Indonesian' },
];

const GOALS = [
  { v:'exam',     label:'Prepare for an English exam' },
  { v:'career',   label:'Grow in my career' },
  { v:'personal', label:'Personal growth' },
  { v:'school',   label:'Excel at my school' },
  { v:'travel',   label:'Travel confidently' },
];

const SITUATIONS = [
  { v:'student',    label:'Studying' },
  { v:'office',     label:'Working a job' },
  { v:'freelancer', label:'Freelancing' },
  { v:'business',   label:'Running my own business' },
  { v:'home',       label:'At home with family' },
  { v:'break',      label:'On a career break' },
  { v:'jobseek',    label:'Looking for work' },
];

const LEVELS = [
  { v:'beginner',     label:'Beginner',
    desc:'I know some words, but I can’t make sentences.' },
  { v:'intermediate', label:'Intermediate',
    desc:'I can make short sentences about simple things.' },
  { v:'advanced',     label:'Advanced',
    desc:'I can hold a short conversation and understand others.' },
];

/* ---------- goal × situation → cohort ---------- */

const COHORT = {
  exam:     { _default:'exam' },
  career:   { office:'atwork', freelancer:'ownboss', business:'ownboss', _default:'interview' },
  personal: { home:'household', _default:'belonging' },
  school:   { _default:'school' },
  travel:   { _default:'travel' },
};
const cohortFor = (goal, sit) =>
  (COHORT[goal] && (COHORT[goal][sit] || COHORT[goal]._default)) || 'belonging';

/* ---------- the rooms (subgoals) per cohort ----------
   atwork has three rooms built on the ONE office backdrop.
   One-room cohorts skip the question entirely. */

const ROOMS = {
  atwork: {
    ask: 'Work, then. Where do you want to win first?',
    list: [
      { v:'manager',  label:'Talking to my manager',    built:true },
      { v:'meetings', label:'Speaking up in meetings',  built:true },
      { v:'present',  label:'Presenting my work',       built:true },
      { v:'client',   label:'On client calls',          built:false },
    ],
  },
  interview: { ask:null, list:[{ v:'interview', label:'The interview', built:false }] },
  exam:      { ask:null, list:[{ v:'exam', label:'The exam', built:false }] },
  ownboss: {
    ask: 'Your business, then. Where do you want to win first?',
    list: [
      { v:'clientcall', label:'A call with a new client',  built:false },
      { v:'price',      label:'Talking about my price',    built:false },
      { v:'complaint',  label:'Handling a complaint',      built:false },
    ],
  },
  belonging: {
    ask: 'Got it. Where does English hold you back the most?',
    list: [
      { v:'meetnew',   label:'Meeting new people',           built:false },
      { v:'neighbors', label:'Small talk with neighbours',   built:false },
      { v:'inlaws',    label:'My partner’s family',          built:false },
    ],
  },
  travel: {
    ask: 'Travel, then. Which moment do you want to nail first?',
    list: [
      { v:'hotel',      label:'Checking into a hotel',            built:false },
      { v:'restaurant', label:'Ordering at a restaurant',         built:false },
      { v:'directions', label:'Asking a stranger for directions', built:false },
    ],
  },
  school: {
    ask: 'School, then. Where do you want to win first?',
    list: [
      { v:'classtalk', label:'Speaking up in class',  built:false },
      { v:'present',   label:'Presenting my project', built:false },
      { v:'group',     label:'Group work',            built:false },
    ],
  },
  household: {
    ask: 'Alright. Which of these do you want to handle with ease first?',
    list: [
      { v:'ptm',    label:'The parent-teacher meeting', built:false },
      { v:'clinic', label:'The clinic',                 built:false },
      { v:'office', label:'The bank or an office',      built:false },
    ],
  },
};

/* ---------- the speech wins ----------
   Positive framing: the one thing they want to get right in the room.
   Same four concepts everywhere; coaching strings are universal. */

const WINS = [
  { v:'start',
    label:'Start without freezing up',
    tip:'Don’t rehearse it in your head. Say the first line and the rest follows.',
    metricLabel:'Time to your first word',
    open:(m)=>`You started in ${m}. No freeze. That’s the win you picked.`,
    openMiss:(m)=>`You took ${m} to start. Let’s get that to two seconds.` },
  { v:'sustain',
    label:'Say more than one nervous line',
    tip:'Aim for four short sentences. I’ll show you the four.',
    metricLabel:'How much you said',
    open:(m)=>`You gave ${m} — a full answer, not one nervous line.`,
    openMiss:(m)=>`You gave ${m}, then stopped. There were more to go.` },
  { v:'land',
    label:'Get to the point quickly',
    tip:'Say the point first. The explanation comes second.',
    metricLabel:'Where your point landed',
    open:(m)=>`Your point landed ${m}. They knew what you meant immediately.`,
    openMiss:(m)=>`Your point arrived ${m}. Put it first next time.` },
  { v:'clear',
    label:'Be understood the first time',
    tip:'Slower is clearer. Don’t rush the important words.',
    metricLabel:'Words that didn’t land',
    open:(m)=>`${m} — every important word landed first time.`,
    openMiss:(m)=>`${m} words didn’t land. Both are fixable right now.` },
];
const winFor = v => WINS.find(w => w.v === v) || WINS[1];

/* ============================================================
   THE THREE SCENARIOS — one backdrop, one manager, three rooms.
   Each is: story beats + the judge's line + a 4-step framework
   + a mocked spoken answer + two drill words.
   ============================================================ */

const SCENARIOS = {

  /* ---- 1 · Talking to my manager (asking for leave) ---- */
  manager: {
    them: 'THE MANAGER', themName: 'your manager',
    story: {
      beat1: {
        eyebrow: 'Friday · 4:52 pm',
        place:   'Your manager’s desk',
        line:    'You need next Friday off. You’ve been putting this off all week.',
      },
      beat2: { tag: 'One ask. Say it right.' },
      beat3: {
        objective: 'Walk out with a <b>yes</b> for Friday',
        timer: 'He’s between meetings. You have 5 minutes.',
      },
    },
    judgeLine: 'Yeah, I heard you want a day off next week — what’s it about?',
    framework: [
      { step:'Make the ask',    how:'Name the exact day, straight away.',
        sample:'I’d like to take next Friday off.' },
      { step:'Give the reason', how:'One line. Don’t over-explain.',
        sample:'It’s my cousin’s wedding.' },
      { step:'Cover the gap',   how:'Show the work is handled before he asks.',
        sample:'My tasks for the week are done, and I’ll hand the client file to Maria on Thursday.' },
      { step:'Confirm',         how:'End on a question, so he answers.',
        sample:'Would that be okay?' },
    ],
    spoken: {
      transcript: 'Uh, I want to take leave on Friday… my cousin is getting married. It is… the work is finished mostly.',
      hit: [true, true, false, false],
      metrics: { start:'four seconds', sustain:'two lines', land:'buried in the middle', clear:'Two' },
      score: 58,
    },
    readScore: 74,
    drill: ['Friday', 'covered'],
    valueLine: 'Five minutes ago, this conversation made you nervous. You just handled it.',
    journeyWk1: 'Manager conversations — leave, deadlines, updates',
  },

  /* ---- 2 · Speaking up in meetings ---- */
  meetings: {
    them: 'THE TEAM', themName: 'the room',
    story: {
      beat1: {
        eyebrow: 'Monday · 10:04 am',
        place:   'The team meeting',
        line:    'The plan is on the table. You have an opinion — you always do. You just never say it.',
      },
      beat2: { tag: 'Say it before the moment passes.' },
      beat3: {
        objective: 'Say what you think — and <b>be heard</b>',
        timer: 'The decision lands in 5 minutes.',
      },
    },
    judgeLine: 'We’re leaning towards option A. Thoughts?',
    framework: [
      { step:'Take a position',  how:'Say which option, straight away. No wind-up.',
        sample:'I’d go with option B.' },
      { step:'Give one reason',  how:'Your strongest one. Not all of them.',
        sample:'It gets us to launch two weeks earlier.' },
      { step:'Name the trade-off', how:'Show you’ve seen the catch before they raise it.',
        sample:'The risk is the migration, but we can stage that.' },
      { step:'Invite the room',  how:'End open, so it’s a discussion, not a speech.',
        sample:'Does that work for everyone?' },
    ],
    spoken: {
      transcript: 'I think… maybe option B is also good? Because it is faster. But A is okay too.',
      hit: [true, true, false, false],
      metrics: { start:'six seconds', sustain:'two lines', land:'wrapped in a maybe', clear:'Two' },
      score: 55,
    },
    readScore: 72,
    drill: ['option', 'earlier'],
    valueLine: 'You just did the thing you never do in meetings — said it, out loud, first.',
    journeyWk1: 'Meetings — taking a position and holding it',
  },

  /* ---- 3 · Presenting my work ---- */
  present: {
    them: 'THE ROOM', themName: 'the room',
    story: {
      beat1: {
        eyebrow: 'Thursday · 2:00 pm',
        place:   'The team room — your work on the screen',
        line:    'Three minutes on the agenda. Everyone’s looking at you.',
      },
      beat2: { tag: 'Your work. Your voice.' },
      beat3: {
        objective: 'Walk them through it <b>without freezing</b>',
        timer: 'You have 3 minutes on the agenda.',
      },
    },
    judgeLine: 'Alright — walk us through it.',
    framework: [
      { step:'Say what it is',    how:'One plain sentence. No preamble.',
        sample:'This is the new order-tracking screen.' },
      { step:'Why it matters',    how:'The problem it kills, in numbers if you have them.',
        sample:'We were losing an hour a day checking statuses by hand.' },
      { step:'What you did',      how:'Your part, said plainly. Don’t shrink it.',
        sample:'I built one view that shows every order live.' },
      { step:'End with what’s next', how:'Give the room somewhere to go.',
        sample:'Next month we roll it out to the whole team.' },
    ],
    spoken: {
      transcript: 'So this is… the tracking screen thing. We made it because the old way was slow. Yeah… that is mostly it.',
      hit: [true, true, false, false],
      metrics: { start:'five seconds', sustain:'three lines', land:'only at the end', clear:'Two' },
      score: 56,
    },
    readScore: 75,
    drill: ['tracking', 'launch'],
    valueLine: 'That’s the first time your work got the words it deserves.',
    journeyWk1: 'Presenting — your work, said the way it deserves',
  },
};

/* ---------- shared tail ---------- */

const DRILL_TO = { read: 86, speak: 72 };

const JOURNEY = [
  { wk:'Week 1',  what:null /* filled from the scenario */ },
  { wk:'Week 3',  what:'Holding your own in any room at work' },
  { wk:'Week 5',  what:'Thinking in English, not translating' },
  { wk:'Week 8',  what:'Walking in with something to say — every time' },
];

const PAYWALL = {
  title: '<em>Grow in your career</em><br>with English practice',
  cta:   'Get Stimuler PRO',
};
