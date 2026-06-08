'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SECTIONS, CHILD_FIELDS } from '../data/questions';
import styles from './HistoryTab.module.css';

export default function HistoryTab({ history = [], onPDF, onReassess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  
  // Filter and sort history (newest first)
  const filteredHistory = history
    .filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const pid = (item.childInfo?.patientId || '').toLowerCase();
      const name = (item.childInfo?.childName || '').toLowerCase();
      return pid.includes(q) || name.includes(q);
    })
    .sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });

  // Modal accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setSelectedItem(null);
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (selectedItem) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        if (closeBtnRef.current) {
          closeBtnRef.current.focus();
        }
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [selectedItem, handleKeyDown]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.searchCard}>
        <div className={styles.searchTitleGroup}>
          <h2 className={styles.searchTitle}>Patient Database &amp; Records</h2>
          <p className={styles.searchDesc}>
            Search past assessments by entering the Patient ID or Child Name.
          </p>
        </div>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search Patient ID (e.g. S100) or Child Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Database Grid */}
      <div className={styles.tableCard}>
        {filteredHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22c5.523 0 10-4.577 10-10S17.523 2 12 2 2 6.577 2 12s4.523 10 10 10z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className={styles.emptyText}>
              {searchQuery ? 'No records match your search query.' : 'No assessment history records found.'}
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Patient ID</th>
                  <th className={styles.th}>Child Name</th>
                  <th className={styles.th}>Diagnosis</th>
                  <th className={styles.th}>Date Saved</th>
                  <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr key={item.timestamp || index} className={styles.tr}>
                    <td className={`${styles.td} ${styles.tdId}`}>{item.childInfo?.patientId || 'N/A'}</td>
                    <td className={`${styles.td} ${styles.tdName}`}>{item.childInfo?.childName || 'N/A'}</td>
                    <td className={styles.td}>{item.childInfo?.diagnosis || 'N/A'}</td>
                    <td className={styles.td}>{formatDate(item.timestamp)}</td>
                    <td className={`${styles.td} ${styles.tdActions}`}>
                      <button
                        className={`${styles.btn} ${styles.btnReassess}`}
                        onClick={() => onReassess(item.childInfo)}
                        type="button"
                      >
                        Re-assess
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnView}`}
                        onClick={() => setSelectedItem(item)}
                        type="button"
                      >
                        View
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnPdf}`}
                        onClick={() => onPDF(item.childInfo, item.answers)}
                        type="button"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Assessment Viewer Modal */}
      {selectedItem && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setSelectedItem(null)} role="presentation">
          <div
            className={styles.modal}
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="viewer-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle} id="viewer-title">
                  Patient File: {selectedItem.childInfo?.patientId || 'N/A'}
                </h3>
                <p className={styles.modalMeta}>
                  Saved on {formatDate(selectedItem.timestamp)}
                </p>
              </div>
              <div className={styles.modalHeaderActions}>
                <button
                  className={styles.modalReassessBtn}
                  onClick={() => {
                    onReassess(selectedItem.childInfo);
                    setSelectedItem(null);
                  }}
                  type="button"
                >
                  Re-assess
                </button>
                <button
                  className={styles.modalPdfBtn}
                  onClick={() => onPDF(selectedItem.childInfo, selectedItem.answers)}
                  type="button"
                >
                  Download PDF
                </button>
                <button
                  ref={closeBtnRef}
                  className={styles.closeBtn}
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close digital file"
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.modalContent}>
              {/* Demographics Summary */}
              <div className={styles.viewerSection}>
                <h4 className={styles.sectionTitle}>Demographic Information</h4>
                <div className={styles.demographicsGrid}>
                  {CHILD_FIELDS.map((field) => (
                    <div key={field.id} className={styles.demographicCell}>
                      <span className={styles.cellLabel}>{field.label}</span>
                      <span className={styles.cellValue}>
                        {selectedItem.childInfo?.[field.id] || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment Responses */}
              <div className={styles.viewerSection}>
                <h4 className={styles.sectionTitle}>Questionnaire Responses</h4>
                <div className={styles.sectionsList}>
                  {SECTIONS.map((section, sIdx) => {
                    const sectionLetter = section.id.toUpperCase();
                    return (
                      <div key={section.id} className={styles.viewSectionCard}>
                        <h5 className={styles.viewSectionHeader}>
                          <span className={styles.viewSectionBadge}>{sectionLetter}</span>
                          {section.title}
                        </h5>
                        <div className={styles.responseList}>
                          {section.questions.map((q, qIdx) => {
                            const ans = selectedItem.answers?.[q.id];
                            return (
                              <div key={q.id} className={styles.responseRow}>
                                <div className={styles.qTextGroup}>
                                  <span className={styles.qNumber}>{sectionLetter}{qIdx + 1}</span>
                                  <p className={styles.qText}>{q.text}</p>
                                </div>
                                <div className={styles.ansValue}>
                                  <span className={styles.ansPill}>{ans || 'Not answered'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
