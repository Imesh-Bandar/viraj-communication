import { handle } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { today } from "@/lib/format";
import { monthlyReport } from "@/services/reports";

export const GET = handle(async ({ req }) => {
  const month = req.nextUrl.searchParams.get("month") || today().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new AppError("Choose a valid month.");
  return monthlyReport(month);
}, { admin: true });
