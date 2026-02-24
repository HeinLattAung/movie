import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Landing.css'

const Landing = () => {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }} />
            ))}
          </div>
        </div>

        <nav className="landing-nav animate-fade-in-down">
          <div className="nav-logo">
            <div className="logo-icon">K</div>
            <span className="logo-text">Kraken's Cinema</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up stagger-1">
            <span className="badge-dot" />
            Now Streaming
          </div>
          <h1 className="hero-title animate-fade-in-up stagger-2">
            Unlimited Anime,<br />
            <span className="gradient-text">Endless Adventures</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up stagger-3">
            Dive into a world of shonen, isekai, romance, and legendary anime.
            Stream anywhere, anytime, on any device.
          </p>
          <div className="hero-cta animate-fade-in-up stagger-4">
            <button className="btn-primary btn-lg" onClick={() => navigate('/signup')}>
              Start Watching Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="btn-outline btn-lg" onClick={() => navigate('/login')}>
              I Have an Account
            </button>
          </div>
          <div className="hero-stats animate-fade-in-up stagger-5">
            <div className="stat">
              <span className="stat-number">25K+</span>
              <span className="stat-label">Anime Titles</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">1080p</span>
              <span className="stat-label">HD Quality</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">0</span>
              <span className="stat-label">Ads Ever</span>
            </div>
          </div>
        </div>

        <div className="hero-visual animate-scale-in stagger-3">
          <div className="hero-card-stack">
            <div className="hero-card card-1">
              <div className="card-shimmer" />
            </div>
            <div className="hero-card card-2">
              <div className="card-shimmer" />
            </div>
            <div className="hero-card card-3">
              <div className="play-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <div className="card-shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" ref={featuresRef}>
        <div className="section-container">
          <div className="scroll-reveal">
            <h2 className="section-title">Why Choose <span className="gradient-text">Kraken's Cinema</span></h2>
            <p className="section-subtitle">The ultimate anime streaming experience</p>
          </div>

          <div className="features-grid">
            <div className="feature-card scroll-reveal">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <h3>Watch Anywhere</h3>
              <p>Stream on your phone, tablet, laptop, or TV without paying more.</p>
            </div>

            <div className="feature-card scroll-reveal">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Every Genre</h3>
              <p>Shonen, Seinen, Shojo, Isekai, Mecha, Slice of Life and more.</p>
            </div>

            <div className="feature-card scroll-reveal">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
              </div>
              <h3>Sub & Dub</h3>
              <p>Watch with Japanese audio + subtitles or English dub. Your choice.</p>
            </div>

            <div className="feature-card scroll-reveal">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Secure & Private</h3>
              <p>Your data stays yours. No tracking, no selling, complete privacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="section-container scroll-reveal">
          <h2 className="section-title">Ready to Start Watching?</h2>
          <p className="section-subtitle">Join thousands of anime fans. No credit card required.</p>
          <div className="cta-buttons">
            <button className="btn-primary btn-lg" onClick={() => navigate('/signup')}>
              Create Free Account
            </button>
            <button className="btn-ghost btn-lg" onClick={() => navigate('/login')}>
              Continue as Guest
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">K</div>
            <span className="logo-text">Kraken's Cinema</span>
          </div>
          <p className="footer-copy">&copy; 2026 Kraken's Cinema. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
