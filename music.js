(function () {
    const songs = [
        "./music/0.mp3",
        "./music/1.mp3",
        "./music/2.mp3",
        "./music/3.mp3",
        "./music/4.mp3",
        "./music/5.mp3",
        "./music/6.mp3",
        "./music/7.mp3",
        "./music/8.mp3",
        "./music/9.mp3",
        "./music/10.mp3",
        "./music/11.mp3"
    ];
    let currentSongIndex = 0;

    const playBtn = document.getElementById('musicPlay');
    const mainIcon = document.getElementById('musicMainIcon');
    const restartBtn = document.getElementById('musicRestart');
    const loopBtn = document.getElementById('musicLoop');
    const playerBar = document.getElementById('musicDock');
    const svg = document.getElementById('musicWaveBg');
    const audio = document.getElementById('musicAudio');

    if (!playBtn || !audio) return;

    const savedState = sessionStorage.getItem('musicState');
    let isPlaying = false;
    if (savedState) {
        const st = JSON.parse(savedState);
        currentSongIndex = st.index || 0;
        audio.currentTime = st.time || 0;
        isPlaying = !!st.playing;
    }

    let audioCtx, analyser, sourceNode, freqArray;
    const WIDTH = 340, HEIGHT = 80, BASE_Y = 40, WAVES = 3, POINTS = 42;
    const WAVE_COLOR = "#39ff14";

    function saveState() {
        sessionStorage.setItem('musicState', JSON.stringify({
            index: currentSongIndex,
            time: audio.currentTime,
            playing: isPlaying
        }));
    }

    function setIcon(state) {
        if (state === "play") {
            mainIcon.innerHTML = `<polygon points="13,10 22,16 13,22"/>`;
        } else {
            mainIcon.innerHTML =
                `<rect x="12" y="10" width="2.8" height="12" rx="1.4"/>
         <rect x="17" y="10" width="2.8" height="12" rx="1.4"/>`;
        }
    }

    function setupWebAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioCtx.createMediaElementSource(audio);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            freqArray = new Uint8Array(analyser.frequencyBinCount);
            sourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function loadCurrentSong() {
        audio.src = songs[currentSongIndex];
    }

    function playSong() {
        setupWebAudio();
        loadCurrentSong();
        audio.loop = false;
        audio.play();
        isPlaying = true;
        playBtn.classList.add('playing');
        setIcon('pause');
        saveState();
    }

    function playRandomNext() {
        const prev = currentSongIndex;
        if (songs.length > 1) {
            while (currentSongIndex === prev) {
                currentSongIndex = Math.floor(Math.random() * songs.length);
            }
        }
        saveState();
        playSong();
    }

    function pauseSong() {
        audio.pause();
        isPlaying = false;
        playBtn.classList.remove('playing');
        setIcon('play');
        saveState();
    }

    playBtn.addEventListener('click', () => {
        if (!isPlaying) playSong(); else pauseSong();
    });

    restartBtn.addEventListener('click', () => {
        audio.currentTime = 0;
        if (isPlaying) playSong(); else setIcon('play');
        saveState();
    });

    loopBtn.addEventListener('click', () => {
        playRandomNext();
    });

    audio.addEventListener('ended', () => {
        playRandomNext();
    });

    setIcon(isPlaying ? 'pause' : 'play');

    if (savedState) {
        const st = JSON.parse(savedState);
        currentSongIndex = st.index || 0;
        loadCurrentSong();
        audio.currentTime = st.time || 0;

        if (st.playing) {
            setupWebAudio();
            audio.play().then(() => {
                isPlaying = true;
                playBtn.classList.add('playing');
                setIcon('pause');
            }).catch(() => {
                isPlaying = false;
                playBtn.classList.remove('playing');
                setIcon('play');
            });
        }
    }

    let wavePhase = [0, 0, 0];
    function renderMultiWave() {
        requestAnimationFrame(renderMultiWave);
        if (!svg) return;
        svg.innerHTML = '';
        for (let w = 0; w < WAVES; w++) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            let opacity = 0.22 + w * 0.24;
            let strokeW = w === 1 ? 4.7 : 2.2;
            let phaseSpeed = 0.00037 + w * 0.00029;
            wavePhase[w] = (wavePhase[w] + phaseSpeed * (isPlaying ? 1 : 0)) % 2;

            const points = [];
            if (isPlaying && analyser) {
                analyser.getByteFrequencyData(freqArray);
                for (let i = 0; i < POINTS; i++) {
                    const t = i / POINTS;
                    const phase = wavePhase[w] * 2 * Math.PI + t * 2 * Math.PI;
                    const freqBand = Math.floor(2 + (i * (freqArray.length - 4)) / (POINTS - 1));
                    const freqPow = Math.pow(freqArray[freqBand] / 255, 1.7);
                    const base = BASE_Y +
                        Math.sin(phase + 0.7 * w + Math.cos(t * 4 + wavePhase[w])) *
                        (12 + 14 * w) * (0.5 + freqPow * 0.7);
                    points.push(base);
                }
            } else {
                for (let i = 0; i < POINTS; i++) points[i] = BASE_Y;
            }

            let d = `M0,${points[0]}`;
            for (let i = 1; i < POINTS - 2; i += 2) {
                const x1 = i * WIDTH / (POINTS - 1);
                const x2 = (i + 1) * WIDTH / (POINTS - 1);
                const xc = (x1 + x2) / 2;
                const yc = (points[i] + points[i + 1]) / 2;
                d += ` Q${x1},${points[i]} ${xc},${yc}`;
            }
            d += ` T${WIDTH},${BASE_Y}`;
            path.setAttribute("d", d);
            path.setAttribute("stroke", WAVE_COLOR);
            path.setAttribute("stroke-width", strokeW);
            path.setAttribute("fill", "none");
            path.setAttribute("opacity", opacity);
            if (w === 1) {
                const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                defs.innerHTML =
                    `<filter id="musicGlow" x="-90%" y="-90%" width="300%" height="300%">
             <feGaussianBlur stdDeviation="6" result="glow"/>
             <feMerge>
               <feMergeNode in="glow"/>
               <feMergeNode in="SourceGraphic"/>
             </feMerge>
           </filter>`;
                svg.appendChild(defs);
                path.setAttribute("filter", "url(#musicGlow)");
            }
            svg.appendChild(path);
        }
    }
    renderMultiWave();

    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
    playerBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = playerBar.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        playerBar.style.cursor = 'url("./cursor/select-cursor.png")';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let x = e.clientX - dragOffsetX;
        let y = e.clientY - dragOffsetY;
        x = Math.max(0, Math.min(window.innerWidth - playerBar.offsetWidth, x));
        y = Math.max(0, Math.min(window.innerHeight - playerBar.offsetHeight, y));
        playerBar.style.left = x + 'px';
        playerBar.style.top = y + 'px';
        playerBar.style.right = 'auto';
        playerBar.style.bottom = 'auto';
        playerBar.style.transform = '';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
    });

    window.NeonMusic = {
        play() { if (!isPlaying) playSong(); },
        pause() { if (isPlaying) pauseSong(); },
        toggle() { isPlaying ? pauseSong() : playSong(); },
        isPlaying: () => isPlaying,
        pulse(active) {
            const dock = document.getElementById('musicDock');
            if (!dock) return;
            dock.classList.toggle('music-pulse', !!active);
        }
    };
})();