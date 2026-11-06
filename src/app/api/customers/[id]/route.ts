import { handle } from "@/lib/api";
import { customerSchema, ledgerSchema } from "@/lib/schemas";
import { getLedger, recordLedger, saveCustomer } from "@/services/customers";

export const GET = handle(({ params }) => getLedger(params.id));

export const PUT = handle(async ({ req, params }) => {
  await saveCustomer(customerSchema.parse(await req.json()), params.id);
});

/** Adds a debt or a payment to the customer's Nayapotha page. */
export const POST = handle(async ({ req, params, session }) => {
  const { type, amount, note } = ledgerSchema.parse(await req.json());
  await recordLedger(params.id, type, amount, note, session);
});
