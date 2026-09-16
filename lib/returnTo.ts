/* Where a share page's back button should go.

   The value arrives in a query string on a public page, so it is never trusted as
   a URL: only an internal /admin path is accepted. That rules out `//evil.com`,
   `https://evil.com` and backslash tricks, so the link can't become an open redirect. */
const ADMIN_PATH = /^\/admin(?:\/[A-Za-z0-9_-]+)*\/?$/;

export type BackTarget = { href: string; label: string };

export function backTarget(from?: string | string[]): BackTarget {
  const value = Array.isArray(from) ? from[0] : from;
  if (typeof value === "string" && ADMIN_PATH.test(value)) {
    return { href: value, label: "Back to admin" };
  }
  return { href: "/", label: "Back to Home" };
}
