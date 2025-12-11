const difficultyModal = document.getElementById("difficultyModal");
const easySelect = document.getElementById("easySelect");
const normalSelect = document.getElementById("normalSelect");
const hardSelect = document.getElementById("hardSelect");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerScoreElem = document.getElementById("playerScore");
const computerScoreElem = document.getElementById("computerScore");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const WINNING_SCORE = 5;
const paddleHeight = 90;
const paddleWidth = 12;

const hitSound = new Audio('./audio/hit.wav');
hitSound.volume = 0.35;
const missSound = new Audio('./audio/miss.wav');
missSound.volume = 0.35;
const winSound = new Audio('./audio/win.wav');
winSound.volume = 0.45;
const loseSound = new Audio('./audio/lose.wav');
loseSound.volume = 0.45;
const muteBtn = document.getElementById("muteBtn");
let isMuted = false;

let animationId = null;
let isRunning = false;
let gameOver = false;
let ball = {};
let playerPaddle = {};
let computerPaddle = {};
let playerScore = 0;
let computerScore = 0;
let shakeX = 0;
let shakeY = 0;
let particles = [];
const MAX_TRAIL = 10;
let rallyCount = 0;
let maxRally = 0;
const rallyCountElem = document.getElementById("rallyCount");
let bestRallyEverRaw = localStorage.getItem('bestRallyEver');
let bestRallyEver = bestRallyEverRaw ? Number(bestRallyEverRaw) : 0;
if (Number.isNaN(bestRallyEver)) bestRallyEver = 0;
const bestRallyElem = document.getElementById('bestRallyEver');
let totalRallies = 0;

let aiMissChance = 0.3;
let aiSpeed = 6;
let currentDifficulty = 'Normal';

let baseBallSpeed = 5;
let maxBallSpeed = 10;

let isServing = false;
let serveTimerId = null;

function isDifficultyOpen() {
  return !difficultyModal.classList.contains('hidden');
}

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  if (ball) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
  }
  if (playerPaddle) {
    playerPaddle.x = 0;
    playerPaddle.y = (canvas.height - paddleHeight) / 2;
  }
  if (computerPaddle) {
    computerPaddle.x = canvas.width - paddleWidth;
    computerPaddle.y = (canvas.height - paddleHeight) / 2;
  }
}

function showModal(won) {
  const modal = document.getElementById('gameOverModal');
  const title = document.getElementById('modalTitle');
  const modalDifficulty = document.getElementById('modalDifficulty');
  const newBestBadge = document.getElementById('newBestBadge');

  const matchSummary = document.getElementById('matchSummary');
  const summaryResult = document.getElementById('summaryResult');
  const summaryScore = document.getElementById('summaryScore');
  const summaryRallies = document.getElementById('summaryRallies');
  const summaryMode = document.getElementById('modalDifficulty');
  const summaryBestRally = document.getElementById('bestRallyEver');

  title.textContent = won ? 'CONGRATULATIONS' : 'GAME OVER';
  title.style.color = won ? '#39ff14' : '#ff0000ff';

  matchSummary.textContent = `Rallies Played: ${totalRallies} · Longest rally: ${maxRally} · Mode: ${currentDifficulty}`

  summaryResult.textContent = won ? 'VICTORY!' : 'DEFEAT';
  summaryScore.textContent = `${playerScore} - ${computerScore}`;
  summaryRallies.textContent = `${totalRallies}  |  LONGEST: ${maxRally}`;
  summaryMode.textContent = `${currentDifficulty.toUpperCase()}`;
  summaryBestRally.textContent = `${bestRallyEver}`;

  newBestBadge.classList.add('hidden');

  const previousBest = bestRallyEver;
  if (maxRally > previousBest) {
    bestRallyEver = maxRally;
    localStorage.setItem('bestRallyEver', bestRallyEver);
    newBestBadge.classList.remove('hidden');
  }

  bestRallyElem.textContent = `${bestRallyEver}`;

  modal.classList.remove('hidden');
  gameOver = true;
}

function hideModal() {
  document.getElementById('gameOverModal').classList.add('hidden');
}

function setupControls() {
  canvas.addEventListener("mousemove", e => {
    if (!isRunning || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const mouseY = Math.min(Math.max(e.clientY - rect.top, 0), canvas.height);
    playerPaddle.y = Math.min(Math.max(mouseY - paddleHeight / 2, 0), canvas.height - paddleHeight);
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!isRunning || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const touchY = Math.min(Math.max(e.touches[0].clientY - rect.top, 0), canvas.height);
    playerPaddle.y = Math.min(Math.max(touchY - paddleHeight / 2, 0), canvas.height - paddleHeight);
  }, { passive: false });
}

function setupKeyboardControls() {
  window.addEventListener('keydown', e => {

    const diffOpen = isDifficultyOpen();

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!diffOpen) startGame();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (diffOpen) return;
      if (isRunning) {
        pauseGame();
      } else if (!gameOver) {
        startGame();
      }
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      if (!diffOpen) resetGame();
      return;
    }
    if (!isRunning || gameOver) return;

    const step = 18;

    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      playerPaddle.y = Math.max(0, playerPaddle.y - step);
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      playerPaddle.y = Math.min(canvas.height - paddleHeight, playerPaddle.y + step);
    }
  });
}

function updateMuteState() {
  const volumeFactor = isMuted ? 0 : 1;
  hitSound.muted = isMuted;
  missSound.muted = isMuted;
  winSound.muted = isMuted;
  loseSound.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}

muteBtn.addEventListener('click', () => {
  if (window.NeonMusic) {
    window.NeonMusic.toggle();
    const nowPlaying = window.NeonMusic.isPlaying();
    muteBtn.textContent = nowPlaying ? "🔇" : "🔊";
  }
});

function applyPaddleBounce(paddle) {
  const paddleCenter = paddle.y + paddle.height / 2;
  const relativeIntersectY = (ball.y - paddleCenter) / (paddle.height / 2);
  const maxBounceAngle = Math.PI / 3;
  const bounceAngle = relativeIntersectY * maxBounceAngle;
  let speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY) * 1.05;
  speed = Math.min(speed, maxBallSpeed);
  const direction = paddle === playerPaddle ? 1 : -1;
  ball.speedX = speed * Math.cos(bounceAngle) * direction;
  ball.speedY = speed * Math.sin(bounceAngle);
}

function update() {
  if (gameOver) return;

  if (isServing) {
    return;
  }

  ball.trail.push({ x: ball.x, y: ball.y });
  if (ball.trail.length > MAX_TRAIL) ball.trail.shift();

  ball.x += ball.speedX;
  ball.y += ball.speedY;

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.speedY = -ball.speedY;
  }
  if (ball.y + ball.radius > canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.speedY = -ball.speedY;
  }

  if (
    ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
    ball.y > playerPaddle.y &&
    ball.y < playerPaddle.y + playerPaddle.height
  ) {
    ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
    applyPaddleBounce(playerPaddle);
    hitSound.currentTime = 0;
    hitSound.play();
    createParticles(ball.x, ball.y);
    rallyCount++;
    totalRallies++;
    rallyCountElem.textContent = rallyCount;
    maxRally = Math.max(maxRally, rallyCount);
  }

  if (
    ball.x + ball.radius > computerPaddle.x &&
    ball.y > computerPaddle.y &&
    ball.y < computerPaddle.y + computerPaddle.height
  ) {
    ball.x = computerPaddle.x - ball.radius;
    applyPaddleBounce(computerPaddle);
    hitSound.currentTime = 0;
    hitSound.play();
    createParticles(ball.x, ball.y);
    rallyCount++;
    totalRallies++;
    rallyCountElem.textContent = rallyCount;
  }

  if (ball.x - ball.radius < 0) {
    missSound.currentTime = 0;
    missSound.play();
    updateScore(false);
  } else if (ball.x + ball.radius > canvas.width) {
    missSound.currentTime = 0;
    missSound.play();
    updateScore(true);
  }

  const aiCenter = computerPaddle.y + computerPaddle.height / 2;
  const delta = ball.y - aiCenter;
  const threshold = 10;

  if (Math.abs(delta) > threshold) {
    const direction = delta > 0 ? 1 : -1;
    if (Math.random() < aiMissChance) {
      computerPaddle.y -= direction * aiSpeed * 0.7;
    } else {
      computerPaddle.y += direction * aiSpeed;
    }
  }
  computerPaddle.y = Math.min(Math.max(computerPaddle.y, 0), canvas.height - computerPaddle.height);

  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
    return p.life > 0;
  })
}

function showDifficultyModal() {
  difficultyModal.classList.remove('hidden');
}

function hideDifficultyModal() {
  difficultyModal.classList.add('hidden');
}

function setDifficulty(level) {
  easySelect.classList.remove('active');
  normalSelect.classList.remove('active');
  hardSelect.classList.remove('active');

  if (level === 'easy') {
    aiMissChance = 0.35;
    aiSpeed = 5;
    baseBallSpeed = 4;
    maxBallSpeed = 8;
    currentDifficulty = 'Easy';
    easySelect.classList.add('active');
  } else if (level === 'hard') {
    aiMissChance = 0.15;
    aiSpeed = 8;
    baseBallSpeed = 5.5;
    maxBallSpeed = 11;
    currentDifficulty = 'Hard'
    hardSelect.classList.add('active');
  } else {
    aiMissChance = 0.25;
    aiSpeed = 6;
    baseBallSpeed = 5;
    maxBallSpeed = 9.5;
    currentDifficulty = 'Normal';
    normalSelect.classList.add('active');
  }
}

function updateScore(playerScored) {
  rallyCount = 0;
  rallyCountElem.textContent = rallyCount;
  if (playerScored) {
    playerScore++;
    playerScoreElem.textContent = playerScore;
  } else {
    computerScore++;
    computerScoreElem.textContent = computerScore;
  }

  shakeScreen(18);

  if (playerScore >= WINNING_SCORE) {
    winSound.currentTime = 0;
    winSound.play();
    showModal(true);
  } else if (computerScore >= WINNING_SCORE) {
    loseSound.currentTime = 0;
    loseSound.play();
    showModal(false);
  } else {
    startServe(playerScored);
  }
}

function resetGame() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isRunning = false;
  gameOver = false;

  playerScore = 0;
  computerScore = 0;
  playerScoreElem.textContent = playerScore;
  computerScoreElem.textContent = computerScore;

  playerPaddle.x = 0;
  playerPaddle.y = (canvas.height - paddleHeight) / 2;

  computerPaddle.x = canvas.width - paddleWidth;
  computerPaddle.y = (canvas.height - paddleHeight) / 2;

  startServe(true);

  startBtn.disabled = false;
  pauseBtn.disabled = true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNet();
  drawBall();
  drawPaddle(playerPaddle);
  drawPaddle(computerPaddle);

  ball.trail = [];
  particles = [];

  rallyCount = 0;
  rallyCountElem.textContent = rallyCount;
  maxRally = 0;
  totalRallies = 0;

  document.getElementById('newBestBadge').classList.add('hidden')
}

function resetBall(playerServe) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.trail = [];
  particles = [];
  ball.speedX = baseBallSpeed * (playerServe ? 1 : -1);
  ball.speedY = baseBallSpeed * (Math.random() * 2 - 1);
}

function startServe(playerServe) {
  isServing = true;
  resetBall(playerServe);

  let pulseScale = 1;
  let pulseDirection = 1;

  const pulseInterval = setInterval(() => {
    pulseScale += 0.02 * pulseDirection;
    if (pulseScale > 1.15) pulseDirection = -1;
    if (pulseScale < 1.0) pulseDirection = 1;
    ball.pulseScale = pulseScale;
  }, 16);

  serveTimerId = setTimeout(() => {
    isServing = false;
    ball.pulseScale = 1;
    clearInterval(pulseInterval);
  }, 450);
}

function drawNet() {
  ctx.save();
  ctx.strokeStyle = "#39ff14";
  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 6;
  ctx.setLineDash([25, 20]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.fillStyle = "#39ff14";
  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = 23;
  const r = ball.radius * (ball.pulseScale || 1);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPaddle(paddle) {
  ctx.save();
  ctx.fillStyle = paddle.color;
  ctx.shadowColor = paddle.color;
  ctx.shadowBlur = 18;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.restore();
}

function drawTrail() {
  ball.trail.forEach((pos, i) => {
    const alpha = i / ball.trail.length;
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = "#39ff14";
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 12 * alpha;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function createParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 20,
      size: Math.random() * 3 + 1,
      color: '#39ff14'
    });
  }
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / 20;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function shakeScreen(intensity) {
  shakeX = (Math.random() - 0.5) * intensity;
  shakeY = (Math.random() - 0.5) * intensity;
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function draw() {
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNet();
  drawTrail();
  drawBall();
  drawPaddle(playerPaddle);
  drawPaddle(computerPaddle);
  drawParticles();
  ctx.restore();
  shakeX *= 0.50;
  shakeY *= 0.50;
}

function drawShareCard() {
  const cardCanvas = document.getElementById('shareCardCanvas');
  const cctx = cardCanvas.getContext('2d');
  const w = cardCanvas.width;
  const h = cardCanvas.height;

  cctx.clearRect(0, 0, w, h);
  const gradient = cctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w / 1.2);
  gradient.addColorStop(0, '#000000');
  gradient.addColorStop(1, '#020f02');
  cctx.fillStyle = gradient;
  cctx.fillRect(0, 0, w, h);

  cctx.strokeStyle = '#39ff14';
  cctx.lineWidth = 8;
  cctx.shadowColor = '#39ff14';
  cctx.shadowBlur = 30;
  cctx.strokeRect(40.5, 40.5, w - 81, h - 81);

  cctx.shadowBlur = 0;
  cctx.textAlign = 'center';

  cctx.font = '42px "Share Tech Mono", monospace';
  cctx.fillStyle = '#39ff14'
  cctx.textAlign = 'center';
  cctx.fillText('Ping Pong', w / 2, 115);

  cctx.font = '42px "Share Tech Mono", monospace';
  cctx.fillStyle = '#39ff14';
  cctx.fillText(`My Score: ${playerScore}  |  AI: ${computerScore}`, w / 2, 170);

  cctx.font = '26px "Share Tech Mono", monospace';
  cctx.fillText(`highest Rally (current game): ${maxRally}`, w / 2, 215);
  cctx.fillText(`All time highest Rally: ${bestRallyEver}`, w / 2, 255);

  cctx.fillText(`Mode: ${currentDifficulty}`, w / 2, 295);

  if (maxRally === bestRallyEver && maxRally > 0) {
    cctx.font = '28px "Share Tech Mono", monospace';
    cctx.fillStyle = '#39ff14';
    cctx.shadowBlur = 25;
    cctx.fillText('NEW HIGHEST RALLY!', w / 2, 335);
    cctx.shadowBlur = 0;
  }

  cctx.font = '18px "Share Tech Mono", monospace';
  cctx.fillStyle = '#39ff14';
  cctx.textAlign = 'left';
  cctx.fillText('Made with ❤️ by Pulkit Singh', 60, h - 55);

  cctx.textAlign = 'right';
  cctx.fillText('github.com/itspulkitsingh', w - 60, h - 25);
}

function downloadShareCard() {
  drawShareCard();
  const cardCanvas = document.getElementById('shareCardCanvas');
  const link = document.createElement('a');
  link.download = 'ping-pong-score.png';
  link.href = cardCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (isDifficultyOpen()) return;
  if (!isRunning && !gameOver) {
    isRunning = true;
    animationId = requestAnimationFrame(gameLoop);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  }
}

function pauseGame() {
  if (isRunning) {
    isRunning = false;
    cancelAnimationFrame(animationId);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

function init() {
  resizeCanvas();

  ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speedX: 5,
    speedY: 5,
    glowColor: '#39ff14',
    trail: [],
    pulseScale: 1,
  };

  playerPaddle = {
    x: 0,
    y: (canvas.height - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: '#39ff14'
  };

  computerPaddle = {
    x: canvas.width - paddleWidth,
    y: (canvas.height - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: '#39ff14',
    speed: 6
  };

  window.addEventListener('resize', resizeCanvas);

  setupControls();
  setupKeyboardControls();

  setDifficulty('normal');
  easySelect.addEventListener("click", () => setDifficulty('easy'));
  normalSelect.addEventListener("click", () => setDifficulty('normal'));
  hardSelect.addEventListener("click", () => setDifficulty('hard'));

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", pauseGame);
  resetBtn.addEventListener("click", resetGame);
  document.getElementById('playAgainBtn').addEventListener("click", function () {
    hideModal();
    resetGame();
    showDifficultyModal();
  });

  easySelect.addEventListener("click", () => {
    setDifficulty('easy');
    hideDifficultyModal();
  });
  normalSelect.addEventListener("click", () => {
    setDifficulty('normal');
    hideDifficultyModal();
  });
  hardSelect.addEventListener("click", () => {
    setDifficulty('hard');
    hideDifficultyModal();
  })

  setDifficulty('normal');
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  gameOver = false;

  showDifficultyModal();

  bestRallyElem.textContent = `Best Rally Ever: ${bestRallyEver}`;

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    updateMuteState();
  })

  document.getElementById('downloadCardBtn').addEventListener('click', downloadShareCard);
}

window.addEventListener('load', init);
