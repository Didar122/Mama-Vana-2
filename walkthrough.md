# Complete Walkthrough: New Weapons, Spiders, Elder Wand Spells & Custom Items

This document details all the changes implemented across the game codebase ("Mama Vana"). It is written so other developers and AI assistants can understand the exact architecture, data flows, and mechanics.

---

## 1. 6 New Swords (`attaker/swords`) & Floor Mop Sound

### 1.1 Registered Weapons in `js/config.js`
Added all 6 new swords into `WEAPONS` under category `'swords'`:
- **`axe`**: "تەوەر (Axe)"
- **`blades_of_chaos`** (alias: `Blade of Chaos`): "شمشێرەکانی ئاژاوە (Blades of Chaos)"
- **`club`**: "داردەست (Club)"
- **`floor_mop`** (alias: `floor mop`): "فڵچەی پاککەرەوە (Floor Mop)"
- **`karambit`**: "کارامبیت (Karambit)"
- **`pubg_pan`** (alias: `pubg pan`): "مەقڵیی ببجی (PUBG Pan)"

### 1.2 Coordinates & Hit Offsets in `js/coordinates.js`
In `SWORDS_WEAPONS_COORDINATES`, defined proper physics anchor points, rotation offsets, hand positions, impact sounds, and hit tracks for each weapon.
- For **`floor mop`**, configured:
  ```javascript
  extraSound: 'attaker/swords/floor mop/extra sound.mp3',
  extraSoundInterval: 20
  ```

### 1.3 20-Hit Extra Sound Counter in `js/game.js`
- Initialized `this.swordHitCounts = {}` in `GameEngine.constructor()`.
- Inside `triggerSwordHit(session, impactPt, swordCfg)`:
  ```javascript
  const hitCount = (this.swordHitCounts[session.weaponId] || 0) + 1;
  this.swordHitCounts[session.weaponId] = hitCount;
  if (swordCfg.extraSound && (hitCount % (swordCfg.extraSoundInterval || 20) === 0)) {
      window.soundEngine.playAudioFile(swordCfg.extraSound, 1.0, false);
  }
  ```
- Each 20th hit with the floor mop plays `attaker/swords/floor mop/extra sound.mp3`.

---

## 2. Special Weapons (`attaker/special`)

### 2.1 Spiders Weapon (`attaker/special/spiders`)

#### Mechanics & Implementation:
1. **Selection**:
   - Selecting `spiders` sets the special weapon.
2. **Dropping Spiders (`dropSpider(startX, startY)`)**:
   - Clicking on screen drops a spider element (`.game-spider-actor`) with `frame1.gif`.
   - Plays `spider walk.mp3`.
   - Mama Vana's eyes are switched to `2.png` via `window.characterModel.setEyeOverride('2.png')`.
3. **Mirroring (Directional Facing)**:
   - The GIF `frame1.gif` natively has the spider head facing **left**.
   - In `updateSpidersPhysics(dt)` and `updateSpiderDrag(x, y)`:
     - When spider is to the right of Mama Vana (`spider.x >= bossX`), `scaleX = 1.0` (faces left toward boss).
     - When spider is to the left of Mama Vana (`spider.x < bossX`), `scaleX = -1.0` (mirrored horizontally to face right toward boss).
4. **Autonomous Pathfinding & Biting**:
   - Spider picks a random relative location on Mama Vana (`targetRelX`, `targetRelY`).
   - Walks smoothly towards the target (`speed = 250px/s`).
   - Once within 20px, state becomes `'biting'`.
   - Biting runs via `setInterval` every `500ms` (0.5s interval):
     - Decrements `bitesLeft` (starts at 10).
     - Plays `spider bite.mp3`.
     - Inflicts damage and spawns blood splat (`attaker/special/spiders/blood.png`).
     - Adds a biting twitch animation class `.biting`.
     - After 10 bites, fades out and is removed.
5. **Draggability & Re-engaging**:
   - Spiders can be dragged anywhere on the screen (including on Mama Vana).
   - While dragged, biting pauses.
   - When dropped anywhere, the spider resumes walking towards its assigned target on Mama Vana and completes its remaining bites.
6. **Eye Restoration**:
   - When all active spiders on screen have disappeared (`this.activeSpiders.length === 0`), `window.characterModel.clearEyeOverride()` restores Mama Vana's original eyes.

---

### 2.2 Elder Wand Weapon (`attaker/special/elder wand`)

#### General Mechanics:
- When `elder_wand` is selected:
  - An interactive spell bar (`.elder-wand-spell-bar`) docks at the top-center of the screen.
  - Buttons allow switching between the 6 spells:
    1. 🟢 **Avada Kedavra** (`avada_kedavra`)
    2. 🔴 **Expelliarmus** (`expelliarmus`)
    3. ⚡ **Petrificus Totalus** (`petrificus_totalus`)
    4. 💡 **Lumos** (`lumos`)
    5. 🌸 **Orchideous** (`orchideous`)
    6. 🎭 **Ridiculous** (`ridiculous`)
- **Holding / Pointing**:
  - The wand handles hold-and-drag: points its tip at Mama Vana's chest (`atan2(dy, dx) + 90deg`).
- **Cooldown System**:
  - `this.elderWandCooldown` blocks new attacks until the current spell's animation and lifecycle complete.
- **Incantation & Flick Animation**:
  - Plays `<spell_name>.mp3` (the voice chanting the spell).
  - Wand executes Harry Potter waving gesture (swings left -28°, right +30°, then snaps forward).
  - At 450ms, flick completes: plays `shoot.mp3`, then fires the specific spell effect.

---

#### The 6 Spells Detailed:

1. **Avada Kedavra (`executeAvadaKedavra`)**:
   - Fires a 4-frame cycling green beam (`frame1.png` to `frame4.png`) with green glow shadow.
   - On impact:
     - Inflicts 85 damage + hit sparks + blood.
     - Creates `.avada-screen-overlay` covering 100% of the screen in pitch dark green (`#001a08`).
     - Once screen is fully dark green, Mama Vana drops beneath the screen bottom (`physicsEngine.y = screenH + 350`), physics paused.
     - The dark green overlay slowly fades away (2.2 seconds).
     - Screen returns to normal.
     - After **3 seconds**:
       - Mama Vana peeks up from the bottom up to his nose (`peekY = screenH - 75`).
       - Pauses for 1.2s looking around checking if the coast is clear.
       - Returns to his normal standing position (`screenH * 0.55`).
       - Physics unpaused and wand cooldown released.

2. **Expelliarmus (`executeExpelliarmus`)**:
   - Fires a 4-frame cycling red beam with crimson glow.
   - On impact: acts like a strong physical hit:
     - 45 damage, damage popup, directional knockback hit away from wand, punch audio, and blood burst.

3. **Petrificus Totalus (`executePetrificusTotalus`)**:
   - Fires a 4-frame cycling cyan beam.
   - On impact:
     - Generates an electrified lightning bolt SVG (`.petrificus-lightning-bolt`) striking through Mama Vana.
     - Plays wall hit / crackle sound.
     - Freezes character physics stiff (`vx = 0, vy = 0, isPaused = true`).
     - Adds `.petrified-freeze` (electric glow, sepia desaturation, trembling freeze effect) for 1.5 seconds.

4. **Lumos (`executeLumos`)**:
   - Creates a radiant light orb (`.lumos-light-orb`) right at the tip of the wand.
   - Smoothly blooms into a 180px glowing light.
   - Fades away after 5 seconds.

5. **Orchideous (`executeOrchideous`)**:
   - Wand tip spawns `wand head flower.png` (`.orchideous-wand-flower`).
   - Shoots a burst of 12 flowers (`dropped flower.png`, `.game-flower-actor`) scattering towards Mama Vana and across the screen.
   - Each flower has full dynamic physics:
     - Gravity (`vy += 650 * dt`), rotational velocity, bouncing off the ground and stage walls.
     - Each flower can be clicked and dragged around with the mouse/touch.
     - Flowers smoothly fade out after 9 seconds and are removed at 10 seconds.

6. **Ridiculous (`executeRidiculous`)**:
   - Fires shimmering magical sparkles (`✨`) towards Mama Vana.
   - On impact: calls `window.characterModel.applyTemporaryRandomCostume(10000)`.
   - Pulls from **ALL** items in `ASSETS_MANIFEST.bodyParts` across every category, even unpurchased ones, and includes `null` ('none') for optional sections (`head_enquipments`, `body_enquipments`, `eyeborws`, `facials`, `haires`).
   - Applies bouncy CSS transformation during change.
   - After **10 seconds**, smoothly restores the player's previous costume without overwriting `localStorage`.

---

## 3. Custom Items Data Registration (`js/config.js`)

All missing `.png` items in `body parts/` were audited and added into `CUSTOM_ITEMS_DATA`:
- `bodys`: Added `4.png`
- `head_shapes`: Added `2.png`
- `haires`: Added `12.png`, `13.png`, `14.png`, `15.png`, `16.png`, `17.png`
- `head_enquipments`: Added `299.png`, `300.png`, `301.png`, `302.png`, `304.png`, `305.png`, `306.png`, `307.png`, `308.png`, `309.png`
- `eyes`: Added `2.png`
- `noses`: Added `2.png`, `3.png`
- `ears`: Added `2.png`
- `facials`: Added `2.png`, `3.png`, `4.png`, `5.png`, `6.png`, `7.png`, `8.png`, `9.png`, `10.png`, `11.png`, `12.png`

**Verification:** Verified via automated script that across all 11 body part categories, **0 items are missing**.

---

## 4. Modified Files Summary

## 5. Five New Attacks

The following attacks are now registered in the weapon dock and use the supplied assets:

- **Cucumber** (`cucumber`): Uses the sword pendulum and has a 5% hit chance to split. The held actor changes to `bottom part.png`; `upper half.png` becomes a draggable physics actor, expires after 10 seconds, and uses `split.mp3` plus the normal cucumber hit sound. The split state blocks further hits until the pointer is released and held again.
- **Flamethrower** (`flamethrower`): Provides only `single` and `auto` modes. Single mode animates `fireball1.png`/`fireball2.png`; auto mode stretches and animates `flame1.png`/`flame2.png`/`flame3.png` toward random character positions. Hits add upside-down fireball burns, with a 10% chance to make the character run toward a random wall while `screem.mp3` plays.
- **Paintball** (`paintball`): Fires a random colored ball and maps it to the matching splash image. Splashes are attached to the character, play `hitsplash.mp3`, and fade/remove after 10 seconds; firing uses `fire.mp3`.
- **Watermelon** (`watermelon`): Throws `frame1.png`, animates the two hit frames, then drops 2-4 random piece actors. Pieces reuse the flip-flop-style draggable gravity physics and expire after 10 seconds. Throw, hit, and 10% rare sounds are configured.
- **Drone** (`drone`): Flies to a random position near the top, fires ten animated bullet shots, then leaves the screen. Each drop has a 5% dive-bomb branch with floor-based explosion frames and strong knockback.

### Implementation Notes

- `js/config.js`, `js/coordinates.js`, and `js/assets.js` are the registration/configuration layer.
- `js/game.js` owns the attack state machines, projectile collision, burn/splash effects, custom physics actors, and cleanup.
- `css/game.css` owns the new actor and effect presentation.
- Shared Minecraft actor physics now accepts custom projectile files and per-actor lifetimes, so dropped cucumber, watermelon, and related pieces remain draggable.

## 6. Verification Status

- `node --check` passes for all edited JavaScript files.
- Browser smoke testing confirms all five attacks appear in the correct weapon tabs, coordinate configs resolve, paintball produces a splash, and flamethrower creates animated projectile actors.
- `TODO.md` contains the remaining viewport tuning and hardware playtest checklist.

## 7. Modified Files Summary

| File | Changes Made |
|---|---|
| [js/config.js](file:///c:/Users/didar/Desktop/Mama%20Vana/js/config.js) | Registered all missing body parts in `CUSTOM_ITEMS_DATA`; added 6 swords (`axe`, `blades_of_chaos`, `club`, `floor_mop`, `karambit`, `pubg_pan`) and 2 specials (`spiders`, `elder_wand`) to `WEAPONS`. |
| [js/coordinates.js](file:///c:/Users/didar/Desktop/Mama%20Vana/js/coordinates.js) | Added coordinates, rotations, hand offsets, and hit tracks for all 6 new swords (with 20-hit extra sound for floor mop); added `spiders` and `elder_wand` special weapon coordinate configs. |
| [js/assets.js](file:///c:/Users/didar/Desktop/Mama%20Vana/js/assets.js) | Added folder mapping cases in `getAttackerFolder` for all new swords and special weapons (handling whitespace & casing variants). |
| [js/character.js](file:///c:/Users/didar/Desktop/Mama%20Vana/js/character.js) | Added `setEyeOverride(fileName)` and `clearEyeOverride()`; added `applyTemporaryRandomCostume(duration, onComplete)` for Ridiculous spell. |
| [css/game.css](file:///c:/Users/didar/Desktop/Mama%20Vana/css/game.css) | Added styles for `.game-spider-actor`, `.game-wand-actor`, `.elder-wand-spell-bar`, `.avada-screen-overlay`, `.lumos-light-orb`, `.orchideous-wand-flower`, `.game-flower-actor`, `.petrificus-lightning-bolt`, and `.petrified-freeze`. |
| [js/game.js](file:///c:/Users/didar/Desktop/Mama%20Vana/js/game.js) | Implemented floor mop 20-hit sound trigger, spiders dropping/dragging/pathfinding/biting/mirroring, elder wand aiming/cooldown/waving/6 spells execution, flower physics, and integrated update loops into `gameLoop`. |
| [TODO.md](file:///c:/Users/didar/Desktop/Mama%20Vana/TODO.md) | Handoff checklist for the five new attacks and remaining playtest/tuning work. |
