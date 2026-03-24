import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ToastSystem';

const CELL = 16;
const COLS = 28;
const ROWS = 22;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = { x: number; y: number };
type Pt = { x: number; y: number };

const DIRS: Record<string, Dir> = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
  w: { x: 0,  y: -1 },
  s: { x: 0,  y:  1 },
  a: { x: -1, y:  0 },
  d: { x: 1,  y:  0 },
};

const rand = (max: number) => Math.floor(Math.random() * max);

const newFood = (snake: Pt[]): Pt => {
  let pt: Pt;
  do {
    pt = { x: rand(COLS), y: rand(ROWS) };
  } while (snake.some(s => s.x === pt.x && s.y === pt.y));
  return pt;
};

const newPowerup = (snake: Pt[], food: Pt): Pt => {
  let pt: Pt;
  do {
    pt = { x: rand(COLS), y: rand(ROWS) };
  } while (
    snake.some(s => s.x === pt.x && s.y === pt.y) ||
    (pt.x === food.x && pt.y === food.y)
  );
  return pt;
};

const INITIAL_SNAKE: Pt[] = [
  { x: 14, y: 11 },
  { x: 13, y: 11 },
  { x: 12, y: 11 },
];

type Phase = 'idle' | 'playing' | 'paused' | 'dead';

const SPEED_LEVELS = [
  { label: 'GHOST',  ms: 180 },
  { label: 'SIGNAL', ms: 120 },
  { label: 'VOID',   ms: 75  },
];

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [...INITIAL_SNAKE.map(p => ({ ...p }))],
    dir: { x: 1, y: 0 } as Dir,
    nextDir: { x: 1, y: 0 } as Dir,
    food: { x: 20, y: 11 } as Pt,
    powerup: null as Pt | null,
    score: 0,
    highScore: parseInt(localStorage.getItem('voidSnakeHS') || '0'),
    phase: 'idle' as Phase,
    speedLevel: 1,
    powerupTimer: 0,
    flash: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('voidSnakeHS') || '0'));
  const [phase, setPhase] = useState<Phase>('idle');
  const [speedLevel, setSpeedLevel] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const { addToast } = useToast();

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const st = stateRef.current;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    for (let x = 0; x <= COLS; x++) {
      ctx.strokeStyle = 'rgba(61,255,154,0.03)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }

    // Particles
    st.particles.forEach(p => {
      const alpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.fill();
    });

    // Food
    const fx = st.food.x * CELL + CELL / 2;
    const fy = st.food.y * CELL + CELL / 2;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.beginPath();
    ctx.arc(fx, fy, CELL * 0.35 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#3dff9a';
    ctx.shadowColor = '#3dff9a';
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Powerup
    if (st.powerup) {
      const px = st.powerup.x * CELL + CELL / 2;
      const py = st.powerup.y * CELL + CELL / 2;
      const ppulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008 + 1);
      ctx.beginPath();
      const size = CELL * 0.38 + ppulse * 2;
      ctx.rect(px - size, py - size, size * 2, size * 2);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 12 + ppulse * 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Timer ring
      const frac = st.powerupTimer / 7000;
      ctx.beginPath();
      ctx.arc(px, py, CELL * 0.6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,204,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Snake
    const len = st.snake.length;
    st.snake.forEach((seg, i) => {
      const sx = seg.x * CELL + 1;
      const sy = seg.y * CELL + 1;
      const sz = CELL - 2;
      if (i === 0) {
        // Head
        ctx.fillStyle = st.flash > 0 ? '#ff4444' : '#e8ffe8';
        ctx.shadowColor = st.flash > 0 ? '#ff4444' : '#3dff9a';
        ctx.shadowBlur = 12;
        ctx.fillRect(sx, sy, sz, sz);
        ctx.shadowBlur = 0;
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(sx + sz * 0.25, sy + sz * 0.25, 2, 2);
        ctx.fillRect(sx + sz * 0.65, sy + sz * 0.25, 2, 2);
      } else {
        const bright = 1 - (i / len) * 0.7;
        ctx.fillStyle = `rgba(${Math.floor(61 * bright)}, ${Math.floor(255 * bright)}, ${Math.floor(154 * bright)}, 0.9)`;
        ctx.fillRect(sx + 1, sy + 1, sz - 2, sz - 2);
      }
    });

    // Flash overlay
    if (st.flash > 0) {
      ctx.fillStyle = `rgba(255, 68, 68, ${st.flash * 0.15})`;
      ctx.fillRect(0, 0, W, H);
      st.flash -= 0.05;
      if (st.flash < 0) st.flash = 0;
    }
  }, []);

  // Game loop
  const loop = useCallback((ts: number) => {
    const st = stateRef.current;
    if (st.phase !== 'playing') {
      draw();
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const dt = ts - lastTimeRef.current;
    lastTimeRef.current = ts;
    accRef.current += dt;

    const speed = SPEED_LEVELS[st.speedLevel].ms;

    // Update powerup timer
    if (st.powerup) {
      st.powerupTimer = Math.max(0, st.powerupTimer - dt);
      if (st.powerupTimer <= 0) {
        st.powerup = null;
      }
    }

    // Spawn powerup occasionally
    if (!st.powerup && Math.random() < 0.002) {
      st.powerup = newPowerup(st.snake, st.food);
      st.powerupTimer = 7000;
    }

    // Update particles
    st.particles = st.particles
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.025 }))
      .filter(p => p.life > 0);

    if (accRef.current >= speed) {
      accRef.current -= speed;

      // Move
      st.dir = { ...st.nextDir };
      const head = { x: st.snake[0].x + st.dir.x, y: st.snake[0].y + st.dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver();
        return;
      }

      // Self collision
      if (st.snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
      }

      st.snake.unshift(head);

      // Eat food
      if (head.x === st.food.x && head.y === st.food.y) {
        st.score += 10 * (st.speedLevel + 1);
        setScore(st.score);
        st.food = newFood(st.snake);

        // Spawn particles
        for (let i = 0; i < 12; i++) {
          st.particles.push({
            x: head.x * CELL + CELL / 2,
            y: head.y * CELL + CELL / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color: 'rgb(61,255,154)',
          });
        }

        if (st.score > st.highScore) {
          st.highScore = st.score;
          setHighScore(st.score);
          localStorage.setItem('voidSnakeHS', String(st.score));
        }

        // Speed up every 50 points
        if (st.score % 50 === 0 && st.speedLevel < 2) {
          st.speedLevel = Math.min(2, st.speedLevel + 1);
          setSpeedLevel(st.speedLevel);
          addToast(`SPEED UP: ${SPEED_LEVELS[st.speedLevel].label}`, 'warn', 2000);
        }
      } else if (st.powerup && head.x === st.powerup.x && head.y === st.powerup.y) {
        // Eat powerup
        st.score += 30 * (st.speedLevel + 1);
        setScore(st.score);
        st.powerup = null;
        addToast('VOID POWERUP +' + (30 * (st.speedLevel + 1)), 'success', 1500);
        for (let i = 0; i < 20; i++) {
          st.particles.push({
            x: head.x * CELL + CELL / 2,
            y: head.y * CELL + CELL / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            color: 'rgb(255,204,0)',
          });
        }
      } else {
        st.snake.pop();
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, addToast]);

  const gameOver = useCallback(() => {
    const st = stateRef.current;
    st.phase = 'dead';
    st.flash = 1;
    setPhase('dead');
    addToast('GAME OVER — SIGNAL LOST', 'error', 3000);
    cancelAnimationFrame(rafRef.current);
    draw();
  }, [draw, addToast]);

  const startGame = useCallback(() => {
    const st = stateRef.current;
    st.snake = [...INITIAL_SNAKE.map(p => ({ ...p }))];
    st.dir = { x: 1, y: 0 };
    st.nextDir = { x: 1, y: 0 };
    st.food = newFood(st.snake);
    st.powerup = null;
    st.score = 0;
    st.phase = 'playing';
    st.speedLevel = speedLevel;
    st.particles = [];
    st.flash = 0;
    setScore(0);
    setPhase('playing');
    lastTimeRef.current = performance.now();
    accRef.current = 0;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, speedLevel]);

  const togglePause = useCallback(() => {
    const st = stateRef.current;
    if (st.phase === 'playing') {
      st.phase = 'paused';
      setPhase('paused');
    } else if (st.phase === 'paused') {
      st.phase = 'playing';
      setPhase('playing');
      lastTimeRef.current = performance.now();
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (st.phase === 'playing' || st.phase === 'paused') {
          e.preventDefault();
          togglePause();
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (st.phase === 'idle' || st.phase === 'dead') startGame();
        else if (st.phase === 'playing' || st.phase === 'paused') togglePause();
      }
      const d = DIRS[e.key];
      if (!d || st.phase !== 'playing') return;
      e.preventDefault();
      const { dir } = st;
      if (d.x !== 0 && d.x === -dir.x) return;
      if (d.y !== 0 && d.y === -dir.y) return;
      st.nextDir = d;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [startGame, togglePause]);

  // Touch/swipe controls
  useEffect(() => {
    let startX = 0, startY = 0;
    const handleStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const st = stateRef.current;
      if (st.phase !== 'playing') return;
      if (Math.abs(dx) > Math.abs(dy)) {
        const d = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft;
        if (d.x !== -st.dir.x) st.nextDir = d;
      } else {
        const d = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp;
        if (d.y !== -st.dir.y) st.nextDir = d;
      }
    };
    window.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchend', handleEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Initial draw + RAF
  useEffect(() => {
    const loop2 = (_ts: number) => {
      const st = stateRef.current;
      if (st.phase === 'idle' || st.phase === 'paused' || st.phase === 'dead') {
        draw();
      }
      if (st.phase !== 'playing') {
        rafRef.current = requestAnimationFrame(loop2);
      }
    };
    rafRef.current = requestAnimationFrame(loop2);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // DPR canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
  }, []);

  // D-pad handler
  const handleDpad = (key: string) => {
    const d = DIRS[key];
    const st = stateRef.current;
    if (!d || st.phase !== 'playing') return;
    if (d.x !== 0 && d.x === -st.dir.x) return;
    if (d.y !== 0 && d.y === -st.dir.y) return;
    st.nextDir = d;
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '5rem' }}>

      {/* Header */}
      <section style={{ padding: '2rem 2rem 1rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="catalogue-label" style={{ marginBottom: '0.8rem' }}>
            VOID.GAME / SR-04
          </div>
          <h1 className="grunge-text" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '0.08em' }}>
            SERPENT
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: 'rgba(136,136,136,0.5)',
            marginTop: '0.5rem',
          }}>
            NAVIGATE THE VOID — CONSUME THE SIGNAL
          </p>
        </motion.div>
      </section>

      {/* Score bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '3rem',
        padding: '0.5rem 2rem 1rem',
      }}>
        {[
          { label: 'SCORE', value: score },
          { label: 'BEST', value: highScore },
          { label: 'SPEED', value: SPEED_LEVELS[speedLevel].label },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.5rem',
              letterSpacing: '0.25em',
              color: 'rgba(136,136,136,0.4)',
              marginBottom: '0.2rem',
            }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-condensed)',
              fontWeight: 900,
              fontSize: '1.4rem',
              color: '#3dff9a',
              textShadow: '0 0 10px rgba(61,255,154,0.5)',
              letterSpacing: '0.05em',
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Game canvas area */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 1rem' }}>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="game-canvas"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              boxShadow: phase === 'playing'
                ? '0 0 30px rgba(61,255,154,0.15)'
                : '0 0 10px rgba(61,255,154,0.05)',
            }}
          />

          {/* Overlays */}
          <AnimatePresence>
            {(phase === 'idle' || phase === 'dead') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.82)',
                  backdropFilter: 'blur(2px)',
                  gap: '1.5rem',
                }}
              >
                {phase === 'dead' && (
                  <div style={{
                    fontFamily: 'var(--font-condensed)',
                    fontWeight: 900,
                    fontSize: '2.5rem',
                    color: '#ff4444',
                    letterSpacing: '0.08em',
                    textShadow: '0 0 20px rgba(255,68,68,0.6)',
                    textTransform: 'uppercase',
                  }}>
                    SIGNAL LOST
                  </div>
                )}

                {phase === 'idle' && (
                  <div
                    className="grunge-text"
                    style={{ fontSize: '2rem', letterSpacing: '0.1em' }}
                  >
                    VOID.GAME
                  </div>
                )}

                {/* Speed selector (only on idle) */}
                {phase === 'idle' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {SPEED_LEVELS.map((sp, i) => (
                      <button
                        key={sp.label}
                        onClick={() => setSpeedLevel(i)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.55rem',
                          letterSpacing: '0.15em',
                          background: speedLevel === i ? 'rgba(61,255,154,0.12)' : 'transparent',
                          border: `1px solid ${speedLevel === i ? 'rgba(61,255,154,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          color: speedLevel === i ? '#3dff9a' : 'rgba(136,136,136,0.5)',
                          padding: '0.3rem 0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                )}

                {phase === 'dead' && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      letterSpacing: '0.2em',
                      color: 'rgba(136,136,136,0.6)',
                      marginBottom: '0.5rem',
                    }}>
                      FINAL SCORE
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-condensed)',
                      fontWeight: 900,
                      fontSize: '3rem',
                      color: '#e8e8e8',
                      letterSpacing: '0.05em',
                    }}>
                      {score}
                    </div>
                    {score >= highScore && score > 0 && (
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.2em',
                        color: '#ffcc00',
                        marginTop: '0.3rem',
                      }}>
                        ◆ NEW BEST SCORE ◆
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn-grunge"
                  onClick={startGame}
                  style={{ fontSize: '0.75rem', letterSpacing: '0.3em' }}
                >
                  {phase === 'dead' ? 'RETRY SIGNAL' : 'ENTER THE VOID'}
                </button>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.15em',
                  color: 'rgba(136,136,136,0.3)',
                  textAlign: 'center',
                  lineHeight: 2,
                }}>
                  ARROWS / WASD — MOVE<br />
                  SPACE / P — PAUSE<br />
                  SWIPE — MOBILE
                </div>
              </motion.div>
            )}

            {phase === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)',
                  gap: '1rem',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-condensed)',
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  color: '#888',
                  letterSpacing: '0.15em',
                }}>
                  PAUSED
                </div>
                <button className="btn-grunge" onClick={togglePause}>
                  RESUME
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* D-pad controls (mobile) */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', width: '120px' }}>
          <div />
          <button
            onClick={() => handleDpad('ArrowUp')}
            style={{ ...dpadStyle }}
          >▲</button>
          <div />
          <button
            onClick={() => handleDpad('ArrowLeft')}
            style={{ ...dpadStyle }}
          >◀</button>
          <button
            onClick={togglePause}
            style={{ ...dpadStyle, background: 'rgba(61,255,154,0.05)', fontSize: '0.5rem', letterSpacing: '0.05em' }}
          >II</button>
          <button
            onClick={() => handleDpad('ArrowRight')}
            style={{ ...dpadStyle }}
          >▶</button>
          <div />
          <button
            onClick={() => handleDpad('ArrowDown')}
            style={{ ...dpadStyle }}
          >▼</button>
          <div />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '0 2rem 1rem', flexWrap: 'wrap' }}>
        {[
          { color: '#3dff9a', label: 'SIGNAL (+10)' },
          { color: '#ffcc00', label: 'VOID PULSE (+30)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: item.color, boxShadow: `0 0 6px ${item.color}`, borderRadius: item.color === '#ffcc00' ? '0' : '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(136,136,136,0.5)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Controls help */}
      <div style={{ textAlign: 'center', padding: '0 2rem 4rem' }}>
        <button
          onClick={() => setShowControls(v => !v)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.04)',
            color: 'rgba(136,136,136,0.3)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5rem',
            letterSpacing: '0.2em',
            padding: '0.3rem 0.8rem',
            transition: 'all 0.2s',
          }}
        >
          {showControls ? 'HIDE CONTROLS' : 'SHOW CONTROLS'}
        </button>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginTop: '1rem' }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.15em',
                color: 'rgba(136,136,136,0.4)',
                lineHeight: 2.5,
              }}>
                ↑ W — MOVE UP &nbsp;&nbsp;|&nbsp;&nbsp; ↓ S — MOVE DOWN<br />
                ← A — MOVE LEFT &nbsp;&nbsp;|&nbsp;&nbsp; → D — MOVE RIGHT<br />
                SPACE / P — PAUSE &nbsp;&nbsp;|&nbsp;&nbsp; ESC — PAUSE<br />
                SWIPE — TOUCH CONTROL
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const dpadStyle: React.CSSProperties = {
  background: 'rgba(61,255,154,0.04)',
  border: '1px solid rgba(61,255,154,0.12)',
  color: 'rgba(61,255,154,0.5)',
  cursor: 'pointer',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.7rem',
  fontFamily: 'var(--font-mono)',
  transition: 'all 0.1s',
  userSelect: 'none',
};

export default Game;
