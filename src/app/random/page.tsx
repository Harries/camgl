import { redirect } from "next/navigation";
import { getRandomWebcam } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function RandomPage() {
  const cam = await getRandomWebcam();
  if (!cam) redirect("/");
  redirect(`/webcams/${cam.slug}`);
}
