import { NextResponse } from "next/server";
import { getUserById, listUserFavoriteWebcams, updateUserProfile } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [user, favorites] = await Promise.all([
    getUserById(userId),
    listUserFavoriteWebcams(userId),
  ]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user, favorites });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Display name must be 1-60 characters" }, { status: 400 });
    }
    const user = await updateUserProfile(userId, { name });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
