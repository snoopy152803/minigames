window.PuzzleData.ready("strands").then(function () {
  const gridEl = document.getElementById("grid");
  const themeBox = document.getElementById("themeBox");
  const progressEl = document.getElementById("progress");
  const toastEl = document.getElementById("toast");
  const lineLayer = document.getElementById("lineLayer");

  let board = null;
  let isDaily = false;
  let foundWords = new Set();
  let selecting = false;   // a selection sequence is in progress (may span multiple taps)
  let dragging = false;    // pointer button is currently held down
  let dragMoved = false;   // pointer moved to a different cell since the last pointerdown
  let selectedPath = [];
  let cellEls = [];

  function toast(msg, ms = 1500) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function pickPuzzle(random) {
    const list = window.STRANDS_DATA;
    isDaily = !random;
    const idx = random
      ? Math.floor(Math.random() * list.length)
      : window.DailyPuzzle.indexForDay(window.DailyPuzzle.dayNumber(), list.length);
    return list[idx];
  }

  function buildBoard(random) {
    const puzzle = pickPuzzle(random);
    for (let tries = 0; tries < 5 && !board; tries++) {
      board = window.StrandsGenerator.generate(puzzle);
    }
    if (!board) {
      toast("Could not generate puzzle, retrying...");
      setTimeout(() => buildBoard(random), 50);
      return;
    }
    foundWords = new Set();
    render();

    if (isDaily) {
      const saved = window.DailyPuzzle.loadState("strands");
      if (saved && saved.theme === board.theme && Array.isArray(saved.found)) {
        saved.found.forEach(word => markFound(word, /* silent */ true));
        renderProgress();
      }
    }
  }

  function saveDaily() {
    if (isDaily) window.DailyPuzzle.saveState("strands", { theme: board.theme, found: [...foundWords] });
  }

  // Marks a word (already known-correct) found: colors its cells and adds it
  // to foundWords. Used both live (from checkSelection) and when restoring
  // today's saved progress on page load.
  function markFound(word, silent) {
    const path = board.paths[word];
    if (!path || foundWords.has(word)) return;
    foundWords.add(word);
    const cls = word === board.spangram ? "found-spangram" : "found-theme";
    path.forEach(([r, c]) => cellEls[r][c] && cellEls[r][c].classList.add(cls));
    if (!silent) {
      toast(word === board.spangram ? "SPANGRAM! " + word : "Found: " + word);
    }
  }

  function render() {
    themeBox.innerHTML =
      '<div class="theme-label">Today\'s Theme</div>' +
      '<div class="theme-name">' + board.theme + '</div>';

    gridEl.style.gridTemplateColumns = "repeat(" + board.cols + ", 1fr)";
    gridEl.style.maxWidth = (board.cols * 56) + "px";
    gridEl.innerHTML = "";
    cellEls = [];
    for (let r = 0; r < board.rows; r++) {
      const rowEls = [];
      for (let c = 0; c < board.cols; c++) {
        const cell = document.createElement("div");
        cell.className = "strands-cell";
        cell.textContent = board.grid[r][c];
        cell.dataset.r = r;
        cell.dataset.c = c;
        gridEl.appendChild(cell);
        rowEls.push(cell);
      }
      cellEls.push(rowEls);
    }
    renderProgress();
    attachEvents();
  }

  function renderProgress() {
    const total = board.words.length + 1;
    progressEl.innerHTML =
      '<div>' + foundWords.size + ' / ' + total + ' found</div>' +
      Array.from(foundWords).map(w =>
        '<span class="found-word' + (w === board.spangram ? ' spangram' : '') + '">' + w + '</span>'
      ).join("");
  }

  function cellCenter(r, c) {
    const el = cellEls[r][c];
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function drawLine() {
    lineLayer.innerHTML = "";
    if (selectedPath.length < 2) return;
    let d = "";
    selectedPath.forEach(([r, c], i) => {
      const p = cellCenter(r, c);
      d += (i === 0 ? "M" : "L") + p.x + "," + p.y + " ";
    });
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "rgba(77,157,255,0.6)");
    path.setAttribute("stroke-width", "18");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("fill", "none");
    lineLayer.appendChild(path);
  }

  function isAdjacent(a, b) {
    return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && !(a[0] === b[0] && a[1] === b[1]);
  }

  // Returns true if the letters spelled out by the current selectedPath
  // (forwards or backwards) match an unfound word, and if so, marks it found
  // using the path the player actually traced. Deliberately does NOT require
  // selectedPath to match the generator's own stored solution path: the grid
  // is filled with letters drawn from the puzzle's own word list, so a word
  // can legitimately be spellable via more than one adjacent route, and any
  // of them should count.
  function checkSelection() {
    const forward = selectedPath.map(([r, c]) => board.grid[r][c]).join("");
    const backward = forward.split("").reverse().join("");
    const candidates = [board.spangram, ...board.words].filter(w => !foundWords.has(w));
    const word = candidates.find(w => w === forward || w === backward);
    if (!word) return false;

    foundWords.add(word);
    const cls = word === board.spangram ? "found-spangram" : "found-theme";
    selectedPath.forEach(([r, c]) => cellEls[r][c].classList.add(cls));
    toast(word === board.spangram ? "SPANGRAM! " + word : "Found: " + word);
    renderProgress();
    saveDaily();
    if (foundWords.size === board.words.length + 1) {
      setTimeout(() => toast("Puzzle complete!", 3000), 400);
      if (isDaily) window.DailyPuzzle.markCompleted("strands");
    }
    resetSelection();
    return true;
  }

  function clearSelectionStyles() {
    selectedPath.forEach(([r, c]) => cellEls[r][c] && cellEls[r][c].classList.remove("selecting"));
  }

  function resetSelection() {
    clearSelectionStyles();
    selecting = false;
    selectedPath = [];
    lineLayer.innerHTML = "";
  }

  function startSelection(r, c) {
    resetSelection();
    selecting = true;
    selectedPath = [[r, c]];
    cellEls[r][c].classList.add("selecting");
    drawLine();
  }

  // Shared by both drag-move and tap-to-extend: try to grow (or shrink, via
  // backtrack) the in-progress path onto cell (r,c). Auto-submits the moment
  // the path matches a solution.
  function extendSelect(r, c) {
    if (!selecting) return;
    const last = selectedPath[selectedPath.length - 1];
    if (last[0] === r && last[1] === c) return;
    const idx = selectedPath.findIndex(rc => rc[0] === r && rc[1] === c);
    if (idx !== -1 && idx === selectedPath.length - 2) {
      const removed = selectedPath.pop();
      cellEls[removed[0]][removed[1]].classList.remove("selecting");
      drawLine();
      return;
    }
    if (idx !== -1) return;
    if (!isAdjacent(last, [r, c])) return;
    selectedPath.push([r, c]);
    cellEls[r][c].classList.add("selecting");
    drawLine();
    if (selectedPath.length >= 3) checkSelection();
  }

  // Click/tap handling: a tap on the current last cell submits the
  // selection; a tap elsewhere extends (or restarts) it. This lets a word be
  // built with a series of individual taps instead of one continuous drag.
  function tapCell(r, c) {
    if (!selecting) {
      startSelection(r, c);
      return;
    }
    const last = selectedPath[selectedPath.length - 1];
    if (last[0] === r && last[1] === c) {
      if (selectedPath.length >= 3 && !checkSelection()) {
        toast("Not a valid word");
        resetSelection();
      }
      return;
    }
    const wasAdjacent = isAdjacent(last, [r, c]) || selectedPath.some(rc => rc[0] === r && rc[1] === c);
    if (!wasAdjacent) {
      startSelection(r, c);
      return;
    }
    extendSelect(r, c);
  }

  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.classList.contains("strands-cell")) return null;
    return [parseInt(el.dataset.r, 10), parseInt(el.dataset.c, 10)];
  }

  function attachEvents() {
    gridEl.onpointerdown = (e) => {
      const rc = cellFromPoint(e.clientX, e.clientY);
      if (!rc) return;
      dragging = true;
      dragMoved = false;
      tapCell(rc[0], rc[1]);
    };
    gridEl.onpointermove = (e) => {
      if (!dragging || !selecting) return;
      const rc = cellFromPoint(e.clientX, e.clientY);
      if (!rc) return;
      const last = selectedPath[selectedPath.length - 1];
      if (last[0] === rc[0] && last[1] === rc[1]) return;
      dragMoved = true;
      extendSelect(rc[0], rc[1]);
    };
    window.onpointerup = () => {
      if (dragging && dragMoved && selecting) {
        // A drag always resolves on release: either it matched (checkSelection
        // inside extendSelect already reset it) or it didn't, in which case
        // we clear it like the real game does.
        resetSelection();
      }
      dragging = false;
      dragMoved = false;
    };
  }

  document.getElementById("hintBtn").addEventListener("click", () => {
    const remaining = [board.spangram, ...board.words].filter(w => !foundWords.has(w));
    if (remaining.length === 0) { toast("All words found!"); return; }
    const word = remaining[Math.floor(Math.random() * remaining.length)];
    toast(word.length + " letters: starts with \"" + word[0] + "\"", 2500);
  });

  document.getElementById("newPuzzleBtn").addEventListener("click", () => {
    board = null;
    buildBoard(true);
  });

  buildBoard(false);
});
