// Automatic Pips generator: tiles a small grid with dominoes (a random draw
// from the real 28-piece set), then derives region constraints (sum / all
// equal) from that solution so the puzzle is always solvable.
window.PipsGenerator = (function () {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Randomized backtracking perfect-tiling of a rows x cols grid with
  // dominoes (each covering two orthogonally adjacent cells).
  function tileGrid(rows, cols) {
    const grid = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const slots = [];

    function firstEmpty() {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c]) return [r, c];
        }
      }
      return null;
    }

    function solve() {
      const cell = firstEmpty();
      if (!cell) return true;
      const [r, c] = cell;
      const neighbors = shuffle([[r + 1, c], [r, c + 1], [r - 1, c], [r, c - 1]]);
      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc]) continue;
        grid[r][c] = true; grid[nr][nc] = true;
        slots.push([[r, c], [nr, nc]]);
        if (solve()) return true;
        slots.pop();
        grid[r][c] = false; grid[nr][nc] = false;
      }
      return false;
    }

    return solve() ? slots : null;
  }

  function fullDominoSet() {
    const set = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) set.push([a, b]);
    return set;
  }

  // Partition all cells into contiguous regions of roughly `targetSize` cells
  // via randomized growth from seed cells.
  function makeRegions(rows, cols, targetSize) {
    const total = rows * cols;
    const numRegions = Math.max(2, Math.round(total / targetSize));
    const owner = Array.from({ length: rows }, () => new Array(cols).fill(-1));
    const allCells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) allCells.push([r, c]);
    const seeds = shuffle(allCells).slice(0, numRegions);
    const queues = seeds.map((seed, i) => { owner[seed[0]][seed[1]] = i; return [seed]; });

    let remaining = total - numRegions;
    let stuck = 0;
    while (remaining > 0 && stuck < numRegions * 4) {
      let grew = false;
      for (let i = 0; i < queues.length && remaining > 0; i++) {
        const q = queues[i];
        if (!q.length) continue;
        const idx = Math.floor(Math.random() * q.length);
        const [r, c] = q[idx];
        const neighbors = shuffle([[r + 1, c], [r, c + 1], [r - 1, c], [r, c - 1]])
          .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && owner[nr][nc] === -1);
        if (neighbors.length) {
          const [nr, nc] = neighbors[0];
          owner[nr][nc] = i;
          q.push([nr, nc]);
          remaining--;
          grew = true;
        }
      }
      stuck = grew ? 0 : stuck + 1;
    }
    // Any leftover unclaimed cells (rare, from getting boxed in) join the
    // nearest region with an adjacent owned cell.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (owner[r][c] !== -1) continue;
        const neighbors = [[r + 1, c], [r, c + 1], [r - 1, c], [r, c - 1]]
          .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && owner[nr][nc] !== -1);
        owner[r][c] = neighbors.length ? owner[neighbors[0][0]][neighbors[0][1]] : 0;
      }
    }
    const regions = Array.from({ length: numRegions }, () => []);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) regions[owner[r][c]].push([r, c]);
    return regions.filter(cells => cells.length > 0);
  }

  const REGION_COLORS = ["#f9df6d", "#a0c35a", "#b0c4ef", "#ba81c5", "#f4a988", "#8fd1c9"];

  function generate(opts) {
    opts = opts || {};
    const rows = opts.rows || 4;
    const cols = opts.cols || 4;

    for (let attempt = 0; attempt < 20; attempt++) {
      const slots = tileGrid(rows, cols);
      if (!slots || slots.length < 2) continue;

      const pool = shuffle(fullDominoSet()).slice(0, slots.length);
      const pipGrid = Array.from({ length: rows }, () => new Array(cols).fill(0));
      const dominoes = slots.map((slot, i) => {
        const [a, b] = pool[i];
        const flip = Math.random() < 0.5;
        const [cellA, cellB] = slot;
        const valA = flip ? b : a;
        const valB = flip ? a : b;
        pipGrid[cellA[0]][cellA[1]] = valA;
        pipGrid[cellB[0]][cellB[1]] = valB;
        return { id: i, a, b, cells: slot };
      });

      const regions = makeRegions(rows, cols, 3.5).map((cells, i) => {
        const values = cells.map(([r, c]) => pipGrid[r][c]);
        const allEqual = values.every(v => v === values[0]);
        const type = allEqual && Math.random() < 0.6 ? "equal" : "sum";
        const target = type === "equal" ? values[0] : values.reduce((s, v) => s + v, 0);
        return { cells, type, target, color: REGION_COLORS[i % REGION_COLORS.length] };
      });

      return {
        rows, cols,
        slots: slots.map((s, i) => ({ id: i, cells: s })),
        regions,
        dominoes: shuffle(dominoes.map(d => ({ a: d.a, b: d.b }))),
        pipGrid
      };
    }
    return null;
  }

  return { generate };
})();
