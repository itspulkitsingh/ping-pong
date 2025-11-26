const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerScoreElem = document.getElementById("playerScore");
const computerScoreElem = document.getElementById("computerScore");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const WINNING_SCORE = 10;
let animationId = null;
let isRunning = false;
let gameOver = false;
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  speedX: 5,
  speedY: 5,
  glowColor: '#39ff14',
};
const paddleWidth = 12;
const paddleHeight = 90;
const playerPaddle = {
  x: 0,
  y: (canvas.height - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#39ff14',
};
const computerPaddle = {
  x: canvas.width - paddleWidth,
  y: (canvas.height - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  color: '#39ff14',
  speed: 6,
};
let playerScore = 0;
let computerScore = 0;
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
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
function update() {
  if (gameOver) return;
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
    ball.speedX = -ball.speedX * 1.05;
    ball.speedY *= 1.05;
  }
  if (
    ball.x + ball.radius > computerPaddle.x &&
    ball.y > computerPaddle.y &&
    ball.y < computerPaddle.y + computerPaddle.height
  ) {
    ball.x = computerPaddle.x - ball.radius;
    ball.speedX = -ball.speedX * 1.05;
    ball.speedY *= 1.05;
  }
  if (ball.x - ball.radius < 0) {
    updateScore(false);
  } else if (ball.x + ball.radius > canvas.width) {
    updateScore(true);
  }
  const aiCenter = computerPaddle.y + computerPaddle.height / 2;
  const delta = ball.y - aiCenter;
  const threshold = 10;
  const missChance = 0.4;
  if (Math.abs(delta) > threshold) {
    const direction = delta > 0 ? 1 : -1;
    if (Math.random() < missChance) {
      computerPaddle.y -= direction * computerPaddle.speed;
    } else {
      computerPaddle.y += direction * computerPaddle.speed;
    }
  }
  computerPaddle.y = Math.min(Math.max(computerPaddle.y, 0), canvas.height - computerPaddle.height);
}
function updateScore(playerScored) {
  if (playerScored) {
    playerScore++;
    playerScoreElem.textContent = playerScore;
  } else {
    computerScore++;
    computerScoreElem.textContent = computerScore;
  }
  if (playerScore >= WINNING_SCORE) {
    alert("Congratulations! You won!");
    resetGame();
  } else if (computerScore >= WINNING_SCORE) {
    alert("Computer won! Try again.");
    resetGame();
  } else {
    resetBall(playerScored);
  }
}
function resetGame() {
  playerScore = 0;
  computerScore = 0;
  playerScoreElem.textContent = playerScore;
  computerScoreElem.textContent = computerScore;
  resetBall(true);
  gameOver = false;
  pauseGame();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}
function resetBall(playerServe) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.speedX = 5 * (playerServe ? 1 : -1);
  ball.speedY = 5 * (Math.random() * 2 - 1);
}
function drawNet() {
  ctx.save();
  ctx.strokeStyle = "#39ff14";
  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 6;
  ctx.setLineDash([25, 20]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();
  ctx.restore();
}
function drawBall() {
  ctx.save();
  ctx.fillStyle = "#39ff14";
  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = 23;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
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
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNet();
  drawBall();
  drawPaddle(playerPaddle);
  drawPaddle(computerPaddle);
}
function gameLoop() {
  update();
  draw();
  animationId = requestAnimationFrame(gameLoop);
}
function startGame() {
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
playerScoreElem.textContent = playerScore;
computerScoreElem.textContent = computerScore;
resetBall(true);
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resetBtn.addEventListener("click", resetGame);
document.getElementById("backBtn").onclick = function() {
  window.location.href = "index.html";
};

