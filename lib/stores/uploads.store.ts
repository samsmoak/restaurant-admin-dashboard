'use client';

/**
 * Uploads helper store. Exposes two functions:
 *   - `presignAndPut(prefix, file)` → gets a presigned URL and does the PUT
 *     from the browser. Returns the public URL for storing in a form.
 *   - `direct(prefix, file)` → uploads via the Go backend (server-side).
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

export const useUploadsStore = create<UploadsState>((set) => ({
  uploading: false,
  error: null,

  async presignAndPut(prefix, file) {
    set({ uploading: true, error: null });
    try {
      const { upload_url, public_url } = await uploadsApi.presign({
        prefix,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        size: file.size,
      });
      const res = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!res.ok) throw { status: res.status, error: `upload failed (${res.status})` };
      set({ uploading: false });
      return public_url;
    } catch (e) {
      set({ uploading: false, error: isApiError(e) ? e.error : 'upload failed' });
      return null;
    }
  },

  async direct(prefix, file) {
    set({ uploading: true, error: null });
    try {
      const { public_url } = await uploadsApi.direct(prefix, file);
      set({ uploading: false });
      return public_url;
    } catch (e) {
      set({ uploading: false, error: isApiError(e) ? e.error : 'upload failed' });
      return null;
    }
  },
}));
