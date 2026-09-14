import * as THREE from 'three';

// Cache generated textures so we don't recreate canvases unnecessarily
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-definition procedural asphalt texture with:
 * - Grainy asphalt speckling
 * - Dark rubber tire wear lines on both driving paths
 * - Crisp dashed center lines (yellow or white)
 * - Solid crisp outer lane guide stripes
 * - Theme-specific weathering (frost/grit for snow, charred cracks for volcano, warm sunlit for tropical)
 */
export function getProceduralRoadTexture(theme: string): THREE.CanvasTexture {
  const cacheKey = `road_${theme}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const width = 512;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Asphalt Color
  let baseColor = '#242a35'; // Neutral asphalt
  if (theme === 'volcano') {
    baseColor = '#1a181b'; // Dark basalt
  } else if (theme === 'snow') {
    baseColor = '#3a4454'; // Cold frosted tarmac
  }
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Micro-grain noise for realistic roughness
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const noiseIntensity = theme === 'snow' ? 18 : 12;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * noiseIntensity;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Dark tire grooves (racing lines left and right)
  const leftTireCenter = width * 0.32;
  const rightTireCenter = width * 0.68;
  const tireTrackWidth = width * 0.22;

  const gradL = ctx.createLinearGradient(leftTireCenter - tireTrackWidth, 0, leftTireCenter + tireTrackWidth, 0);
  gradL.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradL.addColorStop(0.5, theme === 'volcano' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(10, 15, 25, 0.35)');
  gradL.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradL;
  ctx.fillRect(leftTireCenter - tireTrackWidth, 0, tireTrackWidth * 2, height);

  const gradR = ctx.createLinearGradient(rightTireCenter - tireTrackWidth, 0, rightTireCenter + tireTrackWidth, 0);
  gradR.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradR.addColorStop(0.5, theme === 'volcano' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(10, 15, 25, 0.35)');
  gradR.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradR;
  ctx.fillRect(rightTireCenter - tireTrackWidth, 0, tireTrackWidth * 2, height);

  // 4. Outer White Lane Edges
  const edgeWidth = 14;
  const edgeMargin = 22;
  ctx.fillStyle = theme === 'snow' ? '#e0f2fe' : '#f8fafc';

  // Left solid stripe
  ctx.fillRect(edgeMargin, 0, edgeWidth, height);
  // Right solid stripe
  ctx.fillRect(width - edgeMargin - edgeWidth, 0, edgeWidth, height);

  // Subtle outer edge glow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(edgeMargin - 3, 0, edgeWidth + 6, height);
  ctx.fillRect(width - edgeMargin - edgeWidth - 3, 0, edgeWidth + 6, height);

  // 5. Dashed Center Line
  const centerLineWidth = 12;
  const dashLength = 80;
  const gapLength = 60;
  const centerColor = theme === 'volcano' ? '#fbbf24' : '#facc15'; // Bright race yellow
  ctx.fillStyle = centerColor;

  let y = 15;
  while (y < height) {
    ctx.fillRect((width - centerLineWidth) / 2, y, centerLineWidth, dashLength);
    y += dashLength + gapLength;
  }

  // 6. Theme specifics
  if (theme === 'volcano') {
    // Glowing lava vein cracks across sections of road
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, 240);
    ctx.lineTo(width * 0.28, 280);
    ctx.lineTo(width * 0.45, 270);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.65, 750);
    ctx.lineTo(width * 0.82, 790);
    ctx.lineTo(width * 0.92, 830);
    ctx.stroke();
  } else if (theme === 'snow') {
    // Frost dusting along edges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < height; i += 4) {
      const frostW = 10 + Math.sin(i * 0.05) * 8;
      ctx.fillRect(0, i, frostW, 4);
      ctx.fillRect(width - frostW, i, frostW, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40); // Repeats nicely along the 400 waypoints
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates high-res checkered finish line pattern texture
 */
export function getCheckeredFinishLineTexture(): THREE.CanvasTexture {
  const cacheKey = 'finish_line_checkered';
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const rows = 4;
  const cols = 16;
  const cellW = size / cols;
  const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isBlack = (r + c) % 2 === 0;
      ctx.fillStyle = isBlack ? '#09090b' : '#fafafa';
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
    }
  }

  // Golden sponsor line border top & bottom
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, size, 12);
  ctx.fillRect(0, size - 12, size, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates realistic wooden bridge planks texture
 */
export function getBridgePlankTexture(theme: string): THREE.CanvasTexture {
  const cacheKey = `planks_${theme}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const width = 256;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base wood color
  let baseColor = '#78350f';
  let grainColor = '#451a03';
  if (theme === 'volcano') {
    baseColor = '#382e2b';
    grainColor = '#1f1b19';
  } else if (theme === 'snow') {
    baseColor = '#645447';
    grainColor = '#3f352b';
  }

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Individual planks separation
  const plankH = 64;
  for (let y = 0; y < height; y += plankH) {
    // Plank dark seam
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, y, width, 4);

    // Plank highlight edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, y + 4, width, 2);

    // Grain lines
    ctx.strokeStyle = grainColor;
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 4; g++) {
      const gy = y + 10 + g * 12;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(width * 0.3, gy + (Math.random() - 0.5) * 6, width * 0.7, gy + (Math.random() - 0.5) * 6, width, gy);
      ctx.stroke();
    }

    // Iron rivets / nails on plank sides
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(20, y + plankH / 2, 4, 0, Math.PI * 2);
    ctx.arc(width - 20, y + plankH / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.arc(19, y + plankH / 2 - 1, 1.5, 0, Math.PI * 2);
    ctx.arc(width - 21, y + plankH / 2 - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates high-visibility arcade turn chevron texture (>>>)
 */
export function getChevronBoardTexture(direction: 'left' | 'right' = 'right'): THREE.CanvasTexture {
  const cacheKey = `chevron_${direction}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // High-visibility black/red hazard background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Border neon frame
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 3 Glowing chevron arrows
  ctx.fillStyle = '#facc15';
  const numChevrons = 3;
  const step = width / (numChevrons + 1);

  for (let i = 1; i <= numChevrons; i++) {
    const cx = i * step;
    const cy = height / 2;
    const armH = 80;
    const armW = 45;

    ctx.beginPath();
    if (direction === 'right') {
      ctx.moveTo(cx - armW, cy - armH);
      ctx.lineTo(cx + armW * 0.7, cy);
      ctx.lineTo(cx - armW, cy + armH);
      ctx.lineTo(cx - armW + 35, cy + armH);
      ctx.lineTo(cx + armW * 0.7 + 35, cy);
      ctx.lineTo(cx - armW + 35, cy - armH);
    } else {
      ctx.moveTo(cx + armW, cy - armH);
      ctx.lineTo(cx - armW * 0.7, cy);
      ctx.lineTo(cx + armW, cy + armH);
      ctx.lineTo(cx + armW - 35, cy + armH);
      ctx.lineTo(cx - armW * 0.7 - 35, cy);
      ctx.lineTo(cx + armW - 35, cy - armH);
    }
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates Gantry Sponsor / Grand Prix banner texture
 */
export function getGantryBannerTexture(title: string): THREE.CanvasTexture {
  const cacheKey = `gantry_${title}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const width = 1024;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dynamic race gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.5, '#2563eb');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Checkered side accents
  const checkRows = 4;
  const checkCols = 6;
  const cw = 24;
  const ch = height / checkRows;
  for (let r = 0; r < checkRows; r++) {
    for (let c = 0; c < checkCols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(c * cw, r * ch, cw, ch);
        ctx.fillRect(width - (c + 1) * cw, r * ch, cw, ch);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(c * cw, r * ch, cw, ch);
        ctx.fillRect(width - (c + 1) * cw, r * ch, cw, ch);
      }
    }
  }

  // Golden borders
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, width, 14);
  ctx.fillRect(0, height - 14, width, 14);

  // Grand Prix Header text
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 68px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillText(title.toUpperCase(), width / 2, height / 2 - 10);

  // Subtitle
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 6;
  ctx.fillText('★ CHAMPIONSHIP CIRCUIT ★', width / 2, height / 2 + 55);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
