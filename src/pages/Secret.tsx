import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MESSAGES = [
  'YOU FOUND THE VOID WITHIN THE VOID.',
  '毎週の音楽 — EVERY WEEK, THE MUSIC.',
  'THE SIGNAL IS ALWAYS THERE. YOU JUST HAVE TO LISTEN.',
  'CATALOGUE SR/1.0 — ENTRY GRANTED.',
  'NOT ALL WHO WANDER THE VOID ARE LOST.',
  'YOU ARE THE SIGNAL.',
  'NOISE IS JUST UNHEARD MUSIC.',
];

const Secret: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const columns: number[] = [];
    const colCount = Math.floor(window.innerWidth / 16);
    for (let i = 0; i < colCount; i++) {
      columns[i] = Math.random() * -50;
    }

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = '14px monospace';
      for (let i = 0; i < columns.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 16;
        const y = columns[i] * 16;

        const brightness = Math.random();
        if (brightness > 0.95) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = `rgba(61, ${Math.floor(180 + brightness * 75)}, ${Math.floor(100 + brightness * 54)}, ${0.4 + brightness * 0.6})`;
        }

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        }
        columns[i] += 0.5;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, opacity: 0.4, pointerEvents: 'none' }}
      />

      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.4em',
            color: 'rgba(61,255,154,0.5)',
            marginBottom: '2rem',
            animation: 'blink 1s step-end infinite',
          }}>
            ↑↑↓↓←→←→BA — CODE CONFIRMED
          </div>

          <h1
            className="grunge-text"
            style={{
              fontSize: 'clamp(3rem, 12vw, 8rem)',
              letterSpacing: '0.1em',
              marginBottom: '2rem',
            }}
          >
            YOU FOUND<br />
            THE SIGNAL
          </h1>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '500px',
            margin: '0 auto 3rem',
          }}>
            {MESSAGES.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontWeight: i % 2 === 0 ? 700 : 400,
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  color: i % 2 === 0 ? '#a8f0c8' : 'rgba(136,136,136,0.6)',
                  textAlign: 'left',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(61,255,154,0.06)',
                }}
              >
                <span style={{ color: 'rgba(61,255,154,0.3)', marginRight: '0.8rem' }}>›</span>
                {msg}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: 'rgba(61,255,154,0.3)',
              marginBottom: '2rem',
              padding: '1rem 2rem',
              border: '1px solid rgba(61,255,154,0.1)',
            }}
          >
            VOID CATALOGUE SR/1.0 — SECRET ENTRY #001<br />
            毎週の音楽 ® WORLDWIDE 2025
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            className="btn-grunge"
            onClick={() => navigate('/')}
          >
            RETURN TO VOID
          </motion.button>
        </motion.div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Secret;
