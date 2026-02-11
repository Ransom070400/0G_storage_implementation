import type { FC } from 'react';
import { WalletProvider, useWallet } from '@/hooks/useWallet';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Header } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { FileCard } from '@/components/FileCard';
import { Stats } from '@/components/Stats';
import { Footer } from '@/components/Footer';
import styles from './App.module.css';

const AppInner: FC = () => {
  const { isConnected, connect } = useWallet();
  const {
    files,
    isUploading,
    hasPending,
    totalSize,
    doneCount,
    addFiles,
    removeFile,
    clearAll,
    uploadAll,
    retryFile,
  } = useFileUpload();

  return (
    <>
      <div className="page-bg" />
      <div className="grid-overlay" />

      <div className={styles.container}>
        <Header />

        <DropZone onFilesAdded={addFiles} />

        {files.length > 0 && (
          <>
            <Stats
              totalFiles={files.length}
              doneCount={doneCount}
              totalSize={totalSize}
            />

            <div className={styles.fileList}>
              {files.map((file, i) => (
                <FileCard
                  key={file.id}
                  file={file}
                  index={i}
                  onRemove={removeFile}
                  onRetry={retryFile}
                />
              ))}
            </div>

            <div className={styles.toolbar}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={clearAll}
                disabled={isUploading}
              >
                Clear All
              </button>

              {!isConnected ? (
                <button
                  className={`${styles.btn} ${styles.btnUpload}`}
                  onClick={connect}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M22 10H18a2 2 0 0 0 0 4h4" />
                  </svg>
                  Connect Wallet to Upload
                </button>
              ) : (
                <button
                  className={`${styles.btn} ${styles.btnUpload}`}
                  onClick={uploadAll}
                  disabled={!hasPending || isUploading}
                >
                  {isUploading ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        className={styles.spinIcon}
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="12 26"
                          strokeLinecap="round"
                        />
                      </svg>
                      Storing on-chain…
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload to 0G
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {files.length === 0 && (
          <div className={styles.empty}>
            {isConnected
              ? 'No files queued — add some to get started'
              : 'Connect your wallet, then drop files to upload'}
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

const App: FC = () => (
  <WalletProvider>
    <AppInner />
  </WalletProvider>
);

export default App;
