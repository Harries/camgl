import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";
import { getUserById, listUserFavoriteWebcams, listUserSubmissions } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages, localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: getMessages(locale).auth.profileTitle,
    robots: { index: false, follow: true },
  };
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [userId, locale, sp] = await Promise.all([
    getSessionUserId(),
    getServerLocale(),
    searchParams,
  ]);
  if (!userId) {
    redirect(localizePath("/login?next=/profile", locale));
  }

  const [user, favorites] = await Promise.all([
    getUserById(userId),
    listUserFavoriteWebcams(userId),
  ]);

  if (!user) {
    const loginTarget = localizePath("/login?next=/profile", locale);
    redirect(`/api/v1/auth/logout?next=${encodeURIComponent(loginTarget)}`);
  }

  const submissions = await listUserSubmissions(user.email);
  const initialTab =
    sp.tab === "webcams" || sp.tab === "settings" ? sp.tab : "favorites";

  return (
    <ProfileClient
      initialUser={user}
      initialFavorites={favorites}
      initialSubmissions={submissions}
      initialTab={initialTab}
    />
  );
}
