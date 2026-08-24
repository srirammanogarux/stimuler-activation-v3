# Story footage: the slot model and the generation prompts

## How the video works across scenarios

Each scenario's story has up to four beats:

| Beat | Owner | Clip | Rule |
|---|---|---|---|
| 1 · Pressure | **the scenario** | `videos/<scenario>_pressure.mp4` | Optional. Plays only when bespoke footage exists. |
| 2 · Dread | the cohort | `videos/dread.mp4` | Shared. Universal by design (a dark room, lying awake). |
| 3 · Walk | the cohort | `videos/walk.mp4` | Shared. Universal for the workplace world. |
| 4 · Clash | code | — | YOU vs THEM, no footage. |

A scenario with no pressure clip simply starts at the dread beat; the
progress dots adapt. **To upgrade a scenario: generate the clip, drop it
in `/videos`, add one line to `PRESSURE_CLIPS` in `story.js`.** Nothing
else changes.

Current state:

- `manager` → `deadline.mp4` (the original leave-story clip; it IS this scenario)
- `meetings`, `present` → no pressure clip yet, 3-beat story

## Style contract (match the existing clips)

- 2D cartoon illustration look of the existing set: warm-lit office,
  visible outlines, muted realistic palette, gentle parallax/zoom, no
  camera cuts inside a clip
- The manager character is the silver-haired bearded man in the pinstripe
  suit (same character as `deadline.mp4` and the clash portrait)
- 9:16 portrait, 6–10 seconds, loopable, **silent**, no on-screen text
  (captions are typed by the app)
- The USER is never shown from the front; hands / over-the-shoulder only

## Prompts

### meetings_pressure.mp4

> 2D cartoon animation, warm office lighting, muted palette. Over-the-shoulder
> view of a laptop screen showing a calendar reminder "Team sync · 10:00"
> (blurred, unreadable text). Around a glass meeting-room table in the
> background, colleagues gather; the silver-haired bearded manager in a
> pinstripe suit takes his seat at the head. The viewer's hands hesitate
> over a notebook. Slow push-in, subtle ambient motion, no cuts, loopable,
> 9:16 portrait, 8 seconds, no text.

### present_pressure.mp4

> 2D cartoon animation, warm office lighting, muted palette. A meeting-room
> TV shows a blurred product screen ready to present; a clicker lies on
> the table beside the viewer's hand, fingers drumming. In the background
> the silver-haired bearded manager in a pinstripe suit and two colleagues
> settle into chairs, waiting. Slow push-in toward the TV, subtle ambient
> motion, no cuts, loopable, 9:16 portrait, 8 seconds, no text.

### Template for future scenarios

> 2D cartoon animation, warm office lighting, muted palette.
> [THE SCENARIO'S PRESSURE OBJECT: the thing that makes the moment real —
> a ringing phone labelled "Client", a walk-in customer at the counter, a
> quiet open-plan floor]. The silver-haired bearded manager in a pinstripe
> suit [WHERE HE IS IN THIS SCENE]. The viewer appears only as hands or
> over-the-shoulder. Slow push-in, subtle ambient motion, no cuts,
> loopable, 9:16 portrait, 8 seconds, no text.
