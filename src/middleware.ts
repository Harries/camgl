import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, stripLocalePrefix } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sitemap") ||
    pathname === "/robots.txt" ||
    pathname === "/icon.svg" ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image"
  ) {
    return NextResponse.next();
  }

  const { locale, path } = stripLocalePrefix(pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-camgl-lang", locale);

  if (locale !== "en") {
    const rewriteUrl = new URL(`${path}${search}`, request.url);
    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(LOCALE_COOKIE, "en", {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
