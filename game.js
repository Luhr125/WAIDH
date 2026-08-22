/* ==================================================
   DON'T TOUCH THE RED
   Einfaches Canvas-Jump-and-Run ohne externe Libraries
   ================================================== */

// --------------------------------------------------
// 1. EINSTELLUNGEN
// Diese Werte könnt ihr später leicht verändern.
// --------------------------------------------------
const SETTINGS = {
  playerSpeed: 270,       // Maximale Laufgeschwindigkeit
  acceleration: 1900,    // Wie schnell die Figur beschleunigt
  friction: 2200,        // Wie schnell die Figur wieder stoppt
  gravity: 1800,         // Stärke der Gravitation
  jumpPower: 650,        // Sprungkraft (grössere Zahl = höher)
  glitchInterval: 10,    // Sekunden bis zum nächsten Glitch
  glitchMessageTime: 1.65,
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const LEVEL_WIDTH = 5200;

// --------------------------------------------------
// 2. HTML-ELEMENTE
// --------------------------------------------------
const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const gameFrame = document.querySelector("#game-frame");
const scoreDisplay = document.querySelector("#score");
const activeGlitchDisplay = document.querySelector("#active-glitch");
const glitchCountdownDisplay = document.querySelector("#glitch-countdown");
const glitchMessage = document.querySelector("#glitch-message");
const glitchNameDisplay = document.querySelector("#glitch-name");
const gamePanel = document.querySelector("#game-panel");
const panelLabel = document.querySelector("#panel-label");
const panelTitle = document.querySelector("#panel-title");
const panelText = document.querySelector("#panel-text");
const finalScoreDisplay = document.querySelector("#final-score");
const startButton = document.querySelector("#start-button");

// --------------------------------------------------
// 3. SPIELER UND EINGABE
// --------------------------------------------------
const spawnPoint = { x: 80, y: 400 };

const player = {
  x: spawnPoint.x,
  y: spawnPoint.y,
  width: 34,
  height: 46,
  velocityX: 0,
  velocityY: 0,
  onGround: false,
};

// In diesem Set merken wir uns alle gedrückten Tasten.
const pressedKeys = new Set();
const touchInput = { left: false, right: false, jump: false };
let jumpWasPressed = false;

// --------------------------------------------------
// 4. LEVEL
// Plattformen sind normale, sichere Flächen.
// x/y = Position, width/height = Grösse.
// --------------------------------------------------
const platforms = [
  // Bodenstücke
  { x: 0, y: 480, width: 620, height: 60 },
  { x: 760, y: 480, width: 680, height: 60 },
  { x: 1570, y: 480, width: 770, height: 60 },
  { x: 2490, y: 480, width: 800, height: 60 },
  { x: 3430, y: 480, width: 820, height: 60 },
  { x: 4400, y: 480, width: 800, height: 60 },

  // Schwebende Plattformen
  { x: 270, y: 375, width: 170, height: 20 },
  { x: 805, y: 385, width: 160, height: 20 },
  { x: 1160, y: 335, width: 170, height: 20 },
  { x: 1630, y: 385, width: 165, height: 20 },
  { x: 1990, y: 345, width: 175, height: 20 },
  { x: 2550, y: 385, width: 175, height: 20 },
  { x: 2940, y: 330, width: 180, height: 20 },
  { x: 3490, y: 385, width: 170, height: 20 },
  { x: 3890, y: 340, width: 185, height: 20 },
  { x: 4450, y: 385, width: 170, height: 20 },
  { x: 4790, y: 345, width: 175, height: 20 },
];

// Jedes Objekt in dieser Liste ist tödlich und wird rot gezeichnet.
const redObstacles = [
  // Rote Blöcke und Bodenflächen
  { x: 465, y: 440, width: 70, height: 40 },
  { x: 990, y: 447, width: 90, height: 33 },
  { x: 1280, y: 430, width: 55, height: 50 },
  { x: 1780, y: 440, width: 90, height: 40 },
  { x: 2175, y: 446, width: 85, height: 34 },
  { x: 2700, y: 458, width: 165, height: 22 },
  { x: 3150, y: 435, width: 70, height: 45 },
  { x: 3650, y: 442, width: 105, height: 38 },
  { x: 4060, y: 430, width: 70, height: 50 },
  { x: 4610, y: 442, width: 95, height: 38 },
  { x: 4880, y: 450, width: 70, height: 30 },

  // Rote Lava in den Abgründen
  { x: 620, y: 515, width: 140, height: 25 },
  { x: 1440, y: 515, width: 130, height: 25 },
  { x: 2340, y: 515, width: 150, height: 25 },
  { x: 3290, y: 515, width: 140, height: 25 },
  { x: 4250, y: 515, width: 150, height: 25 },
];

const goal = { x: 5070, y: 370, width: 65, height: 110 };

// --------------------------------------------------
// 5. SPIELZUSTAND
// --------------------------------------------------
let gameState = "ready"; // ready, playing, gameover oder won
let startTime = 0;
let score = 0;
let cameraX = 0;
let lastFrameTime = performance.now();

function resetPlayer() {
  player.x = spawnPoint.x;
  player.y = spawnPoint.y;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;
  cameraX = 0;
  pressedKeys.clear();
  clearTouchInput();
  jumpWasPressed = false;
}

function startGame() {
  gameState = "playing";
  startTime = performance.now();
  score = 0;
  scoreDisplay.textContent = "0";
  finalScoreDisplay.classList.add("hidden");
  gamePanel.classList.add("hidden");
  startButton.textContent = "Restart";
  resetPlayer();
}

function endGame(didWin) {
  if (gameState !== "playing") return;

  gameState = didWin ? "won" : "gameover";
  pressedKeys.clear();
  clearTouchInput();

  panelLabel.textContent = didWin ? "LEVEL COMPLETE" : "RED DETECTED";
  panelTitle.textContent = didWin ? "YOU SURVIVED!" : "GAME OVER";
  panelText.textContent = didWin
    ? "Du hast das Ziel erreicht, ohne Rot zu berühren."
    : "Du hast etwas Rotes berührt. Versuch es noch einmal!";
  finalScoreDisplay.textContent = `SCORE: ${score} · ZEIT: ${score}s`;
  finalScoreDisplay.classList.remove("hidden");
  gamePanel.classList.remove("hidden");
  startButton.focus();
}

// --------------------------------------------------
// 6. EINGABE
// --------------------------------------------------
function isLeftPressed() {
  return pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft") || touchInput.left;
}

function isRightPressed() {
  return pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight") || touchInput.right;
}

function isJumpPressed() {
  return pressedKeys.has("KeyW")
    || pressedKeys.has("ArrowUp")
    || pressedKeys.has("Space")
    || touchInput.jump;
}

const gameKeys = ["KeyA", "KeyD", "KeyW", "ArrowLeft", "ArrowRight", "ArrowUp", "Space"];

window.addEventListener("keydown", (event) => {
  if (gameKeys.includes(event.code)) {
    event.preventDefault();
    pressedKeys.add(event.code);
  }
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.code);
});

window.addEventListener("blur", () => {
  pressedKeys.clear();
  clearTouchInput();
});

function clearTouchInput() {
  touchInput.left = false;
  touchInput.right = false;
  touchInput.jump = false;
}

function connectTouchButton(buttonId, action) {
  const button = document.querySelector(`#${buttonId}`);
  const releaseButton = () => { touchInput[action] = false; };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touchInput[action] = true;
  });
  button.addEventListener("pointerup", releaseButton);
  button.addEventListener("pointercancel", releaseButton);
  button.addEventListener("lostpointercapture", releaseButton);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

connectTouchButton("touch-left", "left");
connectTouchButton("touch-jump", "jump");
connectTouchButton("touch-right", "right");
startButton.addEventListener("click", startGame);

// --------------------------------------------------
// 7. PHYSIK
// --------------------------------------------------
function moveNumberTowardZero(number, amount) {
  if (number > 0) return Math.max(0, number - amount);
  if (number < 0) return Math.min(0, number + amount);
  return 0;
}

function updatePlayer(deltaTime) {
  let moveDirection = 0;
  if (isLeftPressed()) moveDirection -= 1;
  if (isRightPressed()) moveDirection += 1;

  // Beschleunigen, solange eine Richtung gedrückt wird.
  if (moveDirection !== 0) {
    player.velocityX += moveDirection * SETTINGS.acceleration * deltaTime;
    player.velocityX = Math.max(
      -SETTINGS.playerSpeed,
      Math.min(SETTINGS.playerSpeed, player.velocityX),
    );
  } else {
    // Ohne Eingabe bremst die Reibung den Spieler ab.
    player.velocityX = moveNumberTowardZero(
      player.velocityX,
      SETTINGS.friction * deltaTime,
    );
  }

  const jumpIsPressed = isJumpPressed();
  const jumpStartedNow = jumpIsPressed && !jumpWasPressed;

  // Springen ist nur erlaubt, wenn die Figur auf einer Plattform steht.
  if (jumpStartedNow && player.onGround) {
    player.velocityY = -SETTINGS.jumpPower;
    player.onGround = false;
  }
  jumpWasPressed = jumpIsPressed;

  // Erst horizontale, dann vertikale Bewegung berechnen.
  player.x += player.velocityX * deltaTime;
  player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.width, player.x));

  const previousBottom = player.y + player.height;
  player.velocityY += SETTINGS.gravity * deltaTime;
  player.y += player.velocityY * deltaTime;
  player.onGround = false;

  handlePlatformCollisions(previousBottom);
  checkDangerousCollisions();
  checkGoalCollision();
}

// --------------------------------------------------
// 8. KOLLISIONEN
// --------------------------------------------------
function rectanglesOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function handlePlatformCollisions(previousBottom) {
  // Wir prüfen nur Landungen von oben. Das hält den Code einfach und stabil.
  if (player.velocityY < 0) return;

  for (const platform of platforms) {
    const currentBottom = player.y + player.height;
    const crossesPlatformTop = previousBottom <= platform.y && currentBottom >= platform.y;
    const isHorizontallyAbove = player.x + player.width > platform.x
      && player.x < platform.x + platform.width;

    if (crossesPlatformTop && isHorizontallyAbove) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
      return;
    }
  }
}

function checkDangerousCollisions() {
  const touchesRed = redObstacles.some((obstacle) => rectanglesOverlap(player, obstacle));
  const fellOutOfLevel = player.y > CANVAS_HEIGHT + 100;

  if (touchesRed || fellOutOfLevel) endGame(false);
}

function checkGoalCollision() {
  if (rectanglesOverlap(player, goal)) endGame(true);
}

// --------------------------------------------------
// 9. UI UND SCORE
// --------------------------------------------------
function updateScore(now) {
  score = Math.floor((now - startTime) / 1000);
  scoreDisplay.textContent = String(score);
}

function updateCamera(deltaTime) {
  const targetCameraX = player.x - CANVAS_WIDTH * 0.35;
  const smoothMovement = Math.min(1, deltaTime * 7);
  cameraX += (targetCameraX - cameraX) * smoothMovement;
  cameraX = Math.max(0, Math.min(LEVEL_WIDTH - CANVAS_WIDTH, cameraX));
}

// --------------------------------------------------
// 10. ZEICHNEN
// --------------------------------------------------
function drawBackground() {
  const background = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  background.addColorStop(0, "#0b1019");
  background.addColorStop(1, "#172131");
  context.fillStyle = background;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Ein einfaches Raster sorgt für Bewegung im Hintergrund.
  context.strokeStyle = "rgba(255, 255, 255, 0.035)";
  context.lineWidth = 1;
  const gridOffset = -(cameraX * 0.18) % 48;
  for (let x = gridOffset; x < CANVAS_WIDTH; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CANVAS_HEIGHT);
    context.stroke();
  }
  for (let y = 40; y < CANVAS_HEIGHT; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CANVAS_WIDTH, y);
    context.stroke();
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    context.fillStyle = "#c5cbd4";
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.fillStyle = "#f4f6f8";
    context.fillRect(platform.x, platform.y, platform.width, 5);
  }
}

function drawRedObstacles() {
  context.save();
  context.fillStyle = "#ff3048";
  context.shadowColor = "rgba(255, 48, 72, 0.7)";
  context.shadowBlur = 17;

  for (const obstacle of redObstacles) {
    context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
  context.restore();
}

function drawGoal() {
  context.save();
  context.strokeStyle = "#59f2bd";
  context.fillStyle = "rgba(89, 242, 189, 0.13)";
  context.lineWidth = 8;
  context.shadowColor = "#59f2bd";
  context.shadowBlur = 24;
  context.beginPath();
  context.roundRect(goal.x, goal.y, goal.width, goal.height, 30);
  context.fill();
  context.stroke();
  context.restore();
}

function drawPlayer() {
  context.save();
  context.fillStyle = "#f8fafc";
  context.shadowColor = "rgba(255, 255, 255, 0.65)";
  context.shadowBlur = 13;
  context.beginPath();
  context.roundRect(player.x, player.y, player.width, player.height, 8);
  context.fill();

  // Das kleine dunkle Auge zeigt die Laufrichtung.
  context.shadowBlur = 0;
  context.fillStyle = "#141924";
  const eyeX = player.velocityX < 0 ? player.x + 7 : player.x + 21;
  context.fillRect(eyeX, player.y + 11, 6, 7);
  context.restore();
}

function drawGame() {
  drawBackground();

  // Alle Level-Objekte werden gemeinsam mit der Kamera verschoben.
  context.save();
  context.translate(-cameraX, 0);
  drawPlatforms();
  drawRedObstacles();
  drawGoal();
  drawPlayer();
  context.restore();
}

// --------------------------------------------------
// 11. GAME LOOP
// --------------------------------------------------
function gameLoop(now) {
  // Der Maximalwert verhindert grosse Physiksprünge bei einem kurzen Ruckler.
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 1 / 30);
  lastFrameTime = now;

  if (gameState === "playing") {
    updatePlayer(deltaTime);
    updateCamera(deltaTime);
    updateScore(now);
  }

  drawGame();
  requestAnimationFrame(gameLoop);
}

// Anfangszustand zeichnen und Animation starten.
activeGlitchDisplay.textContent = "NONE";
glitchCountdownDisplay.textContent = String(SETTINGS.glitchInterval);
drawGame();
requestAnimationFrame(gameLoop);
