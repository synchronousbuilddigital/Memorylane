export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { viewerIsAdmin } from "@/lib/admin";

/* Where a sign-in lands. Kept as its own step so the decision is made server-side
   after the session exists, rather than being baked into the sign-in call. */
export default async function ContinuePage() {
  redirect((await viewerIsAdmin()) ? "/admin" : "/");
}
