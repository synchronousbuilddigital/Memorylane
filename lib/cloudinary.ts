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
