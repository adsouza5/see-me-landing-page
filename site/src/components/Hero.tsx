import Image from "next/image";
import PhoneFrame from "./PhoneFrame";

type HeroProps = {
  title: string;
  subtitle: string;
  scrimOpacity: number;
  phoneWidth: number;
  badgeWidth: number;
  heroTopGap: number;
  headlineGap: number;
  phoneTopGap: number;
  phoneToBadgeGap: number;
  bottomPad: number;
  bgScale: number;
  bgPosX: number;
  bgPosY: number;
  bgOffsetY: number;

  h1Px: number;
  h2Px: number;
  h1Line: number;
  h2Line: number;
  h1Weight: number;
  h2Weight: number;

  // NEW: screen insets for placing content inside the phone bezel
  screenInsetTop: number;
  screenInsetRight: number;
  screenInsetBottom: number;
  screenInsetLeft: number;
  phoneAspect: number;
  centerpiece?: React.ReactNode;

  suppressText?: boolean;
  headingBlockHeight?: number;
  headingSlot?: React.ReactNode;

};

export default function Hero(p: HeroProps) {
  return (
    <section
      className="relative min-h-screen w-full text-white flex flex-col items-center"
      style={{ paddingBottom: p.bottomPad, overflow: "visible" }}
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* wrapper that we can translate in pixels */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${p.bgOffsetY}px) scale(${p.bgScale})`,
            transformOrigin: "center",
            willChange: "transform",
          }}
        >
          <Image
            src="/assets/clouds.png"
            alt=""
            fill
            priority
            style={{
              objectFit: "cover",
              objectPosition: `${p.bgPosX}% ${p.bgPosY}%`,
            }}
          />
        </div>
      </div>

      {/* optional scrim */}
      {p.scrimOpacity > 0 && (
        <div className="absolute inset-0" style={{ background: "black", opacity: p.scrimOpacity }} />
      )}

      {/* Headlines */}
      {p.suppressText ? (
        // Reserve vertical space so the phone never collides with text.
        <div
          className="relative z-40 w-full px-4 flex justify-center"
          style={{ paddingTop: p.heroTopGap, height: p.headingBlockHeight ?? 0 }}
        >
          {/* The slot content renders INSIDE the reserved block */}
          <div className="relative w-full max-w-[1100px] h-full text-center">
            {p.headingSlot}
          </div>
        </div>
      ) : (
        <div className="relative z-40 text-center px-4" style={{ paddingTop: p.heroTopGap }}>
          <h1 className="m-0" style={{ fontSize: `${p.h1Px}px`, lineHeight: p.h1Line, fontWeight: p.h1Weight }}>
            {p.title}
          </h1>
          <p
            className="m-0 opacity-90"
            style={{ marginTop: p.headlineGap, fontSize: `${p.h2Px}px`, lineHeight: p.h2Line, fontWeight: p.h2Weight }}
          >
            {p.subtitle}
          </p>
        </div>
      )}

      {/* Phone with video/content inside */}
      <div
        className="relative z-30"             // sit above background & scrim
        style={{ marginTop: p.phoneTopGap, overflow: "visible" }}  // do not clip bezel
      >
        <PhoneFrame
          width={p.phoneWidth}
          aspect={p.phoneAspect}
          screenInset={{
            top: p.screenInsetTop,
            right: p.screenInsetRight,
            bottom: p.screenInsetBottom,
            left: p.screenInsetLeft,
          }}
        >
          {p.centerpiece}
        </PhoneFrame>
      </div>

      {/* App Store badge */}
      <a
        className="relative z-30 pointer-events-auto"
        href="#"
        aria-label="Download on the App Store"
        style={{ marginTop: p.phoneToBadgeGap }}
      >
        <Image
          src="/assets/appstore-badge.png"
          alt="App Store"
          width={p.badgeWidth}
          height={p.badgeWidth * 0.3}
        />
      </a>
    </section>
  );
}
