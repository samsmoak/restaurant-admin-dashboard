import { NextResponse } from "next/server";

/**
 * Deprecated. Presign is handled by the Go backend at
 *   POST /api/admin/uploads/presign
 * via the admin bearer token. See lib/stores/uploads.store.ts.
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
