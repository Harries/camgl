import { NextResponse } from "next/server";
import { getUserById, getUserFavoriteSlugs } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null, favoriteSlugs: [] });
  }
  const [user, favoriteSlugs] = await Promise.all([
    getUserById(userId),
    getUserFavoriteSlugs(userId),
  ]);
  if (!user) {
    return NextResponse.json({ user: null, favoriteSlugs: [] });
  }
  return NextResponse.json({ user, favoriteSlugs });
}
