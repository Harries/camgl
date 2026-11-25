import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/SiteShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/components/I18nProvider";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LiveCam Global — Verified Live Webcams Around the World",
    template: "%s | LiveCam Global",
  },
  description:
    "Explore verified 24/7 live scenic webcams, real-time local weather, and world map views across countries and cities worldwide.",
  keywords: [
    "live webcam",
    "world webcams",
    "live camera",
    "scenic webcam",
    "tokyo live cam",
    "times square live cam",
    "beach webcam",
    "weather cam",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "LiveCam Global",
    title: "LiveCam Global — Verified Live Webcams Around the World",
    description:
      "Explore verified 24/7 live scenic webcams, real-time local weather, and world map views across countries and cities worldwide.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveCam Global — Verified Live Webcams Around the World",
    description:
      "Explore verified 24/7 live scenic webcams, real-time local weather, and world map views worldwide.",
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
