# Perspectives website (first version)

A small static site for Perspectives, the student magazine that decodes XWA.

The colours, fonts and effects are for this website, not brand decisions for the magazine. The home cover follows the UI/UX Pro Max design system in `design-system/perspectives-cover/MASTER.md` (star white + launch blue on near-black, Exo and Roboto Mono, brutalist grid); inner pages keep their own colours.

| Page | Address | What it does |
|---|---|---|
| Home | `#/` | A 3D android bust (three.js). Particles fly in and form the head, then the shell scans in. The head looks at the pointer, the pointer is a light, particles scatter around it, and moving over the head opens an X-ray lens onto the machine inside. Click or tap for a scan pulse. HUD tags track the head; the masthead decodes in. Scrolling down flies the camera into the visor until its light fills the screen, and the events page comes out of the light. Two buttons in the footer: **Join the team** (the join form, `js/views/joinform.js`, opens over the cover) and Events and sign-ups, for anyone who does not scroll. Without WebGL it falls back to text only. |
| What's on | `#/events` | Issue 01 as a Monday to Friday calendar (a list on phones), plus any week an event runs into after the issue ends (the basketball final on Tuesday 27 October). Each event opens its details. An event with `days` in `js/data.js` (the Think Pink Flashmob: three practices and the performance) shows on those days only. `#/events?open=<event id>` opens that event's details, which is how the cover's "Open now" link and the magazine's QR code reach the flashmob's sign-up form. |
| Think Pink Basketball | `#/basketball` | The bracket as played: quarter-finals at lunch, Tuesday 20 to Thursday 22 October (outdoor court, half court), then the two winners who scored the most points play the final (no semi-finals) on Tuesday 27 October in the gym in Block C, full court. Results go in `GAMES` in `js/data.js`: `teams`, `winner` and `score` for each game (`teams: null` shows as to be confirmed); the points table ranks the winners once every quarter-final has a score. `GAME_DAYS` (scoreboard, officials' days, the server's check) follows the game dates by itself. If a date moves, also change by hand, in the same file: the two basketball entries in `EVENTS`, `TOURNAMENT.start`/`end`, and the `fact.when` and `fact.final` text in all four languages. Sign-ups closed after `TOURNAMENT.signupUntil` (22 October): the page shows the results instead, and `api/signup.js` refuses new sign-ups. **Schedule** button top right, with a scoreboard counting down to the next game below it. The ball in the final is 3D: drag to spin it, tap to bounce it. |
| Join us or submit | `#/join` | Joining the team is our own form (`js/views/joinform.js`, also the cover's **Join the team** button): name, school email, homeroom, what they would like to do (`JOIN_ROLES` in `js/data.js`) and the languages they write in (`JOIN_LANGS`). It goes to `api/join.js`, one sign-up per school email, and shows up on `#/admin`. `#/join?apply` opens the form straight away. Submissions go through the Microsoft Form in `JOIN_FORM` (it takes files); until that link is set the page says the form is not open and the cover leaves it out. |
| Spirit Week | `#/spirit` | The school's Spirit Week programme (games, times, place, house notes, Sports Day), all from the school's own poster and emails. Scroll is the play button: four Paris 2024 athletes (discus, sabre, BMX, 3x3 basketball), each a frame sequence cut out of a Commons video, stay frozen until the page scrolls and play as fast as it scrolls. The hero pins while all four play; each day's lane plays its own athlete. Sources and the cut-out pipeline are in `design-system/spirit-ink/HOW.md`. |
| Officials | `#/officials` | Sign-up for the 4 referees, 1 scorer and 1 timer (per game), kept apart from the bracket. |
| Editors | `#/admin` | Not linked anywhere. Everyone who wants to join the team first, with a count for each role and its own CSV export; then every basketball sign-up, laid out like the bracket, with CSV export. |

## Motion

* **Page changes** (`js/fx.js`, raw WebGL2): the page burns away into light and particles, starting where it was clicked; inside, a tunnel of rings rushes past and the next page's name decodes in; then the new page comes out of the particles. Blue for the robot's pages, pink inside Think Pink. Technique after Codrops, "Implementing a Dissolve Effect with Shaders and Particles in Three.js" (2025), rewritten for a full-screen layer.
* **Home cameras**: two live picture-in-picture feeds (camera 2 side, camera 3 X-ray) drawn by `js/cover3d.js` into the frames on the left. Clicking a feed cuts the main view to that camera with a flash and a picture tear; the feed takes the old view. On phones only the X-ray feed shows.
* **Home scroll-in**: the page scrolls about one and a half screens while the cover stays put. The head turns to face the camera, streaks of light rush past, the camera flies to the visor, the picture tears and cuts inside the head, flies at the glowing core, and the core bursts into white light; the events page comes out of the light.
* **Countdown** (`js/views/basketball.js`): an LED scoreboard counting down to `TOURNAMENT.tipOff` in `js/data.js`, Singapore time; digits roll over like a drum as they change. 12:45 is when lunch starts (Spirit Week poster); the organisers have not given a separate start time. On a game day it shows the game day and that day's games; on the days with no game before the final (Friday 23 to Monday 26 October) it counts the days to the final, with no time of day; afterwards, "Tournament over".
* **Ticker**: the bottom bar on the basketball page lists every team's count and the officials, updated as people sign up. It pauses on hover, and goes once sign-ups close.
* **Gold ball** (`js/ball3d.js`): polished gold lit so every reflection stays gold, with a halo, turning rays, star glints on the highlights, a ring of gold dust and twinkling sparks. The pink satin ribbon (with real thickness) is wound round the ball: its loop circles the ball on a tilted orbit, passing in front of it on the left and behind it on the right, the strands cross below the ball and the tails flutter. The ball spins inside the loop; drag or flick to spin it, tap to bounce it and throw off sparks. The ribbon follows the emblem drawing in `js/icons.js`, which shows until three.js has loaded.
* With "reduce motion" switched on in the visitor's system settings, pages switch instantly, the cover stays one screen, the ticker stands still and the ball does not spin by itself. Without WebGL the cover is text only and the ball stays a drawing.

## Languages

Every page has a language switch (EN, 中文, 日本語, 한국어) in the top bar. English is the default; the choice is remembered in the visitor's browser. Changing language rebuilds the current page in place (the home cover keeps its 3D scene running and re-decodes its text).

* Interface words are in `js/strings.js`, one block per language.
* Content (events, teams, rounds, roles, the tournament facts) is in `js/data.js`, written as `tx(English, 中文, 日本語, 한국어)`.
* Dates use the browser's own date formats for Chinese, Japanese and Korean, and fixed names in English.
* Chinese, Japanese and Korean text uses Noto Sans SC, JP or KR from Google Fonts, loaded only when that language is picked.
* Names, team labels (10.1, G7, FEP), "Think Pink", "The Next Wave", email addresses and what visitors type stay as they are. The CSV export stays in English.
* The Japanese and Korean text is a first draft. Ask a native speaker to read it before the link goes out.

## Run it

```
node dev/server.mjs
```

Then open http://127.0.0.1:8765. This runs the functions in `api/` too, against a test database kept in memory (`dev/mock-redis.js`); the editors' page password is `local`. `python serve.py` serves the pages only. (Opening `index.html` straight from the folder does not work: browsers block the JavaScript modules on `file://`.) How to work on the site together: `CONTRIBUTING.md`.

## Credits and outside files

* Head geometry: "Infinite, 3D Head Scan" by Lee Perry-Smith, CC BY 3.0, loaded from the three.js repository on jsDelivr. The credit is on the cover; keep it there.
* three.js 0.170.0 (MIT) is loaded from jsDelivr through the import map in `index.html` (GLTFLoader, MeshSurfaceSampler, EffectComposer, UnrealBloomPass, OutputPass).
* Techniques on the cover were learned from, and rewritten after: Codrops "Crafting a Dreamy Particle Effect with Three.js and GPGPU", Codrops "Interactive Particles with Three.js", Codrops "Building a Dual-Scene Fluid X-Ray Reveal Effect in Three.js", and Anderson Mancini's MIT HolographicMaterial (with its YouTube tutorial). No code was copied from repositories without a licence.
* Basketball background photos: free-licence photos from Wikimedia Commons, listed in `STAR_PHOTOS` in `js/data.js` and credited at the bottom of the basketball page. They are loaded straight from Wikimedia for now.
* Before going live, save these files into the site folder so it does not depend on other servers.

## Change the content

The content is in `js/data.js`: events, the draw, the provisional game order, the officials needed. Buttons, labels and messages are in `js/strings.js`. Change all four languages together, then reload.

## How team matching works (proposal)

* Sign-ups are taken in the order they arrive.
* A group only takes places if the whole group fits, so friends are never split.
* People who sign up alone fill whatever places are left in their class (G10) or grade (G7 to G9, FEP).
* Past five, people become reserves. A group that could not fit is flagged on the editors' page so the organisers can decide.

The rule lives in `lineup()` in `js/store.js`.

## Where sign-ups go

* **Live site: https://perspectives-xwa.vercel.app** (Vercel project `perspectives-xwa`, functions in Singapore via `vercel.json`): sign-ups are sent to the functions in `api/` and kept in an Upstash Redis database connected to the project. Everyone sees team and role counts only (`/api/summary`); names and emails reach the editors' page only after the server checks `ADMIN_PASSWORD`. Each connection can send 20 sign-ups per 10 minutes (40 for joining the team, since a whole class may share the school's network); ten wrong editor passwords lock that connection out for 15 minutes.
* **Preview deployments** use their own `test:` keys, which expire after a week, so testing never touches the real `live:` sign-ups.
* **Prototype** (`python serve.py`, http://127.0.0.1:8765): sign-ups stay in the browser's localStorage and the editors' passcode is `perspectives2026`, checked in the browser. Sample sign-ups exist only here.

## Going live on Vercel

One-time setup, in the Vercel dashboard (vercel.com, project `perspectives-xwa`):

1. **Storage** → Create Database → **Upstash for Redis** (free plan, region Singapore) → connect it to `perspectives-xwa` for Production and Preview. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Settings → Environment Variables** → add `ADMIN_PASSWORD` (a new password, not the prototype one) for Production and Preview.

Then, from this folder:

```
npx vercel          # a preview deployment, to test
npx vercel --prod   # the live site
```

The files in `.vercelignore` (this README, `serve.py`, design notes, credentials) are never uploaded. Settings changed on Vercel (such as the password) take effect at the next deployment.

Collecting names and school emails: the forms say who sees them (the organisers and the Perspectives editors) and that they are deleted after the tournament. To delete them, remove each entry on the editors' page, or delete the `live:*` keys in the Upstash console.

## Files

```
index.html          page shell
serve.py            local preview server
css/site.css        all styles (three themes: cover home, paper calendar, arena basketball)
js/app.js           hash router and language switching
js/i18n.js          language switch, translation lookup
js/strings.js       interface words in English, Chinese, Japanese and Korean
js/data.js          content (in all four languages)
js/store.js         sign-up data: the live API, or this browser in the prototype
js/lineup.js        team matching and officials, shared with the server
api/                the sign-up functions on Vercel (summary, signup, official, join, admin)
js/cover3d.js       the 3D android bust on the home cover: cameras, feeds, scroll-in
js/fx.js            the particle page change
js/ball3d.js        the 3D ball in the bracket's final
js/figures.js       fallback player silhouettes and court (original drawings)
js/views/*.js       one file per page, plus the sign-up dialog
```

## The magazine's QR code

The printed magazine carries one QR code, `qr/perspectives-home` (kept out of the deploy), and it opens the cover. The cover's footer lists what readers can do now, from `NOW_OPEN` in `js/data.js`: each item drops off after its `until` date, and the submit link shows once `JOIN_FORM` is set. Next to the list, the **Join the team** button is always there. Add new sign-ups there, not new QR codes; if a page ever needs its own code for joining, `#/join?apply` opens the form straight away. The codes point at perspectives-xwa.vercel.app, so keep that project and its name.
