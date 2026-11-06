import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceiptActions } from "@/components/ReceiptActions";
import { getSession } from "@/lib/auth";
import { dateTime, money } from "@/lib/format";
import { Lang, translate } from "@/lib/i18n";
import { getSale, SaleLine } from "@/services/sales";
import { getSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> };

/** Short bill sized for a 58mm or 80mm thermal printer. */
export default async function ReceiptPage({ params, searchParams }: Props) {
  if (!(await getSession())) redirect("/login");
  const { id } = await params;
  const { print } = await searchParams;
  const [sale, shop] = await Promise.all([getSale(id), getSettings()]);
  const lang: Lang = (await cookies()).get("lang")?.value === "si" ? "si" : "en";
  const tr = (key: string) => translate(lang, key);
  const rs = (value: number) => money(value, shop.currency);
  const amount = (value: number) => money(value, "").trim();

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-slate-100 py-6 print:block print:bg-white print:p-0">
      <style>{`@page { size: ${shop.receiptWidth}mm auto; margin: 0; }`}</style>
      <ReceiptActions autoPrint={print === "1" && shop.autoPrint} />

      <div className="bg-white p-3 font-mono text-[12px] leading-snug text-black shadow print:shadow-none" style={{ width: `${shop.receiptWidth}mm` }}>
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shop.logo && <img src={shop.logo} alt="" className="mx-auto mb-1 max-h-14" />}
          <p className="text-[15px] font-bold">{shop.shopName}</p>
          {shop.address && <p>{shop.address}</p>}
          {shop.phone && <p>{tr("Phone")}: {shop.phone}</p>}
        </div>

        <div className="my-2 border-t border-dashed border-black" />
        <p>{tr("Bill")}: {sale.invoiceNo}</p>
        <p>{dateTime(sale.createdAt, lang)}</p>
        <p>{tr("Cashier")}: {sale.userName}</p>
        {sale.customerName && <p>{tr("Customer")}: {sale.customerName}</p>}
        {sale.status === "void" && <p className="text-center font-bold">*** {tr("Cancelled")} ***</p>}
        <div className="my-2 border-t border-dashed border-black" />

        {(sale.lines as SaleLine[]).map((line, index) => (
          <div key={index} className="mb-1">
            <p>{line.name}</p>
            <p className="flex justify-between"><span>{line.qty} x {amount(line.price)}</span><span>{amount(line.total)}</span></p>
          </div>
        ))}

        <div className="my-2 border-t border-dashed border-black" />
        {sale.discount > 0 && (
          <>
            <Row label={tr("Subtotal")} value={rs(sale.subtotal)} />
            <Row label={tr("Discount")} value={`-${rs(sale.discount)}`} />
          </>
        )}
        <p className="flex justify-between text-[14px] font-bold"><span>{tr("Total")}</span><span>{rs(sale.total)}</span></p>
        {sale.method === "card" && <Row label={tr("Paid by card")} value={rs(sale.paid)} />}
        {sale.method === "cash" && (
          <>
            <Row label={tr("Cash")} value={rs(sale.tendered)} />
            <Row label={tr("Change")} value={rs(sale.change)} />
          </>
        )}
        {sale.method === "credit" && (
          <>
            <Row label={tr("Paid")} value={rs(sale.paid)} />
            <Row label={tr("Nayapotha")} value={rs(sale.credit)} />
          </>
        )}

        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center">{shop.receiptFooter}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <p className="flex justify-between"><span>{label}</span><span>{value}</span></p>;
}
