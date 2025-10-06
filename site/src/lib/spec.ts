import fs from "fs";
import path from "path";

// ---------- Types ----------
type Cue = { start: number; end?: number; heading: string; subheading: string };
export type Timeline = {
  src?: string;       // normalized to /assets/hero.mp4 if present
  fadeMs?: number;
  duration?: number;
  cues: Cue[];
};

type Tokens = {
  colors?: Record<string, string>;
  radii?: Record<string, string | number>;
  spacing?: {
    heroTopGap?: number;
    headlineGap?: number;
    phoneTopGap?: number;
    phoneToBadgeGap?: number;
    bottomPad?: number;
    phoneWidth?: number;
    badgeWidth?: number;
    phoneImage?: { w?: number; h?: number };
    phoneScreenInsetBase?: { top: number; right: number; bottom: number; left: number };
    phoneScreenRadiusBase?: number;
    phoneAspect?: number;
  };
  background?: { scale?: number; posX?: number; posY?: number; offsetYPx?: number };
  typography?: {
    h1?: { px?: number; weight?: number; lineHeight?: number };
    h2?: { px?: number; weight?: number; lineHeight?: number };
  };
};

type Copy = Record<string, unknown>;

type UISpec = {
  hero: {
    background: {
      overlayOpacity?: number;
      scale?: number;
      posX?: number;
      posY?: number;
      offsetYPx?: number;
    };
    header: { title: string; subtitle: string };
    centerpiece: { width: number };
    badge: { width: number; ratioToPhone?: number };
    layout?: {
      heroTopGap?: number;
      headlineGap?: number;
      phoneTopGap?: number;
      phoneToBadgeGap?: number;
      bottomPad?: number;
    };
    tuning?: { lockPhoneWidth?: boolean; phoneWidthLockedPx?: number };
  };
};

// The optional timeline JSON file format
interface TimelineFile {
  video?: string;     // e.g. "public/assets/hero.mp4"
  src?: string;       // alternative key, we normalize either to /assets/hero.mp4
  fadeMs?: number;
  duration?: number;
  cues?: Cue[];
}

// ---------- FS helpers ----------
const root = path.resolve(process.cwd(), "../"); // repo root

function readJson<T>(relPath: string): T {
  const p = path.join(root, relPath);
  let raw = fs.readFileSync(p, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip BOM
  return JSON.parse(raw) as T;
}

function resolveRefs(obj: unknown, ctx: Record<string, unknown>): unknown {
  if (typeof obj === "string" && obj.startsWith("$")) {
    const keys = obj.slice(1).split(".");
    let acc: unknown = ctx;
    for (const k of keys) {
      if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
        acc = (acc as Record<string, unknown>)[k];
      } else {
        throw new Error(`Unresolved ref: ${obj}`);
      }
    }
    return acc;
  }
  if (Array.isArray(obj)) return obj.map((v) => resolveRefs(v, ctx));
  if (obj && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = resolveRefs(v, ctx);
    return out;
  }
  return obj;
}

// Normalizes "public/assets/hero.mp4" -> "/assets/hero.mp4"
function normalizePublicPath(p?: string): string | undefined {
  if (!p) return undefined;
  return p.startsWith("/assets/") ? p : `/${p.replace(/^public\//, "")}`;
}

export function loadHeroProps() {
  const tokens = readJson<Tokens>("specs/tokens.json");
  const copy = readJson<Copy>("specs/copy.json");
  const ui = readJson<UISpec>("specs/ui_spec.json");

  // Optional: timeline JSON (may not exist)
  let timelineJson: TimelineFile | null = null;
  try {
    timelineJson = readJson<TimelineFile>("specs/copy_timeline.json");
  } catch {
    timelineJson = null;
  }

  const ctx = { ...tokens, copy };
  const resolved = resolveRefs(ui, ctx) as UISpec;
  const hero = resolved.hero;

  // Phone width (lock optional)
  const lockPhone = Boolean(hero?.tuning?.lockPhoneWidth);
  const lockedPx = hero?.tuning?.phoneWidthLockedPx;
  const phoneWidth = lockPhone
    ? Number(lockedPx ?? tokens.spacing?.phoneWidth ?? hero.centerpiece.width)
    : Number(hero.centerpiece.width);

  // Badge optional ratio
  const ratioToPhone = Number(hero?.badge?.ratioToPhone ?? 0);
  const badgeWidth =
    ratioToPhone > 0 ? Math.round(phoneWidth * ratioToPhone) : Number(hero.badge.width);

  // Phone geometry scaling for screen inset
  const phoneW = Number(tokens.spacing?.phoneImage?.w ?? 176);
  const phoneH = Number(tokens.spacing?.phoneImage?.h ?? 381);
  const scale = (Number(tokens.spacing?.phoneWidth) || 300) / phoneW;
  const baseInset =
    tokens.spacing?.phoneScreenInsetBase ?? { top: 22, right: 12, bottom: 58, left: 12 };
  const baseRadius = Number(tokens.spacing?.phoneScreenRadiusBase ?? 28);

  // Heading block height (reserve space so phone never collides)
  const headingBlockHeight =
    Math.ceil((tokens.typography?.h1?.px ?? 64.94) * (tokens.typography?.h1?.lineHeight ?? 1.05)) +
    Math.ceil(Number(tokens.spacing?.headlineGap ?? 12)) +
    Math.ceil((tokens.typography?.h2?.px ?? 48.7) * (tokens.typography?.h2?.lineHeight ?? 1.15));

  // Build timeline consistently for types/ESLint:
  // - always include cues: []
  // - normalize src to /assets/...
  let timeline: Timeline;
  if (timelineJson) {
    const srcNorm =
      normalizePublicPath(timelineJson.src) ||
      normalizePublicPath(timelineJson.video) ||
      "/assets/hero.mp4";
    timeline = {
      src: srcNorm,
      fadeMs: Number(timelineJson.fadeMs ?? 500),
      duration: typeof timelineJson.duration === "number" ? timelineJson.duration : undefined,
      cues: Array.isArray(timelineJson.cues) ? timelineJson.cues : [],
    };
  } else {
    // No file: still return a timeline with empty cues so consumers can rely on the shape.
    timeline = { src: "/assets/hero.mp4", fadeMs: 500, cues: [] };
  }

  return {
    title: hero.header.title,
    subtitle: hero.header.subtitle,
    scrimOpacity: Number(hero.background.overlayOpacity ?? 0),

    headingBlockHeight,
    phoneWidth: Number(tokens.spacing?.phoneWidth ?? 300),
    badgeWidth: Number(tokens.spacing?.badgeWidth ?? badgeWidth),

    heroTopGap: Number(hero.layout?.heroTopGap ?? tokens.spacing?.heroTopGap ?? 96),
    headlineGap: Number(hero.layout?.headlineGap ?? tokens.spacing?.headlineGap ?? 12),
    phoneTopGap: Number(hero.layout?.phoneTopGap ?? tokens.spacing?.phoneTopGap ?? 64),
    phoneToBadgeGap: Number(hero.layout?.phoneToBadgeGap ?? tokens.spacing?.phoneToBadgeGap ?? 72),
    bottomPad: Number(hero.layout?.bottomPad ?? tokens.spacing?.bottomPad ?? 56),

    // background tuning
    bgScale: Number(hero.background.scale ?? tokens.background?.scale ?? 1),
    bgPosX: Number(hero.background.posX ?? tokens.background?.posX ?? 50),
    bgPosY: Number(hero.background.posY ?? tokens.background?.posY ?? 50),
    bgOffsetY: Number(hero.background.offsetYPx ?? tokens.background?.offsetYPx ?? 0),

    // typography
    h1Px: Number(tokens.typography?.h1?.px ?? 64.94),
    h2Px: Number(tokens.typography?.h2?.px ?? 48.7),
    h1Line: Number(tokens.typography?.h1?.lineHeight ?? 1.05),
    h2Line: Number(tokens.typography?.h2?.lineHeight ?? 1.15),
    h1Weight: Number(tokens.typography?.h1?.weight ?? 700),
    h2Weight: Number(tokens.typography?.h2?.weight ?? 400),

    // phone screen placement
    phoneAspect: Number(tokens.spacing?.phoneAspect ?? phoneH / phoneW),
    screenInsetTop: Math.round(baseInset.top * scale),
    screenInsetRight: Math.round(baseInset.right * scale),
    screenInsetBottom: Math.round(baseInset.bottom * scale),
    screenInsetLeft: Math.round(baseInset.left * scale),
    screenRadius: Math.round(baseRadius * scale),

    // timeline shape always present (cues at least [])
    timeline,
  };
}
