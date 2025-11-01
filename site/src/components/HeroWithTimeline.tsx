// site/src/components/HeroWithTimeline.tsx
"use client";

import React from "react";
import Hero from "@/components/Hero";
import TimedCopy from "@/components/TimedCopy";
import type { Timeline } from "@/lib/spec";

const AVATARS_DESKTOP = [
  "/assets/avatars/a1.png",
  "/assets/avatars/a2.png",
  "/assets/avatars/a3.png",
  "/assets/avatars/a4.png",
  "/assets/avatars/a5.png",
  "/assets/avatars/a6.png",
];

const AVATARS_MOBILE = [
  "/assets/avatars/a1.png",
  "/assets/avatars/a3.png",
  "/assets/avatars/a5.png",
];

type CSSVars = React.CSSProperties & {
  ["--moveDur"]?: string;
  ["--fadeDur"]?: string;
  ["--dx"]?: string;
  ["--dy"]?: string;
};

type AvatarNode = {
  src: string;
  x: number;
  y: number;
  delay: number;
  key: string;
  dx: number;
  dy: number;
};

function VAvatars({
  nodes,
  height,
  phase,
  moveMs = 1600,
  enterMs = 1500,
  fadeMs = 900,
}: {
  nodes: AvatarNode[];
  height: number;
  phase: "in" | "out";
  moveMs?: number;
  enterMs?: number;
  fadeMs?: number;
}) {
  const [entered, setEntered] = React.useState(false);
  const [outStage, setOutStage] = React.useState<"idle" | "moving" | "fading">("idle");

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    if (phase !== "out") {
      setOutStage("idle");
      return;
    }
    setOutStage("moving");
    const startFadeAfter = Math.max(300, moveMs - 200);
    const t = window.setTimeout(() => setOutStage("fading"), startFadeAfter);
    return () => window.clearTimeout(t);
  }, [phase, moveMs]);

  const containerStyle: CSSVars = {
    height,
    zIndex: 35,
    "--moveDur": `${moveMs}ms`,
    "--fadeDur": `${phase === "out" ? fadeMs : enterMs}ms`,
  };

  return (
    <div className={`relative w-full avatars ${phase} ${outStage}`} style={containerStyle}>
      {nodes.map((n) => {
        const style: CSSVars = {
          width: 48,
          height: 48,
          left: `calc(50% + ${n.x - 24}px)`,
          top: n.y - 24,
          "--dx": `${n.dx}px`,
          "--dy": `${n.dy}px`,
          transitionDelay: `${n.delay}ms`,
        };
        return (
          <div
            key={n.key}
            className={`avatar absolute rounded-full overflow-hidden ${entered ? "entered" : "pre"}`}
            style={style}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.src} alt="" className="w-full h-full object-cover" />
          </div>
        );
      })}

      <style>{`
        .avatars .avatar {
          will-change: transform, opacity;
          transition:
            transform var(--moveDur) cubic-bezier(.22,.61,.36,1),
            opacity   var(--fadeDur) ease;
        }
        .avatars .avatar.pre     { opacity: 0; transform: translateY(12px); }
        .avatars .avatar.entered { opacity: 1; transform: translate(0,0); }

        .avatars.out.moving .avatar { transform: translate(var(--dx), var(--dy)); opacity: 1; }
        .avatars.out.fading .avatar { transform: translate(var(--dx), var(--dy)); opacity: 0; }
      `}</style>
    </div>
  );
}

type HeroMinimalProps = {
  timeline?: Timeline;
  headingBlockHeight: number;
  heroTopGap: number;
  headlineGap: number;
  phoneWidth: number;
  phoneAspect: number;
  phoneTopGap: number;
  h1Px: number;
  h1Line: number;
  h1Weight: number;
  h2Px: number;
  h2Line: number;
  h2Weight: number;
  title: string;
  subtitle: string;
  [key: string]: unknown;
};

export default function HeroWithTimeline({ props }: { props: HeroMinimalProps }) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const rawTimeline = props.timeline;
  const timeline: Timeline =
    rawTimeline && Array.isArray(rawTimeline.cues) && rawTimeline.cues.length > 0
      ? rawTimeline
      : {
          src: "/assets/hero.mp4",
          fadeMs: 500,
          duration: 8,
          cues: [
            { start: 0, end: 3, heading: props.title, subheading: props.subtitle },
            { start: 3, end: 6, heading: props.title, subheading: "See your world, shared in real time." },
          ],
        };

  // ----- MOBILE TWEAKS -----
  const mobileH1Px = Math.round(props.h1Px * 0.62);
  const mobileH2Px = Math.round(props.h2Px * 0.6);
  const mobileHeadlineGap = Math.round(props.headlineGap * 1.2);

  // push text lower on mobile
  const mobileHeroTopGap = Math.round(props.heroTopGap * 0.75) + 70;
  const mobilePhoneTopGap = Math.max(20, Math.round(props.phoneTopGap * 1.5));

  const mobileHeadingBlockHeight =
    Math.ceil(mobileH1Px * props.h1Line) +
    Math.ceil(mobileHeadlineGap) +
    Math.ceil(mobileH2Px * props.h2Line);

  const desktopHeroTopGap = props.heroTopGap + 14;

  const effectiveHeroTopGap = isMobile ? mobileHeroTopGap : desktopHeroTopGap;
  const effectiveHeadlineGap = isMobile ? mobileHeadlineGap : props.headlineGap;
  const effectiveH1Px = isMobile ? mobileH1Px : props.h1Px;
  const effectiveH2Px = isMobile ? mobileH2Px : props.h2Px;
  const effectiveHeadingBlockHeight = isMobile ? mobileHeadingBlockHeight : props.headingBlockHeight;
  const effectivePhoneTopGap = isMobile ? mobilePhoneTopGap : props.phoneTopGap;

  // desktop decor below headings; mobile decor higher (above text)
  // ⬇️ move mobile decor even higher so avatars don't overlap text
  const desktopDecorTop =
    effectiveHeroTopGap + effectiveHeadingBlockHeight + Math.max(8, effectiveHeadlineGap);
  const mobileDecorTop = Math.max(8, effectiveHeroTopGap - 78); // was -58
  const decorTop = isMobile ? mobileDecorTop : desktopDecorTop;

  // phone geometry
  const phoneH = props.phoneWidth * props.phoneAspect;
  const phoneTop = effectiveHeroTopGap + effectiveHeadingBlockHeight + effectivePhoneTopGap;
  const phoneCenterYAbs = phoneTop + phoneH * 0.45;
  const targetYInDecor = phoneCenterYAbs - decorTop;

  const heroPropsForRender = {
    ...props,
    heroTopGap: effectiveHeroTopGap,
    headlineGap: effectiveHeadlineGap,
    h1Px: effectiveH1Px,
    h2Px: effectiveH2Px,
    phoneTopGap: effectivePhoneTopGap,
    headingBlockHeight: effectiveHeadingBlockHeight,
  } as React.ComponentProps<typeof Hero>;

  return (
    <TimedCopy
      timeline={timeline}
      headingTopPx={effectiveHeroTopGap}
      headingHeightPx={effectiveHeadingBlockHeight}
      decorTopPx={decorTop}
      renderBase={(mediaEl) => (
        <Hero
          {...heroPropsForRender}
          suppressText
          centerpiece={mediaEl ?? null}
        />
      )}
      renderHeading={(heading: string) => (
        <h1
          className="m-0"
          style={{
            fontSize: `${effectiveH1Px}px`,
            lineHeight: props.h1Line,
            fontWeight: props.h1Weight,
            color: "#fff",
          }}
        >
          {heading || props.title}
        </h1>
      )}
      renderSubheading={(subheading: string) => (
        <p
          className="m-0 opacity-90"
          style={{
            marginTop: effectiveHeadlineGap,
            fontSize: `${effectiveH2Px}px`,
            lineHeight: props.h2Line,
            fontWeight: props.h2Weight,
            color: "#fff",
          }}
        >
          {subheading || props.subtitle}
        </p>
      )}
      renderDecor={(cueIndex: number) => {
        if (cueIndex < 1) return null;
        const phase: "in" | "out" = cueIndex >= 2 ? "out" : "in";
        const phoneHalf = props.phoneWidth / 2;
        const gapFromPhone = 36;

        // DESKTOP
        if (!isMobile) {
          const groupSpan = 210;
          const leftXs = [
            -(phoneHalf + gapFromPhone + groupSpan * 0.15),
            -(phoneHalf + gapFromPhone + groupSpan * 0.45),
            -(phoneHalf + gapFromPhone + groupSpan * 0.75),
          ];
          const rightXs = [
            +(phoneHalf + gapFromPhone + groupSpan * 0.15),
            +(phoneHalf + gapFromPhone + groupSpan * 0.45),
            +(phoneHalf + gapFromPhone + groupSpan * 0.75),
          ];
          const yInner = 72;
          const yMid = 52;
          const yOuter = 34;

          const desktopNodes: AvatarNode[] = [
            {
              src: AVATARS_DESKTOP[0],
              x: leftXs[0],
              y: yInner,
              delay: 100,
              key: "av-0",
              dx: 0 - leftXs[0],
              dy: targetYInDecor - yInner,
            },
            {
              src: AVATARS_DESKTOP[1],
              x: leftXs[1],
              y: yMid,
              delay: 150,
              key: "av-1",
              dx: 0 - leftXs[1],
              dy: targetYInDecor - yMid,
            },
            {
              src: AVATARS_DESKTOP[2],
              x: leftXs[2],
              y: yOuter,
              delay: 200,
              key: "av-2",
              dx: 0 - leftXs[2],
              dy: targetYInDecor - yOuter,
            },
            {
              src: AVATARS_DESKTOP[3],
              x: rightXs[0],
              y: yInner,
              delay: 100,
              key: "av-3",
              dx: 0 - rightXs[0],
              dy: targetYInDecor - yInner,
            },
            {
              src: AVATARS_DESKTOP[4],
              x: rightXs[1],
              y: yMid,
              delay: 150,
              key: "av-4",
              dx: 0 - rightXs[1],
              dy: targetYInDecor - yMid,
            },
            {
              src: AVATARS_DESKTOP[5],
              x: rightXs[2],
              y: yOuter,
              delay: 200,
              key: "av-5",
              dx: 0 - rightXs[2],
              dy: targetYInDecor - yOuter,
            },
          ];

          return (
            <VAvatars
              nodes={desktopNodes}
              height={yInner + 48}
              phase={phase}
              moveMs={1600}
              enterMs={1500}
              fadeMs={900}
            />
          );
        }

        // MOBILE — raised a bit
        const mobileY = 30; // was 50
        const leftX = -(phoneHalf/2 + gapFromPhone + 1);
        const centerX = 0;
        const rightX = +(phoneHalf/2 + gapFromPhone + 1);

        const mobileNodes: AvatarNode[] = [
          {
            src: AVATARS_MOBILE[0],
            x: leftX,
            y: mobileY,
            delay: 80,
            key: "m-0",
            dx: 0 - leftX,
            dy: targetYInDecor - mobileY,
          },
          {
            src: AVATARS_MOBILE[1],
            x: centerX,
            y: mobileY - 4,
            delay: 130,
            key: "m-1",
            dx: 0,
            dy: targetYInDecor - (mobileY - 4),
          },
          {
            src: AVATARS_MOBILE[2],
            x: rightX,
            y: mobileY,
            delay: 180,
            key: "m-2",
            dx: 0 - rightX,
            dy: targetYInDecor - mobileY,
          },
        ];

        return (
          <VAvatars
            nodes={mobileNodes}
            height={mobileY + 48}
            phase={phase}
            moveMs={1500}
            enterMs={1200}
            fadeMs={850}
          />
        );
      }}
    />
  );
}
