import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const FONT_PATH = path.resolve(process.cwd(), 'src/assets/fonts/NMS-Glyphs-Mono.woff2');
const GLYPH_SET = '0123456789ABCDEF'.split('');
const TARGET_SIZE = 56;
const MIN_SEGMENT_WIDTH = 12;
const MAX_SEGMENT_WIDTH = 120;

let templatePromise;
let fontDataUrl;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getFontDataUrl() {
  if (!fontDataUrl) {
    const fontBuffer = fs.readFileSync(FONT_PATH);
    fontDataUrl = `data:font/woff2;base64,${fontBuffer.toString('base64')}`;
  }

  return fontDataUrl;
}

function glyphSvg(character) {
  return `
    <svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'NMSGlyphs';
            src: url('${getFontDataUrl()}') format('woff2');
          }
          text {
            font-family: 'NMSGlyphs';
            fill: white;
            font-size: 58px;
            dominant-baseline: middle;
            text-anchor: middle;
          }
        </style>
      </defs>
      <rect width="96" height="96" fill="black"/>
      <text x="48" y="50">${character}</text>
    </svg>
  `;
}

async function rasterizeGlyph(character) {
  return sharp(Buffer.from(glyphSvg(character)))
    .resize(TARGET_SIZE, TARGET_SIZE)
    .grayscale()
    .threshold(120)
    .raw()
    .toBuffer();
}

async function getTemplates() {
  if (!templatePromise) {
    templatePromise = Promise.all(
      GLYPH_SET.map(async (character) => ({
        character,
        buffer: await rasterizeGlyph(character),
      })),
    );
  }

  return templatePromise;
}

function findSegments(columnStrength) {
  const segments = [];
  let start = -1;

  for (let index = 0; index < columnStrength.length; index += 1) {
    const active = columnStrength[index] > 0;

    if (active && start === -1) {
      start = index;
    }

    if (!active && start !== -1) {
      const end = index - 1;
      const width = end - start + 1;
      if (width >= MIN_SEGMENT_WIDTH && width <= MAX_SEGMENT_WIDTH) {
        segments.push({ start, end });
      }
      start = -1;
    }
  }

  if (start !== -1) {
    const end = columnStrength.length - 1;
    const width = end - start + 1;
    if (width >= MIN_SEGMENT_WIDTH && width <= MAX_SEGMENT_WIDTH) {
      segments.push({ start, end });
    }
  }

  return segments;
}

function mergeCloseSegments(segments) {
  if (segments.length <= 1) {
    return segments;
  }

  const merged = [{ ...segments[0] }];
  for (let index = 1; index < segments.length; index += 1) {
    const current = segments[index];
    const previous = merged[merged.length - 1];
    if (current.start - previous.end <= 6) {
      previous.end = current.end;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function buildFallbackSlots(columnStrength) {
  const activeColumns = columnStrength
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value > 0);

  if (activeColumns.length === 0) {
    return [];
  }

  const start = activeColumns[0].index;
  const end = activeColumns[activeColumns.length - 1].index;
  const width = end - start + 1;

  if (width < 12 * MIN_SEGMENT_WIDTH) {
    return [];
  }

  const slotWidth = width / 12;
  return Array.from({ length: 12 }, (_, index) => ({
    start: Math.round(start + index * slotWidth),
    end: Math.round(start + (index + 1) * slotWidth) - 1,
  }));
}

function scoreCandidate(candidateBuffer, templateBuffer) {
  let difference = 0;
  for (let index = 0; index < candidateBuffer.length; index += 1) {
    difference += Math.abs(candidateBuffer[index] - templateBuffer[index]);
  }
  return difference / candidateBuffer.length;
}

async function normalizeCandidate(regionBuffer, width, height, left, top, candidateWidth, candidateHeight) {
  return sharp(regionBuffer, {
    raw: { width, height, channels: 1 },
  })
    .extract({
      left: clamp(left, 0, width - 1),
      top: clamp(top, 0, height - 1),
      width: clamp(candidateWidth, 1, width - left),
      height: clamp(candidateHeight, 1, height - top),
    })
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .threshold(120)
    .raw()
    .toBuffer();
}

export async function recognizeGlyphStringFromImage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'NMSFinderBot/0.1' } });
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const templates = await getTemplates();
  const metadata = await sharp(imageBuffer, { failOn: 'none' }).metadata();
  const sourceWidth = metadata.width ?? 0;
  const sourceHeight = metadata.height ?? 0;

  if (!sourceWidth || !sourceHeight) {
    return null;
  }

  const cropTop = Math.floor(sourceHeight * 0.63);
  const cropWidth = Math.floor(sourceWidth * 0.6);
  const cropHeight = sourceHeight - cropTop;

  const { data, info } = await sharp(imageBuffer, { failOn: 'none' })
    .extract({
      left: 0,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
    })
    .resize({ width: 1400, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .threshold(140)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const columnStrength = Array.from({ length: info.width }, (_, x) => {
    let total = 0;
    for (let y = 0; y < info.height; y += 1) {
      total += data[y * info.width + x] > 0 ? 1 : 0;
    }
    return total > Math.floor(info.height * 0.04) ? total : 0;
  });

  let segments = mergeCloseSegments(findSegments(columnStrength));
  if (segments.length < 10 || segments.length > 14) {
    segments = buildFallbackSlots(columnStrength);
  }

  if (segments.length !== 12) {
    return null;
  }

  const recognized = [];
  const scores = [];

  for (const segment of segments.slice(0, 12)) {
    let top = info.height;
    let bottom = 0;

    for (let x = segment.start; x <= segment.end; x += 1) {
      for (let y = 0; y < info.height; y += 1) {
        if (data[y * info.width + x] > 0) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (bottom <= top) {
      continue;
    }

    const candidateBuffer = await normalizeCandidate(
      data,
      info.width,
      info.height,
      segment.start,
      top,
      segment.end - segment.start + 1,
      bottom - top + 1,
    );

    let bestMatch = null;
    for (const template of templates) {
      const score = scoreCandidate(candidateBuffer, template.buffer);
      if (!bestMatch || score < bestMatch.score) {
        bestMatch = { character: template.character, score };
      }
    }

    if (!bestMatch || bestMatch.score > 100) {
      return null;
    }

    recognized.push(bestMatch.character);
    scores.push(bestMatch.score);
  }

  if (recognized.length !== 12) {
    return null;
  }

  const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length;
  const uniqueCharacters = new Set(recognized).size;

  if (averageScore > 70 || uniqueCharacters < 3) {
    return null;
  }

  return recognized.join('');
}
