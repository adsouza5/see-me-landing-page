import fs from "fs";
import path from "path";

type Dict = Record<string, any>;

const root = path.resolve(process.cwd(), "../"); // repo root (site is a subfolder)

function readJson(relPath: string): any {
  const p = path.join(root, relPath);
  let raw = fs.readFileSync(p, "utf8");
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  // or: raw = raw.replace(/^\uFEFF/, "");
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
  const copy   = readJson("specs/copy.json");
  const ui     = readJson("specs/ui_spec.json");
  const ctx    = { ...tokens, copy };
  const resolved = resolveRefs(ui, ctx);
  const hero = resolved.hero;

  return {
    title: hero.header.title as string,
    subtitle: hero.header.subtitle as string,
    scrimOpacity: Number(hero.background.overlayOpacity ?? 0),

    phoneWidth: Number(hero.centerpiece.width),
    badgeWidth: Number(hero.badge.width),

    heroTopGap: Number(hero.layout?.heroTopGap ?? tokens.spacing?.heroTopGap ?? 96),
    headlineGap: Number(hero.layout?.headlineGap ?? tokens.spacing?.headlineGap ?? 12),
    phoneTopGap: Number(hero.layout?.phoneTopGap ?? tokens.spacing?.phoneTopGap ?? 64),
    phoneToBadgeGap: Number(hero.layout?.phoneToBadgeGap ?? tokens.spacing?.phoneToBadgeGap ?? 72),
    bottomPad: Number(hero.layout?.bottomPad ?? tokens.spacing?.bottomPad ?? 56),


    // background tuning
    bgScale: Number(hero.background.scale ?? tokens.background?.scale ?? 1),
    bgPosX: Number(hero.background.posX ?? tokens.background?.posX ?? 50),
    bgPosY: Number(hero.background.posY ?? tokens.background?.posY ?? 50),

    // NEW: exact font sizes / line heights from tokens
    h1Px: Number(tokens.typography?.h1?.px ?? 64.94),
    h2Px: Number(tokens.typography?.h2?.px ?? 48.7),
    h1Line: Number(tokens.typography?.h1?.lineHeight ?? 1.05),
    h2Line: Number(tokens.typography?.h2?.lineHeight ?? 1.15),
    h1Weight: Number(tokens.typography?.h1?.weight ?? 700),
    h2Weight: Number(tokens.typography?.h2?.weight ?? 400),
  };
}
