"use client";

import { Pencil, Plus, Search, Trash2, Warehouse } from "lucide-react";
import { useMemo, useState } from "react";
import { useFeedback } from "@/components/feedback";
import { Form, Values } from "@/components/form";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, Empty, FormActions, Input, ListRow, Loading, Modal, PageHeader, PhoneList, Select, Table } from "@/components/ui";
import { api, uploadImage, useApi } from "@/lib/client";
import { dateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

type Item = {
  _id: string; name: string; barcode: string | null; category: string; costPrice?: number;
  sellPrice: number; stock: number; reorderLevel: number; image: string | null;
};
type Movement = { _id: string; change: number; reason: string; note: string; userName: string; createdAt: string };

const stockTone = (item: Item) => (item.stock <= 0 ? "red" : item.stock <= item.reorderLevel ? "amber" : "green");
const stockText = (item: Item) => (item.stock <= 0 ? t("Out of stock") : item.stock <= item.reorderLevel ? t("Low: {n}", { n: item.stock }) : t("{n} in stock", { n: item.stock }));

export default function InventoryPage() {
  const { rs, isAdmin } = useShop();
  const feedback = useFeedback();
  const { data: items, error, reload } = useApi<Item[]>("/api/items");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<Item | null>(null);
  const [viewing, setViewing] = useState<Item | null>(null);

  const categories = useMemo(() => [...new Set((items ?? []).map((i) => i.category).filter(Boolean))].sort(), [items]);
  const shown = (items ?? []).filter((item) =>
    (!search || item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode === search) &&
    (!category || item.category === category) &&
    (!lowOnly || item.stock <= item.reorderLevel));

  const remove = async (item: Item) => {
    const yes = await feedback.confirm({
      title: t("Delete item?"), message: t("\"{name}\" will be removed from the shop. Old bills keep it.", { name: item.name }), confirmText: t("Delete"), danger: true,
    });
    if (!yes) return;
    try {
      await api(`/api/items/${item._id}`, "DELETE");
      feedback.success(t("Item deleted."));
      reload();
    } catch (e) { feedback.error((e as Error).message); }
  };

  if (!items) return <Loading error={error} />;
  const addButton = isAdmin && <Button onClick={() => setEditing("new")}><Plus className="size-4" /> {t("Add Item")}</Button>;

  return (
    <>
      <PageHeader
        title={t("Inventory")} subtitle={t("{n} items in the shop", { n: items.length })}
        info={t("Everything you sell from the shelf. Stock goes down by itself when you make a bill. Click an item name to see its details.")}
        action={addButton}
      />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-3 size-4 text-slate-400 sm:top-2.5" />
            <Input className="pl-9" placeholder={t("Search name or barcode")} aria-label={t("Search items")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="sm:w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("Category")}>
            <option value="">{t("All categories")}</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> {t("Low stock only")}
          </label>
        </div>

        {shown.length === 0 ? <Empty action={items.length === 0 && addButton}>{items.length === 0 ? t("No items yet. Add your first item.") : t("No items match your search.")}</Empty> : (
          <>
          <PhoneList>
            {shown.map((item) => (
              <ListRow
                key={item._id} title={item.name} subtitle={[rs(item.sellPrice), item.category].filter(Boolean).join(" · ")}
                value={<Badge tone={stockTone(item)}>{stockText(item)}</Badge>} onClick={() => setViewing(item)}
              />
            ))}
          </PhoneList>
          <Table hideOnPhone headers={["Item", "Category", "Price", "Stock", ...(isAdmin ? ["Actions"] : [])]}>
            {shown.map((item) => (
              <tr key={item._id}>
                <td>
                  <button className="text-left" onClick={() => setViewing(item)}>
                    <span className="block font-medium text-slate-900 hover:text-brand-700">{item.name}</span>
                    {item.barcode && <span className="block text-xs text-slate-400">{item.barcode}</span>}
                  </button>
                </td>
                <td className="text-slate-500">{item.category || "-"}</td>
                <td className="whitespace-nowrap">{rs(item.sellPrice)}</td>
                <td className="whitespace-nowrap"><Badge tone={stockTone(item)}>{stockText(item)}</Badge></td>
                {isAdmin && (
                  <td>
                    <div className="flex gap-1">
                      <IconButton label={t("Change stock")} onClick={() => setAdjusting(item)}><Warehouse className="size-4" /></IconButton>
                      <IconButton label={t("Edit")} onClick={() => setEditing(item)}><Pencil className="size-4" /></IconButton>
                      <IconButton label={t("Delete")} onClick={() => remove(item)}><Trash2 className="size-4 text-red-500" /></IconButton>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </Table>
          </>
        )}
      </Card>

      {viewing && (
        <ItemDetails
          item={viewing} onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onStock={() => { setAdjusting(viewing); setViewing(null); }}
          onDelete={() => { setViewing(null); remove(viewing); }}
        />
      )}
      {editing && <ItemForm item={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={reload} />}
      {adjusting && <StockForm item={adjusting} onClose={() => setAdjusting(null)} onSaved={reload} />}
    </>
  );
}

function IconButton({ label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button title={label} aria-label={label} className="rounded-lg p-2 hover:bg-slate-100" {...props} />;
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function ItemDetails({ item, onClose, onEdit, onStock, onDelete }: { item: Item; onClose: () => void; onEdit: () => void; onStock: () => void; onDelete: () => void }) {
  const { rs, isAdmin } = useShop();
  const { data } = useApi<{ movements: Movement[] }>(`/api/items/${item._id}`);

  return (
    <Modal title={item.name} onClose={onClose} wide>
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.image && <img src={item.image} alt="" className="size-24 rounded-lg object-cover" />}
        <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label={t("Selling price")} value={rs(item.sellPrice)} />
          {isAdmin && <Detail label={t("Cost price")} value={rs(item.costPrice ?? 0)} />}
          {isAdmin && <Detail label={t("Profit per item")} value={rs(item.sellPrice - (item.costPrice ?? 0))} />}
          <Detail label={t("In stock")} value={item.stock} />
          <Detail label={t("Low stock level")} value={item.reorderLevel} />
          <Detail label={t("Category")} value={item.category || "-"} />
          <Detail label={t("Barcode")} value={item.barcode || "-"} />
        </dl>
      </div>
      {isAdmin && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Button onClick={onStock}><Warehouse className="size-4" /> {t("Stock")}</Button>
          <Button variant="secondary" onClick={onEdit}><Pencil className="size-4" /> {t("Edit")}</Button>
          <Button variant="secondary" onClick={onDelete}><Trash2 className="size-4 text-red-500" /> {t("Delete")}</Button>
        </div>
      )}
      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-900">{t("Stock history")}</h3>
      {!data ? <Loading /> : data.movements.length === 0 ? <Empty>{t("No stock changes yet.")}</Empty> : (
        <Table headers={["Date", "Change", "Reason", "By"]}>
          {data.movements.map((m) => (
            <tr key={m._id}>
              <td className="whitespace-nowrap text-slate-500">{dateTime(m.createdAt)}</td>
              <td>{m.change > 0 ? `+${m.change}` : m.change}</td>
              <td className="capitalize">{[m.reason, m.note].filter(Boolean).join(": ")}</td>
              <td>{m.userName}</td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}

function ItemForm({ item, categories, onClose, onSaved }: { item: Item | null; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const feedback = useFeedback();
  const [image, setImage] = useState(item?.image ?? null);

  const pickImage = async (file?: File) => {
    if (!file) return;
    try {
      setImage(await uploadImage(file));
      feedback.success(t("Image uploaded."));
    } catch (e) { feedback.error((e as Error).message); }
  };

  const save = async (values: Values) => {
    const body = { ...values, image };
    await (item ? api(`/api/items/${item._id}`, "PUT", body) : api("/api/items", "POST", body));
    feedback.success(item ? t("Item updated.") : t("Item added."));
    onSaved();
    onClose();
  };

  const validate = (values: Values): Record<string, string> =>
    Number(values.sellPrice) < Number(values.costPrice) ? { sellPrice: t("Selling price is lower than the cost price.") } : {};

  return (
    <Modal title={item ? t("Edit Item") : t("Add Item")} onClose={onClose} wide>
      <Form onSubmit={save} validate={validate} className="grid gap-4 sm:grid-cols-2">
        <Input label={t("Item name")} name="name" defaultValue={item?.name} required autoFocus maxLength={150} />
        <Input label={t("Barcode")} name="barcode" defaultValue={item?.barcode ?? ""} hint={t("Optional. Scan it here to fill it in.")} />
        <Input label={t("Category")} name="category" list="categories" defaultValue={item?.category} hint={t("Pick one or type a new one.")} />
        <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        <Input label={t("Low stock level")} name="reorderLevel" type="number" min="0" step="any" defaultValue={item?.reorderLevel ?? 5} required hint={t("You get a warning at this quantity.")} />
        <Input label={t("Cost price")} name="costPrice" type="number" min="0" step="0.01" defaultValue={item?.costPrice ?? ""} required hint={t("What you pay for one.")} />
        <Input label={t("Selling price")} name="sellPrice" type="number" min="0" step="0.01" defaultValue={item?.sellPrice ?? ""} required hint={t("What the customer pays.")} />
        {!item && <Input label={t("Opening stock")} name="stock" type="number" min="0" step="any" defaultValue={0} hint={t("How many you have now.")} />}
        <div className="flex items-center gap-3 sm:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image && <img src={image} alt="" className="size-12 rounded-lg object-cover" />}
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
            {image ? t("Change photo") : t("Add photo")}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
          </label>
          <span className="text-xs text-slate-500">{t("Optional. JPG, PNG or WEBP up to 3 MB.")}</span>
        </div>
        <div className="sm:col-span-2"><FormActions submitLabel={t("Save Item")} onCancel={onClose} /></div>
      </Form>
    </Modal>
  );
}

function StockForm({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: () => void }) {
  const feedback = useFeedback();

  const save = async (values: Values) => {
    await api(`/api/items/${item._id}/stock`, "POST", values);
    feedback.success(t("Stock updated."));
    onSaved();
    onClose();
  };

  const validate = (values: Values): Record<string, string> => {
    const change = Number(values.change);
    if (values.change && change === 0) return { change: t("Enter a quantity other than 0.") };
    return item.stock + change < 0 ? { change: t("You can remove at most {n}.", { n: item.stock }) } : {};
  };

  return (
    <Modal title={`${t("Change stock")}: ${item.name}`} onClose={onClose}>
      <Form onSubmit={save} validate={validate} className="space-y-4">
        <p className="text-sm text-slate-500">{t("Current stock:")} <b className="text-slate-900">{item.stock}</b></p>
        <Input label={t("Quantity")} name="change" type="number" step="any" required autoFocus inputMode="text" hint={t("Enter 10 to add 10, or -2 to remove 2.")} />
        <Input label={t("Reason")} name="note" placeholder={t("New delivery, damaged...")} hint={t("Optional.")} />
        <FormActions submitLabel={t("Update Stock")} onCancel={onClose} />
      </Form>
    </Modal>
  );
}
