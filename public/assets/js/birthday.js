/**
 * ============================================
 * 🎂  BirthdayApp — Main JavaScript Module
 * ============================================
 *
 * Architecture (IIFE — no build step required):
 *
 *  CONFIG               – colours, timing, particle counts
 *  AudioManager         – playlist, play / pause / next / prev, progress
 *  TurntableController  – vinyl spin ↔ audio state
 *  ParticleEngine       – DOM-based particles (bubbles, hearts, sparkles, notes, confetti)
 *  MusicReactiveEffects – speed / density shift when music is playing
 *  OverlayHandler       – "Click to open" welcome screen
 *  UIController         – binds all DOM events
 */

const BirthdayApp = (() => {
    'use strict';

    /* ===================================================
       CONFIG
       =================================================== */
    const CONFIG = {
        songs: [],                       // populated from <script id="song-data">
        particle: {
            intervalPlaying: 700,        // ms between spawns when music plays
            intervalPaused: 2800,       // ms when paused
            confettiBurst: 55,         // pieces per burst
        },
        colors: {
            pink: ['rgba(236,72,153,0.15)', 'rgba(249,168,212,0.12)'],
            sky: ['rgba(14,165,233,0.15)', 'rgba(125,211,252,0.12)'],
            gold: ['rgba(251,191,36,0.10)'],
        },
    };

    /* ===================================================
       SHARED STATE
       =================================================== */
    const state = {
        isPlaying: false,
        currentSongIndex: 0,
        overlayDismissed: false,
    };

    /* ===================================================
       DOM CACHE
       =================================================== */
    let el = {};

    function cacheElements() {
        el = {
            overlay: document.getElementById('overlay'),
            mainContent: document.getElementById('main-content'),
            vinyl: document.getElementById('vinyl-record'),
            tonearm: document.getElementById('tonearm'),
            turntableWrap: document.querySelector('.turntable-container'),
            playBtn: document.getElementById('play-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            songTitle: document.getElementById('song-title'),
            progressBar: document.getElementById('progress-bar'),
            progressContainer: document.getElementById('progress-container'),
            particles: document.getElementById('particles-container'),
            player: document.getElementById('music-player'),
            equalizer: document.getElementById('equalizer'),
            timeDisplay: document.getElementById('time-display'),
            iconPlay: document.querySelector('.icon-play'),
            iconPause: document.querySelector('.icon-pause'),
        };
    }

    /* ===================================================
       AUDIO MANAGER
       =================================================== */
    const AudioManager = (() => {
        let audio = null;

        function init() {
            audio = new Audio();
            audio.preload = 'auto';
            audio.volume = 0.85;

            audio.addEventListener('ended', onEnded);
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('loadedmetadata', updateSongInfo);
            audio.addEventListener('error', onError);

            loadSong(0);
        }

        /* ---- helpers ---- */
        function loadSong(idx) {
            if (!CONFIG.songs.length) return;
            state.currentSongIndex = idx;
            audio.src = CONFIG.songs[idx].file;
            updateSongInfo();
        }

        function play() {
            if (!audio.src || !CONFIG.songs.length) return;
            const p = audio.play();
            if (p) p.then(() => {
                state.isPlaying = true;
                onPlayStateChange(true);
            }).catch(e => console.warn('Play blocked:', e));
        }

        function pause() {
            audio.pause();
            state.isPlaying = false;
            onPlayStateChange(false);
        }

        function toggle() { state.isPlaying ? pause() : play(); }

        function nextSong() {
            const was = state.isPlaying;
            loadSong((state.currentSongIndex + 1) % CONFIG.songs.length);
            if (was) play();
        }

        function prevSong() {
            const was = state.isPlaying;
            if (audio.currentTime > 3) { audio.currentTime = 0; return; }
            loadSong((state.currentSongIndex - 1 + CONFIG.songs.length) % CONFIG.songs.length);
            if (was) play();
        }

        function seek(pct) {
            if (audio.duration) audio.currentTime = audio.duration * pct;
        }

        /* ---- event handlers ---- */
        function onEnded() { nextSong(); }
        function onError(e) { console.warn('Audio error', e); }

        function updateProgress() {
            if (!audio.duration) return;
            const pct = (audio.currentTime / audio.duration) * 100;
            if (el.progressBar) el.progressBar.style.width = pct + '%';
            if (el.timeDisplay) el.timeDisplay.textContent =
                fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
        }

        function updateSongInfo() {
            if (CONFIG.songs.length && el.songTitle)
                el.songTitle.textContent = CONFIG.songs[state.currentSongIndex].title;
        }

        function fmt(s) {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
        }

        return { init, play, pause, toggle, nextSong, prevSong, seek };
    })();

    /* ===================================================
       TURNTABLE CONTROLLER
       =================================================== */
    const TurntableController = (() => {
        function set(playing) {
            if (!el.vinyl) return;
            el.vinyl.classList.toggle('spinning', playing);
            el.tonearm?.classList.toggle('active', playing);
            el.turntableWrap?.classList.toggle('playing', playing);
        }
        return { set };
    })();

    /* ===================================================
       PARTICLE ENGINE
       =================================================== */
    const ParticleEngine = (() => {
        let timers = [];
        let active = false;

        /* ---- random helpers ---- */
        const rand = (a, b) => a + Math.random() * (b - a);
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        /* ---- creators ---- */
        const creators = {
            bubble() {
                const d = document.createElement('div');
                d.className = 'particle--bubble';
                const s = rand(12, 48);
                Object.assign(d.style, {
                    width: s + 'px',
                    height: s + 'px',
                    left: rand(0, 100) + '%',
                    bottom: '-50px',
                    background: `radial-gradient(circle at 30% 30%,rgba(255,255,255,0.25),${pick([...CONFIG.colors.pink, ...CONFIG.colors.sky, ...CONFIG.colors.gold])})`,
                    animationDuration: rand(9, 18) + 's',
                    animationDelay: rand(0, 2) + 's',
                    '--drift-x': rand(-40, 40) + 'px',
                    '--drift-x2': rand(-30, 30) + 'px',
                });
                return { el: d, life: 20000 };
            },

            heart() {
                const d = document.createElement('div');
                d.className = 'particle--heart';
                d.textContent = pick(['❤️', '💕', '💖', '💗', '💝', '🩷', '🩵']);
                Object.assign(d.style, {
                    fontSize: rand(0.7, 1.4) + 'rem',
                    left: rand(5, 95) + '%',
                    bottom: '-30px',
                    animationDuration: rand(10, 18) + 's',
                    animationDelay: rand(0, 3) + 's',
                    '--drift-x': rand(-35, 35) + 'px',
                    '--drift-x2': rand(-20, 20) + 'px',
                });
                return { el: d, life: 21000 };
            },

            sparkle() {
                const d = document.createElement('div');
                d.className = 'particle--sparkle';
                const s = rand(2, 5);
                Object.assign(d.style, {
                    width: s + 'px',
                    height: s + 'px',
                    left: rand(0, 100) + '%',
                    top: rand(0, 100) + '%',
                    animationDuration: rand(2, 4) + 's',
                    animationDelay: rand(0, 2) + 's',
                });
                return { el: d, life: 6000 };
            },

            note() {
                const d = document.createElement('div');
                d.className = 'particle--note';
                d.textContent = pick(['♪', '♫', '♬', '🎵', '🎶']);
                Object.assign(d.style, {
                    left: rand(35, 65) + '%',
                    top: rand(35, 60) + '%',
                    animationDuration: rand(3, 5) + 's',
                    '--drift-x': rand(-30, 30) + 'px',
                });
                return { el: d, life: 5500 };
            },
        };

        function spawn(type) {
            if (!el.particles || !creators[type]) return;
            const { el: node, life } = creators[type]();
            el.particles.appendChild(node);
            setTimeout(() => node.remove(), life);
        }

        function burstConfetti(count) {
            if (!el.particles) return;
            const colors = [
                'var(--pink-400)', 'var(--pink-300)',
                'var(--sky-400)', 'var(--sky-300)',
                'var(--gold-400)', 'var(--gold-300)', '#fff',
            ];
            for (let i = 0; i < count; i++) {
                const d = document.createElement('div');
                d.className = 'particle--confetti';
                Object.assign(d.style, {
                    left: rand(15, 85) + '%',
                    top: '-12px',
                    width: rand(5, 10) + 'px',
                    height: rand(8, 14) + 'px',
                    backgroundColor: pick(colors),
                    animationDuration: rand(3, 6) + 's',
                    animationDelay: rand(0, 1.8) + 's',
                    '--drift': rand(-120, 120) + 'px',
                });
                el.particles.appendChild(d);
                setTimeout(() => d.remove(), 8000);
            }
        }

        function startLoop(playing) {
            stopLoop();
            active = true;
            const gap = playing ? CONFIG.particle.intervalPlaying : CONFIG.particle.intervalPaused;

            timers.push(setInterval(() => active && spawn('bubble'), gap * 1.6));
            timers.push(setInterval(() => active && spawn('heart'), gap * 2.2));
            timers.push(setInterval(() => active && spawn('sparkle'), gap * 0.9));

            if (playing) {
                timers.push(setInterval(() => active && spawn('note'), gap * 1.4));
            }

            // initial splash
            for (let i = 0; i < 6; i++) {
                setTimeout(() => { spawn('bubble'); spawn('sparkle'); }, i * 180);
            }
        }

        function stopLoop() {
            active = false;
            timers.forEach(clearInterval);
            timers = [];
        }

        function updateSpeed(playing) { startLoop(playing); }

        return { startLoop, stopLoop, updateSpeed, burstConfetti, spawn };
    })();

    /* ===================================================
       MUSIC-REACTIVE EFFECTS
       =================================================== */
    const MusicReactive = (() => {
        function set(playing) {
            document.body.classList.toggle('music-playing', playing);
            document.body.classList.toggle('music-paused', !playing);
            el.equalizer?.classList.toggle('active', playing);
        }
        return { set };
    })();

    /* ===================================================
       OVERLAY HANDLER
       =================================================== */
    const OverlayHandler = (() => {
        function init() {
            if (!el.overlay) return;
            seedSparkles();
            el.overlay.addEventListener('click', dismiss);
            el.overlay.addEventListener('touchend', dismiss, { passive: true });
        }

        function dismiss(e) {
            e.preventDefault?.();
            if (state.overlayDismissed) return;
            state.overlayDismissed = true;

            el.overlay.classList.add('hidden');

            // reveal content
            el.mainContent?.classList.remove('opacity-0', 'pointer-events-none');
            el.mainContent?.classList.add('opacity-100');

            setTimeout(() => el.player?.classList.add('visible'), 350);

            // Force-start visuals immediately (vinyl spin, tonearm, particles)
            // This ensures everything works even if audio files are missing
            state.isPlaying = true;
            onPlayStateChange(true);

            // Try to play audio (may fail if no mp3 files — visuals still run)
            AudioManager.play();

            // confetti burst
            setTimeout(() => ParticleEngine.burstConfetti(CONFIG.particle.confettiBurst), 500);

            // begin continuous particles
            ParticleEngine.startLoop(true);
        }

        function seedSparkles() {
            for (let i = 0; i < 28; i++) {
                const s = document.createElement('div');
                s.className = 'overlay__sparkle';
                s.style.left = Math.random() * 100 + '%';
                s.style.top = Math.random() * 100 + '%';
                s.style.animationDelay = (Math.random() * 4) + 's';
                s.style.animationDuration = (2 + Math.random() * 3) + 's';
                el.overlay.appendChild(s);
            }
        }

        return { init };
    })();

    /* ===================================================
       UI CONTROLLER
       =================================================== */
    const UIController = (() => {
        function init() {
            el.playBtn?.addEventListener('click', () => AudioManager.toggle());
            el.nextBtn?.addEventListener('click', () => {
                AudioManager.nextSong();
                ParticleEngine.burstConfetti(28);
            });
            el.prevBtn?.addEventListener('click', () => AudioManager.prevSong());

            el.progressContainer?.addEventListener('click', e => {
                const r = e.currentTarget.getBoundingClientRect();
                AudioManager.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
            });
        }

        function updatePlayBtn(playing) {
            if (el.iconPlay) el.iconPlay.classList.toggle('hidden', playing);
            if (el.iconPause) el.iconPause.classList.toggle('hidden', !playing);
        }

        return { init, updatePlayBtn };
    })();

    /* ===================================================
       CENTRAL STATE-CHANGE HANDLER
       =================================================== */
    function onPlayStateChange(playing) {
        TurntableController.set(playing);
        MusicReactive.set(playing);
        ParticleEngine.updateSpeed(playing);
        UIController.updatePlayBtn(playing);
    }

    /* ===================================================
       INIT
       =================================================== */
    function init() {
        cacheElements();

        // Read song list injected by Blade
        const dataEl = document.getElementById('song-data');
        if (dataEl) {
            try { CONFIG.songs = JSON.parse(dataEl.textContent); }
            catch (e) { console.warn('Song data parse error', e); }
        }

        AudioManager.init();
        OverlayHandler.init();
        UIController.init();

        // Default body state
        document.body.classList.add('music-paused');

        console.log('🎂 BirthdayApp ready ·', CONFIG.songs.length, 'song(s) loaded');
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', BirthdayApp.init);
