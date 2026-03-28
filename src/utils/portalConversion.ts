const GALACTIC_ADDRESS_PATTERN = /^([0-9A-F]{1,4}):([0-9A-F]{1,4}):([0-9A-F]{1,4}):([0-9A-F]{1,4})$/i;
const PORTAL_GLYPHS_PATTERN = /^[0-9A-F]{12}$/i;

function padHex(value: number, width: number) {
  return value.toString(16).toUpperCase().padStart(width, '0');
}

function wrap(value: number, modulo: number) {
  return ((value % modulo) + modulo) % modulo;
}

export function galacticToPortalGlyphs(address: string, planetIndex: string) {
  const normalized = address.trim().toUpperCase();
  const match = normalized.match(GALACTIC_ADDRESS_PATTERN);

  if (!match) {
    return { ok: false as const, error: 'Enter address as XXXX:YYYY:ZZZZ:SSSS' };
  }

  const [, xRaw, yRaw, zRaw, systemRaw] = match;
  const x = parseInt(xRaw, 16);
  const y = parseInt(yRaw, 16);
  const z = parseInt(zRaw, 16);
  const system = parseInt(systemRaw, 16);

  const portalX = wrap(x + 0x801, 0x1000);
  const portalY = wrap(y - 0x7f, 0x100);
  const portalZ = wrap(z + 0x801, 0x1000);

  return {
    ok: true as const,
    value: `${planetIndex.toUpperCase()}${padHex(system, 3)}${padHex(portalY, 2)}${padHex(portalZ, 3)}${padHex(portalX, 3)}`,
  };
}

export function portalGlyphsToGalactic(glyphs: string) {
  const normalized = glyphs.trim().toUpperCase();
  if (!PORTAL_GLYPHS_PATTERN.test(normalized)) {
    return { ok: false as const, error: 'Enter a 12-digit portal glyph string' };
  }

  const planetIndex = normalized.slice(0, 1);
  const system = normalized.slice(1, 4);
  const y = parseInt(normalized.slice(4, 6), 16);
  const z = parseInt(normalized.slice(6, 9), 16);
  const x = parseInt(normalized.slice(9, 12), 16);

  const galacticX = wrap(x + 0x7ff, 0x1000);
  const galacticY = wrap(y + 0x7f, 0x100);
  const galacticZ = wrap(z + 0x7ff, 0x1000);

  return {
    ok: true as const,
    value: {
      address: `${padHex(galacticX, 4)}:${padHex(galacticY, 4)}:${padHex(galacticZ, 4)}:${padHex(parseInt(system, 16), 4)}`,
      planetIndex,
    },
  };
}
