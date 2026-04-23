"use client";

export type UploadPrefix = "logos" | "menu-images";

/**
 * Upload path: browser → our /api/uploads/direct route → S3.
 * This avoids needing S3 CORS configured on the bucket because the
 * browser only ever talks to our own origin.
 *
 * Returns the public S3 URL of the uploaded object.
 */
export async function uploadToS3(
  file: File,
  prefix: UploadPrefix
): Promise<string> {
  const form = new FormData();
  form.append("prefix", prefix);
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/uploads/direct", {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error("Could not reach the server. Is the dev server running?");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed (${res.status}).`);
  }

  const { publicUrl } = (await res.json()) as { publicUrl: string };
  return publicUrl;
}
