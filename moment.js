/* ============================================================
   Activation v3 — the moment's CONTENT.
   The moment itself now lives in chat (flow.js). This file only
   carries what each scenario says: the judge's line, and the
   4-step scaffold that doubles as the reading passage.
   ============================================================ */
'use strict';

const MOMENT = {
  manager: {
    eyebrow: 'Talking to your manager',
    role: 'Your manager',
    where: 'between meetings',
    ctx: 'He looks up from his laptop.',
    q: 'Yeah, I heard you want a day off next week. What’s it about?',
    reply: 'Alright. Friday works. Thanks for sorting the handover first.',
    spokenT: 'Uh, I want to take leave on Friday. My cousin is getting married. The work is mostly finished.',
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
    role: 'Your manager',
    where: 'at the team sync',
    ctx: 'The room goes quiet. He turns to you.',
    q: 'We’re leaning towards option A. Thoughts?',
    reply: 'Two weeks earlier is a strong point. Alright, let us look at B properly.',
    spokenT: 'I think maybe option B is also good, because it is faster. But A is okay too.',
    frame: [
      { s:'Take a position',    h:'Say which option, straight away. No wind-up.',
        t:'I’d go with option B.' },
      { s:'Give one reason',    h:'Your strongest one. Not all of them.',
        t:'It gets us to launch two weeks earlier.' },
      { s:'Name the trade-off', h:'Show you’ve seen the catch before they raise it.',
        t:'The risk is the migration, but we can stage that.' },
      { s:'Invite the room',    h:'End open, so it’s a discussion, not a speech.',
        t:'Does that work for everyone?' },
    ],
  },
  present: {
    eyebrow: 'Presenting your work',
    role: 'Your manager',
    where: 'at the demo',
    ctx: 'Your work is on the screen. Everyone waits.',
    q: 'Alright, walk us through it.',
    reply: 'Clean. Send me the rollout plan after this and we will take it to the team.',
    spokenT: 'So this is the tracking screen thing. We made it because the old way was slow. That is mostly it.',
    frame: [
      { s:'Say what it is',        h:'One plain sentence. No preamble.',
        t:'This is the new order-tracking screen.' },
      { s:'Why it matters',        h:'The problem it kills, in numbers if you have them.',
        t:'We were losing an hour a day checking statuses by hand.' },
      { s:'What you did',          h:'Your part, said plainly. Don’t shrink it.',
        t:'I built one view that shows every order live.' },
      { s:'End with what’s next',  h:'Give the room somewhere to go.',
        t:'Next month we roll it out to the whole team.' },
    ],
  },
};

window.momentFrame = roomId => (MOMENT[roomId] || MOMENT.manager).frame;
window.momentData  = roomId => MOMENT[roomId] || MOMENT.manager;
