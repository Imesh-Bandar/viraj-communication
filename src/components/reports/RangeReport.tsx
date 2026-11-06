"use client";

import { BookOpen, Package, Printer, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, Empty, Input, Loading, Stat, Table } from "@/components/ui";
import { useApi } from "@/lib/client";
import { today } from "@/lib/format";
import { t } from "@/lib/i18n";

/* eslint-disable @typescript-eslint/no-explicit-any */
const METHOD_NAMES: Record<string, string> = { cash: t("Cash"), card: t("Card"), credit: t("Nayapotha") };

export function RangeReport() {
  const { rs } = useShop();
  const [from, setFrom] = useState(`${today().slice(0, 8)}01`);
  const [to, setTo] = useState(today());
  const { data, error } = useApi<any>(`/api/reports?from=${from}&to=${to}`);

  return (
    <>
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <Input type="date" aria-label={t("From")} className="w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-sm text-slate-500">{t("to")}</span>
        <Input type="date" aria-label={t("To")} className="w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="secondary" className="ml-auto" onClick={() => window.print()}><Printer className="size-4" /> {t("Print")}</Button>
      </div>

      {!data ? <Loading error={error} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Stat label={t("Sales")} value={rs(data.totals.total)} icon={<Wallet />} />
            <Stat label={t("Profit")} value={rs(data.totals.profit)} icon={<TrendingUp />} tone="emerald" />
            <Stat label={t("Bills")} value={data.totals.bills} icon={<ReceiptText />} />
            <Stat label={t("Given on credit")} value={rs(data.totals.credit)} icon={<BookOpen />} tone="amber" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card title={t("Daily sales")}>
              {data.daily.length === 0 ? <Empty>{t("No sales in these dates.")}</Empty> : (
                <Table headers={["Date", "Bills", "Sales", "Profit"]}>
                  {data.daily.map((d: any) => <tr key={d._id}><td>{d._id}</td><td>{d.bills}</td><td>{rs(d.total)}</td><td>{rs(d.profit)}</td></tr>)}
                </Table>
              )}
            </Card>
            <Card title={t("Payment types")}>
              {data.methods.length === 0 ? <Empty>{t("No sales in these dates.")}</Empty> : (
                <Table headers={["Type", "Bills", "Total"]}>
                  {data.methods.map((m: any) => <tr key={m._id}><td>{METHOD_NAMES[m._id]}</td><td>{m.bills}</td><td>{rs(m.total)}</td></tr>)}
                </Table>
              )}
            </Card>
            <Card title={t("Top selling")}>
              {data.topItems.length === 0 ? <Empty>{t("No sales in these dates.")}</Empty> : (
                <Table headers={["Item", "Qty", "Sales"]}>
                  {data.topItems.map((i: any) => <tr key={i._id}><td>{i._id}</td><td>{i.qty}</td><td>{rs(i.total)}</td></tr>)}
                </Table>
              )}
            </Card>
            <Card title={t("Gas & Water sales")}>
              {data.gasWater.length === 0 ? <Empty>{t("No gas or water sales in these dates.")}</Empty> : (
                <Table headers={["Product", "Qty", "Sales"]}>
                  {data.gasWater.map((i: any) => <tr key={i._id}><td>{i._id}</td><td>{i.qty}</td><td>{rs(i.total)}</td></tr>)}
                </Table>
              )}
            </Card>
            <Card title={t("Nayapotha balances (today)")}>
              <p className="mb-3 text-sm text-slate-500">{t("Total to collect:")} <b className="text-slate-800">{rs(data.credit.total)}</b></p>
              {data.debtors.length === 0 ? <Empty>{t("Nobody owes the shop.")}</Empty> : (
                <Table headers={["Customer", "Phone", "Owes"]}>
                  {data.debtors.map((c: any) => <tr key={c._id}><td>{c.name}</td><td>{c.phone || "-"}</td><td>{rs(c.balance)}</td></tr>)}
                </Table>
              )}
            </Card>
            <Card title={t("Stock (today)")}>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Stat label={t("Value at cost")} value={rs(data.stock.cost)} icon={<Package />} />
                <Stat label={t("Value at selling price")} value={rs(data.stock.retail)} icon={<Package />} tone="emerald" />
              </div>
              {data.lowStock.length === 0 ? <Empty>{t("No low stock items.")}</Empty> : (
                <Table headers={["Low stock item", "Left"]}>
                  {data.lowStock.map((i: any) => <tr key={i._id}><td>{i.name}</td><td><Badge tone={i.stock <= 0 ? "red" : "amber"}>{i.stock}</Badge></td></tr>)}
                </Table>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
