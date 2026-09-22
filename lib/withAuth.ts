import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/* Signing-in is checked inside each route handler, not in middleware.

   The middleware matcher deliberately skips /api, and it should keep doing
   so: /api/auth is NextAuth's own handler, and putting that behind an auth
   check would mean having to be signed in to reach the endpoint that signs
   you in. The middleware also only ever redirects, which is right for a page
   and wrong for an API — a fetch would get a 302 to an HTML login page
   instead of a 401 it can act on.

   Middleware is also the weaker place to put this. CVE-2025-29927 was a
   Next.js middleware bypass via a request header; this project is on a
   patched version, but a guard that runs inside the handler cannot be
   skipped that way at all.

   What was missing was not the check — every route had one — but any way to
   stop a future route from forgetting it. Hence this wrapper: `userId` is
   handed to the handler already narrowed to a string, so a route that skips
   the guard has no way to name the caller and fails to compile. */

export type AuthContext = { userId: string };

export function withAuth<Req extends Request = Request>(
  handler: (req: Req, ctx: AuthContext) => Promise<Response>,
): (req: Req) => Promise<Response> {
  return async (req: Req) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, { userId: session.user.id });
  };
}
