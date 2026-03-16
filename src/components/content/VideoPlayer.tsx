'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Gauge } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  subtitleSrc?: string;
  subjectColour: string;
  onComplete?: () => void;
}

export default function VideoPlayer({ src, subtitleSrc, subjectColour, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const completeFired = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);

      // Fire onComplete after 90 seconds or video end
      if (!completeFired.current && video.currentTime >= 90) {
        completeFired.current = true;
        onComplete?.();
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      setEnded(true);
      setPlaying(false);
      if (!completeFired.current) {
        completeFired.current = true;
        onComplete?.();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const changeSpeed = (s: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  const watchAgain = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setPlaying(true);
    setEnded(false);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black relative group">
      {/* Video element */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          playsInline
          className="w-full h-full object-contain bg-black"
        >
          {subtitleSrc && <track kind="subtitles" src={subtitleSrc} srcLang="en" label="English" default />}
        </video>

        {/* Centre play/pause overlay */}
        <AnimatePresence>
          {(!playing || ended) && (
            <motion.button
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={ended ? watchAgain : togglePlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${subjectColour}CC` }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {ended ? (
                  <RotateCcw size={32} className="text-white" />
                ) : (
                  <Play size={32} className="text-white ml-1" />
                )}
              </motion.div>
              {ended && (
                <span className="absolute bottom-20 text-white text-sm font-bold">Watch again</span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Custom controls */}
      <div className="px-4 py-3 bg-navy-dark/90 space-y-2">
        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: subjectColour, width: `${progress}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:opacity-80 transition-opacity">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button onClick={toggleMute} className="text-white hover:opacity-80 transition-opacity">
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <span className="text-xs text-slate-light/60 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Speed control */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-xs text-slate-light/60 hover:text-white transition-colors px-2 py-1 rounded-lg bg-white/5"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            >
              <Gauge size={14} /> {speed}x
            </button>
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  className="absolute bottom-full right-0 mb-2 bg-navy-dark border border-white/10 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  {[0.75, 1, 1.25].map((s) => (
                    <button
                      key={s}
                      className={`block w-full px-4 py-2 text-xs text-left hover:bg-white/10 ${
                        speed === s ? 'text-amber' : 'text-white'
                      }`}
                      onClick={() => changeSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
