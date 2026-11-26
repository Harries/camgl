import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findOrCreateGithubUser } from "@/lib/repository";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-auth";

const OAUTH_STATE_COOKIE = "livecam_github_oauth_state";

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
    return fail("github_failed");
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
    return fail("github_failed");
  }

  if (!expectedState || expectedState !== state) {
    return fail("github_failed");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail("github_not_configured");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${url.origin}/api/v1/auth/github/callback`,
      }),
    });

    if (!tokenRes.ok) return fail("github_failed");
    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenJson.access_token;
    if (!accessToken) return fail("github_failed");

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "LiveCamGlobal",
    };

    const userRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!userRes.ok) return fail("github_failed");
    const ghUser = (await userRes.json()) as {
      id: number;
      login: string;
      name?: string | null;
      email?: string | null;
      avatar_url?: string | null;
    };

    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", { headers: ghHeaders });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primary =
          emails.find((e) => e.primary && e.verified) ??
          emails.find((e) => e.verified) ??
          emails[0];
        email = primary?.email ?? null;
      }
    }

    const finalEmail = email || `${ghUser.login}@users.noreply.github.com`;
    const user = await findOrCreateGithubUser({
      githubId: String(ghUser.id),
      email: finalEmail,
      name: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url ?? null,
    });

    const sessionToken = createUserSessionToken(user.id);
    const response = NextResponse.redirect(new URL(nextPath, url.origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.set(USER_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return fail("github_failed");
  }
}
