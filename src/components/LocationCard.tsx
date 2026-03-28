import { type ReactNode, useState } from 'react';
import { CONTENT_TYPE_BADGE_CLASSES } from '../constants';
import type { LocationRecord, SubmitFeedbackInput } from '../types';
import { copyText } from '../utils/clipboard';
import { formatRelativeDate } from '../utils/dates';
import { titleize } from '../utils/text';
import { FeedbackComposer } from './FeedbackComposer';
import { GlyphTokens } from './GlyphTokens';

type LocationCardProps = {
  location: LocationRecord;
  onFeedbackSubmit: (locationId: string, input: SubmitFeedbackInput) => Promise<void>;
};

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${className ?? ''}`}>
      {children}
    </span>
  );
}

export function LocationCard({ location, onFeedbackSubmit }: LocationCardProps) {
  const [copyState, setCopyState] = useState<'glyphs' | 'coordinates' | null>(null);
  const confidence = location.location_confidence;
  const isVerified = (confidence.confidence_pct ?? 0) >= 70 && confidence.total_votes >= 3;
  const isOutdated = confidence.gone_count >= 3 || !location.is_active;

  async function handleCopy(label: 'glyphs' | 'coordinates', value: string | null) {
    if (!value) {
      return;
    }

    try {
      await copyText(value);
      setCopyState(label);
      window.setTimeout(() => setCopyState(null), 1400);
    } catch {
      setCopyState(null);
    }
  }

  return (
    <article className="overflow-hidden border border-white/10 bg-panel shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(0,229,204,0.16),transparent_45%),linear-gradient(135deg,#0f172a,#020617)]">
        {location.screenshot_url ? (
          <img src={location.screenshot_url} alt={location.system_name ?? 'No Man’s Sky location'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
            <p className="font-display text-xl uppercase tracking-[0.2em] text-teal/80">{location.system_name ?? 'Unknown System'}</p>
            <p className="px-4 text-xs uppercase tracking-[0.3em] text-slate-400">No screenshot captured for this listing yet</p>
          </div>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge className={CONTENT_TYPE_BADGE_CLASSES[location.content_type]}>{titleize(location.content_type)}</Badge>
          {location.item_class ? <Badge className="border-teal/50 bg-teal/15 text-teal">{location.item_class}-Class</Badge> : null}
          {location.platform ? <Badge className="border-white/15 bg-white/5 text-slate-200">{location.platform}</Badge> : null}
          {location.sub_type ? <Badge className="border-white/15 bg-white/5 text-slate-300">{titleize(location.sub_type)}</Badge> : null}
        </div>

        <div className="space-y-2 text-sm text-slate-200">
          <p>
            <span className="text-slate-400">System:</span> {location.system_name ?? 'Unknown'}
          </p>
          <p>
            <span className="text-slate-400">Planet:</span> {location.planet_name ?? 'Unknown'}
          </p>
          <p>
            <span className="text-slate-400">Galaxy:</span> {location.galaxy} <span className="text-slate-500">·</span>{' '}
            {location.game_mode}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Portal Glyphs</p>
            <button
              type="button"
              onClick={() => handleCopy('glyphs', location.portal_glyphs)}
              className="rounded border border-teal/60 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-teal transition hover:bg-teal/10"
            >
              {copyState === 'glyphs' ? 'Copied' : 'Copy Glyphs'}
            </button>
          </div>
          <GlyphTokens glyphs={location.portal_glyphs} />
        </div>

        <div className="flex flex-col gap-3 rounded border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Coordinates</p>
              <p className="mt-1 font-mono text-sm text-slate-100">{location.coordinates ?? 'Not provided'}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy('coordinates', location.coordinates)}
              className="rounded border border-teal/60 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-teal transition hover:bg-teal/10"
            >
              {copyState === 'coordinates' ? 'Copied' : 'Copy Coordinates'}
            </button>
          </div>
        </div>

        {location.notes ? (
          <p className="text-sm leading-7 text-slate-300">
            <span className="text-slate-400">Notes:</span> “{location.notes}”
          </p>
        ) : null}

        <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-slate-300">
          <p>
            <span className="text-slate-400">Source:</span>{' '}
            {location.source_author ? `Posted by ${location.source_author}` : 'Unknown submitter'} on{' '}
            {titleize(location.source_type.replace('_', ' '))}
            {location.source_url ? (
              <>
                {' '}
                ·{' '}
                <a className="text-teal underline-offset-4 hover:underline" href={location.source_url} target="_blank" rel="noreferrer">
                  View Post ↗
                </a>
              </>
            ) : null}
          </p>
          <p>
            <span className="text-slate-400">Last Confirmed:</span>{' '}
            {location.last_confirmed_at ? formatRelativeDate(location.last_confirmed_at) : 'Not confirmed yet'}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {isVerified ? <Badge className="border-emerald-400/40 bg-emerald-500/15 text-emerald-200">✓ Community Verified</Badge> : null}
            {isOutdated ? <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200">⚠ May Be Outdated</Badge> : null}
            <Badge className="border-white/10 bg-white/5 text-slate-300">
              {`Confidence ${confidence.confidence_pct ?? 0}% · ${confidence.total_votes} vote${confidence.total_votes === 1 ? '' : 's'}`}
            </Badge>
          </div>
        </div>

        <FeedbackComposer location={location} onSubmit={(input) => onFeedbackSubmit(location.id, input)} />
      </div>
    </article>
  );
}
