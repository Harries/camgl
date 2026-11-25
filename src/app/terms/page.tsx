import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | LiveCam Global",
  description:
    "Terms of Service governing the use of LiveCam Global, official webcam embeds, partner submissions, and content attribution.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using LiveCam Global (camgl.com), you agree to comply with these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the site.",
    ],
  },
  {
    title: "2. Nature of the Service",
    body: [
      "LiveCam Global provides an informational directory, interactive world map, and official embed viewer for publicly available live scenic webcams worldwide.",
      "All video streams, snapshots, and trademarks remain the intellectual property of their respective camera operators, tourism boards, and broadcasters. LiveCam Global provides attribution and links back to official sources where available.",
    ],
  },
  {
    title: "3. Partner & Operator Submissions",
    body: [
      "When submitting a webcam via our submission form (/submit), you represent and warrant that:",
      "• The camera displays a public scenic, weather, wildlife, transit, or landmark view and does not invade private spaces or sensitive areas.",
      "• You own the stream or hold authority to permit public embedding on third-party directories.",
      "• All submitted title, location, description, and contact details are accurate.",
      "LiveCam Global reserves the right to approve, edit metadata for clarity, or remove any listing at any time.",
    ],
  },
  {
    title: "4. Acceptable Use",
    body: [
      "You agree not to scrape, mirror, overload, or interfere with LiveCam Global's APIs, health-check endpoints, or admin interfaces, and not to bypass technical restrictions enforced by upstream stream providers.",
    ],
  },
  {
    title: "5. Availability & Disclaimers",
    body: [
      "Live streams and local weather data are provided on an \"as-is\" and \"as-available\" basis. Because streams originate from external providers around the world, temporary outages, geo-restrictions, or stream changes may occur without notice.",
    ],
  },
  {
    title: "6. Copyright & Removal Requests",
    body: [
      "If you are a rights holder or camera operator and wish to update attribution or have a stream removed from LiveCam Global, please contact us with the listing URL and verification details.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Legal &amp; Compliance
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Last updated: November 25, 2026 · Guidelines for visitors, stream operators, and partners on LiveCam Global.
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
            Contact Us
          </Link>
          <Link
            href="/privacy"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
