"use client";

import { ReactNode, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** The language lives in the browser, so text is drawn there to avoid a flash of the wrong language. */
export function LanguageGate({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return ready ? children : null;
}
