import type { Metadata } from "next";
import Link from "next/link";
import { listApprovedWebcams } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Webcams",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const webcams = await listApprovedWebcams(q ? { q } : undefined);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
        <h1 className="text-xl font-bold text-slate-900">
          {q ? `Search results for "${q}"` : "Search Live Webcams"}
        </h1>
        <p className="text-xs text-slate-500">
          Found {webcams.length} verified live webcam{webcams.length === 1 ? "" : "s"}
        </p>
      </div>

      {webcams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2">
          <div className="text-sm font-medium text-slate-900">No matching webcams found</div>
          <p className="text-xs text-slate-500">Try searching for Japan, Italy, Beach, or Tokyo.</p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white"
          >
            Back to Discover
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {webcams.map((cam) => (
            <WebcamCard key={cam.id} webcam={cam} />
          ))}
        </div>
      )}
    </div>
  );
}
