import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormClient } from "@/components/AuthFormClient";
import { getUserById } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages, localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: getMessages(locale).auth.registerTitle,
    robots: { index: false, follow: true },
  };
}

export default async function RegisterPage() {
  const [userId, locale] = await Promise.all([getSessionUserId(), getServerLocale()]);
  const user = userId ? await getUserById(userId) : null;
  if (user) {
    redirect(localizePath("/profile", locale));
  }
  return (
    <Suspense fallback={null}>
      <AuthFormClient mode="register" />
    </Suspense>
  );
}
