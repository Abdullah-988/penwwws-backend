import { createHash } from "crypto";

export function generateSignature(publicId: string, timestamp: number) {
  const signature = createHash("sha1")
    .update(
      `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
    )
    .digest("hex");

  return signature;
}
