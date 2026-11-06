// Same-origin redirect guard. Pure JS, no imports: safe for client and server code.
// Only paths that start with exactly one "/" are accepted; anything else
// (absolute URLs, protocol-relative "//host", backslash tricks, control
// characters) returns the fallback.
export function safeNext(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\\\u0000-\u001f]/.test(value)) return fallback;
  try {
    const base = 'http://placeholder.invalid';
    if (new URL(value, base).origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}
