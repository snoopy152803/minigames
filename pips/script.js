(function () {
  const boardEl = document.getElementById("board");
  const trayEl = document.getElementById("tray");
  const toastEl = document.getElementById("toast");

  let puzzle = null;
  let cellSlotId = [], cellRegionIdx = [];
  let placements = {};   // slotId -> { a, b, flipped }
  let tray = [];         // { a, b, used }
  let selectedTrayIdx = null;

  function toast(msg, ms = 1800) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function buildPuzzle() {
    for (let tries = 0; tries < 10 && !puzzle; tries++) {
      puzzle = window.PipsGenerator.generate({ rows: 4, cols: 4 });
    }
    if (!puzzle) { toast("Generation failed, retrying..."); setTimeout(buildPuzzle, 50); return; }

    cellSlotId = Array.from({ length: puzzle.rows }, () => new Array(puzzle.cols).fill(-1));
    puzzle.slots.forEach(s => s.cells.forEach(([r, c]) => { cellSlotId[r][c] = s.id; }));

    cellRegionIdx = Array.from({ length: puzzle.rows }, () => new Array(puzzle.cols).fill(-1));
    puzzle.regions.forEach((reg, i) => reg.cells.forEach(([r, c]) => { cellRegionIdx[r][c] = i; }));

    placements = {};
    tray = puzzle.dominoes.map(d => ({ a: d.a, b: d.b, used: false }));
    selectedTrayIdx = null;
    render();
  }

  function labelCellKey(regionIdx) {
    const reg = puzzle.regions[regionIdx];
    const [r, c] = reg.cells[0];
    return r + "," + c;
  }

  function render() {
    renderBoard();
    renderTray();
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = "repeat(" + puzzle.cols + ", 1fr)";
    boardEl.innerHTML = "";
    const labelCells = new Set(puzzle.regions.map((_, i) => labelCellKey(i)));

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cell = document.createElement("div");
        cell.className = "pips-cell";
        const regionIdx = cellRegionIdx[r][c];
        cell.style.background = puzzle.regions[regionIdx].color;

        const slotId = cellSlotId[r][c];
        const slot = puzzle.slots[slotId];
        const [cellA, cellB] = slot.cells;
        const isFirst = cellA[0] === r && cellA[1] === c;
        const other = isFirst ? cellB : cellA;
        // Draw a wall on every side except the one joining this cell to its
        // domino partner, so each domino slot reads as one joined outline.
        [[r - 1, c, "wall-top"], [r + 1, c, "wall-bottom"], [r, c - 1, "wall-left"], [r, c + 1, "wall-right"]].forEach(([nr, nc, cls]) => {
          const isOther = nr === other[0] && nc === other[1];
          if (isOther) return;
          const neighborSlot = (nr >= 0 && nr < puzzle.rows && nc >= 0 && nc < puzzle.cols) ? cellSlotId[nr][nc] : null;
          if (neighborSlot !== slotId) cell.classList.add(cls);
        });

        const placement = placements[slotId];
        if (placement) {
          cell.classList.add("filled");
          const val = isFirst ? (placement.flipped ? placement.b : placement.a) : (placement.flipped ? placement.a : placement.b);
          cell.textContent = val;
        }

        if (labelCells.has(r + "," + c)) {
          const reg = puzzle.regions[regionIdx];
          const badge = document.createElement("div");
          badge.className = "badge";
          badge.textContent = reg.type === "equal" ? "=" + reg.target : "Σ" + reg.target;
          cell.appendChild(badge);
        }

        cell.addEventListener("click", () => onCellClick(slotId));
        boardEl.appendChild(cell);
      }
    }
  }

  function renderTray() {
    trayEl.innerHTML = "";
    tray.forEach((d, i) => {
      if (d.used) return;
      const el = document.createElement("div");
      el.className = "pips-domino" + (selectedTrayIdx === i ? " selected" : "");
      el.innerHTML = '<div class="half">' + d.a + '</div><div class="half">' + d.b + '</div>';
      el.addEventListener("click", () => {
        selectedTrayIdx = selectedTrayIdx === i ? null : i;
        render();
      });
      trayEl.appendChild(el);
    });
  }

  function onCellClick(slotId) {
    if (placements[slotId]) {
      placements[slotId].flipped = !placements[slotId].flipped;
      render();
      return;
    }
    if (selectedTrayIdx === null) { toast("Pick a domino from below first"); return; }
    const d = tray[selectedTrayIdx];
    placements[slotId] = { a: d.a, b: d.b, flipped: false };
    d.used = true;
    selectedTrayIdx = null;
    render();
  }

  document.getElementById("clearBtn").addEventListener("click", () => {
    placements = {};
    tray.forEach(d => d.used = false);
    selectedTrayIdx = null;
    render();
  });

  document.getElementById("checkBtn").addEventListener("click", () => {
    if (Object.keys(placements).length < puzzle.slots.length) {
      toast("Fill every domino outline first");
      return;
    }
    const pipGrid = Array.from({ length: puzzle.rows }, () => new Array(puzzle.cols).fill(0));
    puzzle.slots.forEach(slot => {
      const p = placements[slot.id];
      const [cellA, cellB] = slot.cells;
      pipGrid[cellA[0]][cellA[1]] = p.flipped ? p.b : p.a;
      pipGrid[cellB[0]][cellB[1]] = p.flipped ? p.a : p.b;
    });
    const allOk = puzzle.regions.every(reg => {
      const vals = reg.cells.map(([r, c]) => pipGrid[r][c]);
      if (reg.type === "equal") return vals.every(v => v === vals[0]);
      return vals.reduce((s, v) => s + v, 0) === reg.target;
    });
    toast(allOk ? "Solved! Nice work." : "Not quite — some regions don't match yet.", allOk ? 3000 : 2200);
  });

  document.getElementById("newPuzzleBtn").addEventListener("click", () => {
    puzzle = null;
    buildPuzzle();
  });

  buildPuzzle();
})();
