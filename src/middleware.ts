import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isOnboarding = req.nextUrl.pathname.startsWith("/auth/onboarding");

  if (token) {
    // New user (onboarded === false) → force onboarding before anything else
    if (!token.onboarded && !isOnboarding) {
      return NextResponse.redirect(
        new URL(`/auth/onboarding?user=${token.id as string}`, req.url),
      );
    }
    // Already logged-in and onboarded → skip auth pages
    if (token.onboarded && isAuthPage && !req.nextUrl.pathname.startsWith("/auth/signout")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else {
    // Not logged in → only auth pages and root are public
    if (!isAuthPage && req.nextUrl.pathname !== "/") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
