import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastSystem';

const TICKER_ITEMS = [
  'VOID CATALOGUE SR/1.0',
  '毎週の音楽',
  'WORLDWIDE ® 2025',
  'HERE FOR THE ART.',
  'MADE WITH PRECISION',
  '毎週の音楽',
  'DIGITAL EXPERIENCES',
  'VOID CATALOGUE SR/1.0',
  'HERE FOR THE ART.',
  'WORLDWIDE ® 2025',
];

const CREDITS = [
  { label: 'creative dir', name: 'VOID STUDIOS' },
  { label: 'design', name: 'SYSTEM ARCHITECTURE' },
  { label: 'development', name: 'ZERO COLLECTIVE' },
  { label: 'motion', name: 'KINETIC DIVISION' },
  { label: 'sound', name: 'SIGNAL BUREAU' },
  { label: 'art direction', name: 'DARK MATTER CO.' },
  { label: 'typography', name: 'TYPEFACE NOIR' },
  { label: 'production', name: 'NULL RECORDS' },
  { label: 'visual fx', name: 'GRAIN & GLOW LAB' },
  { label: 'catalogue edit', name: 'SR/1.0 PRESS' },
];

const KONAMI = [38,38,40,40,37,39,37,39,66,65];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [konamiIdx, setKonamiIdx] = useState(0);
  const [easterEgg, setEasterEgg] = useState(false);
  const [matrixChars, setMatrixChars] = useState<{ id: number; x: number; char: string; speed: number; delay: number }[]>([]);

  // Parallax mouse
  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // Konami code easter egg
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.keyCode === KONAMI[konamiIdx]) {
        const next = konamiIdx + 1;
        if (next === KONAMI.length) {
          setKonamiIdx(0);
          triggerEasterEgg();
        } else {
          setKonamiIdx(next);
        }
      } else {
        setKonamiIdx(0);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [konamiIdx]);

  const triggerEasterEgg = () => {
    addToast('◈ KONAMI CODE ACTIVATED — YOU FOUND IT.', 'success', 5000);
    setEasterEgg(true);
    const chars = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      char: String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)),
      speed: 3 + Math.random() * 7,
      delay: Math.random() * 2,
    }));
    setMatrixChars(chars);
    setTimeout(() => {
      setEasterEgg(false);
      setMatrixChars([]);
    }, 5000);
  };

  // no-op (removed typed variants to avoid framer-motion type issues)

  return (
    <div style={{ background: '#000', minHeight: '100vh', overflow: 'hidden' }}>

      {/* Easter egg matrix */}
      {easterEgg && matrixChars.map(c => (
        <div
          key={c.id}
          className="matrix-char"
          style={{
            left: `${c.x}%`,
            animationDuration: `${c.speed}s`,
            animationDelay: `${c.delay}s`,
            top: 0,
          }}
        >
          {c.char}
        </div>
      ))}

      {/* SVG filter for grunge effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="grunge-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="5" seed="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="0.6" result="blurred" />
            <feBlend in="SourceGraphic" in2="blurred" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* HERO */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '6rem 2rem 4rem',
          background: 'radial-gradient(ellipse at 30% 60%, rgba(13,43,34,0.5) 0%, #000 65%)',
        }}
      >
        {/* Catalogue label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            color: 'rgba(61,255,154,0.5)',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          CATALOGUE SR/1.0 ® — WORLDWIDE 2025
        </motion.div>

        {/* Hero title with glitch + grunge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          style={{
            position: 'relative',
            transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 4}px)`,
            transition: 'transform 0.1s ease-out',
            textAlign: 'center',
          }}
        >
          <h1
            className="grunge-text glitch-wrapper"
            data-text="VOID"
            style={{
              fontSize: 'clamp(5rem, 18vw, 14rem)',
              letterSpacing: '0.05em',
              lineHeight: 0.9,
              marginBottom: '0.2rem',
            }}
          >
            VOID
          </h1>
          <div
            style={{
              fontFamily: 'var(--font-condensed)',
              fontWeight: 800,
              fontSize: 'clamp(0.9rem, 3vw, 1.6rem)',
              letterSpacing: '0.5em',
              color: '#c8c8c8',
              textTransform: 'uppercase',
              marginTop: '0.5rem',
            }}
          >
            DIGITAL EXPERIENCES
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.0 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            color: 'rgba(136,136,136,0.8)',
            textAlign: 'center',
            maxWidth: '400px',
            marginTop: '2rem',
            lineHeight: 1.8,
          }}
        >
          HERE FOR THE ART. BUILT FOR THE VOID.<br />
          LOS ANGELES · TOKYO · WORLDWIDE
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <button
            className="btn-grunge"
            onClick={() => navigate('/player')}
          >
            OPEN PLAYER
          </button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.3em',
              color: 'rgba(61,255,154,0.35)',
            }}
          >
            SCROLL
          </div>
          <div
            style={{
              width: '1px',
              height: '40px',
              background: 'linear-gradient(180deg, rgba(61,255,154,0.4), transparent)',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes scrollPulse {
              0%, 100% { transform: scaleY(1); opacity: 0.6; }
              50% { transform: scaleY(0.7); opacity: 1; }
            }
          `}</style>
        </motion.div>
      </section>

      {/* TICKER */}
      <div
        style={{
          borderTop: '1px solid rgba(61,255,154,0.08)',
          borderBottom: '1px solid rgba(61,255,154,0.08)',
          padding: '0.6rem 0',
          overflow: 'hidden',
          background: 'rgba(13,43,34,0.08)',
        }}
      >
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2rem', padding: '0 2rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.25em',
                color: 'rgba(136,136,136,0.6)',
                textTransform: 'uppercase',
              }}>
                {item}
              </span>
              <span style={{ color: 'rgba(61,255,154,0.3)', fontSize: '0.5rem' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ABOUT SECTION */}
      <section style={{ padding: '6rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="catalogue-label" style={{ marginBottom: '1rem' }}>
            ABOUT / 001
          </div>
          <h2 style={{
            fontFamily: 'var(--font-condensed)',
            fontWeight: 900,
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            textTransform: 'uppercase',
            color: '#e8e8e8',
            lineHeight: 0.95,
            letterSpacing: '0.03em',
            marginBottom: '2rem',
          }}>
            WE BUILD<br />
            <span style={{
              color: 'transparent',
              WebkitTextStroke: '1px rgba(61,255,154,0.4)',
            }}>
              THE INVISIBLE
            </span>
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: 'rgba(136,136,136,0.8)',
            lineHeight: 1.9,
            maxWidth: '500px',
            letterSpacing: '0.03em',
          }}>
            VOID is a digital studio operating at the intersection of art, technology,
            and sound. We craft experiences that live in the space between signal and silence—
            where code becomes texture and design becomes language.
          </p>
        </motion.div>
      </section>

      {/* DIVIDER */}
      <div className="divider-glow" style={{ maxWidth: '900px', margin: '0 auto' }} />

      {/* FEATURE CARDS */}
      <section style={{ padding: '4rem 2rem 6rem', maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px' }}
        >
          {[
            { num: '01', title: 'PLAYER', sub: 'Import your local audio files and experience them through the VOID engine.', path: '/player' },
            { num: '02', title: 'VISUALIZER', sub: 'Real-time frequency analysis and reactive audio visualization.', path: '/player' },
            { num: '03', title: 'LIBRARY', sub: 'Search, organize, and navigate your tracks with keyboard shortcuts.', path: '/player' },
          ].map((card, cardIdx) => (
            <motion.div
              key={card.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: cardIdx * 0.12 }}
              className="grunge-card"
              onClick={() => navigate(card.path)}
              style={{
                padding: '2rem',
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.3em',
                color: 'rgba(61,255,154,0.4)',
                marginBottom: '1rem',
              }}>
                {card.num} ──
              </div>
              <h3 style={{
                fontFamily: 'var(--font-condensed)',
                fontWeight: 900,
                fontSize: '2rem',
                textTransform: 'uppercase',
                color: '#e8e8e8',
                letterSpacing: '0.05em',
                marginBottom: '0.8rem',
              }}>
                {card.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'rgba(136,136,136,0.7)',
                lineHeight: 1.7,
              }}>
                {card.sub}
              </p>
              <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                color: 'rgba(61,255,154,0.5)',
              }}>
                ENTER <span style={{ fontSize: '0.8rem' }}>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CREDITS SECTION */}
      <section
        style={{
          padding: '5rem 2rem',
          background: 'radial-gradient(ellipse at 70% 50%, rgba(13,43,34,0.25) 0%, #000 60%)',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
        >
          <div className="catalogue-label" style={{ marginBottom: '2.5rem' }}>
            CREDITS / WORLDWIDE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
            {CREDITS.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.6 }}
                style={{ display: 'flex', gap: '0.8rem', alignItems: 'baseline' }}
              >
                <span className="credits-regular" style={{ fontSize: '0.85rem' }}>
                  {c.label}
                </span>
                <span className="credits-bold" style={{ fontSize: '0.95rem' }}>
                  {c.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* EASTER EGG HINT */}
      <div style={{ textAlign: 'center', padding: '1rem 2rem 3rem' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5rem',
          letterSpacing: '0.25em',
          color: 'rgba(61,255,154,0.15)',
        }}>
          ↑↑↓↓←→←→BA — HIDDEN SEQUENCES AWAIT
        </span>
      </div>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(61,255,154,0.06)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          letterSpacing: '0.25em',
          color: 'rgba(136,136,136,0.4)',
        }}>
          VOID STUDIOS © 2025 — ALL RIGHTS RESERVED
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          color: 'rgba(61,255,154,0.3)',
        }}>
          毎週の音楽 ® SR/1.0
        </div>
      </footer>
    </div>
  );
};

export default Home;
