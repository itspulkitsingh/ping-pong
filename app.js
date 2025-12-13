(function () {
  const screenRoot = document.getElementById('screenRoot');
  const originalWelcomeHTML = screenRoot.innerHTML;

  async function loadGameScreen() {
    if (screenRoot.querySelector('#gameScreen')) return;

    const res = await fetch('./game-fragment.html');
    if (!res.ok) {
      console.error('Failed to load game-fragment.html');
      return;
    }
    const html = await res.text();
    screenRoot.innerHTML = html;

    const gameScreen = screenRoot.querySelector('#gameScreen');

    if (window.initGameScreen && gameScreen) {
      window.initGameScreen(gameScreen);
    }

    if (window.VanillaTilt && gameScreen) {
      VanillaTilt.init(gameScreen.querySelectorAll('.tilt'), {
        max: 10,
        speed: 400
      });
    }

    // animate game screen in
    gameScreen.classList.add('screen-slide-in');

    const backBtn = screenRoot.querySelector('#backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // animate game screen out
        gameScreen.classList.remove('screen-slide-in');
        gameScreen.classList.add('screen-slide-out');

        gameScreen.addEventListener(
          'animationend',
          () => {
            screenRoot.innerHTML = originalWelcomeHTML;
            wireWelcome();
            const welcome = screenRoot.querySelector('#welcomeScreen');
            if (welcome) {
              welcome.classList.add('screen-slide-in');
            }
          },
          { once: true }
        );
      });
    }
  }

  function wireWelcome() {
    const enterBtn = document.getElementById('enterGameBtn');
    if (!enterBtn) return;
    enterBtn.addEventListener('click', () => {
      const welcome = document.getElementById('welcomeScreen');
      if (welcome) {
        welcome.classList.remove('screen-slide-in');
        welcome.classList.add('screen-slide-out');
        welcome.addEventListener(
          'animationend',
          () => {
            loadGameScreen();
          },
          { once: true }
        );
      } else {
        loadGameScreen();
      }
    });
  }

  wireWelcome();
})();