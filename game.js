(function () {
  function initGameScreen(root) {
    const difficultyModal = root.querySelector("#difficultyModal");
    const easySelect = root.querySelector("#easySelect");
    const normalSelect = root.querySelector("#normalSelect");
    const hardSelect = root.querySelector("#hardSelect");

    const canvas = root.querySelector("#gameCanvas");
    const ctx = canvas.getContext("2d");

    const playerScoreElem = root.querySelector("#playerScore");
    const computerScoreElem = root.querySelector("#computerScore");
    const startBtn = root.querySelector("#startBtn");
    const pauseBtn = root.querySelector("#pauseBtn");
    const resetBtn = root.querySelector("#resetBtn");

    const backBtn = root.querySelector("#backBtn");

    const countdownModal = root.querySelector("#countdownModal");
    const countdownText = root.querySelector("#countdownText");

    function lockBackButton() {
      if (!backBtn) return;
      backBtn.disabled = true;
      backBtn.classList.add('disabled');
    }

    function unlockBackButton() {
      if (!backBtn) return;
      backBtn.disabled = false;
      backBtn.classList.remove('disabled');
    }

    const WINNING_SCORE = 5;
    const paddleHeight = 90;
    const paddleWidth = 12;

    const hitSound = new Audio('./audio/hit.wav');
    hitSound.volume = 0.4;
    const missSound = new Audio('./audio/miss.wav');
    missSound.volume = 0.4;
    const winSound = new Audio('./audio/win.wav');
    winSound.volume = 0.5;
    const loseSound = new Audio('./audio/lose.wav');
    loseSound.volume = 0.5;

    const countdownBeep = new Audio('./audio/countdown-beep.mp3');
    countdownBeep.volume = 0.5;

    const muteBtn = root.querySelector("#muteBtn");
    let isMuted = false;

    let animationId = null;
    let isRunning = false;
    let gameOver = false;
    let lastTime = null;
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
    const rallyCountElem = root.querySelector("#rallyCount");
    let bestRallyEverRaw = localStorage.getItem('bestRallyEver');
    let bestRallyEver = bestRallyEverRaw ? Number(bestRallyEverRaw) : 0;
    if (Number.isNaN(bestRallyEver)) bestRallyEver = 0;
    const bestRallyElem = root.querySelector("#bestRallyEver");
    let totalRallies = 0;

    let aiMissChance = 0.3;
    let aiSpeed = 6;
    let currentDifficulty = 'Normal';

    let baseBallSpeed = 5;
    let maxBallSpeed = 10;

    let isServing = false;
    let serveTimerId = null;

    let countdownFrameId = null;

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
      const modal = root.querySelector('#gameOverModal');
      const title = root.querySelector('#modalTitle');
      const modalDifficulty = root.querySelector('#modalDifficulty');
      const newBestBadge = root.querySelector('#newBestBadge');

      const matchSummary = root.querySelector('#matchSummary');
      const summaryResult = root.querySelector('#summaryResult');
      const summaryScore = root.querySelector('#summaryScore');
      const summaryRallies = root.querySelector('#summaryRallies');
      const summaryMode = root.querySelector('#modalDifficulty');
      const summaryBestRally = root.querySelector('#bestRallyEver');

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
      unlockBackButton();
    }

    function hideModal() {
      root.querySelector('#gameOverModal').classList.add('hidden');
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
      hitSound.muted = isMuted;
      missSound.muted = isMuted;
      winSound.muted = isMuted;
      loseSound.muted = isMuted;
      countdownBeep.muted = isMuted;
      muteBtn.textContent = isMuted ? "🔇" : "🔊";
    }

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

    function update(delta) {
      if (gameOver) return;

      if (isServing) {
        return;
      }

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > MAX_TRAIL) ball.trail.shift();

      let speedScale = delta * 60;
      if (!Number.isFinite(speedScale) || speedScale <= 0) speedScale = 1;
      if (speedScale > 3) speedScale = 3;

      ball.x += ball.speedX * speedScale;
      ball.y += ball.speedY * speedScale;

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
      const aiDelta = ball.y - aiCenter;
      const threshold = 10;

      if (Math.abs(aiDelta) > threshold) {
        const direction = aiDelta > 0 ? 1 : -1;
        const move = aiSpeed * (delta * 60);
        if (Math.random() < aiMissChance) {
          computerPaddle.y -= direction * move * 0.7;
        } else {
          computerPaddle.y += direction * move;
        }
      }
      computerPaddle.y = Math.min(Math.max(computerPaddle.y, 0), canvas.height - computerPaddle.height);

      particles = particles.filter(p => {
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;
        p.vy += 0.2 * speedScale;
        p.life -= speedScale;
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
        aiMissChance = 0.3;
        aiSpeed = 6;
        baseBallSpeed = 5;
        maxBallSpeed = 9.5;
        currentDifficulty = 'Easy';
        easySelect.classList.add('active');
      } else if (level === 'hard') {
        aiMissChance = 0.10;
        aiSpeed = 9;
        baseBallSpeed = 6;
        maxBallSpeed = 12.5;
        currentDifficulty = 'Hard'
        hardSelect.classList.add('active');
      } else {
        aiMissChance = 0.20;
        aiSpeed = 7.5;
        baseBallSpeed = 5.5;
        maxBallSpeed = 11;
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
        isServing = false;
        resetBall(playerScored);
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

      isServing = false;
      resetBall(true);

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

      root.querySelector('#newBestBadge').classList.add('hidden');

      showDifficultyModal();

      startBtn.textContent = 'Start';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      pauseBtn.classList.add('hidden');

      resetBtn.disabled = true;
      resetBtn.classList.add('hidden');

      unlockBackButton();
      if (backBtn) {
        backBtn.textContent = 'Back';
        backBtn.classList.remove('hidden');
      }
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

      countdownModal.classList.remove('hidden');
      countdownText.textContent = '3';

      if (countdownFrameId) {
        cancelAnimationFrame(countdownFrameId);
        countdownFrameId = null;
      }

      const T3 = 0;
      const T2 = 1000;
      const T1 = 2000;
      const T0 = 3000;
      const TGO = 3800;
      const THIDE = 4300;

      const startTime = performance.now();
      let goShown = false;

      countdownBeep.currentTime = 0;
      countdownBeep.pause();
      if (!isMuted) {
        countdownBeep.play().catch(() => { });
      }

      function updateCountdown() {
        const elapsed = performance.now() - startTime;

        if (!goShown && elapsed >= TGO) {
          countdownText.textContent = 'GO!';
          goShown = true;

          setTimeout(() => {
            countdownModal.classList.add('hidden');
            isServing = false;
          }, THIDE - TGO);

          countdownFrameId = null;
          return;
        } else if (elapsed >= T0) {
          countdownText.textContent = '0';
        } else if (elapsed >= T1) {
          countdownText.textContent = '1';
        } else if (elapsed >= T2) {
          countdownText.textContent = '2';
        } else {
          countdownText.textContent = '3';
        }

        countdownFrameId = requestAnimationFrame(updateCountdown);
      }

      countdownFrameId = requestAnimationFrame(updateCountdown);
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
      const cardCanvas = root.querySelector('#shareCardCanvas');
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
      const cardCanvas = root.querySelector('#shareCardCanvas');
      const link = document.createElement('a');
      link.download = 'ping-pong-score.png';
      link.href = cardCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function gameLoop(timestamp) {
      if (!isRunning) return;

      if (lastTime === null) {
        lastTime = timestamp;
      }
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      update(delta);
      draw();
      animationId = requestAnimationFrame(gameLoop);
    }


    function startGame() {
      if (isDifficultyOpen()) return;

      const isFreshStart = !isRunning && !gameOver && playerScore === 0 && computerScore === 0;

      if (!isRunning && !gameOver) {
        isRunning = true;
        lastTime = null;
        lockBackButton();
        if (backBtn) backBtn.classList.add('hidden');

        if (isFreshStart) {
          startServe(true);
        } else {
          isServing = false;
        }

        animationId = requestAnimationFrame(gameLoop);

        startBtn.disabled = true;
        startBtn.classList.add('hidden');

        pauseBtn.disabled = false;
        pauseBtn.classList.remove('hidden');

        resetBtn.disabled = true;
        resetBtn.classList.add('hidden');
      }
    }

    function pauseGame() {
      if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animationId);

        startBtn.textContent = 'Resume';
        startBtn.disabled = false;
        startBtn.classList.remove('hidden');

        pauseBtn.disabled = true;
        pauseBtn.classList.add('hidden');

        resetBtn.disabled = false;
        resetBtn.classList.remove('hidden');

        if (backBtn) {
          unlockBackButton();
          backBtn.textContent = 'BACK';
          backBtn.classList.remove('hidden');
        }
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
      root.querySelector('#playAgainBtn').addEventListener("click", function () {
        hideModal();
        resetGame();
        showDifficultyModal();
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
        startBtn.classList.remove('hidden');
      });

      const modalBackBtn = root.querySelector('#modalBackBtn');

      if (modalBackBtn && backBtn) {
        modalBackBtn.addEventListener('click', () => {
          hideModal();
          unlockBackButton();
          backBtn.click();
        })
      }

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
      pauseBtn.classList.add('hidden');
      resetBtn.disabled = true;
      resetBtn.classList.add('hidden');
      gameOver = false;

      showDifficultyModal();

      bestRallyElem.textContent = `Best Rally Ever: ${bestRallyEver}`;

      muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        updateMuteState();
      })

      root.querySelector('#downloadCardBtn').addEventListener('click', downloadShareCard);

      unlockBackButton();
    }

    init();
  }

  window.initGameScreen = initGameScreen;
})();