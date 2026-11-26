import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listApprovedWebcamsPage, listCategories } from "@/lib/repository";
import { WebcamCard } from "@/components/WebcamCard";
import { PaginationBar } from "@/components/PaginationBar";
import { absoluteUrl, buildAlternates } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n-server";
import { formatMessage, getCategoryLabel, getMessages, localizePath } from "@/lib/i18n";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const [categories, locale] = await Promise.all([listCategories(), getServerLocale()]);
  const catInfo = categories.find((c) => c.slug === category);
  if (!catInfo) return { title: "Category Not Found" };
  const seo = getMessages(locale).seo;
  const catLabel = getCategoryLabel(locale, catInfo.slug, catInfo.name);
  const title = formatMessage(seo.categoryTitle, { category: catLabel });
  const description = formatMessage(seo.categoryDesc, { category: catLabel.toLowerCase() });
  const canonical = `/categories/${category}`;
  const alternates = buildAlternates(canonical, locale);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title: `${title} | LiveCam Global`,
      description,
      url: alternates.canonical,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  const [pageData, categories, locale] = await Promise.all([
    listApprovedWebcamsPage({ category, page, pageSize }),
    listCategories(),
    getServerLocale(),
  ]);
  const catInfo = categories.find((c) => c.slug === category);
  if (!catInfo) notFound();
  const webcams = pageData.items;
  const totalPages = Math.max(1, Math.ceil(pageData.total / pageSize));
  const catLabel = getCategoryLabel(locale, catInfo.slug, catInfo.name);
  const tw = getMessages(locale).webcam;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tw.home, item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: catLabel, item: absoluteUrl(`/categories/${category}`) },
    ],
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Link href={localizePath("/", locale)} className="hover:underline">{tw.home}</Link> / {catLabel}
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {formatMessage(tw.categoryWebcams, { name: catLabel })}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage(getMessages(locale).home.showingWebcams, { count: pageData.total })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {webcams.map((cam) => (
          <WebcamCard key={cam.id} webcam={cam} />
        ))}
      </div>

      <PaginationBar
        basePath={localizePath(`/categories/${category}`, locale)}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}
