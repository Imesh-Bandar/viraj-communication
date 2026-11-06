import { PATTERNS, SI } from "./si";

export type Lang = "en" | "si";
type Vars = Record<string, string | number>;

const COOKIE = "lang";

/** The browser's language, read once from the cookie. The server always starts in English. */
const current: Lang = typeof document !== "undefined" && document.cookie.includes(`${COOKIE}=si`) ? "si" : "en";

export const getLang = () => current;

export function setLang(lang: Lang) {
  document.cookie = `${COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

/** Written out here because not every browser ships Sinhala month names. */
export const SI_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? "")) : text;

/** Translates with an explicit language. Server pages use this. */
export function translate(lang: Lang, key: string, vars?: Vars) {
  return fill(lang === "si" ? SI[key] ?? key : key, vars);
}

/** Text is written in English in the code; Sinhala comes from si.ts. Missing text stays in English. */
export const t = (key: string, vars?: Vars) => translate(current, key, vars);

/** Server messages can hold names and amounts, so they are matched by pattern. */
export function translateMessage(message: string) {
  if (current !== "si") return message;
  if (SI[message]) return SI[message];
  for (const [pattern, text] of PATTERNS) {
    const match = pattern.exec(message);
    if (match) return text.replace(/\$(\d)/g, (_, n) => { const part = match[Number(n)]; return SI[part] ?? part; });
  }
  return message;
}
