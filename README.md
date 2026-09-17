# NYTimes Games Clone — Puzzle Hub

### *Website live now on doggyminigames.vercel.app*

A modular, lightweight **New York Times Games ecosystem** clone built to serve multiple interactive word games off a shared client-side architecture. It includes user account workflows, a real-time admin management portal, and full-featured game variants.

---

## 📂 System Architecture & Workspace Topology

The codebase relies on strict path-resolution helper modules (`rootPath()`) to seamlessly bridge single-page interfaces across flat root levels and deep game directories:

```text
├── shared/
│   ├── firebase-config.js      # Production Database connection string & API arrays
│   ├── main.css                # Notebook theme rules & design configurations
│   ├── auth.css                # Interface layouts for credential entries
│   ├── admin.css               # Flex grid alignments for manager components
│   ├── masthead.css            # Static print headers for hub identity layout
│   ├── puzzle-auth.js          # Compat wrapper for multi-tier privilege checks
│   └── puzzle-data.js          # Local cache middleware mapping dynamic overrides
├── data/
│   ├── wordle/
│   │   ├── answers/            # Curated puzzle target index array (A-Z)
│   │   └── guesses/            # Accepted guess lookup library dictionary (A-Z)
│   ├── strands/
│   │   └── puzzles/            # Native JSON theme objects library (15 curated categories)
│   └── crossword/
│       └── database/           # Crossword tiered clue matrix array configurations
├── Wordle/
│   ├── index.html              # Wordle markup interface
│   ├── app.js                  # Stateful row processing & selection matrix
│   └── style.css               # Keyboard typography & CSS transform rules
├── Strands/
│   ├── generator.js            # Self-avoiding path generator & grid populator
│   ├── main.js                 # 8-directional vector drawing & selection logic
│   └── style.css               # Absolute overlay layer & circle grid canvas
└── Crossword/
    ├── index.html              # Crossword layout and control structure
    ├── generator.js            # Algorithmic canvas layout generator & box trimmer
    ├── main.js                 # Grid mapping focus tracking, navigation and checking handlers
    └── style.css               # Absolute numeric markers & cell selection masks
```

---

## ⚙️ Core Engines & Technical Workflows

### 1. Wordle Engine & Dictionary Matrix
*   **Segmented Data Separation**: Divides string data into two clear categories under `data/wordle/` to optimize footprint performance:
    *   `window.WORDLE_ANSWERS`: A selective, curated list of standard 5-letter solution targets.
    *   `window.WORDLE_GUESSES`: An exhaustive reference list used to validate all incoming guesses.
*   **Deterministic Daily Selection**: Uses an epoch-stepping baseline calculation (`Date.UTC(2024, 0, 1)`) to walk cleanly through target keys based on the calendar day. This ensures all users receive the exact same puzzle daily sequence without relying on server-side timers.

### 2. Strands Layout Generator
*   **Algorithmic Routing Matrix**: Automatically builds boards by taking a themed phrase list and threading each word through adjacent grid paths using an 8-directional layout system.
*   **Self-Avoiding Pathing**: Implements a shuffling technique (`tryPlaceWord`) that checks available steps against an occupancy map to keep paths from colliding, before filling the rest of the board with random letter padding.

### 3. Crossword Core Engine
The `Crossword/` engine drives an adaptive, intersection-based placement sequence that dynamically creates grid puzzles from raw data matrices:

```text
       [M] O N U [M] E N T A L        <- Engine seats the longest word first
                 [E]
                 [A]
     [G] E N U I [N] E                 <- Injects medium/short links intersecting axes
     [E]         [E]
   [O] P T       [W] O R T H          <- Bounding box shrinks to remove margins
```

#### A. Layout Computation Architecture (`generator.js`)
*   **Canvas Placement Mapping**: Initializes a `21x21` virtual canvas and automatically places the longest phrase directly across the horizontal center line (`CENTER`) as the primary anchor block.
*   **Collision Avoidance Protocols**: Cycles up to 25 times per generation request using `canPlace()`. It scans adjacent grid coordinates to block structural placement if an entry creates unintended side-by-side matches.
*   **Dynamic Trimming & Box Bounds**: Trims away all dead margins on the master canvas using `finalize()`, recalculating a compact, focused boundary grid box around the active entries.

#### B. Cell Interface & Navigation Rules (`main.js`)
*   **Cell State Matrix Mapping**: Links input elements back to database entries via a structural map tracker (`cellWordMap[r][c]`), allowing the interface to highlight perpendicular tracks instantly when users click a slot.
*   **Direction Toggling**: Changes direction automatically (`across` ⇋ `down`) if a user clicks an active crossing intersection cell twice.

---

## 🎨 Global Design Tokens (`main.css`)

The application adopts a responsive **notebook/graph-paper aesthetic** leveraging a structured layout grid system:

| Token Name | Light Mode Value | Dark Mode Value | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `--paper` | `#eef1f6` | `#121623` | Primary workspace background |
| `--paper-line` | `#d7deea` | `#232a3d` | Grid alignment notebook lines |
| `--ink` | `#1b2440` | `#eef1f6` | Core structural typography ink |
| `--correct` | `#6aaa64` | `#538d4e` | Valid positional target hit |
| `--present` | `#c9b458` | `#b59f3b` | Displaced keyword match state |
| `--absent` | `#8a92a6` | `#4a5170` | Extraneous dictionary guess element |
| `--accent` | `#3452e1` | `#7f9bff` | Highlight anchor tags (e.g. Spangram found) |
| `--mark` | `#e23d6d` | `#ff5c88` | Errors, deletions, and warning states |

---

## 🔒 Security & Firebase Provisioning

### Realtime Database Security Rules
To allow anyone to load the daily puzzle configurations while locking backend write permissions exclusively to the deployment head administrator, the database uses these explicit **Firebase Console rules**:

```json
{
  "rules": {
    "puzzles": {
      ".read": true,
      ".write": "auth != null && auth.token.email === 'yawensha16@gmail.com'"
    }
  }
}
```

### Key Management Notice
> ⚠️ **Critical Production Requirement**: The backend API verification keys are kept strict and private. Never commit a raw config configuration object containing unmasked Firebase details directly into a public GitHub repository branch. Local development should maintain keys hidden via git-ignored environmental files or securely injected script variables.
