import type { Metadata } from "next";
import { listApprovedWebcams } from "@/lib/repository";
import { WorldExplorerClient } from "@/components/WorldExplorerClient";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Map & Countries Explorer",
  description: "Explore verified live webcams on the world map and by country and city.",
};

export default async function CountriesPage() {
  const webcams = await listApprovedWebcams();
  return <WorldExplorerClient webcams={webcams} />;
}
