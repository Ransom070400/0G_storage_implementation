import { type FC, useRef, useState, useCallback } from 'react';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFilesAdded: (files: FileList) => void;
}

export const DropZone: FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) onFilesAdded(e.dataTransfer.files);
    },
    [onFilesAdded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        onFilesAdded(e.target.files);
        e.target.value = '';
      }
    },
    [onFilesAdded]
  );

  return (
    <div
      className={`${styles.zone} ${isDragging ? styles.dragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className={styles.input}
        onChange={handleChange}
      />

      <div className={styles.icon}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <div className={styles.label}>
        {isDragging ? 'Release to add files' : 'Drop files here or click to browse'}
      </div>
      <div className={styles.hint}>Any file type &middot; No size limits</div>
    </div>
  );
};
