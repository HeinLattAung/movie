import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './titlecard.css'

const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

const TitleCard = ({ movie }) => {
  const [hovered, setHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const navigate = useNavigate();
  const hoverTimer = useRef(null);
  const stopTimer = useRef(null);

  const poster = movie.poster_path;
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const year = movie.release_date?.slice(0, 4);
  const trailerId = movie.trailerYoutubeId;

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice()) return;
    setHovered(true);
    if (trailerId) {
      hoverTimer.current = setTimeout(() => {
        setShowPreview(true);
        stopTimer.current = setTimeout(() => {
          setShowPreview(false);
        }, 7000);
      }, 600);
    }
  }, [trailerId]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setShowPreview(false);
    clearTimeout(hoverTimer.current);
    clearTimeout(stopTimer.current);
  }, []);

  return (
    <div
      className="title-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/player/${movie.id}`)}
    >
      <div className="title-card-poster">
        {poster ? (
          <>
            {!imgLoaded && <div className="poster-skeleton" />}
            <img
              src={poster}
              alt={movie.title}
              className={`poster-img ${imgLoaded ? 'loaded' : ''} ${showPreview ? 'preview-hidden' : ''}`}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="poster-fallback">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="8" cy="8" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Video Preview on Hover */}
        {showPreview && trailerId && (
          <div className="card-video-preview">
            <iframe
              src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerId}&start=5&modestbranding=1`}
              title="Preview"
              frameBorder="0"
              allow="autoplay"
              className="card-preview-iframe"
            />
          </div>
        )}

        {rating && !showPreview && <div className="title-card-rating">{rating}</div>}
        <div className={`title-card-overlay ${hovered && !showPreview ? 'show' : ''}`}>
          <button className="card-play-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>
        <div className="title-card-gradient" />
      </div>
      <div className="title-card-info">
        <h3 className="title-card-title">{movie.title}</h3>
        <div className="title-card-meta">
          {year && <span>{year}</span>}
          {year && movie.episodes && <span className="meta-dot" />}
          {movie.episodes && <span>{movie.episodes} eps</span>}
        </div>
      </div>
    </div>
  )
}

export default TitleCard
