'use client';

import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.brand}>
          <div className={styles.iconWrap}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
              <path
                d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 10a4 4 0 0 1 4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.titles}>
            <h1 className={styles.title}>SIPERS</h1>
            <p className={styles.subtitle}>
              Social Interaction &amp; Peer Engagement Rating Scale
            </p>
          </div>
        </div>
        <div className={styles.autosaveBadge}>
          <span className={styles.pulsingDot} />
          <span className={styles.autosaveText}>Autosaved</span>
        </div>
      </div>
    </header>
  );
}
