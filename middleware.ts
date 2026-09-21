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
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

  // /admin always needs a session; whether that session is an admin is checked server-side in the page
  if (isAdminPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

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

  /* Known quirk: on any path this middleware matches, a page's notFound()
     still answers 200 rather than 404 (verified in a production build; paths
     the matcher skips answer 404 correctly). Returning undefined here instead
     of NextResponse.next() does not change it, so the cause is inside the
     NextAuth wrapper. It leaks nothing — the body is the not-found page, and
     the share route sends "noindex, nofollow" so a crawler will not index a
     private album's URL. Worth revisiting on the next NextAuth upgrade. */
  return NextResponse.next();
});

export const config = {
  // everything except API routes, Next internals, and static files (anything with an extension)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
