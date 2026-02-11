import { type FC, useState, useEffect } from 'react';
import { UploadStatus, type FileEntry } from '@/types';
import { formatBytes, truncateName, truncateHash, fileTypeIcon, copyToClipboard } from '@/utils/format';
import styles from './FileCard.module.css';

interface FileCardProps {
  file: FileEntry;
  index: number;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const FileCard: FC<FileCardProps> = ({ file, index, onRemove, onRetry }) => {
  const [dots, setDots] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file.status !== UploadStatus.UPLOADING) return;
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(iv);
  }, [file.status]);

  const handleCopyHash = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.rootHash) return;
    const ok = await copyToClipboard(file.rootHash);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusLabel: Record<UploadStatus, string> = {
    [UploadStatus.PENDING]: 'QUEUED',
    [UploadStatus.UPLOADING]: `STORING${dots}`,
    [UploadStatus.DONE]: 'ON-CHAIN ✓',
    [UploadStatus.ERROR]: 'FAILED',
  };

  const statusClass: Record<UploadStatus, string> = {
    [UploadStatus.PENDING]: styles.statusPending,
    [UploadStatus.UPLOADING]: styles.statusUploading,
    [UploadStatus.DONE]: styles.statusDone,
    [UploadStatus.ERROR]: styles.statusError,
  };

  return (
    <div
      className={`${styles.card} ${file.status === UploadStatus.DONE ? styles.cardDone : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className={styles.iconBox}>{fileTypeIcon(file.type)}</div>

      <div className={styles.info}>
        <div className={styles.fileName}>{truncateName(file.name)}</div>
        <div className={styles.fileMeta}>{formatBytes(file.size)}</div>
        {file.status === UploadStatus.DONE && file.rootHash && (
          <button className={styles.hashRow} onClick={handleCopyHash} title="Copy root hash">
            <span className={styles.hashLabel}>root:</span>
            <span className={styles.hashValue}>{truncateHash(file.rootHash, 10)}</span>
            <span className={styles.copyHint}>{copied ? '✓' : '⎘'}</span>
          </button>
        )}
        {file.status === UploadStatus.ERROR && file.error && (
          <div className={styles.errorMsg}>{file.error}</div>
        )}
      </div>

      <div className={styles.actions}>
        {file.status === UploadStatus.UPLOADING && (
          <div className={styles.spinner}>
            <svg width="24" height="24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="2.5" />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2.5"
                strokeDasharray="18 38"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {file.status === UploadStatus.ERROR && (
          <button className={styles.retryBtn} onClick={() => onRetry(file.id)} title="Retry upload">
            ↻
          </button>
        )}

        <div className={`${styles.statusBadge} ${statusClass[file.status]}`}>
          {statusLabel[file.status]}
        </div>

        {file.status !== UploadStatus.UPLOADING && (
          <button
            className={styles.removeBtn}
            onClick={() => onRemove(file.id)}
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
