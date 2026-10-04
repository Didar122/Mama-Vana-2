// assets_loader.js - Dynamic Live Asset Loader for ڤانە ماسیگر
window.__DYNAMIC_TEXTURES = {};

async function loadGameAssetsLive() {
  if (window.location.protocol === 'file:') {
    // When opened directly via file://, browser security blocks fetch() and canvas extraction.
    // The game will load textures directly from html5game/ folder.
    return;
  }
  try {
    const res = await fetch('assets/manifest.json');
    if (!res.ok) return;
    const manifest = await res.json();

    // 1. Group frames by texture index
    const textureFrames = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const [sName, sData] of Object.entries(manifest.sprites || {})) {
      for (const frame of sData.frames || []) {
        const texIdx = frame.texture_index;
        if (textureFrames[texIdx] !== undefined) {
          textureFrames[texIdx].push(frame);
        }
      }
    }

    // 2. Build each texture atlas dynamically with base fonts + live sprites from assets/sprites/
    const promises = [0, 1, 2, 3, 4].map(async (texIdx) => {
      const frames = textureFrames[texIdx];
      if (!frames) return;

      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');

      // Load base texture (contains pre-rendered fonts, numbers, and Latin characters)
      try {
        const baseImg = await loadImgAsync(`html5game/TinyFishing_texture_${texIdx}.png`);
        ctx.drawImage(baseImg, 0, 0);
      } catch (e) {
        console.warn(`Base texture ${texIdx} load error:`, e);
      }

      // Overlay live individual sprites from assets/sprites/
      for (const fr of frames) {
        try {
          const spriteImg = await loadImgAsync(`assets/sprites/${fr.file}?v=${Date.now()}`);
          const tx = fr.atlas_x;
          const ty = fr.atlas_y;
          const tw = fr.atlas_w;
          const th = fr.atlas_h;
          const qx = fr.trim_x || 0;
          const qy = fr.trim_y || 0;

          // Clear sprite region
          ctx.clearRect(tx, ty, tw, th);

          // Draw live sprite
          if (spriteImg.width >= qx + tw && spriteImg.height >= qy + th) {
            ctx.drawImage(spriteImg, qx, qy, tw, th, tx, ty, tw, th);
          } else {
            ctx.drawImage(spriteImg, 0, 0, spriteImg.width, spriteImg.height, tx, ty, tw, th);
          }
        } catch (err) {
          // Keep base texture content on error
        }
      }

      window.__DYNAMIC_TEXTURES[texIdx] = canvas.toDataURL('image/png');
      console.log(`Live texture sheet ${texIdx} loaded successfully with base fonts + live sprites!`);
    });

    await Promise.all(promises);
    console.log('All game assets successfully loaded live from assets/ folder!');
  } catch (e) {
    console.warn('Live asset loading error:', e);
  }
}

function loadImgAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (window.location.protocol !== 'file:') {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
