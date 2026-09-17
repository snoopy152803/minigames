// Automatic Strands board generator: places each word (including the spangram)
// as a non-overlapping self-avoiding path of adjacent cells (8-directional),
// then fills the remaining cells with random letters.
window.StrandsGenerator = (function () {
  const DIRS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function inBounds(r, c, rows, cols) {
    return r >= 0 && r < rows && c >= 0 && c < cols;
  }

  function tryPlaceWord(word, rows, cols, occupied, maxAttempts) {
    const cells = Object.keys(occupied);
    const allCells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) allCells.push([r, c]);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const starts = shuffle(allCells);
      for (const [sr, sc] of starts) {
        const key0 = sr + "," + sc;
        if (occupied[key0]) continue;
        const path = [[sr, sc]];
        const used = new Set([key0]);
        let ok = true;
        for (let i = 1; i < word.length; i++) {
          const [cr, cc] = path[path.length - 1];
          const options = shuffle(DIRS)
            .map(([dr, dc]) => [cr + dr, cc + dc])
            .filter(([nr, nc]) => inBounds(nr, nc, rows, cols))
            .filter(([nr, nc]) => !occupied[nr + "," + nc] && !used.has(nr + "," + nc));
          if (options.length === 0) { ok = false; break; }
          const [nr, nc] = options[0];
          path.push([nr, nc]);
          used.add(nr + "," + nc);
        }
        if (ok && path.length === word.length) return path;
      }
    }
    return null;
  }

  function generate(puzzle, opts) {
    opts = opts || {};
    const words = [puzzle.spangram, ...puzzle.words];
    const totalLetters = words.reduce((s, w) => s + w.length, 0);
    const cols = opts.cols || 6;
    const fillerTarget = Math.max(8, Math.round(totalLetters * 0.35));
    const totalCells = totalLetters + fillerTarget;
    const rows = Math.ceil(totalCells / cols);

    const maxOuterAttempts = 40;
    for (let outer = 0; outer < maxOuterAttempts; outer++) {
      const order = shuffle(words.map((w, i) => i)).map(i => words[i]);
      const occupied = {};
      const placements = {};
      let success = true;
      for (const word of order) {
        const path = tryPlaceWord(word, rows, cols, occupied, 60);
        if (!path) { success = false; break; }
        path.forEach(([r, c]) => { occupied[r + "," + c] = word; });
        placements[word] = path;
      }
      if (success) {
        const grid = [];
        for (let r = 0; r < rows; r++) {
          grid.push(new Array(cols).fill(null));
        }
        for (const word in placements) {
          placements[word].forEach(([r, c], idx) => {
            grid[r][c] = word[idx];
          });
        }
        const letterPool = words.join("").split("");
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (!grid[r][c]) {
              grid[r][c] = letterPool[Math.floor(Math.random() * letterPool.length)];
            }
          }
        }
        return {
          rows, cols, grid,
          spangram: puzzle.spangram,
          theme: puzzle.theme,
          words: puzzle.words,
          paths: placements
        };
      }
    }
    return null;
  }

  return { generate };
})();
