// Jikan API v4 - Free MyAnimeList API (no key needed)
const BASE = '/api/anime';

// Serialize requests and bound retries so a failed request cannot stall the queue.
const queue = [];
const pending = new Map();
let active = 0;
let nextStart = 0;
const cache = new Map();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function processQueue() {
  while (active < 3 && queue.length) {
    const task = queue.shift();
    active++;
    runTask(task).finally(() => { active--; processQueue(); });
  }
}

async function runTask(task) {
  const start = Math.max(Date.now(), nextStart);
  nextStart = start + 400;
  await pause(start - Date.now());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 16000);
  let retryDelay = 1000 * (task.attempt + 1);
  try {
    const res = await fetch(task.url, { signal: controller.signal });
    if (!res.ok) {
      const error = new Error(`Anime API: ${res.status}`);
      error.retryable = res.status === 429 || res.status >= 500;
      const seconds = Number(res.headers.get('Retry-After'));
      if (seconds > 0) retryDelay = Math.min(seconds * 1000, 10000);
      throw error;
    }
    const data = await res.json();
    cache.set(task.url, { data, expires: Date.now() + 300000 });
    task.resolve(data);
  } catch (error) {
    if (task.attempt < 2 && error.retryable !== false) {
      setTimeout(() => {
        queue.push({ ...task, attempt: task.attempt + 1 });
        processQueue();
      }, retryDelay);
    } else {
      task.reject(new Error('Anime could not be loaded. Check your connection and try again.', { cause: error }));
    }
  } finally {
    clearTimeout(timeout);
  }
}

function jikanFetch(url) {
  const cached = cache.get(url);
  if (cached?.expires > Date.now()) return Promise.resolve(cached.data);
  if (pending.has(url)) return pending.get(url);
  const request = new Promise((resolve, reject) => {
    const task = { url, resolve, reject, attempt: 0 };
    if (/\/anime\/\d+\/full/.test(url)) queue.unshift(task);
    else queue.push(task);
    processQueue();
  }).finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
}

// Extract YouTube ID from embed_url or youtube_id
function extractYoutubeId(trailer) {
  if (!trailer) return null;
  if (trailer.youtube_id) return trailer.youtube_id;
  if (trailer.embed_url) {
    const match = trailer.embed_url.match(/\/embed\/([^?]+)/);
    if (match) return match[1];
  }
  if (trailer.url) {
    const match = trailer.url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
  }
  return null;
}

// Normalize anime data to a common shape
function normalize(anime) {
  if (!anime) return null;
  return {
    id: anime.mal_id,
    title: anime.title_english || anime.title,
    poster_path: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || null,
    backdrop_path: anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url || null,
    vote_average: anime.score || 0,
    release_date: anime.aired?.from?.slice(0, 10) || '',
    overview: anime.synopsis || '',
    genres: (anime.genres || []).map(g => ({ id: g.mal_id, name: g.name })),
    episodes: anime.episodes,
    status: anime.status,
    trailerYoutubeId: extractYoutubeId(anime.trailer),
    type: anime.type,
    source: anime.source,
    duration: anime.duration,
    studios: (anime.studios || []).map(s => s.name),
  };
}

// Remove duplicates by id
function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// Image helpers (pass-through since Jikan gives full URLs)
export function imageUrl(path) { return path || null; }
export function backdropUrl(path) { return path || null; }

// --- Category fetchers ---
export async function getTrending() {
  const data = await jikanFetch(`${BASE}/top/anime?filter=airing&limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export async function getNowPlaying() {
  const data = await jikanFetch(`${BASE}/seasons/now?limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export async function getTopRated() {
  const data = await jikanFetch(`${BASE}/top/anime?limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export async function getPopular() {
  const data = await jikanFetch(`${BASE}/top/anime?filter=bypopularity&limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export async function getUpcoming() {
  const data = await jikanFetch(`${BASE}/seasons/upcoming?limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export async function getFavorite() {
  const data = await jikanFetch(`${BASE}/top/anime?filter=favorite&limit=25`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

// Genre fetchers (Jikan genre IDs)
// Action=1, Adventure=2, Comedy=4, Drama=8, Fantasy=10, Horror=14, Romance=22, Sci-Fi=24, Slice of Life=36, Sports=30
export async function getByGenre(genreId) {
  const data = await jikanFetch(`${BASE}/anime?genres=${genreId}&order_by=score&sort=desc&limit=25&sfw=true`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}

export const getAction = () => getByGenre(1);
export const getComedy = () => getByGenre(4);
export const getRomance = () => getByGenre(22);
export const getHorror = () => getByGenre(14);
export const getSciFi = () => getByGenre(24);
export const getFantasy = () => getByGenre(10);
export const getSliceOfLife = () => getByGenre(36);
export const getSports = () => getByGenre(30);

// --- Details ---
export async function getMovieDetails(id) {
  const data = await jikanFetch(`${BASE}/anime/${id}/full`);
  return normalize(data.data);
}

export async function getMovieVideos(id) {
  const data = await jikanFetch(`${BASE}/anime/${id}/videos`);
  const promos = data.data?.promo || [];
  return promos.map(p => ({
    key: extractYoutubeId(p.trailer),
    name: p.title,
    type: 'Trailer',
    site: 'YouTube',
  })).filter(v => v.key);
}

export async function getSimilarMovies(id) {
  const data = await jikanFetch(`${BASE}/anime/${id}/recommendations`);
  return dedupe((data.data || []).slice(0, 12).map(rec => normalize(rec.entry)).filter(Boolean));
}

export async function getMovieCredits(id) {
  const data = await jikanFetch(`${BASE}/anime/${id}/characters`);
  const cast = (data.data || []).slice(0, 8).map(c => ({
    id: c.character?.mal_id,
    name: c.character?.name,
    character: c.role,
    profile_path: c.character?.images?.jpg?.image_url || null,
  }));
  return { cast };
}

// --- Search ---
export async function searchMovies(query) {
  const data = await jikanFetch(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`);
  return dedupe((data.data || []).map(normalize).filter(Boolean));
}
