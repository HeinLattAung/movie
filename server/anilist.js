const genres = { 1: 'Action', 4: 'Comedy', 10: 'Fantasy', 14: 'Horror', 22: 'Romance', 24: 'Sci-Fi', 30: 'Sports', 36: 'Slice of Life' };
const fields = `idMal title { romaji english } coverImage { large extraLarge } bannerImage averageScore description genres episodes status format source duration studios { nodes { name } } startDate { year month day } trailer { id site }`;

function convert(media) {
  const date = media.startDate;
  return {
    mal_id: media.idMal,
    title: media.title.romaji,
    title_english: media.title.english,
    images: { jpg: { image_url: media.coverImage.large, large_image_url: media.coverImage.extraLarge } },
    trailer: { youtube_id: media.trailer?.site === 'youtube' ? media.trailer.id : null, images: { maximum_image_url: media.bannerImage } },
    score: (media.averageScore || 0) / 10,
    synopsis: (media.description || '').replace(/<[^>]*>/g, ''),
    genres: (media.genres || []).map(name => ({ mal_id: Number(Object.keys(genres).find(id => genres[id] === name)) || 0, name })),
    episodes: media.episodes,
    status: media.status,
    type: media.format,
    source: media.source,
    duration: media.duration ? `${media.duration} min per ep` : null,
    studios: media.studios.nodes,
    aired: { from: date?.year ? `${date.year}-${String(date.month || 1).padStart(2, '0')}-${String(date.day || 1).padStart(2, '0')}` : null },
  };
}

export async function fallbackAnime(path, params) {
  const detail = path.match(/^anime\/(\d+)\/(full|videos|recommendations|characters)$/);
  // Optional companion data can be empty while the main catalog stays available.
  if (detail && ['recommendations', 'characters'].includes(detail[2])) return { data: [] };
  let query;
  let variables;
  if (detail) {
    query = `query ($id: Int) { Media(idMal: $id, type: ANIME) { ${fields} } }`;
    variables = { id: Number(detail[1]) };
  } else {
    const filter = params.get('filter');
    let sort = 'SCORE_DESC';
    let status;
    if (filter === 'airing') { sort = 'TRENDING_DESC'; status = 'RELEASING'; }
    if (filter === 'bypopularity') sort = 'POPULARITY_DESC';
    if (filter === 'favorite') sort = 'FAVOURITES_DESC';
    if (path === 'seasons/now') { sort = 'TRENDING_DESC'; status = 'RELEASING'; }
    if (path === 'seasons/upcoming') { sort = 'POPULARITY_DESC'; status = 'NOT_YET_RELEASED'; }
    query = `query ($page: Int, $limit: Int, $search: String, $genre: String, $sort: [MediaSort], $status: MediaStatus) { Page(page: $page, perPage: $limit) { media(type: ANIME, isAdult: false, search: $search, genre: $genre, sort: $sort, status: $status) { ${fields} } } }`;
    variables = { page: Math.max(1, Number(params.get('page')) || 1), limit: Math.min(25, Math.max(1, Number(params.get('limit')) || 25)), search: params.get('q') || undefined, genre: genres[params.get('genres')], sort: [sort], status };
  }
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error('Fallback provider unavailable');
  const result = await response.json();
  if (result.errors || !result.data) throw new Error('Fallback returned an error');
  if (detail) {
    if (!result.data.Media?.idMal) throw new Error('Anime not found');
    const anime = convert(result.data.Media);
    if (detail[2] === 'videos') return { data: { promo: anime.trailer.youtube_id ? [{ title: 'Trailer', trailer: anime.trailer }] : [] } };
    return { data: anime };
  }
  return { data: result.data.Page.media.filter(media => media.idMal).map(convert) };
}
