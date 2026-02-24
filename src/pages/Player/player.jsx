import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMovieDetails, getMovieVideos, getSimilarMovies, getMovieCredits } from '../../services/tmdb.js'
import TitleCard from '../../components/titleCard/titlecard.jsx'
import './player.css'

const Player = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const details = await getMovieDetails(id);
        setAnime(details);

        // Trailer from details
        if (details.trailerYoutubeId) {
          setTrailer({ key: details.trailerYoutubeId, name: details.title + ' Trailer' });
        } else {
          try {
            const videos = await getMovieVideos(id);
            setTrailer(videos.length > 0 ? videos[0] : null);
          } catch { setTrailer(null); }
        }

        try {
          const sim = await getSimilarMovies(id);
          setSimilar(sim || []);
        } catch { setSimilar([]); }

        try {
          const credits = await getMovieCredits(id);
          setCast(credits?.cast || []);
        } catch { setCast([]); }

      } catch (err) {
        console.error('Failed to load anime:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="player-page">
        <div className="player-loading">
          <div className="player-spinner" />
          <p>Loading anime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      {/* Video Section */}
      <div className="player-video-section">
        {trailer ? (
          <div className="player-container animate-fade-in">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
              title={trailer.name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="player-iframe"
            />
          </div>
        ) : (
          <div
            className="player-container player-fallback-bg animate-fade-in"
            style={anime?.backdrop_path ? {
              backgroundImage: `url(${anime.backdrop_path})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            <div className="player-no-trailer">
              <div className="player-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <p>No trailer available</p>
            </div>
          </div>
        )}
      </div>

      {/* Anime Details */}
      {anime && (
        <div className="player-details animate-fade-in-up">
          <div className="player-details-inner">
            <div className="player-poster">
              {anime.poster_path && <img src={anime.poster_path} alt={anime.title} />}
            </div>
            <div className="player-info">
              <h1 className="player-title">{anime.title}</h1>
              <div className="player-meta">
                {anime.release_date && <span className="p-meta-badge">{anime.release_date.slice(0, 4)}</span>}
                {anime.episodes && <span className="p-meta-badge">{anime.episodes} Episodes</span>}
                {anime.type && <span className="p-meta-badge">{anime.type}</span>}
                {anime.status && <span className="p-meta-badge">{anime.status}</span>}
                {anime.vote_average > 0 && <span className="p-meta-badge p-meta-rating">{anime.vote_average.toFixed(1)}</span>}
              </div>
              {anime.genres?.length > 0 && (
                <div className="player-genres">
                  {anime.genres.map(g => <span key={g.id} className="genre-tag">{g.name}</span>)}
                </div>
              )}
              {anime.studios?.length > 0 && <p className="player-studios">Studio: {anime.studios.join(', ')}</p>}
              {anime.duration && <p className="player-duration">Duration: {anime.duration}</p>}
              <p className="player-overview">{anime.overview}</p>

              {/* Characters */}
              {cast.length > 0 && (
                <div className="player-cast">
                  <h3>Characters</h3>
                  <div className="cast-row">
                    {cast.map(c => (
                      <div key={c.id} className="cast-item">
                        <div className="cast-photo">
                          {c.profile_path ? (
                            <img src={c.profile_path} alt={c.name} />
                          ) : (
                            <div className="cast-photo-fallback">{c.name?.charAt(0)}</div>
                          )}
                        </div>
                        <p className="cast-name">{c.name}</p>
                        <p className="cast-char">{c.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Similar Anime */}
      {similar.length > 0 && (
        <div className="player-similar animate-fade-in-up">
          <h2>Recommended</h2>
          <div className="movie-row">
            {similar.map((m, i) => <TitleCard key={`${m.id}-${i}`} movie={m} />)}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="player-nav">
        <button className="player-back" onClick={() => navigate('/home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </button>
      </div>
    </div>
  )
}

export default Player
