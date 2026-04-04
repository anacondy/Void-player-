import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────── */
export interface Track {
  id: string;
  name: string;
  file: File;
  url: string;
  type: string;
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.opus', '.weba', '.webm'];
const TIME_UPDATE_THROTTLE_MS = 120; // ~8 updates per second to reduce re-render load

interface AudioEngineState {
  tracks: Track[];
  currentIdx: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loop: boolean;
  shuffle: boolean;
  visualData: number[];
  avgLevel: number;
  progress: number;
  track: Track | null;
  addTracks: (files: FileList) => number;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (idx: number) => void;
  setVolume: (v: number) => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  seekTo: (pct: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  fileRef: React.RefObject<HTMLInputElement | null>;
  scanRef: React.RefObject<HTMLInputElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  seekFromEvent: (clientX: number) => void;
  initAudioCtx: () => void;
}

const AudioCtx = createContext<AudioEngineState | null>(null);

export const useAudioEngine = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudioEngine must be inside AudioProvider');
  return ctx;
};

/* ═══════════════════════════════════════════════════════════════
   AUDIO PROVIDER — lives at App level, never unmounts
   ═══════════════════════════════════════════════════════════════ */
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [loop, setLoop] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [visualData, setVisualData] = useState<number[]>(new Array(48).fill(0));
  const [isDragging, setIsDragging] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scanRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const dragRafRef = useRef<number | null>(null);
  const dragClientXRef = useRef<number | null>(null);
  const timeUpdateRef = useRef(0);
  const vizBufferRef = useRef<Uint8Array>(new Uint8Array(64));
  const vizLastFrameRef = useRef(0);

  const track = currentIdx >= 0 && currentIdx < tracks.length ? tracks[currentIdx] : null;
  const pickDifferentRandomIndex = useCallback((current: number, length: number) => {
    if (length <= 1) return current;
    const offset = Math.floor(Math.random() * (length - 1)) + 1;
    return (current + offset) % length;
  }, []);

  /* ── Volume sync ─────────────────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  /* ── Loop sync ───────────────────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop]);

  /* ── Auto-play on track change ───────────────────────────── */
  useEffect(() => {
    if (!audioRef.current || currentIdx < 0) return;
    const t = tracks[currentIdx];
    if (!t) return;
    audioRef.current.src = t.url;
    audioRef.current.load();
    // Resume audio context if suspended
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, tracks.length]);

  /* ── Audio context + analyzer ────────────────────────────── */
  const initAudioCtx = useCallback(() => {
    if (!audioRef.current) return;
    if (ctxRef.current) {
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      return;
    }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 128;
      analyzer.smoothingTimeConstant = 0.82;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyzer);
      analyzer.connect(ctx.destination);
      ctxRef.current = ctx;
      analyzerRef.current = analyzer;
      sourceRef.current = source;
    } catch (_) { /* silent */ }
  }, []);

  /* ── Visualizer loop — throttled for mobile ──────────────── */
  useEffect(() => {
    let running = true;
    const targetFrameMs = isPlaying ? 55 : 85; // ≈18fps while playing, ≈11.8fps when idle

    const tick = (ts: number) => {
      if (!running) return;
      const elapsed = ts - vizLastFrameRef.current;

      if (analyzerRef.current && elapsed >= targetFrameMs) {
        const needsResize = vizBufferRef.current.length !== analyzerRef.current.frequencyBinCount;
        if (needsResize) {
          vizBufferRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
        }
        const buffer = vizBufferRef.current as unknown as Uint8Array<ArrayBuffer>;
        analyzerRef.current.getByteFrequencyData(buffer);
        const slice = buffer.slice(0, 48);
        setVisualData(prev => {
          let changed = prev.length !== slice.length;
          if (!changed) {
            for (let i = 0; i < slice.length; i++) {
              if (prev[i] !== slice[i]) { changed = true; break; }
            }
          }
          return changed ? Array.from(slice) : prev;
        });
        vizLastFrameRef.current = ts;
      } else if (!analyzerRef.current && !isPlaying && elapsed >= targetFrameMs) {
        setVisualData(prev => {
          const allZero = prev.every(v => v < 1);
          if (allZero) return prev;
          return prev.map(v => v * 0.92);
        });
        vizLastFrameRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const isAudioFile = (f: File) => {
    if (f.type && f.type.startsWith('audio/')) return true;
    const lower = f.name.toLowerCase();
    return AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext));
  };
  const deriveDisplayType = (f: File): string | undefined => {
    if (f.type) return f.type.split('/')[1]?.toUpperCase();
    const ext = f.name.split('.').pop();
    return ext ? ext.toUpperCase() : undefined;
  };

  /* ── Import handler ──────────────────────────────────────── */
  const addTracks = useCallback((files: FileList): number => {
    const added: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (isAudioFile(f)) {
        const type = deriveDisplayType(f);
        added.push({
          id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
          name: f.name.replace(/\.[^/.]+$/, ''),
          file: f,
          url: URL.createObjectURL(f),
          type: type || 'AUDIO',
        });
      }
    }
    if (added.length > 0) {
      setTracks(prev => [...prev, ...added]);
      if (currentIdx === -1) setCurrentIdx(0);
    }
    return added.length;
  }, [currentIdx]);

  /* ── Playback controls ───────────────────────────────────── */
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !track) return;
    initAudioCtx();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying, track, initAudioCtx]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIdx((p) => {
      if (!shuffle || tracks.length === 1) return (p + 1) % tracks.length;
      return pickDifferentRandomIndex(p, tracks.length);
    });
    setIsPlaying(true);
  }, [tracks.length, shuffle, pickDifferentRandomIndex]);

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIdx((p) => {
      if (!shuffle || tracks.length === 1) return (p - 1 + tracks.length) % tracks.length;
      return pickDifferentRandomIndex(p, tracks.length);
    });
    setIsPlaying(true);
  }, [tracks.length, shuffle, pickDifferentRandomIndex]);

  const selectTrack = useCallback((idx: number) => {
    initAudioCtx();
    setCurrentIdx(idx);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 80);
  }, [initAudioCtx]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop(p => !p);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(p => !p);
  }, []);

  const seekTo = useCallback((pct: number) => {
    if (!audioRef.current) return;
    const t = pct * (audioRef.current.duration || 0);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  /* ── Timeline seek ──────────────────────────────────────── */
  const seekFromEvent = useCallback((clientX: number) => {
    if (!timelineRef.current || !audioRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = pct * (audioRef.current.duration || 0);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  /* ── Drag ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      dragClientXRef.current = clientX;
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          if (dragClientXRef.current !== null) {
            seekFromEvent(dragClientXRef.current);
          }
        });
      }
    };
    const onUp = () => {
      dragClientXRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, seekFromEvent]);

  /* ── Computed ─────────────────────────────────────────────── */
  const avgLevel = visualData.length > 0
    ? visualData.reduce((a, b) => a + b, 0) / visualData.length / 255
    : 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const value: AudioEngineState = {
    tracks, currentIdx, isPlaying, currentTime, duration, volume, loop, shuffle,
    visualData, avgLevel, progress, track,
    addTracks, togglePlay, nextTrack, prevTrack, selectTrack,
    setVolume, toggleLoop, toggleShuffle, seekTo,
    audioRef, fileRef, scanRef, timelineRef,
    isDragging, setIsDragging, seekFromEvent, initAudioCtx,
  };

  return (
    <AudioCtx.Provider value={value}>
      {/* Global audio element — never unmounts */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current && !isDragging) {
            const now = performance.now();
            if (now - timeUpdateRef.current > TIME_UPDATE_THROTTLE_MS) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 0);
              timeUpdateRef.current = now;
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => {
          if (!loop) nextTrack();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {/* Global file input — never unmounts */}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const count = addTracks(e.target.files);
            if (count === 0) {
              // will show toast from player
            }
            e.target.value = '';
          }
        }}
      />
      <input
        ref={scanRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        // @ts-expect-error — non-standard directory picker attribute (Chromium-only)
        webkitdirectory
        // Directory scanning is only available on Chromium-based browsers; others fall back to manual import.
        directory
        onChange={(e) => {
          if (e.target.files) {
            addTracks(e.target.files);
            e.target.value = '';
          }
        }}
      />
      {children}
    </AudioCtx.Provider>
  );
};
