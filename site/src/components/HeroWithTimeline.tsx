// site/src/components/HeroWithTimeline.tsx
"use client";

import Hero from "@/components/Hero";
import TimedCopy from "@/components/TimedCopy";

export default function HeroWithTimeline({ props }: { props: any }) {
  const hasTimeline = !!props.timeline?.cues?.length;
  if (!hasTimeline) return <Hero {...props} />;

  return (
    <TimedCopy
      timeline={props.timeline}
      headingTopPx={props.heroTopGap}
      headingHeightPx={props.headingBlockHeight}
      renderBase={(mediaEl) => (
        <Hero
          {...props}
          suppressText
          centerpiece={mediaEl ?? <div className="absolute inset-0 bg-black/20" />}
        />
      )}
      // Static heading (no fade)
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
      // Subheading only: TimedCopy will fade this node in/out
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
    />
  );
}
