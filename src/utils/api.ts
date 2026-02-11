import type { UploadResponse } from '@/types';

const API_BASE = '/api';

/**
 * Upload a file to 0G Storage via the backend.
 *
 * NOTE: This currently uses a simulated upload.
 * To connect to real 0G Storage, set up the Express backend
 * (see README.md) and flip USE_SIMULATION to false.
 */
export const uploadFile = async (
  file: File,
  walletAddress?: string | null,
): Promise<UploadResponse> => {
  // ──────────────────────────────────────────────
  // SIMULATED UPLOAD — replace with real API call
  // ─────────────────────────────const USE_SIMULATION = false; // ← change to false

// Then uncomment the real upload block:
const formData = new FormData();
formData.append('file', file);

const res = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

if (!res.ok) {
  const err = await res.json().catch(() => ({ message: 'Upload failed' }));
  throw new Error(err.message || `Upload failed (${res.status})`);
}


}
