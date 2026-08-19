import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  X,
  List
} from 'lucide-react';
import { PLAYLIST } from '../playlist';
import { Song } from '../types';
import { decryptNcm } from '../utils/ncmDecrypt';

type LoopMode = 'all' | 'one' | 'shuffle';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * 带有自适应边界检测的歌名组件：仅当歌名超出边界时才启用从左往右的平滑跑马灯滚动
 */
const MarqueeText: React.FC<{
  text: string;
  className?: string;
  duration?: number;
  isPlaying?: boolean;
}> = ({ text, className = '', duration = 5, isPlaying = true }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textMeasureRef.current) {
        const textWidth = textMeasureRef.current.offsetWidth;
        const containerWidth = containerRef.current.clientWidth;
        setIsOverflow(textWidth > containerWidth);
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text, className]);

  // 适中舒缓的平稳滚动时长（9~14秒）
  const scrollDuration = Math.max(9, Math.min(14, text.length * 0.45));

  return (
    <div
      ref={containerRef}
      className="overflow-hidden relative w-full select-none"
      style={
        isOverflow
          ? {
              maskImage:
                'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)',
            }
          : undefined
      }
    >
      {/* Invisible measurement element to calculate natural text width */}
      <span
        ref={textMeasureRef}
        className={`absolute invisible pointer-events-none whitespace-nowrap ${className}`}
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', left: '-9999px' }}
      >
        {text}
      </span>

      {isOverflow ? (
        <motion.div
          key={text}
          className={`inline-flex whitespace-nowrap will-change-transform ${className}`}
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            duration: scrollDuration,
            ease: 'linear',
          }}
        >
          <span className="pr-6 shrink-0">{text}</span>
          <span className="pr-6 shrink-0">{text}</span>
        </motion.div>
      ) : (
        <span className={`block truncate ${className}`}>{text}</span>
      )}
    </div>
  );
};

export const MusicPlayer: React.FC = () => {
  const [playlist, setPlaylist] = useState<Song[]>(PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('all'); // Default: List Loop
  const [isOpen, setIsOpen] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resolvedMeta, setResolvedMeta] = useState<{ title?: string; artist?: string }>({});
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number; isMobile: boolean }>({
    top: 76,
    right: 24,
    isMobile: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  const currentTrack: Song | undefined = playlist[currentIndex] || playlist[0];

  // Dynamic Title & Artist (auto-extracted from NCM if not manually specified)
  const displayTitle = (resolvedMeta.title && currentTrack?.title === '自动解析') 
    ? resolvedMeta.title 
    : (currentTrack?.title || resolvedMeta.title || 'MUSIC');

  const displayArtist = (resolvedMeta.artist && (!currentTrack?.artist || currentTrack.artist === '网易云音乐'))
    ? resolvedMeta.artist 
    : (currentTrack?.artist || resolvedMeta.artist || 'LUMINA');

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Handle track source switch with on-the-fly .NCM decryption support
  useEffect(() => {
    let isCancelled = false;

    const loadTrack = async () => {
      if (!currentTrack) return;
      setHasError(false);
      setErrorMessage('');
      setResolvedMeta({});

      // Revoke previous blob URL
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }

      const isNcm = currentTrack.src.toLowerCase().endsWith('.ncm');

      if (isNcm) {
        try {
          const res = await fetch(currentTrack.src);
          if (!res.ok) {
            throw new Error('未找到 NCM 文件，请检查 public/music/ 目录');
          }
          const buffer = await res.arrayBuffer();
          if (isCancelled) return;

          const decrypted = await decryptNcm(buffer);
          if (isCancelled) return;

          activeBlobUrlRef.current = decrypted.audioUrl;
          if (audioRef.current) {
            audioRef.current.src = decrypted.audioUrl;
            audioRef.current.load();
            if (isPlaying) {
              audioRef.current.play().catch(() => {
                setHasError(true);
                setIsPlaying(false);
              });
            }
          }

          if (decrypted.title || decrypted.artist) {
            setResolvedMeta({
              title: decrypted.title,
              artist: decrypted.artist,
            });
          }
        } catch (err: any) {
          console.warn('NCM Decryption / Load failed:', err);
          if (!isCancelled) {
            setHasError(true);
            setErrorMessage(err.message || 'NCM 解密失败');
            setIsPlaying(false);
          }
        }
      } else {
        // Standard audio file (.mp3, .wav, .flac, .ogg, .m4a)
        if (audioRef.current) {
          audioRef.current.src = currentTrack.src;
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(() => {
              setHasError(true);
              setIsPlaying(false);
            });
          }
        }
      }
    };

    loadTrack();

    return () => {
      isCancelled = true;
    };
  }, [currentIndex, currentTrack]);

  // Handle outside click to dismiss popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Position calculation for desktop & mobile
  const updatePosition = () => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setPopoverPos({ top: 76, right: 16, isMobile: true });
    } else if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 10,
        right: Math.max(16, window.innerWidth - rect.right),
        isMobile: false,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const playNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playlist.length === 0) return;
    if (loopMode === 'shuffle') {
      const nextIdx = (Math.floor(Math.random() * (playlist.length - 1)) + 1 + currentIndex) % playlist.length;
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
    setIsPlaying(true);
  };

  const playPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playlist.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setHasError(true));
      }
    } else {
      playNext();
    }
  };

  const cycleLoopMode = () => {
    if (loopMode === 'all') setLoopMode('one');
    else if (loopMode === 'one') setLoopMode('shuffle');
    else setLoopMode('all');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSelectTrack = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={handleEnded}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
        }}
      />

      {/* ─── Compact Navbar Trigger (Chronicles Frosted Glass Badge Style) ─── */}
      <div
        ref={triggerRef}
        onClick={() => {
          updatePosition();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2.5 md:gap-3 font-mono text-xs text-[#a8fbd3] tracking-[0.2em] uppercase bg-black/20 hover:bg-black/40 px-3 py-2 md:px-4 md:py-2.5 rounded-full backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer select-none"
        data-hover="true"
        title="点击展开播放器"
      >
        {/* Pulsing indicator dot */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPlaying ? 'bg-[#4fb7b3] animate-pulse shadow-[0_0_8px_#4fb7b3]' : 'bg-white/40'}`} />

        {/* Minimalist Flat Equalizer Frequency Bars */}
        <div className="flex items-end gap-0.5 h-2.5 w-2.5 shrink-0 overflow-hidden">
          {[0.4, 0.9, 0.6].map((scale, i) => (
            <motion.span
              key={i}
              className="w-0.5 bg-[#a8fbd3] rounded-full"
              animate={
                isPlaying
                  ? { height: ['20%', '100%', '30%', '80%', '20%'] }
                  : { height: '25%' }
              }
              transition={
                isPlaying
                  ? {
                      repeat: Infinity,
                      duration: 0.7 + i * 0.2,
                      ease: 'easeInOut',
                    }
                  : {
                      duration: 0.3,
                      ease: 'easeOut',
                    }
              }
            />
          ))}
        </div>

        {/* Track Title (Smooth Scrolling Marquee) */}
        <div className="w-[75px] sm:w-[100px] md:w-[120px]">
          <MarqueeText
            text={displayTitle}
            className="font-mono text-[11px] md:text-xs text-white/90 tracking-wider"
            isPlaying={isPlaying}
            duration={7}
          />
        </div>

        {/* Flat Mini Controls */}
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 shrink-0">
          <button
            onClick={togglePlay}
            className="w-4 h-4 flex items-center justify-center text-white hover:text-[#a8fbd3] transition-colors bg-transparent border-none cursor-pointer p-0"
            data-hover="true"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current translate-x-[0.5px]" />
            )}
          </button>

          <button
            onClick={playNext}
            className="hidden sm:flex w-4 h-4 items-center justify-center text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
            data-hover="true"
            aria-label="Next Track"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Compact Chronicles-Style Glass Panel (Rendered to Body) ─── */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: `${popoverPos.top}px`,
                  right: popoverPos.isMobile ? '16px' : `${popoverPos.right}px`,
                  left: popoverPos.isMobile ? '16px' : 'auto',
                  maxWidth: popoverPos.isMobile ? 'calc(100vw - 32px)' : '270px',
                  width: popoverPos.isMobile ? '100%' : '270px',
                  zIndex: 99999,
                }}
                className="relative select-none"
              >
                {/* Chronicles Glow Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#637ab9] to-[#4fb7b3] rounded-2xl rotate-1 opacity-20 blur-xl pointer-events-none" />

                {/* Chronicles Glass Panel */}
                <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-2xl text-white overflow-hidden">
                  
                  {/* Top Bar: Section Tag & Close */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#a8fbd3]">
                      <span className="w-1.5 h-1.5 bg-[#4fb7b3] rounded-full animate-pulse" />
                      <span>{isPlaying ? 'NOW PLAYING' : 'PAUSED'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Loop Mode Badge Button */}
                      <button
                        onClick={cycleLoopMode}
                        className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#a8fbd3] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                        title="点击切换播放模式"
                      >
                        {loopMode === 'all' ? 'LOOP ALL' : loopMode === 'one' ? 'REPEAT 1' : 'SHUFFLE'}
                      </button>

                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Track Info (Scrolling Marquee in Expanded Card) */}
                  <div className="mb-3">
                    <MarqueeText
                      text={displayTitle}
                      className="text-sm font-heading font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]"
                      isPlaying={isPlaying}
                      duration={8}
                    />
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 truncate mt-0.5">
                      {displayArtist}
                    </p>
                  </div>

                  {/* Missing File or Decrypt Error Notice */}
                  {hasError && (
                    <div className="mb-2.5 p-2 rounded-lg bg-black/30 border border-[#4fb7b3]/30 font-mono text-[9px] tracking-wider text-[#a8fbd3]">
                      {errorMessage || 'AUDIO NOT FOUND IN /PUBLIC/MUSIC/'}
                    </div>
                  )}

                  {/* Progress Bar & Timestamps */}
                  <div className="mb-3">
                    <div className="relative group mb-1.5">
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#4fb7b3] to-[#a8fbd3] transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[9px] tracking-[0.2em] text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2.5" />

                  {/* Controls Row */}
                  <div className="flex items-center justify-between">
                    {/* Prev */}
                    <button
                      onClick={playPrev}
                      className="p-1.5 text-white/70 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                      title="PREV"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Play / Pause Flat Button */}
                    <button
                      onClick={() => togglePlay()}
                      className="w-8 h-8 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                      title={isPlaying ? 'PAUSE' : 'PLAY'}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />
                      )}
                    </button>

                    {/* Next */}
                    <button
                      onClick={playNext}
                      className="p-1.5 text-white/70 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                      title="NEXT"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Volume Mute Toggle */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 text-white/60 hover:text-[#a8fbd3] transition-colors bg-transparent border-none cursor-pointer"
                      title={isMuted ? 'UNMUTE' : 'MUTE'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#4fb7b3]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Toggle Tracklist */}
                    <button
                      onClick={() => setShowTracklist(!showTracklist)}
                      className={`p-1.5 transition-colors bg-transparent border-none cursor-pointer ${
                        showTracklist ? 'text-[#a8fbd3]' : 'text-white/60 hover:text-white'
                      }`}
                      title="PLAYLIST"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Collapsible Playlist */}
                  <AnimatePresence>
                    {showTracklist && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden border-t border-white/10 mt-3 pt-2"
                      >
                        <div className="flex justify-between items-center mb-1.5 font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase">
                          <span>Tracks ({playlist.length})</span>
                          <span>Auto Next</span>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-0.5">
                          {playlist.map((track, idx) => {
                            const isCurrent = idx === currentIndex;
                            return (
                              <button
                                key={track.id || idx}
                                onClick={() => handleSelectTrack(idx)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors bg-transparent border-none cursor-pointer ${
                                  isCurrent
                                    ? 'bg-white/10 text-[#a8fbd3]'
                                    : 'hover:bg-white/5 text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 font-mono text-[10px] tracking-wider uppercase">
                                  <span className="text-white/30 w-3">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <span className="truncate">
                                    {isCurrent ? displayTitle : track.title}
                                  </span>
                                </div>
                                {isCurrent && isPlaying && (
                                  <span className="w-1 h-1 rounded-full bg-[#4fb7b3] shrink-0 animate-pulse" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

export default MusicPlayer;
