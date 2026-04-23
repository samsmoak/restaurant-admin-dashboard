import { NextResponse } from "next/server";

/**
 * Deprecated. Uploads are handled by the Go backend at
 *   POST /api/admin/uploads/direct (multipart) or /presign (JSON)
 * via the admin bearer token.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Uploads moved to the Go backend. Use the uploads store (lib/stores/uploads.store.ts).",
    },
    { status: 410 }
  );
}
