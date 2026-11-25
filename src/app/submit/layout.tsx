import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const seo = getMessages(locale).seo;
  return {
    title: seo.submitTitle,
    description: seo.submitDesc,
    alternates: buildAlternates("/submit", locale),
    openGraph: {
      title: `${seo.submitTitle} | LiveCam Global`,
      description: seo.submitDesc,
      url: buildAlternates("/submit", locale).canonical,
    },
  };
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
