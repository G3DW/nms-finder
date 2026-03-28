const GALAXIES = [
  'Euclid',
  'Hilbert',
  'Calypso',
  'Hesperius',
  'Hyades',
  'Ickjamatew',
  'Budullangr',
  'Kikolgallr',
  'Eltiensleen',
  'Eissentam',
  'Elkupalos',
  'Aptarkaba',
  'Ontiniangp',
  'Odiwagiri',
  'Ogtialabi',
  'Muhacksonto',
  'Hitonskyer',
  'Rerasmutul',
  'Isdoraijung',
  'Doctinawyra',
  'Loychazinq',
  'Zukasizawa',
  'Ekwathore',
  'Yeberhahne',
  'Twerbetek',
  'Sivarates',
  'Eajerandal',
  'Aldukesci',
  'Wotyarogii',
  'Sudzerbal',
  'Maupenzhay',
  'Sugueziume',
  'Ijsenufryos',
];

const CONTENT_TYPE_RULES = [
  { type: 'multitool', patterns: [/multi[- ]?tool/i, /\bmt\b/i] },
  { type: 'freighter', patterns: [/freighter/i, /derelict/i, /dreadnought/i] },
  { type: 'planet', patterns: [/planet/i, /paradise/i, /earth[- ]?like/i, /lush/i, /toxic/i, /frozen/i] },
  { type: 'base', patterns: [/base/i, /settlement/i, /outpost/i] },
  { type: 'creature', patterns: [/creature/i, /fauna/i, /pet/i] },
  { type: 'ship', patterns: [/ship/i, /starship/i, /interceptor/i, /living ship/i] },
];

const SUBTYPE_RULES = {
  ship: ['sentinel', 'solar', 'exotic', 'hauler', 'fighter', 'explorer', 'shuttle', 'living'],
  multitool: ['rifle', 'pistol', 'alien', 'royal', 'experimental'],
  planet: ['lush', 'toxic', 'radioactive', 'frozen', 'barren', 'dead', 'exotic', 'paradise'],
};

const PLATFORM_RULES = ['PC', 'PS5', 'PS4', 'Xbox', 'Switch', 'Mac'];
const MODE_RULES = ['Normal', 'Survival', 'Permadeath', 'Relaxed', 'Custom'];

function firstMatch(text, patterns) {
  return patterns.find((pattern) => pattern.test(text));
}

function cleanText(value) {
  if (!value) {
    return '';
  }

  return value.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function inferGalaxy(text, flairText) {
  for (const galaxy of GALAXIES) {
    const pattern = new RegExp(`\\b${galaxy}\\b`, 'i');
    if (pattern.test(flairText) || pattern.test(text)) {
      return galaxy;
    }
  }

  return 'Euclid';
}

function inferContentType(text, flairText) {
  const combined = `${flairText} ${text}`;

  for (const rule of CONTENT_TYPE_RULES) {
    if (firstMatch(combined, rule.patterns)) {
      return rule.type;
    }
  }

  return 'ship';
}

function inferSubType(contentType, text) {
  const supportedTypes = SUBTYPE_RULES[contentType] ?? [];
  const match = supportedTypes.find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(text));
  return match ?? null;
}

function inferClass(text) {
  const match = text.match(/\b([SABC])[ -]?class\b/i) ?? text.match(/\bclass[ :_-]*([SABC])\b/i);
  return match ? match[1].toUpperCase() : null;
}

function inferPlatform(text) {
  const match = PLATFORM_RULES.find((platform) => new RegExp(`\\b${platform}\\b`, 'i').test(text));
  if (!match) {
    return 'All';
  }

  if (match === 'PS4') {
    return 'PS5';
  }

  return match;
}

function inferGameMode(text) {
  const match = MODE_RULES.find((mode) => new RegExp(`\\b${mode}\\b`, 'i').test(text));
  return match ?? 'Normal';
}

function extractGlyphs(text) {
  const match = text.match(/\b[0-9A-F]{12}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function extractCoordinates(text) {
  const match = text.match(/[+\-]\d{1,2}(?:\.\d{1,2})?\s*,\s*[+\-]\d{1,3}(?:\.\d{1,2})?/);
  return match ? match[0].replace(/\s+/g, ' ') : null;
}

function extractVersion(text) {
  const match = text.match(/\b(?:version|update|patch|v)\s*([0-9]+(?:\.[0-9]+)*)\b/i);
  return match ? match[1] : null;
}

function extractSystemName(text) {
  const match = text.match(/\bsystem[:\s-]+([^,|]+)/i);
  return match ? cleanText(match[1]) : null;
}

function extractPlanetName(text) {
  const match = text.match(/\bplanet[:\s-]+([^,|]+)/i);
  return match ? cleanText(match[1]) : null;
}

function extractScreenshotUrl(post) {
  if (post.url_overridden_by_dest && /\.(?:png|jpe?g|webp)$/i.test(post.url_overridden_by_dest)) {
    return post.url_overridden_by_dest;
  }

  const previewImage = post.preview?.images?.[0]?.source?.url;
  if (previewImage) {
    return cleanText(previewImage);
  }

  const galleryItems = post.gallery_data?.items ?? [];
  for (const item of galleryItems) {
    const metadata = post.media_metadata?.[item.media_id];
    const source = metadata?.s?.u;
    if (source) {
      return cleanText(source);
    }
  }

  return null;
}

export function mapRedditPostToLocation(post, extraText = '') {
  const flairText = cleanText(post.link_flair_text ?? '');
  const text = cleanText(`${post.title ?? ''} ${post.selftext ?? ''} ${extraText}`);
  const contentType = inferContentType(text, flairText);
  const subType = inferSubType(contentType, text);

  return {
    content_type: contentType,
    sub_type: subType,
    item_class: inferClass(text),
    galaxy: inferGalaxy(text, flairText),
    system_name: extractSystemName(text),
    planet_name: extractPlanetName(text),
    portal_glyphs: extractGlyphs(text),
    coordinates: extractCoordinates(text),
    game_mode: inferGameMode(text),
    platform: inferPlatform(text),
    game_version: extractVersion(text),
    notes: cleanText(post.selftext ?? '') || cleanText(post.title ?? ''),
    source_type: 'reddit',
    source_url: `https://reddit.com${post.permalink}`,
    source_author: post.author ?? null,
    screenshot_url: extractScreenshotUrl(post),
    date_posted: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
    last_confirmed_at: null,
    is_active: true,
  };
}
