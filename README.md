# NMS Finder

NMS Finder is a personal-use web app for searching **No Man's Sky** locations such as ships, multi-tools, planets, bases, and freighters. It is designed around quick filtering, portal glyph display, location cards, and community validation.

## Stack

- React
- TypeScript
- Tailwind CSS
- Supabase
- Vite

## Features

- One-page search experience
- Filter by content type, sub-type, class, galaxy, game mode, and platform
- Portal glyph display using the real NMS glyph font
- Copy glyphs and coordinates quickly
- Community feedback on whether a location is still valid
- Confidence and outdated indicators
- Portal address converter
- Supabase-backed live data
- Reddit importer for weekly syncs and backfill

## Environment variables

Frontend:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
```

Importer / automation:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NMS_REDDIT_SUBREDDIT=NMSCoordinateExchange
REDDIT_USER_AGENT=NMSFinderBot/0.1
NMS_OCR_MAX_POSTS=20
```

Use the service role key only for server-side scripts or automation. Do not expose it in the frontend.

## Local development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Supabase setup

Run these SQL files in Supabase:

- [supabase/schema.sql](/Users/joey_makes_stuff/Documents/GitHub/NMS%20Finder/supabase/schema.sql)
- [supabase/seed.sql](/Users/joey_makes_stuff/Documents/GitHub/NMS%20Finder/supabase/seed.sql)

They create:

- `locations`
- `feedback`
- `feedback_type`
- `location_confidence`

## Reddit importer

Commands:

```bash
npm run reddit:dry-run
npm run reddit:dry-run:no-ocr
npm run reddit:dry-run:comments
npm run reddit:weekly
npm run reddit:backfill
```

What it does:

- reads recent posts from `r/NMSCoordinateExchange`
- maps posts into the `locations` schema
- optionally uses comments, OCR, and screenshot analysis
- inserts new rows or updates existing rows by `source_url`

Importer docs:

- [docs/reddit-sync.md](/Users/joey_makes_stuff/Documents/GitHub/NMS%20Finder/docs/reddit-sync.md)

## Current status

Completed:

- frontend search UI
- Supabase integration
- feedback flow
- portal converter
- Reddit weekly importer
- Reddit backfill script
- OCR-based screenshot text extraction
- first-pass portal glyph image recognizer

Still worth improving:

- glyph recognition calibration using a labeled screenshot set
- stronger import quality filtering
- production deployment polish

## Repository

GitHub:

- [G3DW/nms-finder](https://github.com/G3DW/nms-finder)
