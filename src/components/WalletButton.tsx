import { type FC, useState, useRef, useEffect } from 'react';
import { useWallet, OG_NETWORKS } from '@/hooks/useWallet';
import { copyToClipboard } from '@/utils/format';
import styles from './WalletButton.module.css';

export const WalletButton: FC = () => {
  const {
    isConnected,
    isConnecting,
    isCorrectNetwork,
    shortAddress,
    address,
    error,
    network,
    networkKey,
    connect,
    disconnect,
    switchNetwork,
    switchToCorrectNetwork,
  } = useWallet();

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ── Not connected ──
  if (!isConnected) {
    return (
      <div className={styles.wrapper}>
        <button
          className={styles.connectBtn}
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <svg width="14" height="14" className={styles.spinner}>
                <circle
                  cx="7" cy="7" r="5" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeDasharray="10 22" strokeLinecap="round"
                />
              </svg>
              Connecting…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M22 10H18a2 2 0 0 0 0 4h4" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    );
  }

  // ── Connected ──
  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        className={`${styles.addressBtn} ${!isCorrectNetwork ? styles.wrongChain : ''}`}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className={styles.dot} />
        {!isCorrectNetwork ? (
          <span className={styles.chainWarning}>Wrong network</span>
        ) : (
          <span className={styles.addrText}>{shortAddress}</span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={menuOpen ? styles.chevronUp : ''}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menuOpen && (
        <div className={styles.menu}>
          {/* Address section */}
          <div className={styles.menuHeader}>
            <span className={styles.menuLabel}>Connected</span>
            <span className={styles.menuAddr}>{address}</span>
          </div>

          {/* Wrong network banner */}
          {!isCorrectNetwork && (
            <button
              className={styles.switchBanner}
              onClick={async () => {
                await switchToCorrectNetwork();
                setMenuOpen(false);
              }}
            >
              <span>⚠ Switch to {network.name}</span>
              <span className={styles.menuIcon}>→</span>
            </button>
          )}

          <button className={styles.menuItem} onClick={handleCopy}>
            <span>{copied ? '✓ Copied' : 'Copy address'}</span>
            <span className={styles.menuIcon}>⎘</span>
          </button>

          <a
            className={styles.menuItem}
            href={`${network.explorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>View on explorer</span>
            <span className={styles.menuIcon}>↗</span>
          </a>

          <div className={styles.menuDivider} />

          {/* Network selector */}
          <div className={styles.networkSection}>
            <span className={styles.networkLabel}>Network</span>
            <div className={styles.networkBtns}>
              {Object.entries(OG_NETWORKS).map(([key, net]) => (
                <button
                  key={key}
                  className={`${styles.networkBtn} ${key === networkKey ? styles.networkActive : ''}`}
                  onClick={async () => {
                    await switchNetwork(key);
                  }}
                >
                  {net.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.menuDivider} />

          <button
            className={`${styles.menuItem} ${styles.menuDisconnect}`}
            onClick={() => { disconnect(); setMenuOpen(false); }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
