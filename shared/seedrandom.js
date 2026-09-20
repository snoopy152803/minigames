// A tiny deterministic PRNG (mulberry32) so a generator that normally uses
// Math.random() can instead be given a function that always produces the
// same sequence for the same seed — that's what lets the crossword page
// regenerate the exact same puzzle for a given day, on demand, without
// having to store it anywhere.
window.makeSeededRandom = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
