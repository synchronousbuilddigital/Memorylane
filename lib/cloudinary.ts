import { v2 as cloudinary } from "cloudinary";

// We explicitly configure it here to ensure Next.js passes the env var correctly
cloudinary.config({
  secure: true,
  url: process.env.CLOUDINARY_URL
});

/* Signed into every upload, so the browser cannot choose what it sends:
   Cloudinary rejects a file whose format is not in this list. The client must
   send the same value, or the signature will not match. */
export const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic,heif,avif";

export function getCloudinarySignature(folder: string) {
  const timestamp = Math.round(new Date().getTime() / 1000);

  // We specify any upload parameters we want to enforce
  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: ALLOWED_FORMATS,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret!
  );

  return {
    timestamp,
    signature,
    apiKey: cloudinary.config().api_key!,
    cloudName: cloudinary.config().cloud_name!,
    allowedFormats: ALLOWED_FORMATS,
  };
}


/* ---- deleting -------------------------------------------------------------

   Uploading was only ever half the job. Nothing here used to remove a file,
   so every deleted image, every replaced slot and every changed avatar left
   its bytes behind in Cloudinary, paid for and unreachable.

   Deleting needs a public id, and the database only ever stored URLs, so the
   id has to be read back out of the URL. That is more delicate than it
   looks: a delivery URL may carry transformations, may carry a version, and
   may not carry a file extension at all. */

const KNOWN_EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp|tiff?|svg|ico)$/i;

/* Cloudinary's transformation parameters are a closed set of short prefixes.
   Matching on "looks like key_value" is not enough — the folder these
   uploads live in is `memory_lane`, which looks exactly like one. */
const TRANSFORM_KEYS = new Set([
  "w", "h", "c", "g", "q", "f", "x", "y", "r", "a", "o", "e", "l", "u", "b",
  "co", "dpr", "fl", "ar", "z", "t", "d", "bo", "cs", "pg", "if", "fn",
  "so", "eo", "du", "vc", "ac", "br", "ki", "sp", "vs",
]);

const isTransform = (seg: string) =>
  seg.split(",").every((tok) => {
    const key = tok.split("_")[0];
    return tok.includes("_") && TRANSFORM_KEYS.has(key);
  });

/** The public id inside a Cloudinary delivery URL, or null if it is not one. */
export function publicIdFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "res.cloudinary.com") return null;

  // /<cloud>/<resourceType>/<deliveryType>/<transforms…>/<version?>/<publicId>
  const parts = parsed.pathname.split("/").filter(Boolean);
  const upload = parts.findIndex((p) => p === "upload" || p === "authenticated");
  if (upload === -1) return null;

  let rest = parts.slice(upload + 1);
  while (rest.length > 1 && isTransform(rest[0])) rest = rest.slice(1);
  if (rest.length > 1 && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
  if (rest.length === 0) return null;

  return rest.join("/").replace(KNOWN_EXT, "");
}

/* Everything this app uploads lives under one folder. Requiring that prefix
   means a mangled or hostile URL can never point the delete at somebody
   else's asset in the same Cloudinary account. */
const OWNED = "memory_lane/";

export function ownedPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  const id = publicIdFromUrl(url);
  return id && id.startsWith(OWNED) ? id : null;
}

/** Best effort: a storage hiccup must not stop someone deleting their album. */
export async function destroyByUrl(url: string | null | undefined): Promise<boolean> {
  const id = ownedPublicId(url);
  if (!id) return false;
  try {
    await cloudinary.uploader.destroy(id, { invalidate: true });
    return true;
  } catch (err) {
    console.error("Cloudinary destroy failed for", id, err);
    return false;
  }
}

/** The same, for a whole album at once. Cloudinary takes 100 ids per call. */
export async function destroyManyByUrl(urls: (string | null | undefined)[]): Promise<number> {
  const ids = Array.from(new Set(urls.map(ownedPublicId).filter((x): x is string => !!x)));
  let gone = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    try {
      const res = await cloudinary.api.delete_resources(batch, { invalidate: true });
      gone += Object.values(res.deleted ?? {}).filter((v) => v === "deleted").length;
    } catch (err) {
      console.error("Cloudinary batch delete failed:", err);
    }
  }
  return gone;
}
