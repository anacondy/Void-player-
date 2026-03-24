import React, { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const LINES = [
  'INITIALIZING SYSTEM...',
  'LOADING VOID CATALOGUE SR/1.0',
  'ESTABLISHING SECURE CHANNEL...',
  'CALIBRATING VISUAL MATRIX...',
  'COMPILING EXPERIENCES...',
  'SYSTEM READY.',
];

const LoadingScreen: React.FC<Props> = ({ onDone }) => {
  const [lineIdx, setLineIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIdx(i => {
        if (i >= LINES.length - 1) {
          clearInterval(lineTimer);
          return i;
        }
        return i + 1;
      });
    }, 220);

    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progInterval);
          return 100;
        }
        return p + 2;
      });
    }, 28);

    const doneTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onDone, 700);
    }, 1800);

    return () => {
      clearInterval(lineTimer);
      clearInterval(progInterval);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.7s ease',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-condensed)',
            fontWeight: 900,
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            letterSpacing: '0.15em',
            color: '#e8e8e8',
            lineHeight: 1,
            textShadow: `
              0 0 20px rgba(61,255,154,0.6),
              0 0 60px rgba(61,255,154,0.3),
              0 0 120px rgba(61,255,154,0.1)
            `,
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        >
          VOID
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.4em',
            color: 'rgba(61,255,154,0.5)',
            marginTop: '0.5rem',
          }}
        >
          CATALOGUE SR/1.0 ®
        </div>
      </div>

      {/* Terminal lines */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          color: 'rgba(136,136,136,0.7)',
          marginBottom: '2rem',
          textAlign: 'center',
          minHeight: '1.2rem',
        }}
      >
        <span style={{ color: 'rgba(61,255,154,0.5)', marginRight: '0.5rem' }}>›</span>
        {LINES[lineIdx]}
        <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '200px',
          height: '1px',
          background: 'rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(61,255,154,0.3), #3dff9a)',
            boxShadow: '0 0 8px rgba(61,255,154,0.8)',
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          letterSpacing: '0.2em',
          color: 'rgba(61,255,154,0.4)',
          marginTop: '0.75rem',
        }}
      >
        {progress.toString().padStart(3, '0')}%
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(61,255,154,0.6), 0 0 60px rgba(61,255,154,0.3), 0 0 120px rgba(61,255,154,0.1); }
          50% { text-shadow: 0 0 30px rgba(61,255,154,0.9), 0 0 80px rgba(61,255,154,0.5), 0 0 160px rgba(61,255,154,0.2); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
