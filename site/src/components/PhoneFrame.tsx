// site/src/components/PhoneFrame.tsx
import Image from "next/image";

type Insets = { top: number; right: number; bottom: number; left: number };

type PhoneFrameProps = {
  width: number;
  aspect: number;              // height / width of bezel image
  frameSrc?: string;
  screenInset: Insets;
  screenRadius?: number;
  children?: React.ReactNode;  // video/fallback
};

export default function PhoneFrame({
  width,
  aspect,
  frameSrc = "/assets/phone.png",
  screenInset,
  screenRadius = 24,
  children,
}: PhoneFrameProps) {
  const height = Math.round(width * aspect);

  return (
    <div
      className="relative isolate"                 // <-- create a local stacking context
      style={{ width, height, lineHeight: 0, overflow: "visible" }} // <-- never clip bezel
    >
      {/* Screen slot UNDER the bezel */}
      <div
        className="absolute z-40 overflow-hidden"  // video layer
        style={{
          top: screenInset.top,
          right: screenInset.right,
          bottom: screenInset.bottom,
          left: screenInset.left,
          borderRadius: screenRadius,
        }}
      >
        <div className="absolute inset-0">{children}</div>
      </div>

      {/* Bezel ON TOP of everything inside this frame */}
      <div className="absolute inset-0 z-50 pointer-events-none select-none">
        <Image
          src={frameSrc}
          alt="Phone frame"
          fill
          sizes={`${width}px`}
          priority
          style={{ objectFit: "contain", objectPosition: "center" }}
        />
      </div>
    </div>
  );
}
