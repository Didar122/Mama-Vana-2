/**
 * Mama Vana - Main Gameplay Engine
 * Uses calibrated coordinates, dynamic custom icon loader, Cute CUT multi-track animations, and multi-currency economy.
 */

class GameEngine {
    constructor() {
        this.running = false;
        this.selectedWeapon = WEAPONS[0];
        this.hp = 100;
        this.maxHp = 100;
        this.combo = 0;
        this.comboTimer = null;
        this.idleQuoteTimer = null;
        this.reactionTimer = null;
        this.klashDanceTimer = null;
        this.isAttacking = false;
        this.scorpionHitCount = 0;
        this.finishPromptReady = false;
        this.finishPromptActive = false;
        this.scorpionFinishPrompt = null;
        this.fatalityOverlay = null;
        this.fatalityActive = false;
        this.fatalitySnapshot = null;

        this.stageEl = null;
        this.bossEl = null;
        this.speechBubbleEl = null;
        this.attackerFxEl = null;
        this.lastFrameTime = 0;
        this.eventsBound = false;

        // Pointer state for precise hit vs grab
        this.pointerState = {
            active: false,
            isCharHit: false,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            localX: 0,
            localY: 0,
            startTime: 0,
            isDragging: false
        };

        // Head equipment detachment & falling physics
        this.headGearHitCount = 0;
        this.lastHeadHitRegisterTime = 0;
        this.fallenGear = null;

        // Swords specific hit tracking (e.g. floor mop 20-hit sound)
        this.swordHitCounts = {};

        // Spiders special weapon tracking
        this.activeSpiders = [];
        this.draggedSpider = null;
        this.activeMinecraftActors = [];
        this.draggedMinecraftActor = null;
        this.activeDrones = [];
        this.activeBurns = [];

        // Elder wand special weapon tracking
        this.activeElderWandSpell = 'expelliarmus';
        this.elderWandCooldown = false;
        this.wingardiumReturnActive = false;
        this.activeFlowers = [];
        this.draggedFlower = null;
    }

    init() {
        this.stageEl = document.getElementById('game-stage');
        this.bossEl = document.getElementById('game-boss-container');
        this.speechBubbleEl = document.getElementById('game-speech-bubble');
        this.attackerFxEl = document.getElementById('game-attacker-fx');

        window.configManager.applyBackgroundToStage();
        this.renderWeaponsToolbar();
        this.bindEvents();
    }

    start(preservePhysicsState = false) {
        this.running = true;
        this.resetFallenGear();
        this.updateStats();

        // Ensure DOM elements are bound
        if (!this.bossEl) this.bossEl = document.getElementById('game-boss-container');
        if (!this.stageEl) this.stageEl = document.getElementById('game-stage');
        if (!this.speechBubbleEl) this.speechBubbleEl = document.getElementById('game-speech-bubble');
        if (!this.attackerFxEl) this.attackerFxEl = document.getElementById('game-attacker-fx');

        // Ensure boss container has visible display
        if (this.bossEl) {
            this.bossEl.style.display = 'block';
            this.bossEl.style.visibility = 'visible';
            this.bossEl.style.opacity = '1';
        }

        // Apply active background
        window.configManager.applyBackgroundToStage();

        // Render character
        window.characterModel.render(this.bossEl);

        // Init physics
        window.physicsEngine.init(this.bossEl, this.stageEl, preservePhysicsState);
        // Keep wall bouncing physical, but do not play the wall-hit sound/effect.
        window.physicsEngine.onHitWall = null;

        // Re-align after next paint frame to guarantee 100% accurate layout dimensions
        requestAnimationFrame(() => {
            if (this.running) {
                window.characterModel.render(this.bossEl);
                window.physicsEngine.updateBounds();
                if (!preservePhysicsState) {
                    window.physicsEngine.resetPosition();
                } else {
                    window.physicsEngine.applyTransform();
                }
            }
        });

        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));

        this.resetIdleQuoteTimer();

        // Start idle animations
        if (window.characterModel) window.characterModel.startBlinkLoop();
        if (window.physicsEngine) window.physicsEngine.scheduleWalk();

        // Start legendary set effect (if applicable)
        if (window.legendaryEffects) {
            window.legendaryEffects.resumeEffect();
        }

        // Show Elder Wand spell bar if elder wand is equipped
        if (this.selectedWeapon && (this.selectedWeapon.id === 'elder_wand' || this.selectedWeapon.id === 'elder wand')) {
            this.showElderWandSpellBar();
        } else {
            this.hideElderWandSpellBar();
        }
    }

    stop() {
        this.running = false;
        this.stopKlashDance();
        this.resetFallenGear();
        this.cancelPointerInteraction();
        this.hideElderWandSpellBar();
        this.cleanupSpecialActors();
        this.cancelScorpionFatality();
        if (this.idleQuoteTimer) clearTimeout(this.idleQuoteTimer);
        if (this.comboTimer) clearTimeout(this.comboTimer);
        if (this.reactionTimer) clearTimeout(this.reactionTimer);
        // Stop idle animations
        if (window.characterModel) window.characterModel.stopBlinkLoop();
        if (window.physicsEngine) {
            window.physicsEngine.stopWalking();
            if (window.physicsEngine.walkTimer) clearTimeout(window.physicsEngine.walkTimer);
        }
        // Pause legendary effects when leaving gameplay
        if (window.legendaryEffects) {
            window.legendaryEffects.pauseEffect();
        }
    }

    cancelPointerInteraction() {
        this.pointerState.active = false;
        this.pointerState.isCharHit = false;
        this.pointerState.isDragging = false;
        if (window.physicsEngine) window.physicsEngine.cancelDrag();
    }

    bindEvents() {
        if (!this.stageEl || this.eventsBound) return;
        this.eventsBound = true;

        const onDown = (e) => {
            if (!this.running) return;
            if (this.finishPromptActive) return;

            // Ignore stage clicks if tapping on spell buttons, chest, or block modal
            const target = e.target;
            if (target && target.closest) {
                if (target.closest('#batman-signal-rig, #batman-bats-container, #lataman-speaker-rig, #santa-temperature-device')) {
                    return;
                }
                if (target.closest('#game-elder-wand-spell-bar') ||
                    target.closest('.elder-wand-spell-bar') ||
                    target.closest('.stive-chest-container') ||
                    target.closest('#legendary-stive-chest') ||
                    target.closest('.stive-blocks-modal') ||
                    target.closest('#legendary-stive-blocks-modal') ||
                    target.closest('#legendary-terminator-repair') ||
                    target.closest('#game-weapon-picker-wrap') ||
                    target.closest('.game-sidebar-left') ||
                    target.closest('.game-hud-top-center')) {
                    return;
                }
            }
            if (window.legendaryEffects?._santaWeather?.frozen) return;

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX === undefined || clientY === undefined) return;

            const rect = this.stageEl.getBoundingClientRect();
            const localX = clientX - rect.left;
            const localY = clientY - rect.top;

            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;

            // Character full hitbox (head top down to feet, width left to right)
            const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
            const halfW = 160 * bScale;
            const topH = 220 * bScale;
            const botH = 210 * bScale;
            const charLeft = bossX - halfW;
            const charRight = bossX + halfW;
            const charTop = bossY - topH;
            const charBottom = bossY + botH;
            const isLatamanSequenceActive = this.bossEl?.classList.contains('lataman-character-sequence');
            const isCharHit = !isLatamanSequenceActive && (localX >= charLeft && localX <= charRight && localY >= charTop && localY <= charBottom);
            if (target?.closest?.('#batman-signal-projection') && !isCharHit) return;

            this.pointerState = {
                active: true,
                isCharHit: isCharHit,
                startX: clientX,
                startY: clientY,
                lastX: clientX,
                lastY: clientY,
                localX: localX,
                localY: localY,
                startTime: performance.now(),
                isDragging: false
            };

            // 1. First priority: Check if player clicked/touched an existing spider or flower to drag!
            const targetEl = e.target;
            if (targetEl && targetEl.closest) {
                const minecraftActorEl = targetEl.closest('.game-minecraft-actor');
                if (e.button === 0 && minecraftActorEl && this.startMinecraftActorDrag(minecraftActorEl, clientX, clientY, localX, localY)) {
                    this.pointerState.isDragging = true;
                    return;
                }
                const spiderEl = targetEl.closest('.game-spider-actor');
                if (spiderEl && this.startSpiderDrag(spiderEl, clientX, clientY, localX, localY)) {
                    this.pointerState = {
                        active: true,
                        isCharHit: false,
                        startX: clientX,
                        startY: clientY,
                        lastX: clientX,
                        lastY: clientY,
                        localX: localX,
                        localY: localY,
                        startTime: performance.now(),
                        isDragging: true
                    };
                    return;
                }
                const flowerEl = targetEl.closest('.game-flower-actor');
                if (flowerEl && this.startFlowerDrag(flowerEl, clientX, clientY, localX, localY)) {
                    this.pointerState = {
                        active: true,
                        isCharHit: false,
                        startX: clientX,
                        startY: clientY,
                        lastX: clientX,
                        lastY: clientY,
                        localX: localX,
                        localY: localY,
                        startTime: performance.now(),
                        isDragging: true
                    };
                    return;
                }
            }

            // 2. If selected weapon is SPIDERS: Clicking anywhere on screen drops a spider!
            if (this.selectedWeapon && (this.selectedWeapon.id === 'spiders' || this.selectedWeapon.id === 'spider')) {
                this.dropSpider(localX, localY);
                return;
            }

            // Requirement 4 FIX: When character is touched/grabbed, ALWAYS prioritize grabbing & dragging character!
            if (isCharHit) {
                window.physicsEngine.startDrag(clientX, clientY);
                return;
            }

            // Weapons shoot/attack ONLY when touching or clicking in empty space outside character
            if (this.selectedWeapon) {
                const wCat = this.selectedWeapon.category || this.selectedWeapon.type;
                if (wCat === 'shooting') {
                    window.physicsEngine.cancelDrag();
                    this.startShootingSession(this.selectedWeapon.id, localX, localY);
                    return;
                } else if (wCat === 'swords') {
                    window.physicsEngine.cancelDrag();
                    this.startSwordSession(this.selectedWeapon.id, localX, localY);
                    return;
                } else if (wCat === 'special') {
                    window.physicsEngine.cancelDrag();
                    this.startSpecialSession(this.selectedWeapon.id, localX, localY);
                    return;
                }
            }
        };

        const onMove = (e) => {
            if (!this.running || !this.pointerState.active) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (clientX === undefined || clientY === undefined) return;

            this.pointerState.lastX = clientX;
            this.pointerState.lastY = clientY;

            const stageRect = this.stageEl.getBoundingClientRect();
            const localX = clientX - stageRect.left;
            const localY = clientY - stageRect.top;

            if (this.draggedSpider) {
                this.updateSpiderDrag(localX, localY);
                return;
            }

            if (this.draggedMinecraftActor) {
                this.updateMinecraftActorDrag(localX, localY);
                return;
            }

            if (this.draggedFlower) {
                this.updateFlowerDrag(localX, localY);
                return;
            }

            // Update active weapon position to follow finger/cursor smoothly
            if (this.shootingSession && this.shootingSession.active) {
                this.updateShootingSession(localX, localY);
                return;
            }

            if (this.swordSession && this.swordSession.active) {
                this.updateSwordSession(localX, localY);
                return;
            }

            if (this.specialSession && this.specialSession.active) {
                this.updateSpecialSession(localX, localY, clientX, clientY);
                return;
            }

            if (this.pointerState.isCharHit) {
                const moveDist = Math.hypot(clientX - this.pointerState.startX, clientY - this.pointerState.startY);
                if (moveDist > 7 || this.pointerState.isDragging) {
                    this.pointerState.isDragging = true;
                    window.physicsEngine.drag(clientX, clientY);
                }
            }
        };

        const onUp = () => {
            if (!this.running || !this.pointerState.active) return;

            if (this.draggedSpider) {
                this.endSpiderDrag();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            if (this.draggedMinecraftActor) {
                this.endMinecraftActorDrag();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            if (this.draggedFlower) {
                this.endFlowerDrag();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            // Release active weapon session
            if (this.shootingSession && this.shootingSession.active) {
                this.endShootingSession();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            if (this.swordSession && this.swordSession.active) {
                this.endSwordSession();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            if (this.specialSession && this.specialSession.active) {
                this.endSpecialSession();
                this.pointerState.active = false;
                this.pointerState.isDragging = false;
                return;
            }

            if (this.pointerState.isDragging) {
                // Was dragging/throwing character
                window.physicsEngine.endDrag();
            } else if (this.pointerState.isCharHit) {
                // Clean tap/click on the character
                window.physicsEngine.cancelDrag();

                const wCat = this.selectedWeapon ? (this.selectedWeapon.category || this.selectedWeapon.type) : null;
                if (wCat === 'shooting' || wCat === 'swords' || wCat === 'special') {
                    // Grab/tap on character only; no weapon misfire
                } else if (this.selectedWeapon.id === 'hand') {
                    this.executeHandPunch(this.pointerState.localX, this.pointerState.localY);
                } else {
                    this.executeWeaponAttack(this.selectedWeapon.id, this.pointerState.localX, this.pointerState.localY);
                }
            } else {
                // Tapped outside character on empty background -> Air miss, no damage
                window.physicsEngine.cancelDrag();
                if (this.selectedWeapon.id === 'hand') {
                    this.spawnDamageMiss(this.pointerState.localX, this.pointerState.localY);
                }
            }

            this.pointerState.active = false;
            this.pointerState.isDragging = false;
        };

        this.stageEl.onmousedown = onDown;
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        this.stageEl.ontouchstart = onDown;
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);

        const btnMenu = document.getElementById('btn-game-menu');
        if (btnMenu) {
            btnMenu.onclick = () => {
                window.soundEngine.playButton();
                this.stop();
                window.gameApp.showScreen('menu');
            };
        }

        const btnCustom = document.getElementById('btn-game-customizer');
        if (btnCustom) {
            btnCustom.onclick = () => {
                window.soundEngine.playButton();
                this.stop();
                window.gameApp.showScreen('customizer');
            };
        }

        const btnSettings = document.getElementById('btn-game-settings');
        if (btnSettings) {
            btnSettings.onclick = () => {
                window.soundEngine.playButton();
                window.gameApp.openSettingsModal();
            };
        }

        const btnDev = document.getElementById('btn-game-dev');
        if (btnDev) {
            btnDev.onclick = () => {
                window.soundEngine.playButton();
                this.stop();
                window.gameApp.showScreen('dev_editor');
            };
        }

        window.addEventListener('resize', () => {
            if (this.running) {
                window.physicsEngine.updateBounds();
            }
        });
    }

    renderWeaponsToolbar() {
        const toolbar = document.getElementById('game-weapons-bar');
        if (!toolbar) return;

        toolbar.innerHTML = '';

        // Combine WEAPONS manifest and any dynamically added weapons from coordinatesDB
        const allWeapons = [...WEAPONS];
        if (window.coordinatesDB) {
            // Shooting weapons
            if (window.coordinatesDB.getAllShootingConfigs) {
                const extraShooting = window.coordinatesDB.getAllShootingConfigs();
                for (const [sId, sCfg] of Object.entries(extraShooting)) {
                    const existing = allWeapons.find(w => w.id === sId);
                    const iconPath = `${sCfg.folder || ('attaker/shooting/' + sId)}/${sCfg.iconFile || (sId + '.png')}`;
                    if (!existing) {
                        allWeapons.push({
                            id: sId,
                            name: sCfg.name || sId,
                            iconEmoji: '🔫',
                            iconPath: iconPath,
                            iconFile: sCfg.iconFile || (sId + '.png'),
                            damage: sCfg.damage || 35,
                            type: 'shooting',
                            category: 'shooting'
                        });
                    } else {
                        existing.iconPath = iconPath;
                        existing.iconFile = sCfg.iconFile || (sId + '.png');
                    }
                }
            }
            // Swords
            if (window.coordinatesDB.getAllSwordConfigs) {
                const extraSwords = window.coordinatesDB.getAllSwordConfigs();
                for (const [sId, sCfg] of Object.entries(extraSwords)) {
                    const existing = allWeapons.find(w => w.id === sId);
                    const iconPath = `${sCfg.folder || ('attaker/swords/' + sId)}/${sCfg.iconFile || (sId + '.png')}`;
                    if (!existing) {
                        allWeapons.push({
                            id: sId,
                            name: sCfg.name || sId,
                            iconEmoji: '⚔️',
                            iconPath: iconPath,
                            iconFile: sCfg.iconFile || (sId + '.png'),
                            damage: sCfg.damage || 45,
                            type: 'swords',
                            category: 'swords'
                        });
                    } else {
                        existing.iconPath = iconPath;
                        existing.iconFile = sCfg.iconFile || (sId + '.png');
                    }
                }
            }
            // Special
            if (window.coordinatesDB.getAllSpecialConfigs) {
                const extraSpecial = window.coordinatesDB.getAllSpecialConfigs();
                for (const [sId, sCfg] of Object.entries(extraSpecial)) {
                    const existing = allWeapons.find(w => w.id === sId);
                    const iconPath = `${sCfg.folder || ('attaker/special/' + sId)}/${sCfg.iconFile || (sId + '.png')}`;
                    if (!existing) {
                        allWeapons.push({
                            id: sId,
                            name: sCfg.name || sId,
                            iconEmoji: '✨',
                            iconPath: iconPath,
                            iconFile: sCfg.iconFile || (sId + '.png'),
                            damage: sCfg.damage || 50,
                            type: 'special',
                            category: 'special'
                        });
                    } else {
                        existing.iconPath = iconPath;
                        existing.iconFile = sCfg.iconFile || (sId + '.png');
                    }
                }
            }
        }

        const meleeWeapons = allWeapons.filter(w => w.category === 'melee' || (!w.category && w.type !== 'shooting' && w.type !== 'swords' && w.type !== 'special'));
        const shootingWeapons = allWeapons.filter(w => w.category === 'shooting' || w.type === 'shooting');
        const swordsWeapons = allWeapons.filter(w => w.category === 'swords' || w.type === 'swords');
        const specialWeapons = allWeapons.filter(w => w.category === 'special' || w.type === 'special');

        // Tab state: 'melee', 'shooting', 'swords', or 'special'
        if (!this.activeAttackModalTab) {
            this.activeAttackModalTab = (this.selectedWeapon && this.selectedWeapon.category) ? this.selectedWeapon.category : 'melee';
        }

        // =========================================================================
        // Requirement 1: Centered Section Name Badge above the Icons
        // =========================================================================
        const sectionTitles = {
            'melee': '👊 شەڕی دەستەویەخە (Melee)',
            'shooting': '🔫 چەکە ئاگرینەکان (Shooting)',
            'swords': '⚔️ شمشێر و تیغەکان (Swords)',
            'special': '✨ هێرشە تایبەتەکان (Special)'
        };

        const titleBadge = document.createElement('div');
        titleBadge.className = 'weapon-modal-header-badge';
        titleBadge.innerHTML = `<span class="weapon-modal-title-pill">${sectionTitles[this.activeAttackModalTab] || 'هێرشەکان'}</span>`;
        toolbar.appendChild(titleBadge);

        // =========================================================================
        // Requirement 1: 4 Section Buttons (Larger Icons, No Button Text)
        // =========================================================================
        const navContainer = document.createElement('div');
        navContainer.className = 'weapon-modal-nav';

        const sectionsList = [
            { id: 'melee', icon: 'attaker/melee.png', fallback: 'assets/icons/hand.png', cls: 'tab-melee' },
            { id: 'shooting', icon: 'attaker/shooting/shooting.png', fallback: 'attaker/shooting/akm/akm.png', cls: 'tab-shooting' },
            { id: 'swords', icon: 'attaker/swords/blades.png', fallback: 'attaker/swords/katana/katana.png', cls: 'tab-swords' },
            { id: 'special', icon: 'attaker/special/special.png', fallback: 'attaker/special/shuriken/shuriken.png', cls: 'tab-special' }
        ];

        sectionsList.forEach(sec => {
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = `weapon-modal-nav-btn ${sec.cls} ${this.activeAttackModalTab === sec.id ? 'active' : ''}`;
            tabBtn.innerHTML = `<img class="weapon-tab-icon" src="${sec.icon}" alt="${sec.id}" onerror="this.src='${sec.fallback}'">`;
            tabBtn.onclick = () => {
                if (this.activeAttackModalTab !== sec.id) {
                    window.soundEngine && window.soundEngine.playButton();
                    this.activeAttackModalTab = sec.id;
                    this.renderWeaponsToolbar();
                }
            };
            navContainer.appendChild(tabBtn);
        });
        toolbar.appendChild(navContainer);

        // Helper to render a weapons grid
        const renderGrid = (weaponsList, iconBorderColor, defaultEmoji) => {
            const grid = document.createElement('div');
            grid.className = 'game-weapon-modal-grid';

            weaponsList.forEach(w => {
                const isSelected = (w.id === this.selectedWeapon.id);
                const btn = document.createElement('button');
                btn.className = `weapon-btn ${isSelected ? 'active' : ''}`;
                btn.title = w.name;

                const iconSrc = w.iconPath || (w.iconFile ? `assets/icons/${w.iconFile}` : (w.folder ? `${w.folder}/frame1.png` : 'assets/icons/hand.png'));

                btn.innerHTML = `
                    ${isSelected ? '<span class="weapon-btn-active-badge">✓ چالاکە</span>' : ''}
                    <div class="weapon-icon-wrapper" style="${iconBorderColor ? `background: rgba(255,255,255,0.08); border: 1.5px solid ${iconBorderColor};` : ''}">
                        <img class="weapon-img-icon" src="${encodeURI(iconSrc)}" alt="${w.name}"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                        <span class="weapon-emoji-icon" style="display:none;">${w.iconEmoji || defaultEmoji}</span>
                    </div>
                    <span class="weapon-btn-label">${w.name}</span>
                `;

                btn.onclick = () => {
                    window.soundEngine && window.soundEngine.playButton();
                    this.selectedWeapon = w;

                    // Update the floating icon
                    const activeIcon = document.getElementById('game-active-weapon-icon');
                    if (activeIcon) {
                        activeIcon.src = encodeURI(iconSrc);
                        activeIcon.onerror = () => { activeIcon.src = ''; };
                    }

                    if (w.id === 'elder_wand' || w.id === 'elder wand') {
                        this.showElderWandSpellBar();
                    } else {
                        this.hideElderWandSpellBar();
                    }

                    this.renderWeaponsToolbar();
                };

                grid.appendChild(btn);
            });

            toolbar.appendChild(grid);
        };

        // Render Content based on Active Tab
        if (this.activeAttackModalTab === 'melee') {
            // MELEE SECTION
            renderGrid(meleeWeapons, null, '👊');
        } else if (this.activeAttackModalTab === 'shooting') {
            // SHOOTING SECTION
            const currentShootingGun = (this.selectedWeapon && (this.selectedWeapon.category === 'shooting' || this.selectedWeapon.type === 'shooting'))
                ? this.selectedWeapon
                : (shootingWeapons[0] || null);

            if (currentShootingGun) {
                const gunId = currentShootingGun.id;
                const gunCfg = (window.coordinatesDB && window.coordinatesDB.getShootingConfig(gunId)) || {};
                const fireModes = gunCfg.fireModes || {
                    single: { enabled: true },
                    burst: { enabled: true, count: 3, intervalMs: 80 },
                    rapid: { enabled: true, intervalMs: 110 }
                };
                const configuredMode = gunCfg.selectedFireMode;
                const currentMode = fireModes[configuredMode] && fireModes[configuredMode].enabled !== false
                    ? configuredMode
                    : (Object.keys(fireModes).find(mode => fireModes[mode] && fireModes[mode].enabled !== false) || 'single');

                // Segmented Switch for Enabled Fire Modes
                const switcherBox = document.createElement('div');
                switcherBox.className = 'fire-mode-switcher-container';

                const switcherHeader = document.createElement('div');
                switcherHeader.className = 'fire-mode-header';
                switcherHeader.innerHTML = `
                    <span>🔥 جۆری تەقەکردن (${currentShootingGun.name}):</span>
                    <span style="font-size: 0.78rem; opacity: 0.85;">(تاک / بڕەست / دەستڕێژ)</span>
                `;
                switcherBox.appendChild(switcherHeader);

                const pillsContainer = document.createElement('div');
                pillsContainer.className = 'fire-mode-pills';

                const modesInfo = [
                    { id: 'single', name: 'تاک (موفرەد)', desc: 'Single', emoji: '🎯' },
                    { id: 'burst', name: 'بڕەست (سیانی)', desc: 'Burst', emoji: '💥' },
                    { id: 'rapid', name: 'دەستڕێژ (سەلە)', desc: 'Auto Rapid', emoji: '⚡' },
                    { id: 'auto', name: 'ئاگر (Auto)', desc: 'Auto', emoji: '🔥' }
                ];

                modesInfo.forEach(m => {
                    const isEnabled = !!fireModes[m.id] && fireModes[m.id].enabled !== false;
                    if (isEnabled) {
                        const pill = document.createElement('button');
                        pill.type = 'button';
                        pill.className = `fire-mode-pill ${currentMode === m.id ? 'active' : ''}`;
                        pill.innerHTML = `<span class="mode-emoji">${m.emoji}</span><span>${m.name}</span>`;
                        pill.onclick = (e) => {
                            e.stopPropagation();
                            window.soundEngine && window.soundEngine.playButton();
                            if (window.coordinatesDB && window.coordinatesDB.setShootingFireMode) {
                                window.coordinatesDB.setShootingFireMode(gunId, m.id);
                            }
                            currentShootingGun.selectedFireMode = m.id;
                            this.renderWeaponsToolbar();
                        };
                        pillsContainer.appendChild(pill);
                    }
                });

                switcherBox.appendChild(pillsContainer);
                toolbar.appendChild(switcherBox);
            }

            renderGrid(shootingWeapons, 'rgba(231, 76, 60, 0.4)', '🔫');
        } else if (this.activeAttackModalTab === 'swords') {
            // SWORDS SECTION
            renderGrid(swordsWeapons, 'rgba(0, 206, 201, 0.4)', '⚔️');
        } else if (this.activeAttackModalTab === 'special') {
            // SPECIAL SECTION
            renderGrid(specialWeapons, 'rgba(108, 92, 231, 0.4)', '✨');
        }

        // Wire the floating button to open the centered modal (only once)
        const activeBtn = document.getElementById('game-active-weapon-btn');
        if (activeBtn && !activeBtn._pickerWired) {
            activeBtn._pickerWired = true;

            const openModal = () => {
                const modal = document.getElementById('game-weapon-modal');
                if (modal) modal.style.display = 'flex';
            };
            const closeModal = () => {
                const modal = document.getElementById('game-weapon-modal');
                if (modal) modal.style.display = 'none';
            };

            activeBtn.onclick = (e) => {
                e.stopPropagation();
                window.soundEngine && window.soundEngine.playButton();
                openModal();
            };

            // Close on overlay click
            const overlay = document.getElementById('game-weapon-modal-overlay');
            if (overlay) overlay.onclick = closeModal;

            // Close on X button click
            const closeBtn = document.getElementById('btn-close-attack-modal');
            if (closeBtn) closeBtn.onclick = closeModal;

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal();
            });
        }

        // Set initial active icon
        const activeIcon = document.getElementById('game-active-weapon-icon');
        if (activeIcon && this.selectedWeapon) {
            const initialIcon = this.selectedWeapon.iconPath || (this.selectedWeapon.iconFile ? `assets/icons/${this.selectedWeapon.iconFile}` : `assets/icons/hand.png`);
            activeIcon.src = encodeURI(initialIcon);
        }
    }

    // =========================================================================
    // SHOOTING ENGINE (Hold to Track Finger, Fire Modes, Physics Push & Blood Zone)
    // =========================================================================

    calculateGunPosition(cursorX, cursorY) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const stageW = stageRect.width || 800;
        const stageH = stageRect.height || 600;
        const bossX = window.physicsEngine.x;

        // Requirement B: Gun must NOT appear under finger/cursor.
        // It must appear above finger, and if no room above, appear anywhere around finger with space.
        let gunX = cursorX;
        let gunY = cursorY - 85;

        // Check if there is enough space above finger (margin from stage top)
        if (gunY < 50) {
            if (cursorY + 85 < stageH - 50) {
                gunY = cursorY + 85;
            } else {
                gunY = Math.max(50, Math.min(stageH - 50, cursorY));
                const sideOffset = (cursorX >= bossX) ? 80 : -80;
                gunX = cursorX + sideOffset;
            }
        }

        // Clamp inside stage boundaries
        gunX = Math.max(60, Math.min(stageW - 60, gunX));
        gunY = Math.max(45, Math.min(stageH - 45, gunY));

        return { gunX, gunY };
    }

    applyGunFrame(session, frameFile, isRecoil = false) {
        if (!session || !session.gunEl || !session.imgEl) return;

        const gunCfg = session.gunCfg;
        const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;
        const folder = session.folder;

        session.imgEl.src = encodeURI(folder + '/' + frameFile);
        session.imgEl.dataset.currentFrame = frameFile;

        const BASE_GUN_SCALE = 0.28;
        const fOffset = (gunCfg.frameOffsets && gunCfg.frameOffsets[frameFile]) ? gunCfg.frameOffsets[frameFile] : {};

        // Multiply Global Scale with Per-Frame Scale so changes in coordinates.js immediately take effect!
        const globalScale = (gunCfg.scale !== undefined) ? gunCfg.scale : 1.0;
        const frameScaleMul = (fOffset.scale !== undefined) ? fOffset.scale : 1.0;
        const totalScale = globalScale * frameScaleMul * BASE_GUN_SCALE * bScale;

        const globalSx = (gunCfg.scaleX !== undefined) ? gunCfg.scaleX : 1.0;
        const frameSx = (fOffset.scaleX !== undefined) ? fOffset.scaleX : 1.0;
        const scaleX = globalSx * frameSx * totalScale;

        const globalSy = (gunCfg.scaleY !== undefined) ? gunCfg.scaleY : 1.0;
        const frameSy = (fOffset.scaleY !== undefined) ? fOffset.scaleY : 1.0;
        const scaleY = globalSy * frameSy * totalScale;

        const globalRot = (gunCfg.rotation !== undefined) ? gunCfg.rotation : 0;
        const frameRot = (fOffset.rotation !== undefined) ? fOffset.rotation : 0;
        const rotOffset = globalRot + frameRot;

        const dx = session.targetX - session.gunX;
        const isShootingRight = (dx >= 0);
        const finalScaleX = scaleX;
        const finalScaleY = isShootingRight ? scaleY : -scaleY;
        const finalRot = session.angleDeg + (isShootingRight ? rotOffset : -rotOffset);

        const fx = (fOffset.x || 0) * globalScale * bScale;
        const fy = (fOffset.y || 0) * globalScale * bScale;

        // Apply frame-specific local offsets along the rotated weapon axis
        session.gunEl.style.transform = `translate(-50%, -50%) rotate(${finalRot}deg) translate(${fx}px, ${fy}px) scale(${finalScaleX}, ${finalScaleY})`;
    }

    startShootingSession(weaponId, cursorX, cursorY) {
        if (!this.running) return;

        // Cancel previous active session if exists
        if (this.shootingSession && this.shootingSession.active) {
            this.endShootingSession();
        }

        const gunCfg = (window.coordinatesDB && window.coordinatesDB.getShootingConfig(weaponId)) || {
            id: weaponId,
            folder: `attaker/shooting/${weaponId}`,
            frames: ['frame1.png', 'frame2.png', 'frame3.png'],
            bullet: 'bullet.png',
            sound: `attaker/shooting/${weaponId}/${weaponId}_single_fire.mp3`,
            damage: 35,
            scale: 1.0,
            scaleX: 1.0,
            scaleY: 1.0,
            rotation: 0,
            bulletSpeed: 2200,
            bulletScale: 0.5,
            frameSpeed: 65,
            recoilKick: 15,
            bloodScale: 0.35,
            bloodDuration: 2200,
            bloodZone: { centerY: 240, spreadY: 150, spreadX: 110 }
        };

        const folder = window.assetManager ? window.assetManager.getAttackerFolder(weaponId) : `attaker/shooting/${weaponId}`;
        const frames = (gunCfg.frames && gunCfg.frames.length > 0) ? gunCfg.frames : ['frame1.png', 'frame2.png', 'frame3.png'];

        const { gunX, gunY } = this.calculateGunPosition(cursorX, cursorY);
        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        const targetX = bossX;
        const targetY = bossY - (95 * bScale);

        const dx = targetX - gunX;
        const dy = targetY - gunY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);

        // Create gun actor element that will follow finger
        const gunEl = document.createElement('div');
        gunEl.className = 'game-gun-actor';
        gunEl.style.left = `${gunX}px`;
        gunEl.style.top = `${gunY}px`;
        gunEl.style.transition = 'opacity 0.16s ease-out';
        gunEl.innerHTML = `
            <img src="${encodeURI(folder + '/' + frames[0])}" alt="${weaponId}" draggable="false"
                 style="display: block; pointer-events: none; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6));">
        `;
        this.stageEl.appendChild(gunEl);

        const imgEl = gunEl.querySelector('img');

        // Session object
        const session = {
            active: true,
            weaponId: weaponId,
            gunCfg: gunCfg,
            folder: folder,
            frames: frames,
            gunEl: gunEl,
            imgEl: imgEl,
            cursorX: cursorX,
            cursorY: cursorY,
            gunX: gunX,
            gunY: gunY,
            targetX: targetX,
            targetY: targetY,
            angleRad: angleRad,
            angleDeg: angleDeg,
            rapidTimer: null,
            burstTimers: []
        };
        this.shootingSession = session;

        // Apply initial frame transform
        this.applyGunFrame(session, frames[0], false);

        // Check active fire mode
        const selectedMode = gunCfg.selectedFireMode || 'rapid';
        const fModes = gunCfg.fireModes || {};

        if ((selectedMode === 'rapid' || selectedMode === 'auto') && (fModes[selectedMode] ? fModes[selectedMode].enabled !== false : true)) {
            // Rapid Fire: Fire immediate shot, then loop continuously while finger is held
            this.fireSingleShot(session, gunCfg);
            const intervalMs = (fModes[selectedMode] && fModes[selectedMode].intervalMs) ? fModes[selectedMode].intervalMs : 110;
            session.rapidTimer = setInterval(() => {
                if (this.shootingSession && this.shootingSession.active) {
                    this.fireSingleShot(this.shootingSession, gunCfg);
                } else {
                    clearInterval(session.rapidTimer);
                }
            }, intervalMs);
        } else if (selectedMode === 'burst' && (fModes.burst ? fModes.burst.enabled !== false : true)) {
            // Burst Fire: Fire a cluster of shots (e.g. 3) in fast succession
            const count = (fModes.burst && fModes.burst.count) ? fModes.burst.count : 3;
            const intervalMs = (fModes.burst && fModes.burst.intervalMs) ? fModes.burst.intervalMs : 80;
            for (let i = 0; i < count; i++) {
                const t = setTimeout(() => {
                    if (this.shootingSession && this.shootingSession.active) {
                        this.fireSingleShot(this.shootingSession, gunCfg);
                    }
                }, i * intervalMs);
                session.burstTimers.push(t);
            }
        } else {
            // Single Shot: Fire once, keep gun visible and following finger while held
            this.fireSingleShot(session, gunCfg);
        }
    }

    updateShootingSession(cursorX, cursorY) {
        const session = this.shootingSession;
        if (!session || !session.active || !session.gunEl) return;

        session.cursorX = cursorX;
        session.cursorY = cursorY;

        const { gunX, gunY } = this.calculateGunPosition(cursorX, cursorY);
        session.gunX = gunX;
        session.gunY = gunY;

        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        if (session.weaponId === 'flamethrower' && session.fireTargetOffset) {
            session.targetX = bossX + session.fireTargetOffset.x;
            session.targetY = bossY + session.fireTargetOffset.y;
        } else {
            session.targetX = bossX;
            session.targetY = bossY - (95 * bScale);
        }

        const dx = session.targetX - gunX;
        const dy = session.targetY - gunY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);
        session.angleRad = angleRad;
        session.angleDeg = angleDeg;

        session.gunEl.style.left = `${gunX}px`;
        session.gunEl.style.top = `${gunY}px`;

        const currentFrame = (session.imgEl && session.imgEl.dataset.currentFrame) ? session.imgEl.dataset.currentFrame : session.frames[0];
        this.applyGunFrame(session, currentFrame, false);
    }

    endShootingSession() {
        const session = this.shootingSession;
        if (!session) return;

        session.active = false;
        if (session.flameAudio) {
            session.flameAudio.pause();
            session.flameAudio.currentTime = 0;
            session.flameAudio = null;
        }
        if (session.rapidTimer) {
            clearInterval(session.rapidTimer);
            session.rapidTimer = null;
        }
        if (session.burstTimers) {
            session.burstTimers.forEach(t => clearTimeout(t));
            session.burstTimers = [];
        }

        if (session.gunEl && session.gunEl.parentElement) {
            if (session.weaponId === 'paintball') {
                session.gunEl.remove();
            } else {
                setTimeout(() => {
                    if (!session.gunEl || !session.gunEl.parentElement) return;
                    session.gunEl.style.opacity = '0';
                    setTimeout(() => {
                        if (session.gunEl && session.gunEl.parentElement) session.gunEl.remove();
                    }, 160);
                }, 0);
            }
        }

        this.shootingSession = null;
    }

    fireFlamethrowerShot(session, gunCfg) {
        if (!session || !session.gunEl || !session.gunEl.parentElement) return;
        const isAuto = gunCfg.selectedFireMode === 'auto';
        const collisionRects = this.getMinecraftCharacterHitRects();
        const targetRect = collisionRects[Math.floor(Math.random() * collisionRects.length)] || {
            left: window.physicsEngine.x - 40,
            right: window.physicsEngine.x + 40,
            top: window.physicsEngine.y - 160,
            bottom: window.physicsEngine.y - 80
        };
        if (!session.fireTargetOffset) {
            session.fireTargetOffset = {
                x: targetRect.left + Math.random() * (targetRect.right - targetRect.left) - window.physicsEngine.x,
                y: targetRect.top + Math.random() * (targetRect.bottom - targetRect.top) - window.physicsEngine.y
            };
        }
        const targetX = window.physicsEngine.x + session.fireTargetOffset.x;
        const targetY = window.physicsEngine.y + session.fireTargetOffset.y;
        const dx = targetX - session.gunX;
        const dy = targetY - session.gunY;
        const angle = Math.atan2(dy, dx);
        session.targetX = targetX;
        session.targetY = targetY;
        session.angleRad = angle;
        session.angleDeg = angle * 180 / Math.PI;
        const firingFrame = session.frames[1] || session.frames[0];
        this.applyGunFrame(session, firingFrame, true);
        setTimeout(() => {
            if (session.active && session.frames[0]) this.applyGunFrame(session, session.frames[0], false);
        }, gunCfg.frameSpeed || 70);
        const baseGunScale = (gunCfg.scale || 1) * 0.28 * ((window.innerWidth <= 600) ? 0.85 : 1);
        const frameOffset = (gunCfg.frameOffsets && gunCfg.frameOffsets[firingFrame]) || {};
        const frameScale = frameOffset.scale !== undefined ? frameOffset.scale : 1;
        const muzzleScale = baseGunScale * frameScale;
        const muzzle = gunCfg.muzzleOffset || { x: 555, y: -18 };
        const muzzleOffsetX = (muzzle.x + (frameOffset.x || 0)) * muzzleScale;
        const facingY = dx >= 0 ? 1 : -1;
        const muzzleOffsetY = (muzzle.y + (frameOffset.y || 0)) * muzzleScale * facingY;
        const muzzleX = session.gunX + Math.cos(angle) * muzzleOffsetX - Math.sin(angle) * muzzleOffsetY;
        const muzzleY = session.gunY + Math.sin(angle) * muzzleOffsetX + Math.cos(angle) * muzzleOffsetY;
        const folder = session.folder;
        const frames = isAuto ? (gunCfg.flameFrames || ['flame1.png', 'flame2.png', 'flame3.png']) : (gunCfg.projectileFrames || ['fireball1.png', 'fireball2.png']);
        const actor = document.createElement('div');
        actor.className = isAuto ? 'game-flame-projectile' : 'game-fireball-projectile';
        actor.style.left = `${muzzleX}px`;
        actor.style.top = `${muzzleY}px`;
        actor.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
        actor.innerHTML = `<img src="${encodeURI(`${folder}/${frames[0]}`)}" alt="flame" draggable="false">`;
        this.stageEl.appendChild(actor);
        let shotAudio = null;
        if (window.soundEngine && !window.soundEngine.muted) {
            if (isAuto) {
                if (!session.flameAudio) {
                    session.flameAudio = new Audio(encodeURI(gunCfg.flameSound));
                    session.flameAudio.loop = true;
                    session.flameAudio.volume = window.soundEngine.sfxVolume;
                    session.flameAudio.play().catch(() => {});
                }
            } else if (gunCfg.sound) {
                shotAudio = new Audio(encodeURI(gunCfg.sound));
                shotAudio.volume = window.soundEngine.sfxVolume;
                shotAudio.play().catch(() => {});
            }
        }
        const stopShotAudio = () => {
            if (!shotAudio) return;
            shotAudio.pause();
            shotAudio.currentTime = 0;
            shotAudio = null;
        };

        let frameIndex = 0;
        const frameTimer = setInterval(() => {
            if (!actor.parentElement) return clearInterval(frameTimer);
            frameIndex = (frameIndex + 1) % frames.length;
            const image = actor.querySelector('img');
            if (image) image.src = encodeURI(`${folder}/${frames[frameIndex]}`);
        }, 75);

        if (isAuto) {
            const targetOffsetX = targetX - window.physicsEngine.x;
            const targetOffsetY = targetY - window.physicsEngine.y;
            const expiresAt = performance.now() + 260;
            actor.style.transformOrigin = '0 50%';
            const updateFlame = (now) => {
                if (!actor.parentElement) return clearInterval(frameTimer);
                const currentTargetX = window.physicsEngine.x + targetOffsetX;
                const currentTargetY = window.physicsEngine.y + targetOffsetY;
                const currentDx = currentTargetX - session.gunX;
                const currentDy = currentTargetY - session.gunY;
                const currentAngle = Math.atan2(currentDy, currentDx);
                const muzzleX = session.gunX + Math.cos(currentAngle) * muzzleOffsetX - Math.sin(currentAngle) * muzzleOffsetY;
                const muzzleY = session.gunY + Math.sin(currentAngle) * muzzleOffsetX + Math.cos(currentAngle) * muzzleOffsetY;
                actor.style.left = `${muzzleX}px`;
                actor.style.top = `${muzzleY}px`;
                const flameDx = currentTargetX - muzzleX;
                const flameDy = currentTargetY - muzzleY;
                const flameAngle = Math.atan2(flameDy, flameDx);
                actor.style.width = `${Math.max(55, Math.hypot(flameDx, flameDy))}px`;
                actor.style.transform = `translate(0, -50%) rotate(${flameAngle}rad)`;
                if (now < expiresAt) {
                    requestAnimationFrame(updateFlame);
                    return;
                }
                clearInterval(frameTimer);
                actor.remove();
                this.applyFlamethrowerHit(currentTargetX, currentTargetY, session.gunX, gunCfg);
            };
            requestAnimationFrame(updateFlame);
            return;
        }

        const start = performance.now();
        const duration = Math.max(120, Math.min(520, Math.hypot(dx, dy) / (gunCfg.bulletSpeed || 900) * 1000));
        const fly = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const projectileX = muzzleX + dx * progress;
            const projectileY = muzzleY + dy * progress;
            actor.style.left = `${projectileX}px`;
            actor.style.top = `${projectileY}px`;
            const hitRect = collisionRects.find(rect =>
                projectileX >= rect.left - 34 && projectileX <= rect.right + 34 &&
                projectileY >= rect.top - 34 && projectileY <= rect.bottom + 34);
            if (hitRect) {
                clearInterval(frameTimer);
                stopShotAudio();
                actor.remove();
                const hitX = Math.max(hitRect.left, Math.min(hitRect.right, projectileX));
                const hitY = Math.max(hitRect.top, Math.min(hitRect.bottom, projectileY));
                this.applyFlamethrowerHit(hitX, hitY, session.gunX, gunCfg);
                return;
            }
            if (progress < 1) requestAnimationFrame(fly);
            else {
                clearInterval(frameTimer);
                stopShotAudio();
                if (actor.parentElement) actor.remove();
                this.applyFlamethrowerHit(targetX, targetY, session.gunX, gunCfg);
            }
        };
        requestAnimationFrame(fly);
    }

    applyFlamethrowerHit(targetX, targetY, sourceX, cfg) {
        const damage = cfg.damage || 22;
        this.takeDamage(damage, null, cfg);
        this.spawnBurningEffect(targetX, targetY, cfg);
        this.spawnHitSparks(targetX, targetY);
        this.spawnDamagePopup(targetX, targetY - 30, damage);
    }

    spawnBurningEffect(worldX, worldY, cfg, options = {}) {
        const bossContainer = document.getElementById('game-boss-container');
        if (!bossContainer || !window.physicsEngine) return;
        const stationary = options.stationary || cfg.stationaryBurn;
        const frames = cfg.projectileFrames || ['fireball1.png', 'fireball2.png'];
        let burnState = this.burningEffectState;
        if (!burnState || !burnState.layer.parentElement) {
            const layer = document.createElement('div');
            layer.className = 'game-burning-layer';
            const fireSpots = [
                [50, 7], [27, 18], [72, 19], [45, 28], [63, 38], [31, 46],
                [75, 52], [49, 57], [24, 67], [68, 73], [43, 82], [56, 94],
                [31, 98], [72, 101]
            ];
            const fires = fireSpots.map(([x, y]) => {
                const fire = document.createElement('img');
                fire.className = 'game-burning-fire';
                fire.src = encodeURI(`${cfg.folder}/${frames[0]}`);
                fire.style.left = `${x + (Math.random() - 0.5) * 8}%`;
                fire.style.top = `${y + (Math.random() - 0.5) * 6}%`;
                fire.style.setProperty('--burn-scale', `${0.65 + Math.random() * 0.8}`);
                layer.appendChild(fire);
                return fire;
            });
            bossContainer.appendChild(layer);
            burnState = this.burningEffectState = {
                layer, fires, frameIndex: 0, frameTimer: null, fadeTimer: null, removeTimer: null,
                runOnFire: false,
                runDirection: null,
                screamSoundPlayed: false
            };
            burnState.frameTimer = setInterval(() => {
                if (!layer.parentElement) return clearInterval(burnState.frameTimer);
                burnState.frameIndex = (burnState.frameIndex + 1) % frames.length;
                fires.forEach(fire => { fire.src = encodeURI(`${cfg.folder}/${frames[burnState.frameIndex]}`); });
            }, 110);
        }
        burnState.fires.forEach(fire => fire.classList.remove('burning-fire-fade'));
        clearTimeout(burnState.fadeTimer);
        clearTimeout(burnState.removeTimer);
        burnState.fadeTimer = setTimeout(() => {
            burnState.fires.forEach(fire => fire.classList.add('burning-fire-fade'));
        }, 4500);
        burnState.removeTimer = setTimeout(() => {
            clearInterval(burnState.frameTimer);
            if (burnState.burningAudio) {
                burnState.burningAudio.pause();
                burnState.burningAudio.currentTime = 0;
                burnState.burningAudio = null;
            }
            burnState.layer.remove();
            if (this.burningEffectState === burnState) this.burningEffectState = null;
        }, 5000);
        if (window.soundEngine && cfg.burningSound && !burnState.runSoundPlayed) {
            if (!window.soundEngine.muted) {
                burnState.burningAudio = new Audio(encodeURI(cfg.burningSound));
                burnState.burningAudio.volume = window.soundEngine.sfxVolume * 0.7;
                burnState.burningAudio.play().catch(() => {});
            }
            burnState.runSoundPlayed = true;
        }
        const physics = window.physicsEngine;
        if (stationary) {
            const physics = window.physicsEngine;
            if (physics._burnRunTimer) clearInterval(physics._burnRunTimer);
            if (physics._burnStopTimer) clearTimeout(physics._burnStopTimer);
            physics._burnRunTimer = null;
            physics._burnStopTimer = null;
            physics._burnRunId = null;
            physics._burnSoundPlayed = false;
            physics.stopWalking();
            physics.fleeActive = false;
            burnState.runOnFire = false;
            burnState.runStarted = false;
            burnState.runDirection = null;
            bossContainer.classList.remove('flamethrower-running');
            if (window.soundEngine && cfg.screamSound && !burnState.screamSoundPlayed) {
                window.soundEngine.playAudioFile(cfg.screamSound, 1.0, false);
                burnState.screamSoundPlayed = true;
            }
        } else if (!burnState.runOnFire && Math.random() < 0.10) {
            burnState.runOnFire = true;
            burnState.runDirection = physics.x < (physics.leftWall + physics.rightWall) / 2 ? 1 : -1;
        }
        if (burnState.runOnFire) {
            if (!burnState.runStarted) {
                burnState.runStarted = true;
                burnState.runId = `${Date.now()}_${Math.random()}`;
                physics._burnRunId = burnState.runId;
                physics.scaleX = 1;
                physics.scaleY = 1;
                physics.bodySquashX = 1;
                physics.bodySquashY = 1;
                physics.vx = 0;
                if (burnState.runDirection === null) {
                    burnState.runDirection = physics.x < (physics.leftWall + physics.rightWall) / 2 ? 1 : -1;
                }
                physics.fleeActive = true;
                physics.walkActive = true;
                physics.walkTarget = burnState.runDirection > 0 ? physics.rightWall : physics.leftWall;
                bossContainer.classList.add('flamethrower-running');
                if (window.soundEngine && cfg.screamSound && !physics._burnSoundPlayed) {
                    window.soundEngine.playAudioFile(cfg.screamSound, 1.0, false);
                    physics._burnSoundPlayed = true;
                }
                physics._burnRunTimer = setInterval(() => {
                    if (!window.physicsEngine || window.physicsEngine._burnRunId !== burnState.runId) {
                        clearInterval(physics._burnRunTimer);
                        return;
                    }
                    const currentPhysics = window.physicsEngine;
                    if (currentPhysics.x <= currentPhysics.leftWall + 8) {
                        burnState.runDirection = 1;
                    } else if (currentPhysics.x >= currentPhysics.rightWall - 8) {
                        burnState.runDirection = -1;
                    }
                    currentPhysics.walkTarget = burnState.runDirection > 0
                        ? currentPhysics.rightWall
                        : currentPhysics.leftWall;
                    currentPhysics.walkActive = true;
                    currentPhysics.fleeActive = true;
                }, 50);
            }
            clearTimeout(physics._burnStopTimer);
            const runId = burnState.runId;
            physics._burnStopTimer = setTimeout(() => {
                if (window.physicsEngine && window.physicsEngine._burnRunId === runId) {
                    window.physicsEngine._burnRunId = null;
                    window.physicsEngine._burnRunTimer = null;
                    window.physicsEngine._burnStopTimer = null;
                    window.physicsEngine._burnSoundPlayed = false;
                    window.physicsEngine.stopWalking();
                    bossContainer.classList.remove('flamethrower-running');
                    burnState.runStarted = false;
                }
            }, 5000);
        }
    }

    spawnPaintSplash(localX, localY, cfg, splashFile) {
        const bossContainer = document.getElementById('game-boss-container');
        if (!bossContainer) return;
        const splash = document.createElement('img');
        splash.className = 'game-paint-splash';
        splash.src = encodeURI(`${cfg.folder}/${splashFile}`);
        splash.style.left = `${localX}px`;
        splash.style.top = `${localY}px`;
        splash.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg) scale(${0.65 + Math.random() * 0.55})`;
        bossContainer.appendChild(splash);
        setTimeout(() => { splash.style.opacity = '0'; }, 9000);
        setTimeout(() => { if (splash.parentElement) splash.remove(); }, 10000);
    }

    fireSingleShot(session, gunCfg) {
        if (!session || !session.gunEl || !session.gunEl.parentElement) return;

        if (gunCfg.flamethrower) {
            this.fireFlamethrowerShot(session, gunCfg);
            return;
        }

        const folder = session.folder;
        const frames = session.frames;
        const imgEl = session.imgEl;
        const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;

        const gunX = session.gunX;
        const gunY = session.gunY;

        // Requirement 3: Pick a random hit spot on the character body using gunCfg.bloodZone
        const bz = (gunCfg && gunCfg.bloodZone) ? gunCfg.bloodZone : { centerY: 240, spreadY: 150, spreadX: 110 };
        const centerY = (bz.centerY !== undefined) ? bz.centerY : 240;
        const spreadY = (bz.spreadY !== undefined) ? bz.spreadY : 150;
        const spreadX = (bz.spreadX !== undefined) ? bz.spreadX : 110;

        const localHitX = Math.max(30, Math.min(290, 160 + (Math.random() - 0.5) * (spreadX * 2)));
        const localHitY = Math.max(40, Math.min(370, centerY + (Math.random() - 0.5) * (spreadY * 2)));

        // Project local hit coordinates on boss container to stage coordinates
        const bScaleX = (window.physicsEngine && window.physicsEngine.scaleX) ? window.physicsEngine.scaleX * (window.physicsEngine.baseScale || 1.0) : 1.0;
        const bScaleY = (window.physicsEngine && window.physicsEngine.scaleY) ? window.physicsEngine.scaleY * (window.physicsEngine.baseScale || 1.0) : 1.0;
        const bAngleRad = (window.physicsEngine && window.physicsEngine.angle) ? (window.physicsEngine.angle * Math.PI / 180) : 0;
        const cosA = Math.cos(bAngleRad);
        const sinA = Math.sin(bAngleRad);

        const ox = (localHitX - 160) * bScaleX;
        const oy = (localHitY - 200) * bScaleY;

        const targetX = window.physicsEngine.x + (ox * cosA - oy * sinA);
        const targetY = (window.physicsEngine.y + (window.physicsEngine.walkBounceY || 0)) + (ox * sinA + oy * cosA);

        // Aim weapon at target
        session.targetX = targetX;
        session.targetY = targetY;
        const aimDx = targetX - gunX;
        const aimDy = targetY - gunY;
        const angleRad = Math.atan2(aimDy, aimDx);
        const angleDeg = angleRad * (180 / Math.PI);
        session.angleRad = angleRad;
        session.angleDeg = angleDeg;

        // Switch to Frame 2 (Muzzle Flash & Shot) with Frame 2's specific offsets and scale
        if (frames[1]) {
            this.applyGunFrame(session, frames[1], true);
        }

        // Gunshot Sound
        if (window.soundEngine) {
            if (gunCfg.sound) {
                window.soundEngine.playAudioFile(gunCfg.sound, 1.0, false);
            } else {
                window.soundEngine.playAttackSound(session.weaponId);
            }
        }

        // Recoil Kick (gun pushes back momentarily)
        const recoilKick = (gunCfg.recoilKick || 15) * bScale;
        const recoilX = gunX - Math.cos(angleRad) * recoilKick;
        const recoilY = gunY - Math.sin(angleRad) * recoilKick;
        session.gunEl.style.left = `${recoilX}px`;
        session.gunEl.style.top = `${recoilY}px`;

        // Snap back to cursor after kick
        setTimeout(() => {
            if (this.shootingSession && this.shootingSession.active && session.gunEl && session.gunEl.parentElement) {
                session.gunEl.style.left = `${session.gunX}px`;
                session.gunEl.style.top = `${session.gunY}px`;
            }
        }, 45);

        // Muzzle position for bullet exit using calibrated muzzleOffset
        const BASE_GUN_SCALE = 0.28;
        const f1Offset = (gunCfg.frameOffsets && gunCfg.frameOffsets[frames[1]]) ? gunCfg.frameOffsets[frames[1]] : {};
        const gunMul = (gunCfg.scale !== undefined ? gunCfg.scale : 1.0) * (f1Offset.scale !== undefined ? f1Offset.scale : 1.0) * bScale;
        const mOff = gunCfg.muzzleOffset || { x: 143, y: -20 };
        const isShootingRight = (aimDx >= 0);
        const mXLocal = (mOff.x + (f1Offset.x || 0)) * gunMul;
        const mYLocal = (mOff.y + (f1Offset.y || 0)) * gunMul * (isShootingRight ? 1 : -1);

        const muzzleX = gunX + (mXLocal * Math.cos(angleRad) - mYLocal * Math.sin(angleRad));
        const muzzleY = gunY + (mXLocal * Math.sin(angleRad) + mYLocal * Math.cos(angleRad));

        // Spawn bullet projectile(s) - Requirement 1: Shotgun shoots 5 bullets at once!
        const bulletFrame = gunCfg.projectileFiles
            ? gunCfg.projectileFiles[Math.floor(Math.random() * gunCfg.projectileFiles.length)]
            : (gunCfg.bullet || 'bullet.png');
        const bOffset = (gunCfg.frameOffsets && gunCfg.frameOffsets[bulletFrame]) ? gunCfg.frameOffsets[bulletFrame] : {};
        const bulletScale = (gunCfg.paintball
            ? (gunCfg.bulletScale || 0.9)
            : (bOffset.scale !== undefined ? bOffset.scale : (gunCfg.bulletScale || 0.5))) * BASE_GUN_SCALE * bScale * (gunCfg.scale !== undefined ? gunCfg.scale : 1.0);
        const bulletSpeed = gunCfg.bulletSpeed || 2200;

        const isShotgun = (session.weaponId === 'shotgun');
        const bulletCount = isShotgun ? 5 : 1;
        const totalDamage = gunCfg.damage || (isShotgun ? 60 : 35);
        const damagePerBullet = Math.max(5, Math.round(totalDamage / bulletCount));

        for (let bIdx = 0; bIdx < bulletCount; bIdx++) {
            // Shotgun spread offsets
            const spreadAngleDeg = isShotgun ? (angleDeg + (bIdx - 2) * 6 + (Math.random() - 0.5) * 4) : angleDeg;
            const bTargetX = isShotgun ? (targetX + (Math.random() - 0.5) * 70) : targetX;
            const bTargetY = isShotgun ? (targetY + (Math.random() - 0.5) * 80) : targetY;
            const bLocalHitX = isShotgun ? Math.max(30, Math.min(290, localHitX + (Math.random() - 0.5) * 60)) : localHitX;
            const bLocalHitY = isShotgun ? Math.max(40, Math.min(370, localHitY + (Math.random() - 0.5) * 70)) : localHitY;

            const bulletEl = document.createElement('div');
            bulletEl.className = 'game-bullet-projectile';
            if (gunCfg.paintball) bulletEl.classList.add('paintball-ball');
            bulletEl.style.left = `${muzzleX}px`;
            bulletEl.style.top = `${muzzleY}px`;
            bulletEl.style.transform = `translate(-50%, -50%) rotate(${spreadAngleDeg}deg) scale(${isShotgun ? bulletScale * 0.8 : bulletScale})`;
            bulletEl.innerHTML = `
                <img src="${encodeURI(folder + '/' + bulletFrame)}" alt="bullet" draggable="false"
                     style="display: block; pointer-events: none;">
            `;
            this.stageEl.appendChild(bulletEl);

            const flyDist = Math.hypot(bTargetX - muzzleX, bTargetY - muzzleY);
            const pelletSpeed = isShotgun ? (bulletSpeed * (0.90 + Math.random() * 0.20)) : bulletSpeed;
            const flightTimeMs = gunCfg.paintball
                ? Math.max(120, (flyDist / pelletSpeed) * 1000)
                : Math.max(35, Math.min(120, (flyDist / pelletSpeed) * 1000));
            const bulletStartTime = performance.now();

            const animateBullet = (now) => {
                const p = Math.min(1.0, (now - bulletStartTime) / flightTimeMs);
                const curX = muzzleX + (bTargetX - muzzleX) * p;
                const curY = muzzleY + (bTargetY - muzzleY) * p;
                if (bulletEl.parentElement) {
                    bulletEl.style.left = `${curX}px`;
                    bulletEl.style.top = `${curY}px`;
                }

                if (p < 1.0) {
                    requestAnimationFrame(animateBullet);
                } else {
                    if (bulletEl.parentElement) bulletEl.remove();

                    // Sparks & Damage Popup at hit point
                    this.spawnHitSparks(bTargetX, bTargetY);
                    if (!isShotgun || bIdx === 0) {
                        this.spawnDamagePopup(bTargetX, bTargetY - 40, totalDamage);
                    }

                    // Directional physics push away from gun
                    const hitPush = (damagePerBullet * 1.1) * (isShotgun ? 0.75 : 1.0);
                    window.physicsEngine.applyDirectionalHit(gunX, hitPush, bTargetY);

                    // Deal damage to boss
                    this.takeDamage(damagePerBullet, null, gunCfg);

                    // Blood splat
                    const bBloodCfg = isShotgun ? { ...gunCfg, bloodScale: (gunCfg.bloodScale || 0.4) * 0.75 } : gunCfg;
                    if (gunCfg.paintball) {
                        const splashFile = gunCfg.splashFiles && gunCfg.splashFiles[bulletFrame];
                        if (splashFile) this.spawnPaintSplash(bLocalHitX, bLocalHitY, gunCfg, splashFile);
                        if (window.soundEngine) window.soundEngine.playAudioFile(gunCfg.hitSound, 1.0, false);
                    } else {
                        this.spawnBloodSplatAt(bLocalHitX, bLocalHitY, bBloodCfg);
                    }
                }
            };
            requestAnimationFrame(animateBullet);
        }

        // Switch to Frame 3 (Bolt Cycle) with Frame 3's specific offsets and scale
        const frameSpeed = gunCfg.frameSpeed || 65;
        setTimeout(() => {
            if (session.active && frames[2]) {
                this.applyGunFrame(session, frames[2], false);
            }
        }, frameSpeed);

        // Return to Frame 1 (Ready) with Frame 1's specific offsets and scale
        setTimeout(() => {
            if (session.active && frames[0]) {
                this.applyGunFrame(session, frames[0], false);
            }
        }, frameSpeed * 2);
    }

    spawnBloodSplatAt(localX, localY, gunCfg) {
        // Requirement 3 FIX: Spawn blood splat at exact local coordinates on the character
        const bossContainer = document.getElementById('game-boss-container');
        if (!bossContainer) return;

        const bloodEl = document.createElement('img');
        const bloodPath = gunCfg && gunCfg.category === 'swords'
            ? 'attaker/swords/blood.png'
            : 'attaker/shooting/blood.png';
        bloodEl.src = bloodPath;
        bloodEl.className = 'game-blood-splat';
        bloodEl.alt = 'blood';

        const randRot = Math.floor(Math.random() * 360);
        const baseScale = (gunCfg && gunCfg.bloodScale !== undefined) ? gunCfg.bloodScale : 0.40;
        const scale = baseScale * (0.85 + Math.random() * 0.35);

        bloodEl.style.left = `${localX}px`;
        bloodEl.style.top = `${localY}px`;
        bloodEl.style.transform = `translate(-50%, -50%) rotate(${randRot}deg) scale(${scale})`;
        bloodEl.style.opacity = '0.92';

        bossContainer.appendChild(bloodEl);

        const duration = (gunCfg && gunCfg.bloodDuration) ? gunCfg.bloodDuration : 2400;
        setTimeout(() => {
            if (bloodEl.parentElement) {
                bloodEl.style.opacity = '0';
                setTimeout(() => {
                    if (bloodEl.parentElement) bloodEl.remove();
                }, 500);
            }
        }, duration);
    }

    // =========================================================================
    // SWORDS ENGINE (Physics Pendulum, Gravity, Circle-Around-Finger, Full Body Hitbox)
    // =========================================================================

    startSwordSession(weaponId, cursorX, cursorY) {
        if (!this.running) return;
        if (this.swordSession && this.swordSession.active) {
            this.endSwordSession();
        }

        const swordCfg = (window.coordinatesDB && window.coordinatesDB.getSwordConfig(weaponId)) || {
            id: weaponId,
            name: weaponId,
            folder: `attaker/swords/${weaponId}`,
            frame: 'frame1.png',
            sound: `attaker/swords/${weaponId}/${weaponId}.mp3`,
            damage: 45,
            scale: 0.55,
            scaleX: 1.0,
            scaleY: 1.0,
            rotation: 0,
            slashReach: 220,
            hitPush: 40,
            bloodScale: 0.45
        };

        const folder = swordCfg.folder || `attaker/swords/${weaponId}`;
        const frameFile = swordCfg.frame || 'frame1.png';

        // Sword handle is held directly at user's cursor / finger (Kick the Boss 3 style)
        const handleX = cursorX;
        const handleY = cursorY;

        const swordEl = document.createElement('div');
        swordEl.className = 'game-sword-actor';
        swordEl.style.left = `${handleX}px`;
        swordEl.style.top = `${handleY}px`;
        swordEl.innerHTML = `
            <img src="${encodeURI(folder + '/' + frameFile)}" alt="${weaponId}" draggable="false"
                 style="display: block; pointer-events: none;">
        `;
        this.stageEl.appendChild(swordEl);

        const session = {
            active: true,
            weaponId: weaponId,
            swordCfg: swordCfg,
            swordEl: swordEl,
            cursorX: cursorX,
            cursorY: cursorY,
            handleX: handleX,
            handleY: handleY,
            lastHandleX: handleX,
            lastHandleY: handleY,
            theta: Math.PI / 2, // Straight down towards ground (+Y)
            omega: 0,
            lastTime: performance.now(),
            lastHitTime: 0,
            animFrameId: null
        };
        this.swordSession = session;

        // 60fps Kick the Boss 3 pendulum physics loop
        const swordPhysicsLoop = (now) => {
            if (!session.active) return;
            const dt = Math.min(0.04, (now - session.lastTime) / 1000);
            session.lastTime = now;

            // Handle follows mouse / finger directly with 1:1 instantaneous response
            const newHx = session.cursorX;
            const newHy = session.cursorY;

            const vx = (newHx - session.lastHandleX) / Math.max(0.001, dt);
            const vy = (newHy - session.lastHandleY) / Math.max(0.001, dt);

            session.lastHandleX = newHx;
            session.lastHandleY = newHy;
            session.handleX = newHx;
            session.handleY = newHy;

            // Physics:
            // 1. Gravity pulls blade tip straight DOWN gently (+Y direction, theta = Math.PI / 2)
            const GRAVITY = 240;
            const tauGravity = GRAVITY * Math.cos(session.theta);

            // 2. Dynamic motion torque from handle movement & spinning
            const tauMotion = (vx * Math.sin(session.theta) - vy * Math.cos(session.theta)) * 0.35;

            // 3. Smooth angular velocity integration with light natural damping
            session.omega = (session.omega + (tauGravity + tauMotion) * dt) * 0.855;
            session.theta += session.omega * dt;

            // Render transform: tip points straight down when theta = PI / 2 (no static rotBase)
            const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;
            const baseScale = (swordCfg.scale || 0.55) * bScale;
            const sx = (swordCfg.scaleX || 1.0) * baseScale;
            const sy = (swordCfg.scaleY || 1.0) * baseScale;

            const visualDeg = (session.theta * 180 / Math.PI) + 90;
            swordEl.style.left = `${newHx}px`;
            swordEl.style.top = `${newHy}px`;
            swordEl.style.transform = `translate(-50%, -88%) rotate(${visualDeg}deg) scale(${sx}, ${sy})`;

            // Hitbox Collision with Mama Vana across her FULL body
            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;
            const charBScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;

            const charLeft = bossX - 125 * charBScale;
            const charRight = bossX + 125 * charBScale;
            const charTop = bossY - 220 * charBScale;
            const charBottom = bossY + 190 * charBScale;

            // Blade line segment from handle (newHx, newHy) to tip
            const bladeLen = (swordCfg.slashReach || 220) * baseScale;
            const tipX = newHx + Math.cos(session.theta) * bladeLen;
            const tipY = newHy + Math.sin(session.theta) * bladeLen;

            // Sample points along blade length
            let hitPoint = null;
            for (let t = 0.15; t <= 1.0; t += 0.14) {
                const px = newHx + (tipX - newHx) * t;
                const py = newHy + (tipY - newHy) * t;
                if (px >= charLeft && px <= charRight && py >= charTop && py <= charBottom) {
                    hitPoint = { px, py };
                    break;
                }
            }

            const bladeSpeed = Math.hypot(vx, vy) + Math.abs(session.omega) * bladeLen;
            if (hitPoint && bladeSpeed > 140 && (now - session.lastHitTime > 120) && !session.cucumberBroken) {
                session.lastHitTime = now;
                this.triggerSwordHit(session, newHx, newHy, hitPoint.px, hitPoint.py, vx, vy, bladeSpeed);
            }

            session.animFrameId = requestAnimationFrame(swordPhysicsLoop);
        };

        session.animFrameId = requestAnimationFrame(swordPhysicsLoop);
    }

    updateSwordSession(cursorX, cursorY) {
        const session = this.swordSession;
        if (!session || !session.active) return;
        session.cursorX = cursorX;
        session.cursorY = cursorY;
    }

    triggerSwordHit(session, handleX, handleY, contactX, contactY, vx, vy, bladeSpeed) {
        const swordCfg = session.swordCfg;
        const damage = swordCfg.damage || 45;

        if (session.weaponId === 'cucumber' && Math.random() < (swordCfg.splitChance || 0.05)) {
            session.cucumberBroken = true;
            const image = session.swordEl && session.swordEl.querySelector('img');
            if (image) image.src = encodeURI(`${swordCfg.folder}/${swordCfg.bottomFile}`);
            if (window.soundEngine) window.soundEngine.playAudioFile(swordCfg.splitSound, 1.0, false);
            this.throwMinecraftActor(contactX, contactY, vx || (Math.random() - 0.5) * 400, vy || -500, {
                projectileFolder: swordCfg.folder,
                projectileFile: swordCfg.upperFile,
                throwSound: null,
                hitSound: swordCfg.sound,
                damage,
                lifetimeMs: 10000,
                actorSize: 110,
                collisionSize: 16,
                actorCollisionSize: 22,
                postHitGravity: 950,
                groundOffset: 88,
                restAngle: 90,
                cucumberProjectile: true,
                customProjectile: true
            });
        }

        // Sound
        if (window.soundEngine) {
            if (swordCfg.sound) {
                window.soundEngine.playAudioFile(swordCfg.sound, 1.0, false);
            } else {
                window.soundEngine.playPunch();
            }
        }

        // Floor mop extra sound after each 20 hits
        if (!this.swordHitCounts) this.swordHitCounts = {};
        const sKey = session.weaponId || 'sword';
        this.swordHitCounts[sKey] = (this.swordHitCounts[sKey] || 0) + 1;
        if ((sKey === 'floor_mop' || sKey === 'floor mop') && (this.swordHitCounts[sKey] % 20 === 0)) {
            if (window.soundEngine) {
                const extraSnd = swordCfg.extraSound || 'attaker/swords/floor mop/extra sound.mp3';
                window.soundEngine.playAudioFile(extraSnd, 1.0, false);
            }
        }

        // Sparks & Damage popup at the EXACT contact point on the body
        this.spawnHitSparks(contactX, contactY);
        this.spawnDamagePopup(contactX, contactY - 40, damage);

        // Directional physics push based on blade motion
        const pushMag = (swordCfg.hitPush || 40) * Math.min(2.0, bladeSpeed / 400);
        window.physicsEngine.applyDirectionalHit(handleX, pushMag, contactY);

        // Deal damage
        this.takeDamage(damage, null, swordCfg);

        // Blood splat right on Mama Vana where the blade made contact!
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        const localHitX = Math.max(35, Math.min(285, 160 + (contactX - bossX) / bScale));
        const localHitY = Math.max(40, Math.min(365, 200 + (contactY - bossY) / bScale));
        this.spawnBloodSplatAt(localHitX, localHitY, swordCfg);
    }

    endSwordSession() {
        const session = this.swordSession;
        if (!session) return;
        session.active = false;
        if (session.animFrameId) {
            cancelAnimationFrame(session.animFrameId);
            session.animFrameId = null;
        }
        if (session.swordEl && session.swordEl.parentElement) {
            session.swordEl.style.opacity = '0';
            setTimeout(() => {
                if (session.swordEl && session.swordEl.parentElement) session.swordEl.remove();
            }, 140);
        }
        this.swordSession = null;
    }

    // =========================================================================
    // SPECIAL WEAPONS (Shuriken Orbit & Throw, Scorpion Spear & Chain Pull)
    // =========================================================================

    startSpecialSession(weaponId, cursorX, cursorY) {
        if (!this.running) return;
        if (this.specialSession && this.specialSession.active) {
            if (this.specialSession.weaponId === 'scorpion') {
                this.cancelScorpionSession(this.specialSession);
            } else {
                this.endSpecialSession();
            }
        }

        if (weaponId === 'shuriken') {
            this.startShurikenSession(cursorX, cursorY);
        } else if (weaponId === 'pencil') {
            this.startPencilSession(cursorX, cursorY);
        } else if (weaponId === 'scorpion') {
            this.startScorpionSession(cursorX, cursorY);
        } else if (weaponId === 'elder_wand' || weaponId === 'elder wand') {
            this.startElderWandSession(cursorX, cursorY);
        } else if (weaponId === 'spiders' || weaponId === 'spider') {
            this.dropSpider(cursorX, cursorY);
        } else if (weaponId === 'minecraft_blocks') {
            this.startMinecraftSession(cursorX, cursorY);
        } else if (weaponId === 'flip_flop') {
            this.startFlipFlopSession(cursorX, cursorY);
        } else if (weaponId === 'watermelon') {
            this.startWatermelonSession(cursorX, cursorY);
        } else if (weaponId === 'drone') {
            this.dropDrone(cursorX, cursorY);
        } else if (weaponId === 'coca_cola') {
            this.startCocaColaSession(cursorX, cursorY);
        }
    }

    updateSpecialSession(cursorX, cursorY, clientX, clientY) {
        if (!this.specialSession || !this.specialSession.active) return;
        if (this.specialSession.weaponId === 'shuriken') {
            this.updateShurikenSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'pencil') {
            this.updatePencilSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'scorpion') {
            this.updateScorpionSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'elder_wand' || this.specialSession.weaponId === 'elder wand') {
            this.updateElderWandSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'minecraft_blocks') {
            this.updateMinecraftSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'flip_flop') {
            this.updateFlipFlopSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'watermelon') {
            this.updateWatermelonSession(cursorX, cursorY);
        } else if (this.specialSession.weaponId === 'coca_cola') {
            this.updateCocaColaSession(cursorX, cursorY);
        }
    }

    endSpecialSession() {
        if (!this.specialSession) return;
        if (this.specialSession.weaponId === 'shuriken') {
            this.endShurikenSession();
        } else if (this.specialSession.weaponId === 'pencil') {
            this.endPencilSession();
        } else if (this.specialSession.weaponId === 'scorpion') {
            this.endScorpionSession();
        } else if (this.specialSession.weaponId === 'elder_wand' || this.specialSession.weaponId === 'elder wand') {
            this.endElderWandSession();
        } else if (this.specialSession.weaponId === 'minecraft_blocks') {
            this.endMinecraftSession();
        } else if (this.specialSession.weaponId === 'flip_flop') {
            this.endFlipFlopSession();
        } else if (this.specialSession.weaponId === 'watermelon') {
            this.endWatermelonSession();
        } else if (this.specialSession.weaponId === 'coca_cola') {
            this.endCocaColaSession();
        }
    }

    // -------------------------------------------------------------------------
    // MINECRAFT BLOCK / SHEEP SWIPE WEAPON
    // -------------------------------------------------------------------------

    startMinecraftSession(cursorX, cursorY) {
        const cfg = {
            throwSound: 'attaker/special/minecrat/throw.mp3',
            hitSound: 'attaker/special/minecrat/hit.mp3',
            sheepSound: 'attaker/special/minecrat/sheep.mp3',
            ...(window.coordinatesDB ? window.coordinatesDB.getSpecialConfig('minecraft_blocks') : {})
        };
        this.specialSession = {
            active: true,
            weaponId: 'minecraft_blocks',
            cfg,
            startX: cursorX,
            startY: cursorY,
            cursorX,
            cursorY,
            hasThrown: false
        };
    }

    updateMinecraftSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.hasThrown) return;
        session.cursorX = cursorX;
        session.cursorY = cursorY;

        const dx = cursorX - session.startX;
        const dy = cursorY - session.startY;
        if (Math.hypot(dx, dy) < 28) return;

        session.hasThrown = true;
        this.throwMinecraftActor(session.startX, session.startY, dx, dy, session.cfg);
    }

    endMinecraftSession() {
        if (!this.specialSession || this.specialSession.weaponId !== 'minecraft_blocks') return;
        this.specialSession.active = false;
        this.specialSession = null;
    }

    startFlipFlopSession(cursorX, cursorY) {
        const cfg = {
            throwSound: 'attaker/special/flip flop/throw.mp3',
            hitSound: 'attaker/special/flip flop/hit.mp3',
            klashSound: 'attaker/special/flip flop/klash.mp3',
            ...(window.coordinatesDB ? window.coordinatesDB.getSpecialConfig('flip_flop') : {})
        };
        this.specialSession = {
            active: true,
            weaponId: 'flip_flop',
            cfg,
            startX: cursorX,
            startY: cursorY,
            cursorX,
            cursorY,
            hasThrown: false
        };
    }

    updateFlipFlopSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.hasThrown) return;
        session.cursorX = cursorX;
        session.cursorY = cursorY;
        const dx = cursorX - session.startX;
        const dy = cursorY - session.startY;
        if (Math.hypot(dx, dy) < 28) return;
        session.hasThrown = true;
        this.throwMinecraftActor(session.startX, session.startY, dx, dy, session.cfg);
    }

    endFlipFlopSession() {
        if (!this.specialSession || this.specialSession.weaponId !== 'flip_flop') return;
        this.specialSession.active = false;
        this.specialSession = null;
    }

    startWatermelonSession(cursorX, cursorY) {
        const cfg = (window.coordinatesDB && window.coordinatesDB.getSpecialConfig('watermelon')) || {};
        const session = this.specialSession = {
            active: true,
            weaponId: 'watermelon',
            cfg,
            startX: cursorX,
            startY: cursorY,
            cursorX,
            cursorY,
            startedAt: performance.now(),
            hasThrown: false
        };
    }

    updateWatermelonHold(session) {
        return session;
    }

    updateWatermelonSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.hasThrown) return;
        session.cursorX = cursorX;
        session.cursorY = cursorY;
        const dx = cursorX - session.startX;
        const dy = cursorY - session.startY;
        if (Math.hypot(dx, dy) >= 28) {
            session.hasThrown = true;
            this.throwMinecraftActor(session.startX, session.startY, dx, dy, {
                ...session.cfg,
                projectileFolder: session.cfg.folder,
                projectileFile: session.cfg.frame1,
                throwSound: session.cfg.throwSound,
                watermelon: true,
                customProjectile: true
            });
        } else {
            this.updateWatermelonHold(session);
        }
    }

    endWatermelonSession() {
        const session = this.specialSession;
        if (!session || session.weaponId !== 'watermelon') return;
        if (!session.hasThrown) {
            session.hasThrown = true;
            const dx = window.physicsEngine.x - session.startX;
            const dy = window.physicsEngine.y - session.startY;
            this.throwMinecraftActor(session.startX, session.startY, dx, dy, {
                ...session.cfg,
                projectileFolder: session.cfg.folder,
                projectileFile: session.cfg.frame1,
                throwSound: session.cfg.throwSound,
                watermelon: true,
                customProjectile: true
            });
        }
        session.active = false;
        this.specialSession = null;
    }

    onWatermelonHit(actor) {
        const cfg = actor.soundConfig || {};
        this.removeMinecraftActor(actor);
        if (window.soundEngine && Math.random() < 0.10) window.soundEngine.playAudioFile(cfg.rareSound, 1.0, false);
        const hit = document.createElement('img');
        hit.className = 'game-watermelon-hit';
        hit.src = encodeURI(`${cfg.folder}/${cfg.hitFrames[0]}`);
        hit.style.left = `${actor.hitX ?? actor.x}px`;
        hit.style.top = `${actor.hitY ?? actor.y}px`;
        this.stageEl.appendChild(hit);
        setTimeout(() => {
            if (hit.parentElement && cfg.hitFrames[1]) hit.src = encodeURI(`${cfg.folder}/${cfg.hitFrames[1]}`);
        }, 90);
        setTimeout(() => { if (hit.parentElement) hit.remove(); }, 320);
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            this.throwMinecraftActor(actor.x, actor.y, (Math.random() - 0.5) * 750, -500 - Math.random() * 300, {
                projectileFolder: cfg.folder,
                projectileFile: cfg.parts[Math.floor(Math.random() * cfg.parts.length)],
                throwSound: null,
                hitSound: null,
                lifetimeMs: cfg.lifetimeMs || 10000,
                actorSize: 32,
                collisionSize: 12,
                actorCollisionSize: 18,
                postHitGravity: 1050,
                customProjectile: true
            });
        }
    }

    dropDrone(startX, startY) {
        if (performance.now() < (this.droneSuicideCooldownUntil || 0)) return;
        const cfg = (window.coordinatesDB && window.coordinatesDB.getSpecialConfig('drone')) || {};
        startX = Math.max(80, Math.min(this.stageEl.clientWidth - 80, startX));
        startY = Math.max(45, Math.min(this.stageEl.clientHeight - 45, startY));
        const drone = document.createElement('div');
        drone.className = 'game-drone-actor';
        drone.innerHTML = `<img src="${encodeURI(`${cfg.folder}/${cfg.frame}`)}" alt="drone" draggable="false">`;
        drone.style.left = `${startX}px`;
        drone.style.top = `${startY}px`;
        this.stageEl.appendChild(drone);
        const state = {
            el: drone, cfg, x: startX, y: startY, startX, startY,
            active: true, shots: 0, suicide: Math.random() < 0.05,
            bullets: new Set(), shootFrameTimer: null
        };
        this.activeDrones.push(state);
        if (cfg.flySound && window.soundEngine && !window.soundEngine.muted) {
            state.flyAudio = new Audio(encodeURI(cfg.flySound));
            state.flyAudio.loop = true;
            state.flyAudio.volume = Math.min(1, window.soundEngine.sfxVolume * 0.45);
            state.flyAudio.play().catch(() => {});
        }
        const stageWidth = this.stageEl.clientWidth;
        const margin = 90;
        let targetX = Math.max(margin, Math.min(stageWidth - margin,
            window.physicsEngine.x + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 150)));
        let targetY = 90 + Math.random() * 80;
        const otherDrones = this.activeDrones.filter(other => other !== state && other.active && !other.leaving && other.hoverX !== undefined);
        let bestSeparation = -1;
        for (let attempt = 0; attempt < 60; attempt++) {
            const candidateX = margin + Math.random() * Math.max(1, stageWidth - margin * 2);
            const candidateY = 70 + Math.random() * Math.max(1, Math.min(this.stageEl.clientHeight * 0.45, 340) - 70);
            const separated = otherDrones.every(other =>
                Math.abs(candidateX - other.hoverX) >= 175 || Math.abs(candidateY - other.hoverY) >= 130);
            if (separated) {
                targetX = candidateX;
                targetY = candidateY;
                bestSeparation = Infinity;
                break;
            }
            const separation = otherDrones.reduce((closest, other) => Math.min(closest,
                Math.hypot(candidateX - other.hoverX, candidateY - other.hoverY)), Infinity);
            if (separation > bestSeparation) {
                bestSeparation = separation;
                targetX = candidateX;
                targetY = candidateY;
            }
        }
        state.hoverX = targetX;
        state.hoverY = targetY;
        if (state.suicide) {
            const explosionDuration = (cfg.explosionFrames || []).length * 420 + 250;
            this.droneSuicideCooldownUntil = performance.now() + 700 + 1050 + explosionDuration;
            otherDrones.forEach(other => this.exitDrone(other));
        }
        const begin = performance.now();
        const flyIn = (now) => {
            if (!state.active) return;
            const p = Math.min(1, (now - begin) / 700);
            state.x = startX + (targetX - startX) * p;
            state.y = startY + (targetY - startY) * p;
            drone.style.left = `${state.x}px`;
            drone.style.top = `${state.y}px`;
            drone.style.transform = `translate(-50%, -50%) scaleX(${state.x < window.physicsEngine.x ? -1 : 1})`;
            if (p < 1) requestAnimationFrame(flyIn);
            else if (state.suicide) this.droneSuicide(state);
            else this.fireDroneShots(state);
        };
        requestAnimationFrame(flyIn);
    }

    fireDroneShots(state) {
        if (!state.active || state.shots >= (state.cfg.maxShots || 10)) {
            this.exitDrone(state);
            return;
        }
        state.shots++;
        const image = state.el.querySelector('img');
        const frames = state.cfg.shootFrames || [];
        if (image && frames.length) image.src = encodeURI(`${state.cfg.folder}/${frames[0]}`);
        state.el.style.transform = `translate(-50%, -50%) scaleX(${state.x < window.physicsEngine.x ? -1 : 1})`;
        let frameIndex = 0;
        if (state.shootFrameTimer) clearInterval(state.shootFrameTimer);
        state.shootFrameTimer = frames.length > 1 ? setInterval(() => {
            if (!state.active || !image) return clearInterval(state.shootFrameTimer);
            frameIndex = (frameIndex + 1) % frames.length;
            image.src = encodeURI(`${state.cfg.folder}/${frames[frameIndex]}`);
        }, 85) : null;
        if (window.soundEngine) window.soundEngine.playAudioFile(state.cfg.fireSound, 0.8, false);
        const targetX = window.physicsEngine.x + (Math.random() - 0.5) * 120;
        const targetY = window.physicsEngine.y + (Math.random() - 0.5) * 220;
        const bullet = document.createElement('img');
        bullet.className = 'game-drone-bullet';
        bullet.src = encodeURI(`${state.cfg.folder}/${state.cfg.bullet}`);
        bullet.style.left = `${state.x}px`;
        bullet.style.top = `${state.y}px`;
        bullet.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(targetY - state.y, targetX - state.x) * 180 / Math.PI}deg)`;
        this.stageEl.appendChild(bullet);
        state.bullets.add(bullet);
        const removeBullet = () => {
            bullet.remove();
            state.bullets.delete(bullet);
        };
        const start = performance.now();
        const flight = (now) => {
            if (!state.active) {
                removeBullet();
                return;
            }
            const p = Math.min(1, (now - start) / 260);
            bullet.style.left = `${state.x + (targetX - state.x) * p}px`;
            bullet.style.top = `${state.y + (targetY - state.y) * p}px`;
            if (p < 1) requestAnimationFrame(flight);
            else {
                removeBullet();
                this.spawnHitSparks(targetX, targetY);
                window.physicsEngine.applyDirectionalHit(state.x, (state.cfg.damage || 18) * 1.2, targetY);
                this.takeDamage(state.cfg.damage || 18, null, state.cfg);
                this.spawnDamagePopup(targetX, targetY - 30, state.cfg.damage || 18);
            }
        };
        requestAnimationFrame(flight);
        setTimeout(() => {
            if (state.active && !state.leaving) {
                if (state.shootFrameTimer) clearInterval(state.shootFrameTimer);
                state.shootFrameTimer = null;
                if (image && state.cfg.frame) image.src = encodeURI(`${state.cfg.folder}/${state.cfg.frame}`);
                this.fireDroneShots(state);
            } else if (state.shootFrameTimer) {
                clearInterval(state.shootFrameTimer);
                state.shootFrameTimer = null;
            }
        }, 320);
    }

    exitDrone(state) {
        if (!state.active || state.leaving) return;
        state.leaving = true;
        const stageWidth = this.stageEl.clientWidth;
        const direction = state.x < stageWidth / 2 ? -1 : 1;
        const startX = state.x;
        const startY = state.y;
        const endX = direction < 0 ? -100 : stageWidth + 100;
        const endY = Math.max(-100, startY - 65);
        const startedAt = performance.now();
        const flyOut = (now) => {
            if (!state.active) return;
            const progress = Math.min(1, (now - startedAt) / 750);
            state.x = startX + (endX - startX) * progress;
            state.y = startY + (endY - startY) * progress;
            state.el.style.left = `${state.x}px`;
            state.el.style.top = `${state.y}px`;
            state.el.style.transform = `translate(-50%, -50%) scaleX(${direction})`;
            if (progress < 1) requestAnimationFrame(flyOut);
            else this.removeDrone(state);
        };
        requestAnimationFrame(flyOut);
    }

    droneSuicide(state) {
        if (window.soundEngine) window.soundEngine.playAudioFile(state.cfg.suicideSound, 1.0, false);
        const start = performance.now();
        const fromX = state.x;
        const fromY = state.y;
        const dive = (now) => {
            if (!state.active) return;
            const p = Math.min(1, (now - start) / 1050);
            state.x = fromX + (window.physicsEngine.x - fromX) * p;
            state.y = fromY + (window.physicsEngine.y - fromY) * p;
            state.el.style.left = `${state.x}px`;
            state.el.style.top = `${state.y}px`;
            if (p < 1) requestAnimationFrame(dive);
            else {
                this.spawnDroneExplosion(state.x, this.stageEl.clientHeight, state.cfg);
                window.physicsEngine.applyDirectionalHit(state.x, 150, state.y);
                this.takeDamage(state.cfg.damage || 18, null, state.cfg);
                this.removeDrone(state);
            }
        };
        requestAnimationFrame(dive);
    }

    spawnDroneExplosion(x, y, cfg) {
        if (!cfg.explosionFrames || !cfg.explosionFrames.length) return;
        const explosionDuration = cfg.explosionFrames.length * 420 + 250;
        this.stageEl.style.setProperty('--drone-blast-duration', `${explosionDuration}ms`);
        this.droneSuicideCooldownUntil = Math.max(this.droneSuicideCooldownUntil || 0, performance.now() + explosionDuration);
        this.stageEl.classList.remove('drone-explosion-shake');
        void this.stageEl.offsetWidth;
        this.stageEl.classList.add('drone-explosion-shake');
        clearTimeout(this.droneExplosionShakeTimer);
        this.droneExplosionShakeTimer = setTimeout(() => {
            this.stageEl.classList.remove('drone-explosion-shake');
        }, explosionDuration);
        const darkness = document.createElement('div');
        darkness.className = 'game-drone-blast-darkness';
        darkness.style.animationDuration = `${explosionDuration}ms`;
        this.stageEl.appendChild(darkness);
        setTimeout(() => darkness.remove(), explosionDuration);
        const explosion = document.createElement('img');
        explosion.className = 'game-drone-explosion';
        explosion.src = encodeURI(`${cfg.folder}/${cfg.explosionFrames[0]}`);
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        explosion.style.transform = 'translate(-50%, -100%)';
        this.stageEl.appendChild(explosion);
        cfg.explosionFrames.forEach((frame, index) => setTimeout(() => {
            if (explosion.parentElement) explosion.src = encodeURI(`${cfg.folder}/${frame}`);
        }, index * 420));
        setTimeout(() => { if (explosion.parentElement) explosion.remove(); }, explosionDuration);
    }

    removeDrone(state) {
        if (!state || !state.active) return;
        state.active = false;
        if (state.shootFrameTimer) clearInterval(state.shootFrameTimer);
        if (state.bullets) {
            state.bullets.forEach(bullet => bullet.remove());
            state.bullets.clear();
        }
        if (state.flyAudio) {
            state.flyAudio.pause();
            state.flyAudio.currentTime = 0;
        }
        if (state.el && state.el.parentElement) state.el.remove();
        this.activeDrones = this.activeDrones.filter(item => item !== state);
    }

    startCocaColaSession(cursorX, cursorY) {
        const cfg = {
            folder: 'attaker/special/coca cola',
            frame1: 'frame1.png',
            frame2: 'frame2.png',
            capFile: 'cap.png',
            hitSound: 'attaker/special/coca cola/hit.mp3',
            capHitSound: 'attaker/special/coca cola/cap hit.mp3',
            holdSound: 'attaker/special/coca cola/sound.mp3',
            crashSound: 'attaker/special/coca cola/crash.mp3',
            crashImage: 'attaker/special/coca cola/crash.png',
            damage: 16,
            actorSize: 58,
            collisionSize: 24,
            actorCollisionSize: 24,
            postHitGravity: 1050,
            ...(window.coordinatesDB ? window.coordinatesDB.getSpecialConfig('coca_cola') : {})
        };
        const session = this.specialSession = {
            active: true,
            weaponId: 'coca_cola',
            cfg,
            startX: cursorX,
            startY: cursorY,
            cursorX,
            cursorY,
            hasThrown: false,
            startedAt: performance.now(),
            frameFile: Math.random() < 0.25 ? cfg.frame2 : cfg.frame1,
            holdActor: null,
            holdFaceState: null,
            fleeDirection: 0,
            nearBottle: false,
            fleeStarted: false,
            holdFile: null,
            holdSoundTimer: null
        };
        this.startCocaColaHold(session);
    }

    startCocaColaHold(session) {
        session.holdActor = document.createElement('div');
        session.holdActor.className = 'game-coca-cola-actor';
        const holdFile = Math.random() < 0.10 ? session.cfg.capFile : session.frameFile;
        session.holdFile = holdFile;
        session.holdActor.classList.toggle('coca-cola-cap-actor', holdFile === session.cfg.capFile);
        session.holdActor.innerHTML = `<img src="${encodeURI(`${session.cfg.folder}/${holdFile}`)}" alt="Coca Cola" draggable="false">`;
        this.stageEl.appendChild(session.holdActor);
        this.updateCocaColaHoldPosition(session, session.cursorX, session.cursorY);
        const fleeLoop = () => {
            if (!session.active || !session.holdActor) return;
            this.updateCocaColaHoldPosition(session, session.cursorX, session.cursorY);
            session.fleeFrame = requestAnimationFrame(fleeLoop);
        };
        session.fleeFrame = requestAnimationFrame(fleeLoop);

        if (window.characterModel) {
            session.holdFaceState = {
                eyes: window.characterModel.overrideEyes,
                mouth: window.characterModel.state.mouths
            };
            window.characterModel.overrideEyes = '2.png';
            window.characterModel.state.mouths = '202.png';
            window.characterModel.render(this.bossEl);
        }

        // Wait until the swipe/hold decision is settled so throws never play the hold sound.
        session.holdSoundTimer = setTimeout(() => {
            if (!session.active || !session.holdActor || session.holdFile === session.cfg.capFile) return;
            if (Math.random() < 0.25) this.playMinecraftSound(session.cfg.holdSound);
        }, 230);
    }

    updateCocaColaHoldPosition(session, cursorX, cursorY) {
        session.cursorX = cursorX;
        session.cursorY = cursorY;
        if (!session.holdActor) return;
        session.holdActor.style.left = `${cursorX}px`;
        session.holdActor.style.top = `${cursorY}px`;
        session.holdActor.style.transform = 'translate(-50%, -100%) rotate(0deg)';

        const physics = window.physicsEngine;
        if (!physics) return;
        const distance = cursorX - physics.x;
        const bottleDistance = Math.abs(distance);
        const bottleIsClose = bottleDistance < 580;
        if (bottleIsClose) {
            if (!session.fleeStarted) {
                session.fleeDirection = distance >= 0 ? -1 : 1;
                session.fleeStarted = true;
                session.nearBottle = bottleDistance <= 220;
            } else if (!session.nearBottle && bottleDistance <= 220) {
                session.fleeDirection *= -1;
                session.nearBottle = true;
            } else if (bottleDistance > 260) {
                session.nearBottle = false;
            }
            if (physics.x <= physics.leftWall + 4 && session.fleeDirection < 0) session.fleeDirection = 1;
            if (physics.x >= physics.rightWall - 4 && session.fleeDirection > 0) session.fleeDirection = -1;
            physics.fleeActive = true;
            physics.walkActive = true;
            physics.walkTarget = session.fleeDirection > 0 ? physics.rightWall : physics.leftWall;
        } else {
            session.nearBottle = false;
            session.fleeStarted = false;
            session.fleeDirection = 0;
            physics.fleeActive = false;
            physics.stopWalking();
        }
    }

    updateCocaColaSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.hasThrown) return;
        const dx = cursorX - session.startX;
        const dy = cursorY - session.startY;
        const isQuickSwipe = performance.now() - session.startedAt < 220;
        if (isQuickSwipe && Math.hypot(dx, dy) >= 28) {
            session.hasThrown = true;
            this.removeCocaColaHold(session);
            this.throwMinecraftActor(session.startX, session.startY, dx, dy, {
                ...session.cfg,
                cocaCola: true,
                projectileFile: session.frameFile
            });
            return;
        }
        this.updateCocaColaHoldPosition(session, cursorX, cursorY);
    }

    removeCocaColaHold(session) {
        if (session.holdActor && session.holdActor.parentElement) session.holdActor.remove();
        if (session.holdSoundTimer) clearTimeout(session.holdSoundTimer);
        session.holdSoundTimer = null;
        if (session.fleeFrame) cancelAnimationFrame(session.fleeFrame);
        session.fleeFrame = null;
        if (session.holdFaceState && window.characterModel) {
            window.characterModel.overrideEyes = session.holdFaceState.eyes;
            window.characterModel.state.mouths = session.holdFaceState.mouth;
            window.characterModel.render(this.bossEl);
        }
        session.holdActor = null;
    }

    endCocaColaSession() {
        const session = this.specialSession;
        if (!session || session.weaponId !== 'coca_cola') return;
        session.active = false;
        this.removeCocaColaHold(session);
        this.specialSession = null;
    }

    throwMinecraftActor(startX, startY, dx, dy, cfg) {
        const blockFiles = [
            'Block_of_Diamond.webp', 'Block_of_Gold.webp', 'Bookshel.webp', 'Bricks.webp',
            'Cobblestone.webp', 'Crafting_Table.webp', 'Dirt.webp', 'Glass.webp',
            'Grass_Block.webp', 'Hay_Bale.webp', 'Oak_Log.webp', 'Oak_Log_head.webp',
            'Oak_Planks.webp', 'Off_Furnace.webp', 'Stone_Bricks.webp', 'TNT.webp'
        ];
        const isFlipFlop = !!cfg.projectileFiles && !cfg.customProjectile;
        const isCocaCola = !!cfg.cocaCola;
        const isKlash = isFlipFlop && Math.random() < (cfg.klashChance || 0);
        const isCap = isCocaCola && Math.random() < 0.10;
        const isCustomProjectile = !!cfg.customProjectile || !!cfg.watermelon;
        const file = isCustomProjectile
            ? (cfg.projectileFile || cfg.frame1 || (cfg.projectileFiles && cfg.projectileFiles[0]))
            : isFlipFlop
            ? `${isKlash ? '' : `${cfg.projectileSubfolder || ''}/`}${isKlash ? cfg.klashFile : cfg.projectileFiles[Math.floor(Math.random() * cfg.projectileFiles.length)]}`
            : isCocaCola
                ? (isCap ? cfg.capFile : (cfg.projectileFile || cfg.frame1))
            : (Math.random() < 0.05 ? 'sheep.png' : `blocks/${blockFiles[Math.floor(Math.random() * blockFiles.length)]}`);
        const isSheep = !isFlipFlop && file === 'sheep.png';
        const assetFolder = cfg.projectileFolder || (isCocaCola ? cfg.folder : 'attaker/special/minecrat');
        const actor = document.createElement('div');
        actor.className = 'game-minecraft-actor';
        actor.style.left = `${startX}px`;
        actor.style.top = `${startY}px`;
        actor.style.transform = 'translate(-50%, -50%)';
        actor.style.pointerEvents = 'auto';
        if (isSheep) actor.classList.add('minecraft-sheep-actor');
        if (isFlipFlop) actor.classList.add('flip-flop-actor');
        if (isCocaCola) actor.classList.add('coca-cola-actor');
        if (isCustomProjectile) actor.classList.add('custom-projectile-actor');
        if (cfg.watermelon) actor.classList.add('watermelon-projectile-actor');
        if (cfg.cucumberProjectile) actor.classList.add('cucumber-projectile-actor');
        if (isCap) actor.classList.add('coca-cola-cap-actor');
        actor.innerHTML = `<img src="${encodeURI(`${assetFolder}/${file}`)}" alt="${isFlipFlop ? 'flip flop projectile' : 'minecraft projectile'}" draggable="false">`;
        this.stageEl.appendChild(actor);

        const length = Math.hypot(dx, dy) || 1;
        const actorData = {
            id: `minecraft_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            el: actor,
            soundConfig: cfg,
            lifetimeMs: cfg.lifetimeMs || 15000,
            x: startX,
            y: startY,
            vx: (dx / length) * 1300,
            vy: (dy / length) * 1300,
            angle: cfg.restAngle || 0,
            restAngle: cfg.restAngle || 0,
            angularVelocity: (Math.random() - 0.5) * 900,
            isSheep,
            isKlash,
            actorSize: cfg.actorSize || 46,
            collisionSize: cfg.collisionSize || 4,
            actorCollisionSize: cfg.actorCollisionSize || cfg.collisionSize || 4,
            gravity: 900,
            postHitGravity: cfg.postHitGravity || 900,
            groundOffset: cfg.groundOffset || 0,
            projectileType: isFlipFlop ? 'flip_flop' : (isCocaCola ? 'coca_cola' : (isCustomProjectile ? (cfg.watermelon ? 'watermelon' : 'custom') : 'minecraft')),
            isCocaCola,
            isCap,
            isDragging: false,
            dragOffsetX: 0,
            dragOffsetY: 0,
            pointerHistory: [],
            lastTime: performance.now(),
            active: true,
            animFrameId: null,
            cleanupListeners: null,
            expiresTimer: null
        };
        actor.dataset.minecraftId = actorData.id;
        this.activeMinecraftActors.push(actorData);

        this.playMinecraftSound(cfg.throwSound);
        this.bindMinecraftActorPhysics(actorData);
    }

    playMinecraftSound(soundPath) {
        if (!soundPath) return;
        try {
            const sound = new Audio(encodeURI(soundPath));
            sound.volume = 0.8;
            const playPromise = sound.play();
            if (playPromise) playPromise.catch(() => {});
        } catch (e) {}
    }

    bindMinecraftActorPhysics(actor) {
        const onPointerDown = (e) => {
            if (!actor.active || e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = this.stageEl.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            actor.isDragging = true;
            actor.hasHitCharacter = false;
            actor.onGround = false;
            actor.dragOffsetX = actor.x - px;
            actor.dragOffsetY = actor.y - py;
            actor.pointerHistory = [{ x: px, y: py, time: performance.now() }];
            this.draggedMinecraftActor = actor;
            this.pointerState.active = true;
            this.pointerState.isCharHit = false;
            this.pointerState.isDragging = true;
            if (actor.el.setPointerCapture && e.pointerId !== undefined) {
                try { actor.el.setPointerCapture(e.pointerId); } catch (_) {}
            }
        };
        const onPointerMove = (e) => {
            if (!actor.active || !actor.isDragging) return;
            e.preventDefault();
            const rect = this.stageEl.getBoundingClientRect();
            this.updateMinecraftActorDrag(e.clientX - rect.left, e.clientY - rect.top);
        };
        const onPointerUp = (e) => {
            if (!actor.isDragging) return;
            if (actor.el.releasePointerCapture && e.pointerId !== undefined) {
                try { actor.el.releasePointerCapture(e.pointerId); } catch (_) {}
            }
            this.endMinecraftActorDrag();
            this.pointerState.active = false;
            this.pointerState.isDragging = false;
        };
        actor.el.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        actor.cleanupListeners = () => {
            actor.el.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        actor.expiresTimer = setTimeout(() => {
            if (!actor.active) return;
            actor.fading = true;
            actor.el.classList.add('minecraft-actor-fading');
            setTimeout(() => this.removeMinecraftActor(actor), 800);
        }, actor.lifetimeMs);
        const physicsLoop = (now) => {
            if (!actor.active) return;
            try {
                const dt = Math.min(0.033, (now - actor.lastTime) / 1000);
                actor.lastTime = now;
                if (!actor.isDragging && !actor.fading) {
                if (!actor.hasHitCharacter) {
                    const nextX = actor.x + actor.vx * dt;
                    const nextY = actor.y + actor.vy * dt;
                    const insideCharacter = this.minecraftActorPathTouchesCharacter(actor, actor.x, actor.y, nextX, nextY);
                    if (insideCharacter) {
                        actor.hitX = nextX;
                        actor.hitY = nextY;
                        actor.hasHitCharacter = true;
                        actor.hitBounceUntil = performance.now() + 450;
                        const bossX = window.physicsEngine.x;
                        const awayDirection = actor.x >= bossX ? 1 : -1;
                        actor.x += awayDirection * 18;
                        actor.vx = awayDirection * (actor.projectileType === 'flip_flop' ? 500 : 520);
                        actor.vy = actor.projectileType === 'flip_flop' ? -420 : -520;
                        actor.gravity = actor.postHitGravity;
                        actor.angularVelocity *= 0.35;
                        const damage = actor.isSheep ? 10 : (actor.isKlash ? 18 : (actor.soundConfig.damage || 14));
                        const didCrash = actor.isCocaCola && !actor.isCap && Math.random() < 0.25;
                        const impactSound = actor.isSheep
                            ? actor.soundConfig.sheepSound
                            : actor.isCocaCola
                                ? (actor.isCap ? actor.soundConfig.capHitSound : (didCrash ? actor.soundConfig.crashSound : actor.soundConfig.hitSound))
                            : (actor.isKlash ? actor.soundConfig.klashSound : actor.soundConfig.hitSound);
                        if (actor.isKlash) {
                            this.triggerKlashDance(impactSound);
                        } else {
                            this.playMinecraftSound(impactSound);
                            try {
                                if (window.soundEngine && typeof window.soundEngine.playAudioFile === 'function') {
                                    window.soundEngine.playAudioFile(impactSound, 1.0, false);
                                }
                            } catch (e) {}
                        }
                        try { window.physicsEngine.applyDirectionalHit(actor.x, 12, actor.y); } catch (e) {}
                        try { this.takeDamage(damage, null, { bloodScale: 0.35 }); } catch (e) {}
                        try { this.spawnHitSparks(actor.x, actor.y); } catch (e) {}
                        if (actor.projectileType === 'watermelon') {
                            this.onWatermelonHit(actor);
                            return;
                        }
                        if (didCrash) {
                            this.spawnCocaColaCrash(actor.x, actor.y, actor.soundConfig);
                            this.removeMinecraftActor(actor);
                            return;
                        }
                        try { this.spawnDamagePopup(actor.x, actor.y - 30, damage); } catch (e) {}
                    }
                }
                actor.vy += actor.gravity * dt;
                actor.x += actor.vx * dt;
                actor.y += actor.vy * dt;
                actor.angle += actor.angularVelocity * dt;
                actor.angularVelocity *= 0.985;
                const floorY = this.stageEl.clientHeight - this.getMinecraftActorHalfHeight(actor) + actor.groundOffset;
                if (actor.y >= floorY) {
                    actor.y = floorY;
                    if (actor.projectileType === 'flip_flop' || actor.projectileType === 'coca_cola') {
                        actor.vy = Math.abs(actor.vy) > 80 ? -actor.vy * 0.16 : 0;
                        actor.vx *= actor.projectileType === 'coca_cola' ? 0.82 : 0.72;
                        actor.angularVelocity *= 0.86;
                    } else {
                        actor.vy = Math.abs(actor.vy) > 80 ? -actor.vy * 0.25 : 0;
                        actor.vx *= 0.35;
                    }
                    if (Math.abs(actor.vx) < 8) actor.vx = 0;
                    actor.onGround = true;
                    if (!actor.isSheep && actor.projectileType !== 'flip_flop' && actor.projectileType !== 'coca_cola') {
                        actor.angle = actor.restAngle || 0;
                        actor.angularVelocity = 0;
                    }
                }
                if (actor.x < 30 || actor.x > this.stageEl.clientWidth - 30) actor.vx *= -0.55;
                if (!actor.hitBounceUntil || performance.now() > actor.hitBounceUntil) {
                    this.resolveMinecraftActorCollisions(actor);
                }
                }
                actor.el.style.left = `${actor.x}px`;
                actor.el.style.top = `${actor.y}px`;
                actor.el.style.transform = `translate(-50%, -50%) rotate(${actor.angle}deg)`;
            } catch (e) {
                console.error('Minecraft projectile loop error:', e);
                actor.isDragging = false;
                actor.vy = Math.max(actor.vy || 0, 120);
                actor.y += actor.vy * 0.016;
                if (actor.el && actor.el.parentElement) {
                    actor.el.style.left = `${actor.x}px`;
                    actor.el.style.top = `${actor.y}px`;
                }
            }
            actor.animFrameId = requestAnimationFrame(physicsLoop);
        };
        actor.animFrameId = requestAnimationFrame(physicsLoop);
    }

    startMinecraftActorDrag(actorEl, clientX, clientY, localX, localY) {
        const actorId = actorEl.dataset.minecraftId;
        const actor = this.activeMinecraftActors.find(item => item.id === actorId);
        if (!actor) return false;
        actor.isDragging = true;
        actor.hasHitCharacter = false;
        actor.onGround = false;
        actor.dragOffsetX = actor.x - localX;
        actor.dragOffsetY = actor.y - localY;
        actor.pointerHistory = [{ x: localX, y: localY, time: performance.now() }];
        this.draggedMinecraftActor = actor;
        return true;
    }

    updateMinecraftActorDrag(localX, localY) {
        const actor = this.draggedMinecraftActor;
        if (!actor) return;
        actor.x = localX + actor.dragOffsetX;
        actor.y = localY + actor.dragOffsetY;
        actor.pointerHistory.push({ x: localX, y: localY, time: performance.now() });
        if (actor.pointerHistory.length > 6) actor.pointerHistory.shift();
        this.resolveMinecraftActorCollisions(actor);
    }

    getMinecraftActorHalfWidth(actor) {
        return actor.isSheep ? 130 : (actor.actorSize || 46);
    }

    getMinecraftActorHalfHeight(actor) {
        return actor.isSheep ? 130 : (actor.actorSize || 46);
    }

    getMinecraftActorCollisionHalfWidth(actor) {
        return actor.isSheep ? 130 : (actor.actorCollisionSize || actor.collisionSize || 4);
    }

    getMinecraftActorCollisionHalfHeight(actor) {
        return actor.isSheep ? 130 : (actor.actorCollisionSize || actor.collisionSize || 4);
    }

    getMinecraftActorPhysicsHalfWidth(actor) {
        return actor.isSheep ? 130 : (actor.actorCollisionSize || actor.collisionSize || 4);
    }

    getMinecraftActorPhysicsHalfHeight(actor) {
        return actor.isSheep ? 130 : (actor.actorCollisionSize || actor.collisionSize || 4);
    }

    getMinecraftCharacterHitRects() {
        if (!this.bossEl || !this.stageEl) return [];
        const stageRect = this.stageEl.getBoundingClientRect();
        const head = this.bossEl.querySelector('.mv-part-head_shapes img');
        const body = this.bossEl.querySelector('.mv-part-bodys img');
        const rects = [head, body]
            .filter(Boolean)
            .map(element => {
                const rect = element.getBoundingClientRect();
                const horizontalInset = rect.width * 0.16;
                const verticalInset = rect.height * 0.08;
                return {
                    left: rect.left + horizontalInset,
                    right: rect.right - horizontalInset,
                    top: rect.top + verticalInset,
                    bottom: rect.bottom - verticalInset
                };
            })
            .filter(rect => rect.right > rect.left && rect.bottom > rect.top)
            .map(rect => ({
                left: rect.left - stageRect.left,
                right: rect.right - stageRect.left,
                top: rect.top - stageRect.top,
                bottom: rect.bottom - stageRect.top
            }));

        return rects;
    }

    minecraftActorTouchesCharacter(actor, x, y) {
        const actorHalfW = this.getMinecraftActorPhysicsHalfWidth(actor);
        const actorHalfH = this.getMinecraftActorPhysicsHalfHeight(actor);
        if (!this.bossEl || !this.stageEl) return false;
        const stageRect = this.stageEl.getBoundingClientRect();
        const composite = this.bossEl.querySelector('.mv-character-composite');
        const bossRect = (composite || this.bossEl).getBoundingClientRect();
        const actorLeft = stageRect.left + x - actorHalfW;
        const actorRight = stageRect.left + x + actorHalfW;
        const actorTop = stageRect.top + y - actorHalfH;
        const actorBottom = stageRect.top + y + actorHalfH;
        return actorLeft < bossRect.right && actorRight > bossRect.left &&
            actorTop < bossRect.bottom && actorBottom > bossRect.top;
    }

    minecraftActorPathTouchesCharacter(actor, startX, startY, endX, endY) {
        const halfW = this.getMinecraftActorCollisionHalfWidth(actor);
        const halfH = this.getMinecraftActorCollisionHalfHeight(actor);
        const pathLeft = Math.min(startX, endX);
        const pathRight = Math.max(startX, endX);
        const pathTop = Math.min(startY, endY);
        const pathBottom = Math.max(startY, endY);

        return this.getMinecraftCharacterHitRects().some(rect => {
            const left = rect.left - halfW;
            const right = rect.right + halfW;
            const top = rect.top - halfH;
            const bottom = rect.bottom + halfH;
            return pathRight >= left && pathLeft <= right && pathBottom >= top && pathTop <= bottom;
        });
    }

    resolveMinecraftActorCollisions(actor) {
        if (!this.activeMinecraftActors || !actor.active || actor.fading) return;
        const actorHalfW = this.getMinecraftActorHalfWidth(actor);
        const actorHalfH = this.getMinecraftActorHalfHeight(actor);

        for (const other of this.activeMinecraftActors) {
            if (other === actor || !other.active || other.fading || actor.id >= other.id) continue;

            const dx = other.x - actor.x;
            const dy = other.y - actor.y;
            const overlapX = actorHalfW + this.getMinecraftActorPhysicsHalfWidth(other) - Math.abs(dx);
            const overlapY = actorHalfH + this.getMinecraftActorPhysicsHalfHeight(other) - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;

            const groundedFlipFlopPair = actor.projectileType === 'flip_flop' &&
                other.projectileType === 'flip_flop' && actor.onGround && other.onGround &&
                !actor.isDragging && !other.isDragging;
            const flipFlopHitsGroundedLine = actor.projectileType === 'flip_flop' &&
                other.projectileType === 'flip_flop' && (actor.onGround || other.onGround) &&
                !actor.isDragging && !other.isDragging;
            if (groundedFlipFlopPair) {
                if (overlapX < overlapY) {
                    const direction = dx >= 0 ? 1 : -1;
                    const separation = overlapX + 0.5;
                    actor.x -= direction * separation * 0.5;
                    other.x += direction * separation * 0.5;
                    actor.vx = 0;
                    other.vx = 0;
                } else {
                    const direction = dy >= 0 ? 1 : -1;
                    const separation = overlapY + 0.5;
                    actor.y -= direction * separation * 0.5;
                    other.y += direction * separation * 0.5;
                    actor.vy = Math.min(0, actor.vy);
                    other.vy = Math.min(0, other.vy);
                }
                continue;
            }

            if (flipFlopHitsGroundedLine && overlapX < overlapY) {
                const direction = dx >= 0 ? 1 : -1;
                const separation = overlapX + 0.5;
                actor.x -= direction * separation * 0.5;
                other.x += direction * separation * 0.5;
                actor.vx = 0;
                other.vx = 0;
                continue;
            }

            if (overlapX < overlapY) {
                const direction = dx >= 0 ? 1 : -1;
                const separation = overlapX + 1;
                if (actor.isDragging) {
                    other.x += direction * separation;
                    other.vx = Math.max(-2200, Math.min(2200, actor.vx * 0.65));
                } else if (other.isDragging) {
                    actor.x -= direction * separation;
                    actor.vx = Math.max(-2200, Math.min(2200, other.vx * 0.65));
                } else {
                    actor.x -= direction * separation * 0.5;
                    other.x += direction * separation * 0.5;
                    const push = Math.max(Math.abs(actor.vx), Math.abs(other.vx)) * 0.35;
                    actor.vx = -direction * push;
                    other.vx = direction * push;
                }
                if (actor.onGround && !actor.isDragging) actor.vx *= 0.35;
                if (other.onGround && !other.isDragging) other.vx *= 0.35;
            } else {
                const direction = dy >= 0 ? 1 : -1;
                const separation = overlapY + 1;
                if (actor.isDragging) {
                    other.y += direction * separation;
                    other.vy = Math.max(-2200, Math.min(2200, actor.vy * 0.65));
                } else if (other.isDragging) {
                    actor.y -= direction * separation;
                    actor.vy = Math.max(-2200, Math.min(2200, other.vy * 0.65));
                } else {
                    actor.y -= direction * separation * 0.5;
                    other.y += direction * separation * 0.5;
                    const push = Math.max(Math.abs(actor.vy), Math.abs(other.vy)) * 0.35;
                    actor.vy = -direction * push;
                    other.vy = direction * push;
                }
            }
        }
    }

    endMinecraftActorDrag() {
        const actor = this.draggedMinecraftActor;
        if (!actor) return;
        actor.isDragging = false;
        this.draggedMinecraftActor = null;
        const history = actor.pointerHistory;
        if (history.length >= 2) {
            const first = history[0];
            const last = history[history.length - 1];
            const dt = Math.max(0.02, (last.time - first.time) / 1000);
            actor.vx = Math.max(-2200, Math.min(2200, (last.x - first.x) / dt));
            actor.vy = Math.max(-2200, Math.min(2200, (last.y - first.y) / dt));
        }
    }

    removeMinecraftActor(actor) {
        if (!actor || !actor.active) return;
        actor.active = false;
        actor.fading = false;
        if (actor.animFrameId) cancelAnimationFrame(actor.animFrameId);
        if (actor.expiresTimer) clearTimeout(actor.expiresTimer);
        if (actor.cleanupListeners) actor.cleanupListeners();
        if (actor.el && actor.el.parentElement) actor.el.remove();
        this.activeMinecraftActors = this.activeMinecraftActors.filter(item => item !== actor);
        if (this.draggedMinecraftActor === actor) this.draggedMinecraftActor = null;
    }

    triggerKlashDance(soundPath) {
        const bodyGroup = this.bossEl && this.bossEl.querySelector('.mv-group-body');
        if (!bodyGroup) return;

        if (this.klashDanceTimer) clearTimeout(this.klashDanceTimer);
        if (this.klashSoundAudio) {
            try { this.klashSoundAudio.pause(); this.klashSoundAudio.currentTime = 0; } catch (e) {}
            this.klashSoundAudio = null;
        }
        bodyGroup.classList.remove('klash-kurdish-dance');
        void bodyGroup.offsetWidth;
        bodyGroup.classList.add('klash-kurdish-dance');

        if (soundPath) {
            try {
                const sound = new Audio(encodeURI(soundPath));
                sound.volume = 0.8;
                sound.play().catch(() => {});
                this.klashSoundAudio = sound;
            } catch (e) {}
        }

        this.klashDanceTimer = setTimeout(() => {
            bodyGroup.classList.remove('klash-kurdish-dance');
            this.klashDanceTimer = null;
        }, 10000);
    }

    stopKlashDance() {
        if (this.klashDanceTimer) {
            clearTimeout(this.klashDanceTimer);
            this.klashDanceTimer = null;
        }
        const bodyGroup = this.bossEl && this.bossEl.querySelector('.mv-group-body');
        if (bodyGroup) bodyGroup.classList.remove('klash-kurdish-dance');
        if (this.klashSoundAudio) {
            try { this.klashSoundAudio.pause(); this.klashSoundAudio.currentTime = 0; } catch (e) {}
            this.klashSoundAudio = null;
        }
    }

    startPencilSession(cursorX, cursorY) {
        const cfg = (window.coordinatesDB && window.coordinatesDB.getSpecialConfig('pencil')) || {};
        this.specialSession = {
            active: true,
            weaponId: 'pencil',
            cfg,
            startX: cursorX,
            startY: cursorY,
            cursorX,
            cursorY,
            hasThrown: false
        };
    }

    updatePencilSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.hasThrown) return;
        session.cursorX = cursorX;
        session.cursorY = cursorY;
        if (Math.hypot(cursorX - session.startX, cursorY - session.startY) > 14) {
            session.hasThrown = true;
            this.throwPencilProjectile(
                session.startX,
                session.startY,
                cursorX - session.startX,
                cursorY - session.startY,
                session.cfg
            );
        }
    }

    endPencilSession() {
        const session = this.specialSession;
        if (!session || session.weaponId !== 'pencil') return;
        if (!session.hasThrown) this.throwPencilProjectile(session.cursorX, session.cursorY, session.cfg);
        session.active = false;
        this.specialSession = null;
    }

    throwPencilProjectile(fromX, fromY, dirX, dirY, cfg) {
        if (cfg === undefined) {
            cfg = dirX || {};
            dirX = 0;
            dirY = 0;
        }
        const hasSwipeDirection = Math.hypot(dirX || 0, dirY || 0) > 3;
        const hitRects = this.getMinecraftCharacterHitRects();
        const targetRect = hitRects[Math.floor(Math.random() * hitRects.length)] || {
            left: window.physicsEngine.x - 80,
            right: window.physicsEngine.x + 80,
            top: window.physicsEngine.y - 180,
            bottom: window.physicsEngine.y + 120
        };
        const targetX = targetRect.left + Math.random() * (targetRect.right - targetRect.left);
        const targetY = targetRect.top + Math.random() * (targetRect.bottom - targetRect.top);
        const targetDistance = Math.hypot(targetX - fromX, targetY - fromY) || 1;
        const swipeDistance = hasSwipeDirection ? Math.hypot(dirX, dirY) : targetDistance;
        const directionX = hasSwipeDirection ? dirX / swipeDistance : (targetX - fromX) / targetDistance;
        const directionY = hasSwipeDirection ? dirY / swipeDistance : (targetY - fromY) / targetDistance;
        const angleDeg = Math.atan2(directionY, directionX) * 180 / Math.PI;
        const scale = (cfg.scale || 1) * ((window.innerWidth <= 600) ? 0.85 : 1);
        const pencilFile = (cfg.projectileFiles || ['pencil1.png', 'pencil2.png', 'pencil3.png', 'pencil4.png', 'pencil5.png'])[
            Math.floor(Math.random() * (cfg.projectileFiles || ['pencil1.png', 'pencil2.png', 'pencil3.png', 'pencil4.png', 'pencil5.png']).length)
        ];
        if (window.soundEngine && cfg.throwSound) window.soundEngine.playAudioFile(cfg.throwSound, 1, false);

        const pencilLength = 160 * scale;
        const halfLength = pencilLength * 0.5;
        const projectile = document.createElement('img');
        projectile.className = 'game-pencil-projectile';
        projectile.src = encodeURI(`${cfg.folder || 'attaker/special/pencil'}/${pencilFile}`);
        projectile.alt = 'pencil';
        this.stageEl.appendChild(projectile);

        const startedAt = performance.now();
        const speed = cfg.flySpeed || 2400;
        const stageWidth = this.stageEl.clientWidth;
        const stageHeight = this.stageEl.clientHeight;
        const flightDistance = hasSwipeDirection
            ? Math.hypot(stageWidth, stageHeight) * 1.5
            : targetDistance;
        const updateProjectile = (now) => {
            const progress = Math.min(flightDistance, (now - startedAt) * speed / 1000);
            const tipX = fromX + directionX * progress;
            const tipY = fromY + directionY * progress;
            projectile.style.left = `${tipX - directionX * halfLength}px`;
            projectile.style.top = `${tipY - directionY * halfLength}px`;
            projectile.style.transform = `translate(-50%, -50%) rotate(${angleDeg - 90}deg) scale(${scale})`;

            const collision = hitRects.find(rect =>
                tipX >= rect.left && tipX <= rect.right && tipY >= rect.top && tipY <= rect.bottom);
            if (collision || (progress >= flightDistance && !hasSwipeDirection)) {
                if (projectile.parentElement) projectile.remove();
                this.onPencilHitBoss(tipX, tipY, directionX, directionY, angleDeg - 90, pencilFile, scale, cfg);
                return;
            }
            if (tipX < -80 || tipX > stageWidth + 80 || tipY < -80 || tipY > stageHeight + 80 || progress >= flightDistance) {
                projectile.remove();
                return;
            }
            requestAnimationFrame(updateProjectile);
        };
        requestAnimationFrame(updateProjectile);
    }

    onPencilHitBoss(tipX, tipY, directionX, directionY, rotation, pencilFile, scale, cfg) {
        const bossContainer = document.getElementById('game-boss-container');
        if (!bossContainer || !window.physicsEngine) return;
        const baseScale = window.physicsEngine.baseScale || 1;
        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        const stuckScale = scale * 0.56;
        const hitHalfLength = (160 * stuckScale) / 2;
        const centerX = tipX - directionX * hitHalfLength;
        const centerY = tipY - directionY * hitHalfLength;
        const localX = Math.max(18, Math.min(302, 160 + (centerX - bossX) / baseScale));
        const localY = Math.max(18, Math.min(382, 200 + (centerY - bossY) / baseScale));
        const bloodTipX = tipX + directionX * 6;
        const bloodTipY = tipY + directionY * 6;
        const bloodX = Math.max(18, Math.min(302, 160 + (bloodTipX - bossX) / baseScale));
        const bloodY = Math.max(18, Math.min(382, 200 + (bloodTipY - bossY) / baseScale));
        const damage = cfg.damage || 24;

        this.spawnHitSparks(tipX, tipY);
        this.spawnDamagePopup(tipX, tipY - 36, damage);
        window.physicsEngine.applyDirectionalHit(tipX - directionX * 80, 24, tipY);
        this.takeDamage(damage, null, cfg);
        this.spawnBloodSplatAt(bloodX, bloodY, { bloodScale: Math.max(0.75, cfg.bloodScale || 0), bloodDuration: cfg.bloodDuration || 2200 });

        const stuck = document.createElement('img');
        stuck.className = 'game-pencil-stuck';
        const hitFile = pencilFile.replace(/\.png$/i, 'hit.png');
        stuck.src = encodeURI(`${cfg.folder || 'attaker/special/pencil'}/${hitFile}`);
        stuck.alt = 'pencil stuck in character';
        stuck.style.left = `${localX}px`;
        stuck.style.top = `${localY}px`;
        stuck.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${stuckScale})`;
        bossContainer.appendChild(stuck);
        setTimeout(() => {
            if (!stuck.parentElement) return;
            stuck.style.opacity = '0';
            setTimeout(() => stuck.remove(), 600);
        }, cfg.stickDuration || 5500);
    }

    // -------------------------------------------------------------------------
    // Shuriken Implementation
    // -------------------------------------------------------------------------

    startShurikenSession(cursorX, cursorY) {
        const cfg = (window.coordinatesDB && window.coordinatesDB.getSpecialConfig('shuriken')) || {
            damage: 30,
            scale: 1.0,
            orbitRadius: 75,
            flySpeed: 3200,
            sound: 'attaker/special/shuriken/shuriken.mp3',
            bloodScale: 0.45,
            stickDuration: 4500
        };

        const container = document.createElement('div');
        container.className = 'game-shuriken-orbit-container';
        container.style.left = `${cursorX}px`;
        container.style.top = `${cursorY}px`;
        container.style.opacity = '0'; // Start hidden; only show after 0.3s hold

        const orbitItems = [];
        const count = 3;
        const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;
        const scale = (cfg.scale || 1.0) * bScale;

        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = 'attaker/special/shuriken/frame1.png';
            img.className = 'game-shuriken-orbit-item';
            img.alt = 'shuriken';
            img.style.transform = `translate(-50%, -50%) scale(${scale})`;
            container.appendChild(img);
            orbitItems.push(img);
        }
        this.stageEl.appendChild(container);

        const session = {
            active: true,
            weaponId: 'shuriken',
            cfg,
            container,
            orbitItems,
            cursorX,
            cursorY,
            startX: cursorX,
            startY: cursorY,
            orbitAngle: 0,
            spinAngle: 0,
            hasThrown: false,
            appearTimer: null,
            animFrame: null
        };
        this.specialSession = session;

        // Delay spinning orbit animation by 0.3s (300ms) so quick taps don't flash the orbit
        session.appearTimer = setTimeout(() => {
            if (session.active && container.parentElement) {
                container.style.opacity = '1';
            }
        }, 300);

        // Perfectly concentric orbit around the finger center with relaxed, smooth speeds
        const animateOrbit = () => {
            if (!session.active || !container.parentElement) return;
            session.orbitAngle += 0.022; // Slower, smooth orbit speed
            session.spinAngle += 7;      // Slower, smooth star spin
            const radius = (cfg.orbitRadius || 75) * bScale;

            session.orbitItems.forEach((img, idx) => {
                const a = session.orbitAngle + (idx * (2 * Math.PI / session.orbitItems.length));
                const ox = Math.cos(a) * radius;
                const oy = Math.sin(a) * radius;
                // Center-aligned: translate(calc(-50% + ox), calc(-50% + oy))
                img.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${session.spinAngle}deg) scale(${scale})`;
            });

            session.animFrame = requestAnimationFrame(animateOrbit);
        };
        animateOrbit();
    }

    updateShurikenSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.weaponId !== 'shuriken') return;

        // Container continues following finger while held
        session.cursorX = cursorX;
        session.cursorY = cursorY;
        session.container.style.left = `${cursorX}px`;
        session.container.style.top = `${cursorY}px`;

        if (session.hasThrown) return; // Only throw once per swipe

        const dx = cursorX - session.startX;
        const dy = cursorY - session.startY;
        const swipeDist = Math.hypot(dx, dy);

        // Throw 1 shuriken when a clear swipe is detected, but KEEP spinning orbit visible around finger
        if (swipeDist > 14) {
            session.hasThrown = true;
            this.throwShurikenProjectile(session.startX, session.startY, dx, dy, session.cfg);
        }
    }

    throwShurikenProjectile(fromX, fromY, dirX, dirY, cfg) {
        let len = Math.hypot(dirX, dirY);
        let ndx = 0;
        let ndy = 0;

        if (len > 3) {
            ndx = dirX / len;
            ndy = dirY / len;
        } else {
            // Aim directly towards Mama Vana
            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;
            const toBossX = bossX - fromX;
            const toBossY = (bossY - 20) - fromY;
            len = Math.hypot(toBossX, toBossY) || 1;
            ndx = toBossX / len;
            ndy = toBossY / len;
        }

        const soundFile = cfg.sound || 'attaker/special/shuriken/shuriken.mp3';
        if (window.soundEngine) {
            window.soundEngine.playAudioFile(soundFile, 1.0, false);
        }

        const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;
        const scale = (cfg.scale || 1.0) * bScale;
        const speed = (cfg.flySpeed || 3200);

        const proj = document.createElement('img');
        proj.src = 'attaker/special/shuriken/frame1.png';
        proj.className = 'game-shuriken-projectile';
        proj.style.left = `${fromX}px`;
        proj.style.top = `${fromY}px`;
        proj.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.stageEl.appendChild(proj);

        let curX = fromX;
        let curY = fromY;
        let rot = 0;
        let lastTime = performance.now();
        const stageW = this.stageEl.clientWidth || 800;
        const stageH = this.stageEl.clientHeight || 600;

        const fly = (now) => {
            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            curX += ndx * speed * dt;
            curY += ndy * speed * dt;
            rot += 36;

            proj.style.left = `${curX}px`;
            proj.style.top = `${curY}px`;
            proj.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;

            // Check collision with Mama Vana's true anatomical silhouette (head, torso, legs)
            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;
            const charBScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;

            const relX = (curX - bossX) / charBScale;
            const relY = (curY - bossY) / charBScale;

            // Accurate anatomical silhouette:
            // 1. Head & Hat: relY [-210, -45], half-width 60
            // 2. Torso, Chest & Arms: relY [-45, +75], half-width 110
            // 3. Waist, Legs & Shoes: relY [+75, +185], half-width 80
            let isInside = false;
            let maxHW = 0;
            if (relY >= -210 && relY < -45) {
                maxHW = 60;
                isInside = (Math.abs(relX) <= maxHW);
            } else if (relY >= -45 && relY < 75) {
                maxHW = 110;
                isInside = (Math.abs(relX) <= maxHW);
            } else if (relY >= 75 && relY <= 185) {
                maxHW = 80;
                isInside = (Math.abs(relX) <= maxHW);
            }

            if (isInside) {
                if (proj.parentElement) proj.remove();

                // Random penetration depth so shurikens scatter naturally across the body and never form a rigid line on the border
                const penetration = (20 + Math.random() * 45) * charBScale;
                let hitWorldX = curX + ndx * penetration;
                let hitWorldY = curY + ndy * penetration;

                // Clamp to stay strictly inside the character silhouette
                hitWorldX = Math.max(bossX - maxHW * charBScale * 0.9, Math.min(bossX + maxHW * charBScale * 0.9, hitWorldX));
                hitWorldY = Math.max(bossY - 200 * charBScale, Math.min(bossY + 175 * charBScale, hitWorldY));

                this.onShurikenHitBoss(hitWorldX, hitWorldY, rot, scale, cfg);
                return;
            }

            // Disappear outside screen boundaries cleanly
            if (curX < -80 || curX > stageW + 80 || curY < -80 || curY > stageH + 80) {
                if (proj.parentElement) proj.remove();
                return;
            }

            requestAnimationFrame(fly);
        };
        requestAnimationFrame(fly);
    }

    onShurikenHitBoss(worldX, worldY, rot, scale, cfg) {
        const bossContainer = document.getElementById('game-boss-container');
        if (!bossContainer) return;

        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;

        const localX = Math.max(35, Math.min(285, 160 + (worldX - bossX) / bScale));
        const localY = Math.max(40, Math.min(365, 200 + (worldY - bossY) / bScale));

        const damage = cfg.damage || 30;
        this.spawnHitSparks(worldX, worldY);
        this.spawnDamagePopup(worldX, worldY - 40, damage);
        window.physicsEngine.applyDirectionalHit(worldX, 32, worldY);
        this.takeDamage(damage, null, cfg);

        // Immediate, prominent blood burst right where shuriken strikes
        const bloodCfg = { bloodScale: 0.90, bloodDuration: 2800 };
        this.spawnBloodSplatAt(localX, localY, bloodCfg);

        // Dynamic droplets around impact point
        const dropX = localX + (Math.random() - 0.5) * 32;
        const dropY = localY + (Math.random() - 0.5) * 32;
        this.spawnBloodSplatAt(dropX, dropY, { bloodScale: 0.55, bloodDuration: 2200 });

        // Stuck on body - perfectly centered
        const stuck = document.createElement('img');
        stuck.src = 'attaker/special/shuriken/frame1.png';
        stuck.className = 'game-shuriken-stuck';
        stuck.style.left = `${localX}px`;
        stuck.style.top = `${localY}px`;
        stuck.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale * 0.95})`;
        bossContainer.appendChild(stuck);

        const dur = cfg.stickDuration || 4500;
        setTimeout(() => {
            if (stuck.parentElement) {
                stuck.style.opacity = '0';
                setTimeout(() => { if (stuck.parentElement) stuck.remove(); }, 600);
            }
        }, dur);
    }

    endShurikenSession() {
        const session = this.specialSession;
        if (!session) return;
        session.active = false;
        if (session.appearTimer) clearTimeout(session.appearTimer);
        if (session.animFrame) cancelAnimationFrame(session.animFrame);

        // If user tapped without swiping at all, throw exactly one shuriken
        if (!session.hasThrown) {
            session.hasThrown = true;
            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;
            this.throwShurikenProjectile(session.cursorX, session.cursorY, bossX - session.cursorX, (bossY - 20) - session.cursorY, session.cfg);
        }

        // Orbit stops and removes only on finger release
        if (session.container && session.container.parentElement) {
            session.container.style.opacity = '0';
            setTimeout(() => {
                if (session.container && session.container.parentElement) session.container.remove();
            }, 180);
        }
        this.specialSession = null;
    }

    // -------------------------------------------------------------------------
    // Scorpion Implementation
    // -------------------------------------------------------------------------

    startScorpionSession(cursorX, cursorY) {
        const cfg = (window.coordinatesDB && window.coordinatesDB.getSpecialConfig('scorpion')) || {
            damage: 65,
            handScale: 0.32,
            headScale: 0.18,
            chainHeight: 18,
            throwSpeed: 1400,
            pullDelayMs: 700,
            pullDurationMs: 450,
            bloodScale: 0.50
        };

        const bScale = (window.innerWidth <= 600) ? 0.85 : 1.0;
        const handScale = (cfg.handScale || 0.32) * bScale;
        const headScale = (cfg.headScale || 0.18) * bScale;

        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        // Target chest level: bodys is placed at y: +85, chest is at bossY + (50 * baseScale)
        const chestOffsetY = 50 * (window.physicsEngine.baseScale || 1.0);
        const targetX = bossX;
        const targetY = bossY + chestOffsetY;

        const dx = targetX - cursorX;
        const dy = targetY - cursorY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);
        const flipY = (dx < 0) ? -1 : 1;

        // Hand Element - mirrored cleanly on right side so it never appears upside down
        const handEl = document.createElement('div');
        handEl.className = 'game-scorpion-hand';
        handEl.style.left = `${cursorX}px`;
        handEl.style.top = `${cursorY}px`;
        handEl.style.transform = `translate(-15%, -50%) rotate(${angleDeg}deg) scale(${handScale}, ${flipY * handScale})`;
        handEl.innerHTML = `<img src="attaker/special/scorpion/hand.png" alt="hand" draggable="false" style="display: block;">`;
        this.stageEl.appendChild(handEl);

        // Chain Element
        const chainEl = document.createElement('div');
        chainEl.className = 'game-scorpion-chain';
        chainEl.style.left = `${cursorX}px`;
        chainEl.style.top = `${cursorY}px`;
        chainEl.style.backgroundImage = 'url("attaker/special/scorpion/chain.png")';
        chainEl.style.display = 'none';
        this.stageEl.appendChild(chainEl);

        // Head/Spear Element
        const headEl = document.createElement('div');
        headEl.className = 'game-scorpion-head';
        headEl.style.left = `${cursorX}px`;
        headEl.style.top = `${cursorY}px`;
        headEl.style.transform = `translate(-80%, -50%) rotate(${angleDeg}deg) scale(${headScale}, ${flipY * handScale})`;
        headEl.innerHTML = `<img src="attaker/special/scorpion/head.png" alt="head" draggable="false" style="display: block;">`;
        this.stageEl.appendChild(headEl);

        const session = {
            active: true,
            weaponId: 'scorpion',
            cfg,
            handEl,
            chainEl,
            headEl,
            cursorX,
            cursorY,
            targetX,
            targetY,
            chestOffsetY,
            angleRad,
            angleDeg,
            state: 'throwing'
        };
        this.specialSession = session;

        // Play chain sound
        if (window.soundEngine) {
            window.soundEngine.playAudioFile('attaker/special/scorpion/chain.mp3', 1.0, false);
        }

        // Animate Spear Head Launch
        chainEl.style.display = 'block';
        const startX = cursorX;
        const startY = cursorY;
        const totalDist = Math.hypot(targetX - startX, targetY - startY);
        const flightDur = Math.max(120, Math.min(300, (totalDist / (cfg.throwSpeed || 1400)) * 1000));
        const startTime = performance.now();

        const animateThrow = (now) => {
            if (!session.active || session.state !== 'throwing') return;
            const progress = Math.min(1.0, (now - startTime) / flightDur);

            const curHeadX = startX + (targetX - startX) * progress;
            const curHeadY = startY + (targetY - startY) * progress;

            headEl.style.left = `${curHeadX}px`;
            headEl.style.top = `${curHeadY}px`;

            const chainLen = Math.hypot(curHeadX - startX, curHeadY - startY);
            chainEl.style.width = `${chainLen}px`;
            chainEl.style.transform = `translate(0, -50%) rotate(${angleDeg}deg)`;

            if (progress < 1.0) {
                requestAnimationFrame(animateThrow);
            } else {
                session.state = 'latched';
                this.onScorpionLatch(session, curHeadX, curHeadY, targetX, targetY);
            }
        };
        requestAnimationFrame(animateThrow);
    }

    onScorpionLatch(session, headX, headY, targetX, targetY) {
        if (!session.active) return;
        this.scorpionHitCount += 1;
        if (this.scorpionHitCount >= 10) this.finishPromptReady = true;
        const cfg = session.cfg;

        const damage = cfg.damage || 65;
        this.spawnHitSparks(targetX, targetY);
        this.spawnDamagePopup(targetX, targetY - 40, damage);
        this.takeDamage(damage, null, cfg);

        // Spear head penetrates inside body -> hide head element so only chain is visible
        if (session.headEl) {
            session.headEl.style.display = 'none';
        }

        // Blood splat directly on chest matching spear hit point!
        const localX = 160 + (Math.random() - 0.5) * 16;
        const localY = 250 + (Math.random() - 0.5) * 16;
        this.spawnBloodSplatAt(localX, localY, { bloodScale: cfg.bloodScale || 0.50, bloodDuration: 2500 });

        // Delay before pull is half a second (500ms)
        session.latchTimer = setTimeout(() => {
            if (!session.active) return;
            session.latchTimer = null;
            session.state = 'pulling';

            // Play "get over her.mp3"
            if (window.soundEngine) {
                window.soundEngine.playAudioFile('attaker/special/scorpion/get over her.mp3', 1.0, false);
            }

            const handX = session.cursorX;
            const handY = session.cursorY;
            const startBossX = window.physicsEngine.x;
            const startBossY = window.physicsEngine.y;
            const pullDur = cfg.pullDurationMs || 420;
            const pullStart = performance.now();
            const chestOffsetY = session.chestOffsetY || 50;

            const animatePull = (now) => {
                if (!session.active) return;
                const p = Math.min(1.0, (now - pullStart) / pullDur);
                const easeP = 1 - Math.pow(1 - p, 3);

                const pullTargetX = handX + Math.cos(session.angleRad) * 90;
                const pullTargetY = handY + Math.sin(session.angleRad) * 90;

                const curBossX = startBossX + (pullTargetX - startBossX) * easeP;
                const curBossY = startBossY + (pullTargetY - startBossY) * easeP;

                window.physicsEngine.x = curBossX;
                window.physicsEngine.y = curBossY;
                window.physicsEngine.vx = (pullTargetX - startBossX) * 0.04;
                window.physicsEngine.vy = (pullTargetY - startBossY) * 0.04;

                const curChainLen = Math.hypot(curBossX - handX, (curBossY + chestOffsetY) - handY);
                session.chainEl.style.width = `${curChainLen}px`;

                if (p < 1.0) {
                    requestAnimationFrame(animatePull);
                } else {
                    session.state = 'done';
                    setTimeout(() => {
                        this.endScorpionSession(session);
                    }, 250);
                }
            };
            requestAnimationFrame(animatePull);
        }, 500);
    }

    updateScorpionSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.active || session.weaponId !== 'scorpion') return;
        if (session.state === 'throwing' && session.handEl) {
            session.cursorX = cursorX;
            session.cursorY = cursorY;
            session.handEl.style.left = `${cursorX}px`;
            session.handEl.style.top = `${cursorY}px`;
        }
    }

    endScorpionSession(session = this.specialSession) {
        if (!session) return;
        if (session.state !== 'done') {
            session.releaseRequested = true;
            return;
        }
        this.cancelScorpionSession(session);
        if (this.finishPromptReady && !this.fatalityActive) {
            this.finishPromptReady = false;
            this.showScorpionFinishPrompt();
        }
    }

    cancelScorpionSession(session) {
        if (!session) return;
        session.active = false;
        if (session.latchTimer) clearTimeout(session.latchTimer);
        [session.handEl, session.chainEl, session.headEl].forEach(element => {
            if (element && element.parentElement) element.remove();
        });
        if (this.specialSession === session) this.specialSession = null;
    }

    showScorpionFinishPrompt() {
        if (!this.stageEl || this.scorpionFinishPrompt || this.fatalityActive || this.finishPromptActive) return;
        this.finishPromptActive = true;
        const overlay = document.createElement('div');
        overlay.className = 'scorpion-fatality-overlay';
        overlay.innerHTML = `
            <div class="scorpion-fatality-content">
                <img class="scorpion-finish-image" src="attaker/special/scorpion/finish him.png" alt="Finish him" draggable="false">
                <div class="scorpion-finish-actions">
                    <button class="scorpion-finish-button" type="button">سەری ببڕە</button>
                    <button class="scorpion-burn-button" type="button">سوتاندن</button>
                    <button class="scorpion-forgive-button" type="button">بەخشین</button>
                </div>
            </div>`;
        this.stageEl.appendChild(overlay);
        this.scorpionFinishPrompt = overlay;
        requestAnimationFrame(() => {
            overlay.classList.add('is-visible');
            overlay.querySelector('.scorpion-finish-image').classList.add('is-visible');
        });
        if (window.soundEngine) {
            window.soundEngine.playAudioFile('attaker/special/scorpion/finish-him.mp3', 1.0, false);
        }
        overlay.querySelector('.scorpion-finish-button').addEventListener('click', () => {
            if (this.fatalityActive) return;
            overlay.querySelectorAll('button').forEach(button => { button.disabled = true; });
            this.scorpionFinishPrompt = null;
            this.runScorpionFatality(overlay);
        }, { once: true });
        overlay.querySelector('.scorpion-burn-button').addEventListener('click', () => {
            if (this.fatalityActive) return;
            overlay.querySelectorAll('button').forEach(button => { button.disabled = true; });
            this.scorpionFinishPrompt = null;
            this.runScorpionFatality(overlay, 'burn');
        }, { once: true });
        overlay.querySelector('.scorpion-forgive-button').addEventListener('click', () => {
            overlay.querySelectorAll('button').forEach(button => { button.disabled = true; });
            overlay.classList.remove('is-visible');
            this.finishPromptFadeTimer = setTimeout(() => {
                if (overlay.parentElement) overlay.remove();
                this.scorpionFinishPrompt = null;
                this.finishPromptActive = false;
                this.scorpionHitCount = 0;
                this.finishPromptReady = false;
                this.finishPromptFadeTimer = null;
            }, 900);
        }, { once: true });
    }

    async runScorpionFatality(overlay, fatalityType = 'decapitation') {
        const physics = window.physicsEngine;
        if (!physics || !this.bossEl) return;
        this.fatalityActive = true;
        this.fatalityOverlay = overlay;
        this.fatalitySnapshot = {
            x: physics.x, y: physics.y, vx: physics.vx, vy: physics.vy,
            angle: physics.angle, angularVelocity: physics.angularVelocity,
            headAngle: physics.headAngle, headAngularVelocity: physics.headAngularVelocity,
            headX: physics.headX, headVx: physics.headVx, headY: physics.headY, headVy: physics.headVy,
            walkActive: physics.walkActive
        };
        physics.stopWalking();
        physics.vx = 0;
        physics.vy = 0;
        physics.angularVelocity = 0;
        physics.headAngularVelocity = 0;
        physics.headVx = 0;
        physics.headVy = 0;

        const backdrop = document.createElement('div');
        backdrop.className = 'scorpion-fatality-dark';
        overlay.replaceChildren(backdrop);
        overlay.classList.add('is-visible', 'is-executing');
        await this.waitForFatality(450);
        if (!this.fatalityActive) return;

        const stageWidth = this.stageEl.clientWidth;
        const targetX = Math.max(physics.x, Math.min(physics.rightWall - 35, stageWidth - 115));
        const moveStartX = physics.x;
        const moveStart = performance.now();
        await new Promise(resolve => {
            const moveBoss = (now) => {
                if (!this.fatalityActive) return resolve();
                const progress = Math.min(1, (now - moveStart) / 850);
                const eased = progress * progress * (3 - 2 * progress);
                physics.x = moveStartX + (targetX - moveStartX) * eased;
                physics.vx = 0;
                physics.applyTransform();
                if (progress < 1) requestAnimationFrame(moveBoss);
                else resolve();
            };
            requestAnimationFrame(moveBoss);
        });
        if (!this.fatalityActive) return;

        const baseScale = physics.baseScale || 1;
        const stageRect = this.stageEl.getBoundingClientRect();
        const bossRect = this.bossEl.getBoundingClientRect();
        const liveHead = this.bossEl.querySelector('.mv-group-head');
        const detachedHead = liveHead ? liveHead.cloneNode(true) : null;
        const headX = bossRect.left - stageRect.left;
        const headY = bossRect.top - stageRect.top;

        const scorpion = document.createElement('img');
        scorpion.className = 'scorpion-fatality-actor';
        scorpion.src = fatalityType === 'burn'
            ? 'attaker/special/scorpion/finish him 2/mk1-scorpion-burn-hd.gif'
            : 'attaker/special/scorpion/finish him 1/mk1-scorpion-spear-hd.gif';
        scorpion.alt = 'Scorpion';
        overlay.appendChild(scorpion);

        const chain = document.createElement('div');
        chain.className = 'scorpion-fatality-chain';
        chain.style.backgroundImage = 'url("attaker/special/scorpion/chain.png")';
        overlay.appendChild(chain);

        const bloodUnder = document.createElement('img');
        bloodUnder.className = 'scorpion-fatality-blood scorpion-fatality-blood-under';
        bloodUnder.src = 'attaker/special/scorpion/finish him 1/blood under the head.png';
        bloodUnder.alt = '';
        bloodUnder.style.width = '110px';
        overlay.appendChild(bloodUnder);

        const bloodBody = document.createElement('img');
        bloodBody.className = 'scorpion-fatality-blood scorpion-fatality-blood-body';
        bloodBody.src = 'attaker/special/scorpion/finish him 1/blood on body.png';
        bloodBody.alt = '';
        bloodBody.style.left = `${bossRect.left - stageRect.left + bossRect.width / 2}px`;
        bloodBody.style.top = `${bossRect.top - stageRect.top + bossRect.height * 0.46}px`;
        bloodBody.style.width = `${bossRect.width * 0.25}px`;
        overlay.appendChild(bloodBody);

        if (detachedHead) {
            detachedHead.classList.add('scorpion-fatality-detached-head');
            detachedHead.style.left = `${headX}px`;
            detachedHead.style.top = `${headY}px`;
            detachedHead.style.transform = `scale(${baseScale})`;
            bloodUnder.style.left = '160px';
            bloodUnder.style.top = '238px';
            detachedHead.insertBefore(bloodUnder, detachedHead.firstChild);
            overlay.appendChild(detachedHead);
        }

        const actorHeight = bossRect.height * (fatalityType === 'burn' ? 1.8 : 1.45);
        const actorWidth = actorHeight * (410 / 428);
        const actorX = 0;
        const actorY = stageRect.height - actorHeight * (404 / 428);
        scorpion.style.left = `${actorX}px`;
        scorpion.style.top = `${actorY}px`;
        scorpion.style.width = `${actorWidth}px`;
        scorpion.style.height = `${actorHeight}px`;
        requestAnimationFrame(() => scorpion.classList.add('is-visible'));
        const freezeScorpionGif = () => {
            this.fatalityGifTimer = setTimeout(() => {
                if (scorpion.isConnected) {
                    const finalFrame = fatalityType === 'burn'
                        ? 'attaker/special/scorpion/finish him 2/mk1-scorpion-burn-hd-last-frame.png'
                        : 'attaker/special/scorpion/finish him 1/mk1-scorpion-spear-hd-last-frame.png';
                    scorpion.src = finalFrame;
                }
                this.fatalityGifTimer = null;
            }, fatalityType === 'burn' ? 2970 : 1650);
        };
        if (scorpion.complete) freezeScorpionGif();
        else scorpion.addEventListener('load', freezeScorpionGif, { once: true });
        if (fatalityType === 'burn') {
            [chain, bloodUnder, bloodBody, detachedHead].forEach(element => element && element.remove());
            await this.runScorpionBurnSequence({ overlay, scorpion, actorX, actorY, actorWidth, actorHeight, stageRect, bossRect });
            return;
        }
        if (liveHead) liveHead.style.visibility = 'hidden';
        await this.waitForFatality(250);
        if (!this.fatalityActive) return;

        const fromX = actorX + actorWidth * 0.58;
        const fromY = actorY + actorHeight * 0.36;
        const neckX = bossRect.left - stageRect.left + bossRect.width / 2;
        const neckY = bossRect.top - stageRect.top + bossRect.height * 0.38;
        chain.style.left = `${fromX}px`;
        chain.style.top = `${fromY}px`;
        chain.style.width = `${Math.hypot(neckX - fromX, neckY - fromY)}px`;
        chain.style.transform = `rotate(${Math.atan2(neckY - fromY, neckX - fromX)}rad)`;
        await this.waitForFatality(380);
        if (!this.fatalityActive) return;

        if (window.soundEngine) {
            window.soundEngine.playAudioFile('attaker/special/scorpion/get over her.mp3', 1.0, false);
        }
        if (detachedHead) {
            detachedHead.style.transition = 'left 850ms cubic-bezier(0.2, 0.75, 0.3, 1), top 850ms cubic-bezier(0.2, 0.75, 0.3, 1)';
            detachedHead.style.left = `${fromX - 160 * baseScale}px`;
            detachedHead.style.top = `${fromY - 150 * baseScale}px`;
        }
        chain.style.transition = 'width 850ms cubic-bezier(0.2, 0.75, 0.3, 1)';
        chain.style.width = '0px';
        await this.waitForFatality(850);
        if (!this.fatalityActive) return;

        chain.classList.add('is-fading');
        await this.waitForFatality(250);
        chain.remove();

        backdrop.classList.add('is-total-dark');
        await this.waitForFatality(450);
        if (!this.fatalityActive) return;
        const fatality = document.createElement('img');
        fatality.className = 'scorpion-fatality-result';
        fatality.src = 'attaker/special/scorpion/fatality.png';
        fatality.alt = 'Fatality';
        overlay.appendChild(fatality);
        requestAnimationFrame(() => fatality.classList.add('is-visible'));
        if (window.soundEngine) window.soundEngine.playAudioFile('attaker/special/scorpion/fatality.mp3', 1.0, false);
        await this.waitForFatality(5000);
        if (!this.fatalityActive) return;

        this.restoreScorpionFatality();
        overlay.classList.remove('is-executing', 'is-visible');
        await this.waitForFatality(650);
        if (overlay.parentElement) overlay.remove();
        this.fatalityOverlay = null;
        this.scorpionHitCount = 0;
        this.finishPromptActive = false;
        this.fatalityActive = false;
    }

    async runScorpionBurnSequence({ overlay, scorpion, actorX, actorY, actorWidth, actorHeight }) {
        const config = (window.coordinatesDB && window.coordinatesDB.getShootingConfig('flamethrower')) || {
            folder: 'attaker/shooting/flamethrower',
            flameFrames: ['flame1.png', 'flame2.png', 'flame3.png'],
            projectileFrames: ['fireball1.png', 'fireball2.png'],
            flameSound: 'attaker/shooting/flamethrower/flame.mp3',
            burningSound: 'attaker/shooting/flamethrower/burning.mp3',
            screamSound: 'attaker/shooting/flamethrower/screem.mp3'
        };
        const folder = config.folder;
        await new Promise(resolve => {
            if (scorpion.complete && scorpion.naturalWidth) resolve();
            else scorpion.addEventListener('load', resolve, { once: true });
        });
        await this.waitForFatality(1000);
        if (!this.fatalityActive) return;
        const sourceX = actorX + actorWidth * 0.79;
        const sourceY = actorY + actorHeight * 0.45;
        const bossRect = this.bossEl.getBoundingClientRect();
        const stageRect = this.stageEl.getBoundingClientRect();
        const targetX = bossRect.left - stageRect.left + bossRect.width * 0.5;
        const targetY = bossRect.top - stageRect.top + bossRect.height * 0.90;
        const flameFrames = config.flameFrames || ['flame1.png', 'flame2.png', 'flame3.png'];

        const flame = document.createElement('div');
        flame.className = 'game-flame-projectile scorpion-fatality-flame';
        flame.style.left = `${sourceX}px`;
        flame.style.top = `${sourceY}px`;
        flame.style.transformOrigin = '0 50%';
        const flameImage = document.createElement('img');
        flameImage.src = encodeURI(`${folder}/${flameFrames[0]}`);
        flameImage.alt = '';
        flame.appendChild(flameImage);
        overlay.appendChild(flame);

        let frameIndex = 0;
        const frameTimer = setInterval(() => {
            if (!flame.isConnected) {
                clearInterval(frameTimer);
                return;
            }
            frameIndex = (frameIndex + 1) % flameFrames.length;
            flameImage.src = encodeURI(`${folder}/${flameFrames[frameIndex]}`);
        }, 75);

        if (window.soundEngine && config.flameSound) {
            window.soundEngine.playAudioFile(config.flameSound, 1.0, false);
        }

        await new Promise(resolve => {
            const start = performance.now();
            const duration = 650;
            const animate = (now) => {
                if (!this.fatalityActive) {
                    clearInterval(frameTimer);
                    flame.remove();
                    return resolve();
                }
                const progress = Math.min(1, (now - start) / duration);
                const currentX = sourceX + (targetX - sourceX) * progress;
                const currentY = sourceY + (targetY - sourceY) * progress;
                const dx = currentX - sourceX;
                const dy = currentY - sourceY;
                flame.style.left = `${sourceX}px`;
                flame.style.top = `${sourceY}px`;
                flame.style.width = `${Math.max(55, Math.hypot(dx, dy))}px`;
                flame.style.transform = `translate(0, -50%) rotate(${Math.atan2(dy, dx)}rad)`;
                if (progress < 1) requestAnimationFrame(animate);
                else resolve();
            };
            requestAnimationFrame(animate);
        });
        clearInterval(frameTimer);
        flame.remove();
        if (!this.fatalityActive) return;

        this.spawnBurningEffect(targetX, targetY, {
            ...config,
            stationaryBurn: true
        }, { stationary: true });
        await this.waitForFatality(5000);
        if (!this.fatalityActive) return;

        const backdrop = overlay.querySelector('.scorpion-fatality-dark');
        if (backdrop) backdrop.classList.add('is-total-dark');
        await this.waitForFatality(450);
        if (!this.fatalityActive) return;

        const fatality = document.createElement('img');
        fatality.className = 'scorpion-fatality-result';
        fatality.src = 'attaker/special/scorpion/fatality.png';
        fatality.alt = 'Fatality';
        overlay.appendChild(fatality);
        requestAnimationFrame(() => fatality.classList.add('is-visible'));
        if (window.soundEngine) {
            window.soundEngine.playAudioFile('attaker/special/scorpion/fatality.mp3', 1.0, false);
        }
        await this.waitForFatality(5000);
        if (!this.fatalityActive) return;

        this.restoreScorpionFatality();
        overlay.classList.remove('is-executing', 'is-visible');
        await this.waitForFatality(650);
        if (overlay.parentElement) overlay.remove();
        this.fatalityOverlay = null;
        this.scorpionHitCount = 0;
        this.finishPromptActive = false;
        this.fatalityActive = false;
    }

    waitForFatality(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    restoreScorpionFatality() {
        if (this.fatalitySnapshot && window.physicsEngine) {
            const physics = window.physicsEngine;
            Object.assign(physics, this.fatalitySnapshot);
            physics.applyTransform();
            if (this.fatalitySnapshot.walkActive) physics.scheduleWalk();
        }
        const liveHead = this.bossEl && this.bossEl.querySelector('.mv-group-head');
        if (liveHead) liveHead.style.visibility = '';
        if (this.stageEl) {
            this.stageEl.querySelectorAll('.scorpion-fatality-actor, .scorpion-fatality-chain, .scorpion-fatality-blood, .scorpion-fatality-detached-head').forEach(el => el.remove());
        }
        this.fatalitySnapshot = null;
    }

    cancelScorpionFatality() {
        if (this.finishPromptFadeTimer) clearTimeout(this.finishPromptFadeTimer);
        if (this.fatalityGifTimer) clearTimeout(this.fatalityGifTimer);
        if (!this.fatalityActive && !this.scorpionFinishPrompt && !this.finishPromptActive) return;
        this.fatalityActive = false;
        this.restoreScorpionFatality();
        if (this.scorpionFinishPrompt && this.scorpionFinishPrompt.parentElement) this.scorpionFinishPrompt.remove();
        this.scorpionFinishPrompt = null;
        if (this.fatalityOverlay && this.fatalityOverlay.parentElement) this.fatalityOverlay.remove();
        this.fatalityOverlay = null;
        this.scorpionHitCount = 0;
        this.finishPromptReady = false;
        this.finishPromptActive = false;
    }

    // -------------------------------------------------------------------------
    // SPIDERS SPECIAL WEAPON IMPLEMENTATION
    // -------------------------------------------------------------------------

    dropSpider(startX, startY) {
        if (!this.running) return;
        if (!this.activeSpiders) this.activeSpiders = [];

        // Turn character eye to 2.png until all spiders disappear on screen
        if (window.characterModel && typeof window.characterModel.setEyeOverride === 'function') {
            window.characterModel.setEyeOverride('2.png');
        }

        const spiderId = 'spider_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const spiderEl = document.createElement('div');
        spiderEl.className = 'game-spider-actor';
        spiderEl.dataset.spiderId = spiderId;
        spiderEl.style.left = `${startX}px`;
        spiderEl.style.top = `${startY}px`;
        spiderEl.innerHTML = `<img src="attaker/special/spiders/frame1.gif" alt="spider" draggable="false">`;
        this.stageEl.appendChild(spiderEl);

        // Pick a random location across the complete anatomical silhouette.
        const spiderTarget = this.getRandomSpiderTarget();

        const spiderData = {
            id: spiderId,
            el: spiderEl,
            x: startX,
            y: startY,
            targetRelX: spiderTarget.x,
            targetRelY: spiderTarget.y,
            state: 'walking', // 'walking' | 'biting' | 'dragged' | 'dying'
            bitesLeft: 10,
            biteInterval: null,
            walkAudio: null,
            biteAudio: null,
            isDragged: false
        };

        this.activeSpiders.push(spiderData);
        this.startSpiderSound(spiderData, 'walk');
    }

    getRandomSpiderTarget() {
        const regions = [
            { minY: -205, maxY: -48, halfWidth: 58, weight: 0.22 },
            { minY: -45, maxY: 72, halfWidth: 105, weight: 0.42 },
            { minY: 72, maxY: 118, halfWidth: 88, weight: 0.16 },
            { minY: 118, maxY: 185, halfWidth: 72, weight: 0.20 }
        ];
        const roll = Math.random();
        let accumulated = 0;
        let region = regions[regions.length - 1];
        for (const candidate of regions) {
            accumulated += candidate.weight;
            if (roll <= accumulated) {
                region = candidate;
                break;
            }
        }

        return {
            x: (Math.random() * 2 - 1) * region.halfWidth,
            y: region.minY + Math.random() * (region.maxY - region.minY)
        };
    }

    startSpiderDrag(spiderEl, clientX, clientY, localX, localY) {
        if (!this.activeSpiders) return false;
        const spiderId = spiderEl.dataset.spiderId;
        const spider = this.activeSpiders.find(s => s.id === spiderId);
        if (!spider) return false;

        spider.isDragged = true;
        spider.state = 'dragged';
        this.stopSpiderSound(spider, 'walk');
        this.stopSpiderSound(spider, 'bite');
        if (spider.biteInterval) {
            clearInterval(spider.biteInterval);
            spider.biteInterval = null;
        }
        spider.dragOffsetX = spider.x - localX;
        spider.dragOffsetY = spider.y - localY;
        this.draggedSpider = spider;
        return true;
    }

    updateSpiderDrag(localX, localY) {
        if (!this.draggedSpider) return;
        const spider = this.draggedSpider;
        spider.x = localX + (spider.dragOffsetX || 0);
        spider.y = localY + (spider.dragOffsetY || 0);

        const bossX = (window.physicsEngine && window.physicsEngine.x) || 400;
        // The raw GIF head is on the left.
        // If spider is to the right of Mama Vana (spider.x >= bossX), head faces left towards boss -> scaleX = 1.0.
        // If spider is to the left of Mama Vana (spider.x < bossX), head faces right towards boss -> scaleX = -1.0.
        const scaleX = (spider.x >= bossX) ? 1.0 : -1.0;

        spider.el.style.left = `${spider.x}px`;
        spider.el.style.top = `${spider.y}px`;
        spider.el.style.transform = `translate(-50%, -50%) scaleX(${scaleX})`;
    }

    endSpiderDrag() {
        if (!this.draggedSpider) return;
        const spider = this.draggedSpider;
        spider.isDragged = false;
        this.draggedSpider = null;

        // When dropped anywhere, spider returns to character and continues biting
        const bossX = (window.physicsEngine && window.physicsEngine.x) || 400;
        const bossY = (window.physicsEngine && window.physicsEngine.y) || 300;
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        const targetX = bossX + (spider.targetRelX * bScale);
        const targetY = bossY + (spider.targetRelY * bScale);

        const dist = Math.hypot(targetX - spider.x, targetY - spider.y);
        if (dist <= 25) {
            spider.state = 'biting';
            this.startSpiderBiting(spider);
        } else {
            spider.state = 'walking';
            this.startSpiderSound(spider, 'walk');
        }
    }

    startSpiderSound(spider, soundType) {
        if (!spider || !window.Audio) return;
        const property = soundType === 'bite' ? 'biteAudio' : 'walkAudio';
        if (spider[property]) return;

        const src = soundType === 'bite'
            ? 'attaker/special/spiders/spider bite.mp3'
            : 'attaker/special/spiders/spider walk.mp3';
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = soundType === 'bite' ? 1.0 : 0.8;
        spider[property] = audio;
        const playPromise = audio.play();
        if (playPromise) playPromise.catch(() => {});
    }

    stopSpiderSound(spider, soundType) {
        if (!spider) return;
        const property = soundType === 'bite' ? 'biteAudio' : 'walkAudio';
        const audio = spider[property];
        if (!audio) return;
        try {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        } catch (e) {}
        spider[property] = null;
    }

    startSpiderBiting(spider) {
        if (spider.biteInterval) return;
        this.stopSpiderSound(spider, 'walk');
        this.startSpiderSound(spider, 'bite');
        spider.biteInterval = setInterval(() => {
            if (!this.running || spider.state !== 'biting' || spider.isDragged) {
                this.stopSpiderSound(spider, 'bite');
                return;
            }

            spider.bitesLeft--;

            const damage = 8;
            this.takeDamage(damage, null, { blood: 'attaker/special/spiders/blood.png', bloodScale: 0.35 });

            if (spider.el) {
                spider.el.classList.add('biting');
                setTimeout(() => { if (spider.el) spider.el.classList.remove('biting'); }, 220);
            }

            const localHitX = Math.max(35, Math.min(285, 160 + spider.targetRelX));
            const localHitY = Math.max(40, Math.min(365, 200 + spider.targetRelY));
            this.spawnBloodSplatAt(localHitX, localHitY, { blood: 'attaker/special/spiders/blood.png', bloodScale: 0.35 });

            if (spider.bitesLeft <= 0) {
                clearInterval(spider.biteInterval);
                spider.biteInterval = null;
                this.stopSpiderSound(spider, 'bite');
                spider.state = 'dying';
                if (spider.el) spider.el.style.opacity = '0';
                setTimeout(() => {
                    this.removeSpider(spider);
                }, 350);
            }
        }, 500);
    }

    removeSpider(spider) {
        if (spider.biteInterval) {
            clearInterval(spider.biteInterval);
            spider.biteInterval = null;
        }
        this.stopSpiderSound(spider, 'walk');
        this.stopSpiderSound(spider, 'bite');
        if (spider.el && spider.el.parentElement) {
            spider.el.remove();
        }
        if (this.activeSpiders) {
            this.activeSpiders = this.activeSpiders.filter(s => s.id !== spider.id);
            if (this.activeSpiders.length === 0) {
                if (window.characterModel && typeof window.characterModel.clearEyeOverride === 'function') {
                    window.characterModel.clearEyeOverride();
                }
            }
        }
    }

    updateSpidersPhysics(dt) {
        if (!this.stageEl || !this.activeSpiders || this.activeSpiders.length === 0) return;
        const bossX = (window.physicsEngine && window.physicsEngine.x) || 400;
        const bossY = (window.physicsEngine && window.physicsEngine.y) || 300;
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;

        for (let i = this.activeSpiders.length - 1; i >= 0; i--) {
            const spider = this.activeSpiders[i];
            if (!spider || spider.isDragged || spider.state === 'dying') continue;

            const targetX = bossX + (spider.targetRelX * bScale);
            const targetY = bossY + (spider.targetRelY * bScale);
            const scaleX = (spider.x >= bossX) ? 1.0 : -1.0;

            if (spider.state === 'walking') {
                const dx = targetX - spider.x;
                const dy = targetY - spider.y;
                const dist = Math.hypot(dx, dy);

                if (dist <= 20) {
                    spider.state = 'biting';
                    spider.x = targetX;
                    spider.y = targetY;
                    this.startSpiderBiting(spider);
                } else {
                    const speed = 250;
                    const step = Math.min(dist, speed * dt);
                    spider.x += (dx / dist) * step;
                    spider.y += (dy / dist) * step;
                }
            } else if (spider.state === 'biting') {
                spider.x = targetX;
                spider.y = targetY;
            }

            if (spider.el) {
                spider.el.style.left = `${spider.x}px`;
                spider.el.style.top = `${spider.y}px`;
                spider.el.style.transform = `translate(-50%, -50%) scaleX(${scaleX})`;
            }
        }
    }

    // -------------------------------------------------------------------------
    // ELDER WAND SPECIAL WEAPON IMPLEMENTATION
    // -------------------------------------------------------------------------

    showElderWandSpellBar() {
        if (!this.stageEl) return;
        if (!this.activeElderWandSpell) this.activeElderWandSpell = 'expelliarmus';

        let bar = document.getElementById('game-elder-wand-spell-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'game-elder-wand-spell-bar';
            bar.className = 'elder-wand-spell-bar';
            this.stageEl.appendChild(bar);
        }

        const spells = [
            { id: 'expelliarmus', name: 'ئێکسپێلیارمس', emoji: '🔴' },
            { id: 'petrificus_totalus', name: 'پێتریفیکوس', emoji: '⚡' },
            { id: 'lumos', name: 'لومۆس', emoji: '💡' },
            { id: 'orchideous', name: 'ئۆرکیدیوس', emoji: '🌸' },
            { id: 'ridiculous', name: 'ڕیدیکیولەس', emoji: '🎭' },
            { id: 'wingardium_leviosa', name: 'وینگاردیوم لێڤیۆسا', emoji: '✨' },
            { id: 'avada_kedavra', name: 'ئەڤادا کەداڤرا', emoji: '☠' }
        ];

        bar.innerHTML = `
            <div class="spell-buttons-row">
                ${spells.map(s => `
                    <button type="button" class="spell-bar-btn ${this.activeElderWandSpell === s.id ? 'active' : ''}" data-spell="${s.id}">
                        <span class="emoji-icon">${s.emoji}</span>
                        <span>${s.name}</span>
                    </button>
                `).join('')}
            </div>
            <div class="spell-cooldown-bar-wrap">
                <div id="spell-cooldown-fill" class="spell-cooldown-fill"></div>
            </div>
        `;

        // Stop propagation so clicking spell bar never triggers a stage attack
        const stopProp = (e) => e.stopPropagation();
        bar.addEventListener('pointerdown', stopProp);
        bar.addEventListener('mousedown', stopProp);
        bar.addEventListener('touchstart', stopProp, { passive: true });
        bar.addEventListener('click', stopProp);

        bar.querySelectorAll('.spell-bar-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (this.elderWandCooldown) return;
                const spellId = btn.dataset.spell;
                this.cancelElderWandCast(this.specialSession);
                this.clearElderWandLumos(this.specialSession);
                this.activeElderWandSpell = spellId;
                if (window.soundEngine) window.soundEngine.playButton();
                bar.querySelectorAll('.spell-bar-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        bar.style.display = 'flex';
        this.elderWandSpellBarEl = bar;
    }

    hideElderWandSpellBar() {
        const bar = document.getElementById('game-elder-wand-spell-bar');
        if (bar) bar.style.display = 'none';
    }

    triggerSpellCooldown(durationMs) {
        this.elderWandCooldown = true;
        const fillEl = document.getElementById('spell-cooldown-fill');
        const barEl = document.getElementById('game-elder-wand-spell-bar');

        if (barEl) barEl.classList.add('on-cooldown');

        if (fillEl) {
            fillEl.style.transition = 'none';
            fillEl.style.width = '100%';
            requestAnimationFrame(() => {
                fillEl.style.transition = `width ${durationMs}ms linear`;
                fillEl.style.width = '0%';
            });
        }

        setTimeout(() => {
            this.elderWandCooldown = false;
            if (barEl) barEl.classList.remove('on-cooldown');
            if (fillEl) {
                fillEl.style.transition = 'none';
                fillEl.style.width = '100%';
            }
        }, durationMs);
    }

    startElderWandSession(cursorX, cursorY) {
        if (!this.running || this.elderWandCooldown || this.wingardiumReturnActive) return;

        let wandEl = document.getElementById('game-wand-actor');
        if (!wandEl) {
            wandEl = document.createElement('div');
            wandEl.id = 'game-wand-actor';
            wandEl.className = 'game-wand-actor';
            wandEl.innerHTML = `<img class="wand-body-img" src="attaker/special/elder wand/frame1.png" alt="elder wand" draggable="false">`;
            this.stageEl.appendChild(wandEl);
        }
        wandEl.style.opacity = '1';
        wandEl.style.display = 'block';

        const bossX = (window.physicsEngine && window.physicsEngine.x) || 400;
        const bossY = (window.physicsEngine && window.physicsEngine.y) || 300;
        const targetX = bossX;
        const targetY = bossY - 70;

        const dx = targetX - cursorX;
        const dy = targetY - cursorY;
        const angleRad = Math.atan2(dy, dx);
        const rotDeg = angleRad * (180 / Math.PI) + 90;

        wandEl.style.left = `${cursorX}px`;
        wandEl.style.top = `${cursorY}px`;
        wandEl.style.transform = `translate(-50%, -90%) rotate(${rotDeg}deg) scale(0.65)`;

        const session = {
            active: true,
            weaponId: 'elder_wand',
            wandEl: wandEl,
            cursorX: cursorX,
            cursorY: cursorY,
            rotDeg: rotDeg,
            angleRad: angleRad,
            targetX: targetX,
            targetY: targetY,
            isWaving: false
        };
        const previousSession = this.specialSession;
        if (previousSession) {
            previousSession.active = false;
            this.cancelElderWandCast(previousSession);
            this.clearElderWandLumos(previousSession);
            if (previousSession.hideTimer) clearTimeout(previousSession.hideTimer);
        }
        this.specialSession = session;

        if (!this.elderWandCooldown) {
            this.castElderWandSpell(this.activeElderWandSpell || 'expelliarmus', cursorX, cursorY, targetX, targetY);
        }
    }

    updateElderWandSession(cursorX, cursorY) {
        const session = this.specialSession;
        if (!session || !session.wandEl) return;

        session.cursorX = cursorX;
        session.cursorY = cursorY;

        const bossX = (window.physicsEngine && window.physicsEngine.x) || 400;
        const bossY = (window.physicsEngine && window.physicsEngine.y) || 300;
        const targetX = bossX;
        const targetY = bossY - 70;

        const dx = targetX - cursorX;
        const dy = targetY - cursorY;
        const angleRad = Math.atan2(dy, dx);
        let rotDeg = angleRad * (180 / Math.PI) + 90;
        while (rotDeg - session.rotDeg > 180) rotDeg -= 360;
        while (rotDeg - session.rotDeg < -180) rotDeg += 360;

        session.angleRad = angleRad;
        session.rotDeg = rotDeg;
        session.targetX = targetX;
        session.targetY = targetY;

        session.wandEl.style.left = `${cursorX}px`;
        session.wandEl.style.top = `${cursorY}px`;

        if (!session.isWaving && !session.wingardiumActive) {
            session.wandEl.style.transform = `translate(-50%, -90%) rotate(${rotDeg}deg) scale(0.65)`;
        }
    }

    endElderWandSession() {
        const session = this.specialSession;
        if (!session) return;
        session.active = false;
        this.cancelElderWandCast(session);
        this.clearElderWandLumos(session);
        if (session.hideTimer) clearTimeout(session.hideTimer);
        session.hideTimer = setTimeout(() => {
            if (!session.active && session.wandEl) {
                session.wandEl.style.opacity = '0';
                session.wandEl.style.display = 'none';
            }
        }, 850);
    }

    cancelElderWandCast(session) {
        if (!session) return;
        if (session.castTimer) {
            clearTimeout(session.castTimer);
            session.castTimer = null;
        }
        session.isWaving = false;
        this.stopWingardiumLeviosa(session, false, 850);
    }

    clearElderWandLumos(session) {
        const wandEl = session && session.wandEl
            ? session.wandEl
            : document.getElementById('game-wand-actor');
        if (!wandEl) return;

        wandEl.querySelectorAll('.lumos-wand-light').forEach(light => light.remove());
        if (session) session.lumosEl = null;
    }

    castElderWandSpell(spellKey, wandX, wandY, targetX, targetY) {
        if (this.elderWandCooldown) return;

        const session = this.specialSession;
        if (session) session.isWaving = true;
        if (spellKey === 'wingardium_leviosa') {
            this.triggerSpellCooldown(3000);
        }

        const spellFolderMap = {
            'avada_kedavra': 'avada kedavra',
            'expelliarmus': 'expelliarmus',
            'petrificus_totalus': 'petrificus totalus',
            'lumos': 'lumos',
            'orchideous': 'orchideous',
            'ridiculous': 'ridiculous',
            'wingardium_leviosa': 'wingardium leviosa'
        };
        const folderName = spellFolderMap[spellKey] || 'avada kedavra';

        // Play spell voice/incantation sound
        if (window.soundEngine) {
            const useExtendedWingardium = spellKey === 'wingardium_leviosa' && Math.random() < 0.25;
            const incantationFile = useExtendedWingardium
                ? 'wingardium-leviosaaaaaaaaaa.mp3'
                : (spellKey === 'wingardium_leviosa' ? 'wingardium leviosa.mp3' : `${folderName}.mp3`);
            window.soundEngine.playAudioFile(`attaker/special/elder wand/${folderName}/${incantationFile}`, 1.0, false);
        }

        // Harry Potter waving animation on wand
        if (session && session.wandEl) {
            const baseRot = session.rotDeg || 0;
            session.wandEl.style.transition = 'transform 0.24s ease-out';
            session.wandEl.style.transform = `translate(-50%, -90%) rotate(${baseRot - 28}deg) scale(0.7)`;

            setTimeout(() => {
                if (session && session.wandEl) {
                    session.wandEl.style.transition = 'transform 0.26s ease-in-out';
                    session.wandEl.style.transform = `translate(-50%, -90%) rotate(${baseRot + 30}deg) scale(0.72)`;
                }
            }, 250);

            setTimeout(() => {
                if (session && session.wandEl) {
                    session.wandEl.style.transition = 'transform 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    session.wandEl.style.transform = `translate(-50%, -90%) rotate(${baseRot}deg) scale(0.65)`;
                }
            }, 650);
        }

        // At 900ms: the incantation and wand animation are complete, then shoot.
        const castTimer = setTimeout(() => {
            if (session) session.castTimer = null;
            if (session && (!session.active || this.specialSession !== session)) return;
            if (session) session.isWaving = false;

            if (spellKey !== 'wingardium_leviosa' && window.soundEngine) {
                window.soundEngine.playAudioFile(`attaker/special/elder wand/${folderName}/shoot.mp3`, 1.0, false);
            }

            const rotDeg = session ? (session.rotDeg || 0) : 0;
            const angleRad = (rotDeg - 90) * (Math.PI / 180);
            const curWandX = session ? session.cursorX : wandX;
            const curWandY = session ? session.cursorY : wandY;
            const tipX = curWandX + Math.cos(angleRad) * 205;
            const tipY = curWandY + Math.sin(angleRad) * 205;

            const bossX = (window.physicsEngine && window.physicsEngine.x) || targetX;
            const bossY = (window.physicsEngine && window.physicsEngine.y) || targetY;
            const liveTargetX = bossX;
            const liveTargetY = bossY - 70;

            if (spellKey === 'avada_kedavra') {
                this.executeAvadaKedavra(tipX, tipY, liveTargetX, liveTargetY);
            } else if (spellKey === 'expelliarmus') {
                this.executeExpelliarmus(tipX, tipY, bossX, bossY, curWandX);
            } else if (spellKey === 'petrificus_totalus') {
                this.executePetrificusTotalus(tipX, tipY, liveTargetX, liveTargetY);
            } else if (spellKey === 'lumos') {
                this.executeLumos(session);
            } else if (spellKey === 'orchideous') {
                this.executeOrchideous(session, tipX, tipY, liveTargetX, liveTargetY);
            } else if (spellKey === 'ridiculous') {
                this.executeRidiculous(tipX, tipY, liveTargetX, liveTargetY);
            } else if (spellKey === 'wingardium_leviosa') {
                this.executeWingardiumLeviosa(session);
            }
        }, 900);
        if (session) session.castTimer = castTimer;
    }

    executeWingardiumLeviosa(session) {
        if (!session || !session.active || this.specialSession !== session) return;

        if (session.wingardiumActive || session.wingardiumReturnRaf || session.wingardiumFlight) {
            this.stopWingardiumLeviosa(session, true);
        }

        const character = document.querySelector('#game-boss-container .mv-character-composite');
        const facial = character && character.querySelector('.mv-part-facials');
        if (!facial) return;

        session.wingardiumActive = true;
        session.wingardiumFacial = facial;
        session.wingardiumOriginalOpacity = facial.style.opacity;
        const stageRect = this.stageEl.getBoundingClientRect();
        const facialRect = facial.getBoundingClientRect();
        const facialLayoutWidth = facial.offsetWidth || facialRect.width;
        const facialLayoutHeight = facial.offsetHeight || facialRect.height;
        session.wingardiumFlight = facial.cloneNode(true);
        session.wingardiumFlight.classList.add('wingardium-facial-flight');
        session.wingardiumFlight.style.position = 'absolute';
        session.wingardiumFlight.style.width = `${facialLayoutWidth}px`;
        session.wingardiumFlight.style.height = `${facialLayoutHeight}px`;
        session.wingardiumFlight.style.left = `${facialRect.left - stageRect.left + facialRect.width / 2}px`;
        session.wingardiumFlight.style.top = `${facialRect.top - stageRect.top + facialRect.height / 2}px`;
        session.wingardiumFlight.style.transform = 'translate(-50%, -50%)';
        session.wingardiumFlight.style.margin = '0';
        session.wingardiumFlight.style.zIndex = '80';
        session.wingardiumFlight.style.pointerEvents = 'none';
        this.stageEl.appendChild(session.wingardiumFlight);
        session.wingardiumVisualScaleX = Math.max(0.01, facialRect.width / facialLayoutWidth);
        session.wingardiumVisualScaleY = Math.max(0.01, facialRect.height / facialLayoutHeight);
        session.wingardiumFlight.style.transform = `translate(-50%, -50%) scale(${session.wingardiumVisualScaleX}, ${session.wingardiumVisualScaleY})`;
        facial.style.opacity = '0';
        session.wingardiumStartTime = performance.now();
        session.wingardiumStartLeft = facialRect.left - stageRect.left + facialRect.width / 2;
        session.wingardiumDriftDirection = Math.random() < 0.5 ? -1 : 1;
        session.wingardiumDriftDistance = 28 + Math.random() * 58;
        session.wingardiumSwayAmount = 10 + Math.random() * 12;

        const roll = (now) => {
            if (!session.active || this.specialSession !== session || !session.wingardiumActive) return;
            const elapsed = now - session.wingardiumStartTime;
            if (!session.wingardiumFlightFinished) {
                const lift = elapsed * 0.05;
                const bob = Math.sin(elapsed * 0.004) * 8;
                const sway = Math.sin(elapsed * 0.005) * session.wingardiumSwayAmount;
                const driftProgress = Math.min(1, lift / Math.max(1, this.stageEl.clientHeight * 0.75));
                const drift = session.wingardiumDriftDirection * session.wingardiumDriftDistance * driftProgress;
                const flightLeft = session.wingardiumStartLeft + drift + sway;
                const flightTop = facialRect.top - stageRect.top + facialRect.height / 2 - lift + bob;
                session.wingardiumFlight.style.left = `${flightLeft}px`;
                session.wingardiumFlight.style.top = `${flightTop}px`;
                const aimX = flightLeft;
                const aimY = flightTop;
                const aimAngle = Math.atan2(aimY - session.cursorY, aimX - session.cursorX) * (180 / Math.PI) + 90;
                session.wingardiumAimRotation = aimAngle;
                if (flightTop + facialRect.height / 2 < -20) {
                    session.wingardiumFlightFinished = true;
                }
            }
            const flourish = Math.sin(elapsed * 0.006) * 28;
            session.wandEl.style.transition = 'none';
            const wandAimRotation = session.wingardiumAimRotation !== undefined
                ? session.wingardiumAimRotation
                : (session.rotDeg || 0);
            session.wandEl.style.transform = `translate(-50%, -90%) rotate(${wandAimRotation + flourish}deg) scale(0.68)`;
            session.wingardiumRaf = requestAnimationFrame(roll);
        };
        session.wingardiumRaf = requestAnimationFrame(roll);
    }

    stopWingardiumLeviosa(session, snapBack = false, returnDuration = 850) {
        if (!session) return;
        if (session.wingardiumRaf) {
            cancelAnimationFrame(session.wingardiumRaf);
            session.wingardiumRaf = null;
        }
        if (session.wingardiumReturnRaf) {
            cancelAnimationFrame(session.wingardiumReturnRaf);
            session.wingardiumReturnRaf = null;
        }
        const facial = session.wingardiumFacial;
        const flight = session.wingardiumFlight;
        if (snapBack) {
            if (flight && flight.parentElement) flight.remove();
            if (facial) facial.style.opacity = session.wingardiumOriginalOpacity || '';
            this.wingardiumReturnActive = false;
            session.wingardiumActive = false;
            session.wingardiumFlightFinished = false;
            session.wingardiumFacial = null;
            session.wingardiumFlight = null;
            return;
        }
        if (facial && flight && flight.parentElement) {
            const stageRect = this.stageEl.getBoundingClientRect();
            const targetRect = facial.getBoundingClientRect();
            const currentRect = flight.getBoundingClientRect();
            const startX = currentRect.left - stageRect.left + currentRect.width / 2;
            const startY = currentRect.top - stageRect.top + currentRect.height / 2;
            const targetX = targetRect.left - stageRect.left + targetRect.width / 2;
            const targetY = targetRect.top - stageRect.top + targetRect.height / 2;
            const startTime = performance.now();
            const duration = returnDuration;
            const visualScaleX = session.wingardiumVisualScaleX || 1;
            const visualScaleY = session.wingardiumVisualScaleY || 1;
            facial.style.opacity = '0';
            this.wingardiumReturnActive = true;

            const returnFlight = (now) => {
                const progress = Math.min(1, (now - startTime) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                const sway = Math.sin(progress * Math.PI * 3) * (1 - progress) * 18;
                const x = startX + (targetX - startX) * eased + sway;
                const y = startY + (targetY - startY) * eased;
                const featherRotation = Math.sin(progress * Math.PI * 4) * (1 - progress) * 12;
                flight.style.left = `${x}px`;
                flight.style.top = `${y}px`;
                flight.style.transform = `translate(-50%, -50%) rotate(${featherRotation}deg) scale(${visualScaleX}, ${visualScaleY})`;

                if (progress < 1 && flight.parentElement) {
                    session.wingardiumReturnRaf = requestAnimationFrame(returnFlight);
                } else {
                    if (flight.parentElement) flight.remove();
                    facial.style.opacity = session.wingardiumOriginalOpacity || '';
                    this.wingardiumReturnActive = false;
                    session.wingardiumReturnRaf = null;
                }
            };
            session.wingardiumReturnRaf = requestAnimationFrame(returnFlight);
        } else if (facial) {
            facial.style.opacity = session.wingardiumOriginalOpacity || '';
            this.wingardiumReturnActive = false;
        }
        session.wingardiumActive = false;
        session.wingardiumFlightFinished = false;
        session.wingardiumFacial = null;
        session.wingardiumFlight = null;
    }

    spawnElderBeam(folderName, startX, startY, targetX, targetY, glowColor, onHit) {
        if (!this.stageEl) return;

        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angleRad = Math.atan2(dy, dx);

        const beamEl = document.createElement('div');
        beamEl.className = 'elder-wand-beam';
        beamEl.style.left = `${startX}px`;
        beamEl.style.top = `${startY}px`;
        beamEl.style.width = `${Math.max(60, distance)}px`;
        beamEl.style.height = '85px';
        beamEl.style.transform = `translateY(-50%) rotate(${angleRad}rad)`;
        beamEl.style.filter = `drop-shadow(0 0 16px ${glowColor}) drop-shadow(0 0 35px ${glowColor})`;

        const frames = ['frame1.png', 'frame2.png', 'frame3.png', 'frame4.png'];
        const frameScales = [0.55, 0.75, 1.0, 1.22];
        let frameIdx = 0;
        beamEl.innerHTML = `<img src="attaker/special/elder wand/${folderName}/${frames[0]}" alt="beam" draggable="false">`;
        this.stageEl.appendChild(beamEl);

        const imgEl = beamEl.querySelector('img');
        const applyFrame = () => {
            beamEl.style.height = `${85 * frameScales[frameIdx]}px`;
            if (imgEl) {
                imgEl.src = `attaker/special/elder wand/${folderName}/${frames[frameIdx]}`;
                imgEl.style.transform = 'none';
            }
        };
        applyFrame();
        const frameTimer = setInterval(() => {
            frameIdx += 1;
            if (frameIdx >= frames.length) {
                clearInterval(frameTimer);
                return;
            }
            applyFrame();
        }, 70);

        setTimeout(() => {
            clearInterval(frameTimer);
            beamEl.style.transition = 'opacity 0.12s ease-out';
            beamEl.style.opacity = '0';
            setTimeout(() => {
                if (beamEl.parentElement) beamEl.remove();
            }, 130);
            if (onHit) onHit();
        }, 320);
    }

    executeAvadaKedavra(startX, startY, targetX, targetY) {
        this.triggerSpellCooldown(9000);

        this.spawnElderBeam('avada kedavra', startX, startY, targetX, targetY, '#2ed573', () => {
            this.takeDamage(85, null, { blood: 'attaker/shooting/blood.png' });
            this.spawnHitSparks(targetX, targetY);

            // Full screen green filter animation that stays for 3 seconds where nothing is visible
            const overlay = document.createElement('div');
            overlay.className = 'avada-screen-overlay';
            document.body.appendChild(overlay);

            requestAnimationFrame(() => overlay.classList.add('visible'));

            // After fade-in (200ms): character goes under the screen and hides there
            setTimeout(() => {
                const stageRect = this.stageEl.getBoundingClientRect();
                const screenH = stageRect.height || window.innerHeight;

                window.physicsEngine.y = screenH + 450;
                window.physicsEngine.vy = 0;
                window.physicsEngine.vx = 0;
                window.physicsEngine.isPositionLocked = true;
                window.physicsEngine.applyTransform();

                // Keep screen completely green with nothing visible for 3 full seconds (3000ms)
                setTimeout(() => {
                    // Green filter fades away slowly (takes 1.2 seconds)
                    overlay.classList.add('fading');

                    setTimeout(() => {
                        if (overlay.parentElement) overlay.remove();

                        const peekY = screenH - 75;
                        this.animateBossY(screenH + 450, peekY, 2600, () => {
                            setTimeout(() => {
                                const normalY = window.physicsEngine.groundY || (screenH * 0.58);
                                this.animateBossY(peekY, normalY, 1600, () => {
                                    window.physicsEngine.isPositionLocked = false;
                                    window.physicsEngine.applyTransform();
                                });
                            }, 1000);
                        });
                    }, 1200);
                }, 3000);
            }, 200);
        });
    }

    executeExpelliarmus(startX, startY, bossX, bossY, wandX) {
        this.triggerSpellCooldown(900);

        // Random target anywhere across the character's body
        const randOffsetX = (Math.random() - 0.5) * 140;
        const randOffsetY = -240 + Math.random() * 240;
        const targetX = bossX + randOffsetX;
        const targetY = bossY + randOffsetY;

        this.spawnElderBeam('expelliarmus', startX, startY, targetX, targetY, '#ff4757', () => {
            const damage = 45;
            this.takeDamage(damage, null, { blood: 'attaker/shooting/blood.png' });
            this.spawnHitSparks(targetX, targetY);
            this.spawnDamagePopup(targetX, targetY - 40, damage);
            window.physicsEngine.applyDirectionalHit(wandX, 50, targetY);
            const bScale = window.physicsEngine.baseScale || 1;
            const localHitX = 160 + (targetX - window.physicsEngine.x) / bScale;
            const localHitY = 200 + (targetY - window.physicsEngine.y) / bScale;
            this.spawnBloodSplatAt(localHitX, localHitY, { blood: 'attaker/shooting/blood.png' });
        });
    }

    executePetrificusTotalus(startX, startY, targetX, targetY) {
        this.triggerSpellCooldown(1400);

        this.spawnElderBeam('petrificus totalus', startX, startY, targetX, targetY, '#00d2d3', () => {
            const damage = 50;
            this.takeDamage(damage, null, { blood: 'attaker/shooting/blood.png' });
            this.spawnDamagePopup(targetX, targetY - 40, damage);

            // Petrify freeze without lightning animation (glowing light of character is enough)
            window.physicsEngine.vx = 0;
            window.physicsEngine.vy = 0;
            if (this.bossEl) this.bossEl.classList.add('petrified-freeze');

            let lightningHitCount = 0;
            const lightningHitTimer = setInterval(() => {
                if (!this.running || !window.physicsEngine || lightningHitCount >= 11) {
                    clearInterval(lightningHitTimer);
                    return;
                }

                lightningHitCount += 1;
                const hitX = window.physicsEngine.x + (Math.random() - 0.5) * 150;
                const hitY = window.physicsEngine.y - 190 + Math.random() * 330;
                window.physicsEngine.applyDirectionalHit(hitX, 12, hitY);
                this.takeDamage(10, null, { blood: 'attaker/shooting/blood.png' });
                this.spawnDamagePopup(hitX, hitY - 30, 10);
            }, 180);

            setTimeout(() => {
                clearInterval(lightningHitTimer);
                if (this.bossEl) this.bossEl.classList.remove('petrified-freeze');
            }, 2500);
        });
    }

    executeLumos(session) {
        this.clearElderWandLumos(session);
        const lumosOverlay = document.createElement('div');
        lumosOverlay.className = 'lumos-wand-light';
        if (session && session.wandEl) {
            session.lumosEl = lumosOverlay;
            session.wandEl.appendChild(lumosOverlay);
        }

        requestAnimationFrame(() => lumosOverlay.classList.add('visible'));
    }

    executeOrchideous(session, tipX, tipY, targetX, targetY) {
        this.triggerSpellCooldown(1000);

        // Bouquet appears directly emerging from the tip of the wand
        if (session && session.wandEl) {
            const headFlower = document.createElement('div');
            headFlower.className = 'orchideous-wand-flower';
            headFlower.innerHTML = `<img src="attaker/special/elder wand/orchideous/wand head flower.png" alt="bouquet" draggable="false">`;
            session.wandEl.appendChild(headFlower);
            setTimeout(() => {
                headFlower.style.transition = 'opacity 0.4s ease';
                headFlower.style.opacity = '0';
                setTimeout(() => { if (headFlower.parentElement) headFlower.remove(); }, 400);
            }, 2500);
        }

        if (!this.activeFlowers) this.activeFlowers = [];

        // Shoot 12 dropped flowers emerging directly from wand tip towards character
        const flowerCount = 12;
        for (let i = 0; i < flowerCount; i++) {
            setTimeout(() => {
                if (!this.stageEl) return;
                const flowerEl = document.createElement('div');
                flowerEl.className = 'game-flower-actor';
                flowerEl.dataset.flowerId = 'fl_' + Date.now() + '_' + i;
                flowerEl.innerHTML = `<img src="attaker/special/elder wand/orchideous/dropped flower.png" alt="flower" draggable="false">`;
                flowerEl.style.left = `${tipX}px`;
                flowerEl.style.top = `${tipY}px`;
                this.stageEl.appendChild(flowerEl);

                const flightTime = 0.58 + Math.random() * 0.16;
                const flowerTargetX = targetX + (Math.random() - 0.5) * 150;
                const flowerTargetY = targetY + (Math.random() - 0.5) * 260;
                const flowerScale = 0.85 + Math.random() * 0.3;
                const flowerObj = {
                    el: flowerEl,
                    id: flowerEl.dataset.flowerId,
                    x: tipX,
                    y: tipY,
                    vx: (flowerTargetX - tipX) / flightTime + (Math.random() - 0.5) * 150,
                    vy: (flowerTargetY - tipY) / flightTime - (325 * flightTime) + (Math.random() - 0.5) * 110,
                    rotation: Math.random() * 360,
                    vRot: (Math.random() - 0.5) * 160,
                    scale: flowerScale,
                    radius: 24 * flowerScale,
                    isDragged: false,
                    hasHitCharacter: false
                };
                this.activeFlowers.push(flowerObj);

                // Keep flowers visible long enough to settle on the ground.
                setTimeout(() => {
                    flowerEl.style.opacity = '0';
                    setTimeout(() => {
                        if (flowerEl.parentElement) flowerEl.remove();
                        this.activeFlowers = this.activeFlowers.filter(f => f !== flowerObj);
                    }, 1000);
                }, 18000);
            }, i * 45);
        }
    }

    startFlowerDrag(flowerEl, clientX, clientY, localX, localY) {
        if (!this.activeFlowers) return false;
        const flowerId = flowerEl.dataset.flowerId;
        const flower = this.activeFlowers.find(f => f.id === flowerId);
        if (!flower) return false;

        flower.isDragged = true;
        flower.dragOffsetX = flower.x - localX;
        flower.dragOffsetY = flower.y - localY;
        this.draggedFlower = flower;
        return true;
    }

    updateFlowerDrag(localX, localY) {
        if (!this.draggedFlower) return;
        const flower = this.draggedFlower;
        flower.x = localX + (flower.dragOffsetX || 0);
        flower.y = localY + (flower.dragOffsetY || 0);
        flower.vx = 0;
        flower.vy = 0;
        flower.el.style.left = `${flower.x}px`;
        flower.el.style.top = `${flower.y}px`;
        flower.el.style.transform = `translate(-50%, -50%) rotate(${flower.rotation}deg) scale(${flower.scale || 1})`;
    }

    endFlowerDrag() {
        if (!this.draggedFlower) return;
        const flower = this.draggedFlower;
        flower.isDragged = false;
        this.draggedFlower = null;
    }

    updateFlowersPhysics(dt) {
        if (!this.stageEl || !this.activeFlowers || this.activeFlowers.length === 0) return;
        const stageRect = this.stageEl.getBoundingClientRect();
        const stageHeight = stageRect.height || 600;
        const leftWall = 25;
        const rightWall = (stageRect.width || 800) - 25;

        for (let i = this.activeFlowers.length - 1; i >= 0; i--) {
            const flower = this.activeFlowers[i];
            if (!flower || flower.isDragged) continue;

            flower.vy += 650 * dt;
            flower.x += flower.vx * dt;
            flower.y += flower.vy * dt;
            flower.rotation += (flower.vRot || 0) * dt;

            if (!flower.hasHitCharacter && window.physicsEngine) {
                const bScale = window.physicsEngine.baseScale || 1;
                const relX = (flower.x - window.physicsEngine.x) / bScale;
                const relY = (flower.y - window.physicsEngine.y) / bScale;
                const flowerRadius = 28;
                let bodyHalfWidth = 0;
                let insideBody = false;

                if (relY >= -210 && relY < -45) {
                    bodyHalfWidth = 60;
                    insideBody = Math.abs(relX) <= bodyHalfWidth;
                } else if (relY >= -45 && relY < 75) {
                    bodyHalfWidth = 110;
                    insideBody = Math.abs(relX) <= bodyHalfWidth;
                } else if (relY >= 75 && relY <= 185) {
                    bodyHalfWidth = 80;
                    insideBody = Math.abs(relX) <= bodyHalfWidth;
                }

                if (insideBody && Math.abs(relX) <= bodyHalfWidth + flowerRadius) {
                    flower.hasHitCharacter = true;
                    flower.vx *= -0.12;
                    flower.vy = Math.max(120, Math.abs(flower.vy) * 0.3);
                    flower.vRot = (flower.vRot || 0) * 0.35;
                }
            }

            const flowerRadius = flower.radius || 24;
            const groundY = stageHeight - flowerRadius;
            if (flower.y >= groundY) {
                flower.y = groundY;
                flower.vy = -flower.vy * 0.32;
                flower.vx *= 0.88;
                flower.vRot = (flower.vRot || 0) * 0.85;
            }

            if (flower.x <= leftWall) {
                flower.x = leftWall;
                flower.vx = -flower.vx * 0.5;
            } else if (flower.x >= rightWall) {
                flower.x = rightWall;
                flower.vx = -flower.vx * 0.5;
            }

            if (flower.el) {
                flower.el.style.left = `${flower.x}px`;
                flower.el.style.top = `${flower.y}px`;
                flower.el.style.transform = `translate(-50%, -50%) rotate(${flower.rotation}deg) scale(${flower.scale || 1})`;
            }
        }

        // Resolve flower-to-flower overlaps. A grabbed flower acts as the moving
        // body and pushes neighboring flowers instead of passing through them.
        for (let i = 0; i < this.activeFlowers.length; i++) {
            const first = this.activeFlowers[i];
            if (!first) continue;

            for (let j = i + 1; j < this.activeFlowers.length; j++) {
                const second = this.activeFlowers[j];
                if (!second) continue;

                const dx = second.x - first.x;
                const dy = second.y - first.y;
                const distance = Math.hypot(dx, dy);
                const minimumDistance = (first.radius || 24) + (second.radius || 24);
                if (distance >= minimumDistance) continue;

                const safeDistance = distance || 0.001;
                const normalX = dx / safeDistance;
                const normalY = dy / safeDistance;
                const overlap = minimumDistance - safeDistance;
                const firstWeight = first.isDragged ? 0 : (second.isDragged ? 1 : 0.5);
                const secondWeight = second.isDragged ? 0 : (first.isDragged ? 1 : 0.5);

                first.x -= normalX * overlap * firstWeight;
                first.y -= normalY * overlap * firstWeight;
                second.x += normalX * overlap * secondWeight;
                second.y += normalY * overlap * secondWeight;

                const relativeVelocity = (second.vx - first.vx) * normalX + (second.vy - first.vy) * normalY;
                if (relativeVelocity < 0) {
                    const impulse = -relativeVelocity * 0.45;
                    if (!first.isDragged) {
                        first.vx -= normalX * impulse * (second.isDragged ? 1 : 0.5);
                        first.vy -= normalY * impulse * (second.isDragged ? 1 : 0.5);
                    }
                    if (!second.isDragged) {
                        second.vx += normalX * impulse * (first.isDragged ? 1 : 0.5);
                        second.vy += normalY * impulse * (first.isDragged ? 1 : 0.5);
                    }
                }

                [first, second].forEach(flower => {
                    const flowerGroundY = stageHeight - (flower.radius || 24);
                    if (flower.y > flowerGroundY) flower.y = flowerGroundY;
                    if (flower.el) {
                        flower.el.style.left = `${flower.x}px`;
                        flower.el.style.top = `${flower.y}px`;
                        flower.el.style.transform = `translate(-50%, -50%) rotate(${flower.rotation}deg) scale(${flower.scale || 1})`;
                    }
                });
            }
        }
    }

    executeRidiculous(startX, startY, targetX, targetY) {
        this.triggerSpellCooldown(2000);

        this.spawnElderSparkles(startX, startY, targetX, targetY, () => {
            const damage = 20;
            this.takeDamage(damage, null, { blood: 'attaker/shooting/blood.png' });
            this.spawnHitSparks(targetX, targetY);

            if (window.characterModel && typeof window.characterModel.applyTemporaryRandomCostume === 'function') {
                window.characterModel.applyTemporaryRandomCostume(10000);
            }
            if (this.bossEl) {
                this.bossEl.classList.add('ridiculous-glow');
                setTimeout(() => this.bossEl && this.bossEl.classList.remove('ridiculous-glow'), 1400);
            }
        });
    }

    spawnElderSparkles(startX, startY, targetX, targetY, onHit) {
        const sparkEl = document.createElement('div');
        sparkEl.style.position = 'absolute';
        sparkEl.style.left = `${startX}px`;
        sparkEl.style.top = `${startY}px`;
        sparkEl.style.width = '40px';
        sparkEl.style.height = '40px';
        sparkEl.style.transform = 'translate(-50%, -50%)';
        sparkEl.style.zIndex = '36';
        sparkEl.style.pointerEvents = 'none';
        sparkEl.style.fontSize = '2rem';
        sparkEl.textContent = '✨';
        sparkEl.style.filter = 'drop-shadow(0 0 16px #a29bfe) drop-shadow(0 0 25px #fd79a8)';
        this.stageEl.appendChild(sparkEl);

        const startTime = performance.now();
        const duration = 280;
        const flight = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1.0, elapsed / duration);
            const curX = startX + (targetX - startX) * progress;
            const curY = startY + (targetY - startY) * progress;
            sparkEl.style.left = `${curX}px`;
            sparkEl.style.top = `${curY}px`;
            if (progress < 1.0) {
                requestAnimationFrame(flight);
            } else {
                sparkEl.remove();
                if (onHit) onHit();
            }
        };
        requestAnimationFrame(flight);
    }

    animateBossY(fromY, toY, duration, onComplete) {
        const startTime = performance.now();
        const step = (now) => {
            const t = Math.min(1.0, (now - startTime) / duration);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            window.physicsEngine.y = fromY + (toY - fromY) * ease;
            window.physicsEngine.applyTransform();
            if (t < 1.0) {
                requestAnimationFrame(step);
            } else {
                window.physicsEngine.y = toY;
                window.physicsEngine.applyTransform();
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(step);
    }

    cleanupSpecialActors() {
        if (this.specialSession && this.specialSession.weaponId === 'coca_cola') this.endCocaColaSession();
        if (this.activeSpiders) {
            this.activeSpiders.forEach(s => {
                if (s.biteInterval) clearInterval(s.biteInterval);
                this.stopSpiderSound(s, 'walk');
                this.stopSpiderSound(s, 'bite');
                if (s.el && s.el.parentElement) s.el.remove();
            });
            this.activeSpiders = [];
            if (window.characterModel && typeof window.characterModel.clearEyeOverride === 'function') {
                window.characterModel.clearEyeOverride();
            }
        }
        if (this.activeFlowers) {
            this.activeFlowers.forEach(f => {
                if (f.el && f.el.parentElement) f.el.remove();
            });
            this.activeFlowers = [];
        }
        if (this.activeMinecraftActors) {
            [...this.activeMinecraftActors].forEach(actor => this.removeMinecraftActor(actor));
            this.activeMinecraftActors = [];
            this.draggedMinecraftActor = null;
        }
        if (this.activeDrones) {
            [...this.activeDrones].forEach(drone => this.removeDrone(drone));
            this.activeDrones = [];
        }
        document.querySelectorAll('.game-burning-fire, .game-paint-splash').forEach(element => element.remove());
        const wandEl = document.getElementById('game-wand-actor');
        if (wandEl && wandEl.parentElement) wandEl.remove();

        const avadaOverlay = document.querySelector('.avada-screen-overlay');
        if (avadaOverlay && avadaOverlay.parentElement) avadaOverlay.remove();
    }

    spawnBloodSplat(targetX, targetY, gunCfg) {
        const bz = (gunCfg && gunCfg.bloodZone) ? gunCfg.bloodZone : { centerY: 240, spreadY: 150, spreadX: 110 };
        const centerY = (bz.centerY !== undefined) ? bz.centerY : 240;
        const spreadY = (bz.spreadY !== undefined) ? bz.spreadY : 150;
        const spreadX = (bz.spreadX !== undefined) ? bz.spreadX : 110;

        const randLocalX = 160 + (Math.random() - 0.5) * (spreadX * 2);
        const randLocalY = centerY + (Math.random() - 0.5) * (spreadY * 2);
        this.spawnBloodSplatAt(randLocalX, randLocalY, gunCfg);
    }

    // Backwards compatibility helper
    executeShootingAttack(weaponId, clickX, clickY) {
        this.startShootingSession(weaponId, clickX, clickY);
        setTimeout(() => {
            this.endShootingSession();
        }, 220);
    }

    executeHandPunch(targetX, targetY) {
        window.soundEngine.playPunch();
        this.spawnDamagePopup(targetX, targetY, 15);
        this.spawnHitSparks(targetX, targetY);

        window.physicsEngine.applyDirectionalHit(targetX, 22, targetY);
        this.takeDamage(15);
    }

    executeWeaponAttack(attackId, hitX, hitY) {
        if (this.isAttacking) return;
        this.isAttacking = true;

        const attackCfg = window.configManager.getAttackConfig(attackId);
        if (!attackCfg) {
            this.isAttacking = false;
            return;
        }

        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        const allowMirror = (attackCfg.allowMirror !== false);
        const isLeftAttack = allowMirror ? (hitX < bossX) : true;

        window.soundEngine.playAttackSound(attackId);

        this.playAttackerAnimation(attackId, attackCfg, bossX, bossY, isLeftAttack, () => {
            this.isAttacking = false;
            this.spawnDamagePopup(bossX, bossY - 100, attackCfg.damage);
            this.spawnHitSparks(bossX, bossY - 80);

            window.physicsEngine.applyDirectionalHit(hitX, attackCfg.damage * 0.9, hitY);
            this.takeDamage(attackCfg.damage, null, attackCfg);
        });
    }

    playAttackerAnimation(attackId, attackCfg, bossX, bossY, isLeftAttack, onComplete) {
        if (!this.attackerFxEl) {
            if (onComplete) onComplete();
            return;
        }

        this.attackerFxEl.style.display = 'block';
        this.attackerFxEl.style.left = '0px';
        this.attackerFxEl.style.top = '0px';
        this.attackerFxEl.style.width = '100%';
        this.attackerFxEl.style.height = '100%';
        this.attackerFxEl.style.transform = 'none';
        this.attackerFxEl.style.zIndex = '90';

        const folder = window.assetManager.getAttackerFolder(attackCfg.folder || attackId);

        // 1. Cute CUT Multi-Track Timeline Playback
        if (attackCfg.tracks && attackCfg.tracks.length > 0) {
            const tracks = attackCfg.tracks;
            let totalDur = 300;
            tracks.forEach(tr => {
                const trEnd = (tr.startTimeMs || 0) + (tr.durationMs || 250);
                if (trEnd > totalDur) totalDur = trEnd;
            });

            const startTime = performance.now();

            const evaluateEasing = (t, type) => {
                if (type === 'easeOutQuad') return 1 - (1 - t) * (1 - t);
                if (type === 'easeInOut') return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                if (type === 'bounce') {
                    const n1 = 7.5625, d1 = 2.75;
                    if (t < 1 / d1) return n1 * t * t;
                    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                    else return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
                return t; // linear
            };

            const animateTracks = (now) => {
                const elapsed = now - startTime;
                let html = '';

                tracks.forEach(tr => {
                    const trStart = tr.startTimeMs || 0;
                    const trDur = tr.durationMs || 250;
                    if (elapsed < trStart || elapsed > trStart + trDur) return;

                    const p = Math.max(0, Math.min(1, (elapsed - trStart) / trDur));
                    let posX = tr.x, posY = tr.y, scale = tr.scale || 1.2, sx = tr.scaleX !== undefined ? tr.scaleX : 1.0, sy = tr.scaleY !== undefined ? tr.scaleY : 1.0, rot = tr.rotation || 0, op = tr.opacity !== undefined ? tr.opacity : 1.0;

                    if (tr.transition && tr.transition.enabled) {
                        const ease = evaluateEasing(p, tr.transition.easing || 'easeOutQuad');
                        const trans = tr.transition;
                        posX = trans.startX + (trans.endX - trans.startX) * ease;
                        posY = trans.startY + (trans.endY - trans.startY) * ease;
                        scale = (trans.startScale || 1.0) + ((trans.endScale || 1.0) - (trans.startScale || 1.0)) * ease;
                        sx = (trans.startScaleX !== undefined ? trans.startScaleX : 1.0) + ((trans.endScaleX !== undefined ? trans.endScaleX : 1.0) - (trans.startScaleX !== undefined ? trans.startScaleX : 1.0)) * ease;
                        sy = (trans.startScaleY !== undefined ? trans.startScaleY : 1.0) + ((trans.endScaleY !== undefined ? trans.endScaleY : 1.0) - (trans.startScaleY !== undefined ? trans.startScaleY : 1.0)) * ease;
                        rot = (trans.startRot || 0) + ((trans.endRot || 0) - (trans.startRot || 0)) * ease;
                        op = (trans.startOpacity !== undefined ? trans.startOpacity : 1.0) + (((trans.endOpacity !== undefined ? trans.endOpacity : 1.0)) - (trans.startOpacity !== undefined ? trans.startOpacity : 1.0)) * ease;
                    }

                    const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
                    const finalSx = sx * scale * (isLeftAttack ? 1 : -1) * bScale;
                    const finalSy = sy * scale * bScale;
                    const renderX = isLeftAttack ? (bossX + (posX * bScale)) : (bossX - (posX * bScale));
                    const renderY = bossY + (posY * bScale);
                    const finalRot = rot;

                    html += `
                        <div style="position: absolute; left: ${renderX}px; top: ${renderY}px; transform: translate(-50%, -50%); opacity: ${op}; z-index: ${tr.zIndex || 90}; pointer-events: none;">
                            <img src="${encodeURI(folder + '/' + tr.frame)}" alt="atk-layer" draggable="false" 
                                 style="max-width: 140px; max-height: 140px; transform: scale(${finalSx}, ${finalSy}) rotate(${finalRot}deg); transform-origin: center center; display: block; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
                        </div>
                    `;
                });

                this.attackerFxEl.innerHTML = html;

                if (elapsed < totalDur) {
                    requestAnimationFrame(animateTracks);
                } else {
                    this.attackerFxEl.innerHTML = '';
                    this.attackerFxEl.style.display = 'none';
                    if (onComplete) onComplete();
                }
            };

            requestAnimationFrame(animateTracks);
            return;
        }

        // 2. Fallback to sequence frames
        if (attackCfg.frames && attackCfg.frames.length > 0) {
            let frameIdx = 0;
            const speed = attackCfg.frameSpeed || 100;
            const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
            const frameInterval = setInterval(() => {
                if (frameIdx >= attackCfg.frames.length) {
                    clearInterval(frameInterval);
                    this.attackerFxEl.innerHTML = '';
                    this.attackerFxEl.style.display = 'none';
                    if (onComplete) onComplete();
                    return;
                }

                const frameFile = attackCfg.frames[frameIdx];
                const t = window.configManager.getAttackFrameTransform(attackId, frameFile);

                const scaleBase = t.scale || 1.2;
                const sx = (t.scaleX !== undefined ? t.scaleX : 1.0) * scaleBase * (isLeftAttack ? 1 : -1) * bScale;
                const sy = (t.scaleY !== undefined ? t.scaleY : 1.0) * scaleBase * bScale;
                const posX = isLeftAttack ? (bossX + (t.x * bScale)) : (bossX - (t.x * bScale));
                const rot = t.rotation || 0;

                this.attackerFxEl.innerHTML = `
                    <div style="position: absolute; left: ${posX}px; top: ${bossY + (t.y * bScale)}px; transform: translate(-50%, -50%); pointer-events: none; z-index: 90;">
                        <img src="${encodeURI(folder + '/' + frameFile)}" alt="attack" draggable="false"
                             style="max-width: 140px; max-height: 140px; transform: scale(${sx}, ${sy}) rotate(${rot}deg); transform-origin: center center; display: block; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));">
                    </div>
                `;
                frameIdx++;
            }, speed);
        } else {
            this.attackerFxEl.innerHTML = '';
            this.attackerFxEl.style.display = 'none';
            if (onComplete) onComplete();
        }
    }

    takeDamage(amount, customText = null, attackCfg = null) {
        // Economy: Gain coins on each hit, chance to gain diamonds on heavy hits!
        const earnedCoins = amount * 2;
        window.configManager.addCoins(earnedCoins);
        if (amount >= 35 && Math.random() < 0.35) {
            window.configManager.addDiamonds(1);
        }

        this.updateStats();

        // Increment Combo
        this.combo++;
        this.updateComboDisplay();
        this.resetComboTimer();

        if (window.legendaryEffects) {
            window.legendaryEffects.notifyTerminatorHit();
        }

        // Check head equipment detachment physics
        this.checkHeadGearDetachment();

        // Schedule talking reaction 1.5 seconds after attack burst stops
        this.scheduleReaction(customText, attackCfg);

        // Reset ambient voice timer so it never fires mid-attack-reaction.
        // The 10s countdown restarts fresh from now after every hit.
        this.resetIdleQuoteTimer();
        if (window.soundEngine) window.soundEngine.startAmbientVoiceScheduler();
    }

    scheduleReaction(customText = null, attackCfg = null) {
        if (this.reactionTimer) {
            clearTimeout(this.reactionTimer);
            this.reactionTimer = null;
        }

        this.reactionTimer = setTimeout(() => {
            if (!this.running) return;

            // Play random reaction voice from sound library
            const voice = window.soundEngine ? window.soundEngine.playRandomReactionVoice() : null;
            if (!voice) return;

            // Show random Kurdish reaction quote
            const quotes = KURDISH_QUOTES.onHit;
            const randQuote = customText || quotes[Math.floor(Math.random() * quotes.length)];

            let talkDur = (voice && voice.durationMs) ? voice.durationMs : 1800;
            let talkSpeed = (voice && voice.talkSpeed) ? voice.talkSpeed : 100;

            this.showSpeechBubble(randQuote, talkDur + 600);

            if (window.characterModel) {
                window.characterModel.startTalking(talkDur, talkSpeed);
            }
        }, 1500);
    }

    updateStats() {
        const coinsEl = document.getElementById('game-coins-count');
        const diamondsEl = document.getElementById('game-diamonds-count');

        const coins = (window.configManager && window.configManager.getCoins) ? window.configManager.getCoins() : ((window.configManager && window.configManager.coins) || 0);
        const diamonds = (window.configManager && window.configManager.getDiamonds) ? window.configManager.getDiamonds() : ((window.configManager && window.configManager.diamonds) || 0);

        if (coinsEl) coinsEl.textContent = coins;
        if (diamondsEl) diamondsEl.textContent = diamonds;
    }

    updateComboDisplay() {
        const comboEl = document.getElementById('game-combo-count');
        if (!comboEl) return;

        if (this.combo > 1) {
            comboEl.style.display = 'inline-flex';
            comboEl.textContent = `🔥 ${this.combo}x کۆمبۆ`;
        } else {
            comboEl.style.display = 'none';
        }
    }

    resetComboTimer() {
        if (this.comboTimer) clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            this.combo = 0;
            this.updateComboDisplay();
        }, 2500);
    }

    // Idle quote timer removed - audio.js ambient scheduler now owns
    // voice + talking animation + speech bubble together every 20 seconds.
    resetIdleQuoteTimer() {
        if (this.idleQuoteTimer) clearTimeout(this.idleQuoteTimer);
        // Intentionally empty - controlled by window.soundEngine.startAmbientVoiceScheduler()
    }

    showSpeechBubble(text, duration = 2000) {
        if (!this.speechBubbleEl) return;
        if (this.bossEl?.classList.contains('lataman-character-sequence')) return;
        this.speechBubbleEl.textContent = text;
        this.speechBubbleEl.classList.add('visible');

        const bossX = window.physicsEngine.x;
        const bossY = window.physicsEngine.y;
        this.speechBubbleEl.style.left = `${bossX}px`;
        this.speechBubbleEl.style.top = `${bossY - 260}px`;

        if (this.speechTimeout) clearTimeout(this.speechTimeout);
        this.speechTimeout = setTimeout(() => {
            this.speechBubbleEl.classList.remove('visible');
        }, duration);
    }

    spawnDamagePopup(x, y, amount) {
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = `-${amount}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        this.stageEl.appendChild(popup);

        setTimeout(() => popup.remove(), 800);
    }

    spawnDamageMiss(x, y) {
        const popup = document.createElement('div');
        popup.className = 'damage-popup damage-miss';
        popup.textContent = 'بەتاڵ (Miss)';
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        this.stageEl.appendChild(popup);

        setTimeout(() => popup.remove(), 700);
    }

    spawnHitSparks(x, y) {
        const spark = document.createElement('div');
        spark.className = 'hit-spark';
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        this.stageEl.appendChild(spark);

        setTimeout(() => spark.remove(), 400);
    }

    spawnCocaColaCrash(worldX, worldY, cfg) {
        const bossContainer = document.getElementById('game-boss-container');
        const physics = window.physicsEngine;
        if (!bossContainer || !physics) return;
        const scale = physics.baseScale || 1;
        const splash = document.createElement('img');
        splash.src = cfg.crashImage;
        splash.className = 'game-coca-cola-crash';
        splash.alt = 'Coca Cola crash';
        splash.style.left = `${160 + (worldX - physics.x) / scale}px`;
        splash.style.top = `${200 + (worldY - physics.y) / scale}px`;
        bossContainer.appendChild(splash);
        setTimeout(() => {
            if (splash.parentElement) splash.remove();
        }, 1800);
    }

    // =========================================================================
    // HEAD EQUIPMENT FALLING & PHYSICS ENGINE
    // =========================================================================

    checkHeadGearDetachment() {
        if (!this.running) return;
        if (window.configManager && !window.configManager.isHeadGearFallingEnabled()) return;
        if (this.fallenGear && this.fallenGear.active) return;

        // Check if character actually has head equipment equipped
        const currentGear = (window.characterModel && window.characterModel.state) ? window.characterModel.state.head_enquipments : null;
        if (!currentGear || currentGear === 'none') {
            this.headGearHitCount = 0;
            return;
        }

        // Avoid counting simultaneous sub-bullet hits from a single shotgun blast as multiple hits
        const now = performance.now();
        if (this.lastHeadHitRegisterTime && (now - this.lastHeadHitRegisterTime < 60)) {
            return;
        }
        this.lastHeadHitRegisterTime = now;

        this.headGearHitCount = (this.headGearHitCount || 0) + 1;
        if (this.headGearHitCount >= 10) {
            this.detachHeadGear();
        }
    }

    detachHeadGear() {
        if (!this.running || (this.fallenGear && this.fallenGear.active)) return;
        if (!this.stageEl || !this.bossEl) return;

        const gearPartEl = this.bossEl.querySelector('.mv-part-head_enquipments');
        if (!gearPartEl) return;

        const stageRect = this.stageEl.getBoundingClientRect();
        const imgEl = gearPartEl.querySelector('img');
        const targetRect = (imgEl && imgEl.getBoundingClientRect().width > 0) ? imgEl.getBoundingClientRect() : gearPartEl.getBoundingClientRect();
        
        let startX = (targetRect.left + targetRect.width / 2) - stageRect.left;
        let startY = (targetRect.top + targetRect.height / 2) - stageRect.top;

        if (isNaN(startX) || startX <= 0) {
            const headPos = this.getHeadTargetPosition();
            startX = headPos ? headPos.x : (this.stageEl.clientWidth / 2);
            startY = headPos ? headPos.y : (this.stageEl.clientHeight / 2);
        }

        // Hide gear on Mama Vana
        gearPartEl.style.visibility = 'hidden';

        // Direction: if hit from right, pushDirection is -1 (throws to left); if hit from left, pushDirection is 1 (throws to right)
        const dir = (window.physicsEngine && window.physicsEngine.lastHitDirection !== undefined) ? window.physicsEngine.lastHitDirection : -1;
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;

        // Create detached actor element
        const actorEl = document.createElement('div');
        actorEl.className = 'game-fallen-gear-actor';
        actorEl.style.left = `${startX}px`;
        actorEl.style.top = `${startY}px`;
        actorEl.style.transform = `translate(-50%, -50%) rotate(0deg) scale(${bScale})`;
        actorEl.innerHTML = gearPartEl.innerHTML;
        this.stageEl.appendChild(actorEl);

        // Sound & FX
        if (window.soundEngine) {
            window.soundEngine.playBonk();
        }
        this.spawnHitSparks(startX, startY);

        // Mama Vana reaction quote
        const quotes = [
            "ئاخ! کڵاوەکەم فڕی!",
            "وەی کڵاوەکەم کەوتە خوارەوە!",
            "کڵاوەکەم بۆ بێنەوە!"
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        this.showSpeechBubble(quote, 2200);
        if (window.characterModel) {
            window.characterModel.startTalking(1800, 100);
        }

        const session = {
            active: true,
            actorEl: actorEl,
            x: startX,
            y: startY,
            scale: bScale,
            vx: dir * (320 + Math.random() * 80),
            vy: -(380 + Math.random() * 100),
            angle: 0,
            angularVelocity: dir * (380 + Math.random() * 140),
            isDragging: false,
            hasBeenGrabbed: false,
            localGrabX: 0,
            localGrabY: 0,
            grabWorldX: startX,
            grabWorldY: startY,
            lastDragX: startX,
            lastDragY: startY,
            pointerHistory: [],
            lastTime: performance.now(),
            animFrameId: null,
            cleanupListeners: null
        };
        this.fallenGear = session;

        // Drag & Throw interaction: the grab location becomes the center of the grab
        const onPointerDown = (e) => {
            if (!session.active) return;
            const hatImg = session.actorEl.querySelector('img');
            const hatRect = hatImg ? hatImg.getBoundingClientRect() : session.actorEl.getBoundingClientRect();
            if (e.clientX < hatRect.left || e.clientX > hatRect.right || e.clientY < hatRect.top || e.clientY > hatRect.bottom) return;
            e.preventDefault();
            e.stopPropagation();
            session.hasBeenGrabbed = true;
            session.isDragging = true;
            session.actorEl.classList.add('dragging');

            const rect = this.stageEl.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            session.grabWorldX = px;
            session.grabWorldY = py;
            session.lastDragX = px;
            session.lastDragY = py;

            // Calculate grab offset relative to object center in object local frame
            const rad = (session.angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dx = px - session.x;
            const dy = py - session.y;

            session.localGrabX = dx * cos + dy * sin;
            session.localGrabY = -dx * sin + dy * cos;

            session.pointerHistory = [{ x: px, y: py, time: performance.now() }];

            if (session.actorEl.setPointerCapture && e.pointerId !== undefined) {
                try { session.actorEl.setPointerCapture(e.pointerId); } catch (_) {}
            }
        };

        const onPointerMove = (e) => {
            if (!session.active || !session.isDragging) return;
            e.preventDefault();
            e.stopPropagation();

            const rect = this.stageEl.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            session.grabWorldX = px;
            session.grabWorldY = py;

            const now = performance.now();
            session.pointerHistory.push({ x: px, y: py, time: now });
            if (session.pointerHistory.length > 5) session.pointerHistory.shift();

            const headPos = this.getHeadTargetPosition();
            if (headPos) {
                const dist = Math.hypot(session.x - headPos.x, session.y - headPos.y);
                if (dist < 85) {
                    session.actorEl.classList.add('near-head');
                } else {
                    session.actorEl.classList.remove('near-head');
                }

                if (dist < 55) {
                    this.snapHeadGearBack();
                    return;
                }
            }
        };

        const onPointerUp = (e) => {
            if (!session.active || !session.isDragging) return;
            session.isDragging = false;
            session.actorEl.classList.remove('dragging');

            if (session.actorEl.releasePointerCapture && e.pointerId !== undefined) {
                try { session.actorEl.releasePointerCapture(e.pointerId); } catch (_) {}
            }

            const headPos = this.getHeadTargetPosition();
            if (headPos) {
                const dist = Math.hypot(session.x - headPos.x, session.y - headPos.y);
                if (dist < 85) {
                    this.snapHeadGearBack();
                    return;
                }
            }

            // Throw physics from drag release
            if (session.pointerHistory && session.pointerHistory.length >= 2) {
                const pFirst = session.pointerHistory[0];
                const pLast = session.pointerHistory[session.pointerHistory.length - 1];
                const dtThrow = Math.max(0.015, (pLast.time - pFirst.time) / 1000);
                session.vx = Math.max(-1400, Math.min(1400, (pLast.x - pFirst.x) / dtThrow));
                session.vy = Math.max(-1400, Math.min(1400, (pLast.y - pFirst.y) / dtThrow));
                session.angularVelocity = (session.angularVelocity || 0) * 0.4 + (session.vx * 0.35);
            }
        };

        actorEl.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        session.cleanupListeners = () => {
            actorEl.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        // Physics tick loop
        const physicsLoop = (now) => {
            if (!session.active) return;
            const dt = Math.min(0.033, (now - session.lastTime) / 1000);
            session.lastTime = now;

            if (!session.isDragging) {
                // Heavier gravity
                const GRAVITY = 2500;
                session.vy += GRAVITY * dt;
                session.x += session.vx * dt;
                session.y += session.vy * dt;
                session.angle += session.angularVelocity * dt;
                session.angularVelocity *= 0.985;

                const stageW = this.stageEl.clientWidth;
                const stageH = this.stageEl.clientHeight;
                const floorY = stageH - 55;
                const minX = 35;
                const maxX = stageW - 35;

                // Floor collision & bounce (silent: no wall/floor hit sound)
                if (session.y >= floorY) {
                    session.y = floorY;
                    if (Math.abs(session.vy) > 75) {
                        session.vy = -session.vy * 0.32;
                        session.vx = session.vx * 0.65;
                        session.angularVelocity = session.angularVelocity * 0.55;
                    } else {
                        session.vy = 0;
                        session.vx = session.vx * 0.78;
                        if (Math.abs(session.vx) < 5) session.vx = 0;
                        session.angularVelocity = session.angularVelocity * 0.75;
                    }
                }

                // Left/Right wall collision (silent)
                if (session.x <= minX) {
                    session.x = minX;
                    session.vx = -session.vx * 0.5;
                    session.angularVelocity = -session.angularVelocity * 0.5;
                } else if (session.x >= maxX) {
                    session.x = maxX;
                    session.vx = -session.vx * 0.5;
                    session.angularVelocity = -session.angularVelocity * 0.5;
                }

                session.actorEl.style.left = `${session.x}px`;
                session.actorEl.style.top = `${session.y}px`;
                session.actorEl.style.transform = `translate(-50%, -50%) rotate(${session.angle}deg) scale(${session.scale || 1.0})`;
            } else {
                // Dragging mode: the location you grabbed is the center of the grab
                const dragVx = (session.grabWorldX - session.lastDragX) / Math.max(0.001, dt);
                const dragVy = (session.grabWorldY - session.lastDragY) / Math.max(0.001, dt);
                session.lastDragX = session.grabWorldX;
                session.lastDragY = session.grabWorldY;

                const armLen = Math.hypot(session.localGrabX, session.localGrabY);
                if (armLen > 6) {
                    // Pendulum gravity pulls the center of mass below the grab point
                    const phiCom = Math.atan2(-session.localGrabY, -session.localGrabX);
                    const comWorldAngle = (session.angle * Math.PI / 180) + phiCom;

                    // Restoring torque toward straight down (+Y)
                    const tauGravity = -14.0 * Math.sin(comWorldAngle - Math.PI / 2);
                    // Motion torque from moving the hand
                    const tauMotion = (-dragVx * Math.cos(comWorldAngle) - dragVy * Math.sin(comWorldAngle)) * 0.005;

                    session.angularVelocity = (session.angularVelocity + (tauGravity + tauMotion) * 60 * dt) * 0.88;
                    session.angle += session.angularVelocity * (180 / Math.PI) * dt;
                } else {
                    // Grabbed near the center: slight tilt with drag velocity
                    session.angle = Math.max(-30, Math.min(30, dragVx * 0.04));
                    session.angularVelocity = 0;
                }

                // Place object center so the exact grab location is at the pointer
                const rad = (session.angle * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                session.x = session.grabWorldX - (session.localGrabX * cos - session.localGrabY * sin);
                session.y = session.grabWorldY - (session.localGrabX * sin + session.localGrabY * cos);

                session.actorEl.style.left = `${session.x}px`;
                session.actorEl.style.top = `${session.y}px`;
                session.actorEl.style.transform = `translate(-50%, -50%) rotate(${session.angle}deg) scale(${session.scale || 1.0})`;
            }

            session.animFrameId = requestAnimationFrame(physicsLoop);
        };

        session.animFrameId = requestAnimationFrame(physicsLoop);
    }

    getHeadTargetPosition() {
        if (!this.stageEl || !this.bossEl) return null;
        const stageRect = this.stageEl.getBoundingClientRect();
        const gearPartEl = this.bossEl.querySelector('.mv-part-head_enquipments');
        if (gearPartEl) {
            const imgEl = gearPartEl.querySelector('img');
            const rect = (imgEl && imgEl.getBoundingClientRect().width > 0) ? imgEl.getBoundingClientRect() : gearPartEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                return {
                    x: (rect.left + rect.width / 2) - stageRect.left,
                    y: (rect.top + rect.height / 2) - stageRect.top
                };
            }
        }
        const bScale = (window.physicsEngine && window.physicsEngine.baseScale) ? window.physicsEngine.baseScale : 1.0;
        const bossX = (window.physicsEngine ? window.physicsEngine.x : (stageRect.width / 2));
        const bossY = (window.physicsEngine ? window.physicsEngine.y : (stageRect.height / 2));
        return {
            x: bossX,
            y: bossY - (130 * bScale)
        };
    }

    snapHeadGearBack() {
        if (!this.fallenGear) return;
        const session = this.fallenGear;
        session.active = false;
        this.fallenGear = null;

        if (session.animFrameId) {
            cancelAnimationFrame(session.animFrameId);
            session.animFrameId = null;
        }
        if (session.cleanupListeners) {
            session.cleanupListeners();
            session.cleanupListeners = null;
        }

        const headPos = this.getHeadTargetPosition();
        const targetX = headPos ? headPos.x : session.x;
        const targetY = headPos ? headPos.y : session.y;

        if (session.actorEl) {
            session.actorEl.classList.remove('near-head', 'dragging');
            session.actorEl.classList.add('snapping');
            session.actorEl.style.transition = 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            session.actorEl.style.left = `${targetX}px`;
            session.actorEl.style.top = `${targetY}px`;
            session.actorEl.style.transform = `translate(-50%, -50%) rotate(0deg) scale(${session.scale || 1.0})`;
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playDiamond === 'function') {
                window.soundEngine.playDiamond();
            } else {
                window.soundEngine.playWallHit();
            }
        }

        this.spawnHitSparks(targetX, targetY);

        setTimeout(() => {
            if (session.actorEl && session.actorEl.parentElement) {
                session.actorEl.remove();
            }
            if (this.bossEl) {
                const gearPartEl = this.bossEl.querySelector('.mv-part-head_enquipments');
                if (gearPartEl) {
                    gearPartEl.style.visibility = '';
                }
            }
            this.headGearHitCount = 0;

            const thankQuotes = [
                "دەستت خۆش بێت! کڵاوەکەم گەڕایەوە! ✨",
                "سوپاس بۆ هێنانەوەی کڵاوەکەم!",
                "ئاوا باشە! ئێستا جوانم!"
            ];
            const quote = thankQuotes[Math.floor(Math.random() * thankQuotes.length)];
            this.showSpeechBubble(quote, 2000);
            if (window.characterModel) {
                window.characterModel.startTalking(1800, 100);
            }
        }, 190);
    }

    resetFallenGear() {
        this.headGearHitCount = 0;
        if (this.fallenGear) {
            this.fallenGear.active = false;
            if (this.fallenGear.animFrameId) {
                cancelAnimationFrame(this.fallenGear.animFrameId);
                this.fallenGear.animFrameId = null;
            }
            if (this.fallenGear.cleanupListeners) {
                this.fallenGear.cleanupListeners();
                this.fallenGear.cleanupListeners = null;
            }
            if (this.fallenGear.actorEl && this.fallenGear.actorEl.parentElement) {
                this.fallenGear.actorEl.remove();
            }
            this.fallenGear = null;
        }
        if (this.bossEl) {
            const gearPartEl = this.bossEl.querySelector('.mv-part-head_enquipments');
            if (gearPartEl) {
                gearPartEl.style.visibility = '';
            }
        }
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;
        const santaFrozen = window.legendaryEffects?._santaWeather?.frozen;

        if (!this.fatalityActive && !santaFrozen) window.physicsEngine.update(dt);

        const safeDt = Math.min(0.05, dt || 0.016);
        if (!santaFrozen) {
            this.updateSpidersPhysics(safeDt);
            this.updateFlowersPhysics(safeDt);
        }

        if (this.speechBubbleEl && this.speechBubbleEl.classList.contains('visible')) {
            const bossX = window.physicsEngine.x;
            const bossY = window.physicsEngine.y;
            this.speechBubbleEl.style.left = `${bossX}px`;
            this.speechBubbleEl.style.top = `${bossY - 260}px`;
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.gameEngine = new GameEngine();
