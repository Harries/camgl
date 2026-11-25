import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | LiveCam Global",
  description:
    "Learn how LiveCam Global handles privacy, public scenic webcam embeds, theme preferences, and partner submissions.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. Public Scenic Streams Only",
    body: [
      "LiveCam Global (camgl.com) is a curated directory of publicly accessible scenic webcams—including beaches, city skylines, mountains, ports, wildlife habitats, and transit landmarks.",
      "We do not host private surveillance cameras, residential feeds, or unauthorized streams. Every camera is reviewed prior to publication for public-view appropriateness and operator attribution.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "Browsing LiveCam Global does not require an account or login. We store only minimal functional preferences—such as your light/dark theme selection in browser localStorage.",
      "If you submit a webcam through our Partner & Operator Portal (/submit), we collect the contact email and operator details you provide solely to verify stream authorization and communicate review status. Contact emails are never exposed in public pages or public APIs.",
      "If you submit a stream issue report on a webcam page, we store the report category and optional description to help keep our directory accurate and online.",
    ],
  },
  {
    title: "3. Third-Party Embeds & External Services",
    body: [
      "Live video streams are delivered directly from official third-party broadcasters and embed providers—such as YouTube (via privacy-enhanced youtube-nocookie.com embeds), Windy, HLS stream hosts, or official tourism/operator portals. When you play a video, those third-party providers may process standard technical request data (such as IP address and browser user agent) according to their own privacy policies.",
      "Real-time local weather summaries displayed alongside webcams are fetched using public city coordinates via Open-Meteo without sending any personal user data.",
    ],
  },
  {
    title: "4. Cookies, Analytics & Retention",
    body: [
      "We minimize cookie usage and do not sell personal data to third parties. Standard hosting and edge logs may temporarily record anonymized request metadata for security, rate limiting, and uptime monitoring.",
      "Partner submission records and audit logs are retained for compliance and attribution verification. You may request update or deletion of your contact information at any time.",
    ],
  },
  {
    title: "5. Privacy & Takedown Requests",
    body: [
      "If you operate a listed camera or believe a stream raises a privacy concern, please reach out to us with the webcam URL so we can review or remove it promptly.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Legal &amp; Compliance
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Last updated: November 25, 2026 · How LiveCam Global protects visitor privacy and reviews public scenic streams.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6 shadow-sm">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {section.title}
            </h2>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {section.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <Link
            href="/contact"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Contact Privacy Team
          </Link>
          <Link
            href="/terms"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Read Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
