import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isOnboarding = req.nextUrl.pathname.startsWith("/auth/onboarding");

  if (token) {
    if (!token.onboarded && !isOnboarding && !isAuthPage) {
      return NextResponse.redirect(new URL(`/auth/onboarding?user=${token.id}`, req.url));
    }
    // If they are on auth pages but already logged in and onboarded, redirect to home
    if (token.onboarded && isAuthPage && !req.nextUrl.pathname.startsWith("/auth/signout")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else {
    // If NOT logged in, they can only access auth pages
    if (!isAuthPage && req.nextUrl.pathname !== "/") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
