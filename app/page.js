"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import ChildInfoSection from "./components/ChildInfoSection";
import QuestionSection from "./components/QuestionSection";
import ActionButtons from "./components/ActionButtons";
import HistoryTab from "./components/HistoryTab";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import ResetModal from "./components/ResetModal";
import { SECTIONS, CHILD_FIELDS } from "./data/questions";
import styles from "./page.module.css";

const STORAGE_KEY = "sipers_form_data";
const HISTORY_KEY = "sipers_history";
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzXwqOUt-IT5Q2o24TX0xThQpBkI1KGX4kgPBrfybRDyz5ogr9d9tdBF48ZNdzhw_fz5g/exec";

function getInitialChildInfo() {
  return CHILD_FIELDS.reduce((acc, field) => {
    acc[field.id] = "";
    return acc;
  }, {});
}

function getInitialAnswers() {
  return {};
}

function countAnswered(answers) {
  return Object.keys(answers).length;
}

function getNextPatientId(historyList) {
  if (!historyList || historyList.length === 0) {
    return "S100";
  }
  let maxNum = 99;
  historyList.forEach((item) => {
    const pid = item.childInfo?.patientId;
    if (pid && typeof pid === "string") {
      const match = pid.match(/^S(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  });
  return `S${maxNum + 1}`;
}

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState("new");
  const [history, setHistory] = useState([]);
  const [childInfo, setChildInfo] = useState(getInitialChildInfo);
  const [answers, setAnswers] = useState(getInitialAnswers);
  const [errors, setErrors] = useState({});
  const [unanswered, setUnanswered] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const toastIdRef = useRef(0);

  /* ── Load from localStorage on mount ── */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let historyList = [];
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        historyList = JSON.parse(savedHistory);
        setHistory(historyList);
      }
    } catch {
      /* ignore */
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.childInfo) {
          // If loaded childInfo doesn't have a patient ID or it's empty, auto-generate it
          if (!parsed.childInfo.patientId) {
            parsed.childInfo.patientId = getNextPatientId(historyList);
          }
          setChildInfo(parsed.childInfo);
        } else {
          setChildInfo({
            ...getInitialChildInfo(),
            patientId: getNextPatientId(historyList),
          });
        }
        if (parsed.answers) setAnswers(parsed.answers);
      } else {
        setChildInfo({
          ...getInitialChildInfo(),
          patientId: getNextPatientId(historyList),
        });
      }
    } catch {
      setChildInfo({
        ...getInitialChildInfo(),
        patientId: getNextPatientId(historyList),
      });
    }
    setHasLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── Autosave to localStorage ── */
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ childInfo, answers })
      );
    } catch {
      /* storage full — ignore */
    }
  }, [childInfo, answers, hasLoaded]);

  /* ── Toast helpers ── */
  const addToast = useCallback((type, message) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Child info change ── */
  const handleChildInfoChange = useCallback((fieldId, value) => {
    setChildInfo((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (prev[fieldId]) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return prev;
    });
  }, []);

  /* ── Answer change ── */
  const handleAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setUnanswered((prev) => {
      if (prev.has(questionId)) {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      }
      return prev;
    });
  }, []);

  /* ── Validation ── */
  const validate = useCallback(() => {
    const newErrors = {};
    
    // Check all fields first
    CHILD_FIELDS.forEach((field) => {
      if (!childInfo[field.id] || !childInfo[field.id].trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Specific Patient ID format validation (S100, S101, etc.)
    const pid = childInfo.patientId ? childInfo.patientId.trim() : "";
    if (pid && !newErrors.patientId) {
      const match = pid.match(/^S(\d+)$/);
      if (!match) {
        newErrors.patientId = "Patient ID must start with S followed by a number (e.g., S100)";
      } else {
        const num = parseInt(match[1], 10);
        if (num < 100) {
          newErrors.patientId = "Patient ID number must be 100 or greater";
        } else {
          // Verify unique patientId
          const isDuplicate = history.some(
            (item) => item.childInfo?.patientId?.trim() === pid
          );
          if (isDuplicate) {
            newErrors.patientId = "Patient ID already exists. Please enter a unique ID.";
          }
        }
      }
    }

    const allQuestionIds = SECTIONS.flatMap((s) =>
      s.questions.map((q) => q.id)
    );
    const missing = allQuestionIds.filter((qid) => !answers[qid]);
    const missingSet = new Set(missing);

    setErrors(newErrors);
    setUnanswered(missingSet);

    const hasFieldErrors = Object.keys(newErrors).length > 0;
    const hasMissingAnswers = missing.length > 0;

    if (hasFieldErrors) {
      const firstErrorField = CHILD_FIELDS.find((f) => newErrors[f.id]);
      if (firstErrorField) {
        const el = document.getElementById(`field-${firstErrorField.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (hasMissingAnswers) {
      const el = document.getElementById(`question-${missing[0]}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return !hasFieldErrors && !hasMissingAnswers;
  }, [childInfo, answers, history]);

  /* ── Build payload ── */
  const buildPayload = useCallback(() => {
    const answersArray = SECTIONS.flatMap((section) =>
      section.questions.map((q) => ({
        section: section.title,
        questionId: q.id,
        question: q.text,
        response: answers[q.id] || "",
      }))
    );

    return {
      childName: childInfo.childName || "",
      age: childInfo.age || "",
      gender: childInfo.gender || "",
      diagnosis: childInfo.diagnosis || "",
      ses: childInfo.ses || "",
      locationType: childInfo.locationType || "",
      familyType: childInfo.familyType || "",
      birthOrder: childInfo.birthOrder || "",
      patientId: childInfo.patientId || "",
      answers: answersArray,
    };
  }, [childInfo, answers]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!validate()) {
      addToast(
        "error",
        "Please fill in all required fields, ensure a unique Patient ID, and answer all questions."
      );
      return;
    }

    setIsSaving(true);
    try {
      const data = buildPayload();
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      // Append saved record to Local History
      const record = {
        childInfo: { ...childInfo },
        answers: { ...answers },
        timestamp: Date.now(),
      };
      const newHistory = [...history, record];
      setHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

      addToast("success", "Assessment saved successfully!");

      // Clear current form draft and auto-increment Patient ID
      const nextId = getNextPatientId(newHistory);
      setChildInfo({
        ...getInitialChildInfo(),
        patientId: nextId,
      });
      setAnswers({});
      setErrors({});
      setUnanswered(new Set());
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      addToast(
        "error",
        `Failed to save assessment. Please check your connection and try again. (${err.message})`
      );
    } finally {
      setIsSaving(false);
    }
  }, [validate, buildPayload, childInfo, answers, history, addToast]);

  /* ── Generate PDF for current form ── */
  const handleGeneratePDF = useCallback(async () => {
    // Validate current form
    const newErrors = {};
    CHILD_FIELDS.forEach((field) => {
      if (!childInfo[field.id] || !childInfo[field.id].trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Check specific Patient ID
    const pid = childInfo.patientId ? childInfo.patientId.trim() : "";
    if (pid && !newErrors.patientId) {
      const match = pid.match(/^S(\d+)$/);
      if (!match) {
        newErrors.patientId = "Patient ID must start with S followed by a number (e.g., S100)";
      } else if (parseInt(match[1], 10) < 100) {
        newErrors.patientId = "Patient ID number must be 100 or greater";
      }
    }

    const allQuestionIds = SECTIONS.flatMap((s) =>
      s.questions.map((q) => q.id)
    );
    const missing = allQuestionIds.filter((qid) => !answers[qid]);
    const missingSet = new Set(missing);

    setErrors(newErrors);
    setUnanswered(missingSet);

    const hasFieldErrors = Object.keys(newErrors).length > 0;
    const hasMissingAnswers = missing.length > 0;

    if (hasFieldErrors || hasMissingAnswers) {
      addToast(
        "error",
        "Please fill in child details and answer all questions before generating a PDF."
      );
      if (hasFieldErrors) {
        const firstErrorField = CHILD_FIELDS.find((f) => newErrors[f.id]);
        if (firstErrorField) {
          const el = document.getElementById(`field-${firstErrorField.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        const el = document.getElementById(`question-${missing[0]}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      const { default: generatePDF } = await import("./utils/generatePDF");
      generatePDF(childInfo, answers, SECTIONS);
      addToast("success", "PDF generated and download started!");
    } catch (err) {
      addToast("error", `Failed to generate PDF. ${err.message}`);
    }
  }, [childInfo, answers, addToast]);

  /* ── Generate PDF for historical items ── */
  const handleGeneratePDFHistory = useCallback(async (itemChildInfo, itemAnswers) => {
    try {
      const { default: generatePDF } = await import("./utils/generatePDF");
      generatePDF(itemChildInfo, itemAnswers, SECTIONS);
      addToast("success", "PDF generated and download started!");
    } catch (err) {
      addToast("error", `Failed to generate PDF. ${err.message}`);
    }
  }, [addToast]);

  /* ── Print ── */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    const nextId = getNextPatientId(history);
    setChildInfo({
      ...getInitialChildInfo(),
      patientId: nextId,
    });
    setAnswers(getInitialAnswers());
    setErrors({});
    setUnanswered(new Set());
    setShowResetModal(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast("info", "Assessment has been reset.");
  }, [history, addToast]);

  const answered = countAnswered(answers);

  if (!hasLoaded) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading SIPERS Assessment...</p>
      </div>
    );
  }

  return (
    <>
      <Header currentTab={currentTab} onChangeTab={setCurrentTab} />

      {currentTab === "new" ? (
        <>
          <div data-print-hide>
            <ProgressBar answered={answered} total={25} />
          </div>

          <main className={styles.main}>
            <ChildInfoSection
              values={childInfo}
              errors={errors}
              onChange={handleChildInfoChange}
            />

            {SECTIONS.map((section, idx) => (
              <QuestionSection
                key={section.id}
                section={section}
                sectionIndex={idx}
                answers={answers}
                onAnswer={handleAnswer}
                unanswered={unanswered}
              />
            ))}

            <div data-print-hide>
              <ActionButtons
                onSave={handleSave}
                onPDF={handleGeneratePDF}
                onPrint={handlePrint}
                onReset={handleReset}
                isSaving={isSaving}
              />
            </div>
          </main>
        </>
      ) : (
        <main className={styles.main}>
          <HistoryTab history={history} onPDF={handleGeneratePDFHistory} />
        </main>
      )}

      <Footer />
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmReset}
      />
    </>
  );
}
