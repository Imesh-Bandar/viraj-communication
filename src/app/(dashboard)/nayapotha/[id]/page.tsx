"use client";

import { ArrowLeft, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CustomerForm, CustomerFields } from "@/components/CustomerForm";
import { useFeedback } from "@/components/feedback";
import { Form, Values } from "@/components/form";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, Empty, FormActions, Input, Loading, Modal, PageHeader, Table } from "@/components/ui";
import { api, useApi } from "@/lib/client";
import { dateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

type Entry = { _id: string; type: "credit" | "payment"; amount: number; note: string; invoiceNo: string | null; saleId: string | null; userName: string; createdAt: string };

export default function CustomerLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const { rs } = useShop();
  const { data, error, reload } = useApi<{ customer: CustomerFields & { balance: number }; entries: Entry[] }>(`/api/customers/${id}`);
  const [entryType, setEntryType] = useState<Entry["type"] | null>(null);
  const [editing, setEditing] = useState(false);

  if (!data) return <Loading error={error} />;
  const { customer, entries } = data;

  return (
    <>
      <Link href="/nayapotha" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="size-4" /> {t("Back to Nayapotha")}</Link>
      <PageHeader
        title={customer.name}
        subtitle={[customer.phone, customer.address].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex gap-2">
            {customer.phone && <a href={`tel:${customer.phone}`}><Button variant="secondary"><Phone className="size-4" /> {t("Call")}</Button></a>}
            <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="size-4" /> {t("Edit")}</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{t("Amount owed")}</p>
            <p className={`text-3xl font-bold ${customer.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>{rs(customer.balance)}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto max-sm:[&>button]:flex-1 max-sm:[&>button]:py-3">
            <Button variant="secondary" onClick={() => setEntryType("credit")}>{t("Add Debt")}</Button>
            <Button variant="success" disabled={customer.balance <= 0} onClick={() => setEntryType("payment")}>{t("Receive Payment")}</Button>
          </div>
        </div>
      </Card>

      <Card title={t("History")}>
        {entries.length === 0 ? <Empty>{t("No entries yet.")}</Empty> : (
          <Table headers={["Date", "Type", "Details", "Amount", "By"]}>
            {entries.map((entry) => (
              <tr key={entry._id}>
                <td className="whitespace-nowrap text-slate-500">{dateTime(entry.createdAt)}</td>
                <td><Badge tone={entry.type === "credit" ? "amber" : "green"}>{entry.type === "credit" ? t("Debt") : t("Payment")}</Badge></td>
                <td>
                  {entry.note}{" "}
                  {entry.saleId && <Link className="text-brand-600 hover:underline" href={`/receipt/${entry.saleId}`}>{entry.invoiceNo}</Link>}
                </td>
                <td className="whitespace-nowrap">{rs(entry.amount)}</td>
                <td>{entry.userName}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {entryType && <EntryModal customerId={id} type={entryType} balance={customer.balance} onClose={() => setEntryType(null)} onSaved={reload} />}
      {editing && <CustomerForm customer={customer} onClose={() => setEditing(false)} onSaved={reload} />}
    </>
  );
}

function EntryModal({ customerId, type, balance, onClose, onSaved }: { customerId: string; type: Entry["type"]; balance: number; onClose: () => void; onSaved: () => void }) {
  const { rs } = useShop();
  const feedback = useFeedback();
  const isPayment = type === "payment";

  const save = async (values: Values) => {
    await api(`/api/customers/${customerId}`, "POST", { type, ...values });
    feedback.success(isPayment ? t("Payment recorded.") : t("Debt added."));
    onSaved();
    onClose();
  };

  const validate = (values: Values): Record<string, string> =>
    isPayment && Number(values.amount) > balance ? { amount: t("This customer only owes {amount}.", { amount: rs(balance) }) } : {};

  return (
    <Modal title={isPayment ? t("Receive Payment") : t("Add Debt")} onClose={onClose}>
      <Form onSubmit={save} validate={validate} className="space-y-4">
        <Input
          label={t("Amount")} name="amount" type="number" min="0.01" step="0.01" required autoFocus
          hint={isPayment ? t("Owes {amount}", { amount: rs(balance) }) : t("Use this for debt from outside a bill, such as an old book balance.")}
        />
        <Input label={t("Note")} name="note" hint={t("Optional.")} />
        <FormActions submitLabel={isPayment ? t("Save Payment") : t("Save Debt")} onCancel={onClose} />
      </Form>
    </Modal>
  );
}
