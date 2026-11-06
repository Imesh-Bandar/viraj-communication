"use client";

import { useState } from "react";
import { MonthlyReport } from "@/components/reports/MonthlyReport";
import { RangeReport } from "@/components/reports/RangeReport";
import { PageHeader } from "@/components/ui";
import { t } from "@/lib/i18n";

const TABS = [
  { key: "monthly", label: t("Monthly report") },
  { key: "range", label: t("Choose dates") },
] as const;

export default function ReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("monthly");

  return (
    <>
      <PageHeader
        title={t("Reports")} subtitle={t("See how the shop is doing.")}
        info={t("Cancelled bills are not counted. Use Monthly report for graphs, or Choose dates for any period.")}
      />
      <div className="no-print mb-6 flex gap-6 border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 pb-2 text-sm font-medium ${tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "monthly" ? <MonthlyReport /> : <RangeReport />}
    </>
  );
}
