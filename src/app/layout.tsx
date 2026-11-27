import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { buildAlternates, getSiteUrl } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n";

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const seo = getMessages(locale).seo;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.homeTitle,
      template: seo.homeTemplate,
    },
    description: seo.homeDesc,
    keywords: seo.homeKeywords,
    alternates: buildAlternates("/", locale),
    openGraph: {
      type: "website",
      siteName: "LiveCam Global",
      title: seo.homeTitle,
      description: seo.homeDesc,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.homeTitle,
      description: seo.homeDesc,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LiveCam Global",
  url: siteUrl,
  description:
    "Explore verified 24/7 live scenic webcams, real-time local weather, and world map views worldwide.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://webcams.windy.com" />
        <link rel="preconnect" href="https://imgproxy.windy.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          <I18nProvider>
            <SiteShell>{children}</SiteShell>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
