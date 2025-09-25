import Image from "next/image";

type HeroProps = {
  title: string;
  subtitle: string;
  scrimOpacity: number;
  phoneWidth: number;
  badgeWidth: number;
  heroTopGap: number;
  headlineGap: number;
  bottomPad: number;
  phoneTopGap: number;
  phoneToBadgeGap: number;
  bgScale: number;
  bgPosX: number;
  bgPosY: number;

  // NEW
  h1Px: number;
  h2Px: number;
  h1Line: number;
  h2Line: number;
  h1Weight: number;
  h2Weight: number;
};

export default function Hero(p: HeroProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden text-white flex flex-col items-center"
    style={{ paddingBottom: p.bottomPad }}>
      {/* Background */}
      <Image
        src="/assets/clouds.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: "cover",
          objectPosition: `${p.bgPosX}% ${p.bgPosY}%`,
          transform: `scale(${p.bgScale})`,
          transformOrigin: "center"
        }}
      />

      {/* optional scrim */}
      {p.scrimOpacity > 0 && (
        <div className="absolute inset-0" style={{ background: "black", opacity: p.scrimOpacity }} />
      )}

      {/* Headlines */}
      <div className="relative z-10 text-center px-4" style={{ paddingTop: p.heroTopGap }}>
        <h1
          className="m-0"
          style={{
            fontSize: `${p.h1Px}px`,
            lineHeight: p.h1Line,
            fontWeight: p.h1Weight
          }}
        >
          {p.title}
        </h1>
        <p
          className="m-0 opacity-90"
          style={{
            marginTop: p.headlineGap,
            fontSize: `${p.h2Px}px`,
            lineHeight: p.h2Line,
            fontWeight: p.h2Weight
          }}
        >
          {p.subtitle}
        </p>
      </div>

      {/* Phone */}
      <div className="relative z-10" style={{ marginTop: p.phoneTopGap }}>
        <Image
          src="/assets/phone.png"
          alt="App mock"
          width={p.phoneWidth}
          height={p.phoneWidth * 2}
          priority
        />
      </div>

      {/* App Store badge */}
      <a
        className="relative z-10"
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
