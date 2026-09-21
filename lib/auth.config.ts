import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/* No fallbacks. The session secret used to fall back to a string that lives in
   this public repository, which would let anyone mint a valid session for any
   user if the variable were ever unset. Refusing to start, with a message that
   names the variable, is the safer failure. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in .env locally, or in the hosting provider's environment settings.`,
    );
  }
  return value;
}

export default {
  providers: [
    Google({
      clientId: required("GOOGLE_CLIENT_ID"),
      clientSecret: required("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: required("AUTH_SECRET"),
  // The host sets its own Host header. If the app ever moves behind another
  // proxy, set AUTH_URL explicitly and remove this.
  trustHost: true,
} satisfies NextAuthConfig;
