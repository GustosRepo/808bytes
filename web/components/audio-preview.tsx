"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const PREVIEW_PLAY_EVENT = "808bytes:preview-play";

type AudioPreviewProps = {
  src: string;
  title: string;
  /** Match the dark DAW chrome on product detail pages. */
  dark?: boolean;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function AudioPreview({ src, title, dark = false }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instanceId = useId();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  // Only one preview plays at a time across the page.
  useEffect(() => {
    const handleOtherPlay = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail !== instanceId) {
        audioRef.current?.pause();
      }
    };

    window.addEventListener(PREVIEW_PLAY_EVENT, handleOtherPlay);
    return () => {
      window.removeEventListener(PREVIEW_PLAY_EVENT, handleOtherPlay);
    };
  }, [instanceId]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      window.dispatchEvent(new CustomEvent(PREVIEW_PLAY_EVENT, { detail: instanceId }));
      void audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  }, [instanceId]);

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) {
      return;
    }

    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  };

  const ink = dark ? "#e4dfd4" : "#151515";
  const frame = dark ? "border-[#3d3f43] bg-[#1b1d20]" : "border-[#151515] bg-white";
  const buttonFrame = dark
    ? "border-[#595a5d] bg-[#101113] text-[#e4dfd4] hover:bg-[#24262a]"
    : "border-[#151515] bg-[#151515] text-white hover:bg-[#30302d]";
  const timeColor = dark ? "text-[#9b978e]" : "text-[#6f6a5e]";

  if (failed) {
    return (
      <p className={`border px-3 py-2 text-xs font-bold uppercase ${frame} ${timeColor}`}>
        Preview unavailable
      </p>
    );
  }

  return (
    <div className={`flex items-center gap-3 border px-3 py-2 ${frame}`}>
      {/* No preloading or autoplay; audio data loads on first play. */}
      <audio
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setFailed(true)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="none"
        ref={audioRef}
        src={src}
      />
      <button
        aria-label={isPlaying ? `Pause ${title} preview` : `Play ${title} preview`}
        className={`grid h-11 w-11 shrink-0 place-items-center border text-sm font-bold transition ${buttonFrame}`}
        data-analytics="product_preview"
        data-analytics-label={title}
        onClick={togglePlayback}
        type="button"
      >
        {isPlaying ? (
          <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <rect height="12" width="4" x="2.5" y="2" />
            <rect height="12" width="4" x="9.5" y="2" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.5 2v12l10-6z" />
          </svg>
        )}
      </button>
      <input
        aria-label={`Seek ${title} preview`}
        className="h-11 min-w-0 flex-1 cursor-pointer"
        max={Number.isFinite(duration) && duration > 0 ? duration : 0}
        min={0}
        onChange={handleSeek}
        step={0.1}
        style={{ accentColor: ink }}
        type="range"
        value={currentTime}
      />
      <span className={`shrink-0 text-[0.68rem] font-bold tabular-nums ${timeColor}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
