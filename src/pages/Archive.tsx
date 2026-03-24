import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ToastSystem';

const WORKS = [
  { id: '001', title: 'SIGNAL NOIR', category: 'VISUAL', year: '2025', desc: 'A study in contrast and frequency. Visual noise as art form — grain as language.', tags: ['FILM', 'TEXTURE', 'DARK'] },
  { id: '002', title: 'PHANTOM GRID', category: 'MOTION', year: '2024', desc: 'Generative grid systems that breathe, shift, and dissolve into structured chaos.', tags: ['GENERATIVE', 'CODE', 'GRID'] },
  { id: '003', title: 'NOCTURNE.EXE', category: 'INTERACTIVE', year: '2025', desc: 'An interactive soundscape where cursor movement sculpts the audio landscape in realtime.', tags: ['SOUND', 'INTERACTIVE', 'DARK'] },
  { id: '004', title: 'VOID RADIO EP.1', category: 'SOUND', year: '2024', desc: 'A curated selection of tracks from the underground — rare frequencies for rare minds.', tags: ['MUSIC', 'CURATION', 'RADIO'] },
  { id: '005', title: 'TYPEFACE NOIR', category: 'TYPOGRAPHY', year: '2023', desc: 'Experimental letterforms exploring the boundary between legibility and abstraction.', tags: ['TYPE', 'EXPERIMENTAL', 'DARK'] },
  { id: '006', title: 'KINETIC MATTER', category: 'MOTION', year: '2025', desc: 'Physics-driven particle systems that respond to music, atmosphere, and entropy.', tags: ['PARTICLES', 'PHYSICS', 'MOTION'] },
  { id: '007', title: 'DARK ARCHIVE', category: 'VISUAL', year: '2023', desc: 'Archival photography reprocessed through algorithmic distortion and chemical simulation.', tags: ['PHOTO', 'ARCHIVE', 'ALGORITHM'] },
  { id: '008', title: 'FREQUENCY MAP', category: 'DATA', year: '2024', desc: 'Visual mapping of audio frequencies across 10,000 tracks — a sonic atlas of the underground.', tags: ['DATA', 'VISUALIZATION', 'SOUND'] },
  { id: '009', title: 'NULL OBJECT', category: 'INTERACTIVE', year: '2025', desc: 'A digital sculpture you can sculpt with touch — reactive, alive, and impossible to pin down.', tags: ['3D', 'TOUCH', 'SCULPTURE'] },
];

const CATEGORIES = ['ALL', 'VISUAL', 'MOTION', 'INTERACTIVE', 'SOUND', 'TYPOGRAPHY', 'DATA'];

const Archive: React.FC = () => {
  const { addToast } = useToast();
  const [selected, setSelected] = useState('ALL');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = selected === 'ALL' ? WORKS : WORKS.filter(w => w.category === selected);

  const handleWorkClick = (work: typeof WORKS[0]) => {
    if (expandedId === work.id) {
      setExpandedId(null);
    } else {
      setExpandedId(work.id);
      addToast(`LOADING ${work.title}...`, 'info', 1500);
    }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingTop: '6rem' }}>

      {/* Header */}
      <section style={{ padding: '3rem 2rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <div className="catalogue-label" style={{ marginBottom: '1rem' }}>
            ARCHIVE / CATALOGUE SR/1.0
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-condensed)',
              fontWeight: 900,
              fontSize: 'clamp(3rem, 9vw, 7rem)',
              textTransform: 'uppercase',
              color: '#e8e8e8',
              lineHeight: 0.9,
              letterSpacing: '0.03em',
              marginBottom: '1rem',
            }}
          >
            THE<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(61,255,154,0.5)' }}>
              ARCHIVE
            </span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            color: 'rgba(136,136,136,0.7)',
            maxWidth: '400px',
            lineHeight: 1.8,
            letterSpacing: '0.03em',
          }}>
            A curated catalogue of digital works, experiments, and artifacts from the VOID collective.
            Each entry is a signal from the dark.
          </p>
        </motion.div>
      </section>

      {/* Filter pills */}
      <section style={{ padding: '0 2rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: selected === cat ? 'rgba(61,255,154,0.12)' : 'transparent',
                border: `1px solid ${selected === cat ? 'rgba(61,255,154,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color: selected === cat ? '#3dff9a' : 'rgba(136,136,136,0.6)',
                padding: '0.4rem 0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
            color: 'rgba(61,255,154,0.3)',
            display: 'flex',
            alignItems: 'center',
            marginLeft: 'auto',
          }}>
            {filtered.length} ENTRIES
          </div>
        </div>
      </section>

      <div className="divider-glow" style={{ maxWidth: '1100px', margin: '0 auto' }} />

      {/* Works list */}
      <section style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filtered.map((work, i) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                onMouseEnter={() => setHoveredId(work.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleWorkClick(work)}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  background: hoveredId === work.id ? 'rgba(61,255,154,0.02)' : 'transparent',
                  padding: '1.5rem 0',
                }}
              >
                {/* Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Number */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(61,255,154,0.3)',
                    paddingTop: '0.3rem',
                    minWidth: '2.5rem',
                  }}>
                    {work.id}
                  </span>

                  {/* Title */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3
                      className="catalogue-text"
                      style={{
                        fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                        letterSpacing: '0.05em',
                        color: hoveredId === work.id ? '#e8e8e8' : '#b8b8b8',
                        transition: 'color 0.2s',
                        textShadow: hoveredId === work.id ? '0 0 20px rgba(61,255,154,0.1)' : 'none',
                      }}
                    >
                      {work.title}
                    </h3>
                  </div>

                  {/* Category */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(136,136,136,0.5)',
                    paddingTop: '0.4rem',
                    minWidth: '100px',
                  }}>
                    {work.category}
                  </span>

                  {/* Year */}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.2em',
                    color: 'rgba(61,255,154,0.4)',
                    paddingTop: '0.4rem',
                  }}>
                    {work.year}
                  </span>

                  {/* Arrow */}
                  <span style={{
                    color: hoveredId === work.id ? '#3dff9a' : 'rgba(136,136,136,0.3)',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    transform: expandedId === work.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}>
                    →
                  </span>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedId === work.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        paddingLeft: '4rem',
                        paddingTop: '1rem',
                        paddingBottom: '0.5rem',
                        display: 'flex',
                        gap: '2rem',
                        flexWrap: 'wrap',
                      }}>
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.82rem',
                          color: 'rgba(136,136,136,0.7)',
                          lineHeight: 1.8,
                          maxWidth: '420px',
                          letterSpacing: '0.02em',
                        }}>
                          {work.desc}
                        </p>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignContent: 'flex-start' }}>
                          {work.tags.map(tag => (
                            <span key={tag} style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.5rem',
                              letterSpacing: '0.2em',
                              border: '1px solid rgba(61,255,154,0.15)',
                              color: 'rgba(61,255,154,0.4)',
                              padding: '0.2rem 0.5rem',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Footer area */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          letterSpacing: '0.3em',
          color: 'rgba(136,136,136,0.3)',
        }}>
          END OF CATALOGUE — MORE WORKS INCOMING / 毎週
        </div>
      </section>
    </div>
  );
};

export default Archive;
