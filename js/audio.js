/**
 * Mama Vana - Advanced Hybrid Audio Engine
 * Supports custom MP3 files for attacks and periodic ambient voice lines,
 * with real-time procedural Web Audio API fallback.
 */

// =============================================================================
// EASILY EDITABLE SOUND PATHS
// Add, edit, or remove sound file paths here.
// When adding .mp3 files into attack folders or assets/sounds, just add them below!
// =============================================================================

// Per-attack MP3 sound files (played randomly when attack hits)
const ATTACK_SOUND_FILES = {
    'slap': [
        'attaker/slap/hit1.mp3',
        'attaker/slap/hit2.mp3',
        'attaker/slap/sound.mp3'
    ],
    'Karate': [
        'attaker/Karate/hit1.mp3',
        'attaker/Karate/karate.mp3',
        'attaker/Karate/punch.mp3'
    ],
    'choking': [
        'attaker/choking/choke1.mp3',
        'attaker/choking/sound.mp3'
    ],
    'eye_popping': [
        'attaker/eye popping/pop1.mp3',
        'attaker/eye popping/sound.mp3'
    ],
    'punch': [
        'attaker/punch/punch.mp3',
        'attaker/punch/hit.mp3'
    ],
    'akm': [
        'attaker/shooting/akm/akm_single_fire.mp3'
    ],
    'm4': [
        'attaker/shooting/m4/m4_single_fire.mp3'
    ]
};

// Fallback ambient/idle voice list - used only if SOUND_TALK_TIMINGS has no ambient_ entries.
// These filenames must match the actual files in assets/sounds/normal_voices/
const AMBIENT_VOICE_FILES = [
    'assets/sounds/normal_voices/347.mp3',
    'assets/sounds/normal_voices/356.mp3',
    'assets/sounds/normal_voices/357.mp3',
    'assets/sounds/normal_voices/385.mp3',
    'assets/sounds/normal_voices/386.mp3',
    'assets/sounds/normal_voices/460.mp3'
];

const RADIO_TRACKS = [
    { title: 'Kurdsat FM 1', file: 'assets/sounds/radio/track1.mp3' },
    { title: 'Vana FM 2', file: 'assets/sounds/radio/track2.mp3' },
    { title: 'Vana FM 3', file: 'assets/sounds/radio/track3.mp3' },
    { title: 'Nalia FM 4', file: 'assets/sounds/radio/track4.mp3' },
    { title: 'Vana FM 5', file: 'assets/sounds/radio/track5.mp3' },
    { title: 'Vana FM 6', file: 'assets/sounds/radio/track6.mp3' },
    { title: 'Taxi FM 7', file: 'assets/sounds/radio/track7.mp3' }
];

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.ambientMuted = false;
        this.sfxVolume = 1.0;
        this.ambientTimer = null;
        this.currentVoiceAudio = null; // Single voice track - only one voice at a time
        this.radioAudio = null;
        this.radioTuningAudio = null;
        this.radioTrackIndex = 0;
        this.radioVolume = 0.25;
        this.radioEnabled = true;
        this.initialized = false;
        this.loadSettings();
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API initialized with limited capabilities', e);
        }

        this.startAmbientVoiceScheduler();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('mama_vana_sound_settings');
            if (saved) {
                const cfg = JSON.parse(saved);
                this.muted = !!cfg.muted;
                this.ambientMuted = !!cfg.ambientMuted;
                this.sfxVolume = cfg.sfxVolume !== undefined ? cfg.sfxVolume : 1.0;
                this.radioVolume = cfg.radioVolume !== undefined ? cfg.radioVolume : 0.25;
                this.radioEnabled = cfg.radioEnabled !== undefined ? !!cfg.radioEnabled : true;
            }
        } catch (e) { }
    }

    saveSettings() {
        try {
            localStorage.setItem('mama_vana_sound_settings', JSON.stringify({
                muted: this.muted,
                ambientMuted: this.ambientMuted,
                sfxVolume: this.sfxVolume,
                radioVolume: this.radioVolume,
                radioEnabled: this.radioEnabled
            }));
        } catch (e) { }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) this.stopRadio();
        this.saveSettings();
        return this.muted;
    }

    setMute(state) {
        this.muted = !!state;
        if (this.muted) this.stopRadio();
        this.saveSettings();
    }

    setAmbientMute(state) {
        const wasEnabled = !this.ambientMuted;
        this.ambientMuted = !!state;
        this.saveSettings();
        // If ambient was just RE-ENABLED, restart the scheduler so it doesn't stay dead
        if (wasEnabled === false && !this.ambientMuted) {
            this.startAmbientVoiceScheduler();
        }
    }

    setVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, parseFloat(val)));
        this.saveSettings();
    }

    setRadioVolume(val) {
        this.radioVolume = Math.max(0, Math.min(1, parseFloat(val)));
        if (this.radioAudio) this.radioAudio.volume = this.radioVolume;
        this.saveSettings();
        this.updateRadioWidgets();
    }

    setRadioEnabled(state) {
        this.radioEnabled = !!state;
        if (!this.radioEnabled) this.stopRadio();
        this.saveSettings();
        this.updateRadioWidgets();
    }

    playRadioTrack(index = this.radioTrackIndex, playTuning = false) {
        if (this.muted || !this.radioEnabled || RADIO_TRACKS.length === 0) return false;
        this.radioTrackIndex = (index + RADIO_TRACKS.length) % RADIO_TRACKS.length;
        const track = RADIO_TRACKS[this.radioTrackIndex];
        if (playTuning) this.playRadioTuning(true);
        this.stopRadio();
        const audio = new Audio(encodeURI(track.file));
        audio.volume = this.radioVolume;
        audio.onended = () => this.playRadioTrack(this.radioTrackIndex + 1, true);
        this.radioAudio = audio;
        audio.play().then(() => this.updateRadioWidgets()).catch(() => {
            this.radioAudio = null;
            this.updateRadioWidgets();
        });
        this.updateRadioWidgets();
        return true;
    }

    toggleRadio() {
        if (this.radioAudio && !this.radioAudio.paused) {
            this.radioAudio.pause();
            this.updateRadioWidgets();
            return false;
        }
        return this.playRadioTrack(this.radioTrackIndex);
    }

    seekRadio(seconds) {
        if (!this.radioAudio) return;
        this.radioAudio.currentTime = Math.max(
            0,
            Math.min(this.radioAudio.duration || Infinity, this.radioAudio.currentTime + seconds)
        );
    }

    playRadioTuning(restart = false) {
        if (this.muted) return false;
        if (!restart && this.radioTuningAudio && !this.radioTuningAudio.paused) return true;
        if (this.radioTuningAudio) this.radioTuningAudio.pause();
        try {
            const audio = new Audio(encodeURI('assets/sounds/radio/radio tuning.mp3'));
            audio.volume = this.sfxVolume;
            this.radioTuningAudio = audio;
            audio.onended = () => {
                if (this.radioTuningAudio === audio) this.radioTuningAudio = null;
            };
            audio.play().catch(() => { });
            return true;
        } catch (e) {
            return false;
        }
    }

    stopRadio() {
        if (!this.radioAudio) return;
        this.radioAudio.pause();
        this.radioAudio.currentTime = 0;
        this.radioAudio = null;
        this.updateRadioWidgets();
    }

    updateRadioWidgets() {
        const track = RADIO_TRACKS[this.radioTrackIndex];
        document.querySelectorAll('[data-radio-widget]').forEach(widget => {
            const title = widget.querySelector('[data-radio-title]');
            const volume = widget.querySelector('[data-radio-volume]');
            const play = widget.querySelector('[data-radio-action="toggle"]');
            if (title && track) title.textContent = track.title;
            if (volume) volume.value = this.radioVolume;
            if (play) {
                const icon = play.querySelector('.emoji-icon');
                if (icon) icon.textContent = this.radioAudio && !this.radioAudio.paused ? '⏸' : '▶';
                else play.textContent = this.radioAudio && !this.radioAudio.paused ? '⏸' : '▶';
            }
            widget.hidden = !this.radioEnabled;
            widget.classList.toggle('is-playing', !!this.radioAudio && !this.radioAudio.paused);
        });
    }

    /**
     * Stops the currently playing voice track and mouth animation.
     */
    stopCurrentVoice() {
        if (this.currentVoiceAudio) {
            try {
                this.currentVoiceAudio.pause();
                this.currentVoiceAudio.currentTime = 0;
            } catch (e) { }
            this.currentVoiceAudio = null;
        }
        if (window.characterModel && window.characterModel.stopTalking) {
            window.characterModel.stopTalking();
        }
    }

    /**
     * Plays an MP3 audio file. If isVoice=true, stops any previous voice first
     * so only one voice plays at a time.
     */
    playAudioFile(filePath, volumeMultiplier = 1.0, isVoice = false) {
        if (this.muted) return false;
        try {
            if (isVoice) this.stopCurrentVoice();

            const audio = new Audio(encodeURI(filePath));
            audio.volume = Math.max(0, Math.min(1, this.sfxVolume * volumeMultiplier));

            if (isVoice) {
                this.currentVoiceAudio = audio;
                audio.onended = () => {
                    if (this.currentVoiceAudio === audio) this.currentVoiceAudio = null;
                };
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // File missing or autoplay blocked - fail silently
                });
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Plays wall hit sound.
     */
    playWallHit() {
        if (this.muted) return;
        this.resume();
        this.playAudioFile('assets/sounds/wall_hit.mp3', 1.0, false);
    }

    /**
     * Plays attack SFX (non-voice, MP3 from attack folder only).
     * Stops any current voice so the hit sound is clean.
     */
    playAttackSound(attackId) {
        if (this.muted) return;
        this.resume();

        // Stop ongoing voice immediately when a new attack fires
        this.stopCurrentVoice();

        const candidates = [];
        const mp3List = ATTACK_SOUND_FILES[attackId];
        if (mp3List && mp3List.length > 0) candidates.push(...mp3List);

        // Also check DB config for a file path (regular attacks or shooting weapons)
        const atkCfg = (window.coordinatesDB && window.coordinatesDB.getAttackConfig(attackId)) || {};
        if (atkCfg.sound && window.coordinatesDB && window.coordinatesDB.getSoundTiming) {
            const snd = window.coordinatesDB.getSoundTiming(atkCfg.sound);
            if (snd && snd.file) candidates.push(snd.file);
        }

        const shootCfg = (window.coordinatesDB && window.coordinatesDB.getShootingConfig(attackId));
        if (shootCfg && shootCfg.sound) {
            candidates.push(shootCfg.sound);
        }

        if (candidates.length > 0) {
            const randIndex = Math.floor(Math.random() * candidates.length);
            this.playAudioFile(candidates[randIndex], 1.0, false);
        }
    }

    /**
     * Plays a random reaction voice (voice_* keys only) after attacks.
     * Uses ONLY the voice set matching the player's current age mode.
     * Returns timing object for lip-sync. Only one voice plays at a time.
     */
    playRandomReactionVoice() {
        if (this.muted || Math.random() >= 0.25) return null;
        this.resume();

        // +18 mode intentionally includes both safe and adult reaction voices.
        const timings = (typeof getActiveVoiceTimings === 'function')
            ? getActiveVoiceTimings()
            : ((window.coordinatesDB && window.coordinatesDB.getAllSoundTimings()) || SOUND_TALK_TIMINGS);

        // Pick voice_* entries only
        const voiceKeys = Object.keys(timings).filter(k => k.startsWith('voice_') && timings[k] && timings[k].file);

        if (voiceKeys.length === 0) return null;
        const randKey = voiceKeys[Math.floor(Math.random() * voiceKeys.length)];
        const voiceItem = timings[randKey];

        if (voiceItem && voiceItem.file) {
            this.playAudioFile(voiceItem.file, 1.0, true); // isVoice=true stops previous voice
        }

        return {
            key: randKey,
            ...(voiceItem || { durationMs: 2000, talkSpeed: 100 })
        };
    }


    /**
     * Scheduler for random Kurdish voice lines + talking animation.
     * Fires every 20 seconds. Voice, mouth animation and speech bubble
     * are all triggered together so they are always in sync.
     */
    startAmbientVoiceScheduler() {
        if (this.ambientTimer) clearTimeout(this.ambientTimer);
        this.ambientTimer = setTimeout(() => {
            this.playRandomAmbientVoice();
            this.startAmbientVoiceScheduler();
        }, 10000); // 10 seconds
    }

    /**
     * Plays ambient/idle voice strictly from ambient_* keys (never from voice_* or attack sounds).
     * Only fires when the gameplay screen is active (gameEngine.running).
     */
    playRandomAmbientVoice() {
        if (this.muted || this.ambientMuted) return;

        const isGameplay = window.gameEngine && window.gameEngine.running;
        const isCustomizer = window.gameApp && window.gameApp.currentScreen === 'customizer';
        if (!isGameplay && !isCustomizer) return;

        const timings = {
            ...SOUND_TALK_TIMINGS,
            ...((window.coordinatesDB && window.coordinatesDB.getAllSoundTimings()) || {})
        };
        const ambientKeys = Object.keys(timings).filter(k => k.startsWith('ambient_') && timings[k] && timings[k].file);

        let ambientFile = '';
        let talkDur = 2500;
        let talkSpeed = 110;

        if (ambientKeys.length > 0) {
            const randKey = ambientKeys[Math.floor(Math.random() * ambientKeys.length)];
            const item = timings[randKey];
            ambientFile = item.file;
            talkDur = item.durationMs || 2500;
            talkSpeed = item.talkSpeed || 110;
        } else if (AMBIENT_VOICE_FILES.length > 0) {
            ambientFile = AMBIENT_VOICE_FILES[Math.floor(Math.random() * AMBIENT_VOICE_FILES.length)];
        }

        if (!ambientFile) return; // nothing to play

        // If a reaction voice is mid-play, wait — don't interrupt it.
        // Clear the stale reference if the audio has actually finished.
        if (this.currentVoiceAudio) {
            const a = this.currentVoiceAudio;
            if (a.ended || a.paused || a.error) {
                this.currentVoiceAudio = null; // stale — clear it
            } else {
                // Genuinely still playing — skip this round, scheduler retries in 20s
                return;
            }
        }

        this.playAudioFile(ambientFile, 0.95, true);

        const quotes = KURDISH_QUOTES.onIdle;
        const randQuote = quotes[Math.floor(Math.random() * quotes.length)];
        if (isGameplay && window.gameEngine.showSpeechBubble) {
            window.gameEngine.showSpeechBubble(randQuote, talkDur + 500);
        }
        if (window.characterModel) window.characterModel.startTalking(talkDur, talkSpeed);
    }

    // =========================================================================
    // Procedural Web Audio API Synthesizers
    // =========================================================================
    playSlap() {
        this.playAttackSound('slap');
    }

    playPunch() {
        this.playAttackSound('punch');
    }

    playKarate() {
        this.playAttackSound('Karate');
    }

    playChoke() {
        this.playAttackSound('choking');
    }

    playEyePop() {
        this.playAttackSound('eye_popping');
    }

    playSynthSlap() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        oscGain.gain.setValueAtTime(0.7 * this.sfxVolume, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(now);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playSynthPunch() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

        gain.gain.setValueAtTime(1.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playSynthKarate() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
        filter.frequency.exponentialRampToValueAtTime(600, now + 0.22);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.8 * this.sfxVolume, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);

        setTimeout(() => this.playSynthPunch(), 80);
    }

    playSynthChoke() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.15);
        osc.frequency.linearRampToValueAtTime(260, now + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    playSynthEyePop() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

        gain.gain.setValueAtTime(0.9 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playCoin() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(987.77, now);
        osc2.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
    }

    playDiamond() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2400, now + 0.18);

        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playBonk() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

        gain.gain.setValueAtTime(0.8 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playButton() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.08);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }
}

window.soundEngine = new SoundEngine();
