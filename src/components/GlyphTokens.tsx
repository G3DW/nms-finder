type GlyphTokensProps = {
  glyphs: string | null;
};

export function GlyphTokens({ glyphs }: GlyphTokensProps) {
  if (!glyphs) {
    return <p className="text-sm text-slate-500">Glyphs unavailable</p>;
  }

  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
      {glyphs.split('').map((glyph, index) => {
        const normalizedGlyph = glyph.toUpperCase();

        return (
          <div
            key={`${glyph}-${index}`}
            className="flex aspect-square items-center justify-center rounded border border-teal/30 bg-teal/10 text-teal shadow-[0_0_16px_rgba(0,229,204,0.14)]"
            title={`Glyph ${normalizedGlyph}`}
            aria-label={`Portal glyph ${normalizedGlyph}`}
          >
            <span
              className="nms-glyph text-[2rem] leading-none text-teal [text-shadow:0_0_12px_rgba(0,229,204,0.25)]"
              aria-hidden="true"
            >
              {normalizedGlyph}
            </span>
          </div>
        );
      })}
    </div>
  );
}
