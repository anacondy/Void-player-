import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const routes = [
  { path: '/',       label: 'HOME',   code: '01' },
  { path: '/player', label: 'PLAYER', code: '02' },
  { path: '/feedback', label: 'FEEDBACK', code: '03' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toTimeString().slice(0, 8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'rgba(0,0,0,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(61,255,154,0.06)' : '1px solid transparent',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-condensed)',
            fontWeight: 900,
            fontSize: '1.4rem',
            letterSpacing: '0.1em',
            color: '#e8e8e8',
            lineHeight: 1,
            textShadow: '0 0 15px rgba(61,255,154,0.3)',
          }}>
            VOID
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.45rem',
            letterSpacing: '0.3em',
            color: 'rgba(61,255,154,0.6)',
          }}>
            SR/1.0 ®
          </span>
        </button>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}
          className="hidden-mobile"
        >
          {routes.map(r => (
            <button
              key={r.path}
              onClick={() => {
                if(r.path === '/feedback') {
                  window.open('https://github.com/anacondy/Void-player-/issues/new?template=feedback.md', '_blank');
                } else {
                  navigate(r.path);
                }
              }}
              className={`nav-link ${location.pathname === r.path ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ color: 'rgba(61,255,154,0.4)', marginRight: '0.3rem' }}>{r.code}</span>
              {r.label}
            </button>
          ))}
        </div>

        {/* Clock */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          color: 'rgba(136,136,136,0.7)',
        }}
          className="hidden-mobile"
        >
          {time} UTC
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid rgba(61,255,154,0.2)',
            color: '#a8f0c8',
            width: '36px',
            height: '36px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
          className="show-mobile"
        >
          {menuOpen ? '✕' : '≡'}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          background: 'rgba(0,0,0,0.97)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
        }}>
          {routes.map(r => (
            <button
              key={r.path}
              onClick={() => {
                if(r.path === '/feedback') {
                  window.open('https://github.com/anacondy/Void-player-/issues/new?template=feedback.md', '_blank');
                  setMenuOpen(false);
                } else {
                  navigate(r.path);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-condensed)',
                fontWeight: 800,
                fontSize: '2.5rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: location.pathname === r.path ? '#3dff9a' : '#888',
                transition: 'color 0.2s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
