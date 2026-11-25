import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, SUPPORTED_LOCALES } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const langParam = request.nextUrl.searchParams.get("lang")?.toLowerCase().trim();
  if (langParam && (SUPPORTED_LOCALES as readonly string[]).includes(langParam)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-camgl-lang", langParam);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
