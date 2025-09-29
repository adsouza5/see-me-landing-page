// site/src/components/HeroWithTimeline.tsx
"use client";

import React from "react";
import Hero from "@/components/Hero";
import TimedCopy from "@/components/TimedCopy";

const AVATARS = [
  "/assets/avatars/a1.png",
  "/assets/avatars/a2.png",
  "/assets/avatars/a3.png",
  "/assets/avatars/a4.png",
  "/assets/avatars/a5.png",
  "/assets/avatars/a6.png",
];

// --- Stable child so it doesn't remount across cue changes ---
type Node = { src: string; x: number; y: number; delay: number; key: string; dx: number; dy: number };
function VAvatars({
  nodes,
  height,
  phase,          // "in" | "out"
  moveMs = 1600,  // SLOWER move to center
  enterMs = 900,  // SLOWER entrance fade
  fadeMs = 900,   // SLOWER fade-out
}: {
  nodes: Node[];
  height: number;
  phase: "in" | "out";
  moveMs?: number;
  enterMs?: number;
  fadeMs?: number;
}) {
  const [entered, setEntered] = React.useState(false);
  const [outStage, setOutStage] = React.useState<"idle" | "moving" | "fading">("idle");

  // one-time entrance
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // two-stage out: move → fade (fade starts near end of move)
  React.useEffect(() => {
    if (phase !== "out") {
      setOutStage("idle");
      return;
    }
    setOutStage("moving");
    // begin fade a bit before the move finishes so it feels continuous
    const startFadeAfter = Math.max(300, moveMs - 200);
    const t = window.setTimeout(() => setOutStage("fading"), startFadeAfter);
    return () => window.clearTimeout(t);
  }, [phase, moveMs]);

  return (
    <div
      className={`relative w-full avatars ${phase} ${outStage}`}
      style={{
        height,
        zIndex: 35,                 // keep above phone while moving so motion is visible
        // expose durations to CSS
        // entrance uses --fadeDur (when phase === "in"), exit uses it again (phase === "out")
        // we just swap the value below based on phase
        // @ts-ignore custom props
        "--moveDur": `${moveMs}ms`,
        "--fadeDur": `${phase === "out" ? fadeMs : enterMs}ms`,
      } as React.CSSProperties}
    >
      {nodes.map((n) => (
        <div
          key={n.key}
          className={`avatar absolute rounded-full overflow-hidden shadow-lg border-[3px] border-black/50 ${
            entered ? "entered" : "pre"
          }`}
          style={
            {
              width: 48,
              height: 48,
              left: `calc(50% + ${n.x - 24}px)`,
              top: n.y - 24,
              ["--dx" as any]: `${n.dx}px`,
              ["--dy" as any]: `${n.dy}px`,
              transitionDelay: `${n.delay}ms`, // stagger on both enter and exit
            } as React.CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.src} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      <style>{`
        .avatars .avatar {
          will-change: transform, opacity;
          transition:
            transform var(--moveDur) cubic-bezier(.22,.61,.36,1),
            opacity   var(--fadeDur) ease;
        }
        /* Entrance (slower now via --fadeDur when phase === "in") */
        .avatars .avatar.pre     { opacity: 0; transform: translateY(12px); }
        .avatars .avatar.entered { opacity: 1; transform: translate(0,0); }

        /* PHASE: out-moving — move to center, keep opacity 1 */
        .avatars.out.moving .avatar { transform: translate(var(--dx), var(--dy)); opacity: 1; }

        /* PHASE: out-fading — already at center, now fade out slowly */
        .avatars.out.fading .avatar { transform: translate(var(--dx), var(--dy)); opacity: 0; }
      `}</style>
    </div>
  );
}

export default function HeroWithTimeline({ props }: { props: any }) {
  const hasTimeline = !!props.timeline?.cues?.length;
  if (!hasTimeline) return <Hero {...props} />;

  // Decor sits between headings and phone
  const decorTop = props.heroTopGap + props.headingBlockHeight + Math.max(8, props.headlineGap);

  // Phone geometry → vertical center (slightly above true center looks nicer)
  const phoneH = props.phoneWidth * props.phoneAspect;
  const phoneTop = props.heroTopGap + props.headingBlockHeight + props.phoneTopGap;
  const phoneCenterYAbs = phoneTop + phoneH * 0.45;
  const targetYInDecor = phoneCenterYAbs - decorTop; // convert to decor coords

  return (
    <TimedCopy
      timeline={props.timeline}
      headingTopPx={props.heroTopGap}
      headingHeightPx={props.headingBlockHeight}
      decorTopPx={decorTop}
      renderBase={(mediaEl) => (
        <Hero
          {...props}
          suppressText
          centerpiece={mediaEl ?? <div className="absolute inset-0 bg-black/20" />}
        />
      )}
      // Static heading
      renderHeading={(heading: string) => (
        <h1
          className="m-0"
          style={{
            fontSize: `${props.h1Px}px`,
            lineHeight: props.h1Line,
            fontWeight: props.h1Weight,
            color: "#fff",
          }}
        >
          {heading || props.title}
        </h1>
      )}
      // Fading subheading
      renderSubheading={(subheading: string) => (
        <p
          className="m-0 opacity-90"
          style={{
            marginTop: props.headlineGap,
            fontSize: `${props.h2Px}px`,
            lineHeight: props.h2Line,
            fontWeight: props.h2Weight,
            color: "#fff",
          }}
        >
          {subheading || props.subtitle}
        </p>
      )}
      renderDecor={(cueIndex: number) => {
        if (cueIndex < 1) return null; // only show from cue 1 onward

        const phoneHalf = props.phoneWidth / 2;
        const gapFromPhone = 36;
        const groupSpan = 280;

        // V positions (relative to decor’s centered container)
        const leftXs = [
          -(phoneHalf + gapFromPhone + groupSpan * 0.15),
          -(phoneHalf + gapFromPhone + groupSpan * 0.50),
          -(phoneHalf + gapFromPhone + groupSpan * 0.85),
        ];
        const rightXs = [
          +(phoneHalf + gapFromPhone + groupSpan * 0.15),
          +(phoneHalf + gapFromPhone + groupSpan * 0.50),
          +(phoneHalf + gapFromPhone + groupSpan * 0.85),
        ];
        const yInner = 72, yMid = 52, yOuter = 34;

        const mk = (src: string, x: number, y: number, delay: number, i: number): Node => ({
          src,
          x,
          y,
          delay,
          key: `av-${i}`,
          dx: 0 - x,
          dy: targetYInDecor - y,
        });

        const nodes: Node[] = [
          mk(AVATARS[0], leftXs[0],  yInner,  100, 0),
          mk(AVATARS[1], leftXs[1],  yMid,    150, 1),
          mk(AVATARS[2], leftXs[2],  yOuter,  200, 2),
          mk(AVATARS[3], rightXs[0], yInner,  100, 3),
          mk(AVATARS[4], rightXs[1], yMid,    150, 4),
          mk(AVATARS[5], rightXs[2], yOuter,  200, 5),
        ];

        const phase: "in" | "out" = cueIndex >= 2 ? "out" : "in";

        // Slower timings passed here
        return <VAvatars nodes={nodes} height={yInner + 48} phase={phase} moveMs={1600} enterMs={1500} fadeMs={900} />;
      }}
    />
  );
}
