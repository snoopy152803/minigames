// Lets admin.html change the puzzle content for everyone by editing a
// Realtime Database node, while people already playing today's puzzle keep
// the version they started with (we only re-check the database once per
// calendar day, per browser).
//
// If Firebase isn't configured yet, ready() resolves immediately and every
// game just uses whatever's bundled in data/ — nothing breaks.
window.PuzzleData = (function () {
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function cacheKey(game) { return "puzzle-cache-" + game; }

  function applyOverride(game, data) {
    if (!data) return;
    if (game === "wordle" && Array.isArray(data.answers) && data.answers.length) {
      window.WORDLE_ANSWERS = data.answers.map(w => w.toUpperCase());
    }
    if (game === "strands" && Array.isArray(data.puzzles) && data.puzzles.length) {
      window.STRANDS_DATA = data.puzzles;
    }
    if (game === "crossword" && Array.isArray(data.clues) && data.clues.length) {
      window.CROSSWORD_DATA = data.clues;
    }
    if (game === "connections" && Array.isArray(data.puzzles) && data.puzzles.length) {
      window.CONNECTIONS_DATA = data.puzzles;
    }
    if (game === "spellingbee" && Array.isArray(data.puzzles) && data.puzzles.length) {
      window.SPELLING_BEE_DATA = data.puzzles;
    }
    if (game === "pips" && Array.isArray(data.puzzles) && data.puzzles.length) {
      window.PIPS_DATA = data.puzzles;
    }
  }

  // Returns a promise that resolves once window.WORDLE_ANSWERS / STRANDS_DATA
  // / CROSSWORD_DATA reflect either today's cached shared puzzle or (if none
  // is available yet) the bundled local defaults.
  async function ready(game) {
    if (!window.PuzzleAuth || !window.PuzzleAuth.isConfigured()) return;

    try {
      const raw = localStorage.getItem(cacheKey(game));
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.day === todayKey()) {
          applyOverride(game, cached.data);
          return;
        }
      }
      const snapshot = await firebase.database().ref("puzzles/" + game).once("value");
      const data = snapshot.val();
      if (data) {
        localStorage.setItem(cacheKey(game), JSON.stringify({ day: todayKey(), data }));
        applyOverride(game, data);
      }
    } catch (e) {
      console.warn("Couldn't reach the shared puzzle store, using bundled defaults.", e);
    }
  }

  return { ready };
})();
