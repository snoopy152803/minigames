// Shared "which day is it" + "has this browser finished today's puzzle"
// logic, used by every game's script.js and by the /answers pages so they
// all agree on the same day numbering.
window.DailyPuzzle = (function () {
  const EPOCH = Date.UTC(2024, 0, 1);

  function dayNumber(date) {
    date = date || new Date();
    return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / 86400000);
  }

  // Plain `day % len` would walk straight through the array in order, which
  // looks terrible when the array happens to be alphabetized (consecutive
  // days would all start with the same couple of letters). A one-off hash
  // would fix that but introduces a worse problem: hashing then reducing
  // mod len samples indices WITH replacement, so by the birthday paradox two
  // different days can land on the same puzzle far sooner than `len` days
  // apart — which means that puzzle could reappear, unspoiled, in the
  // "previous answers" list and give today's away by coincidence.
  //
  // A true permutation of [0, len) avoids that: every index appears exactly
  // once per `len`-day cycle, so the soonest any puzzle can repeat is
  // exactly `len` days later, never sooner. The permutation itself is
  // computed with a small seeded shuffle (not Math.random), seeded only by
  // `len`, so it's identical for everyone and stable across reloads.
  const permutationCache = {};
  function permutationFor(len) {
    if (permutationCache[len]) return permutationCache[len];
    const arr = Array.from({ length: len }, (_, i) => i);
    let seed = (0x2545f491 ^ len) >>> 0;
    function rand() {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    permutationCache[len] = arr;
    return arr;
  }

  function indexForDay(day, len) {
    const cycleDay = ((day % len) + len) % len;
    return permutationFor(len)[cycleDay];
  }

  function dateForDay(day) {
    return new Date(EPOCH + day * 86400000);
  }

  function formatDate(d) {
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  function completionKey(game, day) {
    return "completed-" + game + "-" + day;
  }

  function markCompleted(game, day) {
    try { localStorage.setItem(completionKey(game, day == null ? dayNumber() : day), "1"); } catch (e) {}
  }

  function isCompleted(game, day) {
    try { return localStorage.getItem(completionKey(game, day == null ? dayNumber() : day)) === "1"; } catch (e) { return false; }
  }

  // In-progress state for TODAY's puzzle (guesses so far, found words, typed
  // letters, etc. — whatever shape a given game needs), so leaving the page
  // and coming back doesn't reset it. Only ever used for the daily puzzle,
  // never for a "New puzzle"/"New word" practice round.
  function stateKey(game, day) {
    return "state-" + game + "-" + day;
  }

  function saveState(game, state, day) {
    try { localStorage.setItem(stateKey(game, day == null ? dayNumber() : day), JSON.stringify(state)); } catch (e) {}
  }

  function loadState(game, day) {
    try {
      const raw = localStorage.getItem(stateKey(game, day == null ? dayNumber() : day));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  return { dayNumber, indexForDay, dateForDay, formatDate, markCompleted, isCompleted, saveState, loadState };
})();
