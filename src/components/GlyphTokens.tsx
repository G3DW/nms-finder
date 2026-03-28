type GlyphTokensProps = {
  glyphs: string | null;
};

export function GlyphTokens({ glyphs }: GlyphTokensProps) {
  if (!glyphs) {
    return <p className="text-sm text-slate-500">Glyphs unavailable</p>;
  }

  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
      {glyphs.split('').map((glyph, index) => (
        <div
          key={`${glyph}-${index}`}
          className="flex aspect-square items-center justify-center rounded border border-teal/30 bg-teal/10 font-mono text-sm font-semibold text-teal shadow-[0_0_16px_rgba(0,229,204,0.14)]"
        >
          {glyph}
        </div>
      ))}
    </div>
  );
}
