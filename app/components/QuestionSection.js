'use client';

import { RESPONSE_OPTIONS } from '../data/questions';
import styles from './QuestionSection.module.css';

const SECTION_COLORS = {
  a: '#2563EB',
  b: '#8B5CF6',
  c: '#F59E0B',
  d: '#10B981',
  e: '#EF4444',
};

export default function QuestionSection({
  section,
  sectionIndex,
  answers,
  onAnswer,
  unanswered,
}) {
  const sectionLetter = section.id.toUpperCase();
  const color = SECTION_COLORS[section.id] || '#2563EB';
  const answeredCount = section.questions.filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const totalCount = section.questions.length;
  const isComplete = answeredCount === totalCount;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <div
            className={styles.badge}
            style={{ background: color }}
          >
            {sectionLetter}
          </div>
          <div>
            <h2 className={styles.headerTitle}>{section.title}</h2>
            <p className={styles.headerDesc}>{section.description}</p>
          </div>
        </div>
        <div
          className={`${styles.completionBadge} ${
            isComplete ? styles.completionBadgeComplete : ''
          }`}
          style={
            isComplete
              ? { background: `${color}14`, color: color, borderColor: `${color}30` }
              : {}
          }
        >
          {answeredCount} / {totalCount}
        </div>
      </div>

      <div className={styles.questionList}>
        {section.questions.map((q, qi) => {
          const currentAnswer = answers[q.id];
          const isUnansweredQ = unanswered && unanswered.has(q.id);

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className={`${styles.questionRow} ${
                isUnansweredQ ? styles.questionRowUnanswered : ''
              }`}
            >
              <div className={styles.questionContent}>
                <span
                  className={styles.questionNumber}
                  style={{ color: color }}
                >
                  {sectionLetter}
                  {qi + 1}
                </span>
                <span className={styles.questionText}>{q.text}</span>
              </div>
              <div className={styles.optionsRow}>
                {RESPONSE_OPTIONS.map((option) => {
                  const isSelected = currentAnswer === option;
                  return (
                    <label
                      key={option}
                      className={`${styles.radioLabel} ${
                        isSelected ? styles.radioLabelSelected : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={isSelected}
                        onChange={() => onAnswer(q.id, option)}
                        className={styles.radioInput}
                      />
                      <span
                        className={`${styles.radioCircle} ${
                          isSelected ? styles.radioCircleSelected : ''
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: color,
                                background: color,
                              }
                            : {}
                        }
                      >
                        {isSelected && (
                          <span className={styles.radioCircleInner} />
                        )}
                      </span>
                      <span className={styles.radioText}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
