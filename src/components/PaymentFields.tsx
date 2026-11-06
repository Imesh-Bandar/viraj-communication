"use client";

import { useState } from "react";
import { api, useApi } from "@/lib/client";
import { round2 } from "@/lib/format";
import { useFeedback } from "./feedback";
import { Form } from "./form";
import { useShop } from "./ShopContext";
import { Button, FormActions, Input, Select } from "./ui";
import { t } from "@/lib/i18n";

export type Payment = { method: "cash" | "card" | "credit"; tendered: number; customerId: string | null };
type Customer = { _id: string; name: string; phone: string; balance: number };

const METHODS = [
  { value: "cash", label: t("Cash") }, { value: "card", label: t("Card") }, { value: "credit", label: t("Nayapotha") },
] as const;

/** Shared payment step for shop bills and gas/water sales. */
export function PaymentFields({ total, onSubmit, onCancel }: { total: number; onSubmit: (p: Payment) => Promise<void>; onCancel: () => void }) {
  const { rs } = useShop();
  const feedback = useFeedback();
  const { data: customers, reload } = useApi<Customer[]>("/api/customers");
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [tendered, setTendered] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [newName, setNewName] = useState<string | null>(null);

  const received = Number(tendered) || 0;
  const isCredit = method === "credit";
  // Exact amount, then the next notes a customer is likely to hand over.
  const quickCash = [...new Set([total, ...[100, 500, 1000, 5000].map((note) => Math.ceil(total / note) * note)])].filter((a) => a > 0).sort((a, b) => a - b).slice(0, 4);

  const quickAddCustomer = async () => {
    if (!newName?.trim()) return;
    try {
      const { id } = await api<{ id: string }>("/api/customers", "POST", { name: newName });
      reload();
      setCustomerId(id);
      setNewName(null);
      feedback.success(t("Customer added."));
    } catch (e) { feedback.error((e as Error).message); }
  };

  const submit = () => onSubmit({ method, tendered: method === "card" ? total : received, customerId: customerId || null });

  const validate = (): Record<string, string> =>
    method === "cash" && tendered && received < total ? { tendered: t("Cash is {amount} short. Use Nayapotha for the balance.", { amount: rs(round2(total - received)) }) } : {};

  return (
    <Form onSubmit={submit} validate={validate} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.value} type="button" onClick={() => setMethod(m.value)}
            className={`rounded-lg border px-2 py-3 text-sm font-medium ${method === m.value ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <Select label={t("Customer")} name="customerId" hint={isCredit ? t("Who will pay this later?") : t("Optional.")} value={customerId} required={isCredit} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">{isCredit ? t("Select customer") : t("Walk-in customer")}</option>
          {customers?.map((c) => <option key={c._id} value={c._id}>{c.name} {c.phone && `(${c.phone})`}{c.balance > 0 ? ` - ${t("Owes {amount}", { amount: rs(c.balance) })}` : ""}</option>)}
        </Select>
        {newName === null ? (
          <button type="button" className="mt-1 text-xs text-brand-600 hover:underline" onClick={() => setNewName("")}>{t("+ Add new customer")}</button>
        ) : (
          <div className="mt-2 flex gap-2">
            <Input placeholder={t("New customer name")} aria-label={t("New customer name")} autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button type="button" variant="secondary" onClick={quickAddCustomer}>{t("Add")}</Button>
          </div>
        )}
      </div>

      {method !== "card" && (
        <div>
          <Input
            label={isCredit ? t("Paid now") : t("Cash received")} name="tendered" hint={isCredit ? "Optional. The rest goes to Nayapotha." : undefined} type="number" min="0" step="0.01"
            required={method === "cash"} value={tendered} onChange={(e) => setTendered(e.target.value)}
          />
          {method === "cash" && (
            <div className="mt-2 flex flex-wrap gap-2">
              {quickCash.map((amount) => (
                <button
                  key={amount} type="button" onClick={() => setTendered(String(amount))}
                  className={`min-h-10 flex-1 touch-manipulation whitespace-nowrap rounded-lg border px-3 text-sm font-medium ${received === amount ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-700"}`}
                >
                  {amount === total ? t("Exact") : amount.toLocaleString("en-LK")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {method === "cash" && received >= total && (
        <div className="flex justify-between rounded-lg bg-emerald-50 p-3 font-semibold text-emerald-700">
          <span>{t("Change")}</span><span>{rs(round2(received - total))}</span>
        </div>
      )}
      {isCredit && (
        <div className="flex justify-between rounded-lg bg-amber-50 p-3 font-semibold text-amber-700">
          <span>{t("Goes to Nayapotha")}</span><span>{rs(Math.max(0, round2(total - received)))}</span>
        </div>
      )}

      <FormActions submitLabel={t("Complete Bill")} onCancel={onCancel} />
    </Form>
  );
}
