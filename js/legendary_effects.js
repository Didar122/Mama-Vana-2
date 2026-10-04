/**
 * Mama Vana - Legendary Sets Effects Engine
 * Manages all exclusive per-set effects for legendary card sets.
 * Effects only run on the gameplay page and pause when any overlay is open.
 */

class LegendaryEffectsEngine {
    constructor() {
        this.activeEffectId = null;
        this.isPaused = false;
        this.effectAudio = null;

        // Timers & animation IDs to clean up
        this._timers = [];
        this._rafs = [];

        // Per-effect state
        this._snitch = null;
        this._candles = [];
        this._candleContainer = null;
        this._donkeyTimer = null;
        this._donkeyEl = null;
        this._laserEls = [];
        this._terminatorHits = 0;
        this._terminatorStage = 0;
        this._terminatorOriginalState = null;
        this._terminatorProjectileTimer = null;
        this._terminatorRepairBound = false;
        this._terminatorRingTimer = null;
        this._kurdishLamp = null;
        this._kurdishLampContainer = null;
        this._kurdishShadow = null;
        this._batmanSignal = null;
        this._batmanTimeout = null;
        this._batmanRaf = null;
        this._latamanSpeaker = null;
        this._latamanSequenceTimeout = null;
        this._latamanImpactTimeout = null;
        this._latamanFadeTimeout = null;
        this._latamanRevealTimeout = null;
        this._latamanDustInterval = null;
        this._latamanDust = null;
        this._latamanTransientAudio = [];
        this._latamanHasFallen = false;
        this._latamanFallInProgress = false;
        this._santaWeather = null;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    checkAndStartEffect() {
        if (!window.characterModel || !window.configManager) return;

        // Effects only run on the gameplay screen
        if (window.gameApp && window.gameApp.currentScreen !== 'game') {
            return;
        }

        // If user toggled effects off, stop immediately
        if (!window.configManager.isSetEffectEnabled()) {
            if (this.activeEffectId || this._isRunning) {
                this.stopEffect();
            }
            return;
        }

        const state = window.characterModel.state;
        let matchedSetId = null;

        for (const set of CARD_SETS) {
            if (set.rank !== 'legendary' || !set.hasEffect) continue;

            const isTerminatorDamagedForm = set.id === 'terminator' && this._terminatorStage > 0 && this._matchesTerminatorStage(state);
            const isFullyEquipped = isTerminatorDamagedForm || (set.items && Object.entries(set.items).every(([cat, file]) => {
                const currentVal = state[cat];
                if (file === null) {
                    return currentVal === null || currentVal === undefined;
                }
                return currentVal === file;
            }));

            if (isFullyEquipped) {
                matchedSetId = set.id;
                break;
            }
        }

        if (matchedSetId) {
            if (this.activeEffectId !== matchedSetId) {
                this.stopEffect();
                this.activeEffectId = matchedSetId;
                this.isPaused = false;
                this._isRunning = true;
                this._startEffect(matchedSetId);
            } else if (this.isPaused || !this._isRunning) {
                this.isPaused = false;
                this._isRunning = true;
                this._startEffect(matchedSetId);
            }
        } else if (this.activeEffectId || this._isRunning) {
            this.stopEffect();
        }
    }

    notifySetEquipped(setId) {
        const set = CARD_SETS.find(s => s.id === setId);
        if (!set) return;
        if (set.rank !== 'legendary' || !set.hasEffect) {
            if (this.activeEffectId || this._batmanSignal) this.stopEffect();
            return;
        }
        if (this.activeEffectId !== setId && (this.activeEffectId || this._batmanSignal)) {
            this.stopEffect();
        }
        if (set.hasEffect && window.soundEngine) {
            window.soundEngine.stopRadio();
        }
        this.activeEffectId = setId;
        if (window.gameApp && window.gameApp.currentScreen === 'game') {
            this.checkAndStartEffect();
        }
    }

    notifySetBroken() {
        this.stopEffect();
    }

    pauseEffect() {
        if (!this.activeEffectId && !this._isRunning) return;
        this.isPaused = true;
        this._isRunning = false;
        this._pauseEffectAudio();
        if (this.activeEffectId === 'lataman') this._pauseLatamanEffect();
        if (this.activeEffectId === 'santa') this._pauseSantaEffect();
        if (this._snitch && this._snitch.audio) {
            try { this._snitch.audio.pause(); } catch (e) {}
        }
        this._hideAllEffectElements();
        this._clearAllTimers();
    }

    resumeEffect() {
        this.isPaused = false;
        this.checkAndStartEffect();
    }

    stopEffect() {
        const prevId = this.activeEffectId;
        this.activeEffectId = null;
        this.isPaused = false;
        this._isRunning = false;
        if (prevId) {
            this._stopNamedEffect(prevId);
        }
        if (prevId !== 'batman' && this._batmanSignal) {
            this._stopBatmanEffect();
        }
        this._clearAllTimers();
        this._pauseEffectAudio();
        this._stopEffectAudio();
        this._hideAllEffectElements();
    }

    // =========================================================================
    // INTERNAL ROUTING
    // =========================================================================

    _startEffect(setId) {
        if (this.isPaused) return;
        switch (setId) {
            case 'god_of_war':    this._startGodOfWarEffect(); break;
            case 'parti':         this._startPartiEffect(); break;
            case 'harry_potter':  this._startHarryPotterEffect(); break;
            case 'Draco_Malfoy':  this._startDracoMalfoyEffect(); break;
            case 'shrek':         this._startShrekEffect(); break;
            case 'tiger_jackson': this._startTigerJacksonEffect(); break;
            case 'terminator':     this._startTerminatorEffect(); break;
            case 'stive':         this._startStiveEffect(); break;
            case 'kurdish':       this._startKurdishEffect(); break;
            case 'batman':        this._startBatmanEffect(); break;
            case 'lataman':       this._startLatamanEffect(); break;
            case 'santa':         this._startSantaEffect(); break;
        }
    }

    _stopNamedEffect(setId) {
        switch (setId) {
            case 'god_of_war':    this._stopGodOfWarEffect(); break;
            case 'parti':         this._stopPartiEffect(); break;
            case 'harry_potter':  this._stopHarryPotterEffect(); break;
            case 'Draco_Malfoy':  this._stopDracoMalfoyEffect(); break;
            case 'shrek':         this._stopShrekEffect(); break;
            case 'tiger_jackson': this._stopTigerJacksonEffect(); break;
            case 'terminator':     this._stopTerminatorEffect(); break;
            case 'stive':         this._stopStiveEffect(); break;
            case 'kurdish':       this._stopKurdishEffect(); break;
            case 'batman':        this._stopBatmanEffect(); break;
            case 'lataman':       this._stopLatamanEffect(); break;
            case 'santa':         this._stopSantaEffect(); break;
        }
    }

    // =========================================================================
    // UTILITY HELPERS
    // =========================================================================

    _getStage() { return document.getElementById('game-stage'); }
    _getOverlay() { return document.getElementById('legendary-effect-overlay'); }

    _clearAllTimers() {
        this._timers.forEach(t => clearTimeout(t));
        this._timers = [];
        this._rafs.forEach(r => cancelAnimationFrame(r));
        this._rafs = [];
        if (this._donkeyTimer) { clearTimeout(this._donkeyTimer); this._donkeyTimer = null; }
        if (this._terminatorProjectileTimer) {
            clearInterval(this._terminatorProjectileTimer);
            this._terminatorProjectileTimer = null;
        }
        if (this._terminatorRingTimer) {
            clearTimeout(this._terminatorRingTimer);
            this._terminatorRingTimer = null;
        }
    }

    _addTimer(t) { this._timers.push(t); return t; }

    _hideAllEffectElements() {
        const ids = ['legendary-effect-overlay','legendary-parti-logo','legendary-disco-lasers','legendary-golden-snitch','legendary-draco-candles','legendary-shrek-donkey','legendary-stive-chest','legendary-stive-blocks-modal','stive-cursor-preview','legendary-terminator-time','legendary-terminator-electric','legendary-terminator-bullets','legendary-terminator-repair','legendary-kurdish-lamp','legendary-kurdish-shadow','batman-signal-rig','batman-signal-projection','batman-bats-container','lataman-speaker-rig','santa-temperature-device','santa-snowfall','santa-blizzard-fog','santa-frost-overlay'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const boss = document.getElementById('game-boss-container');
        if (boss) boss.classList.remove('effect-halparke', 'effect-god-of-war');

        const headGroup = document.querySelector('#game-boss-container .mv-group-head');
        if (headGroup) headGroup.classList.remove('effect-head-bob-love');

        if (window.physicsEngine) window.physicsEngine._godOfWarMode = false;

        const lasersContainer = document.getElementById('legendary-disco-lasers');
        if (lasersContainer) lasersContainer.innerHTML = '';
        this._laserEls = [];
    }

    _playEffectAudio(src, loop, volume) {
        this._stopEffectAudio();
        try {
            const audio = new Audio(src);
            audio.loop = (loop !== false);
            audio.volume = volume || 0.55;
            const p = audio.play();
            if (p) {
                p.catch(() => {
                    // Autoplay blocked by browser until user touches/clicks stage
                    const resumeOnInteract = () => {
                        if (this.effectAudio === audio && !this.isPaused) {
                            audio.play().catch(() => {});
                        }
                        window.removeEventListener('pointerdown', resumeOnInteract);
                    };
                    window.addEventListener('pointerdown', resumeOnInteract, { once: true });
                });
            }
            this.effectAudio = audio;
        } catch (e) {}
    }

    _pauseEffectAudio() {
        if (this.effectAudio) { try { this.effectAudio.pause(); } catch (e) {} }
    }

    _stopEffectAudio() {
        if (this.effectAudio) {
            try { this.effectAudio.pause(); this.effectAudio.src = ''; } catch (e) {}
            this.effectAudio = null;
        }
    }

    // =========================================================================
    // A. GOD OF WAR EFFECT
    // =========================================================================

    _startGodOfWarEffect() {
        const overlay = this._getOverlay();
        if (overlay) {
            overlay.style.display = 'block';
            overlay.className = 'legendary-dark-overlay effect-god-of-war-overlay';
        }
        if (window.physicsEngine) window.physicsEngine._godOfWarMode = true;
        this._playEffectAudio('assets/sets/god of war/god of war music.mp3', true, 0.5);
    }

    _stopGodOfWarEffect() {
        if (window.physicsEngine) window.physicsEngine._godOfWarMode = false;
    }

    // =========================================================================
    // B. PARTI EFFECT
    // =========================================================================

    _startPartiEffect() {
        const logoEl = document.getElementById('legendary-parti-logo');
        if (logoEl) {
            logoEl.style.display = 'block';
            logoEl.innerHTML = '<img src="assets/sets/parti/parti logos.png" alt="parti" draggable="false">';
        }
        const boss = document.getElementById('game-boss-container');
        if (boss) boss.classList.add('effect-halparke');
        this._playEffectAudio('assets/sets/parti/parti music.mp3', true, 0.55);
    }

    _stopPartiEffect() {
        const logoEl = document.getElementById('legendary-parti-logo');
        if (logoEl) { logoEl.style.display = 'none'; logoEl.innerHTML = ''; }
        const boss = document.getElementById('game-boss-container');
        if (boss) boss.classList.remove('effect-halparke');
    }

    // =========================================================================
    // C. HARRY POTTER - GOLDEN SNITCH
    // =========================================================================

    _startHarryPotterEffect() {
        const stage = this._getStage();
        if (!stage) return;

        const snitchEl = document.getElementById('legendary-golden-snitch');
        if (!snitchEl) return;
        snitchEl.style.display = 'block';

        const stageRect = stage.getBoundingClientRect();
        const W = stageRect.width || 800;
        const H = stageRect.height || 600;

        this._snitch = {
            el: snitchEl,
            x: W * 0.3 + Math.random() * W * 0.4,
            y: H * 0.1 + Math.random() * H * 0.3,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 4,
            frame: 0,
            frameTimer: 0,
            isGrabbed: false,
            idleTimer: null,
            dragPositions: [],
            audio: null,
            width: 140,
            height: 76
        };

        // Snitch flying sound
        try {
            const snd = new Audio('assets/sets/harry potter/golden snitch.mp3');
            snd.loop = true;
            snd.volume = 0.4;
            const p = snd.play(); if (p) p.catch(() => {});
            this._snitch.audio = snd;
        } catch (e) {}

        snitchEl.style.width = this._snitch.width + 'px';
        snitchEl.style.height = this._snitch.height + 'px';
        snitchEl.style.position = 'absolute';
        snitchEl.style.zIndex = '55';
        snitchEl.style.cursor = 'grab';
        snitchEl.style.left = this._snitch.x + 'px';
        snitchEl.style.top = this._snitch.y + 'px';
        snitchEl.innerHTML = '<img class="snitch-frame snitch-frame-base" src="assets/sets/harry potter/golden snitch frame2.png" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;"><img class="snitch-frame snitch-frame-wings snitch-frame-wings-left" src="assets/sets/harry potter/golden snitch frame1.png" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;"><img class="snitch-frame snitch-frame-wings snitch-frame-wings-right" src="assets/sets/harry potter/golden snitch frame1.png" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none;">';

        const onDown = (e) => {
            e.stopPropagation();
            if (!this._snitch) return;
            this._snitch.isGrabbed = true;
            if (this._snitch.idleTimer) { clearTimeout(this._snitch.idleTimer); this._snitch.idleTimer = null; }
            this._snitch.dragPositions = [];
            snitchEl.style.cursor = 'grabbing';
        };

        const onMove = (e) => {
            if (!this._snitch || !this._snitch.isGrabbed) return;
            e.preventDefault();
            const stageR = stage.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
            if (!clientX && clientX !== 0) return;
            const nx = clientX - stageR.left - this._snitch.width / 2;
            const ny = clientY - stageR.top - this._snitch.height / 2;
            this._snitch.dragPositions.push({ x: nx, y: ny, t: performance.now() });
            if (this._snitch.dragPositions.length > 6) this._snitch.dragPositions.shift();
            this._snitch.x = nx;
            this._snitch.y = ny;
            this._snitch.vx = 0;
            this._snitch.vy = 0;
        };

        const onUp = () => {
            if (!this._snitch || !this._snitch.isGrabbed) return;
            this._snitch.isGrabbed = false;
            snitchEl.style.cursor = 'grab';
            const pos = this._snitch.dragPositions;
            if (pos.length >= 2) {
                const f = pos[0]; const l = pos[pos.length - 1];
                const dt = Math.max(16, l.t - f.t) / 1000;
                this._snitch.vx = Math.max(-16, Math.min(16, (l.x - f.x) / dt * 0.055));
                this._snitch.vy = Math.max(-16, Math.min(16, (l.y - f.y) / dt * 0.055));
            } else {
                this._snitch.vx = (Math.random() - 0.5) * 6;
                this._snitch.vy = -3;
            }
            if (this._snitch.audio) {
                try { const p = this._snitch.audio.play(); if (p) p.catch(() => {}); } catch(ee) {}
            }
            // Re-launch after 1s idle
            this._snitch.idleTimer = setTimeout(() => {
                if (this._snitch && !this._snitch.isGrabbed && Math.hypot(this._snitch.vx, this._snitch.vy) < 0.5) {
                    this._snitch.vx = (Math.random() < 0.5 ? 1 : -1) * (2 + Math.random() * 4);
                    this._snitch.vy = -(2 + Math.random() * 3);
                    if (this._snitch.audio) {
                        try { const p = this._snitch.audio.play(); if (p) p.catch(() => {}); } catch(ee) {}
                    }
                }
            }, 1000);
        };

        snitchEl.addEventListener('mousedown', onDown);
        snitchEl.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);

        this._snitch._onDown = onDown;
        this._snitch._onMove = onMove;
        this._snitch._onUp = onUp;

        const FRAME_INTERVAL = 24;
        let lastT = performance.now();

        const loop = (now) => {
            if (!this._snitch || this.isPaused || this.activeEffectId !== 'harry_potter') return;
            const dt = Math.min((now - lastT) / 1000, 0.1);
            lastT = now;
            const s = this._snitch;
            const stageR = stage.getBoundingClientRect();
            const W2 = stageR.width || 800;
            const H2 = stageR.height || 600;

            if (!s.isGrabbed) {
                const speedScale = 0.7 + Math.sin(now * 0.0009) * 0.45;
                s.x += s.vx * speedScale;
                s.y += s.vy * speedScale;

                if (Math.random() < 0.025) {
                    s.vx += (Math.random() - 0.5) * 2.5;
                    s.vy += (Math.random() - 0.5) * 2;
                }

                const maxSpd = 5 + Math.sin(now * 0.0006) * 2.5;
                const spd = Math.hypot(s.vx, s.vy);
                if (spd > maxSpd) { s.vx = s.vx / spd * maxSpd; s.vy = s.vy / spd * maxSpd; }
                if (spd < 0.5 && !s.isGrabbed) { s.vx += (Math.random() - 0.5) * 2; s.vy += (Math.random() - 0.5) * 2; }

                if (s.x < 5) { s.x = 5; s.vx = Math.abs(s.vx); }
                if (s.x > W2 - s.width - 5) { s.x = W2 - s.width - 5; s.vx = -Math.abs(s.vx); }
                if (s.y < 5) { s.y = 5; s.vy = Math.abs(s.vy); }
                if (s.y > H2 * 0.70) { s.y = H2 * 0.70; s.vy = -Math.abs(s.vy); }
            }

            s.el.style.left = s.x + 'px';
            s.el.style.top = s.y + 'px';

            s.frameTimer += dt * 1000;
            if (s.frameTimer >= FRAME_INTERVAL) {
                s.frameTimer = 0;
                s.frame = s.frame === 0 ? 1 : 0;
                s.el.classList.toggle('snitch-wings-open', s.frame === 0);
            }

            this._rafs.push(requestAnimationFrame(loop));
        };
        this._rafs.push(requestAnimationFrame(loop));
    }

    _stopHarryPotterEffect() {
        const snitchEl = document.getElementById('legendary-golden-snitch');
        if (snitchEl) { snitchEl.style.display = 'none'; snitchEl.innerHTML = ''; }
        if (this._snitch) {
            if (this._snitch.audio) { try { this._snitch.audio.pause(); this._snitch.audio.src = ''; } catch(e) {} }
            if (this._snitch.idleTimer) clearTimeout(this._snitch.idleTimer);
            const el = snitchEl;
            if (this._snitch._onDown && el) { el.removeEventListener('mousedown', this._snitch._onDown); el.removeEventListener('touchstart', this._snitch._onDown); }
            if (this._snitch._onMove) { window.removeEventListener('mousemove', this._snitch._onMove); window.removeEventListener('touchmove', this._snitch._onMove); }
            if (this._snitch._onUp) { window.removeEventListener('mouseup', this._snitch._onUp); window.removeEventListener('touchend', this._snitch._onUp); }
            this._snitch = null;
        }
    }

    _startDracoMalfoyEffect() {
        const stage = this._getStage();
        if (!stage) return;

        this._playEffectAudio('assets/sets/draco malfoy/background music.mp3', true, 0.45);

        let container = document.getElementById('legendary-draco-candles');
        if (!container) {
            container = document.createElement('div');
            container.id = 'legendary-draco-candles';
            container.className = 'legendary-draco-candles';
            stage.appendChild(container);
        }
        container.innerHTML = '';
        container.style.display = 'block';
        this._candleContainer = container;

        const stageRect = stage.getBoundingClientRect();
        const stageWidth = stageRect.width || 900;
        const stageHeight = stageRect.height || 600;
        const candleCount = 20;
        const candleAnchors = [];
        Array.from({ length: candleCount }, (_, index) => index).forEach(index => {
            const width = 52 + Math.random() * 30;
            const height = width * 1.72;
            const maxY = Math.max(12, stageHeight * 0.5 - height);
            let anchorX = 0;
            let anchorY = 0;
            let foundSpacedPosition = false;
            for (let attempt = 0; attempt < 120; attempt++) {
                const candidateX = 8 + Math.random() * Math.max(1, stageWidth - width - 16);
                const candidateY = 12 + Math.random() * Math.max(1, maxY - 12);
                const isSpaced = candleAnchors.every(anchor => {
                    const minDistance = Math.max(76, (width + anchor.width) * 0.62);
                    return Math.hypot(candidateX - anchor.x, candidateY - anchor.y) >= minDistance;
                });
                if (isSpaced || attempt === 119) {
                    anchorX = candidateX;
                    anchorY = candidateY;
                    foundSpacedPosition = true;
                    break;
                }
            }
            if (!foundSpacedPosition) return;
            candleAnchors.push({ x: anchorX, y: anchorY, width });
            const candle = {
                x: Math.max(8, Math.min(stageWidth - width - 8, anchorX)),
                y: Math.min(stageHeight * 0.5 - height, anchorY),
                anchorX: Math.max(8, Math.min(stageWidth - width - 8, anchorX)),
                anchorY: Math.min(stageHeight * 0.5 - height, anchorY),
                vx: 0,
                vy: 0,
                width,
                height,
                phase: Math.random() * Math.PI * 2,
                bobAmount: 6 + Math.random() * 5,
                bobSpeed: 0.001 + Math.random() * 0.0005,
                hitCooldown: 0,
                wasTouchingHead: false,
                isGrabbed: false,
                dragPositions: [],
                el: document.createElement('div')
            };
            candle.el.className = 'legendary-draco-candle';
            candle.el.style.width = `${candle.width}px`;
            candle.el.style.height = `${candle.height}px`;
            candle.el.style.transform = `translate3d(${candle.x}px, ${candle.y}px, 0)`;
            candle.el.innerHTML = '<img src="assets/sets/draco malfoy/candle.png" alt="" draggable="false">';
            container.appendChild(candle.el);

            const onDown = (event) => {
                event.preventDefault();
                event.stopPropagation();
                candle.isGrabbed = true;
                candle.dragPositions = [];
                candle.el.classList.add('is-grabbed');
                candle.el.setPointerCapture?.(event.pointerId);
            };
            const onMove = (event) => {
                if (!candle.isGrabbed) return;
                event.preventDefault();
                const rect = stage.getBoundingClientRect();
                const nextX = event.clientX - rect.left - candle.width / 2;
                const nextY = event.clientY - rect.top - candle.height / 2;
                candle.dragPositions.push({ x: nextX, y: nextY, t: performance.now() });
                if (candle.dragPositions.length > 6) candle.dragPositions.shift();
                candle.x = nextX;
                candle.y = nextY;
                candle.vx = 0;
                candle.vy = 0;
            };
            const onUp = () => {
                if (!candle.isGrabbed) return;
                candle.isGrabbed = false;
                candle.el.classList.remove('is-grabbed');
                const positions = candle.dragPositions;
                if (positions.length > 1) {
                    const first = positions[0];
                    const last = positions[positions.length - 1];
                    const seconds = Math.max(16, last.t - first.t) / 1000;
                    candle.vx = Math.max(-18, Math.min(18, (last.x - first.x) / seconds * 0.04));
                    candle.vy = Math.max(-18, Math.min(18, (last.y - first.y) / seconds * 0.04));
                }
            };

            candle.el.addEventListener('pointerdown', onDown);
            candle.el.addEventListener('pointermove', onMove);
            candle.el.addEventListener('pointerup', onUp);
            candle.el.addEventListener('pointercancel', onUp);
            candle.cleanup = () => {
                candle.el.removeEventListener('pointerdown', onDown);
                candle.el.removeEventListener('pointermove', onMove);
                candle.el.removeEventListener('pointerup', onUp);
                candle.el.removeEventListener('pointercancel', onUp);
            };
            this._candles.push(candle);
        });

        let lastTime = performance.now();
        let previousHeadCenter = null;
        const loop = (now) => {
            if (!this._candles.length || this.isPaused || this.activeEffectId !== 'Draco_Malfoy') return;
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            const stageRect = stage.getBoundingClientRect();
            const headEl = document.querySelector('#game-boss-container .mv-group-head');
            const headRect = headEl ? headEl.getBoundingClientRect() : null;
            const headBounds = headRect ? {
                left: headRect.left - stageRect.left + headRect.width * 0.18,
                top: headRect.top - stageRect.top + headRect.height * 0.18,
                right: headRect.right - stageRect.left - headRect.width * 0.18,
                bottom: headRect.bottom - stageRect.top + headRect.height * 0.22
            } : null;
            const headCenter = headBounds ? {
                x: (headBounds.left + headBounds.right) / 2,
                y: (headBounds.top + headBounds.bottom) / 2
            } : null;
            const headMoved = headCenter && previousHeadCenter &&
                Math.hypot(headCenter.x - previousHeadCenter.x, headCenter.y - previousHeadCenter.y) > 0.7;
            this._candles.forEach(candle => {
                candle.hitCooldown = Math.max(0, candle.hitCooldown - dt);
                if (!candle.isGrabbed) {
                    const bobY = Math.sin(now * candle.bobSpeed + candle.phase) * candle.bobAmount;
                    const targetX = candle.anchorX;
                    const targetY = candle.anchorY + bobY;
                    candle.vx += (targetX - candle.x) * 5.2 * dt;
                    candle.vy += (targetY - candle.y) * 5.2 * dt;
                    candle.vx *= Math.pow(0.82, dt * 60);
                    candle.vy *= Math.pow(0.82, dt * 60);

                    const candleBounds = {
                        left: candle.x,
                        top: candle.y,
                        right: candle.x + candle.width,
                        bottom: candle.y + candle.height
                    };
                    const touchesHead = headBounds && candleBounds.left < headBounds.right &&
                        candleBounds.right > headBounds.left &&
                        candleBounds.top < headBounds.bottom &&
                        candleBounds.bottom > headBounds.top;
                    if (touchesHead && !candle.wasTouchingHead && headMoved && candle.hitCooldown === 0) {
                        const candleCenterX = candle.x + candle.width / 2;
                        const candleCenterY = candle.y + candle.height / 2;
                        const headCenterX = (headBounds.left + headBounds.right) / 2;
                        const headCenterY = (headBounds.top + headBounds.bottom) / 2;
                        const directionX = candleCenterX - headCenterX;
                        const directionY = candleCenterY - headCenterY;
                        const distance = Math.hypot(directionX, directionY) || 1;
                        candle.vx += (directionX / distance) * 180;
                        candle.vy += (directionY / distance) * 180;
                        candle.hitCooldown = 0.24;
                    }
                    candle.wasTouchingHead = !!touchesHead;
                    candle.x += candle.vx * dt;
                    candle.y += candle.vy * dt;
                }
                const tilt = Math.max(-8, Math.min(8, candle.vx * 0.35));
                candle.el.style.transform = `translate3d(${candle.x}px, ${candle.y}px, 0) rotate(${tilt}deg)`;
            });
            previousHeadCenter = headCenter;
            this._rafs.push(requestAnimationFrame(loop));
        };
        this._rafs.push(requestAnimationFrame(loop));
    }

    _stopDracoMalfoyEffect() {
        this._candles.forEach(candle => candle.cleanup?.());
        this._candles = [];
        if (this._candleContainer) {
            this._candleContainer.innerHTML = '';
            this._candleContainer.style.display = 'none';
        }
        this._candleContainer = null;
    }

    // =========================================================================
    // E. SHREK - DONKEY
    // =========================================================================

    _startShrekEffect() {
        // First spawn happens quickly so the player immediately enjoys the effect
        const initialDelay = 1500 + Math.random() * 1200;
        this._donkeyTimer = setTimeout(() => this._spawnDonkey(), initialDelay);
    }

    _stopShrekEffect() {
        if (this._donkeyTimer) { clearTimeout(this._donkeyTimer); this._donkeyTimer = null; }
        const el = document.getElementById('legendary-shrek-donkey');
        if (el) { el.style.display = 'none'; el.classList.remove('donkey-enter-left','donkey-enter-right','donkey-exit-left','donkey-exit-right'); }
    }

    _scheduleDonkey() {
        if (this.activeEffectId !== 'shrek' || this.isPaused) return;
        const delay = 6000 + Math.random() * 6000;
        this._donkeyTimer = setTimeout(() => this._spawnDonkey(), delay);
    }

    _spawnDonkey() {
        if (this.activeEffectId !== 'shrek' || this.isPaused) return;
        const stage = this._getStage();
        if (!stage) return;
        const donkeyEl = document.getElementById('legendary-shrek-donkey');
        if (!donkeyEl) return;

        const fromLeft = Math.random() < 0.5;
        const stayDuration = 2000 + Math.random() * 3000;

        donkeyEl.style.display = 'block';
        // Mirror for right side entry (donkey faces left when coming from right)
        donkeyEl.innerHTML = `<img src="assets/sets/shrek/shrek donkey.png" draggable="false" style="height:100%;width:auto;object-fit:contain;pointer-events:none;${fromLeft ? 'transform:scaleX(-1);' : ''}">`;
        donkeyEl.classList.remove('donkey-enter-left','donkey-enter-right','donkey-exit-left','donkey-exit-right');
        donkeyEl.style.left = fromLeft ? '0px' : 'auto';
        donkeyEl.style.right = fromLeft ? 'auto' : '0px';
        donkeyEl.classList.add(fromLeft ? 'donkey-enter-left' : 'donkey-enter-right');

        // Play sound
        try {
            const snd = new Audio('assets/sets/shrek/shrek donkey sound.mp3');
            snd.volume = 0.7;
            const p = snd.play(); if (p) p.catch(() => {});
        } catch (e) {}

        // Hit during the entry so the donkey cannot pass through the character first.
        this._addTimer(setTimeout(() => {
            if (this.activeEffectId !== 'shrek' || this.isPaused || !window.physicsEngine) return;
            const stageRect = stage.getBoundingClientRect();
            const charX = window.physicsEngine.x;
            const donkeyRect = donkeyEl.getBoundingClientRect();
            const donkeyX = donkeyRect.left - stageRect.left + donkeyRect.width / 2;
            const donkeyReach = donkeyRect.width * 0.45 + 90;
            if (Math.abs(charX - donkeyX) < donkeyReach) {
                const hitX = fromLeft ? charX - 1 : charX + 1;
                window.physicsEngine.applyDirectionalHit(hitX, 95, window.physicsEngine.y - 80);
            }
        }, 300));

        // Exit donkey
        this._addTimer(setTimeout(() => {
            donkeyEl.classList.remove('donkey-enter-left','donkey-enter-right');
            donkeyEl.classList.add(fromLeft ? 'donkey-exit-left' : 'donkey-exit-right');
            this._addTimer(setTimeout(() => {
                donkeyEl.style.display = 'none';
                donkeyEl.classList.remove('donkey-exit-left', 'donkey-exit-right');
                this._scheduleDonkey();
            }, 700));
        }, stayDuration));
    }

    // =========================================================================
    // E. TIGER JACKSON - DISCO
    // =========================================================================

    _startTigerJacksonEffect() {
        const overlay = this._getOverlay();
        if (overlay) {
            overlay.style.display = 'block';
            overlay.className = 'legendary-dark-overlay effect-tiger-overlay';
        }

        const lasersContainer = document.getElementById('legendary-disco-lasers');
        if (lasersContainer) {
            lasersContainer.style.display = 'block';
            lasersContainer.innerHTML = '';
            const colors = ['#ff0044','#00ffff','#ff9900','#00ff66','#ff00ff','#0099ff','#ffff00','#ff6600'];
            for (let i = 0; i < 8; i++) {
                const laser = document.createElement('div');
                laser.className = 'disco-laser';
                laser.style.cssText = `--laser-color:${colors[i]};--laser-angle:${-65 + i * 19}deg;--laser-delay:${i * 0.18}s;`;
                lasersContainer.appendChild(laser);
                this._laserEls.push(laser);
            }
        }

        const headGroup = document.querySelector('#game-boss-container .mv-group-head');
        if (headGroup) headGroup.classList.add('effect-head-bob-love');

        this._playEffectAudio('assets/sets/Tiger Jackson/Tiger Jackson.mp3', true, 0.55);
    }

    _stopTigerJacksonEffect() {
        const lasersContainer = document.getElementById('legendary-disco-lasers');
        if (lasersContainer) { lasersContainer.innerHTML = ''; lasersContainer.style.display = 'none'; }
        this._laserEls = [];
        const headGroup = document.querySelector('#game-boss-container .mv-group-head');
        if (headGroup) headGroup.classList.remove('effect-head-bob-love');
    }

    // =========================================================================
    // F. TERMINATOR - TIME ARRIVAL, DAMAGE STAGES & WAR BACKGROUND
    // =========================================================================

    _startTerminatorEffect() {
        const stage = this._getStage();
        if (!stage) return;

        if (!this._terminatorOriginalState) {
            this._terminatorOriginalState = { ...window.characterModel.state };
            this._terminatorHits = 0;
            this._terminatorStage = 0;
            this._playEffectAudio('assets/sets/terminator/i-m-back.mp3', false, 0.8);

            const timeEl = document.getElementById('legendary-terminator-time');
            if (timeEl) {
                timeEl.style.display = 'block';
                timeEl.innerHTML = '<div class="terminator-time-flash"></div>';
                this._terminatorRingTimer = setTimeout(() => {
                    timeEl.style.display = 'none';
                    this._terminatorRingTimer = null;
                }, 1800);
            }
        }

        const timeEl = document.getElementById('legendary-terminator-time');
        if (timeEl) {
            timeEl.innerHTML = '<div class="terminator-time-flash"></div>';
        }

        const bulletsEl = document.getElementById('legendary-terminator-bullets');
        if (bulletsEl) {
            bulletsEl.style.display = 'block';
            if (!this._terminatorProjectileTimer) {
                this._terminatorProjectileTimer = setInterval(() => this._spawnTerminatorProjectile(), 550 + Math.random() * 550);
                this._spawnTerminatorProjectile();
            }
        }

        const repairEl = document.getElementById('legendary-terminator-repair');
        if (repairEl && !this._terminatorRepairBound) {
            repairEl.addEventListener('click', () => this._repairTerminator());
            this._terminatorRepairBound = true;
        }
        this._updateTerminatorRepairVisibility();
    }

    _stopTerminatorEffect() {
        const repairEl = document.getElementById('legendary-terminator-repair');
        if (repairEl) repairEl.style.display = 'none';
        const bulletsEl = document.getElementById('legendary-terminator-bullets');
        if (bulletsEl) bulletsEl.innerHTML = '';
        const electricEl = document.getElementById('legendary-terminator-electric');
        if (electricEl) electricEl.innerHTML = '';
        this._terminatorOriginalState = null;
        this._terminatorHits = 0;
        this._terminatorStage = 0;
    }

    _startKurdishEffect() {
        const stage = this._getStage();
        const boss = document.getElementById('game-boss-container');
        if (!stage || !boss) return;
        if (window.soundEngine) window.soundEngine.stopRadio();
        this._playEffectAudio('assets/sets/kurdish/music.mp3', true, 0.5);

        const overlay = this._getOverlay();
        if (overlay) {
            overlay.style.display = 'block';
            overlay.className = 'legendary-dark-overlay effect-kurdish-overlay';
        }

        const shadow = document.createElement('div');
        shadow.id = 'legendary-kurdish-shadow';
        shadow.className = 'kurdish-character-shadow';
        shadow.innerHTML = boss.querySelector('.mv-character-composite')?.outerHTML || '';
        stage.insertBefore(shadow, boss);
        this._kurdishShadow = shadow;

        const lampEl = document.createElement('div');
        lampEl.id = 'legendary-kurdish-lamp';
        lampEl.className = 'kurdish-lamp-actor';
        lampEl.innerHTML = '<img src="assets/sets/kurdish/on2.png" alt="" draggable="false">';
        stage.appendChild(lampEl);
        const lamp = this._kurdishLamp = {
            el: lampEl,
            image: lampEl.querySelector('img'),
            litFrames: ['on1.png', 'on2.png', 'on3.png'],
            frameIndex: 1,
            frameElapsed: 0,
            x: stage.clientWidth * 0.18,
            y: stage.clientHeight - 173,
            vx: 0,
            vy: 0,
            angle: 0,
            angularVelocity: 0,
            isGrabbed: false,
            isOn: true,
            grabX: 0,
            grabY: 0,
            lastGrabX: 0,
            lastGrabY: 0,
            startX: 0,
            startY: 0,
            moved: false,
            localX: 0,
            localY: 0,
            history: [],
            lastTime: performance.now(),
            cleanup: null
        };
        const setLampState = (isOn) => {
            lamp.isOn = isOn;
            lamp.frameIndex = 1;
            lamp.frameElapsed = 0;
            lamp.el.classList.toggle('is-off', !isOn);
            lamp.image.src = `assets/sets/kurdish/${isOn ? lamp.litFrames[lamp.frameIndex] : 'off.png'}`;
            if (this._kurdishShadow) {
                this._kurdishShadow.style.visibility = isOn ? 'visible' : 'hidden';
            }
        };
        const upright = () => {
            const angle = ((lamp.angle % 360) + 360) % 360;
            return angle < 18 || angle > 342;
        };
        const getGroundY = () => window.physicsEngine?.groundY || stage.clientHeight * 0.58;
        const getRotatedHalfSize = () => {
            const radians = lamp.angle * Math.PI / 180;
            return {
                width: Math.abs(Math.cos(radians)) * 85 + Math.abs(Math.sin(radians)) * 118,
                height: Math.abs(Math.cos(radians)) * 118 + Math.abs(Math.sin(radians)) * 85
            };
        };
        const getFloorY = () => stage.clientHeight - 8 - getRotatedHalfSize().height + 12;
        const snapToLandingAngle = () => {
            const quarterTurns = Math.round(lamp.angle / 90);
            lamp.angle = quarterTurns * 90;
            lamp.angularVelocity = 0;
            lamp.y = getFloorY();
        };
        lamp.y = getFloorY();
        const stagePoint = (event) => {
            const rect = stage.getBoundingClientRect();
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        };
        const onDown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const point = stagePoint(event);
            const radians = lamp.angle * Math.PI / 180;
            const dx = point.x - lamp.x;
            const dy = point.y - lamp.y;
            lamp.isGrabbed = true;
            lamp.el.classList.add('is-grabbed');
            lamp.grabX = point.x;
            lamp.grabY = point.y;
            lamp.lastGrabX = point.x;
            lamp.lastGrabY = point.y;
            lamp.startX = point.x;
            lamp.startY = point.y;
            lamp.moved = false;
            lamp.localX = dx * Math.cos(radians) + dy * Math.sin(radians);
            lamp.localY = -dx * Math.sin(radians) + dy * Math.cos(radians);
            lamp.history = [{ ...point, time: performance.now() }];
            if (lamp.el.setPointerCapture && event.pointerId !== undefined) {
                try { lamp.el.setPointerCapture(event.pointerId); } catch (_) {}
            }
        };
        const onMove = (event) => {
            if (!lamp.isGrabbed) return;
            event.preventDefault();
            const point = stagePoint(event);
            lamp.grabX = point.x;
            lamp.grabY = point.y;
            lamp.moved = lamp.moved || Math.hypot(point.x - lamp.startX, point.y - lamp.startY) > 8;
            if (lamp.moved) {
                const radians = lamp.angle * Math.PI / 180;
                lamp.x = point.x - (lamp.localX * Math.cos(radians) - lamp.localY * Math.sin(radians));
                lamp.y = point.y - (lamp.localX * Math.sin(radians) + lamp.localY * Math.cos(radians));
                lamp.lastGrabX = point.x;
                lamp.lastGrabY = point.y;
            }
            lamp.history.push({ ...point, time: performance.now() });
            if (lamp.history.length > 6) lamp.history.shift();
        };
        const onUp = (event) => {
            if (!lamp.isGrabbed) return;
            lamp.isGrabbed = false;
            lamp.el.classList.remove('is-grabbed');
            if (lamp.el.releasePointerCapture && event.pointerId !== undefined) {
                try { lamp.el.releasePointerCapture(event.pointerId); } catch (_) {}
            }
            if (!lamp.moved) {
                lamp.vx = 0;
                lamp.vy = 0;
                lamp.angularVelocity = 0;
                if (upright()) {
                    setLampState(!lamp.isOn);
                }
                return;
            }
            const first = lamp.history[0];
            const last = lamp.history[lamp.history.length - 1];
            if (first && last && last.time > first.time) {
                const seconds = Math.max(0.015, (last.time - first.time) / 1000);
                lamp.vx = Math.max(-500, Math.min(500, (last.x - first.x) / seconds));
                lamp.vy = Math.max(-500, Math.min(500, (last.y - first.y) / seconds));
                lamp.angularVelocity = Math.max(-45, Math.min(45, lamp.vx * 0.08));
            }
        };
        lampEl.addEventListener('pointerdown', onDown);
        lampEl.addEventListener('pointermove', onMove);
        lampEl.addEventListener('pointerup', onUp);
        lampEl.addEventListener('pointercancel', onUp);
        lamp.cleanup = () => {
            lampEl.removeEventListener('pointerdown', onDown);
            lampEl.removeEventListener('pointermove', onMove);
            lampEl.removeEventListener('pointerup', onUp);
            lampEl.removeEventListener('pointercancel', onUp);
        };

        const render = () => {
            lamp.el.style.left = `${lamp.x}px`;
            lamp.el.style.top = `${lamp.y}px`;
            lamp.el.style.transform = `translate(-50%, -50%) rotate(${lamp.angle}deg)`;
            if (overlay) {
                overlay.style.background = lamp.isOn
                    ? `radial-gradient(circle at ${lamp.x}px ${lamp.y}px, rgba(255, 190, 95, 0.34) 0 220px, rgba(255, 165, 72, 0.18) 420px, rgba(0,0,0,0.32) 700px, rgba(0,0,0,0.88) 1150px), rgba(0,0,0,0.68)`
                    : 'rgba(0,0,0,0.9)';
            }
            const bossRect = boss.getBoundingClientRect();
            const character = boss.querySelector('.mv-character-composite');
            const getVisibleRect = (root, fallback) => {
                const elements = root ? [root, ...root.querySelectorAll('img')] : [];
                const rects = elements.map(element => element.getBoundingClientRect())
                    .filter(rect => rect.width > 0 && rect.height > 0);
                if (!rects.length) return fallback;
                return {
                    left: Math.min(...rects.map(rect => rect.left)),
                    top: Math.min(...rects.map(rect => rect.top)),
                    right: Math.max(...rects.map(rect => rect.right)),
                    bottom: Math.max(...rects.map(rect => rect.bottom)),
                    width: Math.max(...rects.map(rect => rect.right)) - Math.min(...rects.map(rect => rect.left)),
                    height: Math.max(...rects.map(rect => rect.bottom)) - Math.min(...rects.map(rect => rect.top))
                };
            };
            const characterRect = getVisibleRect(character, bossRect);
            const stageRect = stage.getBoundingClientRect();
            const charX = characterRect.left - stageRect.left + characterRect.width / 2;
            const charY = characterRect.top - stageRect.top + characterRect.height * 0.76;
            const distance = Math.hypot(charX - lamp.x, charY - lamp.y);
            const directionX = (charX - lamp.x) / Math.max(1, distance);
            const directionY = (charY - lamp.y) / Math.max(1, distance);
            shadow.style.left = boss.style.left || '0px';
            shadow.style.top = boss.style.top || '0px';
            shadow.style.transform = boss.style.transform || 'translate(-50%, -50%)';
            const shadowCharacter = shadow.querySelector('.mv-character-composite');
            if (shadowCharacter) {
                const bodyImage = character?.querySelector('.mv-part-bodys img');
                const rootRect = character?.getBoundingClientRect();
                if (bodyImage && rootRect && rootRect.width > 0 && rootRect.height > 0) {
                    const bodyRect = bodyImage.getBoundingClientRect();
                    const localAnchorX = ((bodyRect.left + bodyRect.width / 2) - rootRect.left) * (320 / rootRect.width);
                    const localAnchorY = (bodyRect.bottom - rootRect.top) * (400 / rootRect.height);
                    shadowCharacter.style.transformOrigin = `${localAnchorX}px ${localAnchorY}px`;
                }
                const heightFactor = Math.max(0, Math.min(1, (lamp.y - characterRect.top) / Math.max(1, characterRect.height)));
                const widthScale = 0.78 + heightFactor * 0.9;
                const heightScale = 0.8 + heightFactor * 1.25;
                // CSS skew uses screen coordinates, so invert the light direction:
                // the silhouette leans away from the lamp, with its feet anchored.
                const leanX = -directionX * (22 + heightFactor * 14);
                const projection = `skewX(${leanX}deg) scale(${widthScale}, ${heightScale})`;
                shadowCharacter.style.transform = projection;
                const projectedBottom = getVisibleRect(shadowCharacter, shadowCharacter.getBoundingClientRect()).bottom;
                const bottomCorrection = characterRect.bottom - projectedBottom;
                shadowCharacter.style.transform = `translateY(${bottomCorrection}px) ${projection}`;
            }
        };
        const loop = (now) => {
            if (this.activeEffectId !== 'kurdish' || this.isPaused || !this._kurdishLamp) return;
            const dt = Math.min(0.033, Math.max(0.001, (now - lamp.lastTime) / 1000));
            lamp.lastTime = now;
            if (lamp.isOn) {
                lamp.frameElapsed += dt;
                if (lamp.frameElapsed >= 0.14) {
                    lamp.frameElapsed = 0;
                    lamp.frameIndex = (lamp.frameIndex + 1) % lamp.litFrames.length;
                    lamp.image.src = `assets/sets/kurdish/${lamp.litFrames[lamp.frameIndex]}`;
                }
            }
            if (lamp.isGrabbed) {
                // Pointer movement updates the lamp directly; the frame loop only renders it.
            } else {
                lamp.vy += 2500 * dt;
                lamp.x += lamp.vx * dt;
                lamp.y += lamp.vy * dt;
                lamp.angle += lamp.angularVelocity * dt;
                lamp.angularVelocity *= 0.985;
                const rotatedSize = getRotatedHalfSize();
                const floorY = getFloorY();
                if (lamp.y >= floorY) {
                    const bounced = Math.abs(lamp.vy) > 75;
                    lamp.y = floorY;
                    lamp.vy = bounced ? -lamp.vy * 0.18 : 0;
                    lamp.vx *= bounced ? 0.5 : 0.78;
                    lamp.angularVelocity *= bounced ? 0.2 : 0.72;
                    snapToLandingAngle();
                    if (Math.abs(lamp.vx) < 5) lamp.vx = 0;
                }
                if (lamp.x < rotatedSize.width || lamp.x > stage.clientWidth - rotatedSize.width) {
                    lamp.x = Math.max(rotatedSize.width, Math.min(stage.clientWidth - rotatedSize.width, lamp.x));
                    lamp.vx *= -0.5;
                    lamp.angularVelocity *= -0.5;
                }
            }
            render();
            this._rafs.push(requestAnimationFrame(loop));
        };
        render();
        this._rafs.push(requestAnimationFrame(loop));
    }

    _stopKurdishEffect() {
        this._kurdishLamp?.cleanup?.();
        this._kurdishLamp?.el?.remove();
        this._kurdishShadow?.remove();
        this._kurdishLamp = null;
        this._kurdishShadow = null;
        const overlay = this._getOverlay();
        if (overlay) overlay.style.background = '';
    }

    _startSantaEffect() {
        const stage = this._getStage();
        if (!stage) return;

        let weather = this._santaWeather;
        if (!weather || !weather.device.isConnected || !weather.canvas.isConnected) {
            const canvas = document.createElement('canvas');
            canvas.id = 'santa-snowfall';
            canvas.className = 'santa-snowfall';
            canvas.setAttribute('aria-hidden', 'true');
            stage.appendChild(canvas);
            const fog = document.createElement('div');
            fog.id = 'santa-blizzard-fog';
            fog.className = 'santa-blizzard-fog';
            fog.setAttribute('aria-hidden', 'true');
            stage.appendChild(fog);
            const frost = document.createElement('div');
            frost.id = 'santa-frost-overlay';
            frost.className = 'santa-frost-overlay';
            frost.setAttribute('aria-hidden', 'true');
            stage.appendChild(frost);
            const device = document.createElement('div');
            device.id = 'santa-temperature-device';
            device.className = 'santa-temperature-device';
            device.innerHTML = `
                <div class="santa-temperature-readout" aria-hidden="true">
                    <span class="santa-temperature-hot">گەرم</span>
                    <span class="santa-temperature-value">0°</span>
                    <span class="santa-temperature-cold">سارد</span>
                </div>
                <div class="santa-thermometer">
                    <div class="santa-thermometer-track">
                        <div class="santa-thermometer-fill"></div>
                        <button class="santa-temperature-handle" type="button" role="slider" aria-label="پلەی گەرمی" aria-valuemin="-50" aria-valuemax="25" aria-valuenow="0">
                            <span></span>
                        </button>
                    </div>
                </div>`;
            stage.appendChild(device);
            weather = this._santaWeather = {
                stage,
                canvas,
                context: canvas.getContext('2d'),
                fog,
                frost,
                device,
                track: device.querySelector('.santa-thermometer-track'),
                handle: device.querySelector('.santa-temperature-handle'),
                valueLabel: device.querySelector('.santa-temperature-value'),
                temperature: 0.5,
                particles: [],
                waves: [],
                jingleAudio: new Audio('assets/sets/santa/Jingle bells.mp3'),
                windAudio: new Audio('assets/sets/santa/wind.mp3'),
                freezeAudio: null,
                freezeSoundPlayed: false,
                raf: null,
                lastTime: 0,
                frozen: false,
                freezing: false,
                freezeTimeout: null,
                originalPositionLock: window.physicsEngine?.isPositionLocked || false,
                blinkLoopPaused: false,
                dragging: false,
                resizeHandler: null,
                cleanup: null
            };
            weather.jingleAudio.loop = true;
            weather.windAudio.loop = true;
            if (!weather.context) {
                console.error('Could not create the Santa snowfall canvas context.');
                device.remove();
                canvas.remove();
                this._santaWeather = null;
                return;
            }

            const updateTemperatureFromPointer = event => {
                const rect = weather.track.getBoundingClientRect();
                if (!rect.height) return;
                weather.temperature = Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height));
                this._updateSantaTemperature(weather);
            };
            const onPointerDown = event => {
                event.preventDefault();
                event.stopPropagation();
                weather.dragging = true;
                try { device.setPointerCapture(event.pointerId); } catch (_) {}
                updateTemperatureFromPointer(event);
            };
            const onPointerMove = event => {
                if (!weather.dragging) return;
                updateTemperatureFromPointer(event);
                event.preventDefault();
            };
            const onPointerUp = event => {
                if (!weather.dragging) return;
                weather.dragging = false;
                try { device.releasePointerCapture(event.pointerId); } catch (_) {}
            };
            const onKeyDown = event => {
                let nextTemperature = weather.temperature;
                if (event.key === 'ArrowUp' || event.key === 'ArrowRight') nextTemperature += 0.05;
                else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') nextTemperature -= 0.05;
                else if (event.key === 'Home') nextTemperature = 0;
                else if (event.key === 'End') nextTemperature = 1;
                else return;
                event.preventDefault();
                weather.temperature = Math.max(0, Math.min(1, nextTemperature));
                this._updateSantaTemperature(weather);
            };
            device.addEventListener('pointerdown', onPointerDown);
            device.addEventListener('pointermove', onPointerMove);
            device.addEventListener('pointerup', onPointerUp);
            device.addEventListener('pointercancel', onPointerUp);
            weather.handle.addEventListener('keydown', onKeyDown);
            weather.resizeHandler = () => this._resizeSantaSnowfall(weather);
            window.addEventListener('resize', weather.resizeHandler);
            weather.cleanup = () => {
                device.removeEventListener('pointerdown', onPointerDown);
                device.removeEventListener('pointermove', onPointerMove);
                device.removeEventListener('pointerup', onPointerUp);
                device.removeEventListener('pointercancel', onPointerUp);
                weather.handle.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('resize', weather.resizeHandler);
            };
            this._resizeSantaSnowfall(weather);
        }

        weather.canvas.style.display = 'block';
        weather.fog.style.display = 'block';
        weather.frost.style.display = 'block';
        weather.device.style.display = 'flex';
        weather.device.style.visibility = 'visible';
        this._updateSantaTemperature(weather);
        if (weather.frozen) {
            this._stopSantaSnowfall(weather);
        } else {
            this._animateSantaSnowfall(weather);
        }
    }

    _updateSantaTemperature(weather) {
        const temperature = weather.temperature;
        const coldness = Math.max(0, Math.min(1, (0.5 - temperature) * 2));
        const snowIntensity = temperature >= 0.5
            ? (1 - temperature) * 0.7
            : 0.35 + coldness * 1.65;
        const wind = coldness * coldness;
        const visualColdness = Math.pow(coldness, 2.2);
        const shouldFreeze = temperature <= 0.005;
        const physics = window.physicsEngine;
        const degrees = Math.round(temperature <= 0.5
            ? temperature * 100 - 50
            : (temperature - 0.5) * 50);

        weather.device.style.setProperty('--temperature-level', `${(1 - temperature) * 100}%`);
        weather.device.querySelector('.santa-thermometer-fill').style.height = `${(1 - temperature) * 100}%`;
        weather.handle.style.top = `${(1 - temperature) * 100}%`;
        weather.handle.setAttribute('aria-valuenow', String(degrees));
        weather.valueLabel.textContent = `${degrees}°`;
        weather.canvas.dataset.intensity = String(snowIntensity);
        weather.canvas.dataset.wind = String(wind);
        weather.fog.style.opacity = String(coldness * 0.97);
        weather.fog.style.backdropFilter = `blur(${coldness * 13}px)`;
        weather.fog.style.setProperty('--santa-fog-opacity', String(coldness * 0.88));
        weather.stage.classList.toggle('santa-blizzard', coldness > 0);
        weather.stage.style.setProperty('--santa-character-saturation', String(1 - visualColdness * 0.55));
        weather.stage.style.setProperty('--santa-character-brightness', String(1 - visualColdness * 0.5));

        if (shouldFreeze && !weather.frozen && !weather.freezing) {
            weather.freezing = true;
            const { jingle, wind: windVolume } = this._getSantaMusicVolumes(temperature);
            weather.jingleAudio.volume = jingle;
            weather.windAudio.volume = windVolume;
            this._stopSantaMusic(weather);
            this._playSantaFreezeSound(weather);
            weather.stage.classList.add('santa-freezing');
            weather.canvas.classList.add('is-freezing');
            weather.fog.classList.add('is-freezing');
            weather.frost.classList.add('is-freezing');
            weather.canvas.style.opacity = '0';
            weather.fog.style.opacity = '0';
            weather.freezeTimeout = setTimeout(() => {
                weather.freezeTimeout = null;
                if (this.activeEffectId !== 'santa' || this.isPaused || weather.temperature > 0.005) return;
                weather.freezing = false;
                weather.frozen = true;
                weather.stage.classList.remove('santa-freezing');
                weather.stage.classList.add('santa-frozen');
                weather.canvas.classList.remove('is-freezing');
                weather.canvas.style.opacity = '0';
                weather.fog.classList.remove('is-freezing');
                weather.fog.style.opacity = '0';
                this._stopSantaSnowfall(weather);
                weather.context.clearRect(0, 0, weather.stage.clientWidth, weather.stage.clientHeight);
                if (physics) {
                    physics.stopWalking();
                    if (physics.walkTimer) {
                        clearTimeout(physics.walkTimer);
                        physics.walkTimer = null;
                    }
                    physics.isPositionLocked = true;
                }
                if (window.characterModel && window.gameEngine?.running && !weather.blinkLoopPaused) {
                    window.characterModel.stopBlinkLoop();
                    document.querySelectorAll('.mv-part-eyes').forEach(element => {
                        element.style.opacity = '1';
                    });
                    weather.blinkLoopPaused = true;
                }
            }, 2000);
        } else if (!shouldFreeze && (weather.freezing || weather.frozen)) {
            clearTimeout(weather.freezeTimeout);
            weather.freezeTimeout = null;
            const wasFrozen = weather.frozen;
            weather.freezing = false;
            weather.frozen = false;
            weather.freezeSoundPlayed = false;
            weather.stage.classList.remove('santa-freezing', 'santa-frozen');
            weather.canvas.classList.remove('is-freezing');
            weather.canvas.style.opacity = '1';
            weather.fog.classList.remove('is-freezing');
            weather.fog.style.opacity = String(coldness * 0.93);
            weather.frost.classList.remove('is-freezing');
            weather.frost.classList.add('is-thawing');
            setTimeout(() => weather.frost.classList.remove('is-thawing'), 1200);
            if (physics && wasFrozen) {
                physics.isPositionLocked = weather.originalPositionLock;
                if (!physics.isPositionLocked && window.gameEngine?.running && !physics.walkActive && !physics.walkTimer) {
                    physics.scheduleWalk();
                }
            }
            if (window.characterModel && window.gameEngine?.running && weather.blinkLoopPaused) {
                window.characterModel.startBlinkLoop();
                weather.blinkLoopPaused = false;
            }
        }

        if (physics && !shouldFreeze && !weather.freezing && !weather.frozen) {
            physics.isPositionLocked = weather.originalPositionLock;
            if (!physics.isPositionLocked && window.gameEngine?.running && !physics.walkActive && !physics.walkTimer) {
                physics.scheduleWalk();
            }
        }
        if (weather.frozen || weather.freezing) {
            if (window.characterModel && window.gameEngine?.running && weather.frozen && !weather.blinkLoopPaused) {
                window.characterModel.stopBlinkLoop();
                document.querySelectorAll('.mv-part-eyes').forEach(element => {
                    element.style.opacity = '1';
                });
                weather.blinkLoopPaused = true;
            }
        }

        if (weather.frozen) this._stopSantaSnowfall(weather);
        else if (!this.isPaused) {
            this._animateSantaSnowfall(weather);
            if (!weather.freezing) this._updateSantaMusic(weather);
        }
    }

    _updateSantaMusic(weather) {
        if (!weather || weather.freezing || weather.frozen || this.isPaused) return;
        const { jingle, wind } = this._getSantaMusicVolumes(weather.temperature);
        weather.jingleAudio.volume = jingle;
        weather.windAudio.volume = wind;
        for (const audio of [weather.jingleAudio, weather.windAudio]) {
            if (audio.paused) {
                const playback = audio.play();
                if (playback) playback.catch(error => console.warn(`Could not play Santa audio "${audio.src}":`, error));
            }
        }
    }

    _getSantaMusicVolumes(temperature) {
        const level = Math.max(0, Math.min(1, temperature));
        return {
            jingle: level <= 0.5 ? level * 0.5 : 0.25 + (level - 0.5) * 1.5,
            wind: level <= 0.5 ? 1 - level * 1.8 : (1 - level) * 0.2
        };
    }

    _stopSantaMusic(weather) {
        if (!weather) return;
        weather.jingleAudio.pause();
        weather.windAudio.pause();
        weather.jingleAudio.currentTime = 0;
        weather.windAudio.currentTime = 0;
    }

    _playSantaFreezeSound(weather) {
        if (weather.freezeSoundPlayed) return;
        weather.freezeSoundPlayed = true;
        const audio = new Audio('assets/sets/santa/freezing-g-effect.mp3');
        audio.volume = 1;
        weather.freezeAudio = audio;
        const playback = audio.play();
        if (playback) playback.catch(error => console.warn(`Could not play Santa freeze audio "${audio.src}":`, error));
    }

    _resizeSantaSnowfall(weather) {
        const width = weather.stage.clientWidth;
        const height = weather.stage.clientHeight;
        const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
        weather.canvas.width = Math.round(width * pixelRatio);
        weather.canvas.height = Math.round(height * pixelRatio);
        weather.canvas.style.width = `${width}px`;
        weather.canvas.style.height = `${height}px`;
        weather.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    _animateSantaSnowfall(weather) {
        if (weather.raf !== null || weather.frozen || this.isPaused) return;
        const frame = timestamp => {
            weather.raf = null;
            if (this.activeEffectId !== 'santa' || this.isPaused || weather.frozen || !weather.canvas.isConnected) return;

            const width = weather.stage.clientWidth;
            const height = weather.stage.clientHeight;
            const context = weather.context;
            const delta = weather.lastTime ? Math.min(0.05, (timestamp - weather.lastTime) / 1000) : 0.016;
            const intensity = Number(weather.canvas.dataset.intensity) || 0;
            const wind = Number(weather.canvas.dataset.wind) || 0;
            const targetCount = Math.min(760, Math.round(intensity * 360));
            const windSpeed = wind * (160 + intensity * 1800);
            const fallSpeed = Math.max(24, (55 + intensity * 70) * (1 - wind * 0.88));
            weather.lastTime = timestamp;

            while (weather.particles.length < targetCount) {
                weather.particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    sizeFactor: 0.5 + Math.random(),
                    speedFactor: 0.65 + Math.random() * 0.7,
                    phase: Math.random() * Math.PI * 2
                });
            }
            if (weather.particles.length > targetCount) weather.particles.length = targetCount;

            context.clearRect(0, 0, width, height);
            context.fillStyle = 'rgba(245, 250, 255, 0.88)';
            for (const flake of weather.particles) {
                flake.radius = (1.2 + intensity * 3.2) * flake.sizeFactor;
                flake.speed = fallSpeed * flake.speedFactor;
                flake.phase += delta * (1.2 + wind * 2);
                flake.x += (-windSpeed + Math.sin(flake.phase) * (8 + wind * 16)) * delta;
                flake.y += flake.speed * delta;
                if (flake.y > height + flake.radius) {
                    flake.y = -flake.radius;
                    flake.x = Math.random() * width;
                }
                if (flake.x < -flake.radius) {
                    flake.x = width + flake.radius;
                    flake.y = Math.random() * height;
                }
                context.beginPath();
                context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                context.fill();
            }

            if (wind > 0.06) {
                context.beginPath();
                context.strokeStyle = `rgba(232, 245, 255, ${0.12 + wind * 0.32})`;
                context.lineWidth = 1 + wind * 2.4;
                const waveCount = Math.round(3 + wind * 9);
                while (weather.waves.length < waveCount) {
                    const index = weather.waves.length;
                    const laneGap = height / waveCount;
                    weather.waves.push({
                        lane: index,
                        x: ((index + Math.random() * 0.3) / waveCount) * width,
                        y: (index + 0.5) * laneGap + (Math.random() - 0.5) * laneGap * 0.28,
                        speed: 110 + Math.random() * 250,
                        length: 70 + Math.random() * 110,
                        amplitude: 4 + Math.random() * 9
                    });
                }
                weather.waves.length = waveCount;
                for (const wave of weather.waves) {
                    wave.x -= wave.speed * (0.35 + wind) * delta;
                    const length = wave.length * (0.8 + wind * 1.6);
                    const waveHeight = wave.amplitude * (0.7 + wind * 1.8);
                    if (wave.x + length < 0) {
                        wave.x = width + 60 + Math.random() * 240;
                        const laneGap = height / waveCount;
                        wave.y = (wave.lane + 0.5) * laneGap + (Math.random() - 0.5) * laneGap * 0.28;
                        wave.speed = 110 + Math.random() * 250;
                    }
                    context.moveTo(wave.x, wave.y);
                    context.bezierCurveTo(
                        wave.x + length * 0.28, wave.y - waveHeight,
                        wave.x + length * 0.68, wave.y + waveHeight,
                        wave.x + length, wave.y
                    );
                }
                context.stroke();
            }

            weather.raf = requestAnimationFrame(frame);
        };
        weather.raf = requestAnimationFrame(frame);
    }

    _stopSantaSnowfall(weather) {
        if (weather.raf !== null) {
            cancelAnimationFrame(weather.raf);
            weather.raf = null;
        }
        weather.lastTime = 0;
    }

    _pauseSantaEffect() {
        const weather = this._santaWeather;
        if (!weather) return;
        this._stopSantaSnowfall(weather);
        this._stopSantaMusic(weather);
        if (weather.freezing) {
            clearTimeout(weather.freezeTimeout);
            weather.freezeTimeout = null;
            weather.freezing = false;
            weather.stage.classList.remove('santa-freezing');
            weather.canvas.classList.remove('is-freezing');
            weather.canvas.style.opacity = '1';
            weather.fog.classList.remove('is-freezing');
            weather.frost.classList.remove('is-freezing');
            weather.fog.style.opacity = String(Math.max(0, Math.min(1, (0.5 - weather.temperature) * 2)) * 0.97);
        }
    }

    _stopSantaEffect() {
        const weather = this._santaWeather;
        if (!weather) return;
        this._stopSantaSnowfall(weather);
        this._stopSantaMusic(weather);
        if (weather.freezeAudio) {
            weather.freezeAudio.pause();
            weather.freezeAudio.currentTime = 0;
            weather.freezeAudio = null;
        }
        clearTimeout(weather.freezeTimeout);
        weather.cleanup?.();
        weather.stage.classList.remove('santa-frozen', 'santa-freezing', 'santa-blizzard');
        weather.stage.style.removeProperty('--santa-character-saturation');
        weather.stage.style.removeProperty('--santa-character-brightness');
        weather.device.remove();
        weather.canvas.remove();
        if (window.physicsEngine) {
            window.physicsEngine.isPositionLocked = weather.originalPositionLock;
            if (!weather.originalPositionLock && window.gameEngine?.running) {
                window.physicsEngine.scheduleWalk();
            }
        }
        if (weather.blinkLoopPaused && window.characterModel && window.gameEngine?.running) {
            window.characterModel.startBlinkLoop();
        }
        this._santaWeather = null;
    }

    _startBatmanEffect() {
        const stage = this._getStage();
        const boss = document.getElementById('game-boss-container');
        if (!stage || !boss) return;
        if (!this._batmanSignal?.hasEntered) boss.classList.add('batman-character-hidden');
        let signal = this._batmanSignal;
        if (!signal || !signal.el.isConnected) {
            const rig = document.createElement('div');
            rig.id = 'batman-signal-rig';
            rig.className = 'batman-signal-rig';
            rig.innerHTML = `
                <div class="batman-signal-device" aria-label="Bat signal projector">
                    <img class="batman-signal-base" src="assets/sets/batman/device bottom part.png" alt="" draggable="false">
                    <img class="batman-signal-upper" src="assets/sets/batman/device upper part.png" alt="" draggable="false">
                    <span class="batman-signal-control-panel">
                        <button class="batman-signal-power" type="button" aria-label="Turn on bat signal" aria-pressed="false" title="Turn on bat signal"><span></span></button>
                    </span>
                </div>`;
            stage.appendChild(rig);
            const projection = document.createElement('div');
            projection.className = 'batman-signal-projection';
            projection.setAttribute('aria-hidden', 'true');
            projection.innerHTML = `
                <div class="batman-signal-beam"></div>
                <img class="batman-signal-logo" src="assets/sets/batman/batman logo.png" alt="" draggable="false">`;
            stage.appendChild(projection);
            const swarm = document.createElement('div');
            swarm.id = 'batman-bats-container';
            swarm.className = 'batman-bats-container';
            swarm.setAttribute('aria-hidden', 'true');
            stage.appendChild(swarm);
            signal = this._batmanSignal = {
                el: rig,
                projection,
                swarm,
                beam: projection.querySelector('.batman-signal-beam'),
                logo: projection.querySelector('.batman-signal-logo'),
                toggle: rig.querySelector('.batman-signal-power'),
                upper: rig.querySelector('.batman-signal-upper'),
                targetX: stage.clientWidth * 0.42,
                targetY: stage.clientHeight * 0.22,
                isOn: false,
                hasEntered: false,
                isDragging: false,
                bats: [],
                giantBat: null,
                cleanup: null
            };
            const updateProjection = () => {
                const sourceX = 189;
                const sourceY = stage.clientHeight - 190;
                signal.targetX = Math.max(sourceX + 70, Math.min(stage.clientWidth - 24, signal.targetX));
                signal.targetY = Math.max(20, Math.min(stage.clientHeight * 0.5 - 8, signal.targetY));
                const dx = signal.targetX - sourceX;
                const dy = signal.targetY - sourceY;
                const length = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                rig.style.setProperty('--device-angle', `${angle + 10}deg`);
                projection.style.left = `${sourceX}px`;
                projection.style.top = `${sourceY}px`;
                projection.style.setProperty('--signal-angle', `${angle}deg`);
                projection.style.setProperty('--signal-length', `${length}px`);
            };
            const onDown = event => {
                if (!signal.isOn) return;
                event.preventDefault();
                event.stopPropagation();
                signal.isDragging = true;
                const rect = stage.getBoundingClientRect();
                signal.dragOffsetX = signal.targetX - (event.clientX - rect.left);
                signal.dragOffsetY = signal.targetY - (event.clientY - rect.top);
                projection.classList.add('is-dragging');
                try { stage.setPointerCapture(event.pointerId); } catch (_) {}
            };
            const onMove = event => {
                if (!signal.isDragging) return;
                const rect = stage.getBoundingClientRect();
                signal.targetX = event.clientX - rect.left + signal.dragOffsetX;
                signal.targetY = event.clientY - rect.top + signal.dragOffsetY;
                updateProjection();
                event.preventDefault();
            };
            const onUp = event => {
                if (!signal.isDragging) return;
                signal.isDragging = false;
                projection.classList.remove('is-dragging');
                try { stage.releasePointerCapture(event.pointerId); } catch (_) {}
            };
            const setPower = isOn => {
                signal.isOn = isOn;
                rig.classList.toggle('is-on', isOn);
                projection.style.display = isOn ? 'block' : 'none';
                projection.classList.toggle('is-on', isOn);
                signal.toggle.setAttribute('aria-pressed', String(isOn));
                signal.toggle.setAttribute('aria-label', isOn ? 'Turn off bat signal' : 'Turn on bat signal');
                signal.toggle.title = isOn ? 'Turn off bat signal' : 'Turn on bat signal';
                try {
                    const deviceSound = new Audio('assets/sets/batman/device off on sound.mp3');
                    deviceSound.volume = 0.7;
                    deviceSound.play().catch(() => {});
                } catch (e) {}
                if (isOn) {
                    if (!signal.hasEntered) boss.classList.add('batman-character-hidden');
                    this._batmanTimeout = setTimeout(() => {
                        this._batmanTimeout = null;
                        if (signal.isOn && !this.isPaused) this._startBatmanBatWave();
                    }, 5000);
                } else {
                    clearTimeout(this._batmanTimeout);
                    this._batmanTimeout = null;
                    if (this._batmanRaf) cancelAnimationFrame(this._batmanRaf);
                    this._batmanRaf = null;
                    signal.bats = [];
                    signal.swarm.replaceChildren();
                    this._stopEffectAudio();
                }
            };
            signal.toggle.addEventListener('mousedown', event => event.stopPropagation());
            signal.toggle.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
            signal.toggle.addEventListener('pointerdown', event => event.stopPropagation());
            signal.toggle.addEventListener('click', () => setPower(!signal.isOn));
            projection.querySelectorAll('.batman-signal-beam, .batman-signal-logo').forEach(target => {
                target.addEventListener('pointerdown', onDown);
            });
            stage.addEventListener('pointermove', onMove);
            stage.addEventListener('pointerup', onUp);
            stage.addEventListener('pointercancel', onUp);
            signal.cleanup = () => {
                projection.querySelectorAll('.batman-signal-beam, .batman-signal-logo').forEach(target => {
                    target.removeEventListener('pointerdown', onDown);
                });
                stage.removeEventListener('pointermove', onMove);
                stage.removeEventListener('pointerup', onUp);
                stage.removeEventListener('pointercancel', onUp);
            };
            signal.setPower = setPower;
            signal.updateProjection = updateProjection;
        }
        signal.el.style.display = 'block';
        signal.projection.style.display = signal.isOn ? 'block' : 'none';
        signal.projection.classList.toggle('is-on', signal.isOn);
        signal.swarm.style.display = 'block';
        signal.updateProjection();
        if (signal.isOn) {
            signal.projection.style.display = 'block';
            if (signal.bats.length) this._animateBatmanBatWave();
            else if (!signal.hasEntered && !this._batmanTimeout) {
                boss.classList.add('batman-character-hidden');
                this._batmanTimeout = setTimeout(() => {
                    this._batmanTimeout = null;
                    if (signal.isOn && !this.isPaused) this._startBatmanBatWave();
                }, 5000);
            }
        }
    }

    _startBatmanBatWave() {
        const signal = this._batmanSignal;
        const stage = this._getStage();
        if (!signal || !stage || !signal.isOn) return;
        this._playEffectAudio('assets/sets/batman/bats sound.mp3', false, 0.75);
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const frames = [1, 2, 3].map(frame => `assets/sets/batman/batt frame${frame}.png`);
        const count = Math.max(26, Math.min(42, Math.round(width * height / 35000)));
        signal.swarm.replaceChildren();
        signal.bats = [];
        signal.giantBat?.el.remove();
        signal.giantBat = null;
        signal.hasEntered = false;
        for (let index = 0; index < count; index++) {
            const size = 175 + Math.random() * 165;
            const bat = document.createElement('img');
            bat.className = 'batman-bat';
            bat.src = frames[index % frames.length];
            bat.alt = '';
            bat.draggable = false;
            const x = -size - Math.random() * width * 0.28;
            const y = (index / count) * height + (Math.random() - 0.5) * height * 0.1;
            const speed = 850 + Math.random() * 500;
            bat.style.width = `${size}px`;
            bat.style.height = `${size}px`;
            bat.style.opacity = `${0.62 + Math.random() * 0.38}`;
            signal.swarm.appendChild(bat);
            signal.bats.push({ el: bat, x, y, size, speed, frame: index % frames.length, frameTime: Math.random() * 0.12, revealed: false });
        }
        this._animateBatmanBatWave();
    }

    _animateBatmanBatWave() {
        const signal = this._batmanSignal;
        const stage = this._getStage();
        const boss = document.getElementById('game-boss-container');
        if (!signal || !stage || !boss || !signal.bats.length || !signal.isOn) return;
        let previousTime = performance.now();
        const revealAtMidpoint = () => {
            if (signal.hasEntered) return;
            signal.hasEntered = true;
            boss.classList.remove('batman-character-hidden');
            boss.classList.add('batman-character-entering');
            const revealTimer = setTimeout(() => boss.classList.replace('batman-character-entering', 'batman-character-revealed'), 1350);
            this._timers.push(revealTimer);
        };
        const addScreenCoveringBat = () => {
            if (signal.giantBat) return;
            const size = Math.max(stage.clientWidth, stage.clientHeight) * 1.7;
            const bat = document.createElement('img');
            bat.className = 'batman-bat batman-bat-screen-cover';
            bat.src = 'assets/sets/batman/batt frame1.png';
            bat.alt = '';
            bat.draggable = false;
            bat.style.width = `${size}px`;
            bat.style.height = `${size}px`;
            signal.swarm.appendChild(bat);
            signal.giantBat = {
                el: bat,
                x: -size * 0.5,
                y: stage.clientHeight * 0.5,
                size,
                speed: Math.max(stage.clientWidth * 1.6, 1100),
                frame: 0,
                frameTime: 0
            };
        };
        const tick = now => {
            if (this.activeEffectId !== 'batman' || this.isPaused || !signal.isOn) return;
            const dt = Math.min(0.04, (now - previousTime) / 1000);
            previousTime = now;
            let remaining = 0;
            for (const bat of signal.bats) {
                if (bat.x < stage.clientWidth + bat.size) {
                    bat.x += bat.speed * dt;
                    remaining++;
                    bat.frameTime += dt;
                    if (bat.frameTime >= 0.12) {
                        bat.frameTime = 0;
                        bat.frame = (bat.frame + 1) % 3;
                        bat.el.src = `assets/sets/batman/batt frame${bat.frame + 1}.png`;
                    }
                    bat.el.style.left = `${bat.x}px`;
                    bat.el.style.top = `${bat.y}px`;
                    if (!bat.revealed && bat.x + bat.size / 2 >= stage.clientWidth * 0.5) {
                        bat.revealed = true;
                        addScreenCoveringBat();
                    }
                }
            }
            if (signal.giantBat) {
                const giant = signal.giantBat;
                giant.x += giant.speed * dt;
                giant.frameTime += dt;
                if (giant.frameTime >= 0.14) {
                    giant.frameTime = 0;
                    giant.frame = (giant.frame + 1) % 3;
                    giant.el.src = `assets/sets/batman/batt frame${giant.frame + 1}.png`;
                }
                giant.el.style.left = `${giant.x}px`;
                giant.el.style.top = `${giant.y}px`;
                if (!signal.hasEntered && giant.x >= stage.clientWidth * 0.5) revealAtMidpoint();
                if (giant.x > stage.clientWidth + giant.size * 0.5) {
                    giant.el.remove();
                    signal.giantBat = null;
                }
            }
            if (remaining || signal.giantBat) this._batmanRaf = requestAnimationFrame(tick);
            else {
                signal.bats = [];
                signal.swarm.replaceChildren();
                this._batmanRaf = null;
            }
        };
        this._batmanRaf = requestAnimationFrame(tick);
    }

    _stopBatmanEffect() {
        const signal = this._batmanSignal;
        clearTimeout(this._batmanTimeout);
        this._batmanTimeout = null;
        if (this._batmanRaf) cancelAnimationFrame(this._batmanRaf);
        this._batmanRaf = null;
        signal?.cleanup?.();
        signal?.el?.remove();
        signal?.projection?.remove();
        signal?.swarm?.remove();
        signal?.giantBat?.el?.remove();
        this._batmanSignal = null;
        const boss = document.getElementById('game-boss-container');
        boss?.classList.remove('batman-character-hidden', 'batman-character-entering', 'batman-character-revealed');
    }

    _startLatamanEffect() {
        const stage = this._getStage();
        const boss = document.getElementById('game-boss-container');
        if (!stage || !boss) return;

        let speaker = this._latamanSpeaker;
        if (!speaker || !speaker.el.isConnected) {
            const rig = document.createElement('div');
            rig.id = 'lataman-speaker-rig';
            rig.className = 'lataman-speaker-rig';
            rig.innerHTML = `
                <div class="lataman-speaker-device">
                    <img class="lataman-pole" src="assets/sets/lataman/pole.png" alt="" draggable="false">
                    <span class="lataman-speakers-wrap">
                        <img class="lataman-speakers" src="assets/sets/lataman/speakers.png" alt="" draggable="false">
                    </span>
                    <span class="lataman-speaker-control-panel batman-signal-control-panel">
                        <button class="batman-signal-power" type="button" aria-label="Turn on speakers" aria-pressed="false" title="Turn on speakers"><span></span></button>
                    </span>
                </div>`;
            stage.appendChild(rig);
            speaker = this._latamanSpeaker = {
                el: rig,
                toggle: rig.querySelector('.batman-signal-power'),
                isOn: false,
                setPower: null
            };

            const setPower = isOn => {
                speaker.isOn = isOn;
                rig.classList.toggle('is-on', isOn);
                speaker.toggle.setAttribute('aria-pressed', String(isOn));
                speaker.toggle.setAttribute('aria-label', isOn ? 'Turn off speakers' : 'Turn on speakers');
                speaker.toggle.title = isOn ? 'Turn off speakers' : 'Turn on speakers';

                if (isOn) {
                    if (!this._latamanHasFallen) {
                        boss.classList.add('lataman-character-hidden', 'lataman-character-sequence');
                        document.getElementById('game-speech-bubble')?.classList.remove('visible');
                    }
                    this._playEffectAudio('assets/sets/lataman/lataman music.mp3', true, 0.55);
                    this._startLatamanSequence(speaker, boss);
                } else {
                    this._stopEffectAudio();
                    if (!this._latamanFallInProgress) {
                        this._clearLatamanSequenceTimers();
                        this._stopLatamanTransientAudio();
                    }
                }
                this._playLatamanOneShot('assets/sets/lataman/speaker button click.mp3', 0.7);
            };

            for (const eventName of ['mousedown', 'pointerdown']) {
                speaker.toggle.addEventListener(eventName, event => event.stopPropagation());
            }
            speaker.toggle.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
            speaker.toggle.addEventListener('click', () => setPower(!speaker.isOn));
            speaker.setPower = setPower;
        }

        speaker.el.style.display = 'block';
        if (!this._latamanHasFallen && !this._latamanFallInProgress) {
            boss.classList.add('lataman-character-hidden', 'lataman-character-sequence');
            document.getElementById('game-speech-bubble')?.classList.remove('visible');
        }
        if (speaker.isOn) {
            this._playEffectAudio('assets/sets/lataman/lataman music.mp3', true, 0.55);
            this._startLatamanSequence(speaker, boss);
        }
    }

    _startLatamanSequence(speaker, boss) {
        if (!speaker.isOn || this._latamanHasFallen || this._latamanFallInProgress) return;
        this._clearLatamanSequenceTimers();

        this._latamanSequenceTimeout = setTimeout(() => {
            this._latamanSequenceTimeout = null;
            if (this.isPaused || !speaker.isOn) return;
            this._playLatamanOneShot('assets/sets/lataman/falling.mp3', 0.85);
            this._latamanSequenceTimeout = setTimeout(() => {
                this._latamanSequenceTimeout = null;
                if (!this.isPaused && speaker.isOn) this._beginLatamanFall(boss);
            }, 5000);
        }, 5000);
    }

    _beginLatamanFall(boss) {
        const stage = this._getStage();
        if (!stage || !boss || this._latamanHasFallen) return;

        const physics = window.physicsEngine;
        if (physics) {
            physics.stopWalking();
            if (physics.walkTimer) {
                clearTimeout(physics.walkTimer);
                physics.walkTimer = null;
            }
            physics.cancelDrag();
            physics.x = stage.clientWidth / 2;
            physics.vx = 0;
            physics.applyTransform();
        }

        this._latamanFallInProgress = true;
        boss.classList.remove('lataman-character-hidden', 'lataman-standing-up');
        boss.classList.add('lataman-character-falling');
        this._latamanImpactTimeout = setTimeout(() => {
            this._latamanImpactTimeout = null;
            if (this.isPaused || this.activeEffectId !== 'lataman') return;

            boss.classList.remove('lataman-character-falling');
            boss.classList.add('lataman-character-under');
            this._playLatamanOneShot('assets/sets/lataman/hit ground.mp3', 0.9);
            const dust = document.createElement('div');
            dust.className = 'lataman-dust-smoke';
            dust.setAttribute('aria-hidden', 'true');
            dust.style.backgroundImage = 'url("assets/sets/lataman/dust smoke frame1.png")';
            dust.style.backgroundPosition = '0% center';
            dust.style.left = `${stage.clientWidth / 2}px`;
            dust.style.top = `${stage.clientHeight * 0.46}px`;
            dust.style.height = `${stage.clientHeight * 1.5}px`;
            dust.style.width = `${stage.clientHeight}px`;
            stage.appendChild(dust);
            this._latamanDust = dust;

            let frame = 1;
            this._latamanDustInterval = setInterval(() => {
                if (!dust.isConnected || frame >= 3) {
                    clearInterval(this._latamanDustInterval);
                    this._latamanDustInterval = null;
                    return;
                }
                frame++;
                dust.style.backgroundImage = `url("assets/sets/lataman/dust smoke frame${frame}.png")`;
                dust.style.backgroundPosition = `${(frame - 1) * 50}% center`;
            }, 400);

            this._latamanFadeTimeout = setTimeout(() => {
                this._latamanFadeTimeout = null;
                dust.classList.add('is-fading');
                this._latamanRevealTimeout = setTimeout(() => {
                    this._latamanRevealTimeout = null;
                    clearInterval(this._latamanDustInterval);
                    this._latamanDustInterval = null;
                    dust.remove();
                    this._latamanDust = null;
                    boss.classList.remove('lataman-character-under');
                    boss.classList.remove('lataman-character-sequence');
                    boss.classList.add('lataman-standing-up');
                    this._latamanHasFallen = true;
                    this._latamanFallInProgress = false;
                    if (physics) physics.scheduleWalk();
                    this._latamanRevealTimeout = setTimeout(() => {
                        this._latamanRevealTimeout = null;
                        if (this.activeEffectId === 'lataman' && window.gameEngine) {
                            window.gameEngine.showSpeechBubble('ئاخخخخ ... خەریبوو بکەوم', 3200);
                        }
                    }, 700);
                }, 500);
            }, 1200);
        }, 850);
    }

    _playLatamanOneShot(src, volume) {
        try {
            const audio = new Audio(src);
            audio.volume = volume;
            this._latamanTransientAudio.push(audio);
            audio.addEventListener('ended', () => {
                this._latamanTransientAudio = this._latamanTransientAudio.filter(item => item !== audio);
            }, { once: true });
            const playback = audio.play();
            if (playback) playback.catch(error => console.warn(`Could not play Lataman audio "${src}":`, error));
        } catch (error) {
            console.warn(`Could not load Lataman audio "${src}":`, error);
        }
    }

    _stopLatamanTransientAudio() {
        for (const audio of this._latamanTransientAudio) {
            audio.pause();
        }
        this._latamanTransientAudio = [];
    }

    _clearLatamanSequenceTimers() {
        clearTimeout(this._latamanSequenceTimeout);
        clearTimeout(this._latamanImpactTimeout);
        clearTimeout(this._latamanFadeTimeout);
        clearTimeout(this._latamanRevealTimeout);
        clearInterval(this._latamanDustInterval);
        this._latamanSequenceTimeout = null;
        this._latamanImpactTimeout = null;
        this._latamanFadeTimeout = null;
        this._latamanRevealTimeout = null;
        this._latamanDustInterval = null;
    }

    _pauseLatamanEffect() {
        this._clearLatamanSequenceTimers();
        this._stopLatamanTransientAudio();
        if (this._latamanFallInProgress) {
            this._latamanDust?.remove();
            this._latamanDust = null;
            this._latamanFallInProgress = false;
            const boss = document.getElementById('game-boss-container');
            boss?.classList.remove('lataman-character-falling', 'lataman-character-under', 'lataman-standing-up');
            if (!this._latamanHasFallen) boss?.classList.add('lataman-character-hidden');
        }
    }

    _stopLatamanEffect() {
        this._clearLatamanSequenceTimers();
        this._stopLatamanTransientAudio();
        this._latamanDust?.remove();
        this._latamanDust = null;
        this._latamanSpeaker?.el?.remove();
        this._latamanSpeaker = null;
        this._latamanHasFallen = false;
        this._latamanFallInProgress = false;
        const boss = document.getElementById('game-boss-container');
        boss?.classList.remove('lataman-character-hidden', 'lataman-character-falling', 'lataman-character-under', 'lataman-character-sequence', 'lataman-standing-up');
    }

    notifyTerminatorHit() {
        if (this.activeEffectId !== 'terminator' || this.isPaused || !this._isRunning) return;
        this._terminatorHits++;
        if (this._terminatorStage === 0 && this._terminatorHits >= 20) {
            this._terminatorStage = 1;
            this._applyTerminatorState({ /*

        // =========================================================================
        // H. KURDISH - OIL LAMP NIGHT EFFECT
        // =========================================================================

        _startKurdishEffect() {
            const stage = this._getStage();
            const boss = document.getElementById('game-boss-container');
            if (!stage || !boss) return;

            this._playEffectAudio('assets/sets/kurdish/music.mp3', true, 0.5);

            const overlay = this._getOverlay();
            if (overlay) {
                overlay.style.display = 'block';
                overlay.className = 'legendary-dark-overlay effect-kurdish-overlay';
            }

            let shadow = document.getElementById('legendary-kurdish-shadow');
            if (!shadow) {
                shadow = document.createElement('div');
                shadow.id = 'legendary-kurdish-shadow';
                shadow.className = 'kurdish-character-shadow';
                shadow.innerHTML = boss.querySelector('.mv-character-composite')?.outerHTML || '';
                stage.insertBefore(shadow, boss);
            }
            shadow.style.display = 'block';
            this._kurdishShadow = shadow;

            let container = document.getElementById('legendary-kurdish-lamp');
            if (!container) {
                container = document.createElement('div');
                container.id = 'legendary-kurdish-lamp';
                container.className = 'kurdish-lamp-actor';
                container.innerHTML = '<img src="assets/sets/kurdish/on2.png" alt="" draggable="false">';
                stage.appendChild(container);
            }
            const image = container.querySelector('img');
            const stageRect = stage.getBoundingClientRect();
            const lampWidth = 112;
            const lampHeight = 156;
            const floorY = Math.max(lampHeight / 2, (stageRect.height || 600) - 76);
            const lamp = {
                el: container,
                image,
                x: (stageRect.width || 900) * 0.18,
                y: floorY,
                vx: 0,
                vy: 0,
                angle: 0,
                angularVelocity: 0,
                width: lampWidth,
                height: lampHeight,
                isGrabbed: false,
                isOn: true,
                grabWorldX: 0,
                grabWorldY: 0,
                localGrabX: 0,
                localGrabY: 0,
                lastDragX: 0,
                lastDragY: 0,
                pointerHistory: [],
                lastTime: performance.now(),
                cleanup: null
            };
            this._kurdishLamp = lamp;
            container.style.display = 'block';

            const setLampState = (isOn) => {
                lamp.isOn = isOn;
                if (lamp.image) lamp.image.src = `assets/sets/kurdish/${isOn ? 'on2' : 'off'}.png`;
            };
            const isUpright = () => {
                const normalized = ((lamp.angle % 360) + 360) % 360;
                return normalized <= 18 || normalized >= 342;
            };
            const updatePointerPosition = (event) => {
                const rect = stage.getBoundingClientRect();
                const px = event.clientX - rect.left;
                const py = event.clientY - rect.top;
                lamp.grabWorldX = px;
                lamp.grabWorldY = py;
                lamp.pointerHistory.push({ x: px, y: py, time: performance.now() });
                if (lamp.pointerHistory.length > 6) lamp.pointerHistory.shift();
            };
            const onPointerDown = (event) => {
                if (this.activeEffectId !== 'kurdish' || this.isPaused) return;
                event.preventDefault();
                event.stopPropagation();
                const rect = stage.getBoundingClientRect();
                const px = event.clientX - rect.left;
                const py = event.clientY - rect.top;
                lamp.isGrabbed = true;
                lamp.el.classList.add('is-grabbed');
                lamp.grabWorldX = px;
                lamp.grabWorldY = py;
                lamp.lastDragX = px;
                lamp.lastDragY = py;
                const radians = lamp.angle * Math.PI / 180;
                const dx = px - lamp.x;
                const dy = py - lamp.y;
                lamp.localGrabX = dx * Math.cos(radians) + dy * Math.sin(radians);
                lamp.localGrabY = -dx * Math.sin(radians) + dy * Math.cos(radians);
                lamp.pointerHistory = [{ x: px, y: py, time: performance.now() }];
                lamp.el.setPointerCapture?.(event.pointerId);
            };
            const onPointerMove = (event) => {
                if (!lamp.isGrabbed) return;
                event.preventDefault();
                event.stopPropagation();
                updatePointerPosition(event);
            };
            const onPointerUp = (event) => {
                if (!lamp.isGrabbed) return;
                lamp.isGrabbed = false;
                lamp.el.classList.remove('is-grabbed');
                lamp.el.releasePointerCapture?.(event.pointerId);
                const history = lamp.pointerHistory;
                if (history.length > 1) {
                    const first = history[0];
                    const last = history[history.length - 1];
                    const seconds = Math.max(0.015, (last.time - first.time) / 1000);
                    lamp.vx = Math.max(-1400, Math.min(1400, (last.x - first.x) / seconds));
                    lamp.vy = Math.max(-1400, Math.min(1400, (last.y - first.y) / seconds));
                    lamp.angularVelocity = lamp.vx * 0.35;
                }
                if (Math.abs(lamp.vx) > 80 || Math.abs(lamp.vy) > 80 || !isUpright()) setLampState(false);
            };
            container.addEventListener('pointerdown', onPointerDown);
            container.addEventListener('pointermove', onPointerMove);
            container.addEventListener('pointerup', onPointerUp);
            container.addEventListener('pointercancel', onPointerUp);
            lamp.cleanup = () => {
                container.removeEventListener('pointerdown', onPointerDown);
                container.removeEventListener('pointermove', onPointerMove);
                container.removeEventListener('pointerup', onPointerUp);
                container.removeEventListener('pointercancel', onPointerUp);
            };

            const renderLamp = () => {
                lamp.el.style.left = `${lamp.x}px`;
                lamp.el.style.top = `${lamp.y}px`;
                lamp.el.style.transform = `translate(-50%, -50%) rotate(${lamp.angle}deg)`;
            };
            const renderLighting = () => {
                if (!overlay) return;
                if (!lamp.isOn) {
                    overlay.style.background = 'rgba(0, 0, 0, 0.9)';
                    return;
                }
                const radius = 150 + Math.min(180, Math.hypot(lamp.vx, lamp.vy) * 0.05);
                overlay.style.background = `radial-gradient(circle at ${lamp.x}px ${lamp.y}px, rgba(0,0,0,0) 0 ${radius * 0.42}px, rgba(0,0,0,0.28) ${radius * 0.7}px, rgba(0,0,0,0.9) ${radius * 1.55}px), rgba(0,0,0,0.72)`;
            };
            const renderShadow = () => {
                if (!this._kurdishShadow) return;
                const bossRect = boss.getBoundingClientRect();
                const stageBounds = stage.getBoundingClientRect();
                const charX = bossRect.left - stageBounds.left + bossRect.width / 2;
                const charY = bossRect.top - stageBounds.top + bossRect.height * 0.75;
                const distance = Math.hypot(charX - lamp.x, charY - lamp.y);
                const direction = Math.sign(charX - lamp.x) || 1;
                const stretch = 1 + Math.min(0.8, distance / 900);
                const flatten = Math.max(0.22, 0.8 - distance / 900);
                this._kurdishShadow.style.left = `${boss.style.left || `${charX}px`}`;
                this._kurdishShadow.style.top = `${boss.style.top || `${charY}px`}`;
                this._kurdishShadow.style.transform = `${boss.style.transform || 'translate(-50%, -50%)'} translate(${direction * distance * 0.06}px, ${Math.min(48, distance * 0.04)}px)`;
                const composite = this._kurdishShadow.querySelector('.mv-character-composite');
                if (composite) composite.style.transform = `translateX(${direction * distance * 0.06}px) scale(${stretch}, ${flatten})`;
            };

            const physicsLoop = (now) => {
                if (this.activeEffectId !== 'kurdish' || this.isPaused || !this._kurdishLamp) return;
                const dt = Math.min(0.033, Math.max(0.001, (now - lamp.lastTime) / 1000));
                lamp.lastTime = now;
                const stageWidth = stage.clientWidth;
                const stageHeight = stage.clientHeight;
                const floorY = stageHeight - 76;
                if (!lamp.isGrabbed) {
                    lamp.vy += 2500 * dt;
                    lamp.x += lamp.vx * dt;
                    lamp.y += lamp.vy * dt;
                    lamp.angle += lamp.angularVelocity * dt;
                    lamp.angularVelocity *= 0.985;
                    if (lamp.y >= floorY) {
                        lamp.y = floorY;
                        if (Math.abs(lamp.vy) > 75) {
                            lamp.vy = -lamp.vy * 0.28;
                            lamp.vx *= 0.68;
                        } else {
                            lamp.vy = 0;
                            lamp.vx *= 0.78;
                            lamp.angularVelocity *= 0.72;
                            if (Math.abs(lamp.vx) < 5) lamp.vx = 0;
                            if (isUpright() && Math.abs(lamp.angularVelocity) < 35) setLampState(true);
                        }
                    }
                    if (lamp.x < 56 || lamp.x > stageWidth - 56) {
                        lamp.x = Math.max(56, Math.min(stageWidth - 56, lamp.x));
                        lamp.vx *= -0.5;
                        lamp.angularVelocity *= -0.5;
                    }
                } else {
                    const dragVx = (lamp.grabWorldX - lamp.lastDragX) / dt;
                    const dragVy = (lamp.grabWorldY - lamp.lastDragY) / dt;
                    lamp.lastDragX = lamp.grabWorldX;
                    lamp.lastDragY = lamp.grabWorldY;
                    lamp.angle = Math.max(-75, Math.min(75, dragVx * 0.035));
                    lamp.angularVelocity = 0;
                    const radians = lamp.angle * Math.PI / 180;
                    lamp.x = lamp.grabWorldX - (lamp.localGrabX * Math.cos(radians) - lamp.localGrabY * Math.sin(radians));
                    lamp.y = lamp.grabWorldY - (lamp.localGrabX * Math.sin(radians) + lamp.localGrabY * Math.cos(radians));
                    lamp.vx = dragVx;
                    lamp.vy = dragVy;
                    setLampState(isUpright());
                }
                renderLamp();
                renderLighting();
                renderShadow();
                this._rafs.push(requestAnimationFrame(physicsLoop));
            };
            renderLamp();
            renderLighting();
            renderShadow();
            this._rafs.push(requestAnimationFrame(physicsLoop));
        }

        _stopKurdishEffect() {
            if (this._kurdishLamp?.cleanup) this._kurdishLamp.cleanup();
            if (this._kurdishLampContainer) this._kurdishLampContainer.remove();
            if (this._kurdishLamp?.el) this._kurdishLamp.el.remove();
            if (this._kurdishShadow) this._kurdishShadow.remove();
            this._kurdishLamp = null;
            this._kurdishLampContainer = null;
            this._kurdishShadow = null;
            const overlay = this._getOverlay();
            if (overlay) overlay.style.background = '';
        } */
            bodys: '7.png', head_shapes: '1.png', haires: null, eyeborws: '1.png', eyes: '1.png',
                noses: '280.png', mouths: '1.png', ears: '99.png', facials: '1.png',
                head_enquipments: '5.png', body_enquipments: null
            });
            this._playTerminatorSound('electric.mp3');
            this._showTerminatorElectric();
        } else if (this._terminatorStage === 1 && this._terminatorHits >= 50) {
            this._terminatorStage = 2;
            this._applyTerminatorState({
                bodys: '8.png', head_shapes: '3.png', haires: null, eyeborws: null, eyes: null,
                noses: null, mouths: null, ears: null, facials: '1.png',
                head_enquipments: null, body_enquipments: null
            });
            this._playTerminatorSound('electric.mp3');
            this._showTerminatorElectric();
        }
        this._updateTerminatorRepairVisibility();
    }

    _matchesTerminatorStage(state) {
        const stageItems = this._terminatorStage === 1 ? {
            bodys: '7.png', head_shapes: '1.png', haires: null, eyeborws: '1.png', eyes: '1.png', noses: '280.png', mouths: '1.png', ears: '99.png', facials: '1.png', head_enquipments: '5.png', body_enquipments: null
        } : {
            bodys: '8.png', head_shapes: '3.png', haires: null, eyeborws: null, eyes: null, noses: null, mouths: null, ears: null, facials: '1.png', head_enquipments: null, body_enquipments: null
        };
        return Object.entries(stageItems).every(([category, file]) => state[category] === file);
    }

    _applyTerminatorState(nextState) {
        window.characterModel.state = { ...window.characterModel.state, ...nextState };
        window.characterModel.saveState();
        window.characterModel.render(document.getElementById('game-boss-container'));
    }

    _updateTerminatorRepairVisibility() {
        const repairEl = document.getElementById('legendary-terminator-repair');
        if (repairEl) repairEl.style.display = this._terminatorStage > 0 ? 'block' : 'none';
    }

    _repairTerminator() {
        if (this.activeEffectId !== 'terminator' || !this._terminatorOriginalState) return;
        this._applyTerminatorState(this._terminatorOriginalState);
        this._terminatorHits = 0;
        this._terminatorStage = 0;
        this._playTerminatorSound('i-m-back.mp3');
        this._showTerminatorElectric();
        this._updateTerminatorRepairVisibility();
    }

    _playTerminatorSound(file) {
        try {
            const sound = new Audio(`assets/sets/terminator/${file}`);
            sound.volume = 0.8;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    _showTerminatorElectric() {
        const electricEl = document.getElementById('legendary-terminator-electric');
        if (!electricEl) return;
        const boss = document.getElementById('game-boss-container');
        const character = boss && boss.querySelector('.mv-character-composite');
        if (character && electricEl.parentElement !== character) {
            character.appendChild(electricEl);
        }
        electricEl.style.left = '0';
        electricEl.style.top = '0';
        electricEl.style.width = '100%';
        electricEl.style.height = '100%';
        electricEl.style.inset = '0';
        electricEl.innerHTML = '<img src="assets/sets/terminator/electric.png" alt="" draggable="false">';
        electricEl.style.display = 'block';
        this._addTimer(setTimeout(() => { electricEl.style.display = 'none'; electricEl.innerHTML = ''; }, 1200));
    }

    _spawnTerminatorProjectile() {
        if (this.activeEffectId !== 'terminator' || this.isPaused) return;

        const roll = Math.random();
        if (roll < 0.48) {
            this._spawnTerminatorProjectileSingle();
            return;
        }

        const shotCount = roll < 0.76 ? 2 + Math.floor(Math.random() * 2) : 4 + Math.floor(Math.random() * 3);
        const shotDelay = roll < 0.76 ? 135 + Math.random() * 65 : 110 + Math.random() * 60;
        for (let shotIndex = 0; shotIndex < shotCount; shotIndex++) {
            this._addTimer(setTimeout(() => {
                this._spawnTerminatorProjectileSingle();
            }, shotIndex * shotDelay));
        }
    }

    _spawnTerminatorProjectileSingle() {
        if (this.activeEffectId !== 'terminator' || this.isPaused) return;
        const container = document.getElementById('legendary-terminator-bullets');
        const stage = this._getStage();
        if (!container || !stage) return;
        const weapons = [
            ['akm', 'akm/bullet.png', 'akm/akm_single_fire.mp3'],
            ['m4', 'm4/bullet.png', 'm4/m4_single_fire.mp3'],
            ['kar98k', 'kar98k/bullet.png', 'kar98k/kar98k.mp3'],
            ['pistol', 'pistol/bullet.png', 'pistol/pistol.mp3'],
            ['shotgun', 'shotgun/bullet.png', 'shotgun/shotgun.mp3']
        ];
        const [weapon, image, soundFile] = weapons[Math.floor(Math.random() * weapons.length)];
        const bullet = document.createElement('img');
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const stageRect = stage.getBoundingClientRect();
        const width = stageRect.width || 800;
        const height = stageRect.height || 600;
        const start = {
            left: { x: -80, y: Math.random() * height },
            right: { x: width + 80, y: Math.random() * height }
        }[side];
        const targetX = side === 'left' ? width * (0.45 + Math.random() * 0.45) : width * (0.1 + Math.random() * 0.45);
        const targetY = height * (0.12 + Math.random() * 0.76);
        const directionX = targetX - start.x;
        const directionY = targetY - start.y;
        const distance = Math.hypot(directionX, directionY) || 1;
        const travelScale = Math.max(width, height) * 1.6 / distance;
        bullet.className = 'terminator-projectile';
        bullet.src = `attaker/shooting/${image}`;
        bullet.alt = weapon;
        bullet.draggable = false;
        bullet.style.left = `${start.x}px`;
        bullet.style.top = `${start.y}px`;
        bullet.style.setProperty('--dx', `${directionX * travelScale}px`);
        bullet.style.setProperty('--dy', `${directionY * travelScale}px`);
        bullet.style.setProperty('--angle', `${Math.atan2(directionY, directionX) * 180 / Math.PI}deg`);
        bullet.style.animationDuration = `${0.45 + Math.random() * 0.35}s`;
        container.appendChild(bullet);
        this._playTerminatorShootingSound(soundFile);
        this._addTimer(setTimeout(() => bullet.remove(), 1400));
    }

    _playTerminatorShootingSound(file) {
        try {
            const sound = new Audio(`attaker/shooting/${file}`);
            sound.volume = 0.22;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    // =========================================================================
    // G. STIVE - MINECRAFT CHEST & BLOCKS SYSTEM
    // =========================================================================

    _startStiveEffect() {
        if (!this.placedBlocks) this.placedBlocks = [];
        this._playEffectAudio('assets/sets/stive/background music.mp3', true, 0.45);
        this._initStiveChest();
        this._initStiveBlocksModal();
        this._setupStageBlockPlacement();
    }

    _stopStiveEffect() {
        if (this._chestEl) this._chestEl.style.display = 'none';
        if (this._blocksModalEl) this._blocksModalEl.style.display = 'none';
        if (this._blocksContainerEl) {
            this._blocksContainerEl.style.display = 'none';
            this._blocksContainerEl.innerHTML = '';
        }
        if (this._ghostBlockEl) this._ghostBlockEl.style.display = 'none';
        this._clearAllBlocks();
        this.selectedBlock = null;
        this.isRemoveMode = false;
        if (this._stageBlockPlacementBound && this._stagePlacementHandler) {
            const stage = this._getStage();
            if (stage) {
                stage.removeEventListener('pointerdown', this._stagePlacementHandler, true);
                stage.removeEventListener('pointermove', this._stageMoveHandler);
            }
            this._stageBlockPlacementBound = false;
        }
    }

    _initStiveChest() {
        const stage = this._getStage();
        if (!stage) return;

        let chestEl = document.getElementById('legendary-stive-chest');
        if (!chestEl) {
            chestEl = document.createElement('div');
            chestEl.id = 'legendary-stive-chest';
            chestEl.className = 'stive-chest-container';
            chestEl.title = 'سندوقی ماینکرافت - کلیک بکە بۆ هەڵبژاردنی بلۆکەکان';
            chestEl.innerHTML = `<img id="stive-chest-img" src="assets/sets/stive/chest/frame1.png" alt="chest" draggable="false">`;
            stage.appendChild(chestEl);

            const chestImg = chestEl.querySelector('#stive-chest-img');
            let hoverTimer = null;
            let currentFrame = 1;
            let lastChestInteractionTime = 0;

            const setChestFrame = (frameNum) => {
                currentFrame = frameNum;
                if (chestImg) chestImg.src = `assets/sets/stive/chest/frame${frameNum}.png`;
            };

            const playChestSound = (file) => {
                try {
                    const sound = new Audio();
                    sound.src = encodeURI(`assets/sets/stive/${file}`);
                    sound.preload = 'auto';
                    sound.volume = 0.7;
                    sound.play().catch(() => {});
                } catch (e) {}
            };

            // Hover: animate frame1 -> frame2 -> frame3
            chestEl.addEventListener('mouseenter', () => {
                if (hoverTimer) clearInterval(hoverTimer);
                playChestSound('chest open.mp3');

                setChestFrame(1);
                hoverTimer = setTimeout(() => {
                    setChestFrame(2);
                    hoverTimer = setTimeout(() => {
                        setChestFrame(3);
                    }, 65);
                }, 65);
            });

            // Mouseout: animate frame3 -> frame2 -> frame1
            chestEl.addEventListener('mouseleave', () => {
                if (hoverTimer) clearInterval(hoverTimer);
                playChestSound('chest close.mp3');
                setChestFrame(3);
                hoverTimer = setTimeout(() => {
                    setChestFrame(2);
                    hoverTimer = setTimeout(() => {
                        setChestFrame(1);
                    }, 65);
                }, 65);
            });

            // Prevent event from triggering weapon attacks and play the chest sound
            chestEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            chestEl.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            const toggleChest = (e) => {
                e.stopPropagation();
                const now = performance.now();
                if (now - lastChestInteractionTime < 400) return;
                lastChestInteractionTime = now;
                this._toggleStiveBlocksModal();
            };

            // Support pointer and click delivery differences across browsers.
            chestEl.addEventListener('pointerdown', toggleChest);
            chestEl.addEventListener('click', toggleChest);
        }

        chestEl.style.display = 'block';
        this._chestEl = chestEl;
    }

    _initStiveBlocksModal() {
        let modalEl = document.getElementById('legendary-stive-blocks-modal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'legendary-stive-blocks-modal';
            modalEl.className = 'stive-blocks-modal';

            const blocksList = [
                { id: 'Grass_Block.webp', name: 'بلۆکی چیمەن (Grass Block)', file: 'Grass_Block.webp', isTorch: false },
                { id: 'Dirt.webp', name: 'خاک و قوڕ (Dirt)', file: 'Dirt.webp', isTorch: false },
                { id: 'Cobblestone.webp', name: 'کۆبلستۆن (Cobblestone)', file: 'Cobblestone.webp', isTorch: false },
                { id: 'Stone_Bricks.webp', name: 'خشتەی بەردین (Stone Bricks)', file: 'Stone_Bricks.webp', isTorch: false },
                { id: 'Bricks.webp', name: 'خشتەی سوور (Bricks)', file: 'Bricks.webp', isTorch: false },
                { id: 'Oak_Planks.webp', name: 'تەختەی دار (Oak Planks)', file: 'Oak_Planks.webp', isTorch: false },
                { id: 'Oak_Log.webp', name: 'قەدی دار (Oak Log)', file: 'Oak_Log.webp', isTorch: false },
                { id: 'Oak_Log_head.webp', name: 'سەری دار (Log Top)', file: 'Oak_Log_head.webp', isTorch: false },
                { id: 'Block_of_Diamond.webp', name: 'بلۆکی ئەڵماس (Diamond Block)', file: 'Block_of_Diamond.webp', isTorch: false },
                { id: 'Block_of_Gold.webp', name: 'بلۆکی ئاڵتون (Gold Block)', file: 'Block_of_Gold.webp', isTorch: false },
                { id: 'Crafting_Table.webp', name: 'مێزی دروستکردن (Crafting Table)', file: 'Crafting_Table.webp', isTorch: false },
                { id: 'Off_Furnace.webp', name: 'فڕن (Furnace)', file: 'Off_Furnace.webp', isTorch: false },
                { id: 'Bookshel.webp', name: 'کتێبخانە (Bookshelf)', file: 'Bookshel.webp', isTorch: false },
                { id: 'TNT.webp', name: 'تی ئێن تی (TNT)', file: 'TNT.webp', isTorch: false },
                { id: 'Glass.webp', name: 'شووشە (Glass)', file: 'Glass.webp', isTorch: false },
                { id: 'Hay_Bale.webp', name: 'کای گەنم (Hay Bale)', file: 'Hay_Bale.webp', isTorch: false },
                { id: 'Torch.webp', name: 'مەشخەڵ (Torch - تەنها سەر بلۆک)', file: 'Torch.webp', isTorch: true }
            ];

            modalEl.innerHTML = `
                <div class="stive-blocks-header">
                    <div class="stive-blocks-title">
                        <span>📦</span> سندوقی بلۆکەکانی ماینکرافت
                    </div>
                    <div class="stive-blocks-actions">
                        <button id="btn-stive-remove-mode" class="stive-modal-btn btn-remove" title="سڕینەوەی بلۆک بە کلیک">
                            🧹 سڕینەوە
                        </button>
                        <button id="btn-stive-clear-all" class="stive-modal-btn btn-clear" title="سڕینەوەی تەواوی بلۆکەکان">
                            🗑️ سڕینەوەی هەموو
                        </button>
                        <button id="btn-stive-close-modal" class="stive-modal-btn btn-close" title="داخستن">
                            ✖
                        </button>
                    </div>
                </div>
                <div class="stive-blocks-grid">
                    ${blocksList.map(b => `
                        <div class="stive-block-slot ${b.isTorch ? 'torch-slot' : ''}" data-file="${b.file}" title="${b.name}">
                            <img src="assets/sets/stive/blocks/${encodeURI(b.file)}" alt="${b.name}" draggable="false">
                            <span class="stive-block-label">${b.name.split(' ')[0]}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="stive-blocks-footer">
                    <span id="stive-active-status">بلۆکێک هەڵبژێرە بۆ دانان لەسەر شاشە</span>
                </div>
            `;

            // Block slot click listener
            modalEl.querySelectorAll('.stive-block-slot').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const file = slot.dataset.file;
                    const blockInfo = blocksList.find(b => b.file === file);
                    this.selectedBlock = blockInfo;
                    this.isRemoveMode = false;

                    modalEl.querySelectorAll('.stive-block-slot').forEach(s => s.classList.remove('active'));
                    slot.classList.add('active');

                    const removeBtn = modalEl.querySelector('#btn-stive-remove-mode');
                    if (removeBtn) removeBtn.classList.remove('active');

                    const statusEl = modalEl.querySelector('#stive-active-status');
                    if (statusEl) statusEl.textContent = `بلۆکی دیاریکراو: ${blockInfo.name} - کلیک بکە لەسەر شاشە بۆ دانان`;

                    this._updateGhostPreview();
                });
            });

            // Remove mode toggle
            const removeBtn = modalEl.querySelector('#btn-stive-remove-mode');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.isRemoveMode = !this.isRemoveMode;
                    if (this.isRemoveMode) {
                        this.selectedBlock = null;
                        removeBtn.classList.add('active');
                        modalEl.querySelectorAll('.stive-block-slot').forEach(s => s.classList.remove('active'));
                        const statusEl = modalEl.querySelector('#stive-active-status');
                        if (statusEl) statusEl.textContent = 'دۆخی سڕینەوە: کلیک لەسەر هەر بلۆکێک بکە لەسەر شاشە بۆ سڕینەوەی';
                    } else {
                        removeBtn.classList.remove('active');
                        const statusEl = modalEl.querySelector('#stive-active-status');
                        if (statusEl) statusEl.textContent = 'بلۆکێک هەڵبژێرە بۆ دانان لەسەر شاشە';
                    }
                    this._updateGhostPreview();
                });
            }

            // Clear all blocks
            const clearBtn = modalEl.querySelector('#btn-stive-clear-all');
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._clearAllBlocks();
                });
            }

            // Close modal
            const closeBtn = modalEl.querySelector('#btn-stive-close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    modalEl.style.display = 'none';
                });
            }

            // Prevent event propagation so clicks don't hit the stage
            modalEl.addEventListener('pointerdown', e => e.stopPropagation());
            modalEl.addEventListener('mousedown', e => e.stopPropagation());
            modalEl.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

            document.body.appendChild(modalEl);
        }

        modalEl.style.display = 'none';
        this._blocksModalEl = modalEl;
    }

    _toggleStiveBlocksModal() {
        if (this.activeEffectId !== 'stive' || !this._isRunning) return;
        if (!this._blocksModalEl) this._initStiveBlocksModal();
        if (this._blocksModalEl) {
            const isVisible = this._blocksModalEl.style.display === 'block';
            this._blocksModalEl.style.display = isVisible ? 'none' : 'block';
        }
    }

    _setupStageBlockPlacement() {
        const stage = this._getStage();
        if (!stage) return;

        let blocksContainer = document.getElementById('stive-blocks-container');
        if (!blocksContainer) {
            blocksContainer = document.createElement('div');
            blocksContainer.id = 'stive-blocks-container';
            blocksContainer.className = 'stive-blocks-container';
            stage.appendChild(blocksContainer);
        }
        blocksContainer.style.display = 'block';
        this._blocksContainerEl = blocksContainer;

        if (this._stageBlockPlacementBound) return;
        this._stageBlockPlacementBound = true;

        const GRID_SIZE = 96;
        this.stiveGridSize = GRID_SIZE;

        this._stageMoveHandler = (e) => {
            if (!this.selectedBlock) {
                if (this._ghostBlockEl) this._ghostBlockEl.style.display = 'none';
                return;
            }
            const stageRect = stage.getBoundingClientRect();
            const localX = e.clientX - stageRect.left;
            const localY = e.clientY - stageRect.top;
            const col = Math.floor(localX / GRID_SIZE);
            const row = Math.floor(localY / GRID_SIZE);

            if (!this._ghostBlockEl) {
                this._ghostBlockEl = document.createElement('div');
                this._ghostBlockEl.id = 'stive-cursor-preview';
                this._ghostBlockEl.className = 'stive-cursor-preview';
                stage.appendChild(this._ghostBlockEl);
            }

            this._ghostBlockEl.style.display = 'block';
            this._ghostBlockEl.style.left = `${col * GRID_SIZE}px`;
            this._ghostBlockEl.style.top = `${row * GRID_SIZE}px`;
            this._ghostBlockEl.style.width = `${GRID_SIZE}px`;
            this._ghostBlockEl.style.height = `${GRID_SIZE}px`;
            this._ghostBlockEl.innerHTML = `<img src="assets/sets/stive/blocks/${encodeURI(this.selectedBlock.file)}" draggable="false">`;

            // Show invalid ghost if the cell is occupied or torch support is missing.
            const existingSolid = this.placedBlocks.some(b => b.col === col && b.row === row && b.isSolid);
            const existingTorch = this.placedBlocks.some(b => b.col === col && b.row === row && b.isTorch);
            const isOccupied = existingSolid && !this.selectedBlock.isTorch;
            const isValidTorch = !this.selectedBlock.isTorch || (!existingTorch && !!this.findTorchSupport(col, row));
            if (isOccupied || !isValidTorch) {
                this._ghostBlockEl.classList.add('invalid');
            } else {
                this._ghostBlockEl.classList.remove('invalid');
            }
        };

        this._stagePlacementHandler = (e) => {
            if (this.activeEffectId !== 'stive' || !this._isRunning) return;

            // Ignore if clicking on UI elements
            if (e.target.closest('#legendary-stive-chest') ||
                e.target.closest('#legendary-stive-blocks-modal') ||
                e.target.closest('#game-boss-container') ||
                e.target.closest('.elder-wand-spell-bar') ||
                e.target.closest('#game-weapon-picker-wrap') ||
                e.target.closest('.game-sidebar-left') ||
                e.target.closest('.game-hud-top-center')) {
                return;
            }

            const stageRect = stage.getBoundingClientRect();
            const localX = e.clientX - stageRect.left;
            const localY = e.clientY - stageRect.top;
            const col = Math.floor(localX / GRID_SIZE);
            const row = Math.floor(localY / GRID_SIZE);

            const clickedPlacedBlock = e.target.closest('.stive-placed-block');
            if (clickedPlacedBlock && !this.selectedBlock?.isTorch) {
                return;
            }

            // Remove mode remains available for immediate removal from the modal.
            if (this.isRemoveMode) {
                const existingIdx = this.placedBlocks.findIndex(b => b.col === col && b.row === row);
                if (existingIdx !== -1) {
                    e.stopPropagation();
                    this._removeBlockAt(existingIdx);
                    return;
                }
            }

            // If a block is selected for placement
            if (this.selectedBlock) {
                const existingBlock = this.placedBlocks.find(b => b.col === col && b.row === row && b.isSolid);
                const isOccupied = this.placedBlocks.some(b => b.col === col && b.row === row && !b.isTorch);
                if (isOccupied) {
                    if (!this.selectedBlock.isTorch) return;
                }

                if (this.selectedBlock.isTorch) {
                    const torchAlreadyPlaced = this.placedBlocks.some(b => b.col === col && b.row === row && b.isTorch);
                    const support = this.findTorchSupport(col, row);
                    if (!support || torchAlreadyPlaced) {
                        // Shake ghost preview to indicate invalid placement
                        if (this._ghostBlockEl) {
                            this._ghostBlockEl.classList.add('shake');
                            setTimeout(() => { if (this._ghostBlockEl) this._ghostBlockEl.classList.remove('shake'); }, 300);
                        }
                        return;
                    }
                }

                e.stopPropagation();
                this._placeBlock(col, row, this.selectedBlock, this.selectedBlock.isTorch ? this.findTorchSupport(col, row) : null);
            }
        };

        stage.addEventListener('pointermove', this._stageMoveHandler);
        stage.addEventListener('pointerdown', this._stagePlacementHandler, true);
    }

    _updateGhostPreview() {
        if (!this.selectedBlock && this._ghostBlockEl) {
            this._ghostBlockEl.style.display = 'none';
        }
    }

    hasSolidAdjacentBlock(col, row) {
        if (!this.placedBlocks) return false;
        // Check 4 adjacent directions: bottom, top, left, right
        const neighbors = [
            { c: col, r: row + 1 }, // block below (floor)
            { c: col, r: row - 1 }, // block above
            { c: col - 1, r: row }, // block left
            { c: col + 1, r: row }  // block right
        ];
        return this.placedBlocks.some(b => b.isSolid && neighbors.some(n => n.c === b.col && n.r === b.row));
    }

    findTorchSupport(col, row) {
        const sameCell = this.placedBlocks.find(b => b.isSolid && b.col === col && b.row === row);
        if (sameCell) return { side: 'front' };

        const blockBelowTorch = this.placedBlocks.some(b => b.isSolid && b.col === col && b.row === row + 1);
        return blockBelowTorch ? { side: 'bottom' } : null;
    }

    _placeBlock(col, row, blockInfo, torchSupport = null) {
        const GRID_SIZE = this.stiveGridSize || 96;
        const blockEl = document.createElement('div');
        blockEl.className = `stive-placed-block ${blockInfo.isTorch ? 'placed-torch' : ''}`;
        blockEl.style.left = `${col * GRID_SIZE}px`;
        blockEl.style.top = `${row * GRID_SIZE}px`;
        blockEl.style.width = `${GRID_SIZE}px`;
        blockEl.style.height = `${GRID_SIZE}px`;
        if (torchSupport) blockEl.dataset.torchSide = torchSupport.side;
        blockEl.dataset.col = col;
        blockEl.dataset.row = row;
        blockEl.innerHTML = `<img src="assets/sets/stive/blocks/${encodeURI(blockInfo.file)}" alt="${blockInfo.name}" draggable="false">`;

        let breakTimer = null;
        const cancelBreaking = () => {
            if (breakTimer) {
                clearTimeout(breakTimer);
                breakTimer = null;
            }
            blockEl.classList.remove('block-breaking-hold');
        };
        blockEl.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (e.button !== 0) return;
            blockEl.classList.add('block-breaking-hold');
            breakTimer = setTimeout(() => {
                const idx = this.placedBlocks.indexOf(blockData);
                if (idx !== -1) this._removeBlockAt(idx);
                breakTimer = null;
            }, 550);
        });
        blockEl.addEventListener('pointerup', cancelBreaking);
        blockEl.addEventListener('pointerleave', cancelBreaking);
        blockEl.addEventListener('pointercancel', cancelBreaking);

        blockEl.addEventListener('click', (e) => {
            if (this.isRemoveMode) {
                e.stopPropagation();
                const idx = this.placedBlocks.findIndex(b => b.col === col && b.row === row);
                if (idx !== -1) this._removeBlockAt(idx);
            }
        });

        if (this._blocksContainerEl) {
            this._blocksContainerEl.appendChild(blockEl);
        }

        // Play placement sound
        try {
            const sound = new Audio('assets/sets/stive/place blocks.mp3');
            sound.volume = 0.85;
            sound.play().catch(() => {});
        } catch (e) {}

        const blockData = {
            col: col,
            row: row,
            x: col * GRID_SIZE,
            y: row * GRID_SIZE,
            size: GRID_SIZE,
            file: blockInfo.file,
            isSolid: !blockInfo.isTorch,
            el: blockEl
        };
        this.placedBlocks.push(blockData);
    }

    _removeBlockAt(idx) {
        if (idx < 0 || idx >= this.placedBlocks.length) return;
        const block = this.placedBlocks[idx];
        if (block.el && block.el.parentElement) {
            block.el.classList.add('block-breaking');
            setTimeout(() => { if (block.el && block.el.parentElement) block.el.remove(); }, 180);
        }
        this.placedBlocks.splice(idx, 1);

        // Remove any torches that have lost their supporting solid blocks
        const remainingTorches = this.placedBlocks.filter(b => !b.isSolid);
        remainingTorches.forEach(torch => {
            if (!this.hasSolidAdjacentBlock(torch.col, torch.row)) {
                const tIdx = this.placedBlocks.indexOf(torch);
                if (tIdx !== -1) {
                    if (torch.el && torch.el.parentElement) torch.el.remove();
                    this.placedBlocks.splice(tIdx, 1);
                }
            }
        });
    }

    _clearAllBlocks() {
        if (this.placedBlocks) {
            this.placedBlocks.forEach(b => {
                if (b.el && b.el.parentElement) b.el.remove();
            });
            this.placedBlocks = [];
        }
        if (this._blocksContainerEl) {
            this._blocksContainerEl.innerHTML = '';
        }
    }
}

window.legendaryEffects = new LegendaryEffectsEngine();
