window.PuzzleData.ready("connections").then(function () {
  const gridEl = document.getElementById("grid");
  const solvedEl = document.getElementById("solvedGroups");
  const livesEl = document.getElementById("livesLeft");
  const toastEl = document.getElementById("toast");

  const MAX_MISTAKES = 4;
  let puzzle = null;
  let isDaily = false;
  let tiles = [];       // [{word, category, color}]
  let solved = [];      // categories already solved, in solve order
  let selected = [];    // currently selected words
  let mistakes = 0;
  let over = false;

  function toast(msg, ms = 1600) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function newGame(random) {
    const list = window.CONNECTIONS_DATA;
    isDaily = !random;
    const idx = random
      ? Math.floor(Math.random() * list.length)
      : window.DailyPuzzle.indexForDay(window.DailyPuzzle.dayNumber(), list.length);
    puzzle = list[idx];
    tiles = shuffle(puzzle.groups.flatMap(g => g.words.map(w => ({ word: w, category: g.category, color: g.color }))));
    solved = [];
    selected = [];
    mistakes = 0;
    over = false;

    if (isDaily) {
      const saved = window.DailyPuzzle.loadState("connections");
      if (saved) {
        solved = puzzle.groups.filter(g => (saved.solvedCategories || []).includes(g.category));
        tiles = tiles.filter(t => !solved.some(g => g.words.includes(t.word)));
        mistakes = saved.mistakes || 0;
        over = solved.length === puzzle.groups.length || mistakes >= MAX_MISTAKES;
        if (over && solved.length !== puzzle.groups.length) {
          // A past loss reveals everything, same as a live one.
          solved = puzzle.groups.slice();
          tiles = [];
        }
      }
    }
    render();
  }

  function saveDaily() {
    if (isDaily) window.DailyPuzzle.saveState("connections", { solvedCategories: solved.map(g => g.category), mistakes });
  }

  function render() {
    livesEl.textContent = "●".repeat(MAX_MISTAKES - mistakes) + "○".repeat(mistakes);
    solvedEl.innerHTML = solved.map(g =>
      '<div class="solved-group ' + g.color + '"><div class="cat">' + g.category + '</div><div class="words">' + g.words.join(", ") + '</div></div>'
    ).join("");

    gridEl.innerHTML = "";
    tiles.forEach(t => {
      const el = document.createElement("div");
      el.className = "conn-tile" + (selected.includes(t.word) ? " selected" : "");
      el.textContent = t.word;
      if (!over) {
        el.addEventListener("click", () => toggleSelect(t.word));
      }
      gridEl.appendChild(el);
    });
  }

  function toggleSelect(word) {
    if (over) return;
    const idx = selected.indexOf(word);
    if (idx !== -1) {
      selected.splice(idx, 1);
    } else if (selected.length < 4) {
      selected.push(word);
    }
    render();
  }

  function submit() {
    if (over || selected.length !== 4) {
      if (!over) toast("Select 4 words first");
      return;
    }
    const group = puzzle.groups.find(g => !solved.includes(g) && g.words.every(w => selected.includes(w)));
    if (group) {
      solved.push(group);
      tiles = tiles.filter(t => !group.words.includes(t.word));
      selected = [];
      toast("Solved: " + group.category);
      if (solved.length === puzzle.groups.length) {
        over = true;
        setTimeout(() => toast("You found all four groups!", 3000), 300);
        if (isDaily) window.DailyPuzzle.markCompleted("connections");
      }
      saveDaily();
      render();
      return;
    }

    const closeGroup = puzzle.groups.find(g =>
      !solved.includes(g) && g.words.filter(w => selected.includes(w)).length === 3
    );
    mistakes++;
    render();
    document.querySelectorAll(".conn-tile.selected").forEach(el => el.classList.add("shake"));
    if (mistakes >= MAX_MISTAKES) {
      over = true;
      toast("Out of guesses! The word was in: " + puzzle.groups.map(g => g.category).join(", "), 4000);
      solved = puzzle.groups.slice();
      tiles = [];
      if (isDaily) window.DailyPuzzle.markCompleted("connections");
      saveDaily();
      render();
    } else {
      toast(closeGroup ? "One away!" : "Not a group");
      saveDaily();
    }
  }

  document.getElementById("submitBtn").addEventListener("click", submit);
  document.getElementById("deselectBtn").addEventListener("click", () => { selected = []; render(); });
  document.getElementById("shuffleBtn").addEventListener("click", () => { tiles = shuffle(tiles); render(); });
  document.getElementById("newPuzzleBtn").addEventListener("click", () => newGame(true));

  newGame(false);
});
