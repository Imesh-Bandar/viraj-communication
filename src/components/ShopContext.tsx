"use client";

import { createContext, useContext } from "react";
import { Session } from "@/lib/auth";
import { money } from "@/lib/format";

type Shop = { user: Session; shopName: string; currency: string };
const ShopContext = createContext<Shop | null>(null);

export function ShopProvider({ value, children }: { value: Shop; children: React.ReactNode }) {
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop must be used inside ShopProvider");
  return {
    ...shop,
    isAdmin: shop.user.role === "admin",
    rs: (value: number) => money(value, shop.currency),
  };
}
