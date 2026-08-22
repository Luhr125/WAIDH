const GAME_LENGTH = 30;
const START_SIZE = 74;
const MIN_SIZE = 34;

const arena = document.querySelector("#arena");
const target = document.querySelector("#target");
const scoreDisplay = document.querySelector("#score");
const timeDisplay = document.querySelector("#time");
const highScoreDisplay = document.querySelector("#high-score");
const panel = document.querySelector("#start-panel");
const panelTitle = document.querySelector("#panel-title");
const panelCopy = document.querySelector("#panel-copy");
const startButton = document.querySelector("#start-button");

let score = 0;
let gameTimer = null;
let endTime = 0;
let playing = false;

function readHighScore() {
  try {
    return Number.parseInt(localStorage.getItem("signalSprintHighScore") ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem("signalSprintHighScore", String(value));
  } catch {
    // Das Spiel funktioniert auch, wenn der Browser lokalen Speicher blockiert.
  }
}

function moveTarget() {
  const size = Math.max(MIN_SIZE, START_SIZE - score * 1.25);
  const maxX = Math.max(0, arena.clientWidth - size);
  const maxY = Math.max(0, arena.clientHeight - size);

  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
  target.style.left = `${Math.random() * maxX}px`;
  target.style.top = `${Math.random() * maxY}px`;
}

function updateClock() {
  const millisecondsLeft = Math.max(0, endTime - Date.now());
  timeDisplay.textContent = String(Math.ceil(millisecondsLeft / 1000));

  if (millisecondsLeft === 0) endGame();
}

function startGame() {
  clearInterval(gameTimer);
  score = 0;
  playing = true;
  endTime = Date.now() + GAME_LENGTH * 1000;
  scoreDisplay.textContent = "0";
  timeDisplay.textContent = String(GAME_LENGTH);
  panel.classList.add("hidden");
  target.classList.add("visible");
  moveTarget();
  gameTimer = setInterval(updateClock, 100);
}

function endGame() {
  if (!playing) return;

  playing = false;
  clearInterval(gameTimer);
  gameTimer = null;
  timeDisplay.textContent = "0";
  target.classList.remove("visible");

  const previousHighScore = readHighScore();
  const isNewRecord = score > previousHighScore;
  if (isNewRecord) saveHighScore(score);

  highScoreDisplay.textContent = String(Math.max(score, previousHighScore));
  panelTitle.textContent = isNewRecord ? "Neuer Rekord!" : "Zeit abgelaufen!";
  panelCopy.textContent = `Du hast ${score} ${score === 1 ? "Signal" : "Signale"} getroffen.`;
  startButton.textContent = "Nochmal spielen";
  panel.classList.remove("hidden");
  startButton.focus();
}

function hitTarget() {
  if (!playing) return;
  score += 1;
  scoreDisplay.textContent = String(score);
  moveTarget();
}

startButton.addEventListener("click", startGame);
target.addEventListener("click", hitTarget);

window.addEventListener("resize", () => {
  if (playing) moveTarget();
});

highScoreDisplay.textContent = String(readHighScore());
