'use client';

import styles from './ProgressBar.module.css';

export default function ProgressBar({ answered, total = 25 }) {
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <span className={styles.percentText}>{percentage}% Complete</span>
          <span className={styles.countText}>
            {answered} / {total} answered
          </span>
        </div>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}
