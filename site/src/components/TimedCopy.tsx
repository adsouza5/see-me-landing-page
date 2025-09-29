// site/src/components/TimedCopy.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type Cue = { start: number; end?: number; heading: string; subheading: string };
export type Timeline = { src?: string; duration?: number; fadeMs?: number; cues: Cue[] };

type Props = {
  timeline: Timeline;

  /** Renders your base layout (Hero) with stable media; no text here. */
  renderBase: (mediaEl?: React.ReactNode) => React.ReactNode;

  /** Renderers for each line of copy */
  renderHeading: (heading: string) => React.ReactNode;      // static (no fade)
  renderSubheading: (subheading: string) => React.ReactNode; // fades between cues

  /** Where to place the text overlay (inside the heading block), in pixels */
  headingTopPx: number;
  headingHeightPx: number;

  /** Optional background video under everything (video mode only) */
  showVideoBackground?: boolean;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  bgClassName?: string;
};

function findCueIndex(cues: Cue[], t: number, lastIdx: number) {
  const c = cues[lastIdx];
  if (c && t >= c.start && (c.end == null || t < c.end)) return lastIdx;
  for (let i = 0; i < cues.length; i++) {
    const q = cues[i];
    if (t >= q.start && (q.end == null || t < q.end)) return i;
  }
  return Math.max(0, cues.length - 1);
}

export default function TimedCopy({
  timeline,
  renderBase,
  renderHeading,
  renderSubheading,
  headingTopPx,
  headingHeightPx,
  showVideoBackground = false,
  poster,
  muted = true,
  loop = true,
  autoPlay = true,
  bgClassName = "absolute inset-0 w-full h-full object-cover pointer-events-none",
}: Props) {
  const cues = useMemo(() => (timeline?.cues || []).slice().sort((a, b) => a.start - b.start), [timeline]);
  const hasVideo = Boolean(timeline.src);
  const fade = Math.max(0, (timeline.fadeMs ?? 500)) / 1000;

  // ----- media (stable) -----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const buildSrc = useCallback((src: string) => (src.startsWith("/") ? src : `/${src.replace(/^public\//, "")}`), []);
  const mediaEl = hasVideo ? (
    <video
      ref={videoRef}
      src={buildSrc(timeline.src!)}
      className="absolute inset-0 w-full h-full object-cover block"
      poster={poster}
      muted={muted}
      loop={loop}
      playsInline
      preload="auto"
      controls={false}
    />
  ) : undefined;

  // ----- time source -----
  const [idx, setIdx] = useState(0);

  // video mode
  useEffect(() => {
    if (!hasVideo) return;
    const v = videoRef.current;
    if (!v) return;

    const tick = () => setIdx((last) => findCueIndex(cues, v.currentTime || 0, last));
    const tryPlay = async () => {
      if (autoPlay) {
        try {
          await v.play();
        } catch {}
      }
    };

    v.addEventListener("timeupdate", tick);
    const id = window.setInterval(tick, 100);
    tryPlay();
    return () => {
      v.removeEventListener("timeupdate", tick);
      window.clearInterval(id);
    };
  }, [hasVideo, cues, autoPlay]);

  // clock mode
  useEffect(() => {
    if (hasVideo || !cues.length) return;
    const duration = timeline.duration ?? (cues[cues.length - 1].end ?? cues[cues.length - 1].start);
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = ((now - t0) / 1000) % Math.max(1, duration || 1);
      setIdx((last) => findCueIndex(cues, t, last));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hasVideo, cues, timeline.duration]);

  const cue = cues[idx] || { heading: "", subheading: "" };

  return (
    <div className="relative w-full h-full">
      {hasVideo && showVideoBackground && (
        <video
          src={buildSrc(timeline.src!)}
          className={bgClassName}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
          autoPlay
        />
      )}

      {/* base layout with stable media */}
      {renderBase(mediaEl)}

      {/* text overlay lives inside the reserved heading block */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-[1100px]"
        style={{ top: headingTopPx, height: headingHeightPx }}
      >
        {/* Heading: static (no fade) */}
        <div className="w-full flex flex-col items-center justify-start text-center">
          {renderHeading(cue.heading)}
        </div>

        {/* Subheading: fade between cues */}
        <div className="w-full text-center mt-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cue.subheading || idx}     // change only when subheading changes
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: fade, ease: "easeInOut" }}
            >
              {renderSubheading(cue.subheading)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
