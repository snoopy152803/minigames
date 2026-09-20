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
  // days would all start with the same couple of letters). Mixing the day
  // number first spreads consecutive days pseudo-randomly across the whole
  // list while staying a pure, deterministic function of (day, len).
  function indexForDay(day, len) {
    let h = (day ^ 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^ (h >>> 16)) >>> 0;
    return h % len;
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

  return { dayNumber, indexForDay, dateForDay, formatDate, markCompleted, isCompleted };
})();
