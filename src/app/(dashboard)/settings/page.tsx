"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useFeedback } from "@/components/feedback";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Form, Values } from "@/components/form";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, FormActions, Input, Loading, Modal, PageHeader, Select, Table } from "@/components/ui";
import { api, uploadImage, useApi } from "@/lib/client";
import { ShopSettings } from "@/services/settings";
import { t } from "@/lib/i18n";

type User = { _id: string; name: string; username: string; role: string; active: boolean };

export default function SettingsPage() {
  const { isAdmin } = useShop();
  return (
    <>
      <PageHeader title={t("Settings")} subtitle={t("Shop details, bill printing, users and your password.")} />
      <div className="grid gap-6 xl:grid-cols-2">
        {isAdmin && <ShopForm />}
        <PasswordForm />
        <LanguageCard />
        {isAdmin && <UsersCard />}
      </div>
    </>
  );
}

function ShopForm() {
  const feedback = useFeedback();
  const { data, error } = useApi<ShopSettings>("/api/settings");
  const [logo, setLogo] = useState<string | null | undefined>(undefined);

  if (!data) return <Card title={t("Shop details")}><Loading error={error} /></Card>;
  const currentLogo = logo === undefined ? data.logo : logo;

  const pickLogo = async (file?: File) => {
    if (!file) return;
    try { setLogo(await uploadImage(file)); } catch (e) { feedback.error((e as Error).message); }
  };

  const save = async (values: Values) => {
    await api("/api/settings", "PUT", { ...values, autoPrint: values.autoPrint === "on", logo: currentLogo ?? null });
    feedback.success(t("Settings saved."));
    window.location.reload();
  };

  return (
    <Card title={t("Shop details and bill")}>
      <Form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {currentLogo && <img src={currentLogo} alt="" className="h-12 rounded" />}
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
            {t("Upload logo")}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickLogo(e.target.files?.[0])} />
          </label>
        </div>
        <Input label={t("Shop name")} name="shopName" defaultValue={data.shopName} required />
        <Input label={t("Address")} name="address" defaultValue={data.address} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t("Phone")} name="phone" defaultValue={data.phone} />
          <Input label={t("Currency")} name="currency" defaultValue={data.currency} required maxLength={6} />
        </div>
        <Input label={t("Bill footer message")} name="receiptFooter" defaultValue={data.receiptFooter} hint={t("Printed at the bottom of every bill.")} />
        <Select label={t("Bill printer paper")} name="receiptWidth" defaultValue={data.receiptWidth} info={t("Check the paper roll width in your bill printer.")}>
          <option value="80">{t("80 mm")}</option>
          <option value="58">{t("58 mm")}</option>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="autoPrint" defaultChecked={data.autoPrint} /> {t("Open print window after each bill")}
        </label>
        <FormActions submitLabel={t("Save Settings")} />
      </Form>
    </Card>
  );
}

const passwordsMatch = (values: Values): Record<string, string> =>
  values.confirm && values.confirm !== (values.next ?? values.password) ? { confirm: t("The two passwords do not match.") } : {};

function LanguageCard() {
  return (
    <Card title={t("Language")} className="h-fit">
      <p className="mb-3 text-sm text-slate-500">{t("Choose the language for this device.")}</p>
      <LanguageSwitch />
    </Card>
  );
}

function PasswordForm() {
  const feedback = useFeedback();

  const save = async (values: Values, form: HTMLFormElement) => {
    await api("/api/auth/password", "POST", values);
    feedback.success(t("Password changed."));
    form.reset();
  };

  return (
    <Card title={t("Change my password")} className="h-fit">
      <Form onSubmit={save} validate={passwordsMatch} className="space-y-4">
        <Input label={t("Current password")} name="current" type="password" required autoComplete="current-password" />
        <Input label={t("New password")} name="next" type="password" minLength={6} required autoComplete="new-password" hint={t("At least 6 characters.")} />
        <Input label={t("Confirm new password")} name="confirm" type="password" required autoComplete="new-password" />
        <FormActions submitLabel={t("Change Password")} />
      </Form>
    </Card>
  );
}

function UsersCard() {
  const feedback = useFeedback();
  const { user: me } = useShop();
  const { data: users, error, reload } = useApi<User[]>("/api/users");
  const [adding, setAdding] = useState(false);

  const toggle = async (user: User) => {
    try {
      await api(`/api/users/${user._id}`, "PATCH", { active: !user.active });
      feedback.success(user.active ? t("User disabled.") : t("User enabled."));
      reload();
    } catch (e) { feedback.error((e as Error).message); }
  };

  const save = async (values: Values) => {
    await api("/api/users", "POST", values);
    feedback.success(t("User added."));
    setAdding(false);
    reload();
  };

  return (
    <Card
      title={t("Users")} className="xl:col-span-2"
      info={t("Admins can do everything. Cashiers can make bills, sell gas and water, and use Nayapotha.")}
      action={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> {t("Add User")}</Button>}
    >
      {!users ? <Loading error={error} /> : (
        <Table headers={["Name", "Username", "Role", "Status", ""]}>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="font-medium">{user.name}</td>
              <td>{user.username}</td>
              <td className="capitalize">{user.role}</td>
              <td><Badge tone={user.active ? "green" : "slate"}>{user.active ? t("Active") : t("Disabled")}</Badge></td>
              <td>{user._id !== me.id && <button className="text-sm text-brand-600 hover:underline" onClick={() => toggle(user)}>{user.active ? t("Disable") : t("Enable")}</button>}</td>
            </tr>
          ))}
        </Table>
      )}

      {adding && (
        <Modal title={t("Add User")} onClose={() => setAdding(false)}>
          <Form onSubmit={save} validate={passwordsMatch} className="space-y-4">
            <Input label={t("Name")} name="name" required autoFocus />
            <Input label={t("Username")} name="username" required minLength={3} autoComplete="off" hint={t("Used to log in.")} />
            <Input label={t("Password")} name="password" type="password" minLength={6} required autoComplete="new-password" hint={t("At least 6 characters.")} />
            <Input label={t("Confirm password")} name="confirm" type="password" required autoComplete="new-password" />
            <Select label={t("Role")} name="role"><option value="cashier">{t("Cashier")}</option><option value="admin">{t("Admin")}</option></Select>
            <FormActions submitLabel={t("Add User")} onCancel={() => setAdding(false)} />
          </Form>
        </Modal>
      )}
    </Card>
  );
}
