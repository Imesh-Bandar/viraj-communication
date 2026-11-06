"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "./ui";
import { t } from "@/lib/i18n";

export function ReceiptActions({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (autoPrint) window.print();
  }, [autoPrint]);

  return (
    <div className="no-print flex gap-2">
      <Link href="/billing"><Button variant="secondary"><ArrowLeft className="size-4" /> {t("New Bill")}</Button></Link>
      <Button onClick={() => window.print()}><Printer className="size-4" /> {t("Print")}</Button>
    </div>
  );
}
