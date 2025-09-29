import fs from "fs";
import path from "path";

type Dict = Record<string, any>;

const root = path.resolve(process.cwd(), "../");

function readJson(relPath: string): any {
  const p = path.join(root, relPath);
  let raw = fs.readFileSync(p, "utf8");
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function resolveRefs(obj: any, ctx: Record<string, any>): any {
  if (typeof obj === "string" && obj.startsWith("$")) {
    const keys = obj.slice(1).split(".");
    const value = keys.reduce((acc, k) => acc?.[k], ctx);
    if (value === undefined) throw new Error(`Unresolved ref: ${obj}`);
    return value;
  }
  if (Array.isArray(obj)) return obj.map((v) => resolveRefs(v, ctx));
  if (obj && typeof obj === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = resolveRefs(v, ctx);
    return out;
  }
  return obj;
}

export function loadHeroProps() {
  const tokens = readJson("specs/tokens.json");
  const copy = readJson("specs/copy.json");
  const ui = readJson("specs/ui_spec.json");

  // NEW: timeline JSON for timestamped heading/subheading
  // (File is optional; if missing, you can add it later.)
  let timeline: any = null;
  try {
    timeline = readJson("specs/copy_timeline.json");
  } catch {
    // no-op; timeline stays null
  }

  const ctx = { ...tokens, copy };
  const resolved = resolveRefs(ui, ctx);
  const hero = resolved.hero;

  // Optional lock logic (safe if you aren't using it):
  const lockPhone = Boolean(hero?.tuning?.lockPhoneWidth);
  const lockedPx = hero?.tuning?.phoneWidthLockedPx;
  const phoneWidth = lockPhone
    ? Number(lockedPx ?? tokens.spacing?.phoneWidth ?? hero.centerpiece.width)
    : Number(hero.centerpiece.width);

  // Optional badge ratio → width
  const ratioToPhone = Number(hero?.badge?.ratioToPhone ?? 0);
  const badgeWidth = ratioToPhone > 0
    ? Math.round(phoneWidth * ratioToPhone)
    : Number(hero.badge.width);

  const phoneW = Number(tokens.spacing?.phoneImage?.w ?? 176);
  const phoneH = Number(tokens.spacing?.phoneImage?.h ?? 381);
  const scale = (Number(tokens.spacing?.phoneWidth) || 300) / phoneW;

  const baseInset = tokens.spacing?.phoneScreenInsetBase ?? { top: 22, right: 12, bottom: 58, left: 12 };
  const baseRadius = Number(tokens.spacing?.phoneScreenRadiusBase ?? 28);

//heading block height
  const headingBlockHeight =
  Math.ceil((tokens.typography?.h1?.px ?? 64.94) * (tokens.typography?.h1?.lineHeight ?? 1.05)) +
  Math.ceil(Number(tokens.spacing?.headlineGap ?? 12)) +
  Math.ceil((tokens.typography?.h2?.px ?? 48.7) * (tokens.typography?.h2?.lineHeight ?? 1.15));

  return {
    title: hero.header.title as string,
    subtitle: hero.header.subtitle as string,
    scrimOpacity: Number(hero.background.overlayOpacity ?? 0),

    headingBlockHeight,
    phoneWidth: Number(tokens.spacing?.phoneWidth ?? 300),
    badgeWidth: Number(tokens.spacing?.badgeWidth ?? 180),

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

    // exact font sizes / line heights from tokens
    h1Px: Number(tokens.typography?.h1?.px ?? 64.94),
    h2Px: Number(tokens.typography?.h2?.px ?? 48.7),
    h1Line: Number(tokens.typography?.h1?.lineHeight ?? 1.05),
    h2Line: Number(tokens.typography?.h2?.lineHeight ?? 1.15),
    h1Weight: Number(tokens.typography?.h1?.weight ?? 700),
    h2Weight: Number(tokens.typography?.h2?.weight ?? 400),


    phoneAspect: Number(tokens.spacing?.phoneAspect ?? phoneH / phoneW),
    screenInsetTop: Math.round(baseInset.top * scale),
    screenInsetRight: Math.round(baseInset.right * scale),
    screenInsetBottom: Math.round(baseInset.bottom * scale),
    screenInsetLeft: Math.round(baseInset.left * scale),
    screenRadius: Math.round(baseRadius * scale),
    

    // timeline stays as you already added
    timeline: timeline && {
      src: (timeline.video as string) || "public/assets/hero.mp4",
      fadeMs: Number(timeline.fadeMs ?? 500),
      cues: (timeline.cues as Array<{ start: number; end?: number; heading: string; subheading: string }>) || [],
    },
  };
}
