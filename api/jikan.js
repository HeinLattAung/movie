import { fallbackAnime } from '../server/anilist.js';

const allowedPath = /^(?:top\/anime|seasons\/(?:now|upcoming)|anime(?:\/\d+\/(?:full|videos|recommendations|characters))?)$/;
const allowedParams = new Set(['q', 'limit', 'genres', 'order_by', 'sort', 'sfw', 'filter', 'page']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const incoming = new URL(req.url, 'https://local.invalid');
  const path = req.query?.path ?? incoming.searchParams.get('path');
  if (typeof path !== 'string' || !allowedPath.test(path)) {
    return res.status(400).json({ message: 'Invalid anime endpoint' });
  }

  // Only forward supported paths to the fixed upstream host.
  const upstream = new URL(`https://api.jikan.moe/v4/${path}`);
  for (const [key, value] of incoming.searchParams) {
    if (allowedParams.has(key)) upstream.searchParams.set(key, value);
  }

  // Prefer the reachable provider; Jikan remains the backup.
  try {
    const data = await fallbackAnime(path, incoming.searchParams);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('X-Anime-Provider', 'AniList');
    return res.status(200).json(data);
  } catch { /* Try Jikan if AniList is unavailable. */ }

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) {
      if (response.status === 429) {
        res.setHeader('Retry-After', response.headers.get('Retry-After') || '2');
      }
      if (response.status !== 429) throw new Error('Provider unavailable');
      return res.status(429).json({ message: 'Anime provider is temporarily unavailable. Please retry.' });
    }
    const data = await response.json();
    if (!data || !Object.hasOwn(data, 'data')) throw new Error('Invalid provider response');
    // Share successful public responses at the CDN and serve stale data while refreshing.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ message: 'Anime provider could not be reached. Please retry.' });
  }
}
