import type { FC } from 'react';
import { formatBytes } from '@/utils/format';
import styles from './Stats.module.css';

interface StatsProps {
  totalFiles: number;
  doneCount: number;
  totalSize: number;
}

export const Stats: FC<StatsProps> = ({ totalFiles, doneCount, totalSize }) => {
  const items = [
    { label: 'Files', value: String(totalFiles) },
    { label: 'Stored', value: String(doneCount) },
    { label: 'Total Size', value: formatBytes(totalSize) },
  ];

  return (
    <div className={styles.row}>
      {items.map((item) => (
        <div key={item.label} className={styles.card}>
          <div className={styles.label}>{item.label}</div>
          <div className={styles.value}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};
