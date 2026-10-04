/**
 * Mama Vana - Character Customizer Screen Logic
 * Features:
 * 1. Sets section before Body as default section.
 * 2. Large cards for complete character sets (Harry Potter, Jail, Tiger Jackson).
 * 3. Backgrounds section — buy/select backgrounds like character items.
 * 4. Rank colors on background (not border) of cards for Uncommon/Gold/Legendary.
 * 5. Item and Set economy unlocking with Coins and Diamonds.
 * 6. Preview buy bar at bottom-left of character preview (no buy button inside cards).
 * 7. Contextual Exit button returning to menu or gameplay.
 * 8. Top-right Randomize picking only unlocked items + null for optional categories.
 * 9. 100% Kurdish Sorani UI.
 */

class CharacterCustomizer {
    constructor() {
        this.selectedCategory = 'sets'; // Sets is the default section
        this.previewContainer = null;
        this.categoryTabsContainer = null;
        this.itemsGridContainer = null;
        this.activeModal = null;
        // Tracks the currently previewed unpurchased item/set for the buy bar
        this._pendingBuy = null;
    }

    init() {
        this.previewContainer = document.getElementById('customizer-preview-character');
        this.categoryTabsContainer = document.getElementById('customizer-categories');
        this.itemsGridContainer = document.getElementById('customizer-items-grid');

        // Always default to 'sets' tab when opening
        if (!this.selectedCategory) {
            this.selectedCategory = 'sets';
        }

        // Snapshot committed character state (the exact outfit the user arrived with)
        if (window.characterModel) {
            this.committedState = { ...window.characterModel.state };
        }

        this.renderCategoryTabs();
        this.renderItemsList();
        this.updatePreview();
        this.bindEvents();
        this.updateCurrencyHeader();
    }

    updateCurrencyHeader() {
        if (window.configManager && window.configManager.notifyEconomyChange) {
            window.configManager.notifyEconomyChange();
        }
    }

    exitCustomizer() {
        if (window.soundEngine) {
            window.soundEngine.playButton();
        }

        // Revert any unpurchased previews back to the user's committed items
        if (window.characterModel && this.committedState) {
            window.characterModel.state = { ...this.committedState };
            window.characterModel.saveState();
        }

        // Contextual navigation: if user entered from 'game', return to 'game'; else 'menu'
        const prev = window.gameApp ? window.gameApp.previousScreen : 'menu';
        if (prev === 'game') {
            window.gameApp.showScreen('game');
        } else {
            window.gameApp.showScreen('menu');
        }
    }

    bindEvents() {
        // Exit button
        const btnBack = document.getElementById('btn-customizer-back');
        if (btnBack) {
            btnBack.onclick = () => this.exitCustomizer();
        }

        const btnRandom = document.getElementById('btn-randomize-char');
        if (btnRandom) {
            btnRandom.onclick = () => {
                if (window.soundEngine) window.soundEngine.playButton();
                if (window.characterModel) {
                    window.characterModel.randomize();
                    this.committedState = { ...window.characterModel.state };
                }
                this.hidePreviewBuyBar();
                this.updatePreview();
                this.renderItemsList();
            };
        }

        // Preview Buy Bar button
        const btnPreviewBuy = document.getElementById('btn-preview-buy');
        if (btnPreviewBuy) {
            btnPreviewBuy.onclick = () => {
                if (!this._pendingBuy) return;
                const pb = this._pendingBuy;
                if (pb.type === 'set') {
                    this.promptBuySet(pb.set);
                } else if (pb.type === 'item') {
                    this.promptBuyItem(pb.category, pb.file, pb.itemData, pb.imgPath);
                } else if (pb.type === 'background') {
                    this._doBuyBackground(pb.bg);
                }
            };
        }

        // Buy Modal Cancel Button
        const btnModalCancel = document.getElementById('btn-modal-cancel');
        if (btnModalCancel) {
            btnModalCancel.onclick = () => this.closeBuyModal();
        }

        // Modal backdrop click
        const buyModal = document.getElementById('customizer-buy-modal');
        if (buyModal) {
            buyModal.onclick = (e) => {
                if (e.target === buyModal) {
                    this.closeBuyModal();
                }
            };
        }
    }

    // =========================================================================
    // PREVIEW BUY BAR (bottom-left of preview column)
    // =========================================================================
    showPreviewBuyBar(opts) {
        // opts: { priceCoins, priceDiamonds, pendingBuy }
        this._pendingBuy = opts.pendingBuy;
        const bar = document.getElementById('customizer-preview-buy-bar');
        const display = document.getElementById('customizer-preview-price-display');
        if (!bar || !display) return;

        let priceHtml = '';
        if (opts.priceCoins > 0)    priceHtml += `<span class="preview-price-coin">🪙 ${opts.priceCoins} سکە</span>`;
        if (opts.priceDiamonds > 0) priceHtml += `<span class="preview-price-gem"> 💎 ${opts.priceDiamonds} ئەڵماس</span>`;
        if (!priceHtml)             priceHtml  = `<span class="preview-price-free">خۆڕایی</span>`;

        display.innerHTML = priceHtml;
        bar.style.display = 'flex';
    }

    hidePreviewBuyBar() {
        this._pendingBuy = null;
        const bar = document.getElementById('customizer-preview-buy-bar');
        if (bar) bar.style.display = 'none';
    }

    // =========================================================================
    // CATEGORY TABS
    // =========================================================================
    renderCategoryTabs() {
        if (!this.categoryTabsContainer) return;
        this.categoryTabsContainer.innerHTML = '';

        // Category list: 'sets' first, then 'backgrounds', then body categories
        const categories = [
            { id: 'sets',        name: 'سێتەکان',    icon: '🎴' },
            { id: 'backgrounds', name: 'پاشبنەماکان', icon: '🌄' },
            ...ASSETS_MANIFEST.categories
        ];

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `customizer-cat-tab ${cat.id === this.selectedCategory ? 'active' : ''}`;
            btn.innerHTML = `<span class="cat-icon">${cat.icon}</span> <span class="cat-label">${cat.name}</span>`;
            btn.onclick = () => {
                if (window.soundEngine) window.soundEngine.playButton();
                this.selectedCategory = cat.id;
                this.hidePreviewBuyBar();
                this.renderCategoryTabs();
                this.renderItemsList(false);
                // Restore character preview when switching away from backgrounds
                if (cat.id !== 'backgrounds') {
                    this._hideBgPreview();
                }
                // Update set preview panel
                if (cat.id === 'sets') {
                    const activeSet = this.currentSetInPreview || this._getEquippedSet();
                    if (activeSet) this.updateSetPreviewPanel(activeSet);
                } else {
                    this.updateSetPreviewPanel(null);
                }
            };
            this.categoryTabsContainer.appendChild(btn);
        });
    }

    _getEquippedSet() {
        if (!window.characterModel) return null;
        const state = window.characterModel.state;
        for (const set of CARD_SETS) {
            if (!set.items) continue;
            const isEquipped = Object.entries(set.items).every(([cat, file]) => {
                const cur = state[cat];
                return file === null ? (cur === null || cur === undefined) : (cur === file);
            });
            if (isEquipped) return set;
        }
        return null;
    }

    updateSetPreviewPanel(set) {
        const bgWidget = document.getElementById('customizer-preview-set-bg');
        const effectWidget = document.getElementById('customizer-preview-effect-toggle');
        const effectBtn = document.getElementById('btn-preview-effect-toggle');
        const effectText = document.getElementById('preview-effect-toggle-text');
        const bgImg = document.getElementById('preview-set-bg-img');
        const bgBtn = document.getElementById('btn-preview-exclusive-bg');

        // Only show when in 'sets' tab and viewing a legendary set
        if (this.selectedCategory !== 'sets' || !set || set.rank !== 'legendary') {
            if (bgWidget) bgWidget.style.display = 'none';
            if (effectWidget) effectWidget.style.display = 'none';
            this.currentSetInPreview = null;
            return;
        }

        this.currentSetInPreview = set;

        // 1. Exclusive Background preview widget at top-left
        const exclusiveBg = window.configManager ? window.configManager.getExclusiveBgForSet(set.id) : null;
        if (bgWidget && bgImg && bgBtn) {
            if (set.hasExclusiveBackground && exclusiveBg) {
                bgImg.src = `backgrounds/${encodeURI(exclusiveBg.file)}`;
                bgImg.alt = exclusiveBg.name;
                bgWidget.style.display = 'flex';
                bgBtn.dataset.bgFile = exclusiveBg.file;
                bgBtn.dataset.bgName = exclusiveBg.name;
                bgBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openBgFullscreenPreview(exclusiveBg.file, exclusiveBg.name);
                };
            } else {
                bgWidget.style.display = 'none';
                delete bgBtn.dataset.bgFile;
                delete bgBtn.dataset.bgName;
                bgBtn.onclick = null;
            }
        }

        // 2. Effect Toggle widget at bottom-right
        if (effectWidget && effectBtn && effectText) {
            if (!set.hasEffect) {
                effectWidget.style.display = 'none';
                effectBtn.onclick = null;
                return;
            }
            effectWidget.style.display = 'block';
            const isEnabled = window.configManager ? window.configManager.isSetEffectEnabled() : true;
            effectBtn.className = `btn-cartoon ${isEnabled ? 'btn-green' : 'btn-purple'} preview-effect-toggle-btn`;
            effectText.textContent = isEnabled ? '✨ ئیفێکت : چالاکە' : '💤 ئیفێکت : ناچالاکە';

            effectBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.soundEngine) window.soundEngine.playButton();
                const newEnabled = !window.configManager.isSetEffectEnabled();
                window.configManager.setSetEffectEnabled(newEnabled);

                effectBtn.className = `btn-cartoon ${newEnabled ? 'btn-green' : 'btn-purple'} preview-effect-toggle-btn`;
                effectText.textContent = newEnabled ? '✨ ئیفێکت : چالاکە' : '💤 ئیفێکت : ناچالاکە';

                if (newEnabled) {
                    if (window.legendaryEffects) window.legendaryEffects.checkAndStartEffect();
                    this.showToast('✨ ئیفێکتی سێت چالاک کرا!');
                } else {
                    if (window.legendaryEffects) window.legendaryEffects.stopEffect();
                    this.showToast('💤 ئیفێکتی سێت ناچالاک کرا!');
                }
            };
        }
    }

    // =========================================================================
    // ITEMS LIST DISPATCHER (Preserves scroll position when requested)
    // =========================================================================
    renderItemsList(preserveScroll = false) {
        if (!this.itemsGridContainer) return;
        const prevScroll = (preserveScroll && this.itemsGridContainer) ? this.itemsGridContainer.scrollTop : 0;

        this.itemsGridContainer.innerHTML = '';

        if (this.selectedCategory === 'sets') {
            this.itemsGridContainer.classList.add('customizer-sets-view');
            this.itemsGridContainer.classList.remove('customizer-bg-view');
            this.renderSetsList();
        } else if (this.selectedCategory === 'backgrounds') {
            this.itemsGridContainer.classList.remove('customizer-sets-view');
            this.itemsGridContainer.classList.add('customizer-bg-view');
            this.renderBackgroundsList();
        } else {
            this.itemsGridContainer.classList.remove('customizer-sets-view');
            this.itemsGridContainer.classList.remove('customizer-bg-view');
            this.renderCategoryItemsList();
        }

        if (preserveScroll && this.itemsGridContainer) {
            this.itemsGridContainer.scrollTop = prevScroll;
        }
    }

    // =========================================================================
    // 1. COMPLETE CARD SETS SECTION
    // =========================================================================
    renderSetsList() {
        CARD_SETS.forEach(set => {
            const card = document.createElement('div');
            const isUnlocked = window.configManager ? window.configManager.isSetUnlocked(set.id) : false;
            const rankData = ITEM_RANKS[set.rank] || ITEM_RANKS.gold;
            const isLegendary = set.rank === 'legendary';

            // Check if this set is currently fully equipped on character
            const isEquipped = set.items && Object.entries(set.items).every(([cat, file]) => {
                const cur = window.characterModel.state[cat];
                return file === null ? (cur === null || cur === undefined) : (cur === file);
            });

            // Find exclusive background for this set
            const exclusiveBg = window.configManager ? window.configManager.getExclusiveBgForSet(set.id) : null;

            card.className = `customizer-set-card rank-${set.rank} ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''} ${isLegendary ? 'legendary-set-card' : ''}`;

            card.innerHTML = `
                <div class="set-card-header">
                    <span class="set-rank-pill" style="background: ${rankData.gradient}; box-shadow: 0 2px 10px ${rankData.glow};">
                        ${rankData.name}
                    </span>
                    ${!isUnlocked ? '<span class="set-lock-indicator">🔒</span>' : ''}
                    <div class="set-features-badges">
                        ${isLegendary && set.hasEffect ? '<span class="set-feature-chip effect-chip" title="ئەم سێتە ئیفێکتی تایبەتی هەیە" aria-label="ئیفێکت">✨</span>' : ''}
                        ${isLegendary && set.hasExclusiveBackground && exclusiveBg ? '<span class="set-feature-chip bg-chip" title="ئەم سێتە پاشبنەمایەکی تایبەتی هەیە" aria-label="پاشبنەما">🌄</span>' : ''}
                    </div>
                </div>
                <div class="set-card-img-wrapper">
                    <img src="${encodeURI(set.image)}" alt="${set.name}" loading="lazy">
                </div>
                <div class="set-card-info">
                    <div class="set-card-name">${set.name}</div>
                    <div class="set-card-subname">${set.subName}</div>
                </div>
            `;

            // Clicking card equips if unlocked, or previews if locked
            card.onclick = () => {
                if (isUnlocked) {
                    if (!isEquipped) {
                        this.equipSet(set);
                    } else {
                        this.updateSetPreviewPanel(set);
                    }
                    this.hidePreviewBuyBar();
                } else {
                    this.previewSet(set);
                    this.showPreviewBuyBar({
                        priceCoins: set.priceCoins,
                        priceDiamonds: set.priceDiamonds,
                        pendingBuy: { type: 'set', set }
                    });
                }
            };

            this.itemsGridContainer.appendChild(card);
        });

        // Initialize preview panel for active set
        const activeSet = this.currentSetInPreview || this._getEquippedSet();
        if (activeSet) {
            this.updateSetPreviewPanel(activeSet);
        }
    }

    equipSet(set) {
        if (!set || !set.items) return;
        for (const [cat, file] of Object.entries(set.items)) {
            window.characterModel.state[cat] = file;
        }
        window.characterModel.saveState();
        this.committedState = { ...window.characterModel.state };

        // Automatically turn ON effect toggle for legendary set
        if (set.rank === 'legendary' && window.configManager) {
            window.configManager.setSetEffectEnabled(true);
        }

        // Auto-apply exclusive background for legendary sets
        if (set.rank === 'legendary' && window.configManager) {
            const exclusiveBg = window.configManager.getExclusiveBgForSet(set.id);
            if (exclusiveBg && window.configManager.isBackgroundUnlocked(exclusiveBg)) {
                window.configManager.setBackground(exclusiveBg.file);
                this.showToast(`🌄 پاشبنەمای «${exclusiveBg.name}» خۆکارانە گۆڕدرا!`);
            }
        }

        // Notify legendary effects engine
        if (window.legendaryEffects) window.legendaryEffects.notifySetEquipped(set.id);

        // Stive's set effect is built around the default grab-and-punch control.
        if (set.id === 'stive' && window.gameEngine) {
            const handWeapon = WEAPONS.find(weapon => weapon.id === 'hand');
            if (handWeapon) {
                window.gameEngine.selectedWeapon = handWeapon;
                const activeIcon = document.getElementById('game-active-weapon-icon');
                if (activeIcon) activeIcon.src = 'assets/icons/hand.png';
            }
        }

        this.updatePreview();
        this.updateSetPreviewPanel(set);
        this.renderItemsList(true); // Preserve scroll position
        this.showToast(`✨ سێتی «${set.name}» پۆشرا!`);
    }

    previewSet(set) {
        if (!set || !set.items) return;
        if (window.soundEngine) window.soundEngine.playButton();
        for (const [cat, file] of Object.entries(set.items)) {
            window.characterModel.state[cat] = file;
        }
        this.updatePreview();
        this.updateSetPreviewPanel(set);
        this.renderItemsList(true); // Preserve scroll position
        this.showToast(`👁️ پێشبینینی سێتی «${set.name}»`);
    }

    promptBuySet(set) {
        const rankData = ITEM_RANKS[set.rank] || ITEM_RANKS.gold;
        this.openBuyModal({
            title: `کڕینی سێتی ${set.name}`,
            rank: set.rank,
            image: set.image,
            desc: `ئەم سێتە تەواوە جلوبەرگ و کەرەستەکانی تایبەت بە ${set.name} لەخۆدەگرێت. لەگەڵ کردنەوەیدا، هەموو بەشەکانی ناو سێتەکەش بۆ هەمیشە دەکرێنەوە!`,
            priceCoins: set.priceCoins,
            priceDiamonds: set.priceDiamonds,
            onConfirm: () => {
                const success = window.configManager.buySet(set.id);
                if (success) {
                    this.closeBuyModal();
                    this.hidePreviewBuyBar();
                    this.equipSet(set);
                    this.updateCurrencyHeader();
                    this.showToast(`🎉 پیرۆزە! سێتی «${set.name}» بە سەرکەوتوویی کرایەوە!`);
                } else {
                    this.showToast('⚠️ دراوی پێویستت نییە بۆ کڕینی ئەم سێتە!');
                }
            }
        });
    }

    // =========================================================================
    // 2. BACKGROUNDS SECTION
    // =========================================================================
    renderBackgroundsList() {
        // Show background preview instead of character
        this._showBgPreview(window.configManager ? window.configManager.activeBackground : null);

        AVAILABLE_BACKGROUNDS.forEach(bg => {
            const card = document.createElement('div');
            const cm = window.configManager;

            // Use the new isBackgroundUnlocked() which handles set-exclusive backgrounds
            const isUnlocked = cm ? cm.isBackgroundUnlocked(bg) : (bg.priceCoins === 0);
            const isEquipped = cm ? cm.activeBackground === bg.file : false;
            const rankData = ITEM_RANKS[bg.rank] || ITEM_RANKS.uncommon;
            const isSetExclusive = !!bg.exclusiveSetId;

            card.className = `customizer-bg-card rank-${bg.rank} ${isEquipped ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${isSetExclusive ? 'set-exclusive-bg' : ''}`;

            // Price/lock label
            let lockHtml = '';
            if (!isUnlocked) {
                if (isSetExclusive) {
                    const linkedSet = CARD_SETS.find(s => s.id === bg.exclusiveSetId);
                    lockHtml = `<div class="item-lock-badge set-exclusive-lock">🔒 تەنها لەگەڵ سێتی «${linkedSet ? linkedSet.name : ''}»</div>`;
                } else {
                    lockHtml = '<div class="item-lock-badge">🔒</div>';
                }
            }

            card.innerHTML = `
                <div class="item-rank-pill" style="background: ${rankData.color};">${rankData.name}</div>
                ${lockHtml}
                <div class="customizer-bg-thumb">
                    <img src="backgrounds/${encodeURI(bg.file)}" alt="${bg.name}" loading="lazy">
                </div>
                <div class="customizer-bg-name">${bg.name}</div>
                ${isSetExclusive && !isUnlocked ? '<div class="set-exclusive-hint">🎴 سێت بکڕە بیکرێتەوە</div>' : ''}
            `;

            card.onclick = () => {
                if (window.soundEngine) window.soundEngine.playButton();
                this._showBgPreview(bg.file);
                if (isUnlocked) {
                    if (cm) cm.setBackground(bg.file);
                    this.hidePreviewBuyBar();
                    this.renderItemsList(true);
                    this.showToast(`🌄 پاشبنەمای «${bg.name}» هەڵبژێردرا!`);
                } else if (!isSetExclusive) {
                    // Only show buy bar for non-exclusive backgrounds
                    this.showPreviewBuyBar({
                        priceCoins: bg.priceCoins,
                        priceDiamonds: bg.priceDiamonds,
                        pendingBuy: { type: 'background', bg }
                    });
                    this.showToast(`👁️ پێشبینینی «${bg.name}»`);
                } else {
                    // Set-exclusive: guide user to buy the set
                    const linkedSet = CARD_SETS.find(s => s.id === bg.exclusiveSetId);
                    this.showToast(`🎴 ئەم پاشبنەمایە تەنها لەگەڵ کڕینی سێتی «${linkedSet ? linkedSet.name : ''}» دەکرێتەوە!`);
                }
            };

            this.itemsGridContainer.appendChild(card);
        });
    }

    _showBgPreview(bgFile) {
        // Hide character, show scrollable background panorama
        if (this.previewContainer) {
            this.previewContainer.style.display = 'none';
        }
        let bgEl = document.getElementById('customizer-preview-bg-mode');
        if (!bgEl) {
            bgEl = document.createElement('div');
            bgEl.id = 'customizer-preview-bg-mode';
            bgEl.className = 'customizer-preview-bg-mode';
            const previewCol = document.querySelector('.customizer-preview-col');
            if (previewCol) previewCol.appendChild(bgEl);

            // Drag-to-scroll support
            let isDown = false, startX = 0, scrollLeft = 0;
            bgEl.addEventListener('mousedown', (e) => {
                isDown = true;
                bgEl.style.cursor = 'grabbing';
                startX = e.pageX - bgEl.offsetLeft;
                scrollLeft = bgEl.scrollLeft;
            });
            bgEl.addEventListener('mouseleave', () => { isDown = false; bgEl.style.cursor = 'grab'; });
            bgEl.addEventListener('mouseup',    () => { isDown = false; bgEl.style.cursor = 'grab'; });
            bgEl.addEventListener('mousemove',  (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - bgEl.offsetLeft;
                bgEl.scrollLeft = scrollLeft - (x - startX) * 1.5;
            });
            // Touch support
            let touchStartX = 0, touchScrollLeft = 0;
            bgEl.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].pageX; touchScrollLeft = bgEl.scrollLeft; });
            bgEl.addEventListener('touchmove',  (e) => {
                const dx = touchStartX - e.touches[0].pageX;
                bgEl.scrollLeft = touchScrollLeft + dx;
            });
            // Block native browser image drag (prevents image being pulled out of window)
            bgEl.addEventListener('dragstart', (e) => e.preventDefault());
        }
        bgEl.style.display = 'flex';
        if (bgFile) {
            bgEl.innerHTML = `<img class="customizer-preview-bg-img" src="backgrounds/${encodeURI(bgFile)}" alt="پاشبنەما" draggable="false" style="width:auto;height:100%;min-width:100%;max-width:none;pointer-events:none;user-select:none;-webkit-user-drag:none;">`;
        } else {
            bgEl.innerHTML = `<div style="color:#a4b0be;font-size:1rem;text-align:center;width:100%;">🌄 پاشبنەمایەک هەڵبژێرە</div>`;
        }
        // Reset scroll position to start
        bgEl.scrollLeft = 0;
    }

    _hideBgPreview() {
        // Show character, hide background preview
        if (this.previewContainer) {
            this.previewContainer.style.display = '';
        }
        const bgEl = document.getElementById('customizer-preview-bg-mode');
        if (bgEl) bgEl.style.display = 'none';
    }

    _doBuyBackground(bg) {
        if (!bg) return;
        const cm = window.configManager;
        if (!cm) return;
        if (cm.coins >= bg.priceCoins && cm.diamonds >= bg.priceDiamonds) {
            if (window.soundEngine) window.soundEngine.playDiamond();
            cm.saveCoins(cm.coins - bg.priceCoins);
            cm.saveDiamonds(cm.diamonds - bg.priceDiamonds);
            cm.unlockItem(`bg_${bg.file}`);
            cm.setBackground(bg.file);
            cm.notifyEconomyChange();
            this.hidePreviewBuyBar();
            this.renderItemsList();
            this.showToast(`🎉 پیرۆزە! پاشبنەمای «${bg.name}» کرایەوە!`);
        } else {
            this.showToast('⚠️ دراوی پێویستت نییە بۆ کڕینی ئەم پاشبنەمایە!');
        }
    }

    // =========================================================================
    // 3. INDIVIDUAL ITEMS SECTION (With Ranks, Economy & Unlock by Card Set)
    // =========================================================================
    renderCategoryItemsList() {
        const currentPart = window.characterModel.state[this.selectedCategory];
        const files = ASSETS_MANIFEST.bodyParts[this.selectedCategory] || [];

        // Allow 'None' for everything except required body and head shape
        const requiredCategories = ['bodys', 'head_shapes'];
        const isOptional = !requiredCategories.includes(this.selectedCategory);
        if (isOptional) {
            const noneCard = document.createElement('div');
            noneCard.className = `customizer-item-card rank-uncommon ${!currentPart ? 'selected' : ''}`;
            noneCard.innerHTML = `
                <div class="item-rank-indicator rank-uncommon"></div>
                <div class="item-none-icon">🚫</div>
                <div class="item-label">هیچ (None)</div>
            `;
            noneCard.onclick = () => {
                if (window.soundEngine) window.soundEngine.playButton();
                window.characterModel.setPart(this.selectedCategory, null);
                if (this.committedState) this.committedState[this.selectedCategory] = null;
                if (window.legendaryEffects) window.legendaryEffects.notifySetBroken();
                this.hidePreviewBuyBar();
                this.updatePreview();
                this.renderItemsList(true);
            };
            this.itemsGridContainer.appendChild(noneCard);
        }

        files.forEach(file => {
            const card = document.createElement('div');
            const itemData = getItemRankAndPrice(this.selectedCategory, file);
            const rankData = ITEM_RANKS[itemData.rank] || ITEM_RANKS.uncommon;
            const isUnlocked = window.configManager ? window.configManager.isItemUnlocked(this.selectedCategory, file) : true;
            const isSelected = currentPart === file;

            card.className = `customizer-item-card rank-${itemData.rank} ${isSelected ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`;
            // No inline borderColor — kept unified by CSS

            const imgPath = window.assetManager.getItemPath(this.selectedCategory, file);

            card.innerHTML = `
                <div class="item-rank-pill" style="background: ${rankData.color};">
                    ${rankData.name}
                </div>
                ${!isUnlocked ? '<div class="item-lock-badge">🔒</div>' : ''}
                <div class="item-thumb-wrapper">
                    <img src="${encodeURI(imgPath)}" alt="${file}" loading="lazy">
                </div>
                <div class="item-id-badge">${file.replace('.png', '')}</div>
            `;

            // Clicking the card previews OR equips
            card.onclick = () => {
                if (window.soundEngine) window.soundEngine.playButton();
                if (isUnlocked) {
                    window.characterModel.setPart(this.selectedCategory, file);
                    if (this.committedState) this.committedState[this.selectedCategory] = file;
                    this.hidePreviewBuyBar();
                    // Notify effects engine that set might be broken by changing a part
                    if (window.legendaryEffects) window.legendaryEffects.notifySetBroken();
                } else {
                    // Preview only (not permanently saved)
                    window.characterModel.state[this.selectedCategory] = file;
                    // Show buy bar at bottom-left of preview
                    this.showPreviewBuyBar({
                        priceCoins: itemData.priceCoins,
                        priceDiamonds: itemData.priceDiamonds,
                        pendingBuy: { type: 'item', category: this.selectedCategory, file, itemData, imgPath }
                    });
                }
                this.updatePreview();
                this.renderItemsList(true);
            };

            this.itemsGridContainer.appendChild(card);
        });
    }

    promptBuyItem(category, file, itemData, imgPath) {
        let desc = 'ئەم کەرەستەیە بە شێوەی هەمیشەیی بۆ کەسایەتیت دەکرێتەوە.';
        if (itemData.setRef) {
            desc = `ئەم کەرەستەیە بەشێکە لە سێتی «${itemData.setRef.name}». دەتوانیت ئێستا بیکڕیت یان لەگەڵ کڕینی تەواوی سێتەکە خۆکارانە دەکرێتەوە!`;
        }

        this.openBuyModal({
            title: `کڕینی کەرەستە (${file.replace('.png', '')})`,
            rank: itemData.rank,
            image: imgPath,
            desc: desc,
            priceCoins: itemData.priceCoins,
            priceDiamonds: itemData.priceDiamonds,
            onConfirm: () => {
                const success = window.configManager.buyItem(category, file);
                if (success) {
                    this.closeBuyModal();
                    this.hidePreviewBuyBar();
                    window.characterModel.setPart(category, file);
                    if (this.committedState) this.committedState[category] = file;
                    if (window.legendaryEffects) window.legendaryEffects.notifySetBroken();
                    this.updatePreview();
                    this.renderItemsList(true);
                    this.updateCurrencyHeader();
                    this.showToast('🎉 پیرۆزە! کەرەستەکە بە سەرکەوتوویی کرایەوە و پۆشرا!');
                } else {
                    this.showToast('⚠️ دراوی پێویستت نییە بۆ کڕینی ئەم کەرەستەیە!');
                }
            }
        });
    }

    // =========================================================================
    // 4. PURCHASE / UNLOCK MODAL
    // =========================================================================
    openBuyModal(opts) {
        const modal = document.getElementById('customizer-buy-modal');
        if (!modal) return;

        const rankData = ITEM_RANKS[opts.rank] || ITEM_RANKS.uncommon;
        const rankBadge = document.getElementById('customizer-modal-rank-badge');
        if (rankBadge) {
            rankBadge.textContent = rankData.name;
            rankBadge.style.background = rankData.gradient;
            rankBadge.style.boxShadow = `0 2px 10px ${rankData.glow}`;
        }

        const titleEl = document.getElementById('customizer-modal-title');
        if (titleEl) titleEl.textContent = opts.title || 'کڕین';

        const imgEl = document.getElementById('customizer-modal-img');
        if (imgEl) imgEl.src = encodeURI(opts.image || '');

        const descEl = document.getElementById('customizer-modal-desc');
        if (descEl) descEl.textContent = opts.desc || '';

        const priceDisplay = document.getElementById('customizer-modal-price-display');
        if (priceDisplay) {
            let p = '';
            if (opts.priceCoins > 0)    p += `<span class="price-pill-coin">🪙 ${opts.priceCoins} سکە</span> `;
            if (opts.priceDiamonds > 0) p += `<span class="price-pill-diamond">💎 ${opts.priceDiamonds} ئەڵماس</span> `;
            if (!p) p = '<span class="price-pill-free">خۆڕایی</span>';
            priceDisplay.innerHTML = p;
        }

        const btnConfirm = document.getElementById('btn-modal-confirm-buy');
        if (btnConfirm) {
            btnConfirm.onclick = () => {
                if (opts.onConfirm) opts.onConfirm();
            };
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
        this.activeModal = modal;
    }

    closeBuyModal() {
        const modal = document.getElementById('customizer-buy-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        this.activeModal = null;
    }

    // Toast Alert Helper
    showToast(message) {
        let toast = document.getElementById('customizer-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'customizer-toast';
            toast.className = 'customizer-toast-popup';
            const screen = document.getElementById('screen-customizer');
            if (screen) screen.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2800);
    }

    // =========================================================================
    // FULLSCREEN BACKGROUND PREVIEW (for exclusive bg thumbnails on set cards)
    // =========================================================================
    openBgFullscreenPreview(bgFile, bgName) {
        let overlay = document.getElementById('bg-fullscreen-preview');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'bg-fullscreen-preview';
            overlay.className = 'bg-fullscreen-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="bg-fullscreen-inner">
                <img class="bg-fullscreen-img" src="backgrounds/${encodeURI(bgFile)}" alt="${bgName || ''}" draggable="false">
                <div class="bg-fullscreen-label">
                    <span class="bg-fullscreen-name">🖼️ ${bgName || ''}</span>
                    <span class="bg-fullscreen-hint">پاشبنەمای ئەم سێتە — تەنها لەگەڵ کڕینی سێتەکە دەکرێتەوە</span>
                </div>
                <button class="bg-fullscreen-close-btn" id="btn-bg-fullscreen-close" title="داخستن">✕ داخستن</button>
            </div>
        `;

        overlay.style.display = 'flex';

        const closeBtn = overlay.querySelector('#btn-bg-fullscreen-close');
        if (closeBtn) {
            closeBtn.onclick = () => { overlay.style.display = 'none'; };
        }
        // Also close on backdrop click
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.style.display = 'none';
        };
    }

    updatePreview() {
        if (this.previewContainer && window.characterModel) {
            window.characterModel.render(this.previewContainer);
        }
    }
}

window.characterCustomizer = new CharacterCustomizer();
