"use client";

import { Droplets, Flame, Minus, PackagePlus, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFeedback } from "@/components/feedback";
import { Form, Values } from "@/components/form";
import { Payment, PaymentFields } from "@/components/PaymentFields";
import { useShop } from "@/components/ShopContext";
import { Button, Card, Empty, FormActions, Input, Loading, Modal, PageHeader, Select, Table } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { dateTime, round2 } from "@/lib/format";
import { t } from "@/lib/i18n";

type Product = {
  _id: string; type: "gas" | "water"; name: string; refillPrice: number; newPrice: number;
  refillCost: number; newCost: number; full: number; empty: number;
};
type Txn = { _id: string; product: string; action: string; qty: number; amount: number; note: string; userName: string; createdAt: string };

const ACTIONS: Record<string, string> = {
  refill: t("Refill sale"), sell_new: t("New sale"), supplier_refill: t("Supplier refill"), buy_new: t("New stock"),
};

export default function GasWaterPage() {
  const { rs, isAdmin } = useShop();
  const { data, error, reload } = useApi<{ products: Product[]; history: Txn[] }>("/api/gas-water");
  const [selling, setSelling] = useState<{ product: Product; action: "refill" | "sell_new" } | null>(null);
  const [receiving, setReceiving] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  if (!data) return <Loading error={error} />;

  return (
    <>
      <PageHeader
        title={t("Gas & Water")} subtitle={t("Sell refills and keep count of full and empty containers.")}
        info={t("Refill: the customer swaps an empty for a full one. New: the customer buys the container too, so no empty comes back.")}
        action={isAdmin && <Button onClick={() => setEditing("new")}><Plus className="size-4" /> {t("Add Product")}</Button>}
      />

      {data.products.length === 0 ? <Card><Empty action={isAdmin && <Button onClick={() => setEditing("new")}><Plus className="size-4" /> {t("Add Product")}</Button>}>{t("No gas or water products yet.")}</Empty></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.products.map((product) => (
            <div key={product._id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 [&_svg]:size-5 ${product.type === "gas" ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"}`}>
                  {product.type === "gas" ? <Flame /> : <Droplets />}
                </div>
                <h2 className="flex-1 font-semibold">{product.name}</h2>
                {isAdmin && <button aria-label={t("Edit")} onClick={() => setEditing(product)}><Pencil className="size-4 text-slate-400" /></button>}
              </div>

              <div className="my-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-semibold text-slate-900">{product.full}</p>
                  <p className="text-xs text-slate-500">{t("Full")}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-semibold text-slate-900">{product.empty}</p>
                  <p className="text-xs text-slate-500">{t("Empty")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button disabled={product.full <= 0} onClick={() => setSelling({ product, action: "refill" })}>{t("Refill")} {rs(product.refillPrice)}</Button>
                <Button variant="secondary" disabled={product.full <= 0} onClick={() => setSelling({ product, action: "sell_new" })}>{t("New")} {rs(product.newPrice)}</Button>
              </div>
              {isAdmin && (
                <button className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:underline" onClick={() => setReceiving(product)}>
                  <PackagePlus className="size-4" /> {t("Receive stock")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Card title={t("Recent activity")} className="mt-6">
        {data.history.length === 0 ? <Empty>{t("Nothing yet.")}</Empty> : (
          <Table headers={["Time", "Product", "Action", "Qty", "Amount", "By"]}>
            {data.history.map((t) => (
              <tr key={t._id}>
                <td className="whitespace-nowrap text-slate-500">{dateTime(t.createdAt)}</td>
                <td>{t.product}</td>
                <td>{ACTIONS[t.action]}</td>
                <td>{t.qty}</td>
                <td className="whitespace-nowrap">{t.amount ? rs(t.amount) : "-"}</td>
                <td>{t.userName}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {selling && <SellModal {...selling} onClose={() => setSelling(null)} />}
      {receiving && <ReceiveModal product={receiving} onClose={() => setReceiving(null)} onSaved={reload} />}
      {editing && <ProductModal product={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </>
  );
}

function SellModal({ product, action, onClose }: { product: Product; action: "refill" | "sell_new"; onClose: () => void }) {
  const { rs } = useShop();
  const feedback = useFeedback();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const price = action === "refill" ? product.refillPrice : product.newPrice;
  const total = round2(price * qty);

  const pay = async (payment: Payment) => {
    try {
      const sale = await api<{ id: string }>("/api/gas-water/sell", "POST", { productId: product._id, action, qty, ...payment });
      feedback.success(t("Sale saved."));
      router.push(`/receipt/${sale.id}?print=1`);
    } catch (e) { feedback.error((e as Error).message); }
  };

  return (
    <Modal title={`${t(action === "refill" ? "Refill" : "New")}: ${product.name}`} onClose={onClose}>
      <div className="mb-4 space-y-3">
        {action === "refill" && <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">{t("The customer gives back an empty, so your empty count goes up.")}</p>}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t("Quantity")}</span>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" aria-label={t("Less")} disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Minus className="size-4" /></Button>
            <span className="w-8 text-center text-lg font-semibold">{qty}</span>
            <Button type="button" variant="secondary" aria-label={t("More")} disabled={qty >= product.full} onClick={() => setQty(qty + 1)}><Plus className="size-4" /></Button>
          </div>
        </div>
        <p className="flex justify-between text-lg font-bold"><span>{t("Total")}</span><span>{rs(total)}</span></p>
      </div>
      <PaymentFields total={total} onSubmit={pay} onCancel={onClose} />
    </Modal>
  );
}

function ReceiveModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const feedback = useFeedback();

  const save = async (values: Values) => {
    await api("/api/gas-water/stock", "POST", { productId: product._id, ...values });
    feedback.success(t("Stock updated."));
    onSaved();
    onClose();
  };

  const validate = (values: Values): Record<string, string> =>
    values.action === "supplier_refill" && Number(values.qty) > product.empty ? { qty: t("You only have {n} empty.", { n: product.empty }) } : {};

  return (
    <Modal title={`${t("Receive stock")}: ${product.name}`} onClose={onClose}>
      <Form onSubmit={save} validate={validate} className="space-y-4">
        <Select label={t("What happened?")} name="action">
          <option value="supplier_refill">{t("Supplier swapped empties for full")}</option>
          <option value="buy_new">{t("Bought new full containers")}</option>
        </Select>
        <Input label={t("Quantity")} name="qty" type="number" min="1" step="1" required autoFocus />
        <Input label={t("Note")} name="note" hint={t("Optional.")} />
        <FormActions submitLabel={t("Save Stock")} onCancel={onClose} />
      </Form>
    </Modal>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const feedback = useFeedback();

  const save = async (values: Values) => {
    await (product ? api(`/api/gas-water/${product._id}`, "PUT", values) : api("/api/gas-water", "POST", values));
    feedback.success(t("Product saved."));
    onSaved();
    onClose();
  };

  return (
    <Modal title={product ? t("Edit Product") : t("Add Product")} onClose={onClose} wide>
      <Form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Select label={t("Type")} name="type" defaultValue={product?.type ?? "gas"}>
          <option value="gas">{t("Gas")}</option>
          <option value="water">{t("Water")}</option>
        </Select>
        <Input label={t("Name")} name="name" placeholder={t("Gas 12.5 kg")} defaultValue={product?.name} required />
        <Input label={t("Refill selling price")} name="refillPrice" type="number" min="0" step="0.01" defaultValue={product?.refillPrice} required />
        <Input label={t("Refill cost")} name="refillCost" type="number" min="0" step="0.01" defaultValue={product?.refillCost} required hint={t("What the supplier charges you.")} />
        <Input label={t("New selling price")} name="newPrice" type="number" min="0" step="0.01" defaultValue={product?.newPrice} required hint={t("Price with the container.")} />
        <Input label={t("New cost")} name="newCost" type="number" min="0" step="0.01" defaultValue={product?.newCost} required />
        {!product && (
          <>
            <Input label={t("Full in stock")} name="full" type="number" min="0" step="1" defaultValue={0} />
            <Input label={t("Empty in stock")} name="empty" type="number" min="0" step="1" defaultValue={0} />
          </>
        )}
        <div className="sm:col-span-2"><FormActions submitLabel={t("Save Product")} onCancel={onClose} /></div>
      </Form>
    </Modal>
  );
}
