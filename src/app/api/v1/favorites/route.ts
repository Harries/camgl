import { NextResponse } from "next/server";
import {
  listMostLikedWebcams,
  listUserFavoriteWebcams,
  toggleUserFavorite,
} from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";

export async function GET() {
  const userId = await getSessionUserId();
  const [ranked, myFavorites] = await Promise.all([
    listMostLikedWebcams(48),
    userId ? listUserFavoriteWebcams(userId) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    authenticated: Boolean(userId),
    ranked,
    myFavorites,
    mySlugs: myFavorites.map((w) => w.slug),
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Login required to favorite webcams" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = String(body?.slug ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Webcam slug is required" }, { status: 400 });
    }
    const result = await toggleUserFavorite(userId, slug);
    if (!result) {
      return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
