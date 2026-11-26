import { NextResponse } from "next/server";
import { isSecureRequest, USER_COOKIE_NAME } from "@/lib/user-auth";

function clearCookie(response: NextResponse, request: Request) {
  response.cookies.set(USER_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  clearCookie(response, request);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextParam = url.searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/login";
  const response = NextResponse.redirect(new URL(safeNext, url.origin));
  clearCookie(response, request);
  return response;
}
