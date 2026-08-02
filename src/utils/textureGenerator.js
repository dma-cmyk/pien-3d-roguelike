import * as THREE from 'three';

const textureCache = new Map();

/**
 * Generate a Minecraft-style pixelated noise texture on Canvas
 */
export function createNoiseTexture(baseColorHex, noiseAmount = 30, size = 64) {
  const cacheKey = `noise_${baseColorHex}_${noiseAmount}_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(baseColorHex);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  const pixelSize = size / 16;
  for (let x = 0; x < size; x += pixelSize) {
    for (let y = 0; y < size; y += pixelSize) {
      const noise = (Math.random() - 0.5) * noiseAmount;
      const nr = Math.min(255, Math.max(0, Math.floor(r + noise)));
      const ng = Math.min(255, Math.max(0, Math.floor(g + noise)));
      const nb = Math.min(255, Math.max(0, Math.floor(b + noise)));
      ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Wall texture merged with procedural Minecraft-style crack patterns
 */
export function createWallTextureWithCrack(baseColorHex, crackLevel = 0, size = 128) {
  const cacheKey = `wall_crack_${baseColorHex}_${crackLevel}_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = new THREE.Color(baseColorHex);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  const pixelSize = size / 16;
  for (let x = 0; x < size; x += pixelSize) {
    for (let y = 0; y < size; y += pixelSize) {
      const noise = (Math.random() - 0.5) * 35;
      const nr = Math.min(255, Math.max(0, Math.floor(r + noise)));
      const ng = Math.min(255, Math.max(0, Math.floor(g + noise)));
      const nb = Math.min(255, Math.max(0, Math.floor(b + noise)));
      ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }

  // Draw distinct Minecraft style black cracks
  if (crackLevel > 0) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, size / 12);
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    ctx.beginPath();
    if (crackLevel >= 1) { // 75% HP
      ctx.moveTo(size * 0.3, size * 0.15);
      ctx.lineTo(size * 0.45, size * 0.45);
      ctx.lineTo(size * 0.35, size * 0.85);
    }
    if (crackLevel >= 2) { // 50% HP
      ctx.moveTo(size * 0.45, size * 0.45);
      ctx.lineTo(size * 0.8, size * 0.4);
      ctx.lineTo(size * 0.9, size * 0.75);

      ctx.moveTo(size * 0.15, size * 0.6);
      ctx.lineTo(size * 0.35, size * 0.85);
    }
    if (crackLevel >= 3) { // 25% HP
      ctx.moveTo(size * 0.5, size * 0.05);
      ctx.lineTo(size * 0.45, size * 0.45);

      ctx.moveTo(size * 0.8, size * 0.4);
      ctx.lineTo(size * 0.95, size * 0.15);

      ctx.moveTo(size * 0.05, size * 0.35);
      ctx.lineTo(size * 0.3, size * 0.15);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate 3D Billboard Sprite Texture from Unicode Emoji
 */
export function createEmojiTexture(emoji, size = 128) {
  const cacheKey = `emoji_${emoji}_${size}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);

  ctx.font = `${Math.floor(size * 0.75)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Generate Overhead HP Bar & Name Tag 3D Sprite Texture with Custom Faction Colors
 */
export function createHpBarTexture(label, hp, maxHp, barColor = null, sizeW = 256, sizeH = 64) {
  const cacheKey = `hpbar_${label}_${hp}_${maxHp}_${barColor || 'default'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const canvas = document.createElement('canvas');
  canvas.width = sizeW;
  canvas.height = sizeH;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, sizeW, sizeH);

  // Background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.strokeStyle = barColor || '#ffffff';
  ctx.lineWidth = 3;
  ctx.fillRect(0, 0, sizeW, sizeH);
  ctx.strokeRect(0, 0, sizeW, sizeH);

  // Name Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, sizeW / 2, 6);

  // HP Bar Outer Frame
  const barX = 20;
  const barY = 34;
  const barW = sizeW - 40;
  const barH = 18;

  ctx.fillStyle = '#222222';
  ctx.fillRect(barX, barY, barW, barH);

  // HP Fill Color (Custom Faction Color or Ratio Color)
  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  if (barColor) {
    ctx.fillStyle = barColor;
  } else {
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
  }
  ctx.fillRect(barX, barY, barW * hpRatio, barH);

  // HP Bar Inner Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, barH);

  // HP Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${hp}/${maxHp}`, sizeW / 2, barY + barH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  textureCache.set(cacheKey, texture);
  return texture;
}
