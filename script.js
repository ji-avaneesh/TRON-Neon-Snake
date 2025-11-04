/* ============================================================
   ✅ TRON CLEAN SNAKE GAME (No Glow / No Trail)
   Based on your original merged version
============================================================ */

// -------------------------
// ✅ DOM ELEMENTS
// -------------------------
const screens = {
    loading: document.getElementById("loading-screen"),
    home: document.getElementById("home-screen"),
    game: document.getElementById("game-screen"),
    settings: document.getElementById("settings-screen"),
    leaderboard: document.getElementById("leaderboard-screen"),
};
const playBtn = document.getElementById("play-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");
const settingsBtn = document.getElementById("settings-btn");
const homeBackBtn = document.getElementById("home-back-btn");
const settingsBackBtn = document.getElementById("settings-back-btn");
const leaderboardBackBtn = document.getElementById("leaderboard-back-btn");

const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highscoreDisplay = document.getElementById("highscore");
const restartBtn = document.getElementById("restart-btn");
const pauseBtn = document.getElementById("pause-btn");

// -------------------------
// ✅ SETTINGS ELEMENTS
// -------------------------
const skinSelect = document.getElementById("skin-select");
const gridSelect = document.getElementById("grid-select");
const wallToggle = document.getElementById("wall-toggle");
const soundToggle = document.getElementById("sound-toggle");
const volumeSlider = document.getElementById("volume-slider");
const aiSelectBtn = document.getElementById("ai-select-btn");
const aiModal = document.getElementById("ai-modal");
const aiButtons = document.querySelectorAll(".ai-btn");
const aiCloseBtn = document.getElementById("ai-close-btn");

// -------------------------
// ✅ SOUND FILES
// -------------------------
const audio = {
    eat: document.getElementById("eat-sound"),
    death: document.getElementById("death-sound"),
    click: document.getElementById("click-sound"),
    boot: document.getElementById("boot-sound"),
    ui: document.getElementById("ui-sound"),
};
let soundEnabled = true;
let volumeLevel = 0.8;

// -------------------------
// ✅ GAME VARIABLES
// -------------------------
let gridSize = 25;
let tileCount = 20;
let tileSize = 20;
let speed = 7;
let speedIncrease = 0.15;
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let highscore = Number(localStorage.getItem("neonSnakeHighscore")) || 0;
let gameLoop = null;
let isPaused = false;
let aiMode = "off";
let particles = [];
let currentSkin = "neon";

// -------------------------
// ✅ LEADERBOARD
// -------------------------
let leaderboard = JSON.parse(localStorage.getItem("snakeLeaderboard") || "[]");
const clearLeaderboardBtn = document.getElementById("clear-leaderboard");

// -------------------------
// ✅ LOADING SCREEN
// -------------------------
function startLoadingScreen() {
    const percentText = document.getElementById("loading-percent");
    const fill = document.querySelector(".loading-fill");

    if (!percentText || !fill) {
        console.error("Loading screen elements not found");
        showScreen("home");
        return;
    }

    playSound("boot");

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 3;
        if (progress > 100) progress = 100;

        fill.style.width = progress + "%";
        percentText.innerText = progress + "%";

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                showScreen("home");
            }, 500);
        }
    }, 120);
}

// -------------------------
// ✅ PAGE NAVIGATION
// -------------------------
let currentScreen = "loading";
function showScreen(screenName) {
    playSound("ui");
    for (let s in screens) {
        if (screens[s]) screens[s].classList.remove("active-screen");
    }
    if (screens[screenName]) {
        screens[screenName].classList.add("active-screen");
        currentScreen = screenName;
    }
}

// -------------------------
// ✅ NAVIGATION EVENTS
// -------------------------
playBtn.addEventListener("click", () => {
    showScreen("game");
    startGame();
});
settingsBtn.addEventListener("click", () => showScreen("settings"));
leaderboardBtn.addEventListener("click", () => {
    showLeaderboard();
    showScreen("leaderboard");
});
settingsBackBtn.addEventListener("click", () => showScreen("home"));
leaderboardBackBtn.addEventListener("click", () => showScreen("home"));
homeBackBtn.addEventListener("click", () => {
    showScreen("home");
    if (!isPaused) die();
});
restartBtn.addEventListener("click", startGame);

// -------------------------
// ✅ AUDIO
// -------------------------
function playSound(name) {
    if (!soundEnabled) return;
    const s = audio[name];
    if (!s) return;
    s.volume = volumeLevel;
    s.currentTime = 0;
    s.play().catch(() => {});
}
soundToggle.addEventListener("change", (e) => (soundEnabled = e.target.checked));
volumeSlider.addEventListener("input", (e) => (volumeLevel = parseFloat(e.target.value)));
window.addEventListener(
    "touchstart",
    () => {
        for (let key in audio) {
            audio[key].play().catch(() => {});
            audio[key].pause();
            audio[key].currentTime = 0;
        }
    },
    { once: true }
);

// -------------------------
// ✅ GAME INIT
// -------------------------
function randomPosition() {
    return {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
    };
}

function initSnake() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = randomPosition();
    score = 0;
    scoreDisplay.innerText = score;
    speed = 7;
}

function startGame() {
    restartBtn.style.display = "none";
    isPaused = false;
    tileCount = parseInt(gridSelect.value) || 20;

    let canvasSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7);
    if (canvasSize < 100) canvasSize = 100;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    tileSize = canvas.width / tileCount;

    initSnake();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, 1000 / speed);
}

// -------------------------
// ✅ CONTROLS
// -------------------------
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
    else if (e.key === "ArrowDown" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
    else if (e.key === "ArrowRight" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
    else if (e.key.toLowerCase() === "p" || e.key === "Escape") togglePause();
});

// -------------------------
// ✅ UPDATE SNAKE
// -------------------------
function updateSnake() {
    if (isPaused) return;
    if (aiMode !== "off") aiThink();

    direction = nextDirection;
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (wallToggle.checked) {
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return die();
    } else {
        if (head.x < 0) head.x = tileCount - 1;
        if (head.x >= tileCount) head.x = 0;
        if (head.y < 0) head.y = tileCount - 1;
        if (head.y >= tileCount) head.y = 0;
    }

    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return die();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        eatFood();
    } else {
        snake.pop();
    }
}

function eatFood() {
    score++;
    scoreDisplay.innerText = score;
    playSound("eat");
    speed += speedIncrease;
    food = randomPosition();
    clearInterval(gameLoop);
    gameLoop = setInterval(gameTick, 1000 / speed);
}

function die() {
    if (isPaused) return;
    playSound("death");
    clearInterval(gameLoop);
    isPaused = true;

    document.getElementById("final-score").innerText = score;
    setTimeout(() => {
        document.getElementById("game-over-screen").style.display = "flex";
    }, 300);

    if (score > highscore) {
        highscore = score;
        localStorage.setItem("neonSnakeHighscore", highscore);
        highscoreDisplay.innerText = highscore;
    }
    saveScore(score);
}

// -------------------------
// ✅ DRAW GAME (CLEAN)
// -------------------------
const skins = {
    classic: { head: "#a9f571", body: "#84cc4e", food: "#f0945c" },
    neon: { head: "#66fcc1", body: "#4cd1a0", food: "#ff8c94" },
    fire: { head: "#ffb459", body: "#ff8c3b", food: "#66fcc1" },
    ice: { head: "#a8eaff", body: "#7cd3ff", food: "#ffd700" },
};

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const skin = skins[currentSkin] || skins.neon;

    // Food
    ctx.fillStyle = skin.food;
    ctx.beginPath();
    ctx.arc(
        food.x * tileSize + tileSize / 2,
        food.y * tileSize + tileSize / 2,
        tileSize / 2 - 1,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Snake (clean, no shadow)
    snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? skin.head : skin.body;
        ctx.beginPath();
        ctx.arc(
            segment.x * tileSize + tileSize / 2,
            segment.y * tileSize + tileSize / 2,
            tileSize / 2 - (i === 0 ? 0 : 1),
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    updateParticles();
    drawParticles();
}

function gameTick() {
    updateSnake();
    drawGame();
}

// -------------------------
// ✅ GAME OVER BUTTONS
// -------------------------
document.getElementById("btn-replay").addEventListener("click", () => {
    document.getElementById("game-over-screen").style.display = "none";
    startGame();
});
document.getElementById("btn-go-home").addEventListener("click", () => {
    document.getElementById("game-over-screen").style.display = "none";
    showScreen("home");
});

// -------------------------
// ✅ AI (Placeholder)
// -------------------------
function aiThink() {}

// -------------------------
// ✅ PAUSE MENU
// -------------------------
const pauseMenu = document.getElementById("pause-menu");
pauseBtn.addEventListener("click", togglePause);
document.getElementById("resume-btn").addEventListener("click", togglePause);

function togglePause() {
    if (currentScreen !== "game") return;
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        pauseMenu.classList.remove("pause-hidden");
        playSound("ui");
    } else {
        gameLoop = setInterval(gameTick, 1000 / speed);
        pauseMenu.classList.add("pause-hidden");
        playSound("ui");
    }
}
document.getElementById("pause-restart-btn").addEventListener("click", () => {
    pauseMenu.classList.add("pause-hidden");
    startGame();
});
document.getElementById("pause-quit-btn").addEventListener("click", () => {
    pauseMenu.classList.add("pause-hidden");
    isPaused = false;
    showScreen("home");
});

// -------------------------
// ✅ PARTICLES (Death Effect)
// -------------------------
function updateParticles() {
    particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life -= 0.03;
    });
    particles = particles.filter((p) => p.life > 0);
}
function drawParticles() {
    particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = "#fff";
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
}

// -------------------------
// ✅ MOBILE CONTROLS
// -------------------------
document.querySelectorAll(".mc-btn").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const dir = btn.dataset.dir;
        if (dir === "up" && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        if (dir === "down" && direction.y !== -1) nextDirection = { x: 0, y: 1 };
        if (dir === "left" && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        if (dir === "right" && direction.x !== -1) nextDirection = { x: 1, y: 0 };
        if (navigator.vibrate) navigator.vibrate(40);
    });
});

// -------------------------
// ✅ LEADERBOARD
// -------------------------
function saveScore(score) {
    if (score === 0) return;
    leaderboard.push(score);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard));
}
function showLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";
    if (leaderboard.length === 0) {
        list.innerHTML = "<p class='lb-item'>No scores yet.</p>";
        return;
    }
    leaderboard.forEach((score, index) => {
        const div = document.createElement("div");
        div.className = "lb-item";
        if (index === 0) div.classList.add("new-high");
        div.innerHTML = `#${index + 1}. Score <span>${score}</span>`;
        list.appendChild(div);
    });
}
clearLeaderboardBtn.addEventListener("click", () => {
    leaderboard = [];
    localStorage.removeItem("snakeLeaderboard");
    showLeaderboard();
    playSound("click");
});

// -------------------------
// ✅ SKINS
// -------------------------
skinSelect.addEventListener("change", (e) => {
    currentSkin = e.target.value;
});

// -------------------------
// ✅ INITIALIZE
// -------------------------
window.addEventListener("load", () => {
    highscoreDisplay.innerText = highscore;
    skinSelect.value = currentSkin;
    gridSelect.value = tileCount;
    startLoadingScreen();
});
window.addEventListener("resize", () => {
    if (currentScreen === "game") startGame();
});
