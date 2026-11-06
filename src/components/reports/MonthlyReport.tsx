"use client";

import { Printer, ReceiptText, TrendingDown, TrendingUp, Wallet, BookOpen } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/components/ShopContext";
import { Button, Card, Empty, Input, Loading, Stat, Table } from "@/components/ui";
import { useApi } from "@/lib/client";
import { monthName, today } from "@/lib/format";
import { BarTrend } from "./BarTrend";
import { t } from "@/lib/i18n";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Metric = "total" | "profit" | "bills";

const METRICS: { key: Metric; label: string }[] = [
  { key: "total", label: t("Sales") }, { key: "profit", label: t("Profit") }, { key: "bills", label: t("Bills") },
];

/** "12% more than last month", or nothing when last month had no sales to compare. */
function change(now: number, before: number) {
  if (!before) return undefined;
  const percent = Math.round(((now - before) / Math.abs(before)) * 100);
  if (percent === 0) return t("Same as last month");
  return t(percent > 0 ? "{n}% more than last month" : "{n}% less than last month", { n: Math.abs(percent) });
}

export function MonthlyReport() {
  const { rs } = useShop();
  const [month, setMonth] = useState(today().slice(0, 7));
  const [metric, setMetric] = useState<Metric>("total");
  const { data, error } = useApi<any>(`/api/reports/monthly?month=${month}`);

  const format = (value: number) => (metric === "bills" ? String(value) : rs(value));
  const metricLabel = METRICS.find((m) => m.key === metric)!.label;

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Input type="month" aria-label={t("Month")} className="w-auto" value={month} max={today().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label={t("Show on graphs")}>
          {METRICS.map((m) => (
            <button
              key={m.key} onClick={() => setMetric(m.key)} aria-pressed={metric === m.key}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${metric === m.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" className="ml-auto" onClick={() => window.print()}><Printer className="size-4" /> {t("Print")}</Button>
      </div>

      {!data ? <Loading error={error} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Stat label={t("Sales")} value={rs(data.totals.total)} note={change(data.totals.total, data.previous.total)} icon={<Wallet />} />
            <Stat
              label={t("Profit")} value={rs(data.totals.profit)} note={change(data.totals.profit, data.previous.profit)}
              info={t("Selling price minus cost, less discounts. Custom items have no cost, so all of their price counts as profit.")}
              icon={data.totals.profit >= data.previous.profit ? <TrendingUp /> : <TrendingDown />} tone="emerald"
            />
            <Stat label={t("Bills")} value={data.totals.bills} note={change(data.totals.bills, data.previous.bills)} icon={<ReceiptText />} />
            <Stat label={t("Given on credit")} value={rs(data.totals.credit)} info={t("The part of this month's bills added to Nayapotha.")} icon={<BookOpen />} tone="amber" />
          </div>

          <Card title={t("{metric} each day in {month}", { metric: metricLabel, month: monthName(month) })}>
            {data.totals.bills === 0 ? <Empty>{t("No bills in {month}.", { month: monthName(month) })}</Empty> : (
              <BarTrend format={format} data={data.days.map((d: any) => ({ key: d.date, label: String(Number(d.date.slice(8))), value: d[metric] }))} />
            )}
          </Card>

          <Card title={t("{metric} for the last 12 months", { metric: metricLabel })} info={t("Click a bar to open that month.")}>
            <BarTrend
              format={format} highlight={month} onPick={setMonth}
              data={data.months.map((m: any) => ({ key: m.month, label: monthName(m.month, "short"), value: m[metric] }))}
            />
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title={t("Month by month")}>
              <Table headers={["Month", "Bills", "Sales", "Profit"]}>
                {[...data.months].reverse().map((m: any) => (
                  <tr key={m.month} className={m.month === month ? "font-semibold" : ""}>
                    <td>{monthName(m.month)}</td><td>{m.bills}</td><td className="whitespace-nowrap">{rs(m.total)}</td><td className="whitespace-nowrap">{rs(m.profit)}</td>
                  </tr>
                ))}
              </Table>
            </Card>
            <Card title={t("Top selling in {month}", { month: monthName(month) })}>
              {data.topItems.length === 0 ? <Empty>{t("Nothing sold this month.")}</Empty> : (
                <Table headers={["Item", "Qty", "Sales"]}>
                  {data.topItems.map((i: any) => <tr key={i._id}><td>{i._id}</td><td>{i.qty}</td><td className="whitespace-nowrap">{rs(i.total)}</td></tr>)}
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
