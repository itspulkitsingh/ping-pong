(function () {
    const guideData = {
        welcome: `
        <h3> 🌟 WELCOME FEATURES 🌟 </h3>
        <div class="guide-section">
        <strong>NEON PAGE LOADER</strong><br>
        Pulsing Rings → fade → Reveals Game (2s animation)
        </div>
        <div class="guide-section">
        <strong>ANIMATED BACKGROUND</strong><br>
        Moving Neon Particles in the Background.
        </div>
        <div class="guide-section">
        <strong>CUSTOM NEON CURSOR</strong><br>
        Game Themed, custom cursor design
        </div>
        `,
        controls: `
        <h3> 🎮 GAME CONTROLS 🎮 </h3>
        <ul style="text-align: left; color: #ccc;">
        <li><strong>Mouse / Touch / KEYBOARD: ↑↓ or W,S key : </strong> MOVE PADDLE </li>
        <li><strong>Space / Esc / Mouse click / Start or Resume & Pause Button : </strong> PAUSE/RESUME </li>
        <li><strong> R / Reset Button : </strong> RESET GAME </li>
        <li><strong> Enter : </strong> START (first time only) </li>
        </ul>
        `,
        smartFeatures: `
        <h3> 🧠 SMART FEATURES 🧠 </h3>
        <div class="guide-section">
        <strong>TAB AWAY / INACTIVE → AUTO PAUSE</strong><br>
        Hide tab in between of on-going game? Game Pauses + music's volume ↓ (if the music was playing)<br>
        Return? Music restores to it's original volume on start (game stays paused until resumed too) 
        </div>
        <div class="guide-section">
        <strong>GAME START COUNTDOWN</strong><br>
        3 → 2 → 1 → 0 → GO! (on fresh game starts with a synced timer audio)
        </div>
        <div class="guide-section">
        <strong>RESPONSIVENESS</strong><br>
        Almost scales perfectly: Desktop → Tablet → Mobile
        </div>
        <div class="guide-section">
        <strong>CUSTOM SCROLLBAR</strong><br>
        Custom scrollbar if the content doesn't fits properly in ur screen (optional: zoom out if u want a better experience on laptop/desktop)
        </div>
        <div class="guide-section">
        <strong>RALLY HYPE & CHEERUP!</strong><br>
        Once rallies get long, the ball sometimes pulses while neon words like “INTENSE!” or “SWEET!” flash on screen, often spoken out loud in an arcade-style voice for extra hype.
        </div>
        <div class="guide-section">
        <strong>LIVE TIPS:</strong><br>
        The "Did You Know?" line at the bottom cycles through controls, strategy tips, and fun trivia about Pong and real ping pong records while you play
        </div>
        `,
        musicSystem: `
        <h3> 🎵 CREATIVE MUSIC PLAYER 🎵 </h3>
        <div class="guide-section">
        <strong> SEQUENTIAL NCS TRACKS</strong><br>
        Auto-plays full NCS playlist → Loops the track once finished
        </div>
        <div class="guide-section">
        <strong> FULLY DRAGGABLE </strong><br>
        Drag the music player anywhere!
        </div>
        <div class="guide-section">
        <strong> LOOP & PLAYER FEATURES</strong><br>
        • Tap on ⏩ to skip 10s forward, double tap to switch to the next song<br>
        • Tap on ⏪ to rewind 10s backward, double tap to switch to start of the song, double tap at the begginning of the song to go back to the previously played song 
        </div>
        <div class="guide-section">
        <strong>NEON VISUALIZER</strong><br>
        Multi-wave visualizer reacts to the music for extra soothing cool vibe, every wave syncs with wave in a flow
        </div>
        <div class="guide-section">
        <strong>GAME AWARE VOLUME</strong><br>
        Game pause / resume can softly switch music down or up so it never feels too loud during breaks.
        </div>
        `,
        modes: `
        <h3> ⚡ 4 GAME MODES (COMING SOON!!) ⚡ </h3>
        <div class="guide-section">
        <strong> V/S COMPUTER</strong><br>
        Classic Ping Pong v/s computer (EASY/NORMAL/HARD)
        </div>
        <div class="guide-section">
        <strong>SINGLE PLAYER (Coming Soon...)</strong><br>
        Survival mode! Keep the ball away from the walls
        </div>
        <div class="guide-section">
        <strong>RANDOM MATCH (Coming Soon...)</strong><br>
        You v/s random online players
        </div>
        <div class="guide-section">
        <strong>CUSTOM ROOM (Coming soon...)</strong><br>
        Create a room with custom no. of rounds → share code with ur friend → Enter the code to join
        </div>
        `,
        statsAndShare: `
        <h3> 📊 STATS & SHARE 📊 </h3>
        <div class="guide-section">
        <strong>LIVE TRACKING</strong><br>
        Score, Rallies, Best Rally (persists!)
        </div>
        <div class="guide-section">
        <strong>ROUNDS & MODE</strong><br>
        Total rounds selector + difficulty mode labels so you always know the rules of the match.
        </div>
        <div class="guide-section">
        <strong>CUSTOM DOWNLOAD CARDS</strong><br>
        Mode-Specific Neon score card (DOWNLOADABLE!!)
        </div>
        `,
        proTips: `
        <h3> ⭐ PRO TIPS ⭐ </h3>
        <ul style="text-align: left; color: #ccc;">
        <li>Best rallies auto save across sessions</li>
        <li>Music continues between modes</li>
        <li>Pause Overlay shows Resume/Reset buttons clearly</li>
        <li>in V/S computer mode, the ball keeps getting faster the more u hit and additionally the more the ball hits the paddle at a distance from it's center, the more the angle it creates to bounceback</li>
        </ul>
        `,
        credits: `
        <h3> ❤️ CREDITS ❤️ </h3>
        <div style="color: #39ff14; font-size: 1.1rem;">
        Made with ♥ by <a href="https://github.com/itspulkitsingh" target="_blank" style="color:#39ff14;">Pulkit Singh</a><br>
        Songs by <a href="https://ncs.io/" target="_blank" style="color: #39ff14;">NCS</a> (<a href="https://github.com/itspulkitsingh/ping-pong/blob/main/credits.txt" target="_blank" style="color: #39ff14;">CREDITS HERE</a>)
        </div>
        `
    };

    function initGuide() {
        const guideBtn = document.getElementById('guideBtn');
        const guideModal = document.getElementById('guideModal');
        const guideContentInner = document.getElementById('guideContent');
        const guideContent = guideContentInner.parentElement;

        if (!guideBtn) return;

        guideContentInner.innerHTML = `${guideData.welcome} ${guideData.controls} ${guideData.smartFeatures} ${guideData.musicSystem} ${guideData.modes} ${guideData.statsAndShare} ${guideData.proTips} ${guideData.credits}`;

        function openGuide() {
            guideModal.classList.remove('hidden');
            guideBtn.textContent = 'BACK';

            guideContent.classList.remove('anim-out');
            void guideContent.offsetWidth;
            guideContent.classList.add('anim-in');
        }

        function closeGuide() {
            guideBtn.textContent = 'HELP?';

            guideContent.classList.remove('anim-in');
            guideContent.classList.add('anim-out');

            guideContent.addEventListener('animationend', function handler(e) {
                if (e.animationName === 'guidePopOut') {
                    guideModal.classList.add('hidden');
                    guideContent.removeEventListener('animationend', handler);
                }
            });
        }

        guideBtn.addEventListener('click', () => {
            const isOpen = !guideModal.classList.contains('hidden');
            if (isOpen) closeGuide(); else openGuide();
        });

        document.addEventListener('keydown', (e) => {
            if (guideModal.classList.contains('hidden')) return;
            if (e.key === 'Escape' || e.key === ' ') {
                e.preventDefault();
                closeGuide();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGuide);
    } else {
        initGuide();
    }

    window.initGuide = initGuide;
})();