// Fixed-window counter per key. State is per server instance, so this is a speed bump
// against one client looping; the platform firewall and the API spend limit are the real caps.
export function createRateLimiter({
  max,
  windowMs,
  maxKeys = 10_000,
}: {
  max: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (key: string, now: number): boolean => {
    const h = hits.get(key);
    if (!h || h.reset <= now) {
      if (hits.size >= maxKeys) hits.clear(); // bound memory
      hits.set(key, { n: 1, reset: now + windowMs });
      return false;
    }
    return ++h.n > max;
  };
}
