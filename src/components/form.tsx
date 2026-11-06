"use client";

import { AlertCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { createContext, FormEvent, ReactNode, useContext, useState } from "react";

export type Values = Record<string, string>;
type Control = HTMLInputElement | HTMLSelectElement;

const FormContext = createContext<{ errors: Record<string, string>; busy: boolean }>({ errors: {}, busy: false });

export const useFormState = () => useContext(FormContext);

/** Turns the browser's validity state into a plain sentence for the field. */
function messageFor(control: Control) {
  const label = control.dataset.label ?? t("This field");
  const input = control as HTMLInputElement;
  const { validity } = control;
  if (validity.valueMissing) return t("{label} is required.", { label });
  if (validity.badInput) return t("{label} must be a number.", { label });
  if (validity.rangeUnderflow) return t("{label} must be at least {n}.", { label, n: input.min });
  if (validity.rangeOverflow) return t("{label} cannot be more than {n}.", { label, n: input.max });
  if (validity.tooShort) return t("{label} needs at least {n} characters.", { label, n: input.minLength });
  if (validity.stepMismatch) return t("{label} has too many decimal places.", { label });
  return t("{label} is not valid.", { label });
}

type Props = {
  onSubmit: (values: Values, form: HTMLFormElement) => Promise<void> | void;
  /** Extra checks across fields. Return { fieldName: message }. */
  validate?: (values: Values) => Record<string, string>;
  className?: string;
  children: ReactNode;
};

/**
 * Every form in the app: shows errors under each field, focuses the first problem,
 * blocks double submits, and shows server errors at the top of the form.
 */
export function Form({ onSubmit, validate, className, children }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Values;
    const controls = [...form.elements].filter((el): el is Control => "validity" in el && Boolean((el as Control).name));

    const found: Record<string, string> = { ...validate?.(values) };
    for (const control of controls) {
      if (!control.validity.valid) found[control.name] = messageFor(control);
    }
    setErrors(found);
    setProblem("");
    const first = controls.find((control) => found[control.name]);
    if (first) {
      first.focus();
      return;
    }

    setBusy(true);
    try {
      await onSubmit(values, form);
    } catch (e) {
      setProblem((e as Error).message);
    }
    setBusy(false);
  };

  const clearError = (event: FormEvent<HTMLFormElement>) => {
    const { name } = event.target as Control;
    if (errors[name]) setErrors(({ [name]: _cleared, ...rest }) => rest);
  };

  return (
    <FormContext.Provider value={{ errors, busy }}>
      <form noValidate onSubmit={submit} onInput={clearError} className={className}>
        {problem && (
          <p role="alert" className="col-span-full flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {problem}
          </p>
        )}
        {children}
      </form>
    </FormContext.Provider>
  );
}
