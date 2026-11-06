"use client";

import { BarChart3, BookOpen, Flame, LayoutDashboard, LogOut, Menu, Package, ReceiptText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { LanguageSwitch } from "./LanguageSwitch";
import { useShop } from "./ShopContext";
import { t } from "@/lib/i18n";

const LINKS = [
  { href: "/", label: t("Dashboard"), short: t("Home"), icon: LayoutDashboard, tab: true },
  { href: "/billing", label: t("Billing"), short: t("Billing"), icon: ReceiptText, tab: true },
  { href: "/gas-water", label: t("Gas & Water"), short: t("Gas"), icon: Flame, tab: true },
  { href: "/nayapotha", label: t("Nayapotha"), short: t("Nayapotha"), icon: BookOpen, tab: true },
  { href: "/inventory", label: t("Inventory"), short: t("Inventory"), icon: Package },
  { href: "/reports", label: t("Reports"), short: t("Reports"), icon: BarChart3, adminOnly: true },
  { href: "/settings", label: t("Settings"), short: t("Settings"), icon: Settings },
];

const logout = async () => {
  await api("/api/auth/logout", "POST");
  window.location.href = "/login";
};

/** Sidebar on large screens, bottom tabs on phones and tablets. */
export function Sidebar() {
  const pathname = usePathname();
  const { user, shopName, isAdmin } = useShop();
  const [moreOpen, setMoreOpen] = useState(false);

  const links = LINKS.filter((link) => !link.adminOnly || isAdmin);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreLinks = links.filter((link) => !link.tab);
  const tabClass = (active: boolean) =>
    `flex min-h-16 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-xs font-medium ${active ? "text-brand-700" : "text-slate-500"}`;

  return (
    <>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <p className="font-semibold leading-tight text-slate-900">{shopName}</p>
          <p className="text-xs text-slate-500">{t("Point of Sale")}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Icon className="size-[18px]" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3"><LanguageSwitch /></div>
          <p className="text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <LogOut className="size-4" /> {t("Log out")}
          </button>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <p className="font-semibold text-slate-900">{shopName}</p>
      </header>

      <nav aria-label={t("Main")} className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {links.filter((link) => link.tab).map(({ href, short, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMoreOpen(false)} aria-current={isActive(href) ? "page" : undefined} className={tabClass(isActive(href))}>
            <span className={`rounded-full px-4 py-1 ${isActive(href) ? "bg-brand-100" : ""}`}><Icon className="size-5" /></span> {short}
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen}
          className={tabClass(moreOpen || moreLinks.some((link) => isActive(link.href)))}
        >
          <span className={`rounded-full px-4 py-1 ${moreOpen || moreLinks.some((link) => isActive(link.href)) ? "bg-brand-100" : ""}`}><Menu className="size-5" /></span> {t("More")}
        </button>
      </nav>

      {moreOpen && (
        <div className="no-print fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] rounded-t-xl bg-white p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-3 pb-3 pt-1"><LanguageSwitch /></div>
            <p className="px-3 pb-2 pt-1 text-sm text-slate-500">{user.name} <span className="capitalize">({user.role})</span></p>
            {moreLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href} href={href} onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 font-medium ${isActive(href) ? "bg-brand-50 text-brand-700" : "text-slate-700"}`}
              >
                <Icon className="size-5" /> {label}
              </Link>
            ))}
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 font-medium text-red-600">
              <LogOut className="size-5" /> {t("Log out")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
