// Automatic crossword generator: places words from the clue database onto a
// grid by finding letter intersections, then trims to a bounding box and
// numbers the across/down entries.
window.CrosswordGenerator = (function () {
  const CANVAS = 21;
  const CENTER = Math.floor(CANVAS / 2);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeGrid() {
    return Array.from({ length: CANVAS }, () => new Array(CANVAS).fill(null));
  }

  function canPlace(grid, word, r, c, dir) {
    const len = word.length;
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const endR = r + dr * (len - 1);
    const endC = c + dc * (len - 1);
    if (r < 0 || c < 0 || endR < 0 || endC < 0 || endR >= CANVAS || endC >= CANVAS) return false;

    const beforeR = r - dr, beforeC = c - dc;
    const afterR = endR + dr, afterC = endC + dc;
    if (beforeR >= 0 && beforeC >= 0 && beforeR < CANVAS && beforeC < CANVAS && grid[beforeR][beforeC]) return false;
    if (afterR >= 0 && afterC >= 0 && afterR < CANVAS && afterC < CANVAS && grid[afterR][afterC]) return false;

    let hasIntersection = false;
    for (let i = 0; i < len; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const existing = grid[rr][cc];
      if (existing) {
        if (existing !== word[i]) return false;
        hasIntersection = true;
      } else {
        // Perpendicular neighbors must be empty so we don't create
        // accidental adjacent words.
        if (dir === "across") {
          if (rr - 1 >= 0 && grid[rr - 1][cc]) return false;
          if (rr + 1 < CANVAS && grid[rr + 1][cc]) return false;
        } else {
          if (cc - 1 >= 0 && grid[rr][cc - 1]) return false;
          if (cc + 1 < CANVAS && grid[rr][cc + 1]) return false;
        }
      }
    }
    return hasIntersection;
  }

  function place(grid, word, r, c, dir) {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
      grid[r + dr * i][c + dc * i] = word[i];
    }
  }

  function findPlacement(grid, word, placedWords) {
    const candidates = [];
    for (const pw of placedWords) {
      for (let i = 0; i < pw.word.length; i++) {
        const ch = pw.word[i];
        for (let j = 0; j < word.length; j++) {
          if (word[j] !== ch) continue;
          const dir = pw.dir === "across" ? "down" : "across";
          let r, c;
          if (pw.dir === "across") {
            r = pw.row - j;
            c = pw.col + i;
          } else {
            r = pw.row + i;
            c = pw.col - j;
          }
          if (canPlace(grid, word, r, c, dir)) {
            candidates.push({ r, c, dir });
          }
        }
      }
    }
    return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  }

  function generate(database, opts) {
    opts = opts || {};
    const targetCount = opts.targetCount || 12;
    const pool = shuffle(database.filter(e => e.word.length >= 3 && e.word.length <= 14));

    for (let attempt = 0; attempt < 25; attempt++) {
      const grid = makeGrid();
      const shuffled = shuffle(pool);
      const sorted = shuffled.sort((a, b) => b.word.length - a.word.length).slice(0, Math.min(40, shuffled.length));
      const first = sorted[0];
      const startCol = CENTER - Math.floor(first.word.length / 2);
      place(grid, first.word, CENTER, startCol, "across");
      const placedWords = [{ word: first.word, clue: first.clue, row: CENTER, col: startCol, dir: "across" }];

      for (let i = 1; i < sorted.length && placedWords.length < targetCount; i++) {
        const entry = sorted[i];
        if (placedWords.some(p => p.word === entry.word)) continue;
        const placement = findPlacement(grid, entry.word, placedWords);
        if (placement) {
          place(grid, entry.word, placement.r, placement.c, placement.dir);
          placedWords.push({ word: entry.word, clue: entry.clue, row: placement.r, col: placement.c, dir: placement.dir });
        }
      }

      if (placedWords.length >= Math.min(6, targetCount)) {
        return finalize(grid, placedWords);
      }
    }
    return null;
  }

  function finalize(grid, placedWords) {
    let minR = CANVAS, maxR = -1, minC = CANVAS, maxC = -1;
    for (const p of placedWords) {
      const dr = p.dir === "down" ? 1 : 0;
      const dc = p.dir === "across" ? 1 : 0;
      const endR = p.row + dr * (p.word.length - 1);
      const endC = p.col + dc * (p.word.length - 1);
      minR = Math.min(minR, p.row, endR);
      maxR = Math.max(maxR, p.row, endR);
      minC = Math.min(minC, p.col, endC);
      maxC = Math.max(maxC, p.col, endC);
    }
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    const trimmed = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) row.push(grid[minR + r][minC + c]);
      trimmed.push(row);
    }
    const words = placedWords.map(p => ({
      word: p.word,
      clue: p.clue,
      row: p.row - minR,
      col: p.col - minC,
      dir: p.dir
    }));

    // Number cells: a cell starts a numbered entry if it begins an across
    // and/or down word of length >= 2.
    const numbers = Array.from({ length: rows }, () => new Array(cols).fill(null));
    let num = 1;
    const acrossStarts = new Map();
    const downStarts = new Map();
    words.forEach(w => {
      const key = w.row + "," + w.col;
      if (w.dir === "across") acrossStarts.set(key, w);
      else downStarts.set(key, w);
    });
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!trimmed[r][c]) continue;
        const key = r + "," + c;
        if (acrossStarts.has(key) || downStarts.has(key)) {
          numbers[r][c] = num;
          if (acrossStarts.has(key)) acrossStarts.get(key).number = num;
          if (downStarts.has(key)) downStarts.get(key).number = num;
          num++;
        }
      }
    }

    return {
      rows, cols,
      grid: trimmed,
      numbers,
      across: words.filter(w => w.dir === "across").sort((a, b) => a.number - b.number),
      down: words.filter(w => w.dir === "down").sort((a, b) => a.number - b.number)
    };
  }

  return { generate };
})();
