import React from 'react'
import './footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-icon">K</div>
            <span className="footer-logo-text">Kraken's Cinema</span>
          </div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Help Center</a>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Kraken's Cinema. All rights reserved.</p>
          <p className="footer-tagline">Made with passion for movie lovers</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
