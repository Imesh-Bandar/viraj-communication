import JsBarcode from "jsbarcode";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceiptActions } from "@/components/ReceiptActions";
import { getSession } from "@/lib/auth";
import { money } from "@/lib/format";
import { Lang, translate } from "@/lib/i18n";
import { getSale, SaleLine } from "@/services/sales";
import { getSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> };

const billDate = (value: Date) =>
  value.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Colombo",
  });

/** Short bill for a thermal printer. No fixed page size: a forced small page gets centred in the middle of larger paper. */
export default async function ReceiptPage({ params, searchParams }: Props) {
  if (!(await getSession())) redirect("/login");
  const { id } = await params;
  const { print } = await searchParams;
  const [sale, shop] = await Promise.all([getSale(id), getSettings()]);
  const lang: Lang = (await cookies()).get("lang")?.value === "si" ? "si" : "en";
  const tr = (key: string) => translate(lang, key);
  const rs = (value: number) => money(value, shop.currency);
  const amount = (value: number) => money(value, "").trim();
  const small = shop.receiptWidth === "58";
  const payment = tr(sale.method === "credit" ? "Nayapotha" : sale.method === "card" ? "Card" : "Cash");

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-slate-100 py-6 print:block print:min-h-0 print:bg-white print:p-0">
      <ReceiptActions autoPrint={print === "1" && shop.autoPrint} />

      {/* Thermal printers cannot print to the paper edge, so the bill is narrower than the roll. */}
      <div
        id="receipt"
        className="mx-auto box-border bg-white px-1 py-3 leading-snug text-black shadow print:shadow-none"
        style={{
          width: small ? "48mm" : "72mm", fontSize: small ? 11 : 12.5,
          fontFamily: '"Courier New", Courier, var(--font-sinhala), monospace',
        }}
      >
        <header className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {shop.logo && <img src={shop.logo} alt="" className="mx-auto mb-1 max-h-14" />}
          <p className="text-[1.35em] font-bold uppercase">{shop.shopName}</p>
          {shop.tagline && <p className="font-bold">{shop.tagline}</p>}
          {shop.address && <p>{shop.address}</p>}
          {shop.phone && <p>Tel: {shop.phone}</p>}
        </header>

        <Dashed />
        <div className="flex justify-between gap-2">
          <p>{tr("Invoice")}: <b>#{sale.invoiceNo}</b></p>
          <p className="shrink-0 text-right">{billDate(sale.createdAt).split(", ")[0]}<br />{billDate(sale.createdAt).split(", ")[1]}</p>
        </div>
        <div className="flex justify-between gap-2">
          <p>{tr("Cashier")}: {sale.userName}</p>
          <p className="shrink-0">{tr("Pay")}: <b className="uppercase">{payment}</b></p>
        </div>
        {sale.customerName && <p>{tr("Customer")}: {sale.customerName}</p>}
        {sale.status === "void" && <p className="text-center font-bold">*** {tr("Cancelled")} ***</p>}

        <Dashed />
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-right font-bold">
              <th className="text-left">{tr("Item")}</th>
              <th className="w-[15%]">{tr("Qty")}</th>
              <th className="w-[24%]">{tr("Price")}</th>
              <th className="w-[26%]">{tr("Total")}</th>
            </tr>
            <tr><td colSpan={4}><Dashed /></td></tr>
          </thead>
          <tbody>
            {(sale.lines as (SaleLine & { code?: string | null })[]).flatMap((line, index) => [
              <tr key={`${index}-name`}><td colSpan={4} className="pt-0.5 font-bold">{line.name}</td></tr>,
              <tr key={`${index}-amount`} className="text-right">
                <td className="text-left text-[0.85em]">{line.code}</td>
                <td>{line.qty}</td>
                <td>{amount(line.price)}</td>
                <td className="font-bold">{amount(line.total)}</td>
              </tr>,
            ])}
          </tbody>
        </table>

        <Dashed />
        <Row label={tr("Subtotal")} value={rs(sale.subtotal)} />
        {sale.discount > 0 && <Row label={tr("Discount")} value={`-${rs(sale.discount)}`} />}
        <div className="my-1 flex justify-between gap-2 border-y border-black py-1 text-[1.2em] font-bold">
          <span className="uppercase">{tr("Net Total")}:</span><span>{rs(sale.total)}</span>
        </div>
        {sale.method === "cash" && (
          <>
            <Row label={tr("Amount Tendered")} value={rs(sale.tendered)} />
            <Row label={tr("Balance / Change")} value={rs(sale.change)} />
          </>
        )}
        {sale.method === "card" && <Row label={tr("Paid by card")} value={rs(sale.paid)} />}
        {sale.method === "credit" && (
          <>
            <Row label={tr("Paid")} value={rs(sale.paid)} />
            <Row label={tr("Nayapotha")} value={rs(sale.credit)} />
          </>
        )}

        <Barcode value={sale.invoiceNo} />
        <footer className="mt-1 text-center">
          <p>{shop.receiptFooter}</p>
          <p className="text-[0.85em]">System powered by Viraj POS</p>
        </footer>
      </div>
    </div>
  );
}

function Dashed() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return <p className="flex justify-between gap-2"><span>{label}:</span><span>{value}</span></p>;
}

/** Code 128 drawn as plain SVG bars, so it is ready before the print window opens. */
function Barcode({ value }: { value: string }) {
  const result: { encodings?: { data: string }[] } = {};
  JsBarcode(result, value, { format: "CODE128" });
  const bars = result.encodings?.[0].data ?? "";
  return (
    <div className="mt-2 text-center">
      <svg viewBox={`0 0 ${bars.length} 40`} preserveAspectRatio="none" className="mx-auto h-11 w-[85%]" role="img" aria-label={value}>
        {[...bars].map((bit, x) => bit === "1" && <rect key={x} x={x} width="1" height="40" fill="#000" shapeRendering="crispEdges" />)}
      </svg>
      <p className="text-[0.85em] font-bold">{value}</p>
    </div>
  );
}
