/**
 * Mama Vana - Visual Dev Position, Anchor, Mirror & Cute CUT Multi-Track Studio
 */

class DevEditor {
    constructor() {
        this.active = false;
        this.studioMode = 'body'; // 'body' or 'attacks'

        // Body part editing state
        this.selectedCategory = 'haires';
        this.selectedItem = null;
        this.applyScope = 'specific'; // 'specific' or 'category'
        this.showBlueprint = true;

        // Cute CUT Attack editing state
        this.selectedAttackId = 'slap';
        this.selectedTrackIndex = 0;
        this.isMirrorPreview = false;
        this.showHitboxOverlay = false;
        this.playMouthOnTest = false; // Strictly off by default
        this.attackAnimTimer = null;
        this.scrubProgress = 0;
        this.totalTimelineMs = 1500; // 1.5s total timeline length

        // Interactive stage gizmo dragging
        this.dragMode = null; // 'body_move' | 'box_move' | 'handle_resize' | 'handle_rotate' | 'clip_trim_left' | 'clip_trim_right' | 'clip_slide'
        this.dragHandleDir = null;
        this.dragStart = { x: 0, y: 0 };
        this.initialTransform = {};
        this.activeClipChannel = null;

        // Sound timing editing state
        this.selectedSoundKey = 'slap_sound';

        // Weapons Studio (Shooting, Swords, Special) editing state
        this.selectedWeaponCategory = 'shooting'; // 'shooting' | 'swords' | 'special'
        this.selectedShootingWeaponId = 'akm';
        this.selectedSwordWeaponId = 'katana';
        this.selectedSpecialWeaponId = 'shuriken';
        this.selectedShootingFrame = 'frame1.png';

        // Export modal active tab
        this.exportTab = 'item'; // 'item' | 'cat' | 'attack' | 'shooting' | 'swords' | 'special' | 'frame' | 'mouth' | 'sound' | 'all'
    }

    init() {
        this.stageContainer = document.getElementById('dev-editor-stage');
        this.bodyControlsContainer = document.getElementById('dev-controls-body');
        this.attackControlsContainer = document.getElementById('dev-controls-attacks');
        this.shootingControlsContainer = document.getElementById('dev-controls-shooting');
        this.hitboxOverlayEl = document.getElementById('dev-hitbox-overlay');
        this.attackPreviewFxEl = document.getElementById('dev-attack-fx');
        this.transformBoxEl = document.getElementById('cutecut-transform-box');
        this.blueprintGhostEl = document.getElementById('dev-blueprint-ghost');

        this.applyDevVisibility();
        this.bindEvents();
        this.bindCheatEvents();
        this.bindExportTabs();
    }

    applyDevVisibility() {
        const isVisible = window.configManager.isDevStudioVisible();
        const devButtons = document.querySelectorAll('.btn-open-dev-editor, #btn-menu-dev-corner, #btn-game-dev');
        devButtons.forEach(btn => {
            btn.style.display = isVisible ? 'inline-flex' : 'none';
        });
    }

    open() {
        this.active = true;
        if (!this.stageContainer) {
            this.init();
        }

        this.selectedItem = window.characterModel.state[this.selectedCategory];
        this.selectedTrackIndex = 0;

        this.switchMode(this.studioMode);
        this.renderStage();
        this.attachStageListeners();
    }

    close() {
        this.active = false;
        if (this.attackAnimTimer) {
            cancelAnimationFrame(this.attackAnimTimer);
            this.attackAnimTimer = null;
        }
    }

    switchMode(mode) {
        this.studioMode = mode;
        const tabBody = document.getElementById('tab-dev-mode-body');
        const tabAttacks = document.getElementById('tab-dev-mode-attacks');
        const tabShooting = document.getElementById('tab-dev-mode-shooting');
        const tabSounds = document.getElementById('tab-dev-mode-sounds');

        const colBody = document.getElementById('dev-controls-body');
        const colAttacks = document.getElementById('dev-controls-attacks');
        const colShooting = document.getElementById('dev-controls-shooting');
        const colSounds = document.getElementById('dev-controls-sounds');

        if (tabBody) tabBody.classList.toggle('active', mode === 'body');
        if (tabAttacks) tabAttacks.classList.toggle('active', mode === 'attacks');
        if (tabShooting) tabShooting.classList.toggle('active', mode === 'shooting');
        if (tabSounds) tabSounds.classList.toggle('active', mode === 'sounds');

        if (colBody) colBody.style.display = (mode === 'body') ? 'flex' : 'none';
        if (colAttacks) colAttacks.style.display = (mode === 'attacks') ? 'flex' : 'none';
        if (colShooting) colShooting.style.display = (mode === 'shooting') ? 'flex' : 'none';
        if (colSounds) colSounds.style.display = (mode === 'sounds') ? 'flex' : 'none';

        if (this.attackPreviewFxEl) {
            this.attackPreviewFxEl.style.display = (mode === 'attacks' || mode === 'shooting') ? 'block' : 'none';
        }
        if (this.transformBoxEl) {
            this.transformBoxEl.style.display = (mode === 'attacks') ? 'block' : 'none';
        }

        if (mode === 'body') {
            this.renderCategorySelector();
            this.updateBodyControls();
        } else if (mode === 'attacks') {
            this.renderAttackSelector();
            this.renderCuteCutTracksList();
            this.renderCuteCutFramePicker();
            this.updateCuteCutControls();
            this.renderCuteCutStageLayers();
        } else if (mode === 'shooting') {
            this.renderShootingWeaponSelector();
            this.renderShootingFramePicker();
            this.updateShootingControls();
            this.renderShootingStagePreview();
        } else if (mode === 'sounds') {
            this.renderVoiceSelector();
            this.updateSoundTimingControls();
        }
        this.renderStage();
    }

    bindEvents() {
        // Mode switch tabs
        const tabBody = document.getElementById('tab-dev-mode-body');
        const tabAttacks = document.getElementById('tab-dev-mode-attacks');
        const tabShooting = document.getElementById('tab-dev-mode-shooting');
        const tabSounds = document.getElementById('tab-dev-mode-sounds');

        if (tabBody) tabBody.onclick = () => { window.soundEngine.playButton(); this.switchMode('body'); };
        if (tabAttacks) tabAttacks.onclick = () => { window.soundEngine.playButton(); this.switchMode('attacks'); };
        if (tabShooting) tabShooting.onclick = () => { window.soundEngine.playButton(); this.switchMode('shooting'); };
        if (tabSounds) tabSounds.onclick = () => { window.soundEngine.playButton(); this.switchMode('sounds'); };

        this.bindShootingEvents();

        // Blueprint Ghost Toggle
        const toggleBlueprint = document.getElementById('dev-toggle-blueprint');
        if (toggleBlueprint) {
            toggleBlueprint.checked = this.showBlueprint;
            toggleBlueprint.onchange = (e) => {
                this.showBlueprint = e.target.checked;
                if (this.blueprintGhostEl) {
                    this.blueprintGhostEl.style.display = this.showBlueprint ? 'block' : 'none';
                }
            };
        }

        // Live Left Mirror Toggle
        const toggleMirrorPreview = document.getElementById('dev-toggle-mirror-preview');
        if (toggleMirrorPreview) {
            toggleMirrorPreview.checked = this.isMirrorPreview;
            toggleMirrorPreview.onchange = (e) => {
                this.isMirrorPreview = e.target.checked;
                this.renderCuteCutStageLayers();
            };
        }

        // Test Mouth Checkbox (Strictly off unless user checks it)
        const toggleTestMouth = document.getElementById('dev-toggle-test-mouth');
        if (toggleTestMouth) {
            toggleTestMouth.checked = this.playMouthOnTest;
            toggleTestMouth.onchange = (e) => {
                this.playMouthOnTest = e.target.checked;
            };
        }

        // Dev editor button
        document.querySelectorAll('.btn-open-dev-editor, #btn-menu-dev-corner, #btn-game-dev').forEach(btn => {
            btn.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                window.soundEngine.playButton();
                if (window.gameEngine && window.gameEngine.running) {
                    window.gameEngine.stop();
                }
                window.gameApp.showScreen('dev_editor');
            };
        });

        const btnBack = document.getElementById('btn-dev-editor-back');
        if (btnBack) {
            btnBack.onclick = () => {
                window.soundEngine.playButton();
                this.close();
                window.gameApp.showScreen('menu');
            };
        }

        const btnExport = document.getElementById('btn-dev-export');
        if (btnExport) {
            btnExport.onclick = () => {
                this.openExportModal();
            };
        }

        const btnExportAttack = document.getElementById('btn-dev-export-attack');
        if (btnExportAttack) {
            btnExportAttack.onclick = () => {
                this.exportTab = 'attack';
                this.openExportModal();
            };
        }

        const btnReset = document.getElementById('btn-dev-reset');
        if (btnReset) {
            btnReset.onclick = () => {
                if (confirm('دڵنیایت لە گەڕانەوە بۆ ڕێکخستنی سەرەتایی ناو کۆد؟')) {
                    window.configManager.resetAll();
                    if (this.studioMode === 'body') this.updateBodyControls();
                    else this.updateCuteCutControls();
                    this.renderStage();
                    this.showNotification('ڕێکخستنەکان گەڕانەوە بۆ بنەڕەتی کۆد 🔄');
                }
            };
        }

        // Cute CUT Toolbar Buttons
        const btnAddTrack = document.getElementById('btn-cutecut-add-track');
        if (btnAddTrack) btnAddTrack.onclick = () => this.addCuteCutTrack();

        const btnDupTrack = document.getElementById('btn-cutecut-dup-track');
        if (btnDupTrack) btnDupTrack.onclick = () => this.duplicateCuteCutTrack();

        const btnDelTrack = document.getElementById('btn-cutecut-del-track');
        if (btnDelTrack) btnDelTrack.onclick = () => this.deleteCuteCutTrack();

        const btnToggleTrans = document.getElementById('btn-cutecut-toggle-trans');
        if (btnToggleTrans) btnToggleTrans.onclick = () => this.toggleTransitionPanel();

        const btnRot90 = document.getElementById('btn-cutecut-rot90');
        if (btnRot90) btnRot90.onclick = () => this.rotateTrack90();

        const btnFlipH = document.getElementById('btn-cutecut-flip-h');
        if (btnFlipH) btnFlipH.onclick = () => this.flipTrackHorizontal();

        const btnLayerUp = document.getElementById('btn-cutecut-layer-up');
        if (btnLayerUp) btnLayerUp.onclick = () => this.moveTrackZIndex(1);

        const btnLayerDown = document.getElementById('btn-cutecut-layer-down');
        if (btnLayerDown) btnLayerDown.onclick = () => this.moveTrackZIndex(-1);

        // Cute CUT Playback Tests
        const btnPlayAll = document.getElementById('btn-dev-test-attack-all');
        if (btnPlayAll) btnPlayAll.onclick = () => this.playCuteCutAllAnimation(this.isMirrorPreview);

        const btnPlaySingle = document.getElementById('btn-dev-test-attack-single');
        if (btnPlaySingle) btnPlaySingle.onclick = () => this.playCuteCutSingleTrack(this.isMirrorPreview);

        const btnPlayMirror = document.getElementById('btn-dev-test-attack-mirror');
        if (btnPlayMirror) btnPlayMirror.onclick = () => this.playCuteCutAllAnimation(true);

        // Cute CUT Point A / Point B Quick Set Buttons
        const btnSetStartA = document.getElementById('btn-cutecut-set-start-a');
        if (btnSetStartA) btnSetStartA.onclick = () => this.setCuteCutCurrentAsPointA();

        const btnSetEndB = document.getElementById('btn-cutecut-set-end-b');
        if (btnSetEndB) btnSetEndB.onclick = () => this.setCuteCutCurrentAsPointB();

        // Sound test button
        const btnTestSound = document.getElementById('btn-dev-test-sound-voice');
        if (btnTestSound) {
            btnTestSound.onclick = () => this.testSoundTiming();
        }

        // Timeline ruler scrub
        const rulerEl = document.getElementById('cutecut-ruler');
        if (rulerEl) {
            rulerEl.onclick = (e) => {
                const rect = rulerEl.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                this.scrubProgress = Math.max(0, Math.min(1, clickX / rect.width));
                this.updatePlayheadPosition(this.scrubProgress);
            };
        }
    }

    // =========================================================================
    // Cute CUT Studio Core Methods
    // =========================================================================

    getActiveAttackConfig() {
        return window.coordinatesDB.getAttackConfig(this.selectedAttackId);
    }

    getActiveTracks() {
        return window.coordinatesDB.getAttackTracks(this.selectedAttackId);
    }

    getActiveTrack() {
        const tracks = this.getActiveTracks();
        if (!tracks || tracks.length === 0) return null;
        if (this.selectedTrackIndex >= tracks.length) this.selectedTrackIndex = 0;
        return tracks[this.selectedTrackIndex];
    }

    renderAttackSelector() {
        const select = document.getElementById('dev-attack-select');
        if (!select) return;

        select.innerHTML = '';
        const attacks = window.coordinatesDB.attacks;
        Object.keys(attacks).forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = attacks[id].name || id;
            if (id === this.selectedAttackId) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            this.selectedAttackId = e.target.value;
            this.selectedTrackIndex = 0;
            this.renderCuteCutTracksList();
            this.renderCuteCutFramePicker();
            this.updateCuteCutControls();
            this.renderCuteCutStageLayers();
        };
    }

    renderCuteCutTracksList() {
        const container = document.getElementById('cutecut-tracks-container');
        if (!container) return;

        container.innerHTML = '';
        const tracks = this.getActiveTracks();
        const atkCfg = this.getActiveAttackConfig();
        const folder = atkCfg ? window.assetManager.getAttackerFolder(atkCfg.folder) : '';

        tracks.forEach((track, idx) => {
            const isSelected = (idx === this.selectedTrackIndex);
            const card = document.createElement('div');
            card.className = `cutecut-track-card ${isSelected ? 'active' : ''}`;
            card.dataset.trackIndex = idx;

            const startTime = track.startTimeMs || 0;
            const duration = track.durationMs || 280;
            const leftPercent = Math.max(0, Math.min(90, (startTime / this.totalTimelineMs) * 100));
            const widthPercent = Math.max(8, Math.min(100 - leftPercent, (duration / this.totalTimelineMs) * 100));

            const transBadge = (track.transition && track.transition.enabled) ? ' <span style="color:#ffa502;">⚡</span>' : '';
            card.innerHTML = `
                <div class="cutecut-track-thumb">
                    <img src="${encodeURI(folder + '/' + track.frame)}" alt="track">
                </div>
                <div class="cutecut-track-info">
                    <div class="cutecut-track-name">${track.name || `Layer ${idx + 1}`} ${transBadge}</div>
                    <div class="cutecut-track-meta">${duration}ms | Z:${track.zIndex || (60 + idx)}</div>
                </div>
                <div class="cutecut-track-reorder-btns">
                    <button class="btn-track-order up" title="سەرخستن بۆ پێشەوە (Layer Up)" onclick="event.stopPropagation(); window.devEditor.moveTrackIndexDirect(${idx}, 1);">▲</button>
                    <button class="btn-track-order down" title="هێنانە خوارەوە بۆ پاشەوە (Layer Down)" onclick="event.stopPropagation(); window.devEditor.moveTrackIndexDirect(${idx}, -1);">▼</button>
                </div>
                <div class="cutecut-track-timeline-channel" data-track-index="${idx}">
                    <div class="cutecut-clip-block ${isSelected ? 'active' : ''}" 
                         style="left: ${leftPercent.toFixed(1)}%; width: ${widthPercent.toFixed(1)}%;" 
                         data-track-index="${idx}">
                        <div class="cutecut-clip-handle left" data-track-index="${idx}" data-handle="left" title="دەستکاریکردنی کاتی دەستپێک (Drag Start)"></div>
                        <div class="cutecut-clip-label">${duration}ms</div>
                        <div class="cutecut-clip-handle right" data-track-index="${idx}" data-handle="right" title="دەستکاریکردنی ماوە (Drag to Trim Duration)"></div>
                    </div>
                </div>
            `;

            card.onclick = (e) => {
                // If clicked inside channel/clip, selection handled by pointerdown
                this.selectedTrackIndex = idx;
                this.renderCuteCutTracksList();
                this.updateCuteCutControls();
                this.renderCuteCutStageLayers();
            };

            container.appendChild(card);
        });

        this.bindTimelineClipTrimmers();
    }

    bindTimelineClipTrimmers() {
        const channels = document.querySelectorAll('.cutecut-track-timeline-channel');
        channels.forEach(channel => {
            channel.onpointerdown = (e) => {
                e.stopPropagation();
                const trackIdx = parseInt(channel.dataset.trackIndex);
                this.selectedTrackIndex = trackIdx;
                const track = this.getActiveTracks()[trackIdx];
                if (!track) return;

                const target = e.target;
                const channelRect = channel.getBoundingClientRect();

                if (target.classList.contains('left')) {
                    this.dragMode = 'clip_trim_left';
                    this.dragStart = { x: e.clientX, channelWidth: channelRect.width, startTime: track.startTimeMs || 0, duration: track.durationMs || 280 };
                } else if (target.classList.contains('right')) {
                    this.dragMode = 'clip_trim_right';
                    this.dragStart = { x: e.clientX, channelWidth: channelRect.width, duration: track.durationMs || 280 };
                } else {
                    this.dragMode = 'clip_slide';
                    this.dragStart = { x: e.clientX, channelWidth: channelRect.width, startTime: track.startTimeMs || 0 };
                }

                this.activeClipChannel = channel;
                this.renderCuteCutTracksList();
                this.updateCuteCutControls();
                this.renderCuteCutStageLayers();
            };
        });
    }

    renderCuteCutFramePicker() {
        const select = document.getElementById('dev-attack-frame-select');
        const chipsContainer = document.getElementById('cutecut-frame-chips');
        if (!select) return;

        select.innerHTML = '';
        if (chipsContainer) chipsContainer.innerHTML = '';

        const atkCfg = this.getActiveAttackConfig();
        const frames = (atkCfg && atkCfg.frames) || [];
        const folder = atkCfg ? window.assetManager.getAttackerFolder(atkCfg.folder) : '';
        const activeTrack = this.getActiveTrack();

        frames.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            select.appendChild(opt);

            if (chipsContainer) {
                const chip = document.createElement('div');
                const isChipActive = (activeTrack && activeTrack.frame === f);
                chip.className = `cutecut-frame-chip ${isChipActive ? 'active' : ''}`;
                chip.dataset.frame = f;
                chip.style.cssText = `
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 4px 6px; border-radius: 10px; cursor: pointer;
                    background: ${isChipActive ? '#2c3e50' : '#1a162b'};
                    border: 2px solid ${isChipActive ? '#ffa502' : '#3d3460'};
                    box-shadow: ${isChipActive ? '0 0 10px rgba(255,165,2,0.6)' : 'none'};
                    transition: all 0.15s ease;
                `;
                chip.innerHTML = `
                    <img src="${encodeURI(folder + '/' + f)}" alt="${f}" style="width: 36px; height: 36px; object-fit: contain; pointer-events: none;">
                    <span style="font-size: 0.72rem; color: ${isChipActive ? '#ffa502' : '#a4b0be'}; font-weight: 800; margin-top: 2px; pointer-events: none;">${f}</span>
                `;
                chip.onclick = () => {
                    select.value = f;
                    select.dispatchEvent(new Event('change'));
                };
                chipsContainer.appendChild(chip);
            }
        });

        if (activeTrack && activeTrack.frame) {
            select.value = activeTrack.frame;
        }

        select.onchange = (e) => {
            const currentTrack = this.getActiveTrack();
            if (currentTrack) {
                currentTrack.frame = e.target.value;
                currentTrack.name = `Layer ${this.selectedTrackIndex + 1} (${e.target.value})`;

                // Update active chip styling
                if (chipsContainer) {
                    chipsContainer.querySelectorAll('.cutecut-frame-chip').forEach(c => {
                        const isMatch = (c.dataset.frame === e.target.value);
                        c.style.background = isMatch ? '#2c3e50' : '#1a162b';
                        c.style.borderColor = isMatch ? '#ffa502' : '#3d3460';
                        c.style.boxShadow = isMatch ? '0 0 10px rgba(255,165,2,0.6)' : 'none';
                        const label = c.querySelector('span');
                        if (label) label.style.color = isMatch ? '#ffa502' : '#a4b0be';
                    });
                }

                this.renderCuteCutTracksList();
                this.renderCuteCutStageLayers();
                this.updateCuteCutControls();
                this.showNotification(`فڕەیمی ئەم چینە گۆڕدرا بۆ: ${e.target.value} 🖼️`);
            }
        };

        const btnPrev = document.getElementById('btn-dev-prev-frame');
        if (btnPrev) {
            btnPrev.onclick = () => {
                const currentTrack = this.getActiveTrack();
                const curFrame = currentTrack ? currentTrack.frame : select.value;
                const idx = frames.indexOf(curFrame);
                if (idx > 0) {
                    select.value = frames[idx - 1];
                    select.dispatchEvent(new Event('change'));
                } else if (frames.length > 0) {
                    select.value = frames[frames.length - 1];
                    select.dispatchEvent(new Event('change'));
                }
            };
        }

        const btnNext = document.getElementById('btn-dev-next-frame');
        if (btnNext) {
            btnNext.onclick = () => {
                const currentTrack = this.getActiveTrack();
                const curFrame = currentTrack ? currentTrack.frame : select.value;
                const idx = frames.indexOf(curFrame);
                if (idx < frames.length - 1) {
                    select.value = frames[idx + 1];
                    select.dispatchEvent(new Event('change'));
                } else if (frames.length > 0) {
                    select.value = frames[0];
                    select.dispatchEvent(new Event('change'));
                }
            };
        }
    }

    updateCuteCutControls() {
        const track = this.getActiveTrack();
        const atkCfg = this.getActiveAttackConfig();

        const chkAllowMirror = document.getElementById('dev-attack-allow-mirror');
        if (chkAllowMirror && atkCfg) {
            chkAllowMirror.checked = (atkCfg.allowMirror !== false);
            chkAllowMirror.onchange = (e) => {
                atkCfg.allowMirror = e.target.checked;
                this.showNotification(`دۆخی ئاوێنە: ${atkCfg.allowMirror ? 'هەردوو لا چالاکە 🪞' : 'تەنها یەک لا 🎯'}`);
            };
        }

        if (!track) return;

        const sync = (numId, sliderId, val, min, max, step, cb) => {
            this.syncControl(numId, sliderId, val, min, max, step, (v) => {
                cb(parseFloat(v));
                this.renderCuteCutStageLayers();
                this.renderCuteCutTracksList();
            });
        };

        // Helper to also persist talking_mouth track changes to items[] store
        const persistTalkingMouth = () => {
            if (this.selectedAttackId === 'talking_mouth' && track.frame) {
                window.coordinatesDB.setItemTransform('talking_mouth', track.frame, {
                    x: track.x || 0,
                    y: track.y !== undefined ? track.y : 0,
                    scale: track.scale !== undefined ? track.scale : 1.0,
                    scaleX: track.scaleX !== undefined ? track.scaleX : 1.0,
                    scaleY: track.scaleY !== undefined ? track.scaleY : 1.0,
                    rotation: track.rotation || 0,
                    zIndex: track.zIndex || 35
                });
            }
        };

        sync('dev-input-atk-x', 'dev-slider-atk-x', track.x || 0, -250, 250, 1, (v) => { track.x = v; persistTalkingMouth(); });
        sync('dev-input-atk-y', 'dev-slider-atk-y', track.y || 0, -250, 250, 1, (v) => { track.y = v; persistTalkingMouth(); });
        sync('dev-input-atk-scale', 'dev-slider-atk-scale', track.scale !== undefined ? track.scale : 1.2, 0.2, 3.0, 0.05, (v) => { track.scale = v; persistTalkingMouth(); });
        sync('dev-input-atk-scaleX', 'dev-slider-atk-scaleX', track.scaleX !== undefined ? track.scaleX : 1.0, -2.5, 2.5, 0.05, (v) => { track.scaleX = v; persistTalkingMouth(); });
        sync('dev-input-atk-scaleY', 'dev-slider-atk-scaleY', track.scaleY !== undefined ? track.scaleY : 1.0, -2.5, 2.5, 0.05, (v) => { track.scaleY = v; persistTalkingMouth(); });
        sync('dev-input-atk-rotation', 'dev-slider-atk-rotation', track.rotation || 0, -180, 180, 1, (v) => { track.rotation = v; persistTalkingMouth(); });
        sync('dev-input-atk-zindex', 'dev-slider-atk-zindex', track.zIndex || 60, 40, 90, 1, (v) => { track.zIndex = v; persistTalkingMouth(); });

        // Transition Panel Controls
        const trans = track.transition || { enabled: false, easing: 'easeOutQuad', durationMs: 280 };
        const transToggle = document.getElementById('cutecut-trans-enabled');
        if (transToggle) {
            transToggle.checked = trans.enabled || false;
            transToggle.onchange = (e) => {
                if (!track.transition) track.transition = {};
                track.transition.enabled = e.target.checked;
                this.renderCuteCutTracksList();
                this.showNotification(track.transition.enabled ? 'جوڵەی Point A➔B چالاککرا 📈' : 'جوڵە ناچالاککرا ⏹️');
            };
        }

        const transEasing = document.getElementById('cutecut-trans-easing');
        if (transEasing) {
            transEasing.value = trans.easing || 'easeOutQuad';
            transEasing.onchange = (e) => {
                if (!track.transition) track.transition = {};
                track.transition.easing = e.target.value;
            };
        }

        sync('cutecut-trans-dur-num', 'cutecut-trans-dur', track.durationMs || 280, 80, 1500, 20, (v) => {
            track.durationMs = v;
            if (track.transition) track.transition.durationMs = v;
        });

        // Frame Selector sync
        const frameSelect = document.getElementById('dev-attack-frame-select');
        if (frameSelect && track.frame) {
            frameSelect.value = track.frame;
        }

        // Sync active frame chip highlight
        const chipsContainer = document.getElementById('cutecut-frame-chips');
        if (chipsContainer && track.frame) {
            chipsContainer.querySelectorAll('.cutecut-frame-chip').forEach(c => {
                const isMatch = (c.dataset.frame === track.frame);
                c.style.background = isMatch ? '#2c3e50' : '#1a162b';
                c.style.borderColor = isMatch ? '#ffa502' : '#3d3460';
                c.style.boxShadow = isMatch ? '0 0 10px rgba(255,165,2,0.6)' : 'none';
                const label = c.querySelector('span');
                if (label) label.style.color = isMatch ? '#ffa502' : '#a4b0be';
            });
        }

        const badgeEl = document.getElementById('cutecut-box-badge');
        if (badgeEl) {
            badgeEl.textContent = `${track.name || `Layer ${this.selectedTrackIndex + 1}`} (X:${track.x}, Y:${track.y})`;
        }
    }

    renderCuteCutStageLayers() {
        if (!this.attackPreviewFxEl || this.studioMode !== 'attacks') return;

        const atkCfg = this.getActiveAttackConfig();
        if (!atkCfg) return;
        const tracks = this.getActiveTracks();
        const folder = window.assetManager.getAttackerFolder(atkCfg.folder);

        // ---------------------------------------------------------------
        // TALKING MOUTH: render directly into the mouth part element so
        // z-index works correctly relative to mustache/facials on the stage.
        // The separate FX overlay is not used here.
        // ---------------------------------------------------------------
        if (atkCfg.id === 'talking_mouth') {
            this.attackPreviewFxEl.style.display = 'none';
            this.attackPreviewFxEl.innerHTML = '';

            const activeTrack = tracks[this.selectedTrackIndex] || tracks[0];
            const mouthPartEl = this.stageContainer && this.stageContainer.querySelector('.mv-part-mouths');

            if (mouthPartEl && activeTrack) {
                const scaleBase = activeTrack.scale !== undefined ? activeTrack.scale : 1.0;
                const sx = (activeTrack.scaleX !== undefined ? activeTrack.scaleX : 1.0) * scaleBase;
                const sy = (activeTrack.scaleY !== undefined ? activeTrack.scaleY : 1.0) * scaleBase;
                const rot = activeTrack.rotation || 0;
                const imgPath = `${folder}/${activeTrack.frame}`;

                // Position the part element itself at the track's x/y
                mouthPartEl.style.left = `calc(50% + ${activeTrack.x}px)`;
                mouthPartEl.style.top  = `calc(50% + ${activeTrack.y}px)`;
                mouthPartEl.style.transform = 'translate(-50%, -50%)';
                mouthPartEl.style.zIndex = activeTrack.zIndex || 35;

                mouthPartEl.innerHTML = `<img src="${encodeURI(imgPath)}" alt="talking_mouth" draggable="false"
                    style="max-width: 140px; max-height: 140px; transform: scale(${sx}, ${sy}) rotate(${rot}deg); transform-origin: center center; display: block; pointer-events: none;">`;
            }

            this.updateCuteCutTransformBox();
            return;
        }

        // ---------------------------------------------------------------
        // All other attacks: use the FX overlay as normal
        // ---------------------------------------------------------------
        let html = '';
        tracks.forEach((tr, idx) => {
            const isSelected = (idx === this.selectedTrackIndex);
            const scaleBase = tr.scale || 1.2;
            const sx = (tr.scaleX !== undefined ? tr.scaleX : 1.0) * scaleBase * (this.isMirrorPreview ? -1 : 1);
            const sy = (tr.scaleY !== undefined ? tr.scaleY : 1.0) * scaleBase;
            const posX = this.isMirrorPreview ? -tr.x : tr.x;
            const rot = tr.rotation || 0;
            const op = tr.opacity !== undefined ? tr.opacity : 1.0;

            html += `
                <div id="cutecut-stage-layer-${idx}" class="cutecut-stage-layer ${isSelected ? 'active-layer' : ''}" 
                     style="position: absolute; left: calc(50% + ${posX}px); top: calc(50% + ${tr.y}px); transform: translate(-50%, -50%); opacity: ${op}; z-index: ${tr.zIndex || (60 + idx)}; pointer-events: none;">
                    <img src="${encodeURI(folder + '/' + tr.frame)}" alt="layer" draggable="false" 
                         style="max-width: 140px; max-height: 140px; transform: scale(${sx}, ${sy}) rotate(${rot}deg); transform-origin: center center; display: block; pointer-events: none;">
                </div>
            `;
        });

        this.attackPreviewFxEl.style.left = '0px';
        this.attackPreviewFxEl.style.top = '0px';
        this.attackPreviewFxEl.style.width = '100%';
        this.attackPreviewFxEl.style.height = '100%';
        this.attackPreviewFxEl.style.transform = 'none';
        this.attackPreviewFxEl.style.display = 'block';
        this.attackPreviewFxEl.style.zIndex = '65';
        this.attackPreviewFxEl.innerHTML = html;

        // Position Cute CUT transform bounding box over active layer
        this.updateCuteCutTransformBox();
    }

    updateCuteCutTransformBox() {
        if (!this.transformBoxEl || this.studioMode !== 'attacks') return;

        const track = this.getActiveTrack();
        if (!track) {
            this.transformBoxEl.classList.remove('active');
            return;
        }

        const posX = this.isMirrorPreview ? -track.x : track.x;
        const rot = track.rotation || 0;
        const scaleBase = track.scale || 1.2;
        const sx = (track.scaleX !== undefined ? track.scaleX : 1.0) * scaleBase;
        const sy = (track.scaleY !== undefined ? track.scaleY : 1.0) * scaleBase;

        // Exact box size matching 140px base image scaled
        const boxWidth = Math.max(50, Math.round(140 * Math.abs(sx)));
        const boxHeight = Math.max(50, Math.round(140 * Math.abs(sy)));

        this.transformBoxEl.style.left = `calc(50% + ${posX}px)`;
        this.transformBoxEl.style.top = `calc(50% + ${track.y}px)`;
        this.transformBoxEl.style.width = `${boxWidth}px`;
        this.transformBoxEl.style.height = `${boxHeight}px`;
        this.transformBoxEl.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
        this.transformBoxEl.classList.add('active');

        const badgeEl = document.getElementById('cutecut-box-badge');
        if (badgeEl) {
            badgeEl.textContent = `${track.name || `Layer ${this.selectedTrackIndex + 1}`} [X:${track.x}, Y:${track.y}]`;
        }
    }

    addCuteCutTrack() {
        const atkCfg = this.getActiveAttackConfig();
        if (!atkCfg) return;
        const tracks = this.getActiveTracks();
        const nextIdx = tracks.length + 1;
        const defaultFrame = (atkCfg.frames && atkCfg.frames[0]) || '341.png';

        const newTrack = {
            id: `track_${Date.now()}`,
            name: `Layer ${nextIdx} (${defaultFrame})`,
            frame: defaultFrame,
            x: 0,
            y: 0,
            scale: 1.2,
            scaleX: 1.0,
            scaleY: 1.0,
            rotation: 0,
            opacity: 1.0,
            zIndex: 60 + nextIdx,
            startTimeMs: 0,
            durationMs: 280,
            transition: {
                enabled: false,
                startX: 0, startY: 0, startScale: 1.0, startScaleX: 1.0, startScaleY: 1.0, startRot: 0, startOpacity: 1.0,
                endX: 0, endY: 0, endScale: 1.2, endScaleX: 1.0, endScaleY: 1.0, endRot: 0, endOpacity: 1.0,
                easing: 'easeOutQuad'
            }
        };

        tracks.push(newTrack);
        this.selectedTrackIndex = tracks.length - 1;
        this.renderCuteCutTracksList();
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
        this.showNotification(`چینی نوێ زیادکرا: Layer ${nextIdx} ➕`);
    }

    duplicateCuteCutTrack() {
        const track = this.getActiveTrack();
        if (!track) return;
        const tracks = this.getActiveTracks();

        const cloned = JSON.parse(JSON.stringify(track));
        cloned.id = `track_${Date.now()}`;
        cloned.name = `${track.name} (کۆپی)`;
        cloned.x += 15;
        cloned.y += 15;
        cloned.zIndex = (track.zIndex || 60) + 1;

        tracks.push(cloned);
        this.selectedTrackIndex = tracks.length - 1;
        this.renderCuteCutTracksList();
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
        this.showNotification('چینەکە کۆپی کرا 📋');
    }

    deleteCuteCutTrack() {
        const tracks = this.getActiveTracks();
        if (tracks.length <= 1) {
            alert('ناتوانیت هەموو چینەکان بسڕیتەوە! بەلایەنی کەم پێویستە یەک چین هەبێت.');
            return;
        }

        tracks.splice(this.selectedTrackIndex, 1);
        if (this.selectedTrackIndex >= tracks.length) {
            this.selectedTrackIndex = tracks.length - 1;
        }
        this.renderCuteCutTracksList();
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
        this.showNotification('چینەکە سڕدرایەوە 🗑️');
    }

    toggleTransitionPanel() {
        const track = this.getActiveTrack();
        if (!track) return;
        if (!track.transition) track.transition = {};
        track.transition.enabled = !track.transition.enabled;
        this.updateCuteCutControls();
        this.renderCuteCutTracksList();
        this.showNotification(track.transition.enabled ? 'جوڵەی Point A➔B چالاککرا 📈' : 'جوڵە ناچالاککرا ⏹️');
    }

    rotateTrack90() {
        const track = this.getActiveTrack();
        if (!track) return;
        track.rotation = ((track.rotation || 0) + 90) % 360;
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
    }

    flipTrackHorizontal() {
        const track = this.getActiveTrack();
        if (!track) return;
        track.scaleX = (track.scaleX !== undefined ? -track.scaleX : -1.0);
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
    }

    moveTrackZIndex(delta) {
        this.moveTrackIndexDirect(this.selectedTrackIndex, delta);
    }

    moveTrackIndexDirect(currentIdx, delta) {
        const tracks = this.getActiveTracks();
        if (!tracks || tracks.length <= 1) return;

        const targetIdx = currentIdx + delta;
        if (targetIdx < 0 || targetIdx >= tracks.length) {
            this.showNotification(delta > 0 ? 'چینەکە لە پێشەوەترین ئاستدایە' : 'چینەکە لە پاشەوەترین ئاستدایە');
            return;
        }

        // Swap tracks in array
        const temp = tracks[currentIdx];
        tracks[currentIdx] = tracks[targetIdx];
        tracks[targetIdx] = temp;

        // Re-index all z-indices
        tracks.forEach((t, i) => {
            t.zIndex = 60 + i;
        });

        this.selectedTrackIndex = targetIdx;
        window.coordinatesDB.setAttackTracks(this.selectedAttackId, tracks);

        this.renderCuteCutTracksList();
        this.updateCuteCutControls();
        this.renderCuteCutStageLayers();
        this.showNotification(delta > 0 ? 'چین سەرخرا بۆ پێشەوە ⬆️' : 'چین هێنرایە خوارەوە بۆ پاشەوە ⬇️');
    }

    setCuteCutCurrentAsPointA() {
        const track = this.getActiveTrack();
        if (!track) return;
        if (!track.transition) track.transition = {};

        track.transition.enabled = true;
        track.transition.startX = track.x || 0;
        track.transition.startY = track.y || 0;
        track.transition.startScale = track.scale || 1.2;
        track.transition.startScaleX = track.scaleX !== undefined ? track.scaleX : 1.0;
        track.transition.startScaleY = track.scaleY !== undefined ? track.scaleY : 1.0;
        track.transition.startRot = track.rotation || 0;
        track.transition.startOpacity = track.opacity !== undefined ? track.opacity : 1.0;

        this.updateCuteCutControls();
        this.renderCuteCutTracksList();
        this.showNotification(`📍 خاڵی دەستپێک (A) دانرا: [${track.x}, ${track.y}]`);
    }

    setCuteCutCurrentAsPointB() {
        const track = this.getActiveTrack();
        if (!track) return;
        if (!track.transition) track.transition = {};

        track.transition.enabled = true;
        track.transition.endX = track.x || 0;
        track.transition.endY = track.y || 0;
        track.transition.endScale = track.scale || 1.2;
        track.transition.endScaleX = track.scaleX !== undefined ? track.scaleX : 1.0;
        track.transition.endScaleY = track.scaleY !== undefined ? track.scaleY : 1.0;
        track.transition.endRot = track.rotation || 0;
        track.transition.endOpacity = track.opacity !== undefined ? track.opacity : 1.0;

        this.updateCuteCutControls();
        this.renderCuteCutTracksList();
        this.showNotification(`🎯 خاڵی کۆتایی (B) دانرا: [${track.x}, ${track.y}]`);
    }

    playCuteCutAllAnimation(isMirrored = false) {
        const atkCfg = this.getActiveAttackConfig();
        if (!atkCfg) return;
        const tracks = this.getActiveTracks();
        if (!tracks || tracks.length === 0) return;

        window.soundEngine.playAttackSound(this.selectedAttackId);

        // Fixed: strictly only play talking mouth if user explicitly checked the toggle!
        if (this.playMouthOnTest) {
            const soundTiming = window.coordinatesDB.getSoundTiming(atkCfg.sound) || { durationMs: 2200, talkSpeed: 110 };
            window.characterModel.startTalking(soundTiming.durationMs, soundTiming.talkSpeed);
        }

        const fxEl = this.attackPreviewFxEl;
        if (!fxEl) return;
        fxEl.style.zIndex = (this.selectedAttackId === 'talking_mouth') ? '35' : '65';
        const folder = window.assetManager.getAttackerFolder(atkCfg.folder);

        let totalDur = 300;
        tracks.forEach(tr => {
            const trEnd = (tr.startTimeMs || 0) + (tr.durationMs || 280);
            if (trEnd > totalDur) totalDur = trEnd;
        });

        const startTime = performance.now();
        if (this.attackAnimTimer) cancelAnimationFrame(this.attackAnimTimer);

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
            return t;
        };

        const animate = (now) => {
            const elapsed = now - startTime;
            const globalProgress = Math.min(1, elapsed / totalDur);
            this.updatePlayheadPosition(globalProgress);

            let html = '';
            tracks.forEach(tr => {
                const trStart = tr.startTimeMs || 0;
                const trDur = tr.durationMs || 280;
                if (elapsed < trStart || elapsed > trStart + trDur) return;

                const p = Math.max(0, Math.min(1, (elapsed - trStart) / trDur));
                let posX = tr.x, posY = tr.y, scale = tr.scale || 1.2, sx = tr.scaleX || 1.0, sy = tr.scaleY || 1.0, rot = tr.rotation || 0, op = tr.opacity !== undefined ? tr.opacity : 1.0;

                if (tr.transition && tr.transition.enabled) {
                    const ease = evaluateEasing(p, tr.transition.easing || 'easeOutQuad');
                    const trans = tr.transition;
                    posX = trans.startX + (trans.endX - trans.startX) * ease;
                    posY = trans.startY + (trans.endY - trans.startY) * ease;
                    scale = (trans.startScale || 1.0) + ((trans.endScale || 1.0) - (trans.startScale || 1.0)) * ease;
                    sx = (trans.startScaleX || 1.0) + ((trans.endScaleX || 1.0) - (trans.startScaleX || 1.0)) * ease;
                    sy = (trans.startScaleY || 1.0) + ((trans.endScaleY || 1.0) - (trans.startScaleY || 1.0)) * ease;
                    rot = (trans.startRot || 0) + ((trans.endRot || 0) - (trans.startRot || 0)) * ease;
                    op = (trans.startOpacity !== undefined ? trans.startOpacity : 1.0) + (((trans.endOpacity !== undefined ? trans.endOpacity : 1.0)) - (trans.startOpacity !== undefined ? trans.startOpacity : 1.0)) * ease;
                }

                const finalSx = sx * scale * (isMirrored ? -1 : 1);
                const finalSy = sy * scale;
                const renderX = isMirrored ? -posX : posX;
                const finalRot = rot;

                html += `
                    <div style="position: absolute; left: calc(50% + ${renderX}px); top: calc(50% + ${posY}px); transform: translate(-50%, -50%); opacity: ${op}; z-index: ${tr.zIndex || 60}; pointer-events: none;">
                        <img src="${encodeURI(folder + '/' + tr.frame)}" alt="layer" draggable="false" 
                             style="max-width: 140px; max-height: 140px; transform: scale(${finalSx}, ${finalSy}) rotate(${finalRot}deg); transform-origin: center center; display: block;">
                    </div>
                `;
            });

            fxEl.innerHTML = html;

            if (elapsed < totalDur) {
                this.attackAnimTimer = requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    this.renderCuteCutStageLayers();
                    this.updatePlayheadPosition(0);
                }, 150);
            }
        };

        this.attackAnimTimer = requestAnimationFrame(animate);
    }

    playCuteCutSingleTrack(isMirrored = false) {
        const track = this.getActiveTrack();
        if (!track) return;
        const atkCfg = this.getActiveAttackConfig();
        if (!atkCfg) return;

        window.soundEngine.playAttackSound(this.selectedAttackId);

        if (this.playMouthOnTest) {
            const soundTiming = window.coordinatesDB.getSoundTiming(atkCfg.sound) || { durationMs: 2200, talkSpeed: 110 };
            window.characterModel.startTalking(soundTiming.durationMs, soundTiming.talkSpeed);
        }

        const fxEl = this.attackPreviewFxEl;
        if (!fxEl) return;
        const folder = window.assetManager.getAttackerFolder(atkCfg.folder);

        const scaleBase = track.scale || 1.2;
        const sx = (track.scaleX !== undefined ? track.scaleX : 1.0) * scaleBase * (isMirrored ? -1 : 1);
        const sy = (track.scaleY !== undefined ? track.scaleY : 1.0) * scaleBase;
        const posX = isMirrored ? -track.x : track.x;
        const rot = track.rotation || 0;

        fxEl.innerHTML = `
            <div style="position: absolute; left: calc(50% + ${posX}px); top: calc(50% + ${track.y}px); transform: translate(-50%, -50%); opacity: ${track.opacity || 1.0}; z-index: 65;">
                <img src="${encodeURI(folder + '/' + track.frame)}" alt="solo-layer" draggable="false" 
                     style="max-width: 140px; max-height: 140px; transform: scale(${sx}, ${sy}) rotate(${rot}deg); transform-origin: center center; display: block;">
            </div>
        `;
    }

    updatePlayheadPosition(progress) {
        const needle = document.getElementById('cutecut-playhead');
        const ruler = document.getElementById('cutecut-ruler');
        if (needle && ruler) {
            const rect = ruler.getBoundingClientRect();
            const posX = Math.round(progress * rect.width);
            needle.style.left = `${posX}px`;
        }
    }

    // =========================================================================
    // Stage Listeners & Interactive Canvas Gizmo Dragging
    // =========================================================================

    attachStageListeners() {
        if (!this.stageContainer) return;

        const onPointerDown = (e) => {
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (!clientX || !clientY) return;

            const target = e.target;

            if (this.studioMode === 'body') {
                const t = window.configManager.getPartTransform(this.selectedCategory, this.selectedItem);
                this.dragMode = 'body_move';
                this.dragStart = { x: clientX, y: clientY };
                this.initialTransform = { ...t };
            } else if (this.studioMode === 'attacks') {
                const track = this.getActiveTrack();
                if (!track) return;

                if (target.classList.contains('cutecut-rot-handle')) {
                    this.dragMode = 'handle_rotate';
                    this.dragStart = { x: clientX, y: clientY };
                    this.initialTransform = { rotation: track.rotation || 0 };
                } else if (target.classList.contains('cutecut-handle')) {
                    this.dragMode = 'handle_resize';
                    this.dragHandleDir = target.dataset.dir || 'se';
                    this.dragStart = { x: clientX, y: clientY };
                    this.initialTransform = { scale: track.scale || 1.2, scaleX: track.scaleX || 1.0, scaleY: track.scaleY || 1.0 };
                } else if (target.closest('#cutecut-transform-box')) {
                    this.dragMode = 'box_move';
                    this.dragStart = { x: clientX, y: clientY };
                    this.initialTransform = { x: track.x || 0, y: track.y || 0 };
                }
            }
        };

        const onPointerMove = (e) => {
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            if (!clientX || !clientY) return;

            // Handle Timeline Clip Trimming
            if (this.dragMode === 'clip_trim_right') {
                const dx = clientX - this.dragStart.x;
                const dMs = Math.round((dx / this.dragStart.channelWidth) * this.totalTimelineMs);
                const track = this.getActiveTrack();
                if (track) {
                    track.durationMs = Math.max(80, Math.min(1500, this.dragStart.duration + dMs));
                    this.updateCuteCutControls();
                    this.renderCuteCutTracksList();
                }
                return;
            } else if (this.dragMode === 'clip_trim_left') {
                const dx = clientX - this.dragStart.x;
                const dMs = Math.round((dx / this.dragStart.channelWidth) * this.totalTimelineMs);
                const track = this.getActiveTrack();
                if (track) {
                    const newStart = Math.max(0, Math.min(1400, this.dragStart.startTime + dMs));
                    const newDur = Math.max(80, this.dragStart.duration - (newStart - this.dragStart.startTime));
                    track.startTimeMs = newStart;
                    track.durationMs = newDur;
                    this.updateCuteCutControls();
                    this.renderCuteCutTracksList();
                }
                return;
            } else if (this.dragMode === 'clip_slide') {
                const dx = clientX - this.dragStart.x;
                const dMs = Math.round((dx / this.dragStart.channelWidth) * this.totalTimelineMs);
                const track = this.getActiveTrack();
                if (track) {
                    track.startTimeMs = Math.max(0, Math.min(1500 - (track.durationMs || 280), this.dragStart.startTime + dMs));
                    this.updateCuteCutControls();
                    this.renderCuteCutTracksList();
                }
                return;
            }

            if (!this.dragMode) return;
            const dx = clientX - this.dragStart.x;
            const dy = clientY - this.dragStart.y;

            if (this.dragMode === 'body_move') {
                const t = window.configManager.getPartTransform(this.selectedCategory, this.selectedItem);
                t.x = Math.round(this.initialTransform.x + dx);
                t.y = Math.round(this.initialTransform.y + dy);

                const numX = document.getElementById('dev-input-x');
                const sliderX = document.getElementById('dev-slider-x');
                const numY = document.getElementById('dev-input-y');
                const sliderY = document.getElementById('dev-slider-y');

                if (numX) numX.value = t.x;
                if (sliderX) sliderX.value = t.x;
                if (numY) numY.value = t.y;
                if (sliderY) sliderY.value = t.y;

                this.applyLiveBodyTransform(t);

            } else if (this.studioMode === 'attacks') {
                const track = this.getActiveTrack();
                if (!track) return;

                if (this.dragMode === 'box_move') {
                    track.x = Math.round(this.initialTransform.x + (this.isMirrorPreview ? -dx : dx));
                    track.y = Math.round(this.initialTransform.y + dy);
                } else if (this.dragMode === 'handle_resize') {
                    const factor = 1 + (dx + dy) * 0.005;
                    track.scale = Math.max(0.3, Math.min(3.0, parseFloat(((this.initialTransform.scale || 1.2) * factor).toFixed(2))));
                } else if (this.dragMode === 'handle_rotate') {
                    const rotDelta = Math.round(dx * 0.8);
                    track.rotation = Math.round(this.initialTransform.rotation + (this.isMirrorPreview ? -rotDelta : rotDelta));
                }

                // talking_mouth tracks are rebuilt from items[] on every getAttackTracks() call,
                // so we must write changes back to the items store immediately or the drag resets.
                if (this.selectedAttackId === 'talking_mouth' && track.frame) {
                    window.coordinatesDB.setItemTransform('talking_mouth', track.frame, {
                        x: track.x || 0,
                        y: track.y !== undefined ? track.y : 0,
                        scale: track.scale !== undefined ? track.scale : 1.0,
                        scaleX: track.scaleX !== undefined ? track.scaleX : 1.0,
                        scaleY: track.scaleY !== undefined ? track.scaleY : 1.0,
                        rotation: track.rotation || 0,
                        zIndex: track.zIndex || 35
                    });
                }

                this.updateCuteCutControls();
                this.renderCuteCutStageLayers();
            }
        };

        const onPointerUp = () => {
            this.dragMode = null;
            this.dragHandleDir = null;
            this.activeClipChannel = null;
        };

        this.stageContainer.onmousedown = onPointerDown;
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        this.stageContainer.ontouchstart = onPointerDown;
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    }

    // =========================================================================
    // Body Parts Studio Methods
    // =========================================================================

    renderCategorySelector() {
        const select = document.getElementById('dev-cat-select');
        if (!select) return;

        select.innerHTML = '';
        const manifest = ASSETS_MANIFEST.categories;
        manifest.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `${cat.icon} ${cat.name}`;
            if (cat.id === this.selectedCategory) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            this.selectedCategory = e.target.value;
            this.selectedItem = window.characterModel.state[this.selectedCategory];
            this.updateItemPreviewOptions();
            this.updateBodyControls();
            this.highlightSelectedPart();
        };

        this.updateItemPreviewOptions();
    }

    updateItemPreviewOptions() {
        const select = document.getElementById('dev-item-select');
        if (!select) return;

        select.innerHTML = '';
        const items = ASSETS_MANIFEST.bodyParts[this.selectedCategory] || [];

        items.forEach(itemFile => {
            const opt = document.createElement('option');
            opt.value = itemFile;
            opt.textContent = itemFile;
            if (itemFile === this.selectedItem) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            this.selectedItem = e.target.value;
            window.characterModel.setPart(this.selectedCategory, this.selectedItem);
            this.updateBodyControls();
            this.renderStage();
        };

        const btnPrev = document.getElementById('btn-dev-prev-item');
        if (btnPrev) {
            btnPrev.onclick = () => {
                const idx = items.indexOf(this.selectedItem);
                if (idx > 0) {
                    select.value = items[idx - 1];
                    select.dispatchEvent(new Event('change'));
                }
            };
        }

        const btnNext = document.getElementById('btn-dev-next-item');
        if (btnNext) {
            btnNext.onclick = () => {
                const idx = items.indexOf(this.selectedItem);
                if (idx < items.length - 1) {
                    select.value = items[idx + 1];
                    select.dispatchEvent(new Event('change'));
                }
            };
        }
    }

    updateBodyControls() {
        const currentTransform = window.configManager.getPartTransform(this.selectedCategory, this.selectedItem);

        this.syncControl('dev-input-x', 'dev-slider-x', currentTransform.x, -250, 250, 1, val => {
            currentTransform.x = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-y', 'dev-slider-y', currentTransform.y, -250, 250, 1, val => {
            currentTransform.y = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-scale', 'dev-slider-scale', currentTransform.scale, 0.2, 3.0, 0.02, val => {
            currentTransform.scale = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-scaleX', 'dev-slider-scaleX', currentTransform.scaleX !== undefined ? currentTransform.scaleX : 1.0, -2.5, 2.5, 0.05, val => {
            currentTransform.scaleX = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-scaleY', 'dev-slider-scaleY', currentTransform.scaleY !== undefined ? currentTransform.scaleY : 1.0, -2.5, 2.5, 0.05, val => {
            currentTransform.scaleY = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-rotation', 'dev-slider-rotation', currentTransform.rotation, -180, 180, 1, val => {
            currentTransform.rotation = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-zindex', 'dev-slider-zindex', currentTransform.zIndex, 1, 90, 1, val => {
            currentTransform.zIndex = parseInt(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        const toggleMirror = document.getElementById('dev-toggle-mirror');
        const mirrorBox = document.getElementById('dev-mirror-options-box');
        if (toggleMirror && mirrorBox) {
            toggleMirror.checked = currentTransform.mirror.enabled;
            mirrorBox.style.display = currentTransform.mirror.enabled ? 'block' : 'none';

            toggleMirror.onchange = (e) => {
                currentTransform.mirror.enabled = e.target.checked;
                mirrorBox.style.display = currentTransform.mirror.enabled ? 'block' : 'none';
                this.applyLiveBodyTransform(currentTransform);
            };
        }

        this.syncControl('dev-input-mirror-dist', 'dev-slider-mirror-dist', currentTransform.mirror.distance || 0, 0, 300, 1, val => {
            currentTransform.mirror.distance = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        this.syncControl('dev-input-mirror-tilt', 'dev-slider-mirror-tilt', currentTransform.mirror.tilt || 0, -90, 90, 1, val => {
            currentTransform.mirror.tilt = parseFloat(val);
            this.applyLiveBodyTransform(currentTransform);
        });

        const toggleMirrorFlip = document.getElementById('dev-toggle-mirror-flip');
        if (toggleMirrorFlip) {
            toggleMirrorFlip.checked = currentTransform.mirror.flipSides || false;
            toggleMirrorFlip.onchange = (e) => {
                currentTransform.mirror.flipSides = e.target.checked;
                this.applyLiveBodyTransform(currentTransform);
            };
        }

        const toggleMirrorRotOpp = document.getElementById('dev-toggle-mirror-rot-opp');
        if (toggleMirrorRotOpp) {
            toggleMirrorRotOpp.checked = currentTransform.mirror.rotateOpposite !== false;
            toggleMirrorRotOpp.onchange = (e) => {
                currentTransform.mirror.rotateOpposite = e.target.checked;
                this.applyLiveBodyTransform(currentTransform);
            };
        }

        const scopeCat = document.getElementById('dev-scope-category');
        const scopeItem = document.getElementById('dev-scope-item');
        if (scopeCat && scopeItem) {
            scopeCat.onchange = () => { this.applyScope = 'category'; };
            scopeItem.onchange = () => { this.applyScope = 'specific'; };
        }
    }

    applyLiveBodyTransform(transform) {
        if (this.applyScope === 'category') {
            window.configManager.applyTransformToAllInCategory(this.selectedCategory, transform);
        } else {
            window.configManager.setItemTransform(this.selectedCategory, this.selectedItem, transform);
        }
        this.renderStage();
    }

    // =========================================================================
    // Sound & Voice Timings Studio
    // =========================================================================

    renderVoiceSelector() {
        const select = document.getElementById('dev-voice-select');
        const attackSelect = document.getElementById('dev-sound-select');
        const allTimings = window.coordinatesDB.getAllSoundTimings();

        if (select) {
            select.innerHTML = '';
            const keys = Object.keys(allTimings);
            if (!this.selectedSoundKey || !allTimings[this.selectedSoundKey]) {
                this.selectedSoundKey = keys[0] || 'voice_1';
            }

            keys.forEach(k => {
                const item = allTimings[k];
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = `${item.name || k} (${k}) [${item.durationMs || 2000}ms]`;
                if (k === this.selectedSoundKey) opt.selected = true;
                select.appendChild(opt);
            });

            select.onchange = (e) => {
                this.selectedSoundKey = e.target.value;
                this.updateSoundTimingControls();
            };
        }

        if (attackSelect) {
            attackSelect.innerHTML = '';
            Object.keys(allTimings).forEach(k => {
                const item = allTimings[k];
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = `${item.name || k} (${k})`;
                if (k === this.selectedSoundKey) opt.selected = true;
                attackSelect.appendChild(opt);
            });
            attackSelect.onchange = (e) => {
                this.selectedSoundKey = e.target.value;
                this.updateSoundTimingControls();
            };
        }

        this.initVoiceStudioEvents();
        this.updateSoundTimingControls();
    }

    renderSoundSelector() {
        this.renderVoiceSelector();
    }

    initVoiceStudioEvents() {
        // Toggle Add Form
        const btnAdd = document.getElementById('btn-dev-voice-add');
        const form = document.getElementById('dev-voice-add-form');
        if (btnAdd && form) {
            btnAdd.onclick = () => {
                form.style.display = (form.style.display === 'none' || !form.style.display) ? 'block' : 'none';
            };
        }

        // Cancel Add
        const btnCancel = document.getElementById('btn-dev-new-voice-cancel');
        if (btnCancel && form) {
            btnCancel.onclick = () => {
                form.style.display = 'none';
            };
        }

        // Save New Voice
        const btnSave = document.getElementById('btn-dev-new-voice-save');
        if (btnSave && form) {
            btnSave.onclick = () => {
                const idInput = document.getElementById('dev-new-voice-id');
                const nameInput = document.getElementById('dev-new-voice-name');
                const fileInput = document.getElementById('dev-new-voice-file');

                const voiceId = idInput ? idInput.value.trim() : '';
                const voiceName = nameInput ? nameInput.value.trim() : '';
                const voiceFile = fileInput ? fileInput.value.trim() : '';

                if (!voiceId) {
                    alert('تکایە ناوی ناسێنەری دەنگەکە (ID) بنووسە!');
                    return;
                }

                window.coordinatesDB.addSoundTiming(voiceId, {
                    name: voiceName || voiceId,
                    file: voiceFile || `sounds/${voiceId}.mp3`,
                    durationMs: 2000,
                    talkSpeed: 100
                });

                this.selectedSoundKey = voiceId;
                form.style.display = 'none';
                if (idInput) idInput.value = '';
                if (nameInput) nameInput.value = '';
                if (fileInput) fileInput.value = '';

                this.renderVoiceSelector();
                this.showNotification(`دەنگی نوێ "${voiceName || voiceId}" زیادکرا ✨`);
            };
        }

        // Delete Voice
        const btnDel = document.getElementById('btn-dev-voice-delete');
        if (btnDel) {
            btnDel.onclick = () => {
                if (!this.selectedSoundKey) return;
                if (confirm(`دڵنیایت لە سڕینەوەی دەنگی "${this.selectedSoundKey}" لە کاتەلۆگ؟`)) {
                    window.coordinatesDB.deleteSoundTiming(this.selectedSoundKey);
                    this.selectedSoundKey = Object.keys(window.coordinatesDB.getAllSoundTimings())[0] || 'voice_1';
                    this.renderVoiceSelector();
                    this.showNotification('دەنگەکە سڕدرایەوە 🗑️');
                }
            };
        }

        // Live Test with Lip Sync
        const btnTestLive = document.getElementById('btn-dev-voice-test-live');
        if (btnTestLive) {
            btnTestLive.onclick = () => this.testLiveVoiceSync(this.selectedSoundKey);
        }

        const btnTestVoiceOld = document.getElementById('btn-dev-test-sound-voice');
        if (btnTestVoiceOld) {
            btnTestVoiceOld.onclick = () => this.testLiveVoiceSync(this.selectedSoundKey);
        }

        // Export Voice Timings
        const btnExportVoice = document.getElementById('btn-dev-voice-export');
        if (btnExportVoice) {
            btnExportVoice.onclick = () => {
                this.exportTab = 'sound';
                this.openExportModal();
            };
        }
    }

    updateSoundTimingControls() {
        const item = window.coordinatesDB.getSoundTiming(this.selectedSoundKey);
        if (!item) return;

        // File Path input
        const fileInput = document.getElementById('dev-voice-input-file');
        if (fileInput) {
            fileInput.value = item.file || '';
            fileInput.oninput = (e) => {
                item.file = e.target.value.trim();
                window.coordinatesDB.setSoundTiming(this.selectedSoundKey, item);
            };
        }

        // Duration Slider & Number (Dedicated Voice Panel)
        this.syncControl('dev-voice-input-dur', 'dev-voice-slider-dur', item.durationMs || 2000, 200, 8000, 50, val => {
            item.durationMs = parseInt(val);
            window.coordinatesDB.setSoundTiming(this.selectedSoundKey, item);
        });

        // Talk Speed Slider & Number (Dedicated Voice Panel)
        this.syncControl('dev-voice-input-speed', 'dev-voice-slider-speed', item.talkSpeed || 100, 30, 250, 5, val => {
            item.talkSpeed = parseInt(val);
            window.coordinatesDB.setSoundTiming(this.selectedSoundKey, item);
        });

        // Sync old sound timing controls in Attacks tab as well
        this.syncControl('dev-input-snd-dur', 'dev-slider-snd-dur', item.durationMs || 2000, 200, 8000, 50, val => {
            item.durationMs = parseInt(val);
            window.coordinatesDB.setSoundTiming(this.selectedSoundKey, item);
        });

        this.syncControl('dev-input-snd-speed', 'dev-slider-snd-speed', item.talkSpeed || 100, 30, 250, 5, val => {
            item.talkSpeed = parseInt(val);
            window.coordinatesDB.setSoundTiming(this.selectedSoundKey, item);
        });
    }

    testLiveVoiceSync(soundKey) {
        const item = window.coordinatesDB.getSoundTiming(soundKey);
        if (!item) return;

        const dur = item.durationMs || 2000;
        const speed = item.talkSpeed || 100;

        // Play audio file
        if (item.file) {
            window.soundEngine.playAudioFile(item.file, 1.0);
        } else if (soundKey === 'slap_sound') window.soundEngine.playAttackSound('slap');
        else if (soundKey === 'karate_sound') window.soundEngine.playAttackSound('Karate');
        else if (soundKey === 'choke_sound') window.soundEngine.playAttackSound('choking');
        else if (soundKey === 'eyepop_sound') window.soundEngine.playAttackSound('eye_popping');

        // Play Lip-Sync animation on stage character
        window.characterModel.startTalking(dur, speed);
        this.showNotification(`🔊 تاقیکردنەوەی دەنگ: "${item.name || soundKey}" (${dur}ms, خێرایی دەم: ${speed}ms)`);
    }

    testSoundTiming() {
        this.testLiveVoiceSync(this.selectedSoundKey);
    }

    syncControl(numId, sliderId, initialVal, min, max, step, onChange) {
        const numEl = document.getElementById(numId);
        const sliderEl = document.getElementById(sliderId);

        if (numEl) {
            numEl.min = min; numEl.max = max; numEl.step = step;
            numEl.value = initialVal;
            numEl.oninput = (e) => {
                const val = e.target.value;
                if (sliderEl) sliderEl.value = val;
                onChange(val);
            };
        }

        if (sliderEl) {
            sliderEl.min = min; sliderEl.max = max; sliderEl.step = step;
            sliderEl.value = initialVal;
            sliderEl.oninput = (e) => {
                const val = e.target.value;
                if (numEl) numEl.value = val;
                onChange(val);
            };
        }
    }

    renderStage() {
        if (!this.stageContainer) return;
        const targetWrapper = this.stageContainer.querySelector('.dev-stage-wrapper') || this.stageContainer;
        window.characterModel.render(targetWrapper, {
            onPartClick: (cat, item) => {
                if (this.studioMode !== 'body') return;
                this.selectedCategory = cat;
                this.selectedItem = item;
                const catSelect = document.getElementById('dev-cat-select');
                if (catSelect) catSelect.value = cat;
                this.updateItemPreviewOptions();
                this.updateBodyControls();
                this.highlightSelectedPart();
            }
        });
        this.highlightSelectedPart();
        if (this.studioMode === 'attacks') {
            this.renderCuteCutStageLayers();
        }
    }

    highlightSelectedPart() {
        this.stageContainer.querySelectorAll('.mv-part').forEach(p => p.classList.remove('dev-highlight'));
        if (this.studioMode === 'body') {
            const activePart = this.stageContainer.querySelector(`.mv-part-${this.selectedCategory}`);
            if (activePart) {
                activePart.classList.add('dev-highlight');
            }
        }
    }

    // =========================================================================
    // Weapons & Swords Studio Core Methods
    // =========================================================================

    getActiveWeaponId() {
        if (this.selectedWeaponCategory === 'swords') return this.selectedSwordWeaponId || 'katana';
        if (this.selectedWeaponCategory === 'special') return this.selectedSpecialWeaponId || 'shuriken';
        return this.selectedShootingWeaponId || 'akm';
    }

    getActiveWeaponConfig() {
        const db = window.coordinatesDB;
        const id = this.getActiveWeaponId();
        if (this.selectedWeaponCategory === 'swords') {
            return (db && db.getSwordConfig(id)) || {
                id: id,
                name: id,
                category: 'swords',
                folder: `attaker/swords/${id}`,
                frames: ['frame1.png'],
                sound: 'assets/sounds/slap.mp3',
                damage: 40,
                scale: 0.35,
                scaleX: 1.0,
                scaleY: 1.0,
                rotation: 0,
                slashDuration: 200,
                minSwipeDist: 35,
                bloodScale: 0.45,
                bloodDuration: 2500
            };
        }
        if (this.selectedWeaponCategory === 'special') {
            return (db && db.getSpecialConfig(id)) || {
                id: id,
                name: id,
                category: 'special',
                folder: `attaker/special/${id}`,
                frames: id === 'scorpion' ? ['hand.png', 'head.png', 'chain.png'] : ['frame1.png'],
                sound: id === 'shuriken' ? 'attaker/special/shuriken/shuriken.mp3' : 'attaker/special/scorpion/chain.mp3',
                damage: 35,
                scale: 0.25,
                scaleX: 1.0,
                scaleY: 1.0,
                rotation: 0,
                orbitRadius: 52,
                spinSpeed: 720,
                throwSpeed: 1400,
                stickDuration: 4500,
                bloodScale: 0.40,
                bloodDuration: 2500
            };
        }
        // Shooting
        return (db && db.getShootingConfig(id)) || {
            id: id,
            name: id,
            category: 'shooting',
            folder: `attaker/shooting/${id}`,
            frames: ['frame1.png', 'frame2.png', 'frame3.png'],
            bullet: 'bullet.png',
            sound: `attaker/shooting/${id}/${id}_single_fire.mp3`,
            damage: 35,
            scale: 0.55,
            scaleX: 1.0,
            scaleY: 1.0,
            rotation: 0,
            muzzleOffset: { x: 140, y: -8 },
            bulletSpeed: 2200,
            bulletScale: 0.45,
            frameSpeed: 65,
            recoilKick: 15,
            bloodScale: 0.40,
            bloodDuration: 2400
        };
    }

    getActiveShootingConfig() {
        return this.getActiveWeaponConfig();
    }

    saveActiveWeaponConfig(cfg) {
        const db = window.coordinatesDB;
        if (!db) return;
        const id = this.getActiveWeaponId();
        if (this.selectedWeaponCategory === 'swords') {
            db.setSwordConfig(id, cfg);
        } else if (this.selectedWeaponCategory === 'special') {
            db.setSpecialConfig(id, cfg);
        } else {
            db.setShootingConfig(id, cfg);
        }
    }

    setWeaponCategory(cat) {
        this.selectedWeaponCategory = cat;
        ['shooting', 'swords', 'special'].forEach(c => {
            const btn = document.getElementById(`btn-dev-cat-${c}`);
            if (btn) btn.classList.toggle('active', c === cat);
        });

        const shootGroup = document.getElementById('dev-group-shooting-specific');
        const swordGroup = document.getElementById('dev-group-swords-specific');
        const specialGroup = document.getElementById('dev-group-special-specific');
        if (shootGroup) shootGroup.style.display = (cat === 'shooting') ? 'block' : 'none';
        if (swordGroup) swordGroup.style.display = (cat === 'swords') ? 'block' : 'none';
        if (specialGroup) specialGroup.style.display = (cat === 'special') ? 'block' : 'none';

        const testShoot = document.getElementById('dev-test-row-shooting');
        const testSword = document.getElementById('dev-test-row-swords');
        const testSpecial = document.getElementById('dev-test-row-special');
        if (testShoot) testShoot.style.display = (cat === 'shooting') ? 'grid' : 'none';
        if (testSword) testSword.style.display = (cat === 'swords') ? 'block' : 'none';
        if (testSpecial) testSpecial.style.display = (cat === 'special') ? 'block' : 'none';

        this.selectedShootingFrame = 'frame1.png';
        this.renderShootingWeaponSelector();
        this.renderShootingFramePicker();
        this.updateShootingControls();
        this.renderShootingStagePreview();
    }

    renderShootingWeaponSelector() {
        const select = document.getElementById('dev-shooting-weapon-select');
        if (!select) return;

        select.innerHTML = '';
        let map = {};

        if (this.selectedWeaponCategory === 'swords') {
            map = (window.coordinatesDB && window.coordinatesDB.getAllSwordConfigs()) || {};
            const keys = Object.keys(map);
            if (keys.length === 0) keys.push('katana', 'knight', 'minecraft');
            if (!keys.includes(this.selectedSwordWeaponId)) {
                this.selectedSwordWeaponId = keys[0] || 'katana';
            }
            keys.forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (map[id] && map[id].name) ? map[id].name : id;
                if (id === this.selectedSwordWeaponId) opt.selected = true;
                select.appendChild(opt);
            });
        } else if (this.selectedWeaponCategory === 'special') {
            map = (window.coordinatesDB && window.coordinatesDB.getAllSpecialConfigs()) || {};
            const keys = Object.keys(map);
            if (keys.length === 0) keys.push('shuriken', 'scorpion');
            if (!keys.includes(this.selectedSpecialWeaponId)) {
                this.selectedSpecialWeaponId = keys[0] || 'shuriken';
            }
            keys.forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (map[id] && map[id].name) ? map[id].name : id;
                if (id === this.selectedSpecialWeaponId) opt.selected = true;
                select.appendChild(opt);
            });
        } else {
            // Shooting
            map = (window.coordinatesDB && window.coordinatesDB.getAllShootingConfigs()) || {};
            const keys = Object.keys(map);
            if (keys.length === 0) keys.push('akm', 'm4', 'kar98k', 'pistol', 'shotgun');
            if (!keys.includes(this.selectedShootingWeaponId)) {
                this.selectedShootingWeaponId = keys[0] || 'akm';
            }
            keys.forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = (map[id] && map[id].name) ? map[id].name : id;
                if (id === this.selectedShootingWeaponId) opt.selected = true;
                select.appendChild(opt);
            });
        }

        select.onchange = (e) => {
            if (this.selectedWeaponCategory === 'swords') {
                this.selectedSwordWeaponId = e.target.value;
            } else if (this.selectedWeaponCategory === 'special') {
                this.selectedSpecialWeaponId = e.target.value;
            } else {
                this.selectedShootingWeaponId = e.target.value;
            }
            this.selectedShootingFrame = 'frame1.png';
            this.renderShootingFramePicker();
            this.updateShootingControls();
            this.renderShootingStagePreview();
        };
    }

    renderShootingFramePicker() {
        const select = document.getElementById('dev-shooting-frame-select');
        const chipsContainer = document.getElementById('dev-shooting-frame-chips');
        const weapCfg = this.getActiveWeaponConfig();
        const curId = this.getActiveWeaponId();
        const folder = weapCfg.folder || (this.selectedWeaponCategory === 'swords' ? `attaker/swords/${curId}` : (this.selectedWeaponCategory === 'special' ? `attaker/special/${curId}` : `attaker/shooting/${curId}`));

        let frames = [];
        if (this.selectedWeaponCategory === 'swords') {
            frames = ['frame1.png'];
        } else if (this.selectedWeaponCategory === 'special') {
            frames = (curId === 'scorpion') ? ['hand.png', 'head.png', 'chain.png'] : ['frame1.png'];
        } else {
            frames = (weapCfg.frames || ['frame1.png', 'frame2.png', 'frame3.png']).slice();
            if (weapCfg.bullet && !frames.includes(weapCfg.bullet)) {
                frames.push(weapCfg.bullet);
            }
        }

        if (!frames.includes(this.selectedShootingFrame)) {
            this.selectedShootingFrame = frames[0] || 'frame1.png';
        }

        if (select) {
            select.innerHTML = '';
            frames.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                if (f === this.selectedShootingFrame) opt.selected = true;
                select.appendChild(opt);
            });

            select.onchange = (e) => {
                this.selectedShootingFrame = e.target.value;
                this.renderShootingFramePicker();
                this.updateShootingControls();
                this.renderShootingStagePreview();
            };
        }

        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            frames.forEach(f => {
                const chip = document.createElement('div');
                chip.className = `dev-shooting-chip ${f === this.selectedShootingFrame ? 'active' : ''}`;
                chip.innerHTML = `
                    <img src="${encodeURI(folder + '/' + f)}" alt="${f}" onerror="this.style.display='none';">
                    <span>${f}</span>
                `;
                chip.onclick = () => {
                    this.selectedShootingFrame = f;
                    if (select) select.value = f;
                    this.renderShootingFramePicker();
                    this.updateShootingControls();
                    this.renderShootingStagePreview();
                };
                chipsContainer.appendChild(chip);
            });
        }
    }

    updateShootingControls() {
        const weapon = this.getActiveWeaponConfig();
        if (!weapon) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val !== undefined ? val : 0;
        };

        const currentFrame = this.selectedShootingFrame || 'frame1.png';
        if (!weapon.frameOffsets) weapon.frameOffsets = {};
        const fOffset = weapon.frameOffsets[currentFrame] || {
            x: 0,
            y: 0,
            scale: weapon.scale || 0.55,
            scaleX: weapon.scaleX !== undefined ? weapon.scaleX : 1.0,
            scaleY: weapon.scaleY !== undefined ? weapon.scaleY : 1.0,
            rotation: weapon.rotation || 0
        };

        // Per-Frame Coordinates and Size Sliders
        setVal('dev-shooting-slider-frame-x', fOffset.x || 0);
        setVal('dev-shooting-input-frame-x', fOffset.x || 0);
        setVal('dev-shooting-slider-frame-y', fOffset.y || 0);
        setVal('dev-shooting-input-frame-y', fOffset.y || 0);
        setVal('dev-shooting-slider-frame-scale', fOffset.scale !== undefined ? fOffset.scale : (weapon.scale || 0.55));
        setVal('dev-shooting-input-frame-scale', fOffset.scale !== undefined ? fOffset.scale : (weapon.scale || 0.55));
        setVal('dev-shooting-slider-frame-scaleX', fOffset.scaleX !== undefined ? fOffset.scaleX : (weapon.scaleX !== undefined ? weapon.scaleX : 1.0));
        setVal('dev-shooting-input-frame-scaleX', fOffset.scaleX !== undefined ? fOffset.scaleX : (weapon.scaleX !== undefined ? weapon.scaleX : 1.0));
        setVal('dev-shooting-slider-frame-scaleY', fOffset.scaleY !== undefined ? fOffset.scaleY : (weapon.scaleY !== undefined ? weapon.scaleY : 1.0));
        setVal('dev-shooting-input-frame-scaleY', fOffset.scaleY !== undefined ? fOffset.scaleY : (weapon.scaleY !== undefined ? weapon.scaleY : 1.0));
        setVal('dev-shooting-slider-frame-rot', fOffset.rotation || 0);
        setVal('dev-shooting-input-frame-rot', fOffset.rotation || 0);

        // Overall weapon controls
        setVal('dev-shooting-slider-scale', weapon.scale || 0.55);
        setVal('dev-shooting-input-scale', weapon.scale || 0.55);
        setVal('dev-shooting-slider-scaleX', weapon.scaleX !== undefined ? weapon.scaleX : 1.0);
        setVal('dev-shooting-input-scaleX', weapon.scaleX !== undefined ? weapon.scaleX : 1.0);
        setVal('dev-shooting-slider-scaleY', weapon.scaleY !== undefined ? weapon.scaleY : 1.0);
        setVal('dev-shooting-input-scaleY', weapon.scaleY !== undefined ? weapon.scaleY : 1.0);
        setVal('dev-shooting-slider-rot', weapon.rotation || 0);
        setVal('dev-shooting-input-rot', weapon.rotation || 0);
        setVal('dev-shooting-slider-damage', weapon.damage || 35);
        setVal('dev-shooting-input-damage', weapon.damage || 35);

        // Shooting specific
        const mOffset = weapon.muzzleOffset || { x: 140, y: -8 };
        setVal('dev-shooting-slider-muzzleX', mOffset.x !== undefined ? mOffset.x : 140);
        setVal('dev-shooting-input-muzzleX', mOffset.x !== undefined ? mOffset.x : 140);
        setVal('dev-shooting-slider-muzzleY', mOffset.y !== undefined ? mOffset.y : -8);
        setVal('dev-shooting-input-muzzleY', mOffset.y !== undefined ? mOffset.y : -8);

        const fModes = weapon.fireModes || {
            single: { enabled: true },
            burst: { enabled: true, count: 3, intervalMs: 80 },
            rapid: { enabled: true, intervalMs: 110 }
        };
        const chkSingle = document.getElementById('dev-shooting-mode-single');
        if (chkSingle) chkSingle.checked = (fModes.single ? fModes.single.enabled !== false : true);
        const chkBurst = document.getElementById('dev-shooting-mode-burst');
        if (chkBurst) chkBurst.checked = (fModes.burst ? fModes.burst.enabled !== false : true);
        const chkRapid = document.getElementById('dev-shooting-mode-rapid');
        if (chkRapid) chkRapid.checked = (fModes.rapid ? fModes.rapid.enabled !== false : true);

        setVal('dev-shooting-slider-burst-count', fModes.burst?.count || 3);
        setVal('dev-shooting-input-burst-count', fModes.burst?.count || 3);
        setVal('dev-shooting-slider-burst-interval', fModes.burst?.intervalMs || 80);
        setVal('dev-shooting-input-burst-interval', fModes.burst?.intervalMs || 80);
        setVal('dev-shooting-slider-rapid-interval', fModes.rapid?.intervalMs || 110);
        setVal('dev-shooting-input-rapid-interval', fModes.rapid?.intervalMs || 110);

        setVal('dev-shooting-slider-fspeed', weapon.frameSpeed || 65);
        setVal('dev-shooting-input-fspeed', weapon.frameSpeed || 65);
        setVal('dev-shooting-slider-bspeed', weapon.bulletSpeed || 2200);
        setVal('dev-shooting-input-bspeed', weapon.bulletSpeed || 2200);
        setVal('dev-shooting-slider-bscale', weapon.bulletScale || 0.45);
        setVal('dev-shooting-input-bscale', weapon.bulletScale || 0.45);
        setVal('dev-shooting-slider-recoil', weapon.recoilKick || 15);
        setVal('dev-shooting-input-recoil', weapon.recoilKick || 15);

        // Swords specific
        setVal('dev-swords-slider-duration', weapon.slashDuration || 200);
        setVal('dev-swords-input-duration', weapon.slashDuration || 200);
        setVal('dev-swords-slider-min-swipe', weapon.minSwipeDist || 35);
        setVal('dev-swords-input-min-swipe', weapon.minSwipeDist || 35);

        // Special specific
        setVal('dev-special-slider-orbit', weapon.orbitRadius || 52);
        setVal('dev-special-input-orbit', weapon.orbitRadius || 52);
        setVal('dev-special-slider-speed', weapon.spinSpeed || weapon.throwSpeed || 1400);
        setVal('dev-special-input-speed', weapon.spinSpeed || weapon.throwSpeed || 1400);
        setVal('dev-special-slider-stick', weapon.stickDuration || 4500);
        setVal('dev-special-input-stick', weapon.stickDuration || 4500);

        // Blood Zone Sliders
        const bz = weapon.bloodZone || { centerY: 240, spreadY: 150, spreadX: 110 };
        setVal('dev-shooting-slider-blood-centery', bz.centerY !== undefined ? bz.centerY : 240);
        setVal('dev-shooting-input-blood-centery', bz.centerY !== undefined ? bz.centerY : 240);
        setVal('dev-shooting-slider-blood-spready', bz.spreadY !== undefined ? bz.spreadY : 150);
        setVal('dev-shooting-input-blood-spready', bz.spreadY !== undefined ? bz.spreadY : 150);
        setVal('dev-shooting-slider-blood-spreadx', bz.spreadX !== undefined ? bz.spreadX : 110);
        setVal('dev-shooting-input-blood-spreadx', bz.spreadX !== undefined ? bz.spreadX : 110);

        setVal('dev-shooting-slider-bloodscale', weapon.bloodScale || 0.40);
        setVal('dev-shooting-input-bloodscale', weapon.bloodScale || 0.40);
        setVal('dev-shooting-slider-blooddur', weapon.bloodDuration || 2400);
        setVal('dev-shooting-input-blooddur', weapon.bloodDuration || 2400);

        const sndInput = document.getElementById('dev-shooting-input-sound');
        if (sndInput) sndInput.value = weapon.sound || '';
    }

    renderShootingStagePreview() {
        if (!this.attackPreviewFxEl) return;
        if (this.studioMode !== 'shooting') return;

        const stageW = (this.stageContainer && this.stageContainer.clientWidth) || 800;
        const stageH = (this.stageContainer && this.stageContainer.clientHeight) || 600;
        const previewX = Math.round(stageW * 0.70);
        const previewY = Math.round(stageH * 0.45);

        if (this.selectedWeaponCategory === 'swords') {
            const sw = this.getActiveWeaponConfig();
            const curId = this.getActiveWeaponId();
            const folder = sw.folder || `attaker/swords/${curId}`;
            const frameFile = 'frame1.png';
            const globalScale = sw.scale !== undefined ? sw.scale : 0.35;
            const scaleX = (sw.scaleX !== undefined ? sw.scaleX : 1.0) * globalScale;
            const scaleY = (sw.scaleY !== undefined ? sw.scaleY : 1.0) * globalScale;
            const rot = (sw.rotation !== undefined ? sw.rotation : 0) - 35;

            this.attackPreviewFxEl.style.display = 'block';
            this.attackPreviewFxEl.innerHTML = `
                <div style="position: absolute; left: ${previewX}px; top: ${previewY}px; transform: translate(-50%, -50%); pointer-events: none; z-index: 90;">
                    <div style="position: relative; display: inline-block;">
                        <img src="${encodeURI(folder + '/' + frameFile)}" alt="sword-preview" draggable="false"
                             style="display: block; transform: scale(${scaleX}, ${scaleY}) rotate(${rot}deg); transform-origin: 50% 88%; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.65));">
                    </div>
                    <div style="text-align: center; color: #f1c40f; font-weight: 800; font-size: 0.8rem; margin-top: 8px; background: rgba(0,0,0,0.6); border-radius: 8px; padding: 2px 6px;">
                        ⚔️ ${sw.name || curId} (${frameFile})
                    </div>
                </div>
            `;
            return;
        }

        if (this.selectedWeaponCategory === 'special') {
            const sp = this.getActiveWeaponConfig();
            const spId = this.getActiveWeaponId();

            if (spId === 'shuriken') {
                const scale = (sp.scale || 0.22);
                this.attackPreviewFxEl.style.display = 'block';
                this.attackPreviewFxEl.innerHTML = `
                    <div style="position: absolute; left: ${previewX}px; top: ${previewY}px; transform: translate(-50%, -50%); pointer-events: none; z-index: 90;">
                        <div style="position: relative; display: inline-block; animation: spin 1.5s linear infinite;">
                            <img src="attaker/special/shuriken/frame1.png" alt="shuriken-preview" draggable="false"
                                 style="display: block; transform: scale(${scale}) rotate(${sp.rotation || 0}deg); filter: drop-shadow(0 8px 20px rgba(0,0,0,0.65));">
                        </div>
                        <div style="text-align: center; color: #a29bfe; font-weight: 800; font-size: 0.8rem; margin-top: 8px; background: rgba(0,0,0,0.6); border-radius: 8px; padding: 2px 6px;">
                            🌀 ${sp.name || 'شووریکەن'}
                        </div>
                    </div>
                `;
                return;
            } else if (spId === 'scorpion') {
                this.attackPreviewFxEl.style.display = 'block';
                this.attackPreviewFxEl.innerHTML = `
                    <div style="position: absolute; left: ${previewX}px; top: ${previewY}px; transform: translate(-50%, -50%); pointer-events: none; z-index: 90;">
                        <div style="position: relative; display: flex; align-items: center; gap: 10px;">
                            <img src="attaker/special/scorpion/hand.png" alt="scorpion-hand" draggable="false"
                                 style="height: 60px; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6));">
                            <img src="attaker/special/scorpion/head.png" alt="scorpion-head" draggable="false"
                                 style="height: 50px; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6));">
                        </div>
                        <div style="text-align: center; color: #fdcb6e; font-weight: 800; font-size: 0.8rem; margin-top: 8px; background: rgba(0,0,0,0.6); border-radius: 8px; padding: 2px 6px;">
                            🦂 ${sp.name || 'دەستی سکۆرپیۆن'}
                        </div>
                    </div>
                `;
                return;
            }
        }

        // Shooting Gun Preview
        const gun = this.getActiveShootingConfig();
        const curGunId = this.getActiveWeaponId();
        const folder = gun.folder || `attaker/shooting/${curGunId}`;
        const frameFile = this.selectedShootingFrame || 'frame1.png';

        const BASE_GUN_SCALE = 0.28;
        const fOffset = (gun.frameOffsets && gun.frameOffsets[frameFile]) ? gun.frameOffsets[frameFile] : {};
        
        const globalScale = (gun.scale !== undefined) ? gun.scale : 1.0;
        const frameScaleMul = (fOffset.scale !== undefined ? fOffset.scale : 1.0);
        const totalScale = globalScale * frameScaleMul * BASE_GUN_SCALE;

        const globalSx = (gun.scaleX !== undefined ? gun.scaleX : 1.0);
        const frameSx = (fOffset.scaleX !== undefined ? fOffset.scaleX : 1.0);
        const scaleX = globalSx * frameSx * totalScale;

        const globalSy = (gun.scaleY !== undefined ? gun.scaleY : 1.0);
        const frameSy = (fOffset.scaleY !== undefined ? fOffset.scaleY : 1.0);
        const scaleY = globalSy * frameSy * totalScale;

        const globalRot = (gun.rotation !== undefined ? gun.rotation : 0);
        const frameRot = (fOffset.rotation !== undefined ? fOffset.rotation : 0);
        const rot = globalRot + frameRot;

        const pX = previewX + ((fOffset.x || 0) * globalScale);
        const pY = previewY + ((fOffset.y || 0) * globalScale);

        const mOffset = gun.muzzleOffset || { x: 143, y: -20 };
        const muzzleIndicatorX = (mOffset.x + (fOffset.x || 0)) * (globalScale * frameScaleMul);
        const muzzleIndicatorY = (mOffset.y + (fOffset.y || 0)) * (globalScale * frameScaleMul);

        this.attackPreviewFxEl.style.display = 'block';
        this.attackPreviewFxEl.innerHTML = `
            <div style="position: absolute; left: ${pX}px; top: ${pY}px; transform: translate(-50%, -50%); pointer-events: none; z-index: 90;">
                <div style="position: relative; display: inline-block;">
                    <img src="${encodeURI(folder + '/' + frameFile)}" alt="shooting-preview" draggable="false"
                         style="display: block; transform: scale(${scaleX}, ${scaleY}) rotate(${rot}deg); transform-origin: center center; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.65));">
                    <div class="dev-muzzle-crosshair" title="خاڵی دەرچوونی فیشەک (Muzzle Point)"
                         style="left: calc(50% + ${muzzleIndicatorX}px); top: calc(50% + ${muzzleIndicatorY}px);"></div>
                </div>
                <div style="text-align: center; color: #ffa502; font-weight: 800; font-size: 0.8rem; margin-top: 8px; background: rgba(0,0,0,0.6); border-radius: 8px; padding: 2px 6px;">
                    ${gun.name || curGunId} (${frameFile})
                </div>
            </div>
        `;
    }

    bindShootingEvents() {
        // Weapon Category Switchers
        const btnCatShooting = document.getElementById('btn-dev-cat-shooting');
        const btnCatSwords = document.getElementById('btn-dev-cat-swords');
        const btnCatSpecial = document.getElementById('btn-dev-cat-special');

        if (btnCatShooting) btnCatShooting.onclick = () => { window.soundEngine?.playButton(); this.setWeaponCategory('shooting'); };
        if (btnCatSwords) btnCatSwords.onclick = () => { window.soundEngine?.playButton(); this.setWeaponCategory('swords'); };
        if (btnCatSpecial) btnCatSpecial.onclick = () => { window.soundEngine?.playButton(); this.setWeaponCategory('special'); };

        const bindPair = (sliderId, inputId, key, isFloat = false, parentKey = null) => {
            const slider = document.getElementById(sliderId);
            const input = document.getElementById(inputId);
            if (!slider || !input) return;

            const update = (val) => {
                const num = isFloat ? parseFloat(val) : parseInt(val);
                if (isNaN(num)) return;
                const weapon = this.getActiveWeaponConfig();
                if (parentKey) {
                    if (!weapon[parentKey]) weapon[parentKey] = {};
                    weapon[parentKey][key] = num;
                } else {
                    weapon[key] = num;
                }
                slider.value = num;
                input.value = num;
                this.renderShootingStagePreview();
                this.saveActiveWeaponConfig(weapon);
            };

            slider.oninput = (e) => update(e.target.value);
            input.onchange = (e) => update(e.target.value);
        };

        // Per-Frame Sliders
        const bindFrameSlider = (sliderId, inputId, prop, isFloat = false) => {
            const slider = document.getElementById(sliderId);
            const input = document.getElementById(inputId);
            if (!slider || !input) return;

            const update = (val) => {
                const num = isFloat ? parseFloat(val) : parseInt(val);
                if (isNaN(num)) return;
                const weapon = this.getActiveWeaponConfig();
                const curFrame = this.selectedShootingFrame || 'frame1.png';
                if (!weapon.frameOffsets) weapon.frameOffsets = {};
                if (!weapon.frameOffsets[curFrame]) {
                    weapon.frameOffsets[curFrame] = {
                        x: 0,
                        y: 0,
                        scale: weapon.scale || 1.0,
                        scaleX: 1.0,
                        scaleY: 1.0,
                        rotation: 0
                    };
                }
                weapon.frameOffsets[curFrame][prop] = num;
                this.saveActiveWeaponConfig(weapon);
                slider.value = num;
                input.value = num;
                this.renderShootingStagePreview();
            };

            slider.oninput = (e) => update(e.target.value);
            input.onchange = (e) => update(e.target.value);
        };

        bindFrameSlider('dev-shooting-slider-frame-x', 'dev-shooting-input-frame-x', 'x', false);
        bindFrameSlider('dev-shooting-slider-frame-y', 'dev-shooting-input-frame-y', 'y', false);
        bindFrameSlider('dev-shooting-slider-frame-scale', 'dev-shooting-input-frame-scale', 'scale', true);
        bindFrameSlider('dev-shooting-slider-frame-scaleX', 'dev-shooting-input-frame-scaleX', 'scaleX', true);
        bindFrameSlider('dev-shooting-slider-frame-scaleY', 'dev-shooting-input-frame-scaleY', 'scaleY', true);
        bindFrameSlider('dev-shooting-slider-frame-rot', 'dev-shooting-input-frame-rot', 'rotation', false);

        // Global Weapon Sliders
        bindPair('dev-shooting-slider-scale', 'dev-shooting-input-scale', 'scale', true);
        bindPair('dev-shooting-slider-scaleX', 'dev-shooting-input-scaleX', 'scaleX', true);
        bindPair('dev-shooting-slider-scaleY', 'dev-shooting-input-scaleY', 'scaleY', true);
        bindPair('dev-shooting-slider-rot', 'dev-shooting-input-rot', 'rotation', false);
        bindPair('dev-shooting-slider-damage', 'dev-shooting-input-damage', 'damage', false);

        // Shooting specific bindings
        bindPair('dev-shooting-slider-muzzleX', 'dev-shooting-input-muzzleX', 'x', false, 'muzzleOffset');
        bindPair('dev-shooting-slider-muzzleY', 'dev-shooting-input-muzzleY', 'y', false, 'muzzleOffset');

        const chkSingle = document.getElementById('dev-shooting-mode-single');
        if (chkSingle) {
            chkSingle.onchange = (e) => {
                const gun = this.getActiveWeaponConfig();
                if (!gun.fireModes) gun.fireModes = {};
                if (!gun.fireModes.single) gun.fireModes.single = {};
                gun.fireModes.single.enabled = e.target.checked;
                this.saveActiveWeaponConfig(gun);
            };
        }
        const chkBurst = document.getElementById('dev-shooting-mode-burst');
        if (chkBurst) {
            chkBurst.onchange = (e) => {
                const gun = this.getActiveWeaponConfig();
                if (!gun.fireModes) gun.fireModes = {};
                if (!gun.fireModes.burst) gun.fireModes.burst = {};
                gun.fireModes.burst.enabled = e.target.checked;
                this.saveActiveWeaponConfig(gun);
            };
        }
        const chkRapid = document.getElementById('dev-shooting-mode-rapid');
        if (chkRapid) {
            chkRapid.onchange = (e) => {
                const gun = this.getActiveWeaponConfig();
                if (!gun.fireModes) gun.fireModes = {};
                if (!gun.fireModes.rapid) gun.fireModes.rapid = {};
                gun.fireModes.rapid.enabled = e.target.checked;
                this.saveActiveWeaponConfig(gun);
            };
        }

        const bindFireModeParam = (sliderId, inputId, mode, key) => {
            const slider = document.getElementById(sliderId);
            const input = document.getElementById(inputId);
            if (!slider || !input) return;

            const onUpdate = (val) => {
                const num = parseInt(val, 10);
                slider.value = num;
                input.value = num;
                const gun = this.getActiveWeaponConfig();
                if (!gun.fireModes) gun.fireModes = {};
                if (!gun.fireModes[mode]) gun.fireModes[mode] = {};
                gun.fireModes[mode][key] = num;
                this.saveActiveWeaponConfig(gun);
            };
            slider.oninput = (e) => onUpdate(e.target.value);
            input.oninput = (e) => onUpdate(e.target.value);
        };

        bindFireModeParam('dev-shooting-slider-burst-count', 'dev-shooting-input-burst-count', 'burst', 'count');
        bindFireModeParam('dev-shooting-slider-burst-interval', 'dev-shooting-input-burst-interval', 'burst', 'intervalMs');
        bindFireModeParam('dev-shooting-slider-rapid-interval', 'dev-shooting-input-rapid-interval', 'rapid', 'intervalMs');

        bindPair('dev-shooting-slider-fspeed', 'dev-shooting-input-fspeed', 'frameSpeed', false);
        bindPair('dev-shooting-slider-bspeed', 'dev-shooting-input-bspeed', 'bulletSpeed', false);
        bindPair('dev-shooting-slider-bscale', 'dev-shooting-input-bscale', 'bulletScale', true);
        bindPair('dev-shooting-slider-recoil', 'dev-shooting-input-recoil', 'recoilKick', false);

        // Swords Specific Bindings
        bindPair('dev-swords-slider-duration', 'dev-swords-input-duration', 'slashDuration', false);
        bindPair('dev-swords-slider-min-swipe', 'dev-swords-input-min-swipe', 'minSwipeDist', false);

        // Special Specific Bindings
        bindPair('dev-special-slider-orbit', 'dev-special-input-orbit', 'orbitRadius', false);
        bindPair('dev-special-slider-stick', 'dev-special-input-stick', 'stickDuration', false);
        const specialSpeedSlider = document.getElementById('dev-special-slider-speed');
        const specialSpeedInput = document.getElementById('dev-special-input-speed');
        if (specialSpeedSlider && specialSpeedInput) {
            const onUpdateSpeed = (val) => {
                const num = parseInt(val, 10);
                specialSpeedSlider.value = num;
                specialSpeedInput.value = num;
                const sp = this.getActiveWeaponConfig();
                sp.spinSpeed = num;
                sp.throwSpeed = num;
                this.saveActiveWeaponConfig(sp);
            };
            specialSpeedSlider.oninput = (e) => onUpdateSpeed(e.target.value);
            specialSpeedInput.oninput = (e) => onUpdateSpeed(e.target.value);
        }

        // Blood Zone Sliders
        const bindBloodZoneParam = (sliderId, inputId, key) => {
            const slider = document.getElementById(sliderId);
            const input = document.getElementById(inputId);
            if (!slider || !input) return;

            const onUpdate = (val) => {
                const num = parseInt(val, 10);
                slider.value = num;
                input.value = num;
                const weapon = this.getActiveWeaponConfig();
                if (!weapon.bloodZone) weapon.bloodZone = { centerY: 240, spreadY: 150, spreadX: 110 };
                weapon.bloodZone[key] = num;
                this.saveActiveWeaponConfig(weapon);
            };
            slider.oninput = (e) => onUpdate(e.target.value);
            input.oninput = (e) => onUpdate(e.target.value);
        };

        bindBloodZoneParam('dev-shooting-slider-blood-centery', 'dev-shooting-input-blood-centery', 'centerY');
        bindBloodZoneParam('dev-shooting-slider-blood-spready', 'dev-shooting-input-blood-spready', 'spreadY');
        bindBloodZoneParam('dev-shooting-slider-blood-spreadx', 'dev-shooting-input-blood-spreadx', 'spreadX');

        bindPair('dev-shooting-slider-bloodscale', 'dev-shooting-input-bloodscale', 'bloodScale', true);
        bindPair('dev-shooting-slider-blooddur', 'dev-shooting-input-blooddur', 'bloodDuration', false);

        const sndInput = document.getElementById('dev-shooting-input-sound');
        if (sndInput) {
            sndInput.oninput = (e) => {
                const weapon = this.getActiveWeaponConfig();
                weapon.sound = e.target.value.trim();
                this.saveActiveWeaponConfig(weapon);
            };
        }

        // Test Sound Button
        const btnTestSound = document.getElementById('btn-dev-shooting-test-sound');
        if (btnTestSound) {
            btnTestSound.onclick = () => {
                const weapon = this.getActiveWeaponConfig();
                if (window.soundEngine) {
                    if (weapon.sound) {
                        window.soundEngine.playAudioFile(weapon.sound, 1.0, false);
                    } else {
                        window.soundEngine.playAttackSound(this.getActiveWeaponId());
                    }
                }
            };
        }

        // Test Fire Left & Right
        const btnTestLeft = document.getElementById('btn-dev-shooting-test-left');
        if (btnTestLeft) {
            btnTestLeft.onclick = () => {
                const stageRect = this.stageContainer.getBoundingClientRect();
                const clickX = stageRect.width * 0.18;
                const clickY = stageRect.height * 0.42;
                this.fireDevShootingTest(clickX, clickY);
            };
        }

        const btnTestRight = document.getElementById('btn-dev-shooting-test-right');
        if (btnTestRight) {
            btnTestRight.onclick = () => {
                const stageRect = this.stageContainer.getBoundingClientRect();
                const clickX = stageRect.width * 0.82;
                const clickY = stageRect.height * 0.42;
                this.fireDevShootingTest(clickX, clickY);
            };
        }

        // Test Sword Slash Button
        const btnTestSword = document.getElementById('btn-dev-sword-test-slash');
        if (btnTestSword) {
            btnTestSword.onclick = () => {
                const stageRect = this.stageContainer.getBoundingClientRect();
                this.fireDevSwordTest(stageRect.width * 0.72, stageRect.height * 0.44);
            };
        }

        // Test Special Action Button
        const btnTestSpecial = document.getElementById('btn-dev-special-test-action');
        if (btnTestSpecial) {
            btnTestSpecial.onclick = () => {
                const stageRect = this.stageContainer.getBoundingClientRect();
                this.fireDevSpecialTest(stageRect.width * 0.75, stageRect.height * 0.44);
            };
        }

        // Test Blood
        const btnTestBlood = document.getElementById('btn-dev-shooting-test-blood');
        if (btnTestBlood) {
            btnTestBlood.onclick = () => this.testShootingBlood();
        }

        // Export Code
        const btnExport = document.getElementById('btn-dev-shooting-export');
        if (btnExport) {
            btnExport.onclick = () => {
                if (this.selectedWeaponCategory === 'swords') this.exportTab = 'swords';
                else if (this.selectedWeaponCategory === 'special') this.exportTab = 'special';
                else this.exportTab = 'shooting';
                this.openExportModal();
            };
        }

        // Add Weapon Form
        const btnAdd = document.getElementById('btn-dev-shooting-add-weapon');
        const formAdd = document.getElementById('dev-shooting-add-form');
        const btnCancel = document.getElementById('btn-dev-new-gun-cancel');
        const btnSave = document.getElementById('btn-dev-new-gun-save');

        if (btnAdd && formAdd) {
            btnAdd.onclick = () => { formAdd.style.display = 'block'; };
        }
        if (btnCancel && formAdd) {
            btnCancel.onclick = () => { formAdd.style.display = 'none'; };
        }
        if (btnSave) {
            btnSave.onclick = () => {
                const idInput = document.getElementById('dev-new-gun-id');
                const nameInput = document.getElementById('dev-new-gun-name');
                const folderInput = document.getElementById('dev-new-gun-folder');

                const newId = idInput ? idInput.value.trim().toLowerCase().replace(/\s+/g, '_') : '';
                const newName = nameInput ? nameInput.value.trim() : newId;
                const newFolder = folderInput ? folderInput.value.trim() : `attaker/shooting/${newId}`;

                if (!newId) {
                    alert('تکایە ناوی ناسێنەر بنووسە!');
                    return;
                }

                const newGun = {
                    id: newId,
                    name: newName || newId,
                    folder: newFolder,
                    frames: ['frame1.png', 'frame2.png', 'frame3.png'],
                    bullet: 'bullet.png',
                    sound: `${newFolder}/${newId}_single_fire.mp3`,
                    damage: 35,
                    scale: 0.55,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    rotation: 0,
                    muzzleOffset: { x: 140, y: -8 },
                    bulletSpeed: 2200,
                    bulletScale: 0.45,
                    frameSpeed: 65,
                    recoilKick: 15,
                    bloodScale: 0.40,
                    bloodDuration: 2400
                };

                if (window.coordinatesDB) {
                    window.coordinatesDB.addShootingWeapon(newId, newGun);
                }

                this.selectedShootingWeaponId = newId;
                this.renderShootingWeaponSelector();
                this.renderShootingFramePicker();
                this.updateShootingControls();
                this.renderShootingStagePreview();

                if (formAdd) formAdd.style.display = 'none';
                this.showNotification(`چەکی "${newName}" بە سەرکەوتوویی زیادکرا! 🔫`);
            };
        }

        // Delete Weapon Button
        const btnDelete = document.getElementById('btn-dev-shooting-del-weapon');
        if (btnDelete) {
            btnDelete.onclick = () => {
                const curId = this.getActiveWeaponId();
                const builtIns = ['akm', 'm4', 'kar98k', 'pistol', 'shotgun', 'katana', 'knight', 'minecraft', 'shuriken', 'scorpion'];
                if (builtIns.includes(curId)) {
                    alert('چەکەکانی سەرەکی یاری ناکرێت بسڕدرێنەوە!');
                    return;
                }
                if (confirm(`ئایا دڵنیایت دەتەوێت "${curId}" بسڕیتەوە؟`)) {
                    if (window.coordinatesDB) {
                        window.coordinatesDB.deleteShootingWeapon(curId);
                    }
                    this.selectedShootingWeaponId = 'akm';
                    this.renderShootingWeaponSelector();
                    this.renderShootingFramePicker();
                    this.updateShootingControls();
                    this.renderShootingStagePreview();
                    this.showNotification('چەکەکە سڕدرایەوە 🗑️');
                }
            };
        }

        // Stage click in weapons mode
        if (this.stageContainer && !this.stageContainer._shootingListenerWired) {
            this.stageContainer._shootingListenerWired = true;
            this.stageContainer.addEventListener('click', (e) => {
                if (this.studioMode !== 'shooting') return;
                // Don't fire if clicking transform box or control handles
                if (e.target.closest('#cutecut-transform-box') || e.target.closest('.cutecut-handle') || e.target.closest('.dev-controls-col')) return;

                const rect = this.stageContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                if (this.selectedWeaponCategory === 'swords') {
                    this.fireDevSwordTest(clickX, clickY);
                } else if (this.selectedWeaponCategory === 'special') {
                    this.fireDevSpecialTest(clickX, clickY);
                } else {
                    this.fireDevShootingTest(clickX, clickY);
                }
            });
        }
    }

    fireDevShootingTest(clickX, clickY) {
        const gunCfg = this.getActiveShootingConfig();
        const stageW = (this.stageContainer && this.stageContainer.clientWidth) || 800;
        const stageH = (this.stageContainer && this.stageContainer.clientHeight) || 600;

        // Character position on dev stage is center stage (50%, 58%)
        const targetX = Math.round(stageW * 0.50);
        const targetY = Math.round(stageH * 0.44);

        let gunX = clickX;
        let gunY = clickY - 75;
        if (gunY < 40) {
            gunY = (clickY + 75 < stageH - 40) ? clickY + 75 : clickY;
        }
        gunX = Math.max(50, Math.min(stageW - 50, gunX));
        gunY = Math.max(35, Math.min(stageH - 35, gunY));

        const dx = targetX - gunX;
        const dy = targetY - gunY;
        const isShootingRight = dx >= 0;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);

        const BASE_GUN_SCALE = 0.28;
        const folder = gunCfg.folder || `attaker/shooting/${this.selectedShootingWeaponId}`;
        const frames = (gunCfg.frames && gunCfg.frames.length >= 3) ? gunCfg.frames : ['frame1.png', 'frame2.png', 'frame3.png'];

        const getTransformForFrame = (fName) => {
            const fOff = (gunCfg.frameOffsets && gunCfg.frameOffsets[fName]) ? gunCfg.frameOffsets[fName] : {};
            const gScale = (gunCfg.scale !== undefined ? gunCfg.scale : 1.0);
            const fScale = (fOff.scale !== undefined ? fOff.scale : 1.0);
            const tScale = gScale * fScale * BASE_GUN_SCALE;
            const sx = (gunCfg.scaleX !== undefined ? gunCfg.scaleX : 1.0) * (fOff.scaleX !== undefined ? fOff.scaleX : 1.0) * tScale;
            const sy = (gunCfg.scaleY !== undefined ? gunCfg.scaleY : 1.0) * (fOff.scaleY !== undefined ? fOff.scaleY : 1.0) * tScale;
            const rOffset = (gunCfg.rotation || 0) + (fOff.rotation || 0);
            const finalSx = sx;
            const finalSy = isShootingRight ? sy : -sy;
            const finalR = angleDeg + (isShootingRight ? rOffset : -rOffset);
            const fx = (fOff.x || 0) * gScale;
            const fy = (fOff.y || 0) * gScale;
            return `translate(-50%, -50%) rotate(${finalR}deg) translate(${fx}px, ${fy}px) scale(${finalSx}, ${finalSy})`;
        };

        const gunEl = document.createElement('div');
        gunEl.style.position = 'absolute';
        gunEl.style.left = `${gunX}px`;
        gunEl.style.top = `${gunY}px`;
        gunEl.style.transform = getTransformForFrame(frames[0]);
        gunEl.style.pointerEvents = 'none';
        gunEl.style.zIndex = '95';
        gunEl.style.transition = 'opacity 0.15s ease-out';
        gunEl.innerHTML = `<img src="${encodeURI(folder + '/' + frames[0])}" alt="test-gun" style="display: block; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6));">`;

        this.stageContainer.appendChild(gunEl);
        const imgEl = gunEl.querySelector('img');

        setTimeout(() => {
            if (!gunEl.parentElement) return;

            // Flash frame & sound
            if (imgEl && frames[1]) {
                imgEl.src = encodeURI(folder + '/' + frames[1]);
                gunEl.style.transform = getTransformForFrame(frames[1]);
            }
            if (window.soundEngine) {
                if (gunCfg.sound) window.soundEngine.playAudioFile(gunCfg.sound, 1.0, false);
                else window.soundEngine.playAttackSound(this.selectedShootingWeaponId);
            }

            // Recoil kick
            const recoilKick = gunCfg.recoilKick || 14;
            gunEl.style.left = `${gunX - Math.cos(angleRad) * recoilKick}px`;
            gunEl.style.top = `${gunY - Math.sin(angleRad) * recoilKick}px`;

            // Muzzle position & bullet
            const f1Off = (gunCfg.frameOffsets && gunCfg.frameOffsets[frames[1]]) ? gunCfg.frameOffsets[frames[1]] : {};
            const gunMul = (gunCfg.scale !== undefined ? gunCfg.scale : 1.0) * (f1Off.scale !== undefined ? f1Off.scale : 1.0);
            const mOff = gunCfg.muzzleOffset || { x: 143, y: -20 };
            const mXLocal = (mOff.x + (f1Off.x || 0)) * gunMul;
            const mYLocal = (mOff.y + (f1Off.y || 0)) * gunMul * (isShootingRight ? 1 : -1);
            const muzzleX = gunX + (mXLocal * Math.cos(angleRad) - mYLocal * Math.sin(angleRad));
            const muzzleY = gunY + (mXLocal * Math.sin(angleRad) + mYLocal * Math.cos(angleRad));

            const bulletFrame = gunCfg.bullet || 'bullet.png';
            const bulletScale = (gunCfg.bulletScale || 0.5) * BASE_GUN_SCALE * (gunCfg.scale || 1.0);
            const bulletSpeed = gunCfg.bulletSpeed || 2200;

            const bulletEl = document.createElement('div');
            bulletEl.className = 'game-bullet-projectile';
            bulletEl.style.left = `${muzzleX}px`;
            bulletEl.style.top = `${muzzleY}px`;
            bulletEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) scale(${bulletScale})`;
            bulletEl.innerHTML = `<img src="${encodeURI(folder + '/' + bulletFrame)}" alt="bullet" style="display: block;">`;
            this.stageContainer.appendChild(bulletEl);

            const flyDist = Math.hypot(targetX - muzzleX, targetY - muzzleY);
            const flightTimeMs = Math.max(45, Math.min(130, (flyDist / bulletSpeed) * 1000));
            const bulletStartTime = performance.now();

            const animBullet = (now) => {
                const p = Math.min(1.0, (now - bulletStartTime) / flightTimeMs);
                if (bulletEl.parentElement) {
                    bulletEl.style.left = `${muzzleX + (targetX - muzzleX) * p}px`;
                    bulletEl.style.top = `${muzzleY + (targetY - muzzleY) * p}px`;
                }

                if (p < 1.0) {
                    requestAnimationFrame(animBullet);
                } else {
                    if (bulletEl.parentElement) bulletEl.remove();
                    // Blood on character
                    this.testShootingBlood();
                }
            };
            requestAnimationFrame(animBullet);

            // Recoil frame
            setTimeout(() => {
                if (imgEl && frames[2]) {
                    imgEl.src = encodeURI(folder + '/' + frames[2]);
                    gunEl.style.transform = getTransformForFrame(frames[2]);
                }
            }, gunCfg.frameSpeed || 65);

            // Fade out
            setTimeout(() => {
                if (gunEl.parentElement) {
                    gunEl.style.opacity = '0';
                    setTimeout(() => { if (gunEl.parentElement) gunEl.remove(); }, 160);
                }
            }, 220);
        }, 35);
    }

    testShootingBlood() {
        const gun = this.getActiveShootingConfig();
        const stageWrapper = this.stageContainer.querySelector('.dev-stage-wrapper') || this.stageContainer;

        const bloodEl = document.createElement('img');
        bloodEl.src = 'attaker/shooting/blood.png';
        bloodEl.className = 'game-blood-splat';
        bloodEl.alt = 'blood';

        const bz = gun.bloodZone || { centerY: 240, spreadY: 150, spreadX: 110 };
        const yOffset = ((bz.centerY !== undefined ? bz.centerY : 240) - 200) + (Math.random() - 0.5) * (bz.spreadY || 150) * 0.85;
        const xOffset = (Math.random() - 0.5) * (bz.spreadX || 110) * 0.85;
        const randRot = Math.floor(Math.random() * 360);
        const scale = (gun.bloodScale || 0.40) * (0.85 + Math.random() * 0.35);

        bloodEl.style.left = `calc(50% + ${xOffset}px)`;
        bloodEl.style.top = `calc(50% + ${yOffset}px)`;
        bloodEl.style.transform = `translate(-50%, -50%) rotate(${randRot}deg) scale(${scale})`;
        bloodEl.style.opacity = '0.92';
        bloodEl.style.zIndex = '88';

        stageWrapper.appendChild(bloodEl);

        const dur = gun.bloodDuration || 2400;
        setTimeout(() => {
            if (bloodEl.parentElement) {
                bloodEl.style.opacity = '0';
                setTimeout(() => { if (bloodEl.parentElement) bloodEl.remove(); }, 500);
            }
        }, dur);
    }

    fireDevSwordTest(clickX, clickY) {
        const swCfg = this.getActiveWeaponConfig();
        const stageW = (this.stageContainer && this.stageContainer.clientWidth) || 800;
        const stageH = (this.stageContainer && this.stageContainer.clientHeight) || 600;
        const targetX = Math.round(stageW * 0.50);
        const targetY = Math.round(stageH * 0.44);

        let swordX = clickX;
        let swordY = clickY - 40;
        swordX = Math.max(50, Math.min(stageW - 50, swordX));
        swordY = Math.max(35, Math.min(stageH - 35, swordY));

        const dx = targetX - swordX;
        const dy = targetY - swordY;
        const angleRad = Math.atan2(dy, dx);
        const baseAngleDeg = angleRad * (180 / Math.PI) + 90;

        const curId = this.getActiveWeaponId();
        const folder = swCfg.folder || `attaker/swords/${curId}`;
        const frame = (swCfg.frames && swCfg.frames[0]) || 'frame1.png';

        const swordEl = document.createElement('div');
        swordEl.style.position = 'absolute';
        swordEl.style.left = `${swordX}px`;
        swordEl.style.top = `${swordY}px`;
        swordEl.style.pointerEvents = 'none';
        swordEl.style.zIndex = '95';
        swordEl.style.transformOrigin = '50% 88%';
        swordEl.style.transform = `translate(-50%, -88%) rotate(${baseAngleDeg - 45}deg) scale(${swCfg.scale || 0.35})`;
        swordEl.style.transition = 'transform 0.16s cubic-bezier(0.2, 1, 0.3, 1)';
        swordEl.innerHTML = `<img src="${encodeURI(folder + '/' + frame)}" alt="test-sword" style="display: block; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.6));">`;

        this.stageContainer.appendChild(swordEl);

        if (window.soundEngine) {
            if (swCfg.sound) window.soundEngine.playAudioFile(swCfg.sound, 1.0, false);
            else window.soundEngine.playAudioFile('assets/sounds/slap.mp3', 1.0, false);
        }

        setTimeout(() => {
            if (!swordEl.parentElement) return;
            swordEl.style.transform = `translate(-50%, -88%) rotate(${baseAngleDeg + 45}deg) scale(${swCfg.scale || 0.35})`;

            const arc = document.createElement('div');
            arc.className = 'game-sword-slash-arc';
            arc.style.left = `${(swordX + targetX) / 2}px`;
            arc.style.top = `${(swordY + targetY) / 2}px`;
            arc.style.transform = `translate(-50%, -50%) rotate(${baseAngleDeg}deg) scale(1.4)`;
            this.stageContainer.appendChild(arc);
            setTimeout(() => { if (arc.parentElement) arc.remove(); }, 280);

            this.testShootingBlood();

            setTimeout(() => {
                if (swordEl.parentElement) {
                    swordEl.style.opacity = '0';
                    swordEl.style.transition = 'opacity 0.2s ease-out';
                    setTimeout(() => { if (swordEl.parentElement) swordEl.remove(); }, 220);
                }
            }, 180);
        }, 30);
    }

    fireDevSpecialTest(clickX, clickY) {
        const weaponId = this.getActiveWeaponId();
        const spCfg = this.getActiveWeaponConfig();
        const stageW = (this.stageContainer && this.stageContainer.clientWidth) || 800;
        const stageH = (this.stageContainer && this.stageContainer.clientHeight) || 600;
        const targetX = Math.round(stageW * 0.50);
        const targetY = Math.round(stageH * 0.44);

        if (weaponId === 'shuriken') {
            const shurikenEl = document.createElement('div');
            shurikenEl.className = 'game-shuriken-projectile';
            shurikenEl.style.left = `${clickX}px`;
            shurikenEl.style.top = `${clickY}px`;
            shurikenEl.style.transform = `translate(-50%, -50%) scale(${spCfg.scale || 0.22})`;
            shurikenEl.innerHTML = `<img src="attaker/special/shuriken/frame1.png" alt="shuriken" style="display: block;">`;
            this.stageContainer.appendChild(shurikenEl);

            if (window.soundEngine) {
                window.soundEngine.playAudioFile(spCfg.sound || 'attaker/special/shuriken/shuriken.mp3', 1.0, false);
            }

            const flyDist = Math.hypot(targetX - clickX, targetY - clickY);
            const speed = spCfg.throwSpeed || 1400;
            const flyTimeMs = Math.max(60, Math.min(180, (flyDist / speed) * 1000));
            const startTime = performance.now();

            const anim = (now) => {
                const p = Math.min(1.0, (now - startTime) / flyTimeMs);
                if (shurikenEl.parentElement) {
                    shurikenEl.style.left = `${clickX + (targetX - clickX) * p}px`;
                    shurikenEl.style.top = `${clickY + (targetY - clickY) * p}px`;
                }
                if (p < 1.0) {
                    requestAnimationFrame(anim);
                } else {
                    if (shurikenEl.parentElement) shurikenEl.remove();

                    const stuckEl = document.createElement('div');
                    stuckEl.className = 'game-shuriken-stuck';
                    stuckEl.style.left = `${targetX + (Math.random() - 0.5) * 40}px`;
                    stuckEl.style.top = `${targetY + (Math.random() - 0.5) * 60}px`;
                    stuckEl.style.transform = `translate(-50%, -50%) scale(${spCfg.scale || 0.22}) rotate(${Math.floor(Math.random() * 360)}deg)`;
                    stuckEl.innerHTML = `<img src="attaker/special/shuriken/frame1.png" alt="shuriken" style="display: block;">`;
                    this.stageContainer.appendChild(stuckEl);

                    this.testShootingBlood();

                    setTimeout(() => {
                        if (stuckEl.parentElement) {
                            stuckEl.style.opacity = '0';
                            stuckEl.style.transition = 'opacity 0.3s ease-out';
                            setTimeout(() => { if (stuckEl.parentElement) stuckEl.remove(); }, 320);
                        }
                    }, spCfg.stickDuration || 4500);
                }
            };
            requestAnimationFrame(anim);
        } else if (weaponId === 'scorpion') {
            const scorpionActor = document.createElement('div');
            scorpionActor.className = 'game-scorpion-actor';
            scorpionActor.style.left = `${clickX}px`;
            scorpionActor.style.top = `${clickY}px`;

            const dx = targetX - clickX;
            const dy = targetY - clickY;
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = angleRad * (180 / Math.PI);
            const dist = Math.hypot(dx, dy);

            const handEl = document.createElement('div');
            handEl.className = 'game-scorpion-hand';
            handEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) scale(0.18)`;
            handEl.innerHTML = `<img src="attaker/special/scorpion/hand.png" alt="hand">`;

            const chainEl = document.createElement('div');
            chainEl.className = 'game-scorpion-chain';
            chainEl.style.transform = `rotate(${angleDeg}deg)`;
            chainEl.style.width = '0px';

            const headEl = document.createElement('div');
            headEl.className = 'game-scorpion-head';
            headEl.style.left = '0px';
            headEl.style.top = '0px';
            headEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg) scale(0.20)`;
            headEl.innerHTML = `<img src="attaker/special/scorpion/head.png" alt="head">`;

            scorpionActor.appendChild(chainEl);
            scorpionActor.appendChild(headEl);
            scorpionActor.appendChild(handEl);
            this.stageContainer.appendChild(scorpionActor);

            if (window.soundEngine) {
                window.soundEngine.playAudioFile('attaker/special/scorpion/chain.mp3', 1.0, false);
            }

            const spearSpeed = 1600;
            const throwTimeMs = Math.max(80, (dist / spearSpeed) * 1000);
            const startTime = performance.now();

            const animSpear = (now) => {
                const p = Math.min(1.0, (now - startTime) / throwTimeMs);
                const curDist = dist * p;
                headEl.style.left = `${Math.cos(angleRad) * curDist}px`;
                headEl.style.top = `${Math.sin(angleRad) * curDist}px`;
                chainEl.style.width = `${curDist}px`;

                if (p < 1.0) {
                    requestAnimationFrame(animSpear);
                } else {
                    this.testShootingBlood();

                    setTimeout(() => {
                        if (window.soundEngine) {
                            window.soundEngine.playAudioFile('attaker/special/scorpion/get over her.mp3', 1.0, false);
                        }
                        setTimeout(() => {
                            if (scorpionActor.parentElement) {
                                scorpionActor.style.opacity = '0';
                                scorpionActor.style.transition = 'opacity 0.3s ease-out';
                                setTimeout(() => { if (scorpionActor.parentElement) scorpionActor.remove(); }, 320);
                            }
                        }, 800);
                    }, 650);
                }
            };
            requestAnimationFrame(animSpear);
        }
    }

    // =========================================================================
    // Cheats & Export Modals
    // =========================================================================

    bindCheatEvents() {
        const btnAddCoins = document.getElementById('btn-cheat-add-coins');
        if (btnAddCoins) btnAddCoins.onclick = () => { window.configManager.addCoins(1000); this.showNotification('💰 1,000 سکە زیادکرا!'); };

        const btnAddDiamonds = document.getElementById('btn-cheat-add-diamonds');
        if (btnAddDiamonds) btnAddDiamonds.onclick = () => { window.configManager.addDiamonds(500); this.showNotification('💎 500 ئەڵماس زیادکرا!'); };

        const btnUnlockAll = document.getElementById('btn-cheat-unlock-all');
        if (btnUnlockAll) btnUnlockAll.onclick = () => { window.configManager.unlockAll(); this.showNotification('🔓 هەموو شتێک کرایەوە!'); };

        const btnResetEcon = document.getElementById('btn-cheat-reset-econ');
        if (btnResetEcon) btnResetEcon.onclick = () => { window.configManager.resetEconomy(); this.showNotification('🔄 دراوەکان سفرکرانەوە'); };
    }

    bindExportTabs() {
        const tabs = [
            { id: 'tab-export-item', key: 'item' },
            { id: 'tab-export-cat', key: 'cat' },
            { id: 'tab-export-attack', key: 'attack' },
            { id: 'tab-export-shooting', key: 'shooting' },
            { id: 'tab-export-swords', key: 'swords' },
            { id: 'tab-export-special', key: 'special' },
            { id: 'tab-export-frame', key: 'frame' },
            { id: 'tab-export-mouth', key: 'mouth' },
            { id: 'tab-export-sound', key: 'sound' },
            { id: 'tab-export-all', key: 'all' }
        ];

        tabs.forEach(t => {
            const btn = document.getElementById(t.id);
            if (btn) {
                btn.onclick = () => {
                    this.exportTab = t.key;
                    this.refreshExportModalContent();
                };
            }
        });

        const btnClose = document.getElementById('btn-close-export-modal');
        if (btnClose) {
            btnClose.onclick = () => {
                const modal = document.getElementById('dev-export-modal');
                if (modal) modal.classList.remove('active');
            };
        }

        const btnCopy = document.getElementById('btn-copy-code');
        if (btnCopy) {
            btnCopy.onclick = () => {
                const textarea = document.getElementById('dev-export-textarea');
                if (textarea) {
                    textarea.select();
                    navigator.clipboard.writeText(textarea.value).then(() => {
                        this.showNotification('کۆدەکە کۆپی کرا بۆ کلیپبۆرد 📋');
                    });
                }
            };
        }
    }

    openExportModal() {
        const modal = document.getElementById('dev-export-modal');
        if (!modal) return;

        if (this.studioMode === 'attacks') {
            this.exportTab = 'attack';
        } else if (this.studioMode === 'shooting') {
            if (this.selectedWeaponCategory === 'swords') this.exportTab = 'swords';
            else if (this.selectedWeaponCategory === 'special') this.exportTab = 'special';
            else this.exportTab = 'shooting';
        } else {
            this.exportTab = (this.applyScope === 'specific') ? 'item' : 'cat';
        }

        this.refreshExportModalContent();
        modal.classList.add('active');
    }

    refreshExportModalContent() {
        const textarea = document.getElementById('dev-export-textarea');
        const descEl = document.getElementById('dev-export-desc');
        if (!textarea) return;

        document.querySelectorAll('.dev-export-tab').forEach(t => t.classList.remove('active'));
        const activeTabBtn = document.getElementById(`tab-export-${this.exportTab}`);
        if (activeTabBtn) activeTabBtn.classList.add('active');

        let code = '';
        let desc = '';

        if (this.exportTab === 'item') {
            desc = `ئەم دێڕە کۆپی بکە و لە ناو <code>ITEM_COORDINATES['${this.selectedCategory}']</code> لە ناو فایلی <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportSelectedItem(this.selectedCategory, this.selectedItem);
        } else if (this.exportTab === 'cat') {
            desc = `ئەم بەشە کۆپی بکە و لە ناو <code>ITEM_COORDINATES['${this.selectedCategory}']</code> لە ناو فایلی <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportSelectedCategory(this.selectedCategory);
        } else if (this.exportTab === 'attack') {
            desc = `کۆدی ئەم هێرشەی ستۆدیۆی Cute CUT کۆپی بکە و لە ناو <code>ATTACK_PARTS_COORDINATES</code> لە ناو <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportSelectedAttackCuteCut(this.selectedAttackId);
        } else if (this.exportTab === 'shooting') {
            desc = `کۆدی ئەم چەکە یان تەواوی چەکەکان کۆپی بکە و لە ناو <code>SHOOTING_WEAPONS_COORDINATES</code> لە ناو <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportShootingWeapon ? window.coordinatesDB.exportShootingWeapon(this.selectedShootingWeaponId) : '';
        } else if (this.exportTab === 'swords') {
            desc = `کۆدی ئەم شمشێرە کۆپی بکە و لە ناو <code>SWORDS_WEAPONS_COORDINATES</code> لە ناو <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportSwordWeapon ? window.coordinatesDB.exportSwordWeapon(this.getActiveWeaponId()) : '';
        } else if (this.exportTab === 'special') {
            desc = `کۆدی ئەم چەکە تایبەتە کۆپی بکە و لە ناو <code>SPECIAL_WEAPONS_COORDINATES</code> لە ناو <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportSpecialWeapon ? window.coordinatesDB.exportSpecialWeapon(this.getActiveWeaponId()) : '';
        } else if (this.exportTab === 'mouth') {
            desc = `ئەم ڕێکخستنە دابنێ لە ناو <code>talking_mouth</code> لە <code>ITEM_COORDINATES</code> لە <code>js/coordinates.js</code>:`;
            code = window.coordinatesDB.exportSelectedCategory('talking_mouth');
        } else if (this.exportTab === 'sound') {
            desc = `ئەم کاتانە دابنێ لە ناو <code>SOUND_TALK_TIMINGS</code> لە فایلی <code>js/coordinates.js</code>:`;
            code = window.coordinatesDB.exportSoundTimings();
        } else {
            desc = `تەواوی داتابەیسەکە کۆپی بکە و لە فایلی <code>js/coordinates.js</code> دایبنێ:`;
            code = window.coordinatesDB.exportCode();
        }

        if (descEl) descEl.innerHTML = desc;
        textarea.value = code;
    }

    showNotification(msg) {
        let toast = document.getElementById('dev-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dev-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.className = 'toast-show';
        setTimeout(() => { toast.className = ''; }, 2800);
    }
}

window.devEditor = new DevEditor();
