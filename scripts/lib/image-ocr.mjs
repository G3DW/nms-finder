import sharp from 'sharp';
import { createWorker } from 'tesseract.js';

let workerPromise;

function cleanOcrText(text) {
  return text
    .replace(/[|]/g, 'I')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, { logger: () => {} });
      return worker;
    })();
  }

  return workerPromise;
}

async function fetchImageBuffer(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent': 'NMSFinderBot/0.1',
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function buildVariants(imageBuffer) {
  const metadata = await sharp(imageBuffer, { failOn: 'none' }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return [];
  }

  const resizedWidth = Math.min(width, 2200);
  const resizedHeight = Math.max(1, Math.round((height / width) * resizedWidth));
  const lowerBandTop = Math.max(0, Math.floor(resizedHeight * 0.68));
  const lowerBandHeight = Math.max(1, resizedHeight - lowerBandTop);
  const lowerLeftWidth = Math.max(1, Math.floor(resizedWidth * 0.55));

  const base = sharp(imageBuffer, { failOn: 'none' })
    .resize({ width: resizedWidth, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .sharpen();

  return [
    await base.clone().png().toBuffer(),
    await base
      .clone()
      .extract({
        left: 0,
        top: lowerBandTop,
        width: resizedWidth,
        height: lowerBandHeight,
      })
      .threshold(180)
      .png()
      .toBuffer(),
    await base
      .clone()
      .extract({
        left: 0,
        top: lowerBandTop,
        width: lowerLeftWidth,
        height: lowerBandHeight,
      })
      .threshold(175)
      .png()
      .toBuffer(),
    await base
      .clone()
      .extract({
        left: 0,
        top: lowerBandTop,
        width: resizedWidth,
        height: lowerBandHeight,
      })
      .negate()
      .threshold(165)
      .png()
      .toBuffer(),
  ];
}

async function recognizeBuffer(buffer, mode = 'general') {
  const worker = await getWorker();
  await worker.setParameters(
    mode === 'focused'
      ? {
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6',
          tessedit_char_whitelist: '0123456789ABCDEFabcdef:+-.,()[]/ ',
        }
      : {
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6',
          tessedit_char_whitelist: '',
        },
  );
  const result = await worker.recognize(buffer);
  return cleanOcrText(result.data.text ?? '');
}

export async function extractTextFromImage(url) {
  const imageBuffer = await fetchImageBuffer(url);
  const variants = await buildVariants(imageBuffer);
  const outputs = [];

  for (const variant of variants) {
    try {
      for (const mode of ['general', 'focused']) {
        const text = await recognizeBuffer(variant, mode);
        if (text) {
          outputs.push(text);
        }
      }
    } catch {
      // Keep trying remaining variants.
    }
  }

  return cleanOcrText(outputs.join(' '));
}
