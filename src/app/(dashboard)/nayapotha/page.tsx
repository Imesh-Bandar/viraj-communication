"use client";

import { BookOpen, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomerForm } from "@/components/CustomerForm";
import { useShop } from "@/components/ShopContext";
import { Badge, Button, Card, Empty, Input, ListRow, Loading, PageHeader, PhoneList, Stat, Table } from "@/components/ui";
import { useApi } from "@/lib/client";
import { t } from "@/lib/i18n";

type Customer = { _id: string; name: string; phone: string; address: string; creditLimit: number; balance: number };

export default function NayapothaPage() {
  const { rs } = useShop();
  const { data: customers, error, reload } = useApi<Customer[]>("/api/customers");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  if (!customers) return <Loading error={error} />;

  const owing = customers.filter((c) => c.balance > 0);
  const term = search.toLowerCase();
  const shown = customers.filter((c) => c.name.toLowerCase().includes(term) || c.phone?.includes(term));

  return (
    <>
      <PageHeader
        title={t("Nayapotha")} subtitle={t("Customer credit book: who owes the shop and what they have paid.")}
        info={t("Bills paid by Nayapotha are added here automatically. Open a customer to take a payment.")}
        action={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> {t("Add Customer")}</Button>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4">
        <Stat label={t("Total to collect")} value={rs(owing.reduce((sum, c) => sum + c.balance, 0))} icon={<BookOpen />} tone="amber" />
        <Stat label={t("Customers owing")} value={t("{a} of {b}", { a: owing.length, b: customers.length })} icon={<Users />} />
      </div>
      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 size-4 text-slate-400 sm:top-2.5" />
          <Input className="pl-9" placeholder={t("Search name or phone")} aria-label={t("Search customers")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {shown.length === 0 ? <Empty action={customers.length === 0 && <Button onClick={() => setAdding(true)}><Plus className="size-4" /> {t("Add Customer")}</Button>}>{customers.length === 0 ? t("No customers yet. Add your first customer.") : t("No customers match your search.")}</Empty> : (
          <>
          <PhoneList>
            {shown.map((c) => (
              <ListRow
                key={c._id} title={c.name} subtitle={c.phone || undefined} href={`/nayapotha/${c._id}`}
                value={c.balance > 0 ? <Badge tone="amber">{rs(c.balance)}</Badge> : <Badge tone="green">{t("Clear")}</Badge>}
              />
            ))}
          </PhoneList>
          <Table hideOnPhone headers={["Customer", "Phone", "Limit", "Owes", ""]}>
            {shown.map((c) => (
              <tr key={c._id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-slate-500">{c.phone || "-"}</td>
                <td className="whitespace-nowrap text-slate-500">{c.creditLimit ? rs(c.creditLimit) : t("No limit")}</td>
                <td className="whitespace-nowrap">{c.balance > 0 ? <Badge tone="amber">{rs(c.balance)}</Badge> : <Badge tone="green">{t("Clear")}</Badge>}</td>
                <td><Link className="text-brand-600 hover:underline" href={`/nayapotha/${c._id}`}>{t("Open")}</Link></td>
              </tr>
            ))}
          </Table>
          </>
        )}
      </Card>
      {adding && <CustomerForm customer={null} onClose={() => setAdding(false)} onSaved={reload} />}
    </>
  );
}
