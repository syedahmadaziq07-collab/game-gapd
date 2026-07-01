const app = document.querySelector("#app");

const state = {
  screen: "home",
  stage: 1,
  score: 0,
  hearts: 3,
  sound: true,
  player: { x: 18, y: 78 },
  playerDirection: "down",
  playerMoving: false,
  playerFrame: 0,
  lastWalkFrameAt: 0,
  activeObject: null,
  answered: new Set(),
  currentPlayer: 0,
  players: [
    { name: "Pemain 1", score: 0 },
    { name: "Pemain 2", score: 0 }
  ],
  sortingDone: new Set(),
  resultSaved: false
};

const availableAssets = new Set();

const ASSETS = {
  backgrounds: {
    home: "assets/backgrounds/home-bg.png",
    stage1: "assets/backgrounds/stage1-map.png",
    stage2: "assets/backgrounds/stage2-map.png",
    stage3: "assets/backgrounds/stage3-map.png",
    mission: "assets/backgrounds/mission-map.png"
  },
  characters: {
    budi: "assets/characters/budi.png",
    player: "assets/characters/player.png",
    playerIdle: "assets/characters/player-idle.png",
    playerWalk1: "assets/characters/player-walk-1.png",
    playerWalk2: "assets/characters/player-walk-2.png"
  },
  objects: {
    kucing: "assets/objects/kucing.png",
    ayam: "assets/objects/ayam.png",
    ikan: "assets/objects/ikan.png",
    pokokBunga: "assets/objects/pokok-bunga.png",
    rumput: "assets/objects/rumput.png",
    pokokPisang: "assets/objects/pokok-pisang.png",
    arnab: "assets/objects/arnab.png",
    burung: "assets/objects/burung.png",
    bungaMatahari: "assets/objects/bunga-matahari.png",
    pokokKecil: "assets/objects/pokok-kecil.png"
  },
  ui: {
    woodPanel: "assets/ui/wood-panel.png",
    questionPopup: "assets/ui/question-popup.png",
    buttonGreen: "assets/ui/button-green.png",
    buttonBlue: "assets/ui/button-blue.png",
    buttonOrange: "assets/ui/button-orange.png"
  },
  badges: {
    pemula: "assets/badges/pemula-alam.png",
    penjaga: "assets/badges/penjaga-alam.png",
    juara: "assets/badges/juara-alam.png"
  }
};

let movementStopTimer = null;

function markAssetLoaded(src) {
  availableAssets.add(src);
  document.documentElement.style.setProperty(`--asset-${assetKey(src)}`, `url('${src}')`);
}

function markAssetMissing(src) {
  console.warn("Asset gagal load:", src);
  document.documentElement.classList.add(`missing-${assetKey(src)}`);
}

function assetKey(src) {
  return src.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function probeAssets() {
  const paths = [
    ...Object.values(ASSETS.backgrounds),
    ...Object.values(ASSETS.characters),
    ...Object.values(ASSETS.objects),
    ...Object.values(ASSETS.ui),
    ...Object.values(ASSETS.badges)
  ];
  paths.forEach((src) => {
    const img = new Image();
    img.onload = () => markAssetLoaded(src);
    img.onerror = () => markAssetMissing(src);
    img.src = src;
  });
}

const stageData = {
  1: {
    title: "Stage 1 - Laluan Kenal Alam",
    mapClass: "",
    background: ASSETS.backgrounds.stage1,
    question: "Ini haiwan atau tumbuhan?",
    choices: ["Haiwan", "Tumbuhan"],
    objects: [
      { id: "kucing", icon: "&#128049;", image: ASSETS.objects.kucing, x: 30, y: 33, answer: "Haiwan", label: "Kucing" },
      { id: "ayam", icon: "&#128020;", image: ASSETS.objects.ayam, x: 70, y: 30, answer: "Haiwan", label: "Ayam" },
      { id: "bunga", icon: "&#127803;", image: ASSETS.objects.pokokBunga, x: 45, y: 68, answer: "Tumbuhan", label: "Pokok bunga" },
      { id: "rumput", icon: "&#127807;", image: ASSETS.objects.rumput, x: 76, y: 70, answer: "Tumbuhan", label: "Rumput" }
    ]
  },
  2: {
    title: "Stage 2 - Hutan Ciri-Ciri",
    mapClass: "stage2",
    background: ASSETS.backgrounds.stage2,
    question: "Apakah ciri yang sesuai?",
    choices: ["ada kaki", "ada sirip", "ada daun", "ada batang"],
    objects: [
      { id: "kucing2", icon: "&#128049;", image: ASSETS.objects.kucing, x: 25, y: 24, answer: "ada kaki", label: "Kucing" },
      { id: "ikan", icon: "&#128031;", image: ASSETS.objects.ikan, x: 75, y: 30, answer: "ada sirip", label: "Ikan" },
      { id: "bunga2", icon: "&#127799;", image: ASSETS.objects.pokokBunga, x: 37, y: 72, answer: "ada daun", label: "Pokok bunga" },
      { id: "pisang", icon: "&#127796;", image: ASSETS.objects.pokokPisang, x: 78, y: 74, answer: "ada batang", label: "Pokok pisang" }
    ]
  }
};

const sortItems = [
  { id: "arnab", icon: "&#128048;", image: ASSETS.objects.arnab, name: "Arnab", type: "Haiwan" },
  { id: "burung", icon: "&#128038;", image: ASSETS.objects.burung, name: "Burung", type: "Haiwan" },
  { id: "matahari", icon: "&#127803;", image: ASSETS.objects.bungaMatahari, name: "Bunga matahari", type: "Tumbuhan" },
  { id: "pokok", icon: "&#127793;", image: ASSETS.objects.pokokKecil, name: "Pokok kecil", type: "Tumbuhan" }
];
function setScreen(screen) {
  state.screen = screen;
  render();
}

function resetRun() {
  state.score = 0;
  state.hearts = 3;
  state.stage = 1;
  state.player = { x: 18, y: 78 };
  resetPlayerMotion();
  state.answered = new Set();
  state.sortingDone = new Set();
  state.resultSaved = false;
}

function startSingle(stage = 1) {
  resetRun();
  state.stage = stage;
  setScreen(stage === 3 ? "stage3" : "game");
}

function classFor(color) {
  return `game-btn ${color}`;
}

function imageWithFallback(src, alt, className, fallbackHtml = "") {
  return `
    <span class="asset-wrap ${className}-wrap">
      <img class="asset-img ${className}" src="${src}" alt="${alt}" onload="this.closest('.asset-wrap').classList.add('asset-loaded')" onerror="console.warn('Asset gagal load:', this.getAttribute('src'));this.hidden=true;this.nextElementSibling.hidden=false;this.closest('.asset-wrap').classList.add('asset-missing')" />
      <span class="asset-fallback ${className}-fallback" hidden>${fallbackHtml}</span>
    </span>
  `;
}

function resetPlayerMotion(direction = "down") {
  state.playerDirection = direction;
  state.playerMoving = false;
  state.playerFrame = 0;
  state.lastWalkFrameAt = 0;
  if (movementStopTimer) {
    clearTimeout(movementStopTimer);
    movementStopTimer = null;
  }
}

function markPlayerMoving(direction) {
  const now = Date.now();
  state.playerDirection = direction;
  state.playerMoving = true;

  if (!state.lastWalkFrameAt || now - state.lastWalkFrameAt >= 140) {
    state.playerFrame = state.playerFrame === 0 ? 1 : 0;
    state.lastWalkFrameAt = now;
  }

  if (movementStopTimer) clearTimeout(movementStopTimer);
  movementStopTimer = setTimeout(() => {
    if (state.screen === "game") {
      state.playerMoving = false;
      state.playerFrame = 0;
      const player = document.querySelector(".player");
      const playerImg = player?.querySelector(".player-img");
      if (player) player.className = playerClassName();
      if (playerImg) playerImg.src = playerImageSrc();
    }
  }, 180);
}

function playerImageSrc() {
  const idle = availableAssets.has(ASSETS.characters.playerIdle)
    ? ASSETS.characters.playerIdle
    : ASSETS.characters.player;
  const walkFrames = [ASSETS.characters.playerWalk1, ASSETS.characters.playerWalk2]
    .filter((src) => availableAssets.has(src));

  if (!state.playerMoving || walkFrames.length === 0) return idle;
  return walkFrames[state.playerFrame % walkFrames.length];
}

function playerClassName() {
  const motion = state.playerMoving ? "is-moving" : "is-idle";
  return `player ${motion} dir-${state.playerDirection}`;
}

function mascot() {
  return `
    <div class="mascot asset-mascot" aria-label="Budi si Burung">
      <img class="asset-img budi-img" src="${ASSETS.characters.budi}" alt="Budi si Burung" onload="this.parentElement.classList.add('asset-loaded')" onerror="console.warn('Asset gagal load:', this.getAttribute('src'));this.hidden=true;this.nextElementSibling.hidden=false;this.parentElement.classList.add('asset-missing')" />
      <div class="budi-fallback" hidden>
        <div class="bird-body"></div>
        <div class="bird-belly"></div>
        <div class="bird-wing"></div>
        <div class="bird-eye left"></div>
        <div class="bird-eye right"></div>
        <div class="bird-beak"></div>
        <div class="bird-feet"></div>
      </div>
    </div>
  `;
}

function home() {
  app.className = "app-shell home-shell";
  app.innerHTML = `
    <section class="screen home asset-home" style="--home-bg:url('${ASSETS.backgrounds.home}')">
      <div class="home-copy">
        <h1 class="hero-title">Misi Alam Ceria</h1>
        <p class="subtitle">Sains Sosial MBPK</p>
        <p class="topic-badge">Mengenal dan Mengelaskan Haiwan dan Tumbuhan Berdasarkan Ciri Mudah</p>
      </div>
      <div class="mascot-zone home-budi-zone">
        <div class="speech">Jom bertualang bersama Budi si Burung!</div>
        ${mascot()}
      </div>
      <div class="home-menu-panel">
        <div class="menu-buttons">
          <button class="${classFor("green")}" data-action="single">Main Sendiri</button>
          <button class="${classFor("blue")}" data-action="two">Main Dengan Kawan</button>
          <button class="${classFor("purple")}" data-action="chat">Tanya Budi</button>
          <button class="${classFor("orange")}" data-action="help">Cara Main</button>
          <button class="${classFor("green")}" data-action="info">Info Projek</button>
          <button class="${classFor("pink")}" data-action="mission">Peta Misi</button>
          <button class="${classFor("yellow")}" data-action="leader">Papan Skor</button>
        </div>
      </div>
      <button class="sound-btn" data-action="sound">${state.sound ? "🔊" : "🔇"}</button>
    </section>
  `;
}

function renderGame() {
  const data = stageData[state.stage];
  const nearby = getNearbyObject(data);
  state.activeObject = nearby;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="game-screen screen map-area adventure-screen game-map asset-map ${data.mapClass}" style="--stage-bg:url('${data.background}')">
      ${mapDecorations()}
      <div class="corner-decor" aria-hidden="true">
        <span class="decor-bush"></span>
        <span class="decor-rock"></span>
        <span class="decor-flower"></span>
      </div>
      <div class="topbar">
        <div class="panel hud stage-board"><span class="stage-icon">&#9733;</span>${data.title}</div>
        <div class="hud-right">
          <span class="hud-chip score-chip"><span>&#9733;</span> Skor: ${state.score}</span>
          <span class="hud-chip heart-chip"><span>&#9829;</span> Peluang: ${state.hearts}</span>
          ${state.playersMode ? `
            <span class="hud-chip">Giliran: ${state.players[state.currentPlayer].name}</span>
            <span class="hud-chip">${state.players[0].name}: ${state.players[0].score}</span>
            <span class="hud-chip">${state.players[1].name}: ${state.players[1].score}</span>
          ` : ""}
          <button class="small-btn icon-btn" data-action="fullscreen" aria-label="Skrin penuh">⛶</button>
          <button class="small-btn" data-action="mission">Peta</button>
          <button class="small-btn" data-action="home">Menu</button>
        </div>
      </div>
      <div class="game-budi">
        <div class="mini-budi">${mascot()}</div>
        <div class="budi-tip">Jom dekati objek dan jawab soalan!</div>
        <button class="budi-game-btn" data-action="chat">Tanya Budi</button>
      </div>
      ${data.objects.map((obj) => objectHtml(obj, nearby)).join("")}
      <div class="${playerClassName()}" style="left:${state.player.x}%;top:${state.player.y}%">
        <div class="player-asset">
          <img class="asset-img player-img" src="${playerImageSrc()}" alt="Watak pemain" data-fallback-src="${ASSETS.characters.player}" onload="this.parentElement.classList.add('asset-loaded')" onerror="console.warn('Asset gagal load:', this.getAttribute('src'));if(this.dataset.fallbackSrc && this.getAttribute('src') !== this.dataset.fallbackSrc){this.src=this.dataset.fallbackSrc;this.dataset.fallbackSrc='';}else{this.hidden=true;this.nextElementSibling.hidden=false;this.parentElement.classList.add('asset-missing')}" />
          <div class="kid-character" hidden>
            <span class="kid-hair"></span><span class="kid-head"></span><span class="kid-body"></span><span class="kid-arm left"></span><span class="kid-arm right"></span><span class="kid-leg left"></span><span class="kid-leg right"></span>
          </div>
        </div>
        <div class="player-name">${state.playersMode ? state.players[state.currentPlayer].name : "Pemain"}</div>
      </div>
      <div class="dpad" aria-label="Controller sentuh">
        <button class="up" data-move="up">&#9650;</button>
        <button class="left" data-move="left">&#9664;</button>
        <button class="center" data-action="ask">&#9679;</button>
        <button class="right" data-move="right">&#9654;</button>
        <button class="down" data-move="down">&#9660;</button>
      </div>
      <div class="mini-map" style="--mini-x:${state.player.x}%;--mini-y:${state.player.y}%">
        <span class="mini-title">Peta</span>
      </div>
    </section>
    ${nearby ? questionModal(nearby, data) : ""}
  `;
}

function mapDecorations() {
  return `
    <div class="css-map-fallback" aria-hidden="true">
      <div class="sky-band"><span class="sun"></span><span class="cloud c1"></span><span class="cloud c2"></span></div>
      <div class="path main-path"></div>
      <div class="path side-path"></div>
      <div class="river"><span class="bridge"></span></div>
      <div class="hut"><span></span></div>
      <div class="sign-board">Misi Alam</div>
      <div class="fence fence-left"></div>
      <div class="fence fence-right"></div>
      ${["t1", "t2", "t3", "t4", "t5"].map((name) => `<div class="tree ${name}"><span></span></div>`).join("")}
      ${["b1", "b2", "b3", "b4", "b5", "b6"].map((name) => `<div class="bush ${name}"></div>`).join("")}
      ${["f1", "f2", "f3", "f4", "f5", "f6", "f7"].map((name) => `<div class="flower ${name}"></div>`).join("")}
      ${["r1", "r2", "r3", "r4"].map((name) => `<div class="rock ${name}"></div>`).join("")}
    </div>
  `;
}

function objectHtml(obj, nearby) {
  const ready = nearby && nearby.id === obj.id ? "ready" : "";
  const done = state.answered.has(obj.id);
  return `
    <div class="map-object ${ready} ${done ? "done" : ""}" style="left:${obj.x}%;top:${obj.y}%" title="${obj.label}">
      <span class="object-icon">
        ${done ? "&#10003;" : imageWithFallback(obj.image, obj.label, "object-img", obj.icon)}
      </span>
      <span class="object-label">${obj.label}</span>
    </div>
  `;
}

function questionModal(obj, data) {
  if (state.answered.has(obj.id)) return "";
  return `
    <div class="modal-backdrop">
      <div class="panel question-card">
        <button class="close-x" data-action="close-question">X</button>
        <div class="question-title">SOALAN</div>
        <div class="question-icon">${imageWithFallback(obj.image, obj.label, "question-img", obj.icon)}</div>
        <h2>${obj.label}</h2>
        <h3>${data.question}</h3>
        <div class="answer-grid">
          ${data.choices.map((choice, index) => `<button class="${classFor(index % 2 ? "blue" : "green")}" data-answer="${choice}">${choice}</button>`).join("")}
        </div>
        <p class="feedback" id="feedback"></p>
      </div>
    </div>
  `;
}
function getNearbyObject(data) {
  return data.objects.find((obj) => {
    const dx = obj.x - state.player.x;
    const dy = obj.y - state.player.y;
    return Math.hypot(dx, dy) < 11 && !state.answered.has(obj.id);
  });
}

function movePlayer(dir) {
  markPlayerMoving(dir);
  const step = 3;
  if (dir === "up") state.player.y -= step;
  if (dir === "down") state.player.y += step;
  if (dir === "left") state.player.x -= step;
  if (dir === "right") state.player.x += step;
  state.player.x = Math.max(5, Math.min(95, state.player.x));
  state.player.y = Math.max(8, Math.min(92, state.player.y));
  renderGame();
}

function answer(choice) {
  const obj = state.activeObject;
  if (!obj) return;
  const feedback = document.querySelector("#feedback");
  if (choice === obj.answer) {
    state.score += 10;
    if (state.playersMode) state.players[state.currentPlayer].score += 10;
    state.answered.add(obj.id);
    feedback.textContent = "Bagus! Jawapan kamu betul.";
    switchTurn();
    setTimeout(nextAfterAnswer, 650);
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    feedback.textContent = "Tidak mengapa. Cuba lagi.";
    switchTurn();
    if (state.hearts === 0) setTimeout(() => setScreen("result"), 650);
  }
}

function switchTurn() {
  if (!state.playersMode) return;
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
}

function nextAfterAnswer() {
  const data = stageData[state.stage];
  if (state.answered.size >= data.objects.length) {
    if (state.stage === 1) {
      state.stage = 2;
      state.player = { x: 18, y: 78 };
      resetPlayerMotion();
      state.answered = new Set();
      renderGame();
      return;
    }
    if (state.stage === 2) {
      setScreen("stage3");
      return;
    }
  }
  renderGame();
}

function mission() {
  app.className = "app-shell forest-bg";
  const stages = [
    ["1", "Laluan Kenal Alam", "🐱"],
    ["2", "Hutan Ciri-Ciri", "🌳"],
    ["3", "Pondok Susun Alam", "🏕️"],
    ["4", "Taman Ceria (Final)", "🏅"]
  ];
  app.innerHTML = `
    <section class="screen mission-wrap asset-mission" style="--mission-bg:url('${ASSETS.backgrounds.mission}')">
      <h1 class="screen-title">Peta Misi</h1>
      <div class="panel mission-map">
        ${stages.map(([num, label, icon]) => `
          <div class="stage-dot">
            <button data-stage="${num}">${icon}</button>
            <span>${num}. ${label}</span>
          </div>
        `).join("")}
      </div>
      <div class="back-row">
        <button class="${classFor("blue")}" data-action="home">Menu Utama</button>
        <button class="${classFor("green")}" data-action="single">Mula Stage 1</button>
      </div>
    </section>
  `;
}

function stage3() {
  app.className = "app-shell forest-bg";
  const animalCount = sortItems.filter((item) => item.type === "Haiwan" && state.sortingDone.has(item.id)).length;
  const plantCount = sortItems.filter((item) => item.type === "Tumbuhan" && state.sortingDone.has(item.id)).length;
  app.innerHTML = `
    <section class="screen stage3-screen" style="--stage3-bg:url('${ASSETS.backgrounds.stage3}')">
      <div class="topbar">
        <div class="panel hud">Stage 3 - Pondok Susun Alam</div>
        <div class="hud-right">
          <span class="hud-chip">Skor: ${state.score}</span>
          ${state.playersMode ? `
            <span class="hud-chip">Giliran: ${state.players[state.currentPlayer].name}</span>
            <span class="hud-chip">${state.players[0].name}: ${state.players[0].score}</span>
            <span class="hud-chip">${state.players[1].name}: ${state.players[1].score}</span>
          ` : ""}
          <button class="small-btn" data-action="home">Menu</button>
        </div>
      </div>
      <div class="stage3-layout">
        <div class="zone" data-zone="Haiwan"><h2>🐾 Zon Haiwan</h2><p>${animalCount} objek betul</p></div>
        <div class="zone" data-zone="Tumbuhan"><h2>🌿 Zon Tumbuhan</h2><p>${plantCount} objek betul</p></div>
        <div class="sorting-items">
          ${sortItems.map((item) => `
            <button class="sort-item ${state.sortingDone.has(item.id) ? "done" : ""}" data-sort="${item.id}">
              <span>${imageWithFallback(item.image, item.name, "sort-img", item.icon)}</span><br />${item.name}
            </button>
          `).join("")}
        </div>
      </div>
      <div class="back-row">
        <button class="${classFor("green")}" data-action="finish">Selesai Misi</button>
      </div>
    </section>
  `;
}

function chooseSort(id) {
  const item = sortItems.find((entry) => entry.id === id);
  if (!item || state.sortingDone.has(id)) return;
  const choice = window.prompt(`Hantar ${item.name} ke zon mana? Taip: Haiwan atau Tumbuhan`);
  if (!choice) return;
  if (choice.trim().toLowerCase() === item.type.toLowerCase()) {
    state.score += 10;
    if (state.playersMode) state.players[state.currentPlayer].score += 10;
    switchTurn();
    state.sortingDone.add(id);
    if (state.sortingDone.size === sortItems.length) {
      setTimeout(() => setScreen("result"), 300);
    } else {
      stage3();
    }
  } else {
    window.alert("Tidak mengapa. Cuba lagi.");
  }
}

function chat() {
  app.className = "app-shell forest-bg";
  app.innerHTML = `
    <section class="screen chat-wrap">
      <h1 class="screen-title">Tanya Budi</h1>
      <div class="panel chat-panel">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="width:120px">${mascot()}</div>
          <h2>Budi si Burung sedia membantu.</h2>
        </div>
        <div class="chat-log" id="chatLog">
          <div class="msg budi">Hai! Tanya Budi tentang haiwan dan tumbuhan.</div>
        </div>
        <form class="chat-form" id="chatForm">
          <input id="chatInput" placeholder="Tulis soalan kamu..." autocomplete="off" />
          <button class="${classFor("orange")}" type="submit">Hantar</button>
        </form>
        <div class="quick-questions">
          <button class="small-btn" data-quick="Apa itu haiwan?">Apa itu haiwan?</button>
          <button class="small-btn" data-quick="Apa itu tumbuhan?">Apa itu tumbuhan?</button>
          <button class="small-btn" data-quick="Macam mana nak beza haiwan dan tumbuhan?">Beza haiwan dan tumbuhan</button>
        </div>
      </div>
      <div class="back-row"><button class="${classFor("blue")}" data-action="home">Menu Utama</button></div>
    </section>
  `;
}

function budiReply(text) {
  const q = text.toLowerCase();
  if (q.includes("haiwan")) return "Haiwan biasanya boleh bergerak dan ada kaki, sayap atau sirip.";
  if (q.includes("tumbuhan")) return "Tumbuhan biasanya ada daun, batang dan akar.";
  if (q.includes("beza")) return "Lihat cirinya. Haiwan boleh bergerak. Tumbuhan biasanya ada daun, batang dan akar.";
  return "Budi cadangkan lihat ciri mudah: kaki, sirip, daun, batang dan akar.";
}

function addChat(text, sender) {
  const log = document.querySelector("#chatLog");
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function leaderboard() {
  app.className = "app-shell forest-bg";
  const saved = JSON.parse(localStorage.getItem("misiAlamScores") || "[]");
  const rows = [
    { name: "Aiman", score: 90 },
    { name: "Siti", score: 80 },
    { name: "Danial", score: 70 },
    { name: "Sara", score: 60 },
    ...saved
  ].sort((a, b) => b.score - a.score).slice(0, 8);
  app.innerHTML = `
    <section class="screen leader-wrap">
      <h1 class="screen-title">Papan Pendahuluan</h1>
      <div class="panel">
        <ol class="leader-list">
          ${rows.map((row) => `<li><span>${row.name}</span><span>${row.score} mata</span></li>`).join("")}
        </ol>
      </div>
      <div class="back-row"><button class="${classFor("blue")}" data-action="home">Menu Utama</button></div>
    </section>
  `;
}

function result() {
  app.className = "app-shell forest-bg";
  saveScore();
  const badge = getBadge(state.score);
  const badgeImage = getBadgeImage(state.score);
  app.innerHTML = `
    <section class="screen result-wrap">
      <h1 class="screen-title">TAHNIAH!</h1>
      <div class="panel result-card">
        <h2>Jumlah markah: ${state.score} mata</h2>
        <div class="badge">${imageWithFallback(badgeImage, badge, "badge-img", badge)}</div>
        ${state.playersMode ? `<h3>${state.players[0].name}: ${state.players[0].score} mata<br />${state.players[1].name}: ${state.players[1].score} mata</h3>` : ""}
        <div class="back-row">
          <button class="${classFor("green")}" data-action="single">Main Semula</button>
          <button class="${classFor("blue")}" data-action="home">Menu Utama</button>
          <button class="${classFor("purple")}" data-action="leader">Papan Skor</button>
        </div>
      </div>
    </section>
  `;
}

function getBadge(score) {
  if (score >= 90) return "Lencana Juara Alam";
  if (score >= 60) return "Lencana Penjaga Alam";
  return "Lencana Pemula Alam";
}

function getBadgeImage(score) {
  if (score >= 90) return ASSETS.badges.juara;
  if (score >= 60) return ASSETS.badges.penjaga;
  return ASSETS.badges.pemula;
}

function saveScore() {
  if (state.resultSaved) return;
  const name = state.playersMode ? `${state.players[0].name} & ${state.players[1].name}` : "Pemain";
  const existing = JSON.parse(localStorage.getItem("misiAlamScores") || "[]");
  existing.push({ name, score: state.score });
  localStorage.setItem("misiAlamScores", JSON.stringify(existing.slice(-20)));
  state.resultSaved = true;
}

function twoPlayer() {
  app.className = "app-shell forest-bg";
  app.innerHTML = `
    <section class="screen two-wrap">
      <h1 class="screen-title">Main Dengan Kawan</h1>
      <div class="panel two-card">
        <div class="name-grid">
          <input class="name-input" id="p1" placeholder="Nama Pemain 1" />
          <div class="vs">VS</div>
          <input class="name-input" id="p2" placeholder="Nama Pemain 2" />
        </div>
        <div class="back-row">
          <button class="${classFor("green")}" data-action="start-two">Mula Giliran</button>
          <button class="${classFor("blue")}" data-action="home">Menu Utama</button>
        </div>
      </div>
    </section>
  `;
}

function help() {
  app.className = "app-shell forest-bg";
  const steps = [
    ["1", "Gerakkan watak menggunakan arrow key atau D-pad."],
    ["2", "Dekati objek dalam peta."],
    ["3", "Jawab soalan yang muncul."],
    ["4", "Kumpul mata."],
    ["5", "Selesaikan Stage 1 hingga Stage 3."],
    ["6", "Dapatkan lencana."]
  ];
  app.innerHTML = `
    <section class="screen info-wrap">
      <h1 class="screen-title">Cara Main</h1>
      <div class="panel info-card">
        <div class="learning-tag">Belajar sambil bermain: haiwan, tumbuhan dan ciri mudah.</div>
        <div class="how-grid">
          ${steps.map(([num, text]) => `
            <div class="how-step">
              <span>${num}</span>
              <p>${text}</p>
            </div>
          `).join("")}
        </div>
        <div class="back-row">
          <button class="${classFor("green")}" data-action="single">Mula Main</button>
          <button class="${classFor("purple")}" data-action="info">Info Projek</button>
          <button class="${classFor("blue")}" data-action="home">Menu Utama</button>
        </div>
      </div>
    </section>
  `;
}

function infoProject() {
  app.className = "app-shell forest-bg";
  const objectives = [
    "Murid mengenal pasti haiwan dan tumbuhan melalui gambar.",
    "Murid mengelaskan objek kepada kategori haiwan atau tumbuhan.",
    "Murid mengecam ciri mudah seperti kaki, sirip, daun dan batang.",
    "Murid belajar melalui gamifikasi yang mempunyai markah, lencana dan maklum balas."
  ];
  const checklist = [
    "Stage 1, Stage 2 dan Stage 3",
    "Sistem markah dan lencana",
    "Papan pendahuluan localStorage",
    "Maklum balas segera betul atau salah",
    "Chatbot Tanya Budi",
    "Mod Main Sendiri dan Main Dengan Kawan",
    "Pengecaman corak ciri mudah",
    "Reka bentuk mesra MBPK"
  ];
  app.innerHTML = `
    <section class="screen info-wrap">
      <h1 class="screen-title">Info Projek</h1>
      <div class="panel info-card">
        <div class="project-summary">
          <div><strong>Nama game</strong><span>Misi Alam Ceria</span></div>
          <div><strong>Subjek</strong><span>Sains Sosial MBPK</span></div>
          <div><strong>Sasaran</strong><span>Murid Berkeperluan Pendidikan Khas</span></div>
          <div><strong>Topik</strong><span>Mengenal dan Mengelaskan Haiwan dan Tumbuhan Berdasarkan Ciri Mudah</span></div>
        </div>
        <h2>Objektif</h2>
        <ol class="objective-list">
          ${objectives.map((item) => `<li>${item}</li>`).join("")}
        </ol>
        <h2>Elemen Tugasan 2 GAPD</h2>
        <div class="spec-grid">
          ${checklist.map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div class="back-row">
          <button class="${classFor("green")}" data-action="single">Main Sendiri</button>
          <button class="${classFor("orange")}" data-action="help">Cara Main</button>
          <button class="${classFor("blue")}" data-action="home">Menu Utama</button>
        </div>
      </div>
    </section>
  `;
}

function startTwo() {
  const p1 = document.querySelector("#p1").value.trim() || "Pemain 1";
  const p2 = document.querySelector("#p2").value.trim() || "Pemain 2";
  resetRun();
  state.playersMode = true;
  state.players = [{ name: p1, score: 0 }, { name: p2, score: 0 }];
  state.currentPlayer = 0;
  setScreen("game");
}

function render() {
  if (state.screen === "home") home();
  if (state.screen === "game") renderGame();
  if (state.screen === "mission") mission();
  if (state.screen === "stage3") stage3();
  if (state.screen === "chat") chat();
  if (state.screen === "leader") leaderboard();
  if (state.screen === "result") result();
  if (state.screen === "two") twoPlayer();
  if (state.screen === "help") help();
  if (state.screen === "info") infoProject();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-move], [data-answer], [data-stage], [data-sort], [data-quick]");
  if (!target || !app.contains(target)) return;
  const action = target.dataset.action;
  const move = target.dataset.move;
  const answerChoice = target.dataset.answer;
  const stage = target.dataset.stage;
  const sort = target.dataset.sort;
  const quick = target.dataset.quick;

  if (move) movePlayer(move);
  if (answerChoice) answer(answerChoice);
  if (sort) chooseSort(sort);
  if (quick) {
    addChat(quick, "user");
    addChat(budiReply(quick), "budi");
  }
  if (stage) {
    const stageNum = Number(stage);
    if (stageNum <= 2) startSingle(stageNum);
    if (stageNum === 3) {
      resetRun();
      setScreen("stage3");
    }
    if (stageNum === 4) setScreen("result");
  }
  if (!action) return;
  if (action === "single") {
    state.playersMode = false;
    startSingle();
  }
  if (action === "two") setScreen("two");
  if (action === "start-two") startTwo();
  if (action === "chat") setScreen("chat");
  if (action === "leader") setScreen("leader");
  if (action === "mission") setScreen("mission");
  if (action === "info") setScreen("info");
  if (action === "home") {
    state.playersMode = false;
    setScreen("home");
  }
  if (action === "help") setScreen("help");
  if (action === "sound") {
    state.sound = !state.sound;
    render();
  }
  if (action === "fullscreen") toggleFullscreen();
  if (action === "close-question") {
    state.player.x = Math.max(8, state.player.x - 8);
    renderGame();
  }
  if (action === "ask" && state.activeObject) renderGame();
  if (action === "finish") setScreen("result");
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "chatForm") return;
  event.preventDefault();
  const input = document.querySelector("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  addChat(text, "user");
  addChat(budiReply(text), "budi");
  input.value = "";
});

function toggleFullscreen() {
  const target = document.querySelector(".adventure-screen") || document.documentElement;
  if (!document.fullscreenElement && target.requestFullscreen) {
    target.requestFullscreen().catch(() => {});
    return;
  }
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
}

window.addEventListener("keydown", (event) => {
  if (state.screen !== "game") return;
  const keys = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
  };
  if (keys[event.key]) {
    event.preventDefault();
    movePlayer(keys[event.key]);
  }
});

probeAssets();
render();
