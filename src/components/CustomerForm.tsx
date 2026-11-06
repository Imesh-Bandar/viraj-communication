"use client";

import { api } from "@/lib/client";
import { useFeedback } from "./feedback";
import { Form, Values } from "./form";
import { FormActions, Input, Modal } from "./ui";
import { t } from "@/lib/i18n";

export type CustomerFields = { _id: string; name: string; phone: string; address: string; creditLimit: number };

export function CustomerForm({ customer, onClose, onSaved }: { customer: CustomerFields | null; onClose: () => void; onSaved: () => void }) {
  const feedback = useFeedback();

  const save = async (values: Values) => {
    await (customer ? api(`/api/customers/${customer._id}`, "PUT", values) : api("/api/customers", "POST", values));
    feedback.success(t("Customer saved."));
    onSaved();
    onClose();
  };

  const validate = (values: Values): Record<string, string> =>
    values.phone && !/^[0-9+\s-]{9,15}$/.test(values.phone) ? { phone: t("Enter a valid phone number, such as 0771234567.") } : {};

  return (
    <Modal title={customer ? t("Edit Customer") : t("Add Customer")} onClose={onClose}>
      <Form onSubmit={save} validate={validate} className="space-y-4">
        <Input label={t("Name")} name="name" defaultValue={customer?.name} required autoFocus maxLength={120} />
        <Input label={t("Phone")} name="phone" type="tel" defaultValue={customer?.phone} hint={t("Optional.")} />
        <Input label={t("Address")} name="address" defaultValue={customer?.address} hint={t("Optional.")} />
        <Input
          label={t("Credit limit")} name="creditLimit" type="number" min="0" step="0.01" defaultValue={customer?.creditLimit ?? 0}
          info={t("The most this customer can owe. New credit is refused above it.")} hint={t("Enter 0 for no limit.")}
        />
        <FormActions submitLabel={t("Save Customer")} onCancel={onClose} />
      </Form>
    </Modal>
  );
}
