import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastSystem';

// ── NOISE VISUALIZER ───────────────────────────────────────────
const NoiseCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      tRef.current += 0.008;
      const t = tRef.current;
      const cols = Math.floor(width / 6);
      const rows = Math.floor(height / 6);

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const nx = x / cols;
          const ny = y / rows;
          // Simplex-like noise using sin/cos
          const val = (
            Math.sin(nx * 8 + t) *
            Math.cos(ny * 6 - t * 0.7) *
            Math.sin((nx + ny) * 5 + t * 1.3) + 1
          ) / 2;
          const alpha = val * 0.35;
          const green = Math.floor(val * 255);
          ctx.fillStyle = `rgba(${Math.floor(green * 0.2)}, ${green}, ${Math.floor(green * 0.6)}, ${alpha})`;
          ctx.fillRect(x * 6, y * 6, 5, 5);
        }
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
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '200px', display: 'block', opacity: 0.8 }}
    />
  );
};

// ── FREQUENCY VISUALIZER ────────────────────────────────────────
const FreqVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const BARS = 64;

    const draw = () => {
      const { width, height } = canvas;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, width, height);
      tRef.current += 0.04;
      const t = tRef.current;

      const barW = width / BARS;
      for (let i = 0; i < BARS; i++) {
        const norm = i / BARS;
        const h = (
          Math.abs(Math.sin(norm * 12 + t) * Math.cos(norm * 7 - t * 0.6)) *
          height * 0.8
        );
        const alpha = 0.4 + h / height * 0.6;
        const gradient = ctx.createLinearGradient(0, height - h, 0, height);
        gradient.addColorStop(0, `rgba(61,255,154,${alpha})`);
        gradient.addColorStop(1, `rgba(13,43,34,0.1)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barW + 1, height - h, barW - 2, h);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '120px', display: 'block' }}
    />
  );
};

// ── PARTICLE FIELD ──────────────────────────────────────────────
const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const N = 80;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouse, { passive: true });

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          p.vx -= (dx / dist) * 0.3;
          p.vy -= (dy / dist) * 0.3;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(61,255,154,0.6)';
        ctx.fill();
      });

      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(61,255,154,${(1 - d / 80) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      canvas.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '220px', display: 'block', cursor: 'crosshair' }}
    />
  );
};

// ── GLITCH TEXT GENERATOR ────────────────────────────────────────
const GlitchGenerator: React.FC = () => {
  const [input, setInput] = useState('ENTER TEXT');
  const [glitched, setGlitched] = useState('ENTER TEXT');
  const { addToast } = useToast();

  const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,./<>?~`あいうえおアイウエオ01';

  const glitch = useCallback(() => {
    let result = '';
    for (const ch of input.toUpperCase()) {
      if (Math.random() < 0.3 && ch !== ' ') {
        result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      } else {
        result += ch;
      }
    }
    setGlitched(result);
  }, [input]);

  useEffect(() => {
    const id = setInterval(glitch, 150);
    return () => clearInterval(id);
  }, [glitch]);

  const copy = () => {
    navigator.clipboard.writeText(glitched).then(() => {
      addToast('GLITCHED TEXT COPIED TO CLIPBOARD', 'success');
    });
  };

  return (
    <div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        maxLength={30}
        style={{
          background: 'transparent',
          border: '1px solid rgba(61,255,154,0.2)',
          color: '#c8c8c8',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          padding: '0.6rem 1rem',
          width: '100%',
          outline: 'none',
          marginBottom: '1rem',
          textTransform: 'uppercase',
        }}
        placeholder="TYPE SOMETHING..."
      />
      <div style={{
        fontFamily: 'var(--font-condensed)',
        fontWeight: 900,
        fontSize: 'clamp(1.5rem, 5vw, 3rem)',
        color: '#a8f0c8',
        textShadow: '0 0 20px rgba(61,255,154,0.5), 0 0 40px rgba(61,255,154,0.2)',
        letterSpacing: '0.1em',
        minHeight: '3rem',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem',
        wordBreak: 'break-all',
      }}>
        {glitched}
      </div>
      <button className="btn-grunge" onClick={copy} style={{ fontSize: '0.7rem' }}>
        COPY GLITCH
      </button>
    </div>
  );
};

// ── MAIN LAB PAGE ────────────────────────────────────────────────
const Lab: React.FC = () => {
  const { addToast } = useToast();
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);

  const experiments = [
    { id: 'noise', label: 'NOISE FIELD', desc: 'Animated sine-based noise grid' },
    { id: 'freq', label: 'FREQUENCY', desc: 'Audio frequency visualizer simulation' },
    { id: 'particles', label: 'PARTICLE NET', desc: 'Interactive particle field — move your cursor' },
    { id: 'glitch', label: 'GLITCH TYPE', desc: 'Real-time text glitch generator' },
  ];

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '6rem' }}>

      {/* Header */}
      <section style={{ padding: '3rem 2rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <div className="catalogue-label" style={{ marginBottom: '1rem' }}>
            LAB / EXPERIMENTS 03
          </div>
          <h1 style={{
            fontFamily: 'var(--font-condensed)',
            fontWeight: 900,
            fontSize: 'clamp(3rem, 9vw, 7rem)',
            textTransform: 'uppercase',
            color: '#e8e8e8',
            lineHeight: 0.9,
            letterSpacing: '0.03em',
            marginBottom: '1.5rem',
          }}>
            THE<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(61,255,154,0.5)' }}>
              LAB
            </span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            color: 'rgba(136,136,136,0.7)',
            maxWidth: '400px',
            lineHeight: 1.8,
          }}>
            Interactive experiments and creative code. Each tool is a window into
            our process — raw, live, and open to interpretation.
          </p>
        </motion.div>
      </section>

      <div className="divider-glow" style={{ maxWidth: '1000px', margin: '0 auto' }} />

      {/* Experiment selector */}
      <section style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {experiments.map(exp => (
            <button
              key={exp.id}
              onClick={() => {
                setActiveExperiment(exp.id);
                addToast(`EXPERIMENT: ${exp.label}`, 'info', 2000);
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: activeExperiment === exp.id ? 'rgba(61,255,154,0.1)' : 'transparent',
                border: `1px solid ${activeExperiment === exp.id ? 'rgba(61,255,154,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color: activeExperiment === exp.id ? '#3dff9a' : 'rgba(136,136,136,0.6)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {exp.label}
            </button>
          ))}
        </div>

        {/* Canvas area */}
        <div style={{
          border: '1px solid rgba(61,255,154,0.08)',
          background: 'rgba(0,0,0,0.5)',
          minHeight: '240px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!activeExperiment && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                color: 'rgba(136,136,136,0.3)',
              }}>
                SELECT AN EXPERIMENT ABOVE
              </span>
              <span style={{ color: 'rgba(61,255,154,0.2)', fontSize: '1.5rem' }}>◇</span>
            </div>
          )}
          {activeExperiment === 'noise' && <NoiseCanvas />}
          {activeExperiment === 'freq' && <FreqVisualizer />}
          {activeExperiment === 'particles' && <ParticleField />}
          {activeExperiment === 'glitch' && (
            <div style={{ padding: '2rem' }}>
              <GlitchGenerator />
            </div>
          )}
        </div>

        {activeExperiment && (
          <div style={{
            marginTop: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            color: 'rgba(136,136,136,0.4)',
          }}>
            EXP/{activeExperiment.toUpperCase()} — {experiments.find(e => e.id === activeExperiment)?.desc}
          </div>
        )}
      </section>

      {/* Info cards */}
      <section style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px' }}>
          {[
            { num: '04', label: 'ACTIVE EXPERIMENTS' },
            { num: '60+', label: 'FPS TARGET' },
            { num: '∞', label: 'ITERATIONS' },
            { num: '01', label: 'VOID STUDIO' },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grunge-card"
              style={{ padding: '1.5rem 2rem' }}
            >
              <div style={{
                fontFamily: 'var(--font-condensed)',
                fontWeight: 900,
                fontSize: '3rem',
                color: '#3dff9a',
                textShadow: '0 0 20px rgba(61,255,154,0.4)',
                lineHeight: 1,
                marginBottom: '0.5rem',
              }}>
                {stat.num}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                color: 'rgba(136,136,136,0.5)',
              }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Easter egg hint */}
      <section style={{ padding: '3rem 2rem 5rem', textAlign: 'center' }}>
        <button
          onClick={() => {
            addToast('YOU FOUND A SECRET — TRY THE KONAMI CODE ON THE HOME PAGE ↑↑↓↓←→←→BA', 'warn', 6000);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.25em',
            color: 'rgba(61,255,154,0.08)',
            transition: 'color 0.3s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(61,255,154,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,255,154,0.08)')}
        >
          ◆ HIDDEN SIGNALS AWAIT ◆
        </button>
      </section>
    </div>
  );
};

export default Lab;
