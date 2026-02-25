import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { searchMovies } from '../../services/tmdb.js'
import './navbar.css'

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setResults([]);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const data = await searchMovies(query.trim());
      setResults(data?.slice(0, 8) || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 800);
  };

  const handleToggleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchQuery('');
      setResults([]);
    } else {
      setSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResultClick = (id) => {
    setSearchOpen(false);
    setSearchQuery('');
    setResults([]);
    navigate(`/player/${id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchQuery('');
      setResults([]);
    } else if (e.key === 'Enter') {
      clearTimeout(debounceRef.current);
      doSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-left">
        <div className="nav-brand" onClick={() => navigate('/home')}>
          <div className="brand-icon">K</div>
          <span className="brand-text">Kraken's Cinema</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="search-wrapper" ref={searchRef}>
          <div className={`search-container ${searchOpen ? 'search-open' : ''}`}>
            <button className="search-toggle" onClick={handleToggleSearch}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search anime..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => { setSearchQuery(''); setResults([]); inputRef.current?.focus(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {searchOpen && (searchQuery.trim().length >= 2) && (
            <div className="search-dropdown">
              {searching ? (
                <div className="search-status">
                  <div className="search-spinner" />
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="search-results">
                  {results.map(anime => (
                    <div key={anime.id} className="search-result-item" onClick={() => handleResultClick(anime.id)}>
                      <div className="result-poster">
                        {anime.poster_path ? (
                          <img src={anime.poster_path} alt={anime.title} />
                        ) : (
                          <div className="result-poster-fallback">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                              <rect x="2" y="2" width="20" height="20" rx="2" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="result-info">
                        <p className="result-title">{anime.title}</p>
                        <div className="result-meta">
                          {anime.release_date && <span>{anime.release_date.slice(0, 4)}</span>}
                          {anime.episodes && (
                            <>
                              <span className="result-dot" />
                              <span>{anime.episodes} eps</span>
                            </>
                          )}
                          {anime.vote_average > 0 && (
                            <>
                              <span className="result-dot" />
                              <span className="result-rating">{anime.vote_average.toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-status">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <div className="user-menu" ref={menuRef}>
          <button className="avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="avatar">{user?.avatar || 'U'}</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${menuOpen ? 'chevron-up' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <div className="dropdown-menu animate-scale-in">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{user?.avatar || 'U'}</div>
                <div>
                  <p className="dropdown-name">{user?.name || 'User'}</p>
                  <p className="dropdown-email">{user?.email || 'Guest account'}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              {user?.isGuest && (
                <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/signup'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Create Account
                </button>
              )}
              <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
