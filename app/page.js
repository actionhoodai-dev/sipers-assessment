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
import stylesSelect from "./components/PatientTypeSelect.module.css";

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
  const [patientType, setPatientType] = useState(null); // null, 'new', or 'existing'
  const [existingSearchQuery, setExistingSearchQuery] = useState("");
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

  /* ── Load from localStorage and Sync from Google Sheets on mount ── */
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
          // Check if there is actual input besides patientId to restore the form state
          const hasFormProgress = Object.keys(parsed.childInfo).some(
            (key) => key !== "patientId" && parsed.childInfo[key] !== ""
          );
          if (hasFormProgress) {
            setPatientType("new");
          }
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

    // Show screen immediately if we have local history cached
    if (historyList.length > 0) {
      setHasLoaded(true);
    }

    // Sync remote history from Google Sheets
    const syncRemoteHistory = async () => {
      try {
        const res = await fetch(BACKEND_URL);
        if (!res.ok) throw new Error("Network response not ok");
        const data = await res.json();
        if (Array.isArray(data)) {
          const remoteHistory = data.map((row) => {
            const childInfo = {
              childName: (row.Child_Name || row["Child Name"] || row.childName || "").trim(),
              age: String(row.Age || row.age || "").trim(),
              gender: (row.Gender || row.gender || "").trim(),
              diagnosis: (row.Diagnosis || row.diagnosis || "").trim(),
              ses: (row.SES || row.ses || "").trim(),
              locationType: (row.Location_Type || row["Location Type"] || row.locationType || "").trim(),
              familyType: (row.Family_Type || row["Family Type"] || row.familyType || "").trim(),
              birthOrder: String(row.Birth_Order || row["Birth Order"] || row.birthOrder || "").trim(),
              patientId: (row.Patient_ID || row["Patient ID"] || row.PatientId || row.patientId || "").trim(),
            };

            const answers = {};
            Object.keys(row).forEach((key) => {
              if (key.includes("_Q")) {
                const val = row[key];
                if (typeof val === "string") {
                  const qidMatch = val.match(/questionId=([^, }]+)/);
                  const respMatch = val.match(/response=([^, }]+)/);
                  if (qidMatch && respMatch) {
                    answers[qidMatch[1]] = respMatch[1];
                  }
                }
              }
            });

            return {
              childInfo,
              answers,
              timestamp: row.Timestamp ? new Date(row.Timestamp).getTime() : Date.now(),
            };
          }).filter(item => item.childInfo.patientId); // Only keep valid records with a patientId

          setHistory((prev) => {
            const combined = [...prev, ...remoteHistory];
            const uniqueMap = {};
            combined.forEach((item) => {
              const key = `${item.childInfo.patientId}_${item.timestamp}`;
              uniqueMap[key] = item;
            });
            const sortedHistory = Object.values(uniqueMap).sort((a, b) => b.timestamp - a.timestamp);
            
            try {
              localStorage.setItem(HISTORY_KEY, JSON.stringify(sortedHistory));
            } catch {
              /* ignore */
            }

            // If form is untouched (except patientId), auto-update to correct next incremented ID
            setChildInfo((currentInfo) => {
              const isUntouched = Object.keys(currentInfo).every(
                (key) => key === "patientId" || currentInfo[key] === ""
              );
              if (isUntouched) {
                const nextId = getNextPatientId(sortedHistory);
                return { ...currentInfo, patientId: nextId };
              }
              return currentInfo;
            });

            return sortedHistory;
          });
        }
      } catch (err) {
        console.error("Failed to sync remote history:", err);
      } finally {
        setHasLoaded(true);
      }
    };

    syncRemoteHistory();
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
          // Verify unique patientId - allow duplicate ONLY IF the name is the same (representing a re-assessment)
          const isDuplicate = history.some(
            (item) =>
              item.childInfo?.patientId?.trim() === pid &&
              item.childInfo?.childName?.trim().toLowerCase() !==
                childInfo.childName?.trim().toLowerCase()
          );
          if (isDuplicate) {
            const existingRecord = history.find(
              (item) => item.childInfo?.patientId?.trim() === pid
            );
            newErrors.patientId = `Patient ID already belongs to another patient: "${existingRecord.childInfo?.childName}"`;
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
      
      // Google Apps Script redirects POST requests to script.googleusercontent.com,
      // which triggers CORS errors on browsers. mode: 'no-cors' silences this, allowing 
      // the request to send successfully while bypassing response validation.
      await fetch(BACKEND_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

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

      // Clear current form draft and reset intake gate selection
      setChildInfo(getInitialChildInfo());
      setAnswers({});
      setErrors({});
      setUnanswered(new Set());
      setPatientType(null); // Return to gateway selection
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

  /* ── Re-assess historical patient ── */
  const handleReassess = useCallback((existingChildInfo) => {
    setChildInfo({ ...existingChildInfo });
    setAnswers({});
    setErrors({});
    setUnanswered(new Set());
    setPatientType("new"); // Jump directly past the gatekeeper selection
    setCurrentTab("new");
    addToast(
      "info",
      `Loaded demographics for Patient ${existingChildInfo.patientId}. Ready for new assessment.`
    );
  }, [addToast]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    setChildInfo(getInitialChildInfo());
    setAnswers(getInitialAnswers());
    setErrors({});
    setUnanswered(new Set());
    setPatientType(null); // Reset back to selection gate
    setShowResetModal(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast("info", "Assessment has been reset.");
  }, [addToast]);

  // Group history by patient ID to extract unique patients
  const uniquePatients = (() => {
    const uniqueMap = {};
    history.forEach((item) => {
      const pid = item.childInfo?.patientId;
      if (pid && !uniqueMap[pid]) {
        uniqueMap[pid] = item.childInfo;
      }
    });
    return Object.values(uniqueMap);
  })();

  const filteredUniquePatients = uniquePatients.filter((patient) => {
    const q = existingSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const pid = (patient.patientId || "").toLowerCase();
    const name = (patient.childName || "").toLowerCase();
    return pid.includes(q) || name.includes(q);
  });

  const answered = countAnswered(answers);

  if (!hasLoaded) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading SIPERS Assessment...</p>
      </div>
    );
  }

  // Render Mobile/Desktop Header
  const renderHeader = () => (
    <Header currentTab={currentTab} onChangeTab={(tab) => {
      setCurrentTab(tab);
      // Reset intake selection gate if moving to/from history
      if (tab === "new") {
        setPatientType(null);
      }
    }} />
  );

  // Intake Gatekeeper selection prompt
  if (currentTab === "new" && patientType === null) {
    return (
      <>
        {renderHeader()}
        <main className={styles.main}>
          <div className={stylesSelect.card}>
            <div className={stylesSelect.titleGroup}>
              <h2 className={stylesSelect.title}>Patient Assessment Intake</h2>
              <p className={stylesSelect.desc}>
                To begin the Social Interaction and Peer Engagement Rating Scale (SIPERS), please select whether this is a new patient or an existing patient.
              </p>
            </div>

            <div className={stylesSelect.grid}>
              {/* Option 1: New Patient */}
              <button
                className={stylesSelect.choiceBtn}
                onClick={() => {
                  const nextId = getNextPatientId(history);
                  setChildInfo({
                    ...getInitialChildInfo(),
                    patientId: nextId,
                  });
                  setAnswers({});
                  setPatientType("new");
                }}
                type="button"
              >
                <div className={stylesSelect.iconWrap}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className={stylesSelect.choiceLabel}>New Patient</span>
                <p className={stylesSelect.choiceDesc}>
                  Initialize a new child profile and auto-generate Patient ID {getNextPatientId(history)}.
                </p>
              </button>

              {/* Option 2: Existing Patient */}
              <button
                className={stylesSelect.choiceBtn}
                onClick={() => {
                  setPatientType("existing");
                }}
                type="button"
              >
                <div className={stylesSelect.iconWrap}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className={stylesSelect.choiceLabel}>Existing Patient</span>
                <p className={stylesSelect.choiceDesc}>
                  Search patient records to populate demographics for a follow-up assessment.
                </p>
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Search existing patients lookup select panel
  if (currentTab === "new" && patientType === "existing") {
    return (
      <>
        {renderHeader()}
        <main className={styles.main}>
          <div className={stylesSelect.card}>
            <div className={stylesSelect.searchSection}>
              <div className={stylesSelect.searchHeader}>
                <h2 className={stylesSelect.title}>Select Existing Patient</h2>
                <button
                  className={stylesSelect.backBtn}
                  onClick={() => {
                    setPatientType(null);
                    setExistingSearchQuery("");
                  }}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              </div>
              <p className={stylesSelect.desc}>
                Select a patient from the list below to run a new assessment.
              </p>

              <div className={stylesSelect.searchBoxWrapper}>
                <svg className={stylesSelect.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5"/>
                  <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className={stylesSelect.searchInput}
                  placeholder="Search by Patient ID or Name..."
                  value={existingSearchQuery}
                  onChange={(e) => setExistingSearchQuery(e.target.value)}
                />
              </div>

              <div className={stylesSelect.resultsList}>
                {filteredUniquePatients.length === 0 ? (
                  <div className={stylesSelect.noResults}>
                    {uniquePatients.length === 0
                      ? "No patient records exist in history yet. Please start a New Patient assessment."
                      : "No matching patients found."}
                  </div>
                ) : (
                  filteredUniquePatients.map((patient) => (
                    <button
                      key={patient.patientId}
                      className={stylesSelect.patientRow}
                      onClick={() => {
                        setChildInfo({ ...patient });
                        setAnswers({});
                        setErrors({});
                        setUnanswered(new Set());
                        setPatientType("new");
                        setExistingSearchQuery("");
                        addToast(
                          "info",
                          `Loaded demographics for Patient ${patient.patientId}. Ready for new assessment.`
                        );
                      }}
                      type="button"
                    >
                      <div className={stylesSelect.patientInfo}>
                        <span className={stylesSelect.patientName}>{patient.childName}</span>
                        <span className={stylesSelect.patientMeta}>
                          ID: {patient.patientId} | Diagnosis: {patient.diagnosis || "N/A"}
                        </span>
                      </div>
                      <span className={stylesSelect.selectBadge}>Select</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      {renderHeader()}

      {currentTab === "new" ? (
        <>
          <div data-print-hide>
            <ProgressBar answered={answered} total={25} />
          </div>

          <main className={styles.main}>
            {/* Start over / Change patient type back button */}
            <div data-print-hide style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                className={stylesSelect.backBtn}
                onClick={() => {
                  setPatientType(null);
                }}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Change Patient Type / Reset Intake
              </button>
            </div>

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
                onReset={handleReset}
                isSaving={isSaving}
              />
            </div>
          </main>
        </>
      ) : (
        <main className={styles.main}>
          <HistoryTab history={history} onPDF={handleGeneratePDFHistory} onReassess={handleReassess} />
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
