'use client';

import { useState } from 'react';
import styles from './Header.module.css';

export default function Header({ currentTab = 'new', onChangeTab }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId) => {
    if (onChangeTab) {
      onChangeTab(tabId);
    }
    setIsMobileMenuOpen(false);
  };

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

        {/* Desktop Tabs */}
        <nav className={styles.navDesktop}>
          <button
            className={`${styles.tabButton} ${currentTab === 'new' ? styles.tabButtonActive : ''}`}
            onClick={() => handleTabClick('new')}
            type="button"
          >
            New Assessment
          </button>
          <button
            className={`${styles.tabButton} ${currentTab === 'history' ? styles.tabButtonActive : ''}`}
            onClick={() => handleTabClick('history')}
            type="button"
          >
            Patient History
          </button>
        </nav>

        <div className={styles.headerRight}>
          <div className={styles.autosaveBadge} data-print-hide>
            <span className={styles.pulsingDot} />
            <span className={styles.autosaveText}>Autosaved</span>
          </div>

          {/* Hamburger Icon */}
          <button
            className={styles.hamburger}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            type="button"
            data-print-hide
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <nav className={styles.navMobile} data-print-hide>
          <button
            className={`${styles.mobileTabButton} ${currentTab === 'new' ? styles.mobileTabButtonActive : ''}`}
            onClick={() => handleTabClick('new')}
            type="button"
          >
            New Assessment
          </button>
          <button
            className={`${styles.mobileTabButton} ${currentTab === 'history' ? styles.mobileTabButtonActive : ''}`}
            onClick={() => handleTabClick('history')}
            type="button"
          >
            Patient History
          </button>
        </nav>
      )}
    </header>
  );
}
