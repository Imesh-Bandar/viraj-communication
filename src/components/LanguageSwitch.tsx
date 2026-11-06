"use client";

import { getLang, Lang, setLang } from "@/lib/i18n";

const LANGUAGES: { key: Lang; label: string }[] = [
  { key: "si", label: "සිංහල" },
  { key: "en", label: "English" },
];

export function LanguageSwitch() {
  const current = getLang();
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label="Language">
      {LANGUAGES.map(({ key, label }) => (
        <button
          key={key} lang={key} aria-pressed={current === key} onClick={() => current !== key && setLang(key)}
          className={`min-h-9 touch-manipulation rounded-md px-3 text-sm font-medium ${current === key ? "bg-brand-600 text-white" : "text-slate-600"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
