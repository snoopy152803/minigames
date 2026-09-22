window.PuzzleData.ready("crossword").then(function () {
  const gridEl = document.getElementById("grid");
  const clueBar = document.getElementById("clueBar");
  const acrossListEl = document.getElementById("acrossList");
  const downListEl = document.getElementById("downList");
  const toastEl = document.getElementById("toast");

  let puzzle = null;
  let inputs = [];
  let cellWordMap = []; // [r][c] = { across: entry|null, down: entry|null }
  let current = { dir: "across", entry: null };
  let isDaily = false;

  function toast(msg, ms = 1800) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function buildPuzzle(random) {
    isDaily = !random;
    const rand = random ? Math.random : window.makeSeededRandom(window.DailyPuzzle.dayNumber() + 1);
    puzzle = window.CrosswordGenerator.generate(window.CROSSWORD_DATA, { targetCount: 10, rand });
    if (!puzzle) {
      toast("Generation failed, retrying...");
      setTimeout(() => buildPuzzle(random), 50);
      return;
    }
    render();
  }

  function render() {
    cellWordMap = Array.from({ length: puzzle.rows }, () => new Array(puzzle.cols).fill(null).map(() => ({ across: null, down: null })));
    puzzle.across.forEach(w => {
      for (let i = 0; i < w.word.length; i++) cellWordMap[w.row][w.col + i].across = w;
    });
    puzzle.down.forEach(w => {
      for (let i = 0; i < w.word.length; i++) cellWordMap[w.row + i][w.col].down = w;
    });

    gridEl.style.gridTemplateColumns = "repeat(" + puzzle.cols + ", 1fr)";
    gridEl.style.maxWidth = (puzzle.cols * 44) + "px";
    gridEl.innerHTML = "";
    inputs = Array.from({ length: puzzle.rows }, () => new Array(puzzle.cols).fill(null));

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cellDiv = document.createElement("div");
        const letter = puzzle.grid[r][c];
        if (!letter) {
          cellDiv.className = "cw-cell block";
          gridEl.appendChild(cellDiv);
          continue;
        }
        cellDiv.className = "cw-cell";
        if (puzzle.numbers[r][c]) {
          const num = document.createElement("div");
          num.className = "cw-num";
          num.textContent = puzzle.numbers[r][c];
          cellDiv.appendChild(num);
        }
        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.dataset.r = r;
        input.dataset.c = c;
        input.addEventListener("focus", () => { onFocusCell(r, c); input.select(); });
        input.addEventListener("click", () => onFocusCell(r, c, true));
        input.addEventListener("input", (e) => onInputCell(e, r, c));
        input.addEventListener("keydown", (e) => onKeyDown(e, r, c));
        cellDiv.appendChild(input);
        gridEl.appendChild(cellDiv);
        inputs[r][c] = input;
      }
    }

    renderClueLists();
    const firstWord = puzzle.across[0];
    current = { dir: "across", entry: firstWord };
    focusCell(firstWord.row, firstWord.col);

    if (isDaily) {
      const saved = window.DailyPuzzle.loadState("crossword");
      if (saved && saved.rows === puzzle.rows && saved.cols === puzzle.cols && Array.isArray(saved.values)) {
        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.cols; c++) {
            const val = saved.values[r] && saved.values[r][c];
            if (val && inputs[r][c]) inputs[r][c].value = val;
          }
        }
      }
    }
  }

  function saveDaily() {
    if (!isDaily) return;
    const values = inputs.map(row => row.map(el => (el ? el.value : "")));
    window.DailyPuzzle.saveState("crossword", { rows: puzzle.rows, cols: puzzle.cols, values });
  }

  function renderClueLists() {
    acrossListEl.innerHTML = puzzle.across.map(w =>
      '<li data-num="' + w.number + '" data-dir="across">' + w.number + '. ' + w.clue + '</li>'
    ).join("");
    downListEl.innerHTML = puzzle.down.map(w =>
      '<li data-num="' + w.number + '" data-dir="down">' + w.number + '. ' + w.clue + '</li>'
    ).join("");
    [...acrossListEl.children, ...downListEl.children].forEach(li => {
      li.addEventListener("click", () => {
        const num = parseInt(li.dataset.num, 10);
        const dir = li.dataset.dir;
        const entry = (dir === "across" ? puzzle.across : puzzle.down).find(w => w.number === num);
        current = { dir, entry };
        focusCell(entry.row, entry.col);
      });
    });
  }

  function onFocusCell(r, c, toggle) {
    const cw = cellWordMap[r][c];
    if (toggle && current.entry && cellBelongsToEntry(r, c, current.entry) && cw.across && cw.down) {
      current = { dir: current.dir === "across" ? "down" : "across", entry: current.dir === "across" ? cw.down : cw.across };
    } else if (!cw[current.dir] || !cellBelongsToEntry(r, c, current.entry)) {
      current = cw.across ? { dir: "across", entry: cw.across } : { dir: "down", entry: cw.down };
    }
    highlight(r, c);
  }

  function cellBelongsToEntry(r, c, entry) {
    if (!entry) return false;
    if (entry.dir === "across") return r === entry.row && c >= entry.col && c < entry.col + entry.word.length;
    return c === entry.col && r >= entry.row && r < entry.row + entry.word.length;
  }

  function highlight(activeR, activeC) {
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const el = inputs[r][c];
        if (!el) continue;
        el.classList.remove("hl", "active");
        if (cellBelongsToEntry(r, c, current.entry)) el.classList.add("hl");
      }
    }
    if (inputs[activeR] && inputs[activeR][activeC]) inputs[activeR][activeC].classList.add("active");
    clueBar.textContent = current.entry ? current.entry.number + " " + (current.dir === "across" ? "Across" : "Down") + ": " + current.entry.clue : "";
    [...acrossListEl.children, ...downListEl.children].forEach(li => li.classList.remove("active"));
    if (current.entry) {
      const li = (current.dir === "across" ? acrossListEl : downListEl).querySelector('[data-num="' + current.entry.number + '"]');
      if (li) li.classList.add("active");
    }
  }

  function focusCell(r, c) {
    const el = inputs[r][c];
    if (el) el.focus();
    highlight(r, c);
  }

  function moveNext(r, c) {
    const dr = current.dir === "down" ? 1 : 0;
    const dc = current.dir === "across" ? 1 : 0;
    const nr = r + dr, nc = c + dc;
    if (cellBelongsToEntry(nr, nc, current.entry)) focusCell(nr, nc);
  }

  function movePrev(r, c) {
    const dr = current.dir === "down" ? -1 : 0;
    const dc = current.dir === "across" ? -1 : 0;
    const nr = r + dr, nc = c + dc;
    if (cellBelongsToEntry(nr, nc, current.entry)) focusCell(nr, nc);
  }

  function onInputCell(e, r, c) {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    e.target.value = val.slice(-1);
    e.target.classList.remove("correct", "incorrect");
    if (val) moveNext(r, c);
    saveDaily();
  }

  function onKeyDown(e, r, c) {
    if (e.key === "Backspace" && !e.target.value) {
      movePrev(r, c);
    } else if (e.key === "ArrowRight") {
      if (inputs[r][c + 1]) focusCellRaw(r, c + 1);
    } else if (e.key === "ArrowLeft") {
      if (inputs[r][c - 1]) focusCellRaw(r, c - 1);
    } else if (e.key === "ArrowDown") {
      if (inputs[r + 1] && inputs[r + 1][c]) focusCellRaw(r + 1, c);
    } else if (e.key === "ArrowUp") {
      if (inputs[r - 1] && inputs[r - 1][c]) focusCellRaw(r - 1, c);
    }
  }

  function focusCellRaw(r, c) {
    const cw = cellWordMap[r][c];
    current = cw[current.dir] ? { dir: current.dir, entry: cw[current.dir] } : (cw.across ? { dir: "across", entry: cw.across } : { dir: "down", entry: cw.down });
    focusCell(r, c);
  }

  function allEntries() {
    return [...puzzle.across, ...puzzle.down];
  }

  document.getElementById("checkBtn").addEventListener("click", () => {
    let correctCount = 0, filled = 0;
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const el = inputs[r][c];
        if (!el) continue;
        if (!el.value) continue;
        filled++;
        el.classList.remove("correct", "incorrect");
        if (el.value === puzzle.grid[r][c]) {
          el.classList.add("correct");
          correctCount++;
        } else {
          el.classList.add("incorrect");
        }
      }
    }
    const totalLetters = puzzle.grid.flat().filter(Boolean).length;
    if (correctCount === totalLetters) {
      toast("Solved! Nice work.", 3000);
      if (isDaily) window.DailyPuzzle.markCompleted("crossword");
    } else {
      toast(correctCount + " / " + filled + " filled letters correct");
    }
  });

  document.getElementById("revealBtn").addEventListener("click", () => {
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const el = inputs[r][c];
        if (!el) continue;
        el.value = puzzle.grid[r][c];
        el.classList.remove("incorrect");
        el.classList.add("correct");
      }
    }
    toast("Puzzle revealed");
    if (isDaily) window.DailyPuzzle.markCompleted("crossword");
    saveDaily();
  });

  document.getElementById("newPuzzleBtn").addEventListener("click", () => {
    puzzle = null;
    buildPuzzle(true);
  });

  buildPuzzle(false);
});
