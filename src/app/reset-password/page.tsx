import { Suspense } from "react";
import type { Metadata } from "next";
import { PasswordResetClient } from "@/components/PasswordResetClient";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: getMessages(locale).auth.resetTitle,
    robots: { index: false, follow: false },
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetClient mode="reset" />
    </Suspense>
  );
}
