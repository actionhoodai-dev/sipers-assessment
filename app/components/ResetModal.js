'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './ResetModal.module.css';

export default function ResetModal({ isOpen, onClose, onConfirm }) {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
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
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      });

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="presentation">
      <div
        className={styles.modal}
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-desc"
      >
        <div className={styles.iconWrapper}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L1 21h22L12 2z"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="#FEF2F2"
            />
            <path d="M12 9v4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="#EF4444" />
          </svg>
        </div>

        <h2 className={styles.title} id="reset-modal-title">
          Reset Assessment?
        </h2>

        <p className={styles.message} id="reset-modal-desc">
          This will clear all entered data including child information and all questionnaire
          responses. This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button
            ref={cancelBtnRef}
            className={styles.cancelBtn}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={onConfirm}
            type="button"
          >
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  );
}
