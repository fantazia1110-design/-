"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Megaphone, LogOut, FlaskConical } from "lucide-react";
import { Logo, Avatar } from "@/components/brand";
import { fetchJson } from "@/lib/client-utils";

interface Props {
  user: { name: string; pictureUrl: string | null; isDemo: boolean };
  children: ReactNode;
}

const NAV = [
  { href: "/dashboard", label: "صفحاتي", icon: LayoutGrid },
  { href: "/dashboard/campaigns", label: "الحملات", icon: Megaphone },
];

export function DashboardShell({ user, children }: Props) {
  const pathname = usePathname();

  const logout = async () => {
    await fetchJson("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="bg-scene min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-extrabold hidden sm:block">مسنجر برودكاستر</span>
            {user.isDemo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber bg-amber/10 border border-amber/25 rounded-full px-3 py-1">
                <FlaskConical size={12} />
                وضع تجريبي
              </span>
            )}
          </div>

          <nav className="flex items-center gap-1.5">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                  isActive(n.href)
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <n.icon size={16} />
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-end">
              <p className="text-sm font-bold leading-none">{user.name}</p>
              <p className="text-[11px] text-white/40 mt-1">حساب فيسبوك</p>
            </div>
            <Avatar name={user.name} src={user.pictureUrl} size={38} />
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="btn-ghost glass rounded-xl p-2.5 text-white/60 hover:text-red-300 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">{children}</div>
    </div>
  );
}
