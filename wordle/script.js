window.PuzzleData.ready("wordle").then(function () {
  const ANSWERS = window.WORDLE_ANSWERS.map(w => w.toUpperCase());
  const VALID = new Set([...ANSWERS, ...window.WORDLE_GUESSES.map(w => w.toUpperCase())]);
  const WORD_LEN = 5;
  const MAX_GUESSES = 6;

  let answer = "";
  let guesses = [];
  let current = "";
  let gameOver = false;
  let isDaily = false;
  const keyStates = {};

  const boardEl = document.getElementById("board");
  const keyboardEl = document.getElementById("keyboard");
  const toastEl = document.getElementById("toast");

  function toast(msg, ms = 1500) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function newGame(random) {
    isDaily = !random;
    answer = random
      ? ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
      : ANSWERS[window.DailyPuzzle.indexForDay(window.DailyPuzzle.dayNumber(), ANSWERS.length)];
    guesses = [];
    current = "";
    gameOver = false;
    for (const k in keyStates) delete keyStates[k];
    render();
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement("div");
      row.className = "wordle-row";
      const word = r < guesses.length ? guesses[r] : (r === guesses.length ? current : "");
      const marks = r < guesses.length ? markGuess(guesses[r]) : null;
      for (let c = 0; c < WORD_LEN; c++) {
        const tile = document.createElement("div");
        tile.className = "wordle-tile";
        const ch = word[c] || "";
        tile.textContent = ch;
        if (ch && !marks) tile.classList.add("filled");
        if (marks) tile.classList.add(marks[c]);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
    renderKeyboard();
  }

  function markGuess(guess) {
    const marks = new Array(WORD_LEN).fill("absent");
    const answerArr = answer.split("");
    const used = new Array(WORD_LEN).fill(false);
    for (let i = 0; i < WORD_LEN; i++) {
      if (guess[i] === answerArr[i]) {
        marks[i] = "correct";
        used[i] = true;
      }
    }
    for (let i = 0; i < WORD_LEN; i++) {
      if (marks[i] === "correct") continue;
      const idx = answerArr.findIndex((ch, j) => ch === guess[i] && !used[j]);
      if (idx !== -1) {
        marks[i] = "present";
        used[idx] = true;
      }
    }
    for (let i = 0; i < WORD_LEN; i++) {
      const rank = { absent: 0, present: 1, correct: 2 };
      if (!keyStates[guess[i]] || rank[marks[i]] > rank[keyStates[guess[i]]]) {
        keyStates[guess[i]] = marks[i];
      }
    }
    return marks;
  }

  const KB_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  function renderKeyboard() {
    keyboardEl.innerHTML = "";
    KB_ROWS.forEach((rowStr, i) => {
      const row = document.createElement("div");
      row.className = "kb-row";
      if (i === 2) row.appendChild(makeKey("ENTER", true));
      for (const ch of rowStr) row.appendChild(makeKey(ch));
      if (i === 2) row.appendChild(makeKey("BACK", true, "⌫"));
      keyboardEl.appendChild(row);
    });
  }

  function makeKey(key, wide, label) {
    const btn = document.createElement("button");
    btn.className = "kb-key" + (wide ? " wide" : "");
    btn.textContent = label || key;
    if (keyStates[key]) btn.classList.add(keyStates[key]);
    btn.addEventListener("click", () => handleKey(key));
    return btn;
  }

  function handleKey(key) {
    if (gameOver) return;
    if (key === "BACK") {
      current = current.slice(0, -1);
    } else if (key === "ENTER") {
      submitGuess();
    } else if (/^[A-Z]$/.test(key) && current.length < WORD_LEN) {
      current += key;
    }
    render();
  }

  function submitGuess() {
    if (current.length !== WORD_LEN) {
      toast("Not enough letters");
      return;
    }
    if (!VALID.has(current)) {
      toast("Not in word list");
      return;
    }
    guesses.push(current);
    if (current === answer) {
      gameOver = true;
      setTimeout(() => toast(["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"][guesses.length - 1] || "You got it!", 3000), 300);
    } else if (guesses.length === MAX_GUESSES) {
      gameOver = true;
      setTimeout(() => toast("The word was " + answer, 3500), 300);
    }
    if (gameOver && isDaily) window.DailyPuzzle.markCompleted("wordle");
    current = "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleKey("ENTER");
    else if (e.key === "Backspace") handleKey("BACK");
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
  });

  document.getElementById("newPuzzleBtn").addEventListener("click", () => newGame(true));

  newGame(false);
});
