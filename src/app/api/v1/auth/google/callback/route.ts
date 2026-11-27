import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findOrCreateGoogleUser } from "@/lib/repository";
import { createUserSessionToken, isSecureRequest, USER_COOKIE_NAME } from "@/lib/user-auth";

const OAUTH_STATE_COOKIE = "livecam_google_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  const fail = (err: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${err}`, url.origin));
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };

  if (!code || !state || !stateCookie) {
    return fail("google_failed");
  }

  let expectedState = "";
  let nextPath = "/profile";
  try {
    const parsed = JSON.parse(stateCookie) as { state?: string; next?: string };
    expectedState = parsed.state ?? "";
    if (parsed.next && parsed.next.startsWith("/") && !parsed.next.startsWith("//")) {
      nextPath = parsed.next;
    }
  } catch {
    return fail("google_failed");
  }

  if (!expectedState || expectedState !== state) {
    return fail("google_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail("google_not_configured");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${url.origin}/api/v1/auth/google/callback`,
      }).toString(),
    });

    if (!tokenRes.ok) return fail("google_failed");
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) return fail("google_failed");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!userRes.ok) return fail("google_failed");

    const googleUser = (await userRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!googleUser.sub || !googleUser.email) {
      return fail("google_failed");
    }

    const user = await findOrCreateGoogleUser({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split("@")[0] || "Google User",
      avatarUrl: googleUser.picture ?? null,
      emailVerified: Boolean(googleUser.email_verified),
    });

    const sessionToken = createUserSessionToken(user.id);
    const response = NextResponse.redirect(new URL(nextPath, url.origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(USER_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return fail("google_failed");
  }
}
