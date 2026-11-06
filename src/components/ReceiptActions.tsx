"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "./ui";
import { t } from "@/lib/i18n";

const MM_PER_PX = 25.4 / 96;

/** Browsers need an exact paper size, so the height is measured from the bill itself. */
function setPaperSize(paperWidth: number) {
  const bill = document.getElementById("receipt");
  if (!bill) return;
  const height = Math.ceil(bill.offsetHeight * MM_PER_PX) + 8;
  let style = document.getElementById("receipt-page") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "receipt-page";
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${paperWidth}mm ${height}mm; margin: 0; }`;
}

export function ReceiptActions({ autoPrint, paperWidth }: { autoPrint: boolean; paperWidth: number }) {
  useEffect(() => {
    const prepare = () => setPaperSize(paperWidth);
    prepare();
    window.addEventListener("beforeprint", prepare);
    if (autoPrint) window.print();
    return () => window.removeEventListener("beforeprint", prepare);
  }, [autoPrint, paperWidth]);

  return (
    <div className="no-print flex gap-2">
      <Link href="/billing"><Button variant="secondary"><ArrowLeft className="size-4" /> {t("New Bill")}</Button></Link>
      <Button onClick={() => window.print()}><Printer className="size-4" /> {t("Print")}</Button>
    </div>
  );
}
