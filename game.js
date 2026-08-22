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
  { x: 0, y: 480, width: 640, height: 60 },
  { x: 760, y: 480, width: 700, height: 60 },
  { x: 1570, y: 480, width: 800, height: 60 },
  { x: 2490, y: 480, width: 830, height: 60 },
  { x: 3430, y: 480, width: 850, height: 60 },
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
  { x: 640, y: 515, width: 120, height: 25 },
  { x: 1460, y: 515, width: 110, height: 25 },
  { x: 2370, y: 515, width: 120, height: 25 },
  { x: 3320, y: 515, width: 110, height: 25 },
  { x: 4280, y: 515, width: 120, height: 25 },
];

const goal = { x: 5070, y: 370, width: 65, height: 110 };

// --------------------------------------------------
// 5. GLITCH-SYSTEM
// Es kann immer nur ein Eintrag aus dieser Liste aktiv sein.
// --------------------------------------------------
const glitches = [
  { id: "reverseControls", name: "REVERSE CONTROLS" },
  { id: "doubleSpeed", name: "DOUBLE SPEED" },
  { id: "halfSpeed", name: "HALF SPEED" },
  { id: "lowGravity", name: "LOW GRAVITY" },
  { id: "superJump", name: "SUPER JUMP" },
  { id: "autoJump", name: "AUTO JUMP" },
  { id: "iceMode", name: "ICE MODE" },
  { id: "screenFlip", name: "SCREEN FLIP" },
  { id: "zoomOut", name: "ZOOM OUT" },
];

// --------------------------------------------------
// 6. SPIELZUSTAND
// --------------------------------------------------
let gameState = "ready"; // ready, playing, gameover oder won
let startTime = 0;
let score = 0;
let cameraX = 0;
let lastFrameTime = performance.now();
let activeGlitch = null;
let nextGlitchTime = 0;
let glitchMessageTimer = null;

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
  nextGlitchTime = startTime + SETTINGS.glitchInterval * 1000;
  score = 0;
  scoreDisplay.textContent = "0";
  glitchCountdownDisplay.textContent = String(SETTINGS.glitchInterval);
  finalScoreDisplay.classList.add("hidden");
  gamePanel.classList.add("hidden");
  startButton.textContent = "Restart";
  deactivateCurrentGlitch();
  resetPlayer();
}

function endGame(didWin) {
  if (gameState !== "playing") return;

  // Beim Ende berechnen wir den Score ein letztes Mal ganz genau.
  score = Math.floor((performance.now() - startTime) / 1000);
  scoreDisplay.textContent = String(score);
  gameState = didWin ? "won" : "gameover";
  pressedKeys.clear();
  clearTouchInput();
  deactivateCurrentGlitch();
  glitchCountdownDisplay.textContent = "0";

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

function isGlitchActive(glitchId) {
  return activeGlitch?.id === glitchId;
}

function deactivateCurrentGlitch() {
  activeGlitch = null;
  activeGlitchDisplay.textContent = "NONE";
  canvas.classList.remove("screen-flip");
}

function activateRandomGlitch() {
  const previousGlitchId = activeGlitch?.id;

  // Zuerst endet der alte Effekt.
  deactivateCurrentGlitch();

  // Wenn möglich, wählen wir nicht zweimal nacheinander denselben Effekt.
  const possibleGlitches = glitches.filter((glitch) => glitch.id !== previousGlitchId);
  const randomIndex = Math.floor(Math.random() * possibleGlitches.length);
  activeGlitch = possibleGlitches[randomIndex];

  activeGlitchDisplay.textContent = activeGlitch.name;
  canvas.classList.toggle("screen-flip", isGlitchActive("screenFlip"));
  showGlitchMessage(activeGlitch.name);
}

function showGlitchMessage(glitchName) {
  clearTimeout(glitchMessageTimer);
  glitchNameDisplay.textContent = glitchName;

  // Kurzes Entfernen und erneutes Hinzufügen startet die CSS-Animation neu.
  glitchMessage.classList.remove("visible");
  gameFrame.classList.remove("glitch-pulse");
  void glitchMessage.offsetWidth;
  glitchMessage.classList.add("visible");
  gameFrame.classList.add("glitch-pulse");

  glitchMessageTimer = setTimeout(() => {
    glitchMessage.classList.remove("visible");
    gameFrame.classList.remove("glitch-pulse");
  }, SETTINGS.glitchMessageTime * 1000);
}

function updateGlitchSystem(now) {
  if (now >= nextGlitchTime) {
    activateRandomGlitch();
    nextGlitchTime = now + SETTINGS.glitchInterval * 1000;
  }

  const millisecondsLeft = Math.max(0, nextGlitchTime - now);
  glitchCountdownDisplay.textContent = String(Math.ceil(millisecondsLeft / 1000));
}

// --------------------------------------------------
// 7. EINGABE
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
// 8. PHYSIK
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

  // Reverse Controls vertauscht links und rechts.
  if (isGlitchActive("reverseControls")) moveDirection *= -1;

  let speedMultiplier = 1;
  if (isGlitchActive("doubleSpeed")) speedMultiplier = 2;
  if (isGlitchActive("halfSpeed")) speedMultiplier = 0.5;

  const currentMaxSpeed = SETTINGS.playerSpeed * speedMultiplier;
  const currentAcceleration = SETTINGS.acceleration * speedMultiplier;
  const currentFriction = isGlitchActive("iceMode") ? 120 : SETTINGS.friction;
  const currentGravity = isGlitchActive("lowGravity") ? SETTINGS.gravity * 0.5 : SETTINGS.gravity;
  const currentJumpPower = isGlitchActive("superJump") ? SETTINGS.jumpPower * 1.55 : SETTINGS.jumpPower;

  // Beschleunigen, solange eine Richtung gedrückt wird.
  if (moveDirection !== 0) {
    player.velocityX += moveDirection * currentAcceleration * deltaTime;
    player.velocityX = Math.max(
      -currentMaxSpeed,
      Math.min(currentMaxSpeed, player.velocityX),
    );
  } else {
    // Ohne Eingabe bremst die Reibung den Spieler ab.
    player.velocityX = moveNumberTowardZero(
      player.velocityX,
      currentFriction * deltaTime,
    );
  }

  const jumpIsPressed = isJumpPressed();
  const jumpStartedNow = jumpIsPressed && !jumpWasPressed;

  // Springen ist nur erlaubt, wenn die Figur auf einer Plattform steht.
  if (jumpStartedNow && player.onGround) {
    player.velocityY = -currentJumpPower;
    player.onGround = false;
  }
  jumpWasPressed = jumpIsPressed;

  // Erst horizontale, dann vertikale Bewegung berechnen.
  player.x += player.velocityX * deltaTime;
  player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.width, player.x));

  const previousBottom = player.y + player.height;
  player.velocityY += currentGravity * deltaTime;
  player.y += player.velocityY * deltaTime;
  player.onGround = false;

  const landedOnPlatform = handlePlatformCollisions(previousBottom);

  // Auto Jump löst direkt nach jeder Landung einen neuen Sprung aus.
  if (landedOnPlatform && isGlitchActive("autoJump")) {
    player.velocityY = -currentJumpPower;
    player.onGround = false;
  }

  checkDangerousCollisions();
  checkGoalCollision();
}

// --------------------------------------------------
// 9. KOLLISIONEN
// --------------------------------------------------
function rectanglesOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function handlePlatformCollisions(previousBottom) {
  // Wir prüfen nur Landungen von oben. Das hält den Code einfach und stabil.
  if (player.velocityY < 0) return false;

  for (const platform of platforms) {
    const currentBottom = player.y + player.height;
    const crossesPlatformTop = previousBottom <= platform.y && currentBottom >= platform.y;
    const isHorizontallyAbove = player.x + player.width > platform.x
      && player.x < platform.x + platform.width;

    if (crossesPlatformTop && isHorizontallyAbove) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
      return true;
    }
  }

  return false;
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
// 10. UI, SCORE UND KAMERA
// --------------------------------------------------
function updateScore(now) {
  score = Math.floor((now - startTime) / 1000);
  scoreDisplay.textContent = String(score);
}

function updateCamera(deltaTime) {
  const zoom = isGlitchActive("zoomOut") ? 0.68 : 1;
  const visibleLevelWidth = CANVAS_WIDTH / zoom;
  const targetCameraX = player.x - visibleLevelWidth * 0.35;
  const smoothMovement = Math.min(1, deltaTime * 7);
  cameraX += (targetCameraX - cameraX) * smoothMovement;
  cameraX = Math.max(0, Math.min(LEVEL_WIDTH - visibleLevelWidth, cameraX));
}

// --------------------------------------------------
// 11. ZEICHNEN
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

  // Beim Zoom-Out-Glitch wird die ganze Spielwelt kleiner gezeichnet.
  const zoom = isGlitchActive("zoomOut") ? 0.68 : 1;

  // Alle Level-Objekte werden gemeinsam mit der Kamera verschoben.
  context.save();
  context.translate(0, CANVAS_HEIGHT / 2);
  context.scale(zoom, zoom);
  context.translate(-cameraX, -CANVAS_HEIGHT / 2);
  drawPlatforms();
  drawRedObstacles();
  drawGoal();
  drawPlayer();
  context.restore();
}

// --------------------------------------------------
// 12. GAME LOOP
// --------------------------------------------------
function gameLoop(now) {
  // Der Maximalwert verhindert grosse Physiksprünge bei einem kurzen Ruckler.
  const deltaTime = Math.min((now - lastFrameTime) / 1000, 1 / 30);
  lastFrameTime = now;

  if (gameState === "playing") {
    updateGlitchSystem(now);
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
