import { z } from "zod";

const amount = (label: string) => z.coerce.number({ error: `${label} must be a number.` }).min(0, `${label} cannot be negative.`);
const name = (label: string) => z.string().trim().min(1, `${label} is required.`).max(150);

export const itemSchema = z.object({
  name: name("Item name"),
  barcode: z.string().trim().max(60).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  costPrice: amount("Cost price"),
  sellPrice: amount("Selling price"),
  reorderLevel: amount("Low stock level"),
  stock: amount("Opening stock").optional(),
  image: z.string().nullable().optional(),
});

export const stockSchema = z.object({
  change: z.coerce.number().refine((v) => v !== 0, "Enter a quantity other than 0."),
  note: z.string().trim().max(200).optional().default(""),
});

export const saleLineSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().trim().max(150).optional(),
  price: amount("Price").optional(),
  qty: z.coerce.number().positive("Quantity must be more than 0."),
});

export const checkoutSchema = z.object({
  lines: z.array(saleLineSchema).min(1, "The bill is empty."),
  discount: amount("Discount").default(0),
  method: z.enum(["cash", "card", "credit"]),
  tendered: amount("Amount paid").default(0),
  customerId: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  name: name("Customer name"),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  creditLimit: amount("Credit limit").default(0),
});

export const ledgerSchema = z.object({
  type: z.enum(["credit", "payment"]),
  amount: z.coerce.number().positive("Amount must be more than 0."),
  note: z.string().trim().max(200).optional().default(""),
});

export const gwProductSchema = z.object({
  type: z.enum(["gas", "water"]),
  name: name("Product name"),
  refillPrice: amount("Refill price"),
  newPrice: amount("New price"),
  refillCost: amount("Refill cost"),
  newCost: amount("New cost"),
  full: amount("Full stock").optional(),
  empty: amount("Empty stock").optional(),
});

export const gwSellSchema = z.object({
  productId: z.string(),
  action: z.enum(["refill", "sell_new"]),
  qty: z.coerce.number().int("Quantity must be a whole number.").positive("Quantity must be more than 0."),
  method: z.enum(["cash", "card", "credit"]),
  tendered: amount("Amount paid").default(0),
  customerId: z.string().optional().nullable(),
});

export const gwStockSchema = z.object({
  productId: z.string(),
  action: z.enum(["supplier_refill", "buy_new"]),
  qty: z.coerce.number().int("Quantity must be a whole number.").positive("Quantity must be more than 0."),
  note: z.string().trim().max(200).optional().default(""),
});

export const settingsSchema = z.object({
  shopName: name("Shop name"),
  address: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(40).default(""),
  currency: z.string().trim().min(1).max(6),
  receiptFooter: z.string().trim().max(200).default(""),
  receiptWidth: z.enum(["58", "80"]),
  autoPrint: z.boolean(),
  logo: z.string().nullable().optional(),
});

export const userSchema = z.object({
  name: name("Name"),
  username: z.string().trim().toLowerCase().min(3, "Username needs at least 3 letters.").max(40),
  password: z.string().min(6, "Password needs at least 6 characters."),
  role: z.enum(["admin", "cashier"]),
});

export const passwordSchema = z.object({
  current: z.string().min(1, "Enter your current password."),
  next: z.string().min(6, "New password needs at least 6 characters."),
});
