"use client";

import { History, Minus, PenLine, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFeedback } from "@/components/feedback";
import { Form, Values } from "@/components/form";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Empty, FormActions, Info, Input, Loading, Modal, PageHeader } from "@/components/ui";
import { PaymentFields, Payment } from "@/components/PaymentFields";
import { api, useApi } from "@/lib/client";
import { round2 } from "@/lib/format";
import { t } from "@/lib/i18n";

type Item = { _id: string; name: string; barcode: string | null; category: string; sellPrice: number; stock: number; reorderLevel: number; image: string | null };
type Line = { key: string; itemId?: string; name: string; price: number; qty: number; max?: number };

export default function BillingPage() {
  const { rs } = useShop();
  const feedback = useFeedback();
  const router = useRouter();
  const { data: items, error } = useApi<Item[]>("/api/items");
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paying, setPaying] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);

  // Keep the scanner ready on a counter PC, but do not pop up the keyboard on phones.
  const loaded = Boolean(items);
  useEffect(() => {
    if (loaded && window.matchMedia("(min-width: 1024px)").matches) document.getElementById("item-search")?.focus();
  }, [loaded]);

  const categories = useMemo(() => [...new Set((items ?? []).map((i) => i.category).filter(Boolean))].sort(), [items]);
  const shown = (items ?? []).filter((item) =>
    (!category || item.category === category) &&
    (!search || item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode === search));

  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.qty, 0));
  const total = round2(Math.max(0, subtotal - discount));
  const tooMuchDiscount = discount > subtotal && lines.length > 0;

  const qtyInBill = (id: string) => lines.find((l) => l.itemId === id)?.qty ?? 0;

  const addItem = (item: Item) => {
    const inBill = lines.find((l) => l.itemId === item._id)?.qty ?? 0;
    if (inBill + 1 > item.stock) {
      feedback.warning(t("Only {n} of {name} in stock.", { n: item.stock, name: item.name }));
      return;
    }
    setLines((all) => inBill
      ? all.map((l) => (l.itemId === item._id ? { ...l, qty: l.qty + 1 } : l))
      : [...all, { key: item._id, itemId: item._id, name: item.name, price: item.sellPrice, qty: 1, max: item.stock }]);
  };

  const changeQty = (key: string, delta: number) => setLines((all) => all.flatMap((l) => {
    if (l.key !== key) return [l];
    const qty = l.qty + delta;
    if (qty <= 0) return [];
    if (l.max !== undefined && qty > l.max) {
      feedback.warning(t("Only {n} of {name} in stock.", { n: l.max, name: l.name }));
      return [l];
    }
    return [{ ...l, qty }];
  }));

  /** A barcode scanner types the code and presses Enter. */
  const onSearchEnter = () => {
    const match = items?.find((i) => i.barcode === search) ?? (shown.length === 1 ? shown[0] : undefined);
    if (match) {
      addItem(match);
      setSearch("");
    } else if (search) {
      feedback.warning(t("No item found for that code."));
    }
  };

  const pay = async (payment: Payment) => {
    try {
      const sale = await api<{ id: string }>("/api/sales", "POST", {
        lines: lines.map(({ itemId, name, price, qty }) => (itemId ? { itemId, qty } : { name, price, qty })),
        discount, ...payment,
      });
      feedback.success(t("Bill saved."));
      router.push(`/receipt/${sale.id}?print=1`);
    } catch (e) { feedback.error((e as Error).message); }
  };

  const clear = async () => {
    if (await feedback.confirm({ title: t("Clear this bill?"), message: t("All items on the bill will be removed."), confirmText: t("Clear"), danger: true })) {
      setLines([]);
      setDiscount(0);
    }
  };

  if (!items) return <Loading error={error} />;

  return (
    <>
      <PageHeader
        title={t("Billing")} subtitle={t("Tap items or scan a barcode, check the bill, then press Pay.")}
        info={t("Stock goes down by itself when the bill is saved. Use Add Custom Item for things not in stock, such as a repair or photocopy.")}
        action={<Link href="/billing/history"><Button variant="secondary"><History className="size-4" /> {t("Bill History")}</Button></Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="sticky top-[49px] z-20 -mx-4 bg-slate-50 px-4 py-2 sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:mb-1 lg:p-0">
          <div className="mb-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-3 size-4 text-slate-400" />
              <Input
                id="item-search" className="pl-9" placeholder={t("Search or scan barcode")} value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearchEnter(); }}
              />
            </div>
            <Button variant="secondary" onClick={() => setAddingCustom(true)}><PenLine className="size-4" /> <span className="sm:hidden">{t("Custom")}</span><span className="hidden sm:inline">{t("Add Custom Item")}</span></Button>
          </div>

          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:mb-3">
            {["", ...categories].map((c) => (
              <button
                key={c || "all"} onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${category === c ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
              >
                {c || t("All")}
              </button>
            ))}
          </div>
          </div>

          {shown.length === 0 ? <Empty>{t("No items found.")}</Empty> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {shown.map((item) => (
                <button
                  key={item._id} onClick={() => addItem(item)} disabled={item.stock <= 0}
                  className={`flex min-h-28 touch-manipulation flex-col rounded-xl border p-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${qtyInBill(item._id) ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-400"}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-xs text-slate-500">{item.category || t("General")}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image && <img src={item.image} alt="" className="size-8 shrink-0 rounded-md object-cover" />}
                    {qtyInBill(item._id) > 0 && <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{qtyInBill(item._id)}</span>}
                  </span>
                  <span className="mt-1 line-clamp-2 flex-1 text-sm font-medium text-slate-900">{item.name}</span>
                  <span className="mt-2 flex items-center justify-between gap-2">
                    <span className="whitespace-nowrap text-sm font-semibold text-slate-900">{rs(item.sellPrice)}</span>
                    <Badge tone={item.stock <= 0 ? "red" : item.stock <= item.reorderLevel ? "amber" : "slate"}>{item.stock <= 0 ? t("Out") : item.stock}</Badge>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {billOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setBillOpen(false)} />}
        <aside className={`bg-white lg:sticky lg:top-6 lg:block lg:h-fit lg:rounded-xl lg:border lg:border-slate-200 ${billOpen ? "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-xl pb-[env(safe-area-inset-bottom)]" : "hidden"}`}>
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">{t("Short Bill")} <Info text={t("This is what will print on the customer's receipt.")} /></h2>
            <span className="flex items-center gap-4">
              {lines.length > 0 && <button className="text-sm text-slate-500 hover:text-red-600" onClick={clear}>{t("Clear")}</button>}
              <button className="text-sm font-medium text-brand-700 lg:hidden" onClick={() => setBillOpen(false)}>{t("Add more")}</button>
            </span>
          </header>

          <div className="max-h-[45vh] divide-y divide-slate-100 overflow-y-auto px-4">
            {lines.length === 0 && <Empty>{t("Tap an item to start the bill.")}</Empty>}
            {lines.map((line) => (
              <div key={line.key} className="py-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{line.name}</span>
                  <span className="whitespace-nowrap font-semibold">{rs(line.price * line.qty)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <QtyButton label={t("Less")} onClick={() => changeQty(line.key, -1)}><Minus className="size-3" /></QtyButton>
                  <span className="w-8 text-center text-sm">{line.qty}</span>
                  <QtyButton label={t("More")} onClick={() => changeQty(line.key, 1)}><Plus className="size-3" /></QtyButton>
                  <span className="flex-1 text-xs text-slate-400">x {rs(line.price)}</span>
                  <button aria-label={t("Remove")} onClick={() => changeQty(line.key, -line.qty)}><Trash2 className="size-4 text-slate-400 hover:text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-100 p-4 text-sm">
            <div className="flex justify-between"><span>{t("Subtotal")}</span><span>{rs(subtotal)}</span></div>
            <div className="flex items-center justify-between gap-4">
              <span>{t("Discount")}</span>
              <Input className="w-28 text-right" type="number" min="0" step="0.01" aria-label={t("Discount")} value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} />
            </div>
            {tooMuchDiscount && <p className="text-right text-xs font-medium text-red-600">{t("Discount cannot be more than the bill.")}</p>}
            <div className="flex justify-between pt-1 text-lg font-bold"><span>{t("Total")}</span><span>{rs(total)}</span></div>
            <Button variant="success" className="w-full py-3 text-base" disabled={!lines.length || tooMuchDiscount} onClick={() => { setBillOpen(false); setPaying(true); }}>{t("Pay")} {rs(total)}</Button>
          </div>
        </aside>
      </div>

      {lines.length > 0 && !billOpen && (
        <button
          onClick={() => setBillOpen(true)}
          className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-xl bg-brand-700 px-4 py-3 text-white shadow-lg lg:hidden"
        >
          <span className="text-sm">{t(lines.length === 1 ? "{n} item" : "{n} items", { n: lines.length })}</span>
          <span className="font-semibold">{t("View Bill")}: {rs(total)}</span>
        </button>
      )}

      {paying && (
        <Modal title={`${t("Payment")}: ${rs(total)}`} onClose={() => setPaying(false)}>
          <PaymentFields total={total} onSubmit={pay} onCancel={() => setPaying(false)} />
        </Modal>
      )}
      {addingCustom && (
        <CustomItem
          onClose={() => setAddingCustom(false)}
          onAdd={(name, price) => {
            setLines((all) => [...all, { key: crypto.randomUUID(), name, price, qty: 1 }]);
            setAddingCustom(false);
          }}
        />
      )}
    </>
  );
}

function QtyButton({ label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} className="flex size-9 items-center justify-center rounded-md border sm:size-7 border-slate-300 hover:bg-slate-50" {...props} />;
}

function CustomItem({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, price: number) => void }) {
  return (
    <Modal title={t("Add Custom Item")} onClose={onClose}>
      <Form onSubmit={(values: Values) => onAdd(values.name, Number(values.price))} className="space-y-4">
        <p className="text-sm text-slate-500">{t("For things not in stock, such as a repair or photocopy.")}</p>
        <Input label={t("Description")} name="name" required autoFocus maxLength={150} />
        <Input label={t("Price")} name="price" type="number" min="0.01" step="0.01" required />
        <FormActions submitLabel={t("Add to Bill")} onCancel={onClose} />
      </Form>
    </Modal>
  );
}
