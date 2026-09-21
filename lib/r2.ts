import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Only initialize if we have credentials
const hasR2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID;

const s3 = hasR2 ? new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
}) : null;

export async function getPresignedUrl(key: string, contentType: string) {
  if (!s3) {
    // There used to be a local fallback here that posted to /api/upload/mock.
    // That route wrote a caller-supplied path to disk with no session and no
    // sanitising, so it was removed. Uploads go through Cloudinary instead
    // (see /api/upload/presign); failing loudly beats writing files unchecked.
    throw new Error(
      "R2 is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID missing). Use the Cloudinary upload path instead.",
    );
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { url, key };
}

export function getPublicUrl(key: string) {
  if (!s3) {
    return `/uploads/${key}`;
  }
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
