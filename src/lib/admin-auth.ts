import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "livecam_admin_session";

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET || "15001327397";
}

export function verifyAdminSecret(input: string): boolean {
  const expected = Buffer.from(getAdminSecret(), "utf8");
  const actual = Buffer.from(input, "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function createAdminSessionToken(): string {
  return crypto
    .createHmac("sha256", getAdminSecret())
    .update("livecam-admin-session-v1")
    .digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = Buffer.from(createAdminSessionToken(), "utf8");
  const actual = Buffer.from(token, "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
