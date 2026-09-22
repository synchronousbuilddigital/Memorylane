export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { getCloudinarySignature } from "@/lib/cloudinary";
import { rateLimit, tooMany } from "@/lib/rateLimit";

/* Signs an avatar upload. The album route signs a folder after checking you own
   that album; there is no album here, so the folder is keyed to the user id and
   the session is the only thing that decides it. A caller cannot ask for
   somebody else's folder, because the folder is never taken from the request. */
export const POST = withAuth(async (_req, { userId }) => {

  // a person changes their picture a handful of times, not sixty
  const rl = rateLimit(`avatar:${userId}`, 12, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  try {
    const folder = `memory_lane/avatars/${userId}`;
    return NextResponse.json({ ...getCloudinarySignature(folder), folder });
  } catch (err) {
    console.error("Avatar sign error:", err);
    return NextResponse.json({ error: "Could not start the upload" }, { status: 500 });
  }
});
