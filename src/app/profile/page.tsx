import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";
import { getUserById, listUserFavoriteWebcams } from "@/lib/repository";
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

export default async function ProfilePage() {
  const [userId, locale] = await Promise.all([getSessionUserId(), getServerLocale()]);
  if (!userId) {
    redirect(localizePath("/login?next=/profile", locale));
  }

  const [user, favorites] = await Promise.all([
    getUserById(userId),
    listUserFavoriteWebcams(userId),
  ]);

  if (!user) {
    redirect(localizePath("/login?next=/profile", locale));
  }

  return <ProfileClient initialUser={user} initialFavorites={favorites} />;
}
