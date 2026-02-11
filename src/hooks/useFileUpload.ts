import { useState, useCallback } from 'react';
import { UploadStatus, type FileEntry } from '@/types';
import { uploadFile } from '@/utils/api';

export function useFileUpload() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const mapped: FileEntry[] = Array.from(newFiles).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      raw: f,
      status: UploadStatus.PENDING,
      rootHash: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== UploadStatus.DONE));
  }, []);

  const uploadAll = useCallback(async () => {
    setIsUploading(true);

    const pending = files.filter((f) => f.status === UploadStatus.PENDING);

    for (const file of pending) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: UploadStatus.UPLOADING } : f
        )
      );

      try {
        const result = await uploadFile(file.raw);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: UploadStatus.DONE, rootHash: result.rootHash }
              : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: UploadStatus.ERROR, error: message }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  }, [files]);

  const retryFile = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file || file.status !== UploadStatus.ERROR) return;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: UploadStatus.UPLOADING, error: null } : f
        )
      );

      try {
        const result = await uploadFile(file.raw);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: UploadStatus.DONE, rootHash: result.rootHash }
              : f
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Retry failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: UploadStatus.ERROR, error: message } : f
          )
        );
      }
    },
    [files]
  );

  const hasPending = files.some((f) => f.status === UploadStatus.PENDING);
  const hasCompleted = files.some((f) => f.status === UploadStatus.DONE);
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const doneCount = files.filter((f) => f.status === UploadStatus.DONE).length;

  return {
    files,
    isUploading,
    hasPending,
    hasCompleted,
    totalSize,
    doneCount,
    addFiles,
    removeFile,
    clearAll,
    clearCompleted,
    uploadAll,
    retryFile,
  };
}
