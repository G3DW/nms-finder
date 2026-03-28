import { createClient } from '@supabase/supabase-js';
import { recognizeGlyphStringFromImage } from './lib/glyph-recognizer.mjs';
import { extractTextFromImage } from './lib/image-ocr.mjs';
import { loadLocalEnv } from './lib/load-env.mjs';
import { mapRedditPostToLocation } from './lib/reddit-parser.mjs';

loadLocalEnv();

const [, , mode = 'weekly', ...flags] = process.argv;
const isDryRun = flags.includes('--dry-run');
const withComments = flags.includes('--with-comments');
const skipOcr = flags.includes('--no-ocr');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUBREDDIT = process.env.NMS_REDDIT_SUBREDDIT ?? 'NMSCoordinateExchange';
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT ?? 'NMSFinderBot/0.1';
const REDDIT_MAX_RETRIES = 4;
const DEFAULT_OCR_MAX_POSTS = Number(process.env.NMS_OCR_MAX_POSTS ?? '20');

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL in .env.local or environment.');
}

if (!isDryRun && !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Use the service role key for import scripts, not the anon key.');
}

if (!['weekly', 'backfill'].includes(mode)) {
  throw new Error(`Unsupported mode "${mode}". Use "weekly" or "backfill".`);
}

const supabase = isDryRun
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

function getCutoffDate(currentMode) {
  if (currentMode === 'backfill') {
    return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  }

  return new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url) {
  let attempt = 0;

  while (attempt < REDDIT_MAX_RETRIES) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': REDDIT_USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      return response.json();
    }

    if (response.status !== 429) {
      throw new Error(`Reddit request failed: ${response.status} ${response.statusText}`);
    }

    attempt += 1;
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const headerBackoffMs = Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 0;
    const backoffMs = Math.max(headerBackoffMs, attempt * 3000);

    console.warn(`[reddit-sync] rate limited by Reddit, retrying in ${Math.round(backoffMs / 1000)}s (attempt ${attempt}/${REDDIT_MAX_RETRIES})`);
    await sleep(backoffMs);
  }

  throw new Error('Reddit request failed after repeated rate-limit retries.');
}

async function fetchListing(after) {
  const url = new URL(`https://www.reddit.com/r/${SUBREDDIT}/new.json`);
  url.searchParams.set('limit', '100');
  if (after) {
    url.searchParams.set('after', after);
  }

  return fetchJsonWithRetry(url);
}

async function fetchPostThread(permalink) {
  const url = new URL(`https://www.reddit.com${permalink}.json`);
  url.searchParams.set('limit', '12');

  return fetchJsonWithRetry(url);
}

function flattenComments(nodes, collected = []) {
  for (const node of nodes ?? []) {
    const data = node?.data;
    if (!data) {
      continue;
    }

    if (typeof data.body === 'string') {
      collected.push(data.body);
    }

    const replies = data.replies?.data?.children;
    if (Array.isArray(replies)) {
      flattenComments(replies, collected);
    }
  }

  return collected;
}

async function collectPosts(currentMode) {
  const cutoffDate = getCutoffDate(currentMode);
  const posts = [];
  let after = null;
  let keepGoing = true;
  let pageCount = 0;
  const maxPages = currentMode === 'backfill' ? 20 : 3;

  while (keepGoing && pageCount < maxPages) {
    const listing = await fetchListing(after);
    const children = listing?.data?.children ?? [];
    after = listing?.data?.after ?? null;
    pageCount += 1;

    if (children.length === 0) {
      break;
    }

    for (const child of children) {
      const post = child.data;
      const createdAt = new Date(post.created_utc * 1000);
      if (createdAt < cutoffDate) {
        keepGoing = false;
        break;
      }

      posts.push(post);
    }

    if (!after) {
      break;
    }
  }

  return posts;
}

async function findExistingLocation(sourceUrl) {
  if (!supabase) {
    throw new Error('Supabase client not configured for write operations.');
  }

  const { data, error } = await supabase.from('locations').select('id, source_url').eq('source_url', sourceUrl).maybeSingle();
  if (error) {
    throw error;
  }

  return data;
}

async function insertOrUpdateLocation(location) {
  if (!supabase) {
    throw new Error('Supabase client not configured for write operations.');
  }

  const existing = await findExistingLocation(location.source_url);
  if (existing) {
    const { error } = await supabase.from('locations').update(location).eq('id', existing.id);
    if (error) {
      throw error;
    }

    return { action: 'updated', id: existing.id };
  }

  const { data, error } = await supabase.from('locations').insert(location).select('id').single();
  if (error) {
    throw error;
  }

  return { action: 'inserted', id: data.id };
}

function summarizePreparedLocations(postsWithContext) {
  const prepared = postsWithContext.map(({ post, extraText, ocrText, recognizedGlyphs }) => {
    const location = mapRedditPostToLocation(post, `${extraText} ${ocrText ?? ''}`.trim());
    if (!location.portal_glyphs && recognizedGlyphs) {
      location.portal_glyphs = recognizedGlyphs;
    }
    return location;
  });
  let missingGlyphs = 0;
  let missingCoordinates = 0;

  for (const location of prepared) {
    if (!location.portal_glyphs) {
      missingGlyphs += 1;
    }
    if (!location.coordinates) {
      missingCoordinates += 1;
    }
  }

  return { prepared, missingGlyphs, missingCoordinates };
}

async function enrichPostsFromComments(posts, currentMode) {
  const shouldEnrich = withComments;
  if (!shouldEnrich) {
    return posts.map((post) => ({ post, extraText: '' }));
  }

  const enriched = [];

  for (const post of posts) {
    let extraText = '';

    try {
      const thread = await fetchPostThread(post.permalink);
      const commentListing = thread?.[1]?.data?.children ?? [];
      extraText = flattenComments(commentListing).join(' ');
    } catch (error) {
      console.warn(`[reddit-sync] comment enrichment skipped for ${post.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    enriched.push({ post, extraText });
  }

  return enriched;
}

async function enrichPostsFromImages(postsWithContext) {
  if (skipOcr) {
    return postsWithContext.map((entry) => ({ ...entry, ocrText: '', recognizedGlyphs: null }));
  }

  const enriched = [];
  let ocrCount = 0;

  for (const entry of postsWithContext) {
    const previewLocation = mapRedditPostToLocation(entry.post, entry.extraText);
    const needsOcr = Boolean(
      previewLocation.screenshot_url && (!previewLocation.portal_glyphs || !previewLocation.coordinates),
    );

    if (!needsOcr || !previewLocation.screenshot_url) {
      enriched.push({ ...entry, ocrText: '', recognizedGlyphs: null });
      continue;
    }

    if (ocrCount >= DEFAULT_OCR_MAX_POSTS) {
      enriched.push({ ...entry, ocrText: '', recognizedGlyphs: null });
      continue;
    }

    try {
      const recognizedGlyphs = await recognizeGlyphStringFromImage(previewLocation.screenshot_url);
      const ocrText = await extractTextFromImage(previewLocation.screenshot_url);
      ocrCount += 1;
      enriched.push({ ...entry, ocrText, recognizedGlyphs });
    } catch (error) {
      console.warn(
        `[reddit-sync] OCR skipped for ${entry.post.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      enriched.push({ ...entry, ocrText: '', recognizedGlyphs: null });
    }
  }

  console.log(`[reddit-sync] OCR processed ${ocrCount} screenshot${ocrCount === 1 ? '' : 's'}`);
  return enriched;
}

async function run() {
  console.log(
    `[reddit-sync] mode=${mode} subreddit=${SUBREDDIT} dryRun=${isDryRun} withComments=${withComments} skipOcr=${skipOcr}`,
  );

  const posts = await collectPosts(mode);
  console.log(`[reddit-sync] collected ${posts.length} reddit posts`);

  const enrichedPosts = await enrichPostsFromComments(posts, mode);
  const imageEnrichedPosts = await enrichPostsFromImages(enrichedPosts);
  const { prepared, missingGlyphs, missingCoordinates } = summarizePreparedLocations(imageEnrichedPosts);
  console.log(`[reddit-sync] parsed ${prepared.length} locations`);
  console.log(`[reddit-sync] missing glyphs: ${missingGlyphs}`);
  console.log(`[reddit-sync] missing coordinates: ${missingCoordinates}`);

  if (isDryRun) {
    console.log('[reddit-sync] dry run enabled, no database writes made');
    console.log(JSON.stringify(prepared.slice(0, 5), null, 2));
    return;
  }

  let inserted = 0;
  let updated = 0;

  for (const location of prepared) {
    const result = await insertOrUpdateLocation(location);
    if (result.action === 'inserted') {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`[reddit-sync] inserted=${inserted} updated=${updated}`);
}

run().catch((error) => {
  console.error('[reddit-sync] failed');
  console.error(error);
  process.exitCode = 1;
});
