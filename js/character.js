/**
 * Mama Vana - Character Renderer & State Management
 * Supports custom layering (Z-Index hierarchy), advanced mirroring (dual ears/eyes with side swap, tilt, and spread),
 * and dynamic animations.
 */

class CharacterModel {
    constructor() {
        this.state = this.loadState();
        this.talking = false;
        this.talkFrame = 0;
        this.talkInterval = null;
        this.talkTimeout = null;
        this.eyePopping = false;
        this.eyePopFrame = 0;
        this.eyePopInterval = null;
        // Eye override (e.g. for special weapons like spiders)
        this.overrideEyes = null;
        // Temporary costume (e.g. for ridiculous spell)
        this._tempCostumeActive = false;
        this._tempCostumeTimer = null;
        this._originalStateBeforeTemp = null;
        // Eye blink
        this.blinking = false;
        this.blinkTimer = null;
        this.blinkRestoreTimer = null;
    }

    getDefaultState() {
        return {
            bodys: '28.png',
            head_shapes: '1.png',
            haires: null,
            eyeborws: '1.png',
            eyes: '1.png',
            noses: '1.png',
            mouths: '1.png',
            ears: '99.png',
            facials: '1.png',
            head_enquipments: null,
            body_enquipments: null
        };
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CHARACTER);
            if (saved) {
                return { ...this.getDefaultState(), ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load character state', e);
        }
        return this.getDefaultState();
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY_CHARACTER, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save character state', e);
        }
    }

    setPart(category, fileName) {
        this.state[category] = fileName;
        this.saveState();
    }

    randomize() {
        const manifest = ASSETS_MANIFEST.bodyParts;
        const requiredCategories = ['bodys', 'head_shapes'];

        for (const cat of Object.keys(this.state)) {
            const allFiles = manifest[cat] || [];
            // Filter only unlocked items
            const unlockedFiles = allFiles.filter(file => {
                if (window.configManager && window.configManager.isItemUnlocked) {
                    return window.configManager.isItemUnlocked(cat, file);
                }
                return true;
            });

            const isOptional = !requiredCategories.includes(cat);
            const pool = [...unlockedFiles];

            // For optional sections, include null ('none') in the pool
            if (isOptional) {
                pool.push(null);
            }

            if (pool.length > 0) {
                const randIndex = Math.floor(Math.random() * pool.length);
                this.state[cat] = pool[randIndex];
            }
        }
        this.saveState();
    }

    applyTemporaryRandomCostume(duration = 10000, onComplete = null) {
        if (this._tempCostumeTimer) clearTimeout(this._tempCostumeTimer);
        if (!this._tempCostumeActive) this._originalStateBeforeTemp = { ...this.state };
        this._tempCostumeActive = true;

        const temporaryState = { ...this.state };
        Object.keys(temporaryState).forEach(category => {
            const files = (ASSETS_MANIFEST.bodyParts[category] || []).filter(Boolean);
            if (files.length > 0) temporaryState[category] = files[Math.floor(Math.random() * files.length)];
        });
        this.state = temporaryState;
        this.render(document.getElementById('game-boss-container'));

        this._tempCostumeTimer = setTimeout(() => {
            this.state = { ...this._originalStateBeforeTemp };
            this._originalStateBeforeTemp = null;
            this._tempCostumeActive = false;
            this.render(document.getElementById('game-boss-container'));
            if (onComplete) onComplete();
        }, duration);
    }

    /**
     * Renders or updates the composite character inside a target DOM container.
     */
    render(container, options = {}) {
        if (!container) return;

        let charRoot = container.querySelector('.mv-character-composite');
        if (!charRoot) {
            charRoot = document.createElement('div');
            charRoot.className = 'mv-character-composite';
            container.appendChild(charRoot);
        }

        let bodyGroup = charRoot.querySelector('.mv-group-body');
        if (!bodyGroup) {
            bodyGroup = document.createElement('div');
            bodyGroup.className = 'mv-layer-group mv-group-body';
            charRoot.appendChild(bodyGroup);
        }

        let headGroup = charRoot.querySelector('.mv-group-head');
        if (!headGroup) {
            headGroup = document.createElement('div');
            headGroup.className = 'mv-layer-group mv-group-head';
            charRoot.appendChild(headGroup);
        }

        const categories = [
            'ears',
            'bodys',
            'head_shapes',
            'eyes',
            'eyeborws',
            'haires',
            'mouths',
            'facials',
            'noses',
            'body_enquipments',
            'head_enquipments'
        ];

        // Parts that MUST always show (never removable via None)
        const requiredParts = ['bodys', 'head_shapes'];

        categories.forEach(cat => {
            const stateVal = this.state[cat];
            // For required parts, fall back to default if missing/null.
            // For optional parts, respect explicit null (None selected) by removing the part.
            let itemFile;
            if (requiredParts.includes(cat)) {
                itemFile = stateVal || this.getDefaultState()[cat];
            } else {
                // stateVal === null means user explicitly chose None → remove part
                // stateVal === undefined means key not set yet → fall back to default
                itemFile = (stateVal === undefined) ? this.getDefaultState()[cat] : stateVal;
            }
            if (cat === 'eyes' && this.overrideEyes) itemFile = this.overrideEyes;

            let partEl = charRoot.querySelector(`.mv-part-${cat}`);

            if (!itemFile) {
                if (partEl) partEl.remove();
                return;
            }

            // Ensure state retains valid part
            if (!(cat === 'eyes' && this.overrideEyes)) this.state[cat] = itemFile;

            const targetGroup = (cat === 'bodys' || cat === 'body_enquipments') ? bodyGroup : headGroup;

            if (!partEl) {
                partEl = document.createElement('div');
                partEl.className = `mv-part mv-part-${cat}`;
                partEl.dataset.category = cat;
                targetGroup.appendChild(partEl);
            } else if (partEl.parentElement !== targetGroup) {
                targetGroup.appendChild(partEl);
            }

            let imagePath = window.assetManager.getItemPath(cat, itemFile);

            // Eye pop animation override
            if (cat === 'eyes' && this.eyePopping) {
                const frames = ASSETS_MANIFEST.attacker['eye_popping'];
                const frameFile = frames[this.eyePopFrame % frames.length];
                imagePath = `attaker/eye popping/${frameFile}`;
            }

            let t = window.configManager.getPartTransform(cat, itemFile);
            if (cat === 'mouths' && this.talking) {
                const frames = (window.coordinatesDB && window.coordinatesDB.getAttackConfig('talking_mouth')) ? window.coordinatesDB.getAttackConfig('talking_mouth').frames : (ASSETS_MANIFEST.bodyParts['talking_mouth'] || ['345.png', '346.png', '348.png', '349.png']);
                const frameFile = frames[this.talkFrame % frames.length];
                imagePath = `body parts/talking mouth/${frameFile}`;
                t = window.configManager.getAttackFrameTransform('talking_mouth', frameFile) || window.configManager.getPartTransform('talking_mouth', frameFile);
            }

            const isMirrored = t.mirror && t.mirror.enabled;
            const mirrorDist = (t.mirror && t.mirror.distance !== undefined) ? t.mirror.distance : 0;
            const flipSides = (t.mirror && t.mirror.flipSides !== undefined) ? t.mirror.flipSides : false;
            const tilt = (t.mirror && t.mirror.tilt !== undefined) ? t.mirror.tilt : 0;
            const rotateOpposite = (t.mirror && t.mirror.rotateOpposite !== undefined) ? t.mirror.rotateOpposite : true;

            const scaleVal = t.scale || 1.0;
            const sx = (t.scaleX !== undefined ? t.scaleX : 1.0) * scaleVal;
            const sy = (t.scaleY !== undefined ? t.scaleY : 1.0) * scaleVal;
            const rot = t.rotation || 0;

            if (cat === 'mouths' && this.talking) {
                partEl.style.left = `calc(50% + ${t.x}px)`;
                partEl.style.top = `calc(50% + ${t.y}px)`;
                partEl.style.transform = 'translate(-50%, -50%)';
            } else {
                partEl.style.left = '50%';
                partEl.style.top = '50%';
                partEl.style.transform = `translate(${t.x}px, ${t.y}px)`;
            }
            partEl.style.zIndex = t.zIndex || (window.coordinatesDB ? window.coordinatesDB.defaultZIndex[cat] : 10);
            partEl.dataset.item = itemFile;

            if (isMirrored) {
                // Determine scale sign for Left and Right based on flipSides
                const leftSx = flipSides ? -sx : sx;
                const rightSx = flipSides ? sx : -sx;
                const leftRot = rotateOpposite ? -rot : rot;
                const rightRot = rot;

                partEl.innerHTML = `
                    <div class="mv-mirror-wrapper" style="position: relative; width: 0; height: 0; transform: rotate(${tilt}deg);">
                        <img class="mv-mirror-left" src="${encodeURI(imagePath)}" alt="${cat}" draggable="false" 
                             style="position: absolute; top: 50%; left: 50%; transform: translate(calc(-50% - ${mirrorDist / 2}px), -50%) scale(${leftSx}, ${sy}) rotate(${leftRot}deg);">
                        <img class="mv-mirror-right" src="${encodeURI(imagePath)}" alt="${cat}" draggable="false" 
                             style="position: absolute; top: 50%; left: 50%; transform: translate(calc(-50% + ${mirrorDist / 2}px), -50%) scale(${rightSx}, ${sy}) rotate(${rightRot}deg);">
                    </div>
                `;
            } else {
                const maxDim = (cat === 'mouths' && this.talking) ? 'max-width: 140px; max-height: 140px;' : '';
                partEl.innerHTML = `
                    <img src="${encodeURI(imagePath)}" alt="${cat}" draggable="false"
                         style="${maxDim} transform: scale(${sx}, ${sy}) rotate(${rot}deg); transform-origin: center center; display: block;">
                `;
            }
        });

        if (options.onPartClick) {
            charRoot.querySelectorAll('.mv-part').forEach(part => {
                part.onclick = (e) => {
                    e.stopPropagation();
                    options.onPartClick(part.dataset.category, part.dataset.item);
                };
            });
        }
    }

    startTalking(duration = 2200, frameSpeed = 110, onComplete) {
        this.stopTalking();
        this.talking = true;
        this.talkFrame = 0;
        const frames = (window.coordinatesDB && window.coordinatesDB.getAttackConfig('talking_mouth')) ? window.coordinatesDB.getAttackConfig('talking_mouth').frames : (ASSETS_MANIFEST.bodyParts['talking_mouth'] || ['345.png', '346.png', '348.png', '349.png']);
        const framesCount = frames.length || 4;

        this.talkInterval = setInterval(() => {
            this.talkFrame = (this.talkFrame + 1) % framesCount;
            this.updateMouthDisplay();
        }, frameSpeed);

        this.talkTimeout = setTimeout(() => {
            this.stopTalking();
            if (onComplete) onComplete();
        }, duration);
    }

    stopTalking() {
        this.talking = false;
        if (this.talkInterval) {
            clearInterval(this.talkInterval);
            this.talkInterval = null;
        }
        if (this.talkTimeout) {
            clearTimeout(this.talkTimeout);
            this.talkTimeout = null;
        }
        this.updateMouthDisplay();
    }

    updateMouthDisplay() {
        document.querySelectorAll('.mv-part-mouths').forEach(partEl => {
            const img = partEl.querySelector('img');
            if (!img) return;

            if (this.talking) {
                const frames = (window.coordinatesDB && window.coordinatesDB.getAttackConfig('talking_mouth')) ? window.coordinatesDB.getAttackConfig('talking_mouth').frames : (ASSETS_MANIFEST.bodyParts['talking_mouth'] || ['345.png', '346.png', '348.png', '349.png']);
                const frameFile = frames[this.talkFrame % frames.length];
                img.src = `body parts/talking mouth/${frameFile}`;

                const t = window.configManager.getAttackFrameTransform('talking_mouth', frameFile) || window.configManager.getPartTransform('talking_mouth', frameFile);
                const scaleVal = t.scale || 1.0;
                const sx = (t.scaleX !== undefined ? t.scaleX : 1.0) * scaleVal;
                const sy = (t.scaleY !== undefined ? t.scaleY : 1.0) * scaleVal;
                const rot = t.rotation || 0;

                partEl.style.left = `calc(50% + ${t.x}px)`;
                partEl.style.top = `calc(50% + ${t.y}px)`;
                partEl.style.transform = 'translate(-50%, -50%)';
                partEl.style.zIndex = '35';

                img.style.maxWidth = '140px';
                img.style.maxHeight = '140px';
                img.style.transform = `scale(${sx}, ${sy}) rotate(${rot}deg)`;
                img.style.transformOrigin = 'center center';
                img.style.display = 'block';
            } else {
                const currentMouth = this.state.mouths || '1.png';
                img.src = window.assetManager.getItemPath('mouths', currentMouth);
                const t = window.configManager.getPartTransform('mouths', currentMouth);
                const scaleVal = t.scale || 1.0;
                const sx = (t.scaleX !== undefined ? t.scaleX : 1.0) * scaleVal;
                const sy = (t.scaleY !== undefined ? t.scaleY : 1.0) * scaleVal;
                const rot = t.rotation || 0;

                partEl.style.left = '50%';
                partEl.style.top = '50%';
                partEl.style.transform = `translate(${t.x}px, ${t.y}px)`;
                partEl.style.zIndex = '35';

                img.style.maxWidth = '';
                img.style.maxHeight = '';
                img.style.transform = `scale(${sx}, ${sy}) rotate(${rot}deg)`;
                img.style.transformOrigin = '';
                img.style.display = 'block';
            }
        });
    }

    triggerEyePop(duration = 1800, frameSpeed = 85) {
        if (this.eyePopping) return;
        this.eyePopping = true;
        this.eyePopFrame = 0;
        const frames = ASSETS_MANIFEST.attacker['eye_popping'];

        if (this.eyePopInterval) clearInterval(this.eyePopInterval);
        this.eyePopInterval = setInterval(() => {
            this.eyePopFrame = (this.eyePopFrame + 1) % frames.length;
            this.updateEyesDisplay();
        }, frameSpeed);

        setTimeout(() => {
            this.eyePopping = false;
            if (this.eyePopInterval) {
                clearInterval(this.eyePopInterval);
                this.eyePopInterval = null;
            }
            this.updateEyesDisplay();
        }, duration);
    }

    setEyeOverride(fileName) {
        this.overrideEyes = fileName;
        this.render(document.getElementById('game-boss-container'));
    }

    clearEyeOverride() {
        this.overrideEyes = null;
        this.render(document.getElementById('game-boss-container'));
    }

    updateEyesDisplay() {
        document.querySelectorAll('.mv-part-eyes img').forEach(img => {
            if (this.overrideEyes) {
                img.src = window.assetManager.getItemPath('eyes', this.overrideEyes);
            } else if (this.eyePopping) {
                const frames = ASSETS_MANIFEST.attacker['eye_popping'];
                const frameFile = frames[this.eyePopFrame % frames.length];
                img.src = `attaker/eye popping/${frameFile}`;
            } else {
                if (this.state.eyes) {
                    img.src = window.assetManager.getItemPath('eyes', this.state.eyes);
                }
            }
        });
    }

    // =========================================================================
    // Eye Blink Loop
    // =========================================================================

    /** Starts the random blink loop. Call once when gameplay begins. */
    startBlinkLoop() {
        this.stopBlinkLoop();
        const scheduleNext = () => {
            const delay = 3000 + Math.random() * 5000; // 3-8s between blinks
            this.blinkTimer = setTimeout(() => {
                this.triggerBlink();
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }

    stopBlinkLoop() {
        if (this.blinkTimer) { clearTimeout(this.blinkTimer); this.blinkTimer = null; }
        if (this.blinkRestoreTimer) { clearTimeout(this.blinkRestoreTimer); this.blinkRestoreTimer = null; }
        this.blinking = false;
    }

    triggerBlink() {
        // Don't blink during eye pop or another blink
        if (this.eyePopping || this.blinking) return;
        this.blinking = true;

        // Use opacity fade — works with ANY eye the character has
        document.querySelectorAll('.mv-part-eyes').forEach(el => {
            el.style.transition = 'opacity 45ms ease-in';
            el.style.opacity = '0';
        });

        if (this.blinkRestoreTimer) clearTimeout(this.blinkRestoreTimer);
        this.blinkRestoreTimer = setTimeout(() => {
            this.blinking = false;
            document.querySelectorAll('.mv-part-eyes').forEach(el => {
                el.style.transition = 'opacity 75ms ease-out';
                el.style.opacity = '1';
            });
        }, 130); // eyes closed for 130ms
    }
}

window.characterModel = new CharacterModel();
