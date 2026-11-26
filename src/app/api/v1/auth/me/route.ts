import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getUserById, getUserFavoriteSlugs } from "@/lib/repository";
import { getSessionUserId } from "@/lib/user-auth";

export async function GET() {
  const [userId, adminAuthed] = await Promise.all([
    getSessionUserId(),
    isAdminAuthenticated(),
  ]);
  if (!userId) {
    return NextResponse.json({ user: null, favoriteSlugs: [], isAdmin: adminAuthed });
  }
  const [user, favoriteSlugs] = await Promise.all([
    getUserById(userId),
    getUserFavoriteSlugs(userId),
  ]);
  if (!user) {
    return NextResponse.json({ user: null, favoriteSlugs: [], isAdmin: adminAuthed });
  }
  return NextResponse.json({
    user,
    favoriteSlugs,
    isAdmin: user.role === "ADMIN" || adminAuthed,
  });
}
