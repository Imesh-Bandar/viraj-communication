"use client";

import { AlertTriangle, BookOpen, Flame, Package, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useShop } from "@/components/ShopContext";
import { Badge, Card, Empty, Loading, Stat, Table } from "@/components/ui";
import { useApi } from "@/lib/client";
import { dateTime, longDate } from "@/lib/format";
import { t } from "@/lib/i18n";

const QUICK_ACTIONS = [
  { href: "/billing", title: t("New Bill"), hint: t("Sell items to a customer"), icon: ReceiptText },
  { href: "/gas-water", title: t("Gas & Water"), hint: t("Sell a refill or check stock"), icon: Flame },
  { href: "/nayapotha", title: t("Nayapotha"), hint: t("Take a payment or see who owes"), icon: BookOpen },
  { href: "/inventory", title: t("Inventory"), hint: t("See items and stock"), icon: Package },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DashboardPage() {
  const { rs, isAdmin, user, shopName } = useShop();
  const { data, error } = useApi<any>("/api/dashboard");
  if (!data) return <Loading error={error} />;

  const bills = data.totals.bills;
  const low = data.lowStock.length;
  const summary = [
    bills ? t(bills === 1 ? "{n} bill made today." : "{n} bills made today.", { n: bills }) : t("No bills yet today."),
    low ? t(low === 1 ? "{n} item needs restocking." : "{n} items need restocking.", { n: low }) : t("Stock looks good."),
  ].join(" ");

  return (
    <>
      <section className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand-800 p-5 text-white sm:mb-6 sm:p-6">
        <div>
          <p className="text-sm text-brand-200">{longDate()}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{t("Hi {name}, welcome to {shop} POS system", { name: user.name, shop: shopName })}</h1>
          <p className="mt-1 text-sm text-brand-100">{summary}</p>
        </div>
        <Link href="/billing" className="hidden items-center gap-2 rounded-lg bg-white px-4 sm:inline-flex py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">
          <ReceiptText className="size-4" /> {t("New Bill")}
        </Link>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, title, hint, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors sm:flex-row sm:items-center sm:gap-3 hover:border-brand-400">
            <span className="w-fit rounded-lg bg-brand-50 p-2.5 text-brand-700"><Icon className="size-5" /></span>
            <span>
              <span className="block font-semibold text-slate-900">{title}</span>
              <span className="hidden text-sm text-slate-500 sm:block">{hint}</span>
            </span>
          </Link>
        ))}
      </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label={t("Today's sales")} value={rs(data.totals.total)} icon={<Wallet />} />
        <Stat label={t("Bills today")} value={data.totals.bills} icon={<ReceiptText />} tone="emerald" />
        {isAdmin && <Stat label={t("Today's profit")} info={t("Selling price minus cost, less discounts.")} value={rs(data.totals.profit)} icon={<TrendingUp />} tone="emerald" />}
        <Stat label={t("Nayapotha to collect")} info={t("Total money customers still owe the shop.")} value={rs(data.credit.total)} icon={<BookOpen />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title={t("Recent bills")} className="xl:col-span-2">
          {data.recent.length === 0 ? <Empty>{t("No bills yet.")}</Empty> : (
            <Table headers={["Bill", "Time", "Customer", "Total", ""]}>
              {data.recent.map((sale: any) => (
                <tr key={sale._id}>
                  <td className="font-medium">{sale.invoiceNo}</td>
                  <td className="whitespace-nowrap text-slate-500">{dateTime(sale.createdAt)}</td>
                  <td>{sale.customerName ?? t("Walk-in")}</td>
                  <td className="whitespace-nowrap">{rs(sale.total)} {sale.status === "void" && <Badge tone="red">{t("Cancelled")}</Badge>}</td>
                  <td><Link className="text-brand-600 hover:underline" href={`/receipt/${sale._id}`}>{t("View")}</Link></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title={t("Low stock")}>
            {data.lowStock.length === 0 ? <Empty>{t("All items are well stocked.")}</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.lowStock.map((item: any) => (
                  <li key={item._id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-500" /> {item.name}</span>
                    <Badge tone={item.stock <= 0 ? "red" : "amber"}>{t("{n} left", { n: item.stock })}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={t("Gas & Water stock")}>
            {data.gasWater.length === 0 ? <Empty>{t("No products added.")}</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.gasWater.map((p: any) => (
                  <li key={p._id} className="flex justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="text-slate-500">{t("{full} full, {empty} empty", { full: p.full, empty: p.empty })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
