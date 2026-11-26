import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboardData, getUserById } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";
import { AdminConsoleClient } from "@/components/AdminConsoleClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Console",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const [authed, userId] = await Promise.all([isAdminAuthenticated(), getSessionUserId()]);
  const user = userId ? await getUserById(userId) : null;

  if (!authed) {
    if (!user) {
      redirect("/login?next=/admin");
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Admin Access Required
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your account ({user.email}) does not have administrator permissions.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/profile"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Personal Center
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initialData = await getAdminDashboardData();
  return <AdminConsoleClient initialData={initialData} currentUser={user} />;
}
