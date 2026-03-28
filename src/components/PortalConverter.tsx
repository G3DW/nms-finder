import { useMemo, useState } from 'react';
import { galacticToPortalGlyphs, portalGlyphsToGalactic } from '../utils/portalConversion';

export function PortalConverter() {
  const [galacticAddress, setGalacticAddress] = useState('012F:0088:08AE:01E0');
  const [planetIndex, setPlanetIndex] = useState('0');
  const [portalGlyphs, setPortalGlyphs] = useState('11E0090AF930');

  const encoded = useMemo(() => galacticToPortalGlyphs(galacticAddress, planetIndex), [galacticAddress, planetIndex]);
  const decoded = useMemo(() => portalGlyphsToGalactic(portalGlyphs), [portalGlyphs]);

  return (
    <section className="mb-6 border border-teal/25 bg-slate-950/70 p-5 shadow-teal backdrop-blur">
      <div className="mb-4">
        <p className="font-display text-lg uppercase tracking-[0.18em] text-white">Portal Glyph Converter</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
          Convert galactic addresses to 12-digit portal glyph strings and back. This follows the community-documented base-16 portal
          addressing math used by tools like the NMS Portals Decoder.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Galactic Address → Glyphs</p>
          <input
            value={galacticAddress}
            onChange={(event) => setGalacticAddress(event.target.value)}
            placeholder="012F:0088:08AE:01E0"
            className="w-full rounded border border-white/10 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none focus:border-teal/70"
          />
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Planet Index</span>
            <select
              value={planetIndex}
              onChange={(event) => setPlanetIndex(event.target.value)}
              className="rounded border border-white/10 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none focus:border-teal/70"
            >
              {Array.from({ length: 16 }).map((_, index) => (
                <option key={index} value={index.toString(16).toUpperCase()}>
                  {index.toString(16).toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded border border-dashed border-teal/30 bg-teal/10 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Portal Glyphs</p>
            <p className="mt-2 break-all font-display text-lg tracking-[0.18em] text-teal">
              {encoded.ok ? encoded.value : encoded.error}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Glyphs → Galactic Address</p>
          <input
            value={portalGlyphs}
            onChange={(event) => setPortalGlyphs(event.target.value)}
            placeholder="11E0090AF930"
            className="w-full rounded border border-white/10 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none focus:border-teal/70"
          />
          <div className="rounded border border-dashed border-teal/30 bg-teal/10 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Galactic Address</p>
            <p className="mt-2 break-all font-display text-lg tracking-[0.1em] text-teal">
              {decoded.ok ? decoded.value.address : decoded.error}
            </p>
            {decoded.ok ? <p className="mt-2 text-sm text-slate-300">Planet index: {decoded.value.planetIndex}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
