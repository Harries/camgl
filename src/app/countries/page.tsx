import type { Metadata } from "next";
import { listApprovedWebcams } from "@/lib/repository";
import { WorldExplorerClient } from "@/components/WorldExplorerClient";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Map & Countries Explorer",
  description:
    "Explore verified 24/7 live webcams on the interactive world map, filtered by country, city, and category.",
  alternates: { canonical: "/countries" },
  openGraph: {
    title: "Map & Countries Explorer | LiveCam Global",
    description:
      "Explore verified 24/7 live webcams on the interactive world map, filtered by country, city, and category.",
    url: "/countries",
  },
};

export default async function CountriesPage() {
  const webcams = await listApprovedWebcams();
  return <WorldExplorerClient webcams={webcams} />;
}
