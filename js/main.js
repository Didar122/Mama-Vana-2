/**
 * Mama Vana - Main App Orchestrator, Screen Navigation & Modals
 */

class GameApp {
    constructor() {
        this.currentScreen = 'loading';
        this.screens = {};
    }

    init() {
        // Collect all screens
        this.screens = {
            loading: document.getElementById('screen-loading'),
            menu: document.getElementById('screen-menu'),
            customizer: document.getElementById('screen-customizer'),
            game: document.getElementById('screen-game'),
            dev_editor: document.getElementById('screen-dev-editor')
        };

        // Initialize audio engine on any first user gesture
        const initAudio = () => {
            window.soundEngine.init();
            if (!window.soundEngine.radioAudio) window.soundEngine.playRadioTrack();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };
        window.addEventListener('click', initAudio);
        window.addEventListener('touchstart', initAudio);

        // Initialize dev editor events and tools immediately
        if (window.devEditor) {
            window.devEditor.init();
        }

        this.bindMenuButtons();
        this.bindFullscreenButtons();
        this.bindRadioControls();
        this.bindModals();
        this.bindAgeMode();       // age-mode popup + settings toggle
        this.startAssetPreloading();
    }

    showScreen(screenId) {
        if (!this.screens[screenId]) return;
        const previousScreen = this.currentScreen;
        this.previousScreen = previousScreen;

        // Hide all screens
        Object.values(this.screens).forEach(scr => {
            if (scr) scr.classList.remove('active');
        });

        // Show target screen
        this.screens[screenId].classList.add('active');
        this.currentScreen = screenId;

        // Dev visibility check
        if (window.devEditor) {
            window.devEditor.applyDevVisibility();
        }

        // Clean up any gameplay fallen gear when leaving game screen
        if (screenId !== 'game' && window.gameEngine) {
            window.gameEngine.resetFallenGear();
        }

        // Trigger lifecycle hooks
        if (screenId === 'customizer') {
            window.configManager.notifyEconomyChange();
            window.characterCustomizer.init();
                        window.soundEngine.playRandomAmbientVoice();
                        window.soundEngine.startAmbientVoiceScheduler();
            // Pause effect when opening customizer
            if (window.legendaryEffects) window.legendaryEffects.pauseEffect();
        } else if (screenId === 'game') {
            window.gameEngine.init();
            window.gameEngine.start(previousScreen === 'customizer');
            // Note: effects are resumed inside gameEngine.start() via legendaryEffects.resumeEffect()
        } else if (screenId === 'dev_editor') {
            window.devEditor.init();
            window.devEditor.open();
            if (window.legendaryEffects) window.legendaryEffects.pauseEffect();
        } else if (screenId === 'menu') {
            window.configManager.notifyEconomyChange();
            window.configManager.applyAgeBadge();
            if (window.legendaryEffects) window.legendaryEffects.pauseEffect();
            const menuPreview = document.getElementById('menu-character-preview');
            if (menuPreview) {
                window.characterModel.render(menuPreview);
            }
        }
    }

    bindMenuButtons() {
        const btnPlay = document.getElementById('btn-menu-play');
        if (btnPlay) {
            btnPlay.onclick = () => {
                window.soundEngine.playButton();
                this.showScreen('game');
            };
        }

        const btnCustomize = document.getElementById('btn-menu-customize');
        if (btnCustomize) {
            btnCustomize.onclick = () => {
                window.soundEngine.playButton();
                this.showScreen('customizer');
            };
        }

        const btnSettings = document.getElementById('btn-menu-settings');
        if (btnSettings) {
            btnSettings.onclick = () => {
                window.soundEngine.playButton();
                this.openSettingsModal();
            };
        }

        const btnAbout = document.getElementById('btn-menu-about');
        if (btnAbout) {
            btnAbout.onclick = () => {
                window.soundEngine.playButton();
                this.openAboutModal();
            };
        }

        // Dev Studio trigger buttons
        const handleOpenDev = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            window.soundEngine.playButton();
            if (window.gameEngine && window.gameEngine.running) {
                window.gameEngine.stop();
            }
            this.showScreen('dev_editor');
        };

        const devBtnCorner = document.getElementById('btn-menu-dev-corner');
        if (devBtnCorner) {
            devBtnCorner.onclick = handleOpenDev;
        }

        const devBtnGame = document.getElementById('btn-game-dev');
        if (devBtnGame) {
            devBtnGame.onclick = handleOpenDev;
        }

        document.querySelectorAll('.btn-open-dev-editor').forEach(btn => {
            btn.onclick = handleOpenDev;
        });
    }

    bindFullscreenButtons() {
        const buttons = [
            document.getElementById('btn-menu-fullscreen'),
            document.getElementById('btn-game-fullscreen')
        ].filter(Boolean);

        const updateButtons = () => {
            const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
            buttons.forEach(button => {
                const icon = button.querySelector('.fullscreen-icon');
                button.title = isFullscreen ? 'داخستنی شاشەی تەواو' : 'کردنەوەی شاشەی تەواو';
                button.setAttribute('aria-label', button.title);
                if (icon) {
                    icon.src = isFullscreen ? 'assets/icons/exit-fullscreen.svg' : 'assets/icons/fullscreen.svg';
                }
            });
        };

        const toggleFullscreen = async () => {
            window.soundEngine.playButton();
            try {
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    if (document.exitFullscreen) await document.exitFullscreen();
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                } else if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                }
            } catch (error) {
                console.warn('Fullscreen mode could not be changed.', error);
            }
            updateButtons();
        };

        buttons.forEach(button => {
            button.onclick = toggleFullscreen;
        });
        document.addEventListener('fullscreenchange', updateButtons);
        document.addEventListener('webkitfullscreenchange', updateButtons);
        updateButtons();
    }

    bindRadioControls() {
        document.querySelectorAll('[data-radio-widget]').forEach(widget => {
            widget.querySelectorAll('[data-radio-action]').forEach(button => {
                let holdTimer = null;
                let holdStarted = false;
                const stopHolding = () => {
                    if (holdTimer) clearInterval(holdTimer);
                    holdTimer = null;
                    if (holdStarted) {
                        button.dataset.radioHold = 'true';
                        window.setTimeout(() => delete button.dataset.radioHold, 0);
                    }
                };

                button.onpointerdown = event => {
                    event.preventDefault();
                    holdStarted = false;
                    const action = button.dataset.radioAction;
                    if (action !== 'previous' && action !== 'next') return;
                    const direction = action === 'previous' ? -1 : 1;
                    holdTimer = window.setTimeout(() => {
                        holdStarted = true;
                        holdTimer = window.setInterval(() => window.soundEngine.seekRadio(direction * 5), 90);
                    }, 350);
                };
                button.onpointerup = stopHolding;
                button.onpointercancel = stopHolding;
                button.onpointerleave = stopHolding;
                button.onclick = () => {
                    if (button.dataset.radioHold === 'true') return;
                    window.soundEngine.playButton();
                    const action = button.dataset.radioAction;
                    if (action === 'toggle') window.soundEngine.toggleRadio();
                    if (action === 'previous') window.soundEngine.playRadioTrack(window.soundEngine.radioTrackIndex - 1, true);
                    if (action === 'next') window.soundEngine.playRadioTrack(window.soundEngine.radioTrackIndex + 1, true);
                };
            });
            const antenna = widget.querySelector('.radio-antenna');
            if (antenna) {
                let startX = 0;
                let startAngle = 22;
                antenna.onpointerdown = event => {
                    event.preventDefault();
                    startX = event.clientX;
                    startAngle = parseFloat(getComputedStyle(antenna).getPropertyValue('--antenna-angle')) || 22;
                    antenna.setPointerCapture(event.pointerId);
                    antenna.classList.add('is-dragging');
                };
                antenna.onpointermove = event => {
                    if (!antenna.hasPointerCapture(event.pointerId)) return;
                    const angle = Math.max(-35, Math.min(75, startAngle + (event.clientX - startX) * 0.45));
                    antenna.style.setProperty('--antenna-angle', `${angle}deg`);
                    window.soundEngine.playRadioTuning();
                };
                antenna.onpointerup = event => {
                    antenna.releasePointerCapture(event.pointerId);
                    antenna.classList.remove('is-dragging');
                };
                antenna.onpointercancel = antenna.onpointerup;
            }
            const volume = widget.querySelector('[data-radio-volume]');
            if (volume) {
                volume.value = window.soundEngine.radioVolume;
                volume.oninput = event => window.soundEngine.setRadioVolume(event.target.value);
            }
        });
        window.soundEngine.updateRadioWidgets();
        window.soundEngine.playRadioTrack();
    }

    bindModals() {
        // Shop Modal
        const btnCloseShop = document.getElementById('btn-close-shop');
        if (btnCloseShop) {
            btnCloseShop.onclick = () => {
                window.soundEngine.playButton();
                this.closeShopModal();
            };
        }

        // Settings Modal
        const btnCloseSettings = document.getElementById('btn-close-settings');
        if (btnCloseSettings) {
            btnCloseSettings.onclick = () => {
                window.soundEngine.playButton();
                document.getElementById('modal-settings').classList.remove('active');
                // Resume effects when settings closed (if on game screen)
                if (window.gameApp && window.gameApp.currentScreen === 'game') {
                    if (window.legendaryEffects) window.legendaryEffects.resumeEffect();
                }
            };
        }

        const toggleSound = document.getElementById('settings-toggle-sound');
        if (toggleSound) {
            toggleSound.checked = !window.soundEngine.muted;
            toggleSound.onchange = (e) => {
                window.soundEngine.setMute(!e.target.checked);
            };
        }

        const toggleAmbient = document.getElementById('settings-toggle-ambient');
        if (toggleAmbient) {
            toggleAmbient.checked = !window.soundEngine.ambientMuted;
            toggleAmbient.onchange = (e) => {
                window.soundEngine.setAmbientMute(!e.target.checked);
            };
        }

        const toggleRadio = document.getElementById('settings-toggle-radio');
        if (toggleRadio) {
            toggleRadio.checked = window.soundEngine.radioEnabled;
            toggleRadio.onchange = (e) => {
                window.soundEngine.playButton();
                window.soundEngine.setRadioEnabled(e.target.checked);
            };
        }

        const toggleGearFall = document.getElementById('settings-toggle-gear-fall');
        if (toggleGearFall) {
            toggleGearFall.checked = window.configManager ? window.configManager.isHeadGearFallingEnabled() : true;
            toggleGearFall.onchange = (e) => {
                window.soundEngine.playButton();
                if (window.configManager) {
                    window.configManager.setHeadGearFallingEnabled(e.target.checked);
                }
                if (!e.target.checked && window.gameEngine) {
                    window.gameEngine.resetFallenGear();
                }
            };
        }

        const sliderVol = document.getElementById('settings-slider-volume');
        if (sliderVol) {
            sliderVol.value = window.soundEngine.sfxVolume;
            sliderVol.oninput = (e) => {
                window.soundEngine.setVolume(e.target.value);
            };
        }

        const btnResetData = document.getElementById('btn-settings-reset-data');
        if (btnResetData) {
            btnResetData.onclick = () => {
                if (confirm('دڵنیایت لە سڕینەوەی تەواوی تۆمارەکان و دەستپێکردنەوە لە سەرەتاوە؟')) {
                    localStorage.clear();
                    location.reload();
                }
            };
        }

        // About Modal
        const btnCloseAbout = document.getElementById('btn-close-about');
        if (btnCloseAbout) {
            btnCloseAbout.onclick = () => {
                window.soundEngine.playButton();
                document.getElementById('modal-about').classList.remove('active');
                // Resume effects when about closed (if on game screen)
                if (window.gameApp && window.gameApp.currentScreen === 'game') {
                    if (window.legendaryEffects) window.legendaryEffects.resumeEffect();
                }
            };
        }
    }

    // =========================================================================
    // Age-Mode Popup + Settings Toggle
    // =========================================================================

    /** Shows the first-launch age popup if the player hasn't chosen yet. */
    showAgePromptIfNeeded() {
        if (window.configManager.wasAgePropromptShown()) return;
        const overlay = document.getElementById('modal-age-prompt');
        if (overlay) overlay.classList.add('active');
    }

    bindAgeMode() {
        const overlay   = document.getElementById('modal-age-prompt');
        const btnAll    = document.getElementById('btn-age-all');
        const btnAdult  = document.getElementById('btn-age-adult');
        const toggle    = document.getElementById('settings-toggle-adult');

        const chooseMode = (mode) => {
            window.soundEngine.playButton();
            window.configManager.saveAgeMode(mode);
            window.configManager.markAgePromptShown();
            // Sync settings checkbox
            if (toggle) toggle.checked = (mode === '+18');
            // Close prompt
            if (overlay) overlay.classList.remove('active');
        };

        if (btnAll)   btnAll.onclick   = () => chooseMode('all_ages');
        if (btnAdult) btnAdult.onclick = () => chooseMode('+18');

        // Settings toggle — flips mode without re-showing prompt
        if (toggle) {
            // Initialise to current saved state
            toggle.checked = window.configManager.isAdultMode();
            toggle.onchange = (e) => {
                window.soundEngine.playButton();
                const newMode = e.target.checked ? '+18' : 'all_ages';
                window.configManager.saveAgeMode(newMode);
                window.configManager.markAgePromptShown();
            };
        }
    }

    openShopModal() {
        const modal = document.getElementById('modal-shop');
        if (!modal) return;

        // The modal captures pointer input, so never leave the gameplay drag state active behind it.
        if (window.gameEngine) {
            window.gameEngine.resetFallenGear();
            if (window.gameEngine.running) {
                window.gameEngine.cancelPointerInteraction();
            }
        }
        // Pause legendary effects while shop is open
        if (window.legendaryEffects) window.legendaryEffects.pauseEffect();

        window.configManager.notifyEconomyChange();
        this.renderShopBackgrounds();
        modal.classList.add('active');
    }

    closeShopModal() {
        const modal = document.getElementById('modal-shop');
        if (modal) modal.classList.remove('active');

        // Re-read the visible stage dimensions after the modal is gone and redraw the current pose.
        if (window.gameEngine && window.gameEngine.running && window.physicsEngine) {
            window.physicsEngine.updateBounds();
            window.physicsEngine.applyTransform();
        }
        // Resume legendary effects when shop is closed (if on game screen)
        if (window.gameApp && window.gameApp.currentScreen === 'game') {
            if (window.legendaryEffects) window.legendaryEffects.resumeEffect();
        }
    }

    renderShopBackgrounds() {
        const grid = document.getElementById('shop-backgrounds-grid');
        if (!grid) return;

        grid.innerHTML = '';
        AVAILABLE_BACKGROUNDS.forEach(bg => {
            const isUnlocked = window.configManager.isUnlocked(`bg_${bg.file}`) || bg.priceCoins === 0;
            const isEquipped = window.configManager.activeBackground === bg.file;

            const card = document.createElement('div');
            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;

            let actionBtnHtml = '';
            if (isEquipped) {
                actionBtnHtml = `<button class="btn-cartoon btn-green shop-btn-action" disabled>✔ چالاککراوە</button>`;
            } else if (isUnlocked) {
                actionBtnHtml = `<button class="btn-cartoon btn-blue shop-btn-action" onclick="window.gameApp.equipBackground('${bg.file}')">هەڵبژاردن</button>`;
            } else {
                let priceText = '';
                if (bg.priceDiamonds > 0) priceText += `💎 ${bg.priceDiamonds} `;
                if (bg.priceCoins > 0) priceText += `💰 ${bg.priceCoins}`;
                actionBtnHtml = `<button class="btn-cartoon btn-gold shop-btn-action" onclick="window.gameApp.buyBackground('${bg.file}', ${bg.priceCoins}, ${bg.priceDiamonds})">کڕین (${priceText})</button>`;
            }

            card.innerHTML = `
                <div class="shop-thumb-wrapper">
                    <img src="backgrounds/${encodeURI(bg.file)}" alt="${bg.name}">
                </div>
                <div class="shop-item-title">${bg.name}</div>
                ${actionBtnHtml}
            `;

            grid.appendChild(card);
        });
    }

    equipBackground(file) {
        window.soundEngine.playButton();
        window.configManager.setBackground(file);
        this.renderShopBackgrounds();
    }

    buyBackground(file, coins, diamonds) {
        if (window.configManager.coins >= coins && window.configManager.diamonds >= diamonds) {
            window.soundEngine.playDiamond();
            window.configManager.saveCoins(window.configManager.coins - coins);
            window.configManager.saveDiamonds(window.configManager.diamonds - diamonds);
            window.configManager.unlockItem(`bg_${file}`);
            window.configManager.setBackground(file);
            window.configManager.notifyEconomyChange();
            this.renderShopBackgrounds();
        } else {
            window.soundEngine.playBonk();
            alert('پارە یان ئەڵماسی پێویستت نییە! لێی بدە بۆ ئەوەی سکەی زیاتر کۆبکەیتەوە.');
        }
    }

    openSettingsModal() {
        const modal = document.getElementById('modal-settings');
        if (modal) {
            if (window.gameEngine) {
                window.gameEngine.resetFallenGear();
                if (window.gameEngine.running) {
                    window.gameEngine.cancelPointerInteraction();
                }
            }
            const toggleGearFall = document.getElementById('settings-toggle-gear-fall');
            if (toggleGearFall && window.configManager) {
                toggleGearFall.checked = window.configManager.isHeadGearFallingEnabled();
            }
            // Pause effects while settings are open
            if (window.legendaryEffects) window.legendaryEffects.pauseEffect();
            modal.classList.add('active');
        }
    }

    openAboutModal() {
        const modal = document.getElementById('modal-about');
        if (modal) {
            if (window.gameEngine) window.gameEngine.resetFallenGear();
            // Pause effects while about modal is open
            if (window.legendaryEffects) window.legendaryEffects.pauseEffect();
            modal.classList.add('active');
        }
    }

    startAssetPreloading() {
        const loadingBar = document.getElementById('loading-bar-fill');
        const loadingText = document.getElementById('loading-percentage');
        const loadingStatus = document.getElementById('loading-status-text');

        const funPhrases = [
            "ئامادەکردنی بەشەکانی جەستەی ماما ڤانە...",
            "هێنانی قژ و سمێڵ و چاوەکان...",
            "کۆکردنەوەی چەکەکان و زللـەکان...",
            "تۆمارکردنی قسە خۆشەکانی ماما ڤانە...",
            "تەواو بوو! خەریکە دەست پێ دەکەین..."
        ];

        let phraseIndex = 0;
        const phraseTimer = setInterval(() => {
            phraseIndex = (phraseIndex + 1) % funPhrases.length;
            if (loadingStatus) loadingStatus.textContent = funPhrases[phraseIndex];
        }, 800);

        window.assetManager.preloadAll(
            (loaded, total, percent) => {
                if (loadingBar) loadingBar.style.width = `${percent}%`;
                if (loadingText) loadingText.textContent = `${percent}%`;
            },
            () => {
                clearInterval(phraseTimer);
                if (loadingStatus) loadingStatus.textContent = 'بەخێربێیت بۆ یاری ماما ڤانە! ✨';
                if (loadingBar) loadingBar.style.width = '100%';
                if (loadingText) loadingText.textContent = '100%';

                setTimeout(() => {
                    this.showScreen('menu');
                    this.showAgePromptIfNeeded();
                }, 600);
            }
        );
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
    window.gameApp.init();
});
