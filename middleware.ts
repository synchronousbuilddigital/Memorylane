import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isPublicSharePage = req.nextUrl.pathname.startsWith("/share");
  const isPurposePage = req.nextUrl.pathname.startsWith("/purpose");
  const isLandingPage = req.nextUrl.pathname === "/home" || req.nextUrl.pathname === "/";

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  // If not logged in, and trying to access a protected route (not public, not landing page, not purpose preview)
  if (!isLoggedIn && !isPublicSharePage && !isLandingPage && !isPurposePage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }



  return NextResponse.next();
});

export const config = {
  // everything except API routes, Next internals, and static files (anything with an extension)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
