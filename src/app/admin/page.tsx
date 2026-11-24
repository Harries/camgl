import type { Metadata } from "next";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/repository";
import { AdminConsoleClient } from "@/components/AdminConsoleClient";
import { AdminLoginClient } from "@/components/AdminLoginClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return <AdminLoginClient />;
  }

  const initialData = getAdminDashboardData();
  return <AdminConsoleClient initialData={initialData} />;
}
