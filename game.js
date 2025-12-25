(function () {
  function initGameScreen(root) {
    const difficultyModal = root.querySelector("#difficultyModal");
    const easySelect = root.querySelector("#easySelect");
    const normalSelect = root.querySelector("#normalSelect");
    const hardSelect = root.querySelector("#hardSelect");
    const roundsSelect = root.querySelector('#roundSelect');
    const rulesRoundsElem = root.querySelector('#ruleRounds');
    const rulesModeElem = root.querySelector('#rulesMode');
    const modeLabelElem = root.querySelector('#modeLabel');
    const difficultyStartBtn = root.querySelector('#difficultyStartBtn');
    const rallyHype = root.querySelector('#rallyHype');
    const rallyHypeText = root.querySelector('#rallyHypeText');

    const proTipTextElem = root.querySelector('#proTipText');

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
    const pausedOverlay = root.querySelector("#pausedOverlay");

    const guideDock = document.getElementById('guideDock');

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

    let winningScore = 5;
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

    function musicFadeDown() {
      if (window.NeonMusic && !isMuted) {
        window.NeonMusic.fadeDown();
      }
    }

    function musicFadeUp() {
      if (window.NeonMusic && !isMuted) {
        window.NeonMusic.fadeUp();
      }
    }

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
    let rallyHypeNext = 10;
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
    let hasStartedOnce = false;
    let countdownFrameId = null;

    function boostBallPulse(scale = 1.4, duration = 220) {
      if (!ball) return;
      ball.pulseScale = scale;
      setTimeout(() => {
        ball.pulseScale = 1;
      }, duration);
    }

    function showRallyHype() {
      if (!rallyHype || !rallyHypeText) return;
      let msg;
      if (rallyCount >= 10) {
        const idx = Math.floor(Math.random() * rallyHypeMessages.length);
        msg = rallyHypeMessages[idx];
      } else {
        msg = 'RALLY GETTING INTENSE!';
      }

      rallyHypeText.textContent = msg;

      rallyHype.classList.remove('hidden');
      rallyHypeText.classList.remove('rally-pop');
      void rallyHypeText.offsetWidth;
      rallyHypeText.classList.add('rally-pop');

      speakHypeMessage(msg);

      setTimeout(() => {
        if (!rallyHype) return;
        rallyHype.classList.add('hidden');
      }, 1000);
    }

    function speakHypeMessage(text) {
      if (!('speechSynthesis' in window)) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 0.9;
      utterance.volume = isMuted? 0 : 0.9;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

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
      const summaryBestRally = root.querySelector('#summarybestRally');

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
      if (guideDock) guideDock.classList.remove('hidden');
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

      canvas.addEventListener("click", () => {
        if (isDifficultyOpen()) return;
        if (isRunning) {
          pauseGame();
        } else if (!gameOver) {
          startGame();
        }
      });
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

        if (e.key === 'Escape') {
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
          if (!diffOpen && !isRunning && !gameOver) {
            resetGame();
          }
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
        if (rallyCount >= rallyHypeNext) {
          boostBallPulse(1.55, 260);
          showRallyHype();
          const gap = 5 + Math.floor(Math.random() * 7);
          rallyHypeNext = rallyCount + gap;
        }
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
        if (rallyCount >= rallyHypeNext) {
          boostBallPulse(1.55, 260);
          showRallyHype();
          const gap = 5 + Math.floor(Math.random() * 7);
          rallyHypeNext = rallyCount + gap;
        }
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
        aiSpeed = 5.2;
        baseBallSpeed = 5;
        maxBallSpeed = 9;
        currentDifficulty = 'Easy';
        easySelect.classList.add('active');
      } else if (level === 'hard') {
        aiMissChance = 0.01;
        aiSpeed = 9.8;
        baseBallSpeed = 6.5;
        maxBallSpeed = 14;
        currentDifficulty = 'Hard'
        hardSelect.classList.add('active');
      } else {
        aiMissChance = 0.2;
        aiSpeed = 7.1;
        baseBallSpeed = 5.4;
        maxBallSpeed = 10.8;
        currentDifficulty = 'Normal';
        normalSelect.classList.add('active');
      }
      updateRulesLine();
      updateModeLabel();
    }

    function updateRulesLine() {
      if (!rulesRoundsElem || !rulesModeElem) return;
      rulesRoundsElem.textContent = winningScore;
      rulesModeElem.textContent = currentDifficulty.toUpperCase();
    }

    function updateModeLabel() {
      if (!modeLabelElem) return;
      modeLabelElem.textContent = `MODE: ${currentDifficulty.toUpperCase()} • FIRST TO REACH ${winningScore} IS THE WINNER`;
    }

    const rallyHypeMessages = [
      'INTENSE!',
      'CRAZY!',
      'SWEET!',
      'THAT\'S GOOD',
      'WHAT A RALLY!',
      'UNREAL!',
      'YOU ARE ON FIRE!',
      'THIS IS HEATING UP!'
    ];

    const proTips = [
      'Mouse, touch, W/S keys, or "UP & DOWN ARROWS" keys all move your paddle',
      'Space, Esc, Click (on Game canvas), or the buttons all pause & resume',
      'Press R to hard reset and re-select difficulty mode and No. of rounds',
      'Use the "HELP?" button for a breakdown of every feature.',
      'Mute button silences all the game SFX without touching the Music player, so that you can Have your smooth music experience while playing this game!',
      'Download your game score card at the end of your game, which you can share with your friends and even set it as a memory',
      'Longer rallies speed up the ball and make angles more extreme',
      'Hitting near paddle edges creates sharper bounce angles!',
      'The original arcade game Pong came out in 1972 and helped kick-start the entire video game industry',
      'Early Pong machines sometimes broke simply because their coin boxes were overflowing with quarters',
      'In a famous table tennis record, a father and son hit the ball 32,000 times in a single rally!',
      'Pong was originally built as a project and became so popular it defined arcade gaming for years',
      'People have told Pong game creator that they met their future spouses while playing the arcade game',
      'Most real world table tennis rallies last only a few shots, so hitting 20+ in this game is already elite',
      'In some countries, table tennis once got banned briefly over fears that it would harm eyesight and nerves',
      'Pros can put up to 9000 RPM of spin on a spin on a table tennis ball, making it curve and kick like crazy'
    ];

    let proTipIndex = 0;
    let proTipCharIndex = 0;
    let proTipDeleting = false;
    let proTipTimerId = null;

    function startProTipLoop() {
      if (!proTipTextElem) return;
      if (proTipTimerId) return;

      function step() {
        const full = proTips[proTipIndex];

        if (!proTipDeleting) {
          proTipCharIndex++;
          proTipTextElem.textContent = full.slice(0, proTipCharIndex);

          if (proTipCharIndex >= full.length) {
            proTipDeleting = true;
            proTipTimerId = setTimeout(step, 5000);
            return;
          }
        } else {
          proTipCharIndex--;
          proTipTextElem.textContent = full.slice(0, Math.max(proTipCharIndex, 0));

          if (proTipCharIndex <= 0) {
            proTipDeleting = false;
            proTipIndex = (proTipIndex + 1) % proTips.length;
            proTipTimerId = setTimeout(step, 450);
            return;
          }
        }

        const speed = proTipDeleting ? 35 : 45;
        proTipTimerId = setTimeout(step, speed);
      }

      if (proTipTimerId) {
        clearTimeout(proTipTimerId);
        proTipTimerId = null;
      }

      proTipCharIndex = 0;
      proTipDeleting = false;
      proTipIndex = 0;
      proTipTimerId = setTimeout(step, 700);
    }

    function updateScore(playerScored) {
      rallyCount = 0;
      rallyCountElem.textContent = rallyCount;
      rallyHypeNext = 10;
      if (playerScored) {
        playerScore++;
        playerScoreElem.textContent = playerScore;
      } else {
        computerScore++;
        computerScoreElem.textContent = computerScore;
      }

      shakeScreen(18);

      if (playerScore >= winningScore) {
        winSound.currentTime = 0;
        winSound.play();
        showModal(true);
      } else if (computerScore >= winningScore) {
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

      hasStartedOnce = false;

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
      rallyHypeNext = 10;

      root.querySelector('#newBestBadge').classList.add('hidden');

      if (pausedOverlay) pausedOverlay.classList.add('hidden');

      winningScore = 5;
      if (roundsSelect) roundsSelect.value = '5';

      updateRulesLine();
      updateModeLabel();

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

      if (guideDock) guideDock.classList.remove('hidden');
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
            startProTipLoop();
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

      const gradient = cctx.createRadialGradient(
        w / 2, h / 2, 40,
        w / 2, h / 2, w / 1.4
      );
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#020802');
      cctx.fillStyle = gradient;
      cctx.fillRect(0, 0, w, h);

      const particleCount = 85;
      for (let i = 0; i < particleCount; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const pr = Math.random() * 2.2 + 0.8;
        const alpha = Math.random() * 0.35 + 0.15;

        cctx.save();
        cctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
        cctx.shadowColor = '#39ff14';
        cctx.shadowBlur = 10;
        cctx.beginPath();
        cctx.arc(px, py, pr, 0, Math.PI * 2);
        cctx.fill();
        cctx.restore();
      }

      cctx.save();
      cctx.strokeStyle = '#39ff14';
      cctx.lineWidth = 6;
      cctx.shadowColor = '#39ff14';
      cctx.shadowBlur = 26;
      cctx.strokeRect(32.5, 32.5, w - 65, h - 65);
      cctx.restore();

      cctx.save();
      cctx.textAlign = 'center';
      cctx.fillStyle = '#39ff14';
      cctx.shadowColor = '#39ff14';
      cctx.shadowBlur = 22;
      cctx.font = '30px "Share Tech Mono", monospace';
      const scoreLine = `YOU: ${playerScore}   |   AI: ${computerScore}`;
      cctx.fillText(scoreLine, w / 2, 145);
      cctx.restore();

      cctx.save();
      cctx.strokeStyle = 'rgba(57, 255, 20, 0.9)';
      cctx.lineWidth = 2;
      cctx.shadowColor = '#39ff14';
      cctx.shadowBlur = 14;
      cctx.beginPath();
      cctx.moveTo(70, 170);
      cctx.lineTo(w - 70, 170);
      cctx.stroke();
      cctx.restore();

      cctx.save();
      const cardY = 200;
      const cardH = 150;
      const cardX = 70;
      const cardW = w - cardX * 2;

      function roundRectPath(ctx, x, y, w2, h2, r) {
        const rr = Math.min(r, w2 / 2, h2 / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w2 - rr, y);
        ctx.quadraticCurveTo(x + w2, y, x + w2, y + rr);
        ctx.lineTo(x + w2, y + h2 - rr);
        ctx.quadraticCurveTo(x + w2, y + h2, x + w2 - rr, y + h2);
        ctx.lineTo(x + rr, y + h2);
        ctx.quadraticCurveTo(x, y + h2, x, y + h2 - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
      }

      cctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      cctx.strokeStyle = 'rgba(57, 255, 20, 0.85)';
      cctx.lineWidth = 2;
      cctx.shadowColor = '#39ff14';
      cctx.shadowBlur = 18;

      roundRectPath(cctx, cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1, 18);
      cctx.fill();
      cctx.stroke();
      cctx.shadowBlur = 0;

      cctx.fillStyle = '#39ff14';
      cctx.textAlign = 'center';

      const isVictory = playerScore > computerScore;
      cctx.font = '26px "Share Tech Mono", monospace';
      cctx.fillStyle = isVictory ? '#39ff14' : '#ff4444';
      cctx.shadowColor = cctx.fillStyle;
      cctx.shadowBlur = 18;
      cctx.fillText(isVictory ? 'VICTORY' : 'DEFEAT', w / 2, cardY + 32);
      cctx.shadowBlur = 0;

      cctx.fillStyle = '#39ff14';
      cctx.font = '20px "Share Tech Mono", monospace';
      cctx.fillText(`TOTAL RALLIES: ${totalRallies}`, w / 2, cardY + 60);
      cctx.fillText(`LONGEST RALLY PLAYED: ${maxRally}`, w / 2, cardY + 85);
      cctx.fillText(`MODE: ${currentDifficulty.toUpperCase()}`, w / 2, cardY + 110);
      cctx.fillText(`TOTAL ROUNDS: ${winningScore}`, w / 2, cardY + 135);

      cctx.restore();
      cctx.save();
      cctx.font = '18px "Share Tech Mono", monospace';
      cctx.fillStyle = '#39ff14';
      cctx.textAlign = 'left';
      cctx.fillText('Made with ♥ by Pulkit Singh', 40, h - 40);

      cctx.textAlign = 'right';
      cctx.fillText('github.com/itspulkitsingh', w - 40, h - 18);
      cctx.restore();
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

      const isFreshStart = !isRunning && !gameOver && !hasStartedOnce && playerScore === 0 && computerScore === 0;

      if (!isRunning && !gameOver) {
        isRunning = true;
        lastTime = null;
        musicFadeUp();
        lockBackButton();

        if (backBtn) backBtn.classList.add('hidden');

        if (isFreshStart) {
          hasStartedOnce = true;
          startServe(true);
        } else {
          isServing = false;
        }

        if (pausedOverlay) pausedOverlay.classList.add('hidden');

        animationId = requestAnimationFrame(gameLoop);

        startBtn.disabled = true;
        startBtn.classList.add('hidden');

        pauseBtn.disabled = false;
        pauseBtn.classList.remove('hidden');

        resetBtn.disabled = true;
        resetBtn.classList.add('hidden');

        if (guideDock) guideDock.classList.add('hidden');
      }
    }

    function pauseGame() {
      if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animationId);

        musicFadeDown();

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

        if (pausedOverlay) pausedOverlay.classList.remove('hidden');
        if (guideDock) guideDock.classList.remove('hidden');
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
      updateRulesLine();
      updateModeLabel();
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
      });
      normalSelect.addEventListener("click", () => {
        setDifficulty('normal');
      });
      hardSelect.addEventListener("click", () => {
        setDifficulty('hard');
      })

      if (roundsSelect) {
        winningScore = Number(roundsSelect.value) || 5;

        roundsSelect.addEventListener('change', () => {
          const val = Number(roundsSelect.value);
          if (Number.isFinite(val) && val >= 3 && val <= 15) {
            winningScore = val;
          } else {
            winningScore = 5;
            roundsSelect.value = '5';
          }
          updateRulesLine();
          updateModeLabel();
        });
      }

      if (difficultyStartBtn) {
        difficultyStartBtn.addEventListener('click', () => {
          hideDifficultyModal();
          startGame();
        });
      }

      startBtn.disabled = false;
      pauseBtn.disabled = true;
      pauseBtn.classList.add('hidden');
      resetBtn.disabled = true;
      resetBtn.classList.add('hidden');
      gameOver = false;

      showDifficultyModal();

      bestRallyElem.textContent = `LONGEST RALLY: ${bestRallyEver}`;

      muteBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        updateMuteState();
      })

      root.querySelector('#downloadCardBtn').addEventListener('click', downloadShareCard);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (isRunning) {
            pauseGame();
          } else if (!isRunning && !gameOver) {
            if (window.NeonMusic && !isMuted) {
              window.NeonMusic.fadeDown();
            }
          }
        } else {
          if (window.NeonMusic && !isMuted && !isRunning && !gameOver) {
            window.NeonMusic.fadeUp();
          }
        }
      });

      unlockBackButton();
    }

    init();
  }

  window.initGameScreen = initGameScreen;
})();