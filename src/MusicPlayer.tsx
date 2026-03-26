import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioEngine } from './AudioEngine';

/* ─── SVG Icons ─────────────────────────────────────────────── */
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const SkipPrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);
const SkipNextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 7h18M3 17h18" />
    <rect x="5" y="9" width="4" height="6" rx="1" />
    <rect x="10" y="9" width="4" height="6" rx="1" />
    <rect x="15" y="9" width="4" height="6" rx="1" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
  </svg>
);
const VolumeIcon = ({ level }: { level: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {level > 0.01 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
    {level > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
  </svg>
);
const LoopIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={active ? '#00ff9d' : 'currentColor'} strokeWidth="2" className="w-5 h-5">
    <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

/* ─── Helpers ──────────────────────────────────────────────── */
const formatTime = (t: number) => {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ─── Highlighted text component ───────────────────────────── */
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{ color: '#00ff9d', textShadow: '0 0 12px rgba(0,255,157,0.4)' }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MUSIC PLAYER UI COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export const MusicPlayer: React.FC = () => {
  const engine = useAudioEngine();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [volumeFlash, setVolumeFlash] = useState<number | null>(null);
  const volumeFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBackdropRef = useRef<HTMLDivElement>(null);

  const {
    tracks, currentIdx, isPlaying, currentTime, duration, volume, loop,
    visualData, avgLevel, progress, track,
    togglePlay, nextTrack, prevTrack, selectTrack,
    setVolume, toggleLoop,
    fileRef, scanRef, timelineRef,
    isDragging, setIsDragging, seekFromEvent, initAudioCtx,
  } = engine;

  /* ── Volume flash effect ─────────────────────────────────── */
  const flashVolume = useCallback((v: number) => {
    setVolumeFlash(Math.round(v * 100));
    if (volumeFlashTimer.current) clearTimeout(volumeFlashTimer.current);
    volumeFlashTimer.current = setTimeout(() => setVolumeFlash(null), 900);
  }, []);

  /* ── Keyboard shortcuts ──────────────────────────────────── */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      // Ctrl+K = search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(p => !p);
        return;
      }
      // Ctrl+I = import
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        fileRef.current?.click();
        return;
      }
      // ESC closes search
      if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        setSearchOpen(false);
        setSearchQ('');
        return;
      }
      // Don't intercept when search is open (except ESC above)
      if (searchOpen) return;
      // Space = play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      // Left/Right = prev/next track
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTrack();
      }
      // Up/Down = volume
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nv = Math.min(1, volume + 0.05);
        setVolume(nv);
        flashVolume(nv);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nv = Math.max(0, volume - 0.05);
        setVolume(nv);
        flashVolume(nv);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [searchOpen, tracks, currentIdx, isPlaying, volume, togglePlay, nextTrack, prevTrack, setVolume, flashVolume, fileRef]);

  /* ── Focus search input when opened ──────────────────────── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  /* ── Import feedback via toast ───────────────────────────── */
  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const handler = () => {
      // Toast is handled after addTracks is called
    };
    input.addEventListener('change', handler);
    return () => input.removeEventListener('change', handler);
  }, [fileRef]);

  /* ── Timeline handlers ───────────────────────────────────── */
  const onTimelineDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    seekFromEvent(clientX);
  };

  /* ── Search results ──────────────────────────────────────── */
  const filtered = tracks.filter(t => t.name.toLowerCase().includes(searchQ.toLowerCase()));

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden select-none">

      {/* ── Reactive background glow ──────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, rgba(0,255,157,${0.03 + avgLevel * 0.12}) 0%, transparent 70%)`,
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          VOLUME FLASH OVERLAY
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {volumeFlash !== null && (
          <motion.div
            key={volumeFlash}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="text-center"
            >
              <div
                className="font-black tabular-nums"
                style={{
                  fontFamily: 'var(--font-condensed)',
                  fontSize: 'clamp(5rem, 20vw, 12rem)',
                  color: '#e8e8e8',
                  textShadow: '0 0 60px rgba(0,255,157,0.3), 0 0 120px rgba(0,255,157,0.1)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {volumeFlash}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.4em',
                  color: '#00ff9d',
                  marginTop: '8px',
                }}
              >
                VOLUME
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          MAIN CENTERED CONTAINER
          ═══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center"
        style={{ paddingTop: '100px', paddingBottom: '40px' }}
      >

        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between mb-8">
          <p
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: '#444' }}
          >
            VOID PLAYER SR/1.0
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="px-3 py-2 border border-[#222] hover:border-[#00ff9d]/40 text-[#555] hover:text-[#00ff9d] transition-all flex items-center gap-2"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em' }}
            >
              <SearchIcon /> <span className="hidden sm:inline">CTRL+K</span>
            </button>
            <button
              onClick={() => scanRef.current?.click()}
              className="px-3 py-2 border border-[#222] hover:border-[#00ff9d]/40 text-[#777] hover:text-[#00ff9d] transition-all flex items-center gap-2"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em' }}
            >
              <ScanIcon /> SCAN DEVICE
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 bg-[#00ff9d] text-black font-bold transition-all hover:bg-white flex items-center gap-2"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em' }}
            >
              <UploadIcon /> IMPORT
            </button>
          </div>
        </div>

        {/* ── Visualizer area ─────────────────────────────── */}
        <div className="w-full aspect-[16/9] sm:aspect-[20/9] bg-[#030303] border border-[#141414] rounded-sm relative overflow-hidden mb-1">
          <div className="absolute inset-0 flex items-end justify-center gap-[2px] sm:gap-[3px] px-4 sm:px-8 pb-4">
            {visualData.map((val, i) => {
              const h = Math.max(2, (val / 255) * 100);
              const intensity = val / 255;
              return (
                <div
                  key={i}
                  className="flex-1 max-w-[14px] rounded-t-[1px]"
                  style={{
                    height: `${h}%`,
                    minHeight: '2px',
                    backgroundColor: `rgba(0, 255, 157, ${0.15 + intensity * 0.85})`,
                    boxShadow: intensity > 0.7
                      ? `0 0 ${intensity * 12}px rgba(0,255,157,${intensity * 0.5})`
                      : 'none',
                    transition: 'height 75ms linear',
                  }}
                />
              );
            })}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none" />

          {/* Empty state */}
          {tracks.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-[#1a1a1a]"><MusicIcon /></div>
              <p className="text-[#222] text-center px-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em' }}>
                IMPORT AUDIO FILES TO BEGIN
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 px-5 py-2.5 border border-[#222] text-[#444] hover:border-[#00ff9d] hover:text-[#00ff9d] transition-all"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em' }}
              >
                CTRL+I TO IMPORT
              </button>
              <button
                onClick={() => scanRef.current?.click()}
                className="px-5 py-2.5 border border-[#111] text-[#333] hover:border-[#00ff9d] hover:text-[#00ff9d] transition-all"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em' }}
              >
                SCAN DEVICE
              </button>
            </div>
          )}
        </div>

        {/* ── Track info ──────────────────────────────────── */}
        <div className="w-full mb-6 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={track?.id || 'empty'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h2
                className="text-xl sm:text-2xl font-black uppercase tracking-tight truncate max-w-full px-2"
                style={{
                  fontFamily: 'var(--font-condensed)',
                  color: track ? '#e8e8e8' : '#333',
                  textShadow: isPlaying ? '0 0 20px rgba(0,255,157,0.15)' : 'none',
                }}
              >
                {track?.name || 'NO SIGNAL'}
              </h2>
              <p
                className="mt-1"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  color: isPlaying ? '#00ff9d' : '#333',
                }}
              >
                {track ? `${isPlaying ? 'PLAYING' : 'PAUSED'} · ${track.type}${loop ? ' · LOOP' : ''}` : 'AWAITING INPUT'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Timeline bar ────────────────────────────────── */}
        <div className="w-full mb-10">
          <div className="flex justify-between mb-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#555', letterSpacing: '0.15em' }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#333', letterSpacing: '0.15em' }}>
              {formatTime(duration)}
            </span>
          </div>
          <div
            ref={timelineRef}
            className="relative h-3 sm:h-4 bg-[#111] border border-[#1a1a1a] cursor-pointer group rounded-[1px]"
            onMouseDown={onTimelineDown}
            onTouchStart={onTimelineDown}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#00ff9d] rounded-[1px]"
              style={{
                width: `${progress}%`,
                transition: isDragging ? 'none' : 'width 100ms linear',
                boxShadow: '0 0 8px rgba(0,255,157,0.3)',
              }}
            >
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-5 sm:h-6 bg-white rounded-[1px]"
                style={{ boxShadow: '0 0 12px rgba(0,255,157,0.6), 0 0 4px #fff' }}
              />
            </div>
            <div className="absolute inset-0 bg-[#00ff9d]/0 group-hover:bg-[#00ff9d]/5 transition-colors" />
          </div>
        </div>

        {/* ── Controls: Prev, Play, Next, Loop ────────────── */}
        <div className="w-full flex items-center justify-center gap-7 sm:gap-12 mb-10 pt-1">
          <button
            onClick={prevTrack}
            className="text-[#444] hover:text-[#00ff9d] active:scale-90 transition-all p-2"
            title="Previous (←)"
          >
            <SkipPrevIcon />
          </button>

          <button
            onClick={() => { initAudioCtx(); togglePlay(); }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
            style={{
              borderColor: isPlaying ? '#00ff9d' : '#333',
              color: isPlaying ? '#00ff9d' : '#666',
              boxShadow: isPlaying
                ? '0 0 30px rgba(0,255,157,0.15), inset 0 0 20px rgba(0,255,157,0.05)'
                : 'none',
            }}
            title="Play/Pause (Space)"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            onClick={nextTrack}
            className="text-[#444] hover:text-[#00ff9d] active:scale-90 transition-all p-2"
            title="Next (→)"
          >
            <SkipNextIcon />
          </button>

          <button
            onClick={toggleLoop}
            className={`p-2 transition-all active:scale-90 ${loop ? 'text-[#00ff9d]' : 'text-[#333] hover:text-[#666]'}`}
            title={loop ? 'Loop: ON' : 'Loop: OFF'}
          >
            <LoopIcon active={loop} />
            {loop && (
              <div
                className="w-1 h-1 rounded-full bg-[#00ff9d] mx-auto mt-1"
                style={{ boxShadow: '0 0 6px rgba(0,255,157,0.6)' }}
              />
            )}
          </button>
        </div>

        {/* ── Volume ──────────────────────────────────────── */}
        <div className="w-full max-w-xs flex items-center gap-3 mx-auto mb-10">
          <span className="text-[#444]"><VolumeIcon level={volume} /></span>
          <div className="flex-1 relative h-2 bg-[#111] border border-[#1a1a1a] rounded-[1px]">
            <div
              className="absolute top-0 left-0 h-full bg-[#00ff9d]/60 rounded-[1px] transition-[width] duration-100"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                flashVolume(v);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span
            className="tabular-nums"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#444', width: '28px', textAlign: 'right' }}
          >
            {Math.round(volume * 100)}
          </span>
        </div>

        {/* ── Track list ──────────────────────────────────── */}
        {tracks.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.3em', color: '#333' }}>
                LIBRARY [{tracks.length}]
              </span>
              <button
                onClick={() => setSearchOpen(true)}
                className="text-[#333] hover:text-[#00ff9d] transition-colors"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em' }}
              >
                SEARCH
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 void-scrollbar">
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => selectTrack(i)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all border ${
                    i === currentIdx
                      ? 'bg-[#00ff9d]/5 border-[#00ff9d]/20 text-[#00ff9d]'
                      : 'bg-transparent border-transparent hover:bg-[#0a0a0a] hover:border-[#1a1a1a] text-[#666]'
                  }`}
                >
                  <span
                    className="opacity-30 w-5 text-right shrink-0"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="flex-1 truncate"
                    style={{ fontFamily: 'var(--font-condensed)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}
                  >
                    {t.name}
                  </span>
                  <span className="opacity-20 shrink-0" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>
                    {t.type}
                  </span>
                  {i === currentIdx && isPlaying && (
                    <div className="flex items-end gap-[2px] h-3 shrink-0">
                      <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '40%', animationDelay: '0ms' }} />
                      <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '80%', animationDelay: '150ms' }} />
                      <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '60%', animationDelay: '300ms' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Keyboard shortcuts hint ─────────────────────── */}
        <div className="w-full mt-8 pt-6 border-t border-[#0d0d0d] hidden sm:flex items-center justify-center gap-6 flex-wrap">
          {[
            ['SPACE', 'Play / Pause'],
            ['← →', 'Prev / Next'],
            ['↑ ↓', 'Volume'],
            ['⌘K', 'Search'],
            ['⌘I', 'Import'],
            ['ESC', 'Close'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 border border-[#1a1a1a] text-[#333]"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.1em' }}
              >
                {key}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#222' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Mobile touch hints ──────────────────────────── */}
        <div className="w-full mt-6 flex sm:hidden items-center justify-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 border border-[#1a1a1a] text-[#444] active:border-[#00ff9d] active:text-[#00ff9d] transition-all"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em' }}
          >
            + ADD FILES
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="px-4 py-2 border border-[#1a1a1a] text-[#444] active:border-[#00ff9d] active:text-[#00ff9d] transition-all"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em' }}
          >
            SEARCH
          </button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          SEARCH OVERLAY — centered, backdrop click to close
          ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchBackdropRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
            onClick={(e) => {
              // Close when clicking on the backdrop (not the content)
              if (e.target === searchBackdropRef.current) {
                setSearchOpen(false);
                setSearchQ('');
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl mx-4 sm:mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-[#00ff9d]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <h2
                    className="text-lg sm:text-xl font-black uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-condensed)', color: '#888' }}
                  >
                    SEARCH LIBRARY
                  </h2>
                </div>
                <button
                  onClick={() => { setSearchOpen(false); setSearchQ(''); }}
                  className="text-[#333] hover:text-white transition-colors p-2 border border-[#222] hover:border-[#444]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-6">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search..."
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQ('');
                    }
                  }}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] focus:border-[#00ff9d]/50 text-lg sm:text-xl font-bold uppercase px-5 py-4 outline-none transition-colors placeholder:text-[#222]"
                  style={{ fontFamily: 'var(--font-condensed)', color: '#e8e8e8', letterSpacing: '0.02em' }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 border border-[#222] text-[#333] hidden sm:inline-block"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}
                  >
                    ESC
                  </span>
                </div>
              </div>

              {/* Result count */}
              <div className="mb-3 px-1">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.3em', color: '#333' }}>
                  {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''} {searchQ && `FOR "${searchQ.toUpperCase()}"`}
                </span>
              </div>

              {/* Results */}
              <div className="max-h-[40vh] overflow-y-auto space-y-1 void-scrollbar">
                {filtered.length === 0 && searchQ && (
                  <div className="text-center py-12">
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#333', letterSpacing: '0.3em' }}>
                      NO MATCHES FOUND
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#1a1a1a', letterSpacing: '0.2em', marginTop: '8px' }}>
                      TRY A DIFFERENT QUERY
                    </p>
                  </div>
                )}
                {filtered.length === 0 && !searchQ && tracks.length === 0 && (
                  <div className="text-center py-12">
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#333', letterSpacing: '0.3em' }}>
                      LIBRARY IS EMPTY
                    </p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#1a1a1a', letterSpacing: '0.2em', marginTop: '8px' }}>
                      IMPORT TRACKS WITH CTRL+I
                    </p>
                  </div>
                )}
                {filtered.map((t) => {
                  const realIdx = tracks.findIndex(x => x.id === t.id);
                  const isCurrent = realIdx === currentIdx;
                  return (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        selectTrack(realIdx);
                        setSearchOpen(false);
                        setSearchQ('');
                      }}
                      className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-all border ${
                        isCurrent
                          ? 'border-[#00ff9d]/30 bg-[#00ff9d]/5'
                          : 'border-[#111] hover:border-[#00ff9d]/20 hover:bg-[#050505]'
                      }`}
                    >
                      <span
                        className="w-6 text-right shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: isCurrent ? '#00ff9d' : '#333',
                        }}
                      >
                        {String(realIdx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="flex-1 truncate"
                        style={{
                          fontFamily: 'var(--font-condensed)',
                          fontSize: '15px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase',
                          color: isCurrent ? '#00ff9d' : '#999',
                        }}
                      >
                        <HighlightedText text={t.name} query={searchQ} />
                      </span>
                      <span
                        className="shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '8px',
                          color: '#333',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {t.type}
                      </span>
                      {isCurrent && isPlaying && (
                        <div className="flex items-end gap-[2px] h-3 shrink-0">
                          <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '40%', animationDelay: '0ms' }} />
                          <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '80%', animationDelay: '150ms' }} />
                          <div className="w-[2px] bg-[#00ff9d] animate-pulse" style={{ height: '60%', animationDelay: '300ms' }} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom hint */}
              <div className="mt-4 pt-3 border-t border-[#111] flex items-center justify-center gap-4">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#222', letterSpacing: '0.15em' }}>
                  ENTER TO SELECT · ESC TO CLOSE · CLICK OUTSIDE TO DISMISS
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scoped styles ─────────────────────────────────── */}
      <style>{`
        .void-scrollbar::-webkit-scrollbar { width: 3px; }
        .void-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .void-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 2px; }
        .void-scrollbar::-webkit-scrollbar-thumb:hover { background: #00ff9d; }
      `}</style>
    </div>
  );
};
