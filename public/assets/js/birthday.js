/**
 * ============================================
 * 🎂  BirthdayApp — Main JavaScript Module
 * ============================================
 *
 * Architecture (IIFE — no build step required):
 *
 *  CONFIG               – colours, timing, particle counts
 *  YouTubeManager       – YouTube IFrame API player, play / pause, state sync
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
        songs: [],                       // populated from <script id="song-data"> (kept for backward compat)
        youtube: {
            videoId: 'hV34kAh9IfQ',      // Giữ anh cho ngày hôm qua
            title: 'Giữ Anh Cho Ngày Hôm Qua',
        },
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
        overlayDismissed: false,
        ytReady: false,
        pendingPlay: false,      // true when overlay dismissed before YT is ready
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
       YOUTUBE MANAGER
       =================================================== */
    const YouTubeManager = (() => {
        let ytPlayer = null;
        let progressTimer = null;

        function init() {
            // The YT IFrame API calls window.onYouTubeIframeAPIReady when loaded
            if (window.YT && window.YT.Player) {
                createPlayer();
            } else {
                window.onYouTubeIframeAPIReady = createPlayer;
            }
        }

        function createPlayer() {
            ytPlayer = new YT.Player('yt-player', {
                height: '1',
                width: '1',
                videoId: CONFIG.youtube.videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,       // no annotations
                    playsinline: 1,
                    origin: window.location.origin,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError,
                },
            });
        }

        function onPlayerReady() {
            state.ytReady = true;
            console.log('🎵 YouTube player ready');

            // Update song title
            if (el.songTitle) {
                el.songTitle.textContent = CONFIG.youtube.title;
            }

            // If user already clicked overlay before YT was ready
            if (state.pendingPlay) {
                state.pendingPlay = false;
                play();
            }
        }

        function onPlayerStateChange(event) {
            const s = event.data;

            switch (s) {
                case YT.PlayerState.PLAYING:
                    state.isPlaying = true;
                    onPlayStateChange(true);
                    startProgressTracking();
                    break;

                case YT.PlayerState.PAUSED:
                    state.isPlaying = false;
                    onPlayStateChange(false);
                    stopProgressTracking();
                    break;

                case YT.PlayerState.BUFFERING:
                    // Keep current visual state while buffering
                    // Don't change spinning — will resume when PLAYING fires
                    break;

                case YT.PlayerState.ENDED:
                    state.isPlaying = false;
                    onPlayStateChange(false);
                    stopProgressTracking();
                    // Reset progress bar to full
                    if (el.progressBar) el.progressBar.style.width = '100%';
                    break;

                case YT.PlayerState.UNSTARTED:
                    break;
            }
        }

        function onPlayerError(event) {
            console.warn('YouTube player error:', event.data);
        }

        /* ---- controls ---- */
        function play() {
            if (!state.ytReady || !ytPlayer) {
                state.pendingPlay = true;
                return;
            }
            ytPlayer.playVideo();
        }

        function pause() {
            if (!state.ytReady || !ytPlayer) return;
            ytPlayer.pauseVideo();
        }

        function toggle() {
            // Use actual player state for reliability (our tracked state can desync)
            if (state.ytReady && ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                const playerState = ytPlayer.getPlayerState();
                if (playerState === YT.PlayerState.PLAYING) {
                    pause();
                } else {
                    play();
                }
            } else if (state.isPlaying) {
                pause();
            } else {
                play();
            }
        }

        function seek(pct) {
            if (!state.ytReady || !ytPlayer) return;
            const duration = ytPlayer.getDuration();
            if (duration) {
                ytPlayer.seekTo(duration * pct, true);
            }
        }

        /* ---- progress tracking ---- */
        function startProgressTracking() {
            stopProgressTracking();
            progressTimer = setInterval(updateProgress, 250);
        }

        function stopProgressTracking() {
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
        }

        function updateProgress() {
            if (!state.ytReady || !ytPlayer) return;
            const current = ytPlayer.getCurrentTime() || 0;
            const duration = ytPlayer.getDuration() || 0;
            if (!duration) return;

            const pct = (current / duration) * 100;
            if (el.progressBar) el.progressBar.style.width = pct + '%';
            if (el.timeDisplay) {
                el.timeDisplay.textContent = fmt(current) + ' / ' + fmt(duration);
            }
        }

        function fmt(s) {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
        }

        return { init, play, pause, toggle, seek };
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
       OVERLAY HANDLER  (Gift Unwrap Animation)
       =================================================== */
    const OverlayHandler = (() => {
        function init() {
            if (!el.overlay) return;
            seedSparkles();
            el.overlay.addEventListener('click', dismiss);
            el.overlay.addEventListener('touchend', dismiss, { passive: true });
        }

        function dismiss() {
            if (state.overlayDismissed) return;
            state.overlayDismissed = true;

            const giftBox = document.getElementById('gift-box');
            const overlayTitle = document.getElementById('overlay-title');
            const overlaySubtitle = document.getElementById('overlay-subtitle');

            // Disable further clicks
            el.overlay.style.cursor = 'default';

            // ── Phase 1 (0ms): Gift shakes ──
            if (giftBox) giftBox.classList.add('gift-box--shaking');

            // Hide title/subtitle immediately
            if (overlayTitle) {
                overlayTitle.style.opacity = '0';
                overlayTitle.style.transform = 'translateY(20px)';
            }
            if (overlaySubtitle) {
                overlaySubtitle.style.opacity = '0';
                overlaySubtitle.style.transform = 'translateY(20px)';
            }

            // ── Phase 2 (600ms): Lid pops off ──
            setTimeout(() => {
                if (giftBox) {
                    giftBox.classList.remove('gift-box--shaking');
                    giftBox.classList.add('gift-box--opening');
                }
            }, 600);

            // ── Phase 3 (1000ms): Golden burst + confetti ──
            setTimeout(() => {
                if (giftBox) giftBox.classList.add('gift-box--burst');
                ParticleEngine.burstConfetti(CONFIG.particle.confettiBurst);
            }, 1000);

            // ── Phase 4 (1400ms): Box floats away ──
            setTimeout(() => {
                if (giftBox) giftBox.classList.add('gift-box--floating');
            }, 1400);

            // ── Phase 5 (1800ms): Overlay zooms out, reveal content, start music ──
            setTimeout(() => {
                el.overlay.classList.add('overlay--unwrapping');

                // Reveal main content underneath
                el.mainContent?.classList.remove('opacity-0', 'pointer-events-none');
                el.mainContent?.classList.add('opacity-100');

                setTimeout(() => el.player?.classList.add('visible'), 350);

                // Force-start visuals immediately
                state.isPlaying = true;
                onPlayStateChange(true);

                // Start YouTube playback
                YouTubeManager.play();

                // Begin continuous particles
                ParticleEngine.startLoop(true);

                // Second confetti burst during reveal
                setTimeout(() => ParticleEngine.burstConfetti(30), 300);

                // Clean up overlay from DOM after animation completes
                setTimeout(() => {
                    el.overlay.classList.add('hidden');
                    el.overlay.style.display = 'none';
                }, 1200);
            }, 1800);
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
            el.playBtn?.addEventListener('click', () => YouTubeManager.toggle());
            el.nextBtn?.addEventListener('click', () => {
                // No next/prev for single YouTube song — restart instead
                YouTubeManager.seek(0);
                YouTubeManager.play();
                ParticleEngine.burstConfetti(28);
            });
            el.prevBtn?.addEventListener('click', () => {
                YouTubeManager.seek(0);
                YouTubeManager.play();
            });

            el.progressContainer?.addEventListener('click', e => {
                const r = e.currentTarget.getBoundingClientRect();
                YouTubeManager.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
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

        // Read song list injected by Blade (kept for backward compatibility)
        const dataEl = document.getElementById('song-data');
        if (dataEl) {
            try { CONFIG.songs = JSON.parse(dataEl.textContent); }
            catch (e) { console.warn('Song data parse error', e); }
        }

        // Set song title to YouTube song immediately
        if (el.songTitle) {
            el.songTitle.textContent = CONFIG.youtube.title;
        }

        // Initialize YouTube player
        YouTubeManager.init();

        OverlayHandler.init();
        UIController.init();

        // Default body state
        document.body.classList.add('music-paused');

        console.log('🎂 BirthdayApp ready · YouTube mode: ' + CONFIG.youtube.title);
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', BirthdayApp.init);
