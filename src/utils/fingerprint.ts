export async function createFingerprint() {
  const fingerprintSource = [
    navigator.userAgent,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
  ].join('|');

  const bytes = new TextEncoder().encode(fingerprintSource);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((value) => value.toString(16).padStart(2, '0')).join('');
}
