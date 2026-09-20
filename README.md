# Doggy Mini Games

A small NYT Games-style site: six daily word/logic puzzles (Wordle, Strands,
Crossword, Connections, Spelling Bee, Pips) that run entirely as static
HTML/CSS/JS, with puzzle content stored in small, easy-to-edit data files.
Optionally, sign in with Firebase and use `admin.html` to change the puzzles
for every visitor without redeploying.

Live at: **doggyminigames.vercel.app**

## How it works

There's no build step and no server-side code. Every game is a folder with
its own `index.html` + `style.css` + `script.js`, plus (for the auto-generated
ones) a `generator.js`. Puzzle *content* — words, clues, themes — lives
separately under `data/`, split into small files so you can open and edit
just the piece you care about instead of one giant file.

| Game | Folder | How it's generated |
|---|---|---|
| Wordle | `wordle/` | Picks a word from a curated answer list; a much larger dictionary decides which guesses are "valid" |
| Strands | `strands/` | A theme + word list is auto-placed onto a letter grid as snaking paths |
| Crossword | `crossword/` | A word/clue database is auto-placed onto a grid via letter intersections |
| Connections | `connections/` | Fixed groups of 4×4 words, shuffled into a grid each time |
| Spelling Bee | `spellingbee/` | You give it 7 letters; it computes every valid word from a bundled dictionary itself |
| Pips | `pips/` | Fully generated on the fly every time — a random domino tiling plus region constraints, no stored puzzle data at all |

### Data layout

```
data/
  wordle/
    answers/        curated answer pool, split A-F / G-M / N-S / T-Z
    guesses/         big accepted-guess dictionary, split into 5 files
  strands/puzzles.js     every theme, one array
  crossword/         short-fillers.js / medium.js / hard.js clue databases
  connections/puzzles.js  every puzzle, one array
  spelling-bee/
    dictionary/      the word-validity dictionary, split into 6 files
    puzzles.js       every letter-set, one array (just {center, outerLetters})
```

(Wordle's answers/guesses and the Spelling Bee dictionary stay split into
several files each because they're genuinely large word lists; Strands,
Connections, and Spelling Bee's puzzle lists used to be one file per puzzle,
which was nicer for editing a single puzzle but pushed the repo over
GitHub's 100-file web-upload limit, so they're back to one file per game.)

Every data file is a plain `.js` file that pushes onto a `window.SOMETHING`
array — e.g. `window.STRANDS_DATA.push({...})`. That's so pages can be
opened directly (`file://...`) or from any static host without a build step;
there's nothing to compile. Open any file under `data/` to see the shape and
copy it when adding more content by hand.

Every `<script src>` / `<link href>` in the project is **root-relative**
(starts with `/`, e.g. `/shared/style.css`), not relative to the current
folder. This matters because visiting a clean URL like
`doggyminigames.vercel.app/pips` (no trailing slash) serves `pips/index.html`
at a URL that *looks* like it's at the site root — a plain relative path
like `style.css` would then 404, because the browser resolves it against
`/` instead of `/pips/`, and the whole page renders blank with no visible
error apart from 404s in the console. Root-relative paths sidestep that
entirely. If you add a new page or asset, keep using a leading `/` on every
local `src`/`href` rather than a relative path. (`vercel.json` also sets
`trailingSlash: true` as a second safety net, but the root-relative paths
are what actually make this robust regardless of host.)

## Running it locally

Since it's static files, any local web server works. From this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. (Opening `index.html` directly by
double-clicking also mostly works, but a couple of things — service-worker-
style caching quirks aside — behave more predictably over `http://`.)

## Deploying

It's a plain static site, so pushing this folder to Vercel (or Netlify,
GitHub Pages, etc.) with no build command and no output directory override
is enough.

## Changing the site icon / favicon

The icon shown in browser tabs is [`shared/favicon.svg`](shared/favicon.svg)
— currently a paw print. To change it:

1. Replace the contents of `shared/favicon.svg` with your own SVG (any
   editor, or export one from a tool like Figma/Illustrator/an icon
   generator). Keep the `viewBox="0 0 64 64"` sizing convention if you want
   it to line up the same way, but it's not required.
2. That's it — every page links to this one file
   (`<link rel="icon" type="image/svg+xml" href=".../shared/favicon.svg">`),
   so there's nothing else to update.

If you'd rather use a PNG/ICO instead of SVG, add the file (e.g.
`shared/favicon.png`) and change every `<link rel="icon" ...>` tag's `href`
and `type` to match — there's one such tag near the top of each page's
`<head>` (search the project for `favicon` to find them all).

## Firebase: accounts + shared puzzle editing (optional)

None of the games *require* Firebase — without it, everyone just plays the
puzzles bundled in `data/`. Firebase adds two optional things: login/signup,
and a live admin page (`admin.html`) that lets a signed-in admin change the
puzzles for every visitor.

Realtime Database was chosen over Firestore here because it's simpler for
this use case (one small JSON tree of puzzle data); if you created a
Firestore database instead at some point, the code would need switching back
— it currently expects Realtime Database.

### Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Project settings → General → add a **Web app**; copy the config object.
3. Authentication → Sign-in method → enable **Email/Password**.
4. Realtime Database → create a database; copy its URL (shown at the top of
   that page) into `databaseURL`.
5. Paste everything into [`shared/firebase-config.js`](shared/firebase-config.js)
   — it has inline comments showing exactly which console page each value
   comes from.
6. Set your Realtime Database security rules (Realtime Database → Rules) so
   only you can write, while anyone can read:
   ```json
   {
     "rules": {
       "puzzles": {
         ".read": true,
         ".write": "auth != null && auth.token.email === 'you@example.com'"
       }
     }
   }
   ```
7. Add your email to `window.ADMIN_EMAILS` in `shared/firebase-config.js`
   (this only hides the admin UI from non-admins — the rule above is what
   actually enforces it).
8. Sign up for an account at `login.html`, then open `admin.html`.

### Using the admin page

Each game gets a form (not raw JSON) — a text box for Wordle's word list,
repeatable cards for Strands/Connections puzzles, repeatable rows for the
crossword clue database, one word per line for Spelling Bee. Hit **Load
current** to see what's live, edit it, and **Save for everyone**.

Changes take effect the next time someone loads the page fresh. If someone's
already mid-puzzle, they keep the version they started with for the rest of
that day — a browser only re-checks for a new puzzle once every 24 hours, so
nobody gets the rug pulled out from under them mid-solve.

Pips isn't in the admin page: it has no stored puzzle at all, it's generated
from scratch every time you open it.

## Adding more puzzle content

- **Wordle**: add words to any file in `data/wordle/answers/` (5-letter
  words only) — or just use `admin.html` once Firebase is set up.
- **Strands**: add another `{theme, spangram, words}` object to the array in
  `data/strands/puzzles.js` — or just use `admin.html`.
- **Crossword**: add `{word, clue}` entries to any file in `data/crossword/`.
- **Connections**: add another `{groups}` object to the array in
  `data/connections/puzzles.js` (4 groups of 4 words each) — or use `admin.html`.
- **Spelling Bee**: add a line to the box in `admin.html` — easiest way,
  since it needs the dictionary to pick a good center letter automatically.
  (You can also hand-edit `data/spelling-bee/puzzles.js` directly, but
  you'd need to work out the best center letter yourself.)

## Known limitations

- The crossword generator places words by intersection only (no full-grid
  fill), so grids have more black squares than an authentic NYT Mini.
- Strands' auto-placed grids use filler letters in unused cells (not a fully
  packed board like the real game).
- Pips uses a "loose" reading of the classic 28-domino set (no attempt to
  avoid picking the same domino twice across different games) and only
  generates 4×4 boards.
- The Spelling Bee and Wordle dictionaries are general-purpose English word
  lists (ENABLE1 and a public Wordle word list, respectively) rather than
  NYT's own curated lists, so you'll occasionally see an obscure word
  accepted, or fail to find a common one that NYT would allow.
