"use client";

import { useCallback, useEffect, useState } from "react";
import { t, translateMessage } from "./i18n";

/** Calls our API. Throws an Error holding the friendly server message. */
export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !url.includes("/auth/")) window.location.href = "/login";
  if (!response.ok) throw new Error(translateMessage(data.error ?? "Something went wrong. Please try again."));
  return data as T;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ? translateMessage(data.error) : t("The image could not be uploaded."));
  return data.url;
}

/** Loads a URL and gives back data, error and a reload function. */
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    api<T>(url)
      .then((result) => { if (current) { setData(result); setError(""); } })
      .catch((e: Error) => { if (current) setError(e.message); });
    return () => { current = false; };
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}
