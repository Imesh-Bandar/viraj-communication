"use client";

import Link from "next/link";
import { useState } from "react";
import { useFeedback } from "@/components/feedback";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, Empty, Input, Loading, PageHeader, Table } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { dateTime, today } from "@/lib/format";
import { t } from "@/lib/i18n";

type Sale = { _id: string; invoiceNo: string; createdAt: string; customerName: string | null; userName: string; method: string; total: number; status: string };

export default function BillHistoryPage() {
  const { rs, isAdmin } = useShop();
  const feedback = useFeedback();
  const [date, setDate] = useState(today());
  const { data: sales, error, reload } = useApi<Sale[]>(`/api/sales?from=${date}&to=${date}`);

  const cancel = async (sale: Sale) => {
    const yes = await feedback.confirm({
      title: t("Cancel {bill}?", { bill: sale.invoiceNo }), message: t("Stock goes back and any Nayapotha debt from this bill is removed."), confirmText: t("Cancel Bill"), danger: true,
    });
    if (!yes) return;
    try {
      await api(`/api/sales/${sale._id}/void`, "POST");
      feedback.success(t("Bill cancelled."));
      reload();
    } catch (e) { feedback.error((e as Error).message); }
  };

  return (
    <>
      <PageHeader title={t("Bill History")} action={<Input type="date" aria-label={t("Date")} className="w-auto" value={date} onChange={(e) => setDate(e.target.value)} />} />
      <Card>
        {!sales ? <Loading error={error} /> : sales.length === 0 ? <Empty>{t("No bills on this day.")}</Empty> : (
          <Table headers={["Bill", "Time", "Customer", "Payment", "Cashier", "Total", ""]}>
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td className="font-medium">{sale.invoiceNo}</td>
                <td className="whitespace-nowrap text-slate-500">{dateTime(sale.createdAt)}</td>
                <td>{sale.customerName ?? t("Walk-in")}</td>
                <td className="capitalize">{t(sale.method === "credit" ? "Nayapotha" : sale.method === "card" ? "Card" : "Cash")}</td>
                <td>{sale.userName}</td>
                <td className="whitespace-nowrap">{rs(sale.total)}</td>
                <td className="whitespace-nowrap">
                  <Link href={`/receipt/${sale._id}`} className="mr-3 text-brand-600 hover:underline">{t("View")}</Link>
                  {sale.status === "void" ? <Badge tone="red">{t("Cancelled")}</Badge>
                    : isAdmin && <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => cancel(sale)}>{t("Cancel")}</Button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
