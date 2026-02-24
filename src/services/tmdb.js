// Jikan API v4 - Free MyAnimeList API (no key needed)
const BASE = 'https://api.jikan.moe/v4';

// Queue-based rate limiter for Jikan (3 req/sec max)
const queue = [];
let processing = false;

function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  const { url, resolve, reject } = queue.shift();
  fetch(url)
    .then(res => {
      if (res.status === 429) {
        // Rate limited - re-queue with delay
        queue.unshift({ url, resolve, reject });
        setTimeout(() => { processing = false; processQueue(); }, 1000);
        return;
      }
      if (!res.ok) throw new Error(`Jikan: ${res.status}`);
      return res.json();
    })
    .then(data => { if (data) resolve(data); })
    .catch(reject)
    .finally(() => {
      setTimeout(() => { processing = false; processQueue(); }, 340);
    });
}

function jikanFetch(url) {
  return new Promise((resolve, reject) => {
    queue.push({ url, resolve, reject });
    processQueue();
  });
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
