import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { ToastProvider, useToast } from './components/ToastSystem';
import { AudioProvider } from './AudioEngine';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import OfflineBanner from './components/OfflineBanner';

import Home from './pages/Home';
import { MusicPlayer } from './MusicPlayer';

// ── Page wrapper with transition ──────────────────────────────
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// ── Animated routes ───────────────────────────────────────────
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/player" element={<PageWrapper><MusicPlayer /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

// ── 404 ──────────────────────────────────────────────────────
const NotFound: React.FC = () => {
  const { addToast } = useToast();
  useEffect(() => {
    addToast('404 — SIGNAL NOT FOUND IN THE VOID', 'error', 4000);
  }, [addToast]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div className="grunge-text" style={{ fontSize: 'clamp(4rem, 15vw, 10rem)', letterSpacing: '0.05em' }}>
        404
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        letterSpacing: '0.3em',
        color: 'rgba(136,136,136,0.5)',
        marginTop: '1rem',
      }}>
        SIGNAL NOT FOUND — THIS FREQUENCY DOESN'T EXIST
      </div>
    </div>
  );
};

// ── Cursor glow ───────────────────────────────────────────────
const CursorGlow: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px';
        ref.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return <div ref={ref} className="cursor-glow" />;
};

// ── SVG Grunge Filter (global) ────────────────────────────────
const GlobalFilters: React.FC = () => (
  <svg style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="grunge-filter" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="5" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="disp" />
        <feGaussianBlur in="disp" stdDeviation="0.4" result="blur" />
        <feBlend in="SourceGraphic" in2="blur" mode="screen" result="blend" />
        <feComposite in="blend" in2="SourceGraphic" operator="in" />
      </filter>
    </defs>
  </svg>
);

// ── Root App ──────────────────────────────────────────────────
const App: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <ToastProvider>
      <AudioProvider>
        <HashRouter>
          <GlobalFilters />

          {/* Atmospheric overlays */}
          <div className="grain-overlay" />
          <div className="scanline" />
          <div className="vignette" />
          <CursorGlow />
          <OfflineBanner />

          {/* Loading screen */}
          {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}

          {/* Main content */}
          <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            <Navbar />
            <AnimatedRoutes />
          </div>
        </HashRouter>
      </AudioProvider>
    </ToastProvider>
  );
};

export default App;
