export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  DONE = 'done',
  ERROR = 'error',
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  type: string;
  raw: File;
  status: UploadStatus;
  rootHash: string | null;
  error: string | null;
}

export interface UploadResponse {
  rootHash: string;
  txHash: string;
}

export interface DownloadRequest {
  rootHash: string;
}
