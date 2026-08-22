const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const livesDisplay = document.querySelector("#lives");
const controlsDisplay = document.querySelector("#controls");
const switchTimerDisplay = document.querySelector("#switch-timer");
const panel = document.querySelector("#message-panel");
const panelTitle = document.querySelector("#message-title");
const panelCopy = document.querySelector("#message-copy");
const startButton = document.querySelector("#start-button");
const controlFlash = document.querySelector("#control-flash");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 3080;
const GRAVITY = 1750;
const MOVE_SPEED = 285;
const JUMP_SPEED = 650;
const CONTROL_INTERVAL = 10_000;

const controlSchemes = [
  { left: "ArrowLeft", jump: "ArrowUp", right: "ArrowRight", label: "←  ↑  →" },
  { left: "KeyA", jump: "KeyW", right: "KeyD", label: "A  W  D" },
  { left: "KeyJ", jump: "KeyI", right: "KeyL", label: "J  I  L" },
];

const touchLayouts = [
  ["touch-left", "touch-jump", "touch-right"],
  ["touch-jump", "touch-left", "touch-right"],
  ["touch-right", "touch-jump", "touch-left"],
];

const platforms = [
  { x: 0, y: 480, width: 720, height: 60 },
  { x: 820, y: 480, width: 520, height: 60 },
  { x: 1420, y: 480, width: 650, height: 60 },
  { x: 2180, y: 480, width: 900, height: 60 },
  { x: 255, y: 390, width: 150, height: 18 },
  { x: 560, y: 365, width: 125, height: 18 },
  { x: 880, y: 380, width: 160, height: 18 },
  { x: 1190, y: 330, width: 120, height: 18 },
  { x: 1480, y: 385, width: 145, height: 18 },
  { x: 1840, y: 350, width: 150, height: 18 },
  { x: 2240, y: 390, width: 145, height: 18 },
  { x: 2560, y: 345, width: 130, height: 18 },
];

const hazards = [
  { x: 435, y: 448, width: 62, height: 32 },
  { x: 1065, y: 442, width: 78, height: 38 },
  { x: 1660, y: 438, width: 105, height: 42 },
  { x: 1930, y: 448, width: 64, height: 32 },
  { x: 2380, y: 438, width: 92, height: 42 },
  { x: 2730, y: 446, width: 70, height: 34 },
];

const goal = { x: 2940, y: 382, width: 54, height: 98 };
const spawn = { x: 72, y: 410 };
const player = { x: spawn.x, y: spawn.y, width: 34, height: 46, vx: 0, vy: 0, grounded: false };
const pressedKeys = new Set();
const touchState = { left: false, jump: false, right: false };

const stars = Array.from({ length: 80 }, (_, index) => ({
  x: (index * 173) % WORLD_WIDTH,
  y: 25 + (index * 67) % 280,
  size: 1 + index % 3,
}));

let running = false;
let lives = 3;
let cameraX = 0;
let controlIndex = 0;
let nextControlSwitch = 0;
let lastFrame = performance.now();
let jumpConsumed = false;
let flashTimeout = null;

function currentControls() {
  return controlSchemes[controlIndex];
}

function resetPlayer() {
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  cameraX = 0;
  pressedKeys.clear();
  clearTouchState();
}

function clearTouchState() {
  touchState.left = false;
  touchState.jump = false;
  touchState.right = false;
}

function updateTouchLayout() {
  touchLayouts[controlIndex].forEach((id, order) => {
    document.querySelector(`#${id}`).style.order = String(order);
  });
}

function showFlash(message) {
  clearTimeout(flashTimeout);
  controlFlash.textContent = message;
  controlFlash.classList.add("visible");
  flashTimeout = setTimeout(() => controlFlash.classList.remove("visible"), 1900);
}

function switchControls() {
  controlIndex = (controlIndex + 1) % controlSchemes.length;
  pressedKeys.clear();
  clearTouchState();
  jumpConsumed = false;
  controlsDisplay.textContent = currentControls().label;
  updateTouchLayout();
  showFlash(`Neue Steuerung: ${currentControls().label}`);
}

function startGame() {
  lives = 3;
  controlIndex = 0;
  running = true;
  jumpConsumed = false;
  livesDisplay.textContent = String(lives);
  controlsDisplay.textContent = currentControls().label;
  switchTimerDisplay.textContent = "10";
  nextControlSwitch = performance.now() + CONTROL_INTERVAL;
  startButton.textContent = "Nochmal spielen";
  panel.classList.add("hidden");
  updateTouchLayout();
  resetPlayer();
}

function finishGame(won) {
  running = false;
  pressedKeys.clear();
  clearTouchState();
  panelTitle.textContent = won ? "Portal erreicht!" : "Keine Versuche mehr";
  panelCopy.textContent = won
    ? "Du hast Rot überlebt und jede Steuerung gemeistert."
    : "Rot gewinnt diese Runde. Versuch es gleich noch einmal.";
  panel.classList.remove("hidden");
  startButton.focus();
}

function loseLife() {
  if (!running) return;
  lives -= 1;
  livesDisplay.textContent = String(lives);

  if (lives <= 0) {
    finishGame(false);
    return;
  }

  showFlash(`Rot berührt! Noch ${lives} ${lives === 1 ? "Versuch" : "Versuche"}`);
  resetPlayer();
}

function overlaps(a, b) {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

function updatePlayer(delta) {
  const controls = currentControls();
  const movingLeft = pressedKeys.has(controls.left) || touchState.left;
  const movingRight = pressedKeys.has(controls.right) || touchState.right;
  const wantsToJump = pressedKeys.has(controls.jump) || touchState.jump;

  player.vx = (Number(movingRight) - Number(movingLeft)) * MOVE_SPEED;

  if (wantsToJump && player.grounded && !jumpConsumed) {
    player.vy = -JUMP_SPEED;
    player.grounded = false;
    jumpConsumed = true;
  }

  if (!wantsToJump) jumpConsumed = false;

  const previousBottom = player.y + player.height;
  player.x += player.vx * delta;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  player.vy += GRAVITY * delta;
  player.y += player.vy * delta;
  player.grounded = false;

  if (player.vy >= 0) {
    for (const platform of platforms) {
      const playerBottom = player.y + player.height;
      const crossesTop = previousBottom <= platform.y && playerBottom >= platform.y;
      const isAbovePlatform = player.x + player.width > platform.x && player.x < platform.x + platform.width;

      if (crossesTop && isAbovePlatform) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
        break;
      }
    }
  }

  if (hazards.some((hazard) => overlaps(player, hazard)) || player.y > HEIGHT + 90) {
    loseLife();
    return;
  }

  if (overlaps(player, goal)) finishGame(true);
}

function updateGame(now, delta) {
  if (!running) return;

  if (now >= nextControlSwitch) {
    switchControls();
    nextControlSwitch = now + CONTROL_INTERVAL;
  }

  const secondsUntilSwitch = Math.max(0, Math.ceil((nextControlSwitch - now) / 1000));
  switchTimerDisplay.textContent = String(secondsUntilSwitch);
  updatePlayer(delta);

  const cameraTarget = player.x - WIDTH * 0.36;
  cameraX += (cameraTarget - cameraX) * Math.min(1, delta * 6);
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, cameraX));
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#071226");
  gradient.addColorStop(1, "#10264a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(151, 196, 255, .55)";
  for (const star of stars) {
    const x = star.x - cameraX * 0.18;
    if (x > -5 && x < WIDTH + 5) context.fillRect(x, star.y, star.size, star.size);
  }

  context.fillStyle = "rgba(21, 57, 96, .72)";
  for (let x = -120; x < WIDTH + 220; x += 180) {
    const shiftedX = x - (cameraX * 0.3) % 180;
    context.beginPath();
    context.moveTo(shiftedX, 480);
    context.lineTo(shiftedX + 90, 315);
    context.lineTo(shiftedX + 210, 480);
    context.fill();
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    context.fillStyle = "#172a46";
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.fillStyle = "#3f668a";
    context.fillRect(platform.x, platform.y, platform.width, 5);
  }
}

function drawHazards() {
  context.save();
  context.shadowColor = "rgba(255, 51, 78, .75)";
  context.shadowBlur = 18;

  for (const hazard of hazards) {
    const spikeWidth = 18;
    context.fillStyle = "#ff334e";
    context.fillRect(hazard.x, hazard.y + 13, hazard.width, hazard.height - 13);

    for (let x = hazard.x; x < hazard.x + hazard.width; x += spikeWidth) {
      context.beginPath();
      context.moveTo(x, hazard.y + 14);
      context.lineTo(Math.min(x + spikeWidth / 2, hazard.x + hazard.width), hazard.y);
      context.lineTo(Math.min(x + spikeWidth, hazard.x + hazard.width), hazard.y + 14);
      context.fill();
    }
  }

  context.restore();
}

function drawGoal() {
  context.save();
  context.strokeStyle = "#65f5c9";
  context.lineWidth = 9;
  context.shadowColor = "#65f5c9";
  context.shadowBlur = 26;
  context.beginPath();
  context.roundRect(goal.x, goal.y, goal.width, goal.height + 18, 28);
  context.stroke();
  context.fillStyle = "rgba(101, 245, 201, .12)";
  context.fill();
  context.restore();
}

function drawPlayer() {
  context.save();
  context.shadowColor = "rgba(70, 149, 255, .8)";
  context.shadowBlur = 17;
  context.fillStyle = "#4695ff";
  context.beginPath();
  context.roundRect(player.x, player.y, player.width, player.height, 9);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#d9ecff";
  const eyeX = player.vx < 0 ? player.x + 7 : player.x + 21;
  context.fillRect(eyeX, player.y + 11, 6, 7);
  context.restore();
}

function render() {
  drawBackground();
  context.save();
  context.translate(-cameraX, 0);
  drawPlatforms();
  drawHazards();
  drawGoal();
  drawPlayer();
  context.restore();
}

function gameLoop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 1 / 30);
  lastFrame = now;
  updateGame(now, delta);
  render();
  requestAnimationFrame(gameLoop);
}

function isGameKey(code) {
  return controlSchemes.some((scheme) => Object.values(scheme).includes(code));
}

window.addEventListener("keydown", (event) => {
  if (isGameKey(event.code)) {
    event.preventDefault();
    pressedKeys.add(event.code);
  }
});

window.addEventListener("keyup", (event) => {
  pressedKeys.delete(event.code);
});

window.addEventListener("blur", () => {
  pressedKeys.clear();
  clearTouchState();
});

function bindTouchButton(id, action) {
  const button = document.querySelector(`#${id}`);
  const release = () => { touchState[action] = false; };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touchState[action] = true;
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

bindTouchButton("touch-left", "left");
bindTouchButton("touch-jump", "jump");
bindTouchButton("touch-right", "right");
startButton.addEventListener("click", startGame);

controlsDisplay.textContent = currentControls().label;
updateTouchLayout();
render();
requestAnimationFrame(gameLoop);
