import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormClient } from "@/components/AuthFormClient";
import { getSessionUserId } from "@/lib/user-auth";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages, localizePath } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: getMessages(locale).auth.loginTitle,
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage() {
  const [userId, locale] = await Promise.all([getSessionUserId(), getServerLocale()]);
  if (userId) {
    redirect(localizePath("/profile", locale));
  }
  return (
    <Suspense fallback={null}>
      <AuthFormClient mode="login" />
    </Suspense>
  );
}
