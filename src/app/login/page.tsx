"use client";

import { BookOpen, Flame, ReceiptText, Store } from "lucide-react";
import { Form, Values } from "@/components/form";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { FormActions, Input } from "@/components/ui";
import { api } from "@/lib/client";
import { t } from "@/lib/i18n";

const FEATURES = [
  { icon: ReceiptText, text: t("Make bills in seconds and print a short receipt") },
  { icon: Flame, text: t("Sell gas and water, and count full and empty stock") },
  { icon: BookOpen, text: t("Keep your Nayapotha up to date for every customer") },
];

export default function LoginPage() {
  const login = async (values: Values) => {
    await api("/api/auth/login", "POST", values);
    window.location.href = "/";
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-center bg-brand-800 p-12 text-white lg:flex">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex size-12 items-center justify-center rounded-xl bg-white/10"><Store /></div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">{t("Hi, welcome to Viraj Communication POS system")}</h1>
          <p className="mt-3 text-brand-100">{t("Everything for running the shop, in one place.")}</p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-brand-50"><Icon className="size-5 shrink-0 text-brand-200" /> {text}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative flex items-center justify-center bg-white p-6">
        <div className="absolute right-4 top-4"><LanguageSwitch /></div>
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900 lg:hidden">{t("Hi, welcome to Viraj Communication POS system")}</h1>
          <h2 className="hidden text-2xl font-semibold tracking-tight text-slate-900 lg:block">{t("Log in")}</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">{t("Enter your username and password to continue.")}</p>
          <Form onSubmit={login} className="space-y-4">
            <Input label={t("Username")} name="username" required autoFocus autoComplete="username" />
            <Input label={t("Password")} name="password" type="password" required autoComplete="current-password" />
            <FormActions submitLabel={t("Log in")} busyLabel={t("Logging in...")} full />
          </Form>
        </div>
      </section>
    </div>
  );
}
