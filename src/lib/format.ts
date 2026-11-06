import { getLang, Lang, SI_MONTHS } from "./i18n";

export const money = (value: number, currency = "Rs.") =>
  `${currency} ${(value ?? 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const ZONE = "Asia/Colombo";

/** "6 නොවැම්බර් 2026" in Sinhala, "6 Nov 2026" style in English. */
export function dateTime(value: string | Date, lang: Lang = getLang()) {
  const date = new Date(value);
  if (lang !== "si") return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: ZONE });
  const [year, month, day] = date.toLocaleDateString("en-CA", { timeZone: ZONE }).split("-").map(Number);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: ZONE });
  return `${day} ${SI_MONTHS[month - 1]} ${year}, ${time}`;
}

/** Today's heading on the home page. */
export function longDate(value: Date = new Date()) {
  if (getLang() !== "si") return value.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: ZONE });
  const [, month, day] = value.toLocaleDateString("en-CA", { timeZone: ZONE }).split("-").map(Number);
  return `${SI_MONTHS[month - 1]} ${day}`;
}

/** Name of a "YYYY-MM" month. */
export function monthName(key: string, style: "long" | "short" = "long") {
  const [year, month] = key.split("-").map(Number);
  if (getLang() === "si") return style === "long" ? `${year} ${SI_MONTHS[month - 1]}` : SI_MONTHS[month - 1];
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" });
}

/** Today as YYYY-MM-DD in Sri Lanka time. */
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
