# Reddit Sync

This repo now includes a Reddit importer for `r/NMSCoordinateExchange` with two modes:

- `backfill`: one-time historical pull for older posts
- `weekly`: rolling sync for recent posts

## Environment

Add these to `.env.local` for local runs, or configure them in n8n as environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NMS_REDDIT_SUBREDDIT=NMSCoordinateExchange
REDDIT_USER_AGENT=NMSFinderBot/0.1
NMS_OCR_MAX_POSTS=20
```

Use the `SUPABASE_SERVICE_ROLE_KEY` only for server-side scripts and automation. Do not expose it in the browser.

## Commands

Dry run:

```bash
npm run reddit:dry-run
```

Dry run without OCR:

```bash
npm run reddit:dry-run:no-ocr
```

Optional deeper dry run with comment inspection:

```bash
npm run reddit:dry-run:comments
```

One-time backfill:

```bash
npm run reddit:backfill
```

Weekly sync:

```bash
npm run reddit:weekly
```

## What the importer does

- Reads the Reddit `new.json` listing from `r/NMSCoordinateExchange`
- Runs OCR on screenshots for posts still missing glyphs or coordinates after text parsing
- Optional `--with-comments` mode also inspects comment threads, but this is much more likely to hit Reddit rate limits
- Extracts likely values for:
  - `content_type`
  - `sub_type`
  - `item_class`
  - `galaxy`
  - `portal_glyphs`
  - `coordinates`
  - `platform`
  - `game_mode`
  - `screenshot_url`
  - `source_url`
  - `source_author`
  - `date_posted`
- Updates existing rows when `source_url` already exists
- Inserts new rows when it does not

## Important limitation

Reddit post formatting is inconsistent, so some fields will be inferred imperfectly. Expect to review:

- `system_name`
- `planet_name`
- `sub_type`
- entries missing glyphs or coordinates

The script logs how many imported posts are missing glyphs or coordinates so you can review those rows.

## OCR notes

- OCR is best-effort and mainly helps recover portal codes and coordinates that are visible in screenshots.
- It will improve some rows, but it will not perfectly decode every portal glyph image.
- Use `--no-ocr` if you want a faster lighter run.
- `NMS_OCR_MAX_POSTS` caps how many screenshots get OCR per run so weekly syncs stay practical.

## n8n suggestion

Recommended weekly flow:

1. Cron node: every 7 days
2. Execute Command node:

```bash
cd /path/to/NMS\ Finder && npm run reddit:weekly
```

Keep the scheduled job on the lighter listing-only mode. Use `--with-comments` only for manual spot checks or small batches.

Recommended one-time flow:

1. Manual trigger
2. Execute Command node:

```bash
cd /path/to/NMS\ Finder && npm run reddit:backfill
```
