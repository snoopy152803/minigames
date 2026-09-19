window.PuzzleData.ready("spellingbee").then(function () {
  const hiveEl = document.getElementById("hive");
  const currentEl = document.getElementById("currentWord");
  const toastEl = document.getElementById("toast");
  const scoreEl = document.getElementById("scoreLabel");
  const rankEl = document.getElementById("rankLabel");
  const progressEl = document.getElementById("progressFill");
  const foundListEl = document.getElementById("foundList");
  const foundCountEl = document.getElementById("foundCount");

  const RANKS = [
    { name: "Beginner", pct: 0 },
    { name: "Good Start", pct: 0.02 },
    { name: "Moving Up", pct: 0.05 },
    { name: "Good", pct: 0.08 },
    { name: "Solid", pct: 0.15 },
    { name: "Nice", pct: 0.25 },
    { name: "Great", pct: 0.40 },
    { name: "Amazing", pct: 0.50 },
    { name: "Genius", pct: 0.70 },
    { name: "Queen Bee", pct: 1.0 }
  ];

  const DICTIONARY = new Set(window.SPELLING_BEE_DICTIONARY);

  let center = "", outer = [], allLetters = [];
  let validWords = [], maxScore = 0;
  let found = [];
  let current = "";

  function toast(msg, ms = 1500) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function wordScore(word) {
    if (word.length === 4) return 1;
    let pts = word.length;
    if (isPangram(word)) pts += 7;
    return pts;
  }
  function isPangram(word) {
    return allLetters.every(l => word.includes(l));
  }

  function computeValidWords() {
    const letterSet = new Set(allLetters);
    const list = [];
    for (const w of DICTIONARY) {
      if (w.length < 4) continue;
      if (!w.includes(center)) continue;
      let ok = true;
      for (const ch of w) { if (!letterSet.has(ch)) { ok = false; break; } }
      if (ok) list.push(w);
    }
    return list;
  }

  function newGame(random) {
    const list = window.SPELLING_BEE_DATA;
    const puzzle = random
      ? list[Math.floor(Math.random() * list.length)]
      : list[dailyIndex(list.length)];
    center = puzzle.center;
    outer = puzzle.outerLetters.slice();
    allLetters = [center, ...outer];
    validWords = computeValidWords();
    maxScore = validWords.reduce((s, w) => s + wordScore(w), 0);
    found = [];
    current = "";
    render();
  }

  function dailyIndex(len) {
    const now = new Date();
    const days = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2024, 0, 1)) / 86400000);
    return ((days % len) + len) % len;
  }

  function shuffleOuter() {
    for (let i = outer.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outer[i], outer[j]] = [outer[j], outer[i]];
    }
    renderHive();
  }

  function render() {
    renderHive();
    renderCurrent();
    renderScore();
    renderFound();
  }

  function renderHive() {
    hiveEl.innerHTML = "";
    const cx = 140, cy = 140, r = 95;
    const angles = [-90, -30, 30, 90, 150, 210];
    const centerCell = makeCell(center, true);
    centerCell.style.left = (cx - 45) + "px";
    centerCell.style.top = (cy - 50) + "px";
    hiveEl.appendChild(centerCell);
    outer.forEach((letter, i) => {
      const angle = angles[i] * Math.PI / 180;
      const x = cx + r * Math.cos(angle) - 45;
      const y = cy + r * Math.sin(angle) - 50;
      const cell = makeCell(letter, false);
      cell.style.left = x + "px";
      cell.style.top = y + "px";
      hiveEl.appendChild(cell);
    });
  }

  function makeCell(letter, isCenter) {
    const el = document.createElement("div");
    el.className = "bee-cell" + (isCenter ? " center" : "");
    el.textContent = letter;
    el.addEventListener("click", () => { current += letter; renderCurrent(); });
    return el;
  }

  function renderCurrent() {
    currentEl.textContent = current || " ";
  }

  function renderScore() {
    scoreEl.textContent = found.reduce((s, w) => s + wordScore(w), 0) + " pts";
    const total = found.reduce((s, w) => s + wordScore(w), 0);
    const pct = maxScore ? total / maxScore : 0;
    let rank = RANKS[0].name;
    for (const r of RANKS) if (pct >= r.pct) rank = r.name;
    rankEl.textContent = rank;
    progressEl.style.width = Math.min(100, pct * 200) + "%";
  }

  function renderFound() {
    foundCountEl.textContent = found.length;
    foundListEl.innerHTML = found.slice().sort().map(w =>
      '<span class="found-word' + (isPangram(w) ? ' pangram' : '') + '">' + w + '</span>'
    ).join("");
  }

  function submit() {
    const word = current;
    if (word.length < 4) { toast("Too short"); shakeMsg(); current = ""; renderCurrent(); return; }
    if (!word.includes(center)) { toast("Missing center letter"); shakeMsg(); current = ""; renderCurrent(); return; }
    const letterSet = new Set(allLetters);
    for (const ch of word) {
      if (!letterSet.has(ch)) { toast("Bad letters"); shakeMsg(); current = ""; renderCurrent(); return; }
    }
    if (found.includes(word)) { toast("Already found"); shakeMsg(); current = ""; renderCurrent(); return; }
    if (!DICTIONARY.has(word)) { toast("Not in word list"); shakeMsg(); current = ""; renderCurrent(); return; }
    found.push(word);
    current = "";
    toast(isPangram(word) ? "Pangram! +" + wordScore(word) : "+" + wordScore(word));
    render();
  }

  function shakeMsg() {
    currentEl.classList.add("shake");
    setTimeout(() => currentEl.classList.remove("shake"), 400);
  }

  document.getElementById("deleteBtn").addEventListener("click", () => { current = current.slice(0, -1); renderCurrent(); });
  document.getElementById("shuffleBtn").addEventListener("click", shuffleOuter);
  document.getElementById("enterBtn").addEventListener("click", submit);
  document.getElementById("newPuzzleBtn").addEventListener("click", () => newGame(true));
  document.getElementById("toggleFound").addEventListener("click", () => {
    foundListEl.style.display = foundListEl.style.display === "none" ? "flex" : "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { submit(); return; }
    if (e.key === "Backspace") { current = current.slice(0, -1); renderCurrent(); return; }
    const ch = e.key.toUpperCase();
    if (allLetters.includes(ch)) { current += ch; renderCurrent(); }
  });

  newGame(false);
});
