'use client';

import { CHILD_FIELDS } from '../data/questions';
import styles from './ChildInfoSection.module.css';

export default function ChildInfoSection({ values, errors, onChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerIcon}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className={styles.headerTitle}>Child Information</h2>
          <p className={styles.headerDesc}>
            Please fill in all the required demographic details of the child being assessed.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        {CHILD_FIELDS.map((field) => (
          <div
            key={field.id}
            id={`field-${field.id}`}
            className={`${styles.fieldGroup} ${
              errors[field.id] ? styles.fieldGroupError : ''
            }`}
          >
            <label className={styles.label} htmlFor={field.id}>
              {field.label}
              {field.required && <span className={styles.asterisk}>*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                id={field.id}
                className={`${styles.select} ${
                  errors[field.id] ? styles.inputError : ''
                }`}
                value={values[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                <option value="">{field.placeholder}</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.id}
                type="text"
                className={`${styles.input} ${
                  errors[field.id] ? styles.inputError : ''
                }`}
                placeholder={field.placeholder}
                value={values[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            )}

            {errors[field.id] && (
              <span className={styles.errorMsg}>{errors[field.id]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
