import type { FC } from 'react';
import { WalletButton } from './WalletButton';
import styles from './Header.module.css';

export const Header: FC = () => (
  <header className={styles.header}>
    <div className={styles.topBar}>
      <div className={styles.logoRow}>
        <div className={styles.logoBadge}>0G</div>
        <span className={styles.logoLabel}>Storage</span>
      </div>
      <WalletButton />
    </div>
    <h1 className={styles.title}>
      Decentralized
      <br />
      File Storage
    </h1>
    <p className={styles.subtitle}>
      Upload files to the 0G network. Immutable, censorship&#8209;resistant,
      and permanently available on&#8209;chain.
    </p>
  </header>
);
