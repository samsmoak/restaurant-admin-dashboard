'use client';

/**
 * Uploads helper store.
 *
 * Upload transport is the Go backend's multipart proxy endpoint
 * (`POST /api/admin/uploads/direct`). The browser only talks to our own API,
 * so no S3 bucket CORS is required — the Go server uploads to S3 on the
 * backend side using IAM credentials already stored in Secret Manager.
 *
 * `presignAndPut` is kept as the public entry point so existing callers
 * (SettingsForm, ItemFormDialog, StepBranding) don't need to change; it
 * just delegates to the direct path.
 */

import { create } from 'zustand';
import { isApiError } from '@/lib/api/client';
import { uploadsApi } from '@/lib/api/endpoints';

type UploadsState = {
  uploading: boolean;
  error: string | null;
  presignAndPut: (prefix: 'logos' | 'menu-images', file: File) => Promise<string | null>;
  direct: (prefix: 'logos' | 'menu-images', file: File) => Promise<string | null>;
};

async function uploadViaBackend(
  set: (p: Partial<UploadsState>) => void,
  prefix: 'logos' | 'menu-images',
  file: File
): Promise<string | null> {
  set({ uploading: true, error: null });
  try {
    const { public_url } = await uploadsApi.direct(prefix, file);
    set({ uploading: false });
    return public_url;
  } catch (e) {
    set({ uploading: false, error: isApiError(e) ? e.error : 'upload failed' });
    return null;
  }
}

export const useUploadsStore = create<UploadsState>((set) => ({
  uploading: false,
  error: null,

  // Delegates to the direct path — no browser→S3 hop, no CORS.
  presignAndPut: (prefix, file) => uploadViaBackend(set, prefix, file),
  direct: (prefix, file) => uploadViaBackend(set, prefix, file),
}));
