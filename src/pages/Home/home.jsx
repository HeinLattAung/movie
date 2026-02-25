import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFavorites } from '../../context/FavoritesContext.jsx'
import './home.css'
import Navbar from '../../components/navbar/navbar.jsx'
import TitleCard from '../../components/titleCard/titlecard.jsx'
import Footer from '../../components/footer/footer.jsx'
import {
  getTrending, getNowPlaying, getTopRated, getPopular, getUpcoming, getFavorite,
  getAction, getComedy, getRomance, getSciFi, getFantasy, getSliceOfLife,
  backdropUrl
} from '../../services/tmdb.js'

const categories = [
  { key: 'trending', title: 'Trending Now', fetcher: getTrending },
  { key: 'new-this-season', title: 'New This Season', fetcher: getNowPlaying },
  { key: 'top-rated', title: 'Top Rated of All Time', fetcher: getTopRated },
  { key: 'popular', title: 'Most Popular', fetcher: getPopular },
  { key: 'fan-favorites', title: 'Fan Favorites', fetcher: getFavorite },
  { key: 'upcoming', title: 'Upcoming', fetcher: getUpcoming },
  { key: 'action', title: 'Action', fetcher: getAction },
  { key: 'comedy', title: 'Comedy', fetcher: getComedy },
  { key: 'romance', title: 'Romance', fetcher: getRomance },
  { key: 'sci-fi', title: 'Sci-Fi', fetcher: getSciFi },
  { key: 'fantasy', title: 'Fantasy', fetcher: getFantasy },
  { key: 'slice-of-life', title: 'Slice of Life', fetcher: getSliceOfLife },
];

const Home = () => {
  const [sections, setSections] = useState({});
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const heroLocked = useRef(false);
  const { favorites } = useFavorites();

  const activeCategory = searchParams.get('category');
  const activeCat = activeCategory ? categories.find(c => c.key === activeCategory) : null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      for (const cat of categories) {
        if (cancelled) return;
        try {
          const results = await cat.fetcher();

          // Lock hero to the first pick — never change it again
          if (!heroLocked.current && results.length > 0) {
            const pick = results[Math.floor(Math.random() * Math.min(5, results.length))];
            heroLocked.current = true;
            setHero(pick);
          }

          if (!cancelled) {
            setSections(prev => ({ ...prev, [cat.title]: results }));
          }
        } catch (err) {
          console.error(`Failed to load ${cat.title}:`, err);
        }
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  });

  return (
    <div className="home">
      <Navbar />

      {/* Hero Banner */}
      {!activeCat && <section
        className="home-hero"
        style={!hero?.trailerYoutubeId && hero?.backdrop_path ? {
          backgroundImage: `url(${backdropUrl(hero.backdrop_path)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        } : undefined}
      >
        {hero?.trailerYoutubeId && (
          <div className="hero-video-bg">
            <iframe
              src={`https://www.youtube.com/embed/${hero.trailerYoutubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${hero.trailerYoutubeId}&modestbranding=1&iv_load_policy=3&disablekb=1`}
              title="Hero trailer"
              frameBorder="0"
              allow="autoplay"
              className="hero-video-iframe"
            />
          </div>
        )}
        <div className="home-hero-overlay" />
        {hero ? (
          <div className="home-hero-content animate-fade-in-up">
            <span className="hero-tag">Featured</span>
            <h1 className="home-hero-title">{hero.title}</h1>
            <p className="home-hero-desc">{hero.overview?.slice(0, 200)}{hero.overview?.length > 200 ? '...' : ''}</p>
            <div className="home-hero-meta">
              {hero.release_date && <span className="meta-badge">{hero.release_date.slice(0, 4)}</span>}
              {hero.episodes && <span className="meta-badge">{hero.episodes} eps</span>}
              {hero.vote_average > 0 && <span className="meta-badge meta-rating">{hero.vote_average.toFixed(1)}</span>}
            </div>
            <div className="home-hero-actions">
              <button className="btn-play" onClick={() => navigate(`/player/${hero.id}`)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Watch Now
              </button>
              <button className="btn-info" onClick={() => navigate(`/player/${hero.id}`)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                More Info
              </button>
            </div>
          </div>
        ) : (
          <div className="home-hero-content">
            <div className="hero-loading">
              <div className="loading-shimmer" />
            </div>
          </div>
        )}
      </section>}

      {/* Anime Rows */}
      <div className={`home-content${activeCat ? ' category-active' : ''}`}>
        {activeCat ? (
          /* Category Detail View */
          <section className="movie-section scroll-reveal visible">
            <div className="section-header">
              <button className="see-all-back" onClick={() => setSearchParams({})}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2>{activeCat.title}</h2>
            </div>
            <div className="category-grid">
              {(sections[activeCat.title] || []).map((anime, i) => (
                <TitleCard key={`${anime.id}-${i}`} movie={anime} />
              ))}
              {!sections[activeCat.title] && (
                <div className="loading-cards">
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <div key={j} className="loading-card" />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Normal Browse View */
          <>
            {/* My Favorites */}
            {favorites.length > 0 && (
              <section className="movie-section scroll-reveal">
                <div className="section-header">
                  <h2>My Favorites</h2>
                </div>
                <div className="movie-row">
                  {favorites.map((anime, i) => (
                    <TitleCard key={`fav-${anime.id}-${i}`} movie={anime} />
                  ))}
                </div>
              </section>
            )}

            {categories.map((cat, idx) => {
              const items = sections[cat.title];
              if (!items || items.length === 0) {
                if (loading || !sections[cat.title]) {
                  return (
                    <section key={cat.title} className="movie-section">
                      <div className="section-header">
                        <h2>{cat.title}</h2>
                      </div>
                      <div className="loading-cards">
                        {[1, 2, 3, 4, 5, 6].map(j => (
                          <div key={j} className="loading-card" />
                        ))}
                      </div>
                    </section>
                  );
                }
                return null;
              }
              return (
                <section key={cat.title} className="movie-section scroll-reveal" style={{ transitionDelay: `${idx * 0.05}s` }}>
                  <div className="section-header">
                    <h2>{cat.title}</h2>
                    <button className="see-all" onClick={() => { setSearchParams({ category: cat.key }); window.scrollTo(0, 0); }}>See all</button>
                  </div>
                  <div className="movie-row">
                    {items.map((anime, i) => (
                      <TitleCard key={`${anime.id}-${i}`} movie={anime} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Home
