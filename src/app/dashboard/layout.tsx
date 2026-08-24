import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return (
    <DashboardShell
      user={{ name: user.name, pictureUrl: user.pictureUrl, isDemo: user.isDemo }}
    >
      {children}
    </DashboardShell>
  );
}
