"use client";

import { ChevronRight, Eye, EyeOff, Info as InfoIcon, X } from "lucide-react";
import Link from "next/link";
import { ButtonHTMLAttributes, Children, cloneElement, InputHTMLAttributes, isValidElement, ReactElement, ReactNode, SelectHTMLAttributes, useState } from "react";
import { useFormState } from "./form";
import { t } from "@/lib/i18n";

type Variant = "primary" | "secondary" | "danger" | "success";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-brand-600 text-white hover:bg-brand-700",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 touch-manipulation text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

const CONTROL = "w-full rounded-lg border bg-white px-3 py-2 text-base outline-none sm:text-sm focus:ring-2";
const CONTROL_OK = "border-slate-300 focus:border-brand-500 focus:ring-brand-200";
const CONTROL_BAD = "border-red-400 focus:border-red-500 focus:ring-red-200";

/** Small (i) tag. Hover, tap or tab to it to read what something means. */
export function Info({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle" tabIndex={0} role="note" aria-label={text}>
      <InfoIcon className="size-4 cursor-help text-slate-400 group-hover:text-brand-600 group-focus:text-brand-600" />
      <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-60 -translate-x-1/2 rounded-lg max-sm:fixed max-sm:inset-x-4 max-sm:top-auto max-sm:mt-6 max-sm:w-auto max-sm:translate-x-0 bg-slate-800 px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-lg group-hover:block group-focus:block">
        {text}
      </span>
    </span>
  );
}

type FieldProps = { label?: string; hint?: string; info?: string; name?: string; required?: boolean; children: ReactNode };

function Field({ label, hint, info, name, required, children }: FieldProps) {
  const error = useFormState().errors[name ?? ""];
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <label htmlFor={name}>{label}{required && <span className="text-red-600"> *</span>}</label>
          {info && <Info text={info} />}
        </div>
      )}
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; info?: string };

export function Input({ label, hint, info, className = "", type, ...props }: InputProps) {
  const invalid = Boolean(useFormState().errors[props.name ?? ""]);
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const input = (
    <input
      id={props.name} data-label={label} aria-invalid={invalid} type={isPassword && visible ? "text" : type}
      inputMode={type === "number" ? "decimal" : undefined}
      className={`${CONTROL} ${invalid ? CONTROL_BAD : CONTROL_OK} ${isPassword ? "pr-10" : ""} ${className}`} {...props}
    />
  );
  return (
    <Field label={label} hint={hint} info={info} name={props.name} required={props.required}>
      {isPassword ? (
        <div className="relative">
          {input}
          <button type="button" className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700" aria-label={visible ? t("Hide password") : t("Show password")} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      ) : input}
    </Field>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; info?: string };

export function Select({ label, hint, info, children, className = "", ...props }: SelectProps) {
  const invalid = Boolean(useFormState().errors[props.name ?? ""]);
  return (
    <Field label={label} hint={hint} info={info} name={props.name} required={props.required}>
      <select id={props.name} data-label={label} aria-invalid={invalid} className={`${CONTROL} ${invalid ? CONTROL_BAD : CONTROL_OK} ${className}`} {...props}>{children}</select>
    </Field>
  );
}

/** Cancel and Save buttons for any Form. Save shows progress and cannot be pressed twice. */
export function FormActions({ submitLabel, busyLabel = t("Saving..."), onCancel, full }: { submitLabel: string; busyLabel?: string; onCancel?: () => void; full?: boolean }) {
  const { busy } = useFormState();
  return (
    <div className="form-actions flex justify-end gap-2 max-sm:[&>button]:flex-1 max-sm:[&>button]:py-3">
      {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>{t("Cancel")}</Button>}
      <Button type="submit" disabled={busy} className={full ? "w-full" : ""}>{busy ? busyLabel : submitLabel}</Button>
    </div>
  );
}

export function Card({ title, info, action, children, className = "" }: { title?: string; info?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">{title} {info && <Info text={info} />}</h2>
          {action}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, info, action }: { title: string; subtitle?: string; info?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:items-end">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">{title} {info && <Info text={info} />}</h1>
        {subtitle && <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES = {
  indigo: "text-brand-600", emerald: "text-emerald-600", amber: "text-amber-600", red: "text-red-600",
};

export function Stat({ label, value, icon, note, info, tone = "indigo" }: { label: string; value: string | number; icon: ReactNode; note?: string; info?: string; tone?: keyof typeof TONES }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">{label} {info && <Info text={info} />}</p>
        <span className={`[&_svg]:size-4 ${TONES[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 break-words text-lg font-semibold sm:text-2xl tracking-tight text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

const BADGES = {
  green: "bg-emerald-100 text-emerald-700", red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700", slate: "bg-slate-100 text-slate-600",
};

export function Badge({ tone = "slate", children }: { tone?: keyof typeof BADGES; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGES[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div className={`flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label={t("Close")}><X className="size-5 text-slate-400" /></button>
        </header>
        <div className="overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] [&_.form-actions]:sticky [&_.form-actions]:-bottom-5 [&_.form-actions]:bg-white [&_.form-actions]:py-3">{children}</div>
      </div>
    </div>
  );
}

type Cell = ReactElement<{ children?: ReactNode; "data-label"?: string }>;

/** Adds each column's name to its cells so a row can show as a card on phones. */
function labelCells(row: ReactNode, headers: string[]) {
  if (!isValidElement<{ children?: ReactNode }>(row)) return row;
  const cells = Children.toArray(row.props.children).map((cell, index) =>
    isValidElement(cell) ? cloneElement(cell as Cell, { "data-label": headers[index] ? t(headers[index]) : "" }, <div>{(cell as Cell).props.children}</div>) : cell);
  return cloneElement(row, undefined, cells);
}

export function Table({ headers, children, hideOnPhone }: { headers: string[]; children: ReactNode; hideOnPhone?: boolean }) {
  return (
    <div className={`overflow-x-auto ${hideOnPhone ? "hidden sm:block" : ""}`}>
      <table className="responsive-table w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h && t(h)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&_td]:px-3 [&_td]:py-2.5 [&_tr:hover]:bg-slate-50">
          {Children.toArray(children).map((row) => labelCells(row, headers))}
        </tbody>
      </table>
    </div>
  );
}

/** One tappable line in a phone list. Use with PhoneList in place of a table. */
export function ListRow({ title, subtitle, value, href, onClick }: { title: string; subtitle?: string; value?: ReactNode; href?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-slate-900">{title}</span>
        {subtitle && <span className="block truncate text-sm text-slate-500">{subtitle}</span>}
      </span>
      {value}
      <ChevronRight className="size-4 shrink-0 text-slate-300" />
    </>
  );
  const className = "flex min-h-16 w-full touch-manipulation items-center gap-3 py-2 text-left active:bg-slate-50";
  return <li>{href ? <Link href={href} className={className}>{body}</Link> : <button onClick={onClick} className={className}>{body}</button>}</li>;
}

export function PhoneList({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-slate-100 sm:hidden">{children}</ul>;
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-slate-500">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Loading({ error }: { error?: string }) {
  return error
    ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    : <p className="py-12 text-center text-sm text-slate-400">{t("Loading...")}</p>;
}
