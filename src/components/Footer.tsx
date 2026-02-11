import type { FC } from 'react';
import { useWallet } from '@/hooks/useWallet';
import styles from './Footer.module.css';

export const Footer: FC = () => {
  const { network } = useWallet();

  return (
    <footer className={styles.footer}>
      <span className={styles.powered}>Powered by 0G Network</span>
      <div className={styles.tags}>
        <span className={styles.tag}>{network.shortName}</span>
        <span className={styles.tag}>Chain {network.chainId}</span>
        <span className={styles.tag}>v0.1.0</span>
      </div>
    </footer>
  );
};
