import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listApprovedWebcams, listCategories } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await listCategories();
  const catInfo = categories.find((c) => c.slug === category);
  if (!catInfo) return { title: "Category Not Found" };
  const title = `${catInfo.name} Live Webcams`;
  const description = `Watch verified 24/7 ${catInfo.name.toLowerCase()} live webcams from around the world with real-time weather.`;
  const canonical = `/categories/${category}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | LiveCam Global`,
      description,
      url: canonical,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [webcams, categories] = await Promise.all([
    listApprovedWebcams({ category }),
    listCategories(),
  ]);
  const catInfo = categories.find((c) => c.slug === category);
  if (!catInfo) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">Home</Link> / Categories / {catInfo.name}
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{catInfo.name} Live Webcams</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {webcams.length} verified {catInfo.name.toLowerCase()} live stream{webcams.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>
    </div>
  );
}
