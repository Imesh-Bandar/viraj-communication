import { handle } from "@/lib/api";
import { customerSchema } from "@/lib/schemas";
import { listCustomers, saveCustomer } from "@/services/customers";

export const GET = handle(() => listCustomers());

export const POST = handle(async ({ req }) => saveCustomer(customerSchema.parse(await req.json())));
