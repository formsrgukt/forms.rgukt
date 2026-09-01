"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

// --- Types ---
type QuestionType = 
  | "Short answer" 
  | "Paragraph" 
  | "Multiple choice" 
  | "Checkboxes" 
  | "Dropdown" 
  | "Linear scale" 
  | "Date" 
  | "Time" 
  | "File upload";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  form_id?: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: Option[];
  order: number;
}

interface FormSchema {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  created_at?: string;
}

// --- Helper Components ---
const QuestionTypeSelector = ({ value, onChange }: { value: QuestionType, onChange: (t: QuestionType) => void }) => {
  const types = [
    "Short answer", "Paragraph", "Multiple choice", "Checkboxes", 
    "Dropdown", "Linear scale", "Date", "Time", "File upload"
  ];
  return (
    <select 
      className={styles.typeSelector} 
      value={value} 
      onChange={(e) => onChange(e.target.value as QuestionType)}
    >
      {types.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
};

const OptionEditor = ({ 
  options, 
  onChange, 
  type 
}: { 
  options: Option[], 
  onChange: (opts: Option[]) => void,
  type: QuestionType 
}) => {
  const updateOption = (id: string, text: string) => {
    onChange(options.map(o => o.id === id ? { ...o, text } : o));
  };
  const removeOption = (id: string) => {
    onChange(options.filter(o => o.id !== id));
  };
  const addOption = () => {
    onChange([...options, { id: crypto.randomUUID(), text: `Option ${options.length + 1}` }]);
  };

  const indicator = type === "Multiple choice" ? "○" : type === "Checkboxes" ? "□" : "1.";

  return (
    <div className={styles.optionsContainer}>
      {options.map((opt, idx) => (
        <div key={opt.id} className={styles.optionRow}>
          <span className={styles.optionIndicator}>{type === "Dropdown" ? `${idx + 1}.` : indicator}</span>
          <input 
            type="text" 
            className={styles.optionInput} 
            value={opt.text}
            onChange={(e) => updateOption(opt.id, e.target.value)}
            placeholder="Option"
          />
          {options.length > 1 && (
            <button className={styles.removeOptionBtn} onClick={() => removeOption(opt.id)}>×</button>
          )}
        </div>
      ))}
      <div className={styles.addOptionRow}>
        <span className={styles.optionIndicator}>{type === "Dropdown" ? `${options.length + 1}.` : indicator}</span>
        <button className={styles.addOptionBtn} onClick={addOption}>Add option</button>
      </div>
    </div>
  );
};

const FormHeader = ({ 
  title, 
  description, 
  onChange 
}: { 
  title: string, 
  description: string, 
  onChange: (field: string, value: string) => void 
}) => {
  return (
    <div className={styles.formHeaderCard}>
      <input 
        type="text" 
        className={styles.headerTitleInput} 
        value={title}
        onChange={(e) => onChange("title", e.target.value)}
        placeholder="Form title"
      />
      <textarea 
        className={styles.headerDescInput} 
        value={description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="Form description"
        rows={2}
      />
    </div>
  );
};

const QuestionCard = ({
  question,
  isActive,
  onClick,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  moveUp,
  moveDown
}: {
  question: Question,
  isActive: boolean,
  onClick: () => void,
  updateQuestion: (id: string, updates: Partial<Question>) => void,
  deleteQuestion: (id: string) => void,
  duplicateQuestion: (id: string) => void,
  moveUp: (id: string) => void,
  moveDown: (id: string) => void
}) => {
  const needsOptions = ["Multiple choice", "Checkboxes", "Dropdown"].includes(question.type);

  return (
    <div className={`${styles.questionCard} ${isActive ? styles.active : ''}`} onClick={onClick}>
      <div className={styles.dragHandle} title="Reorder (Coming Soon)">:::</div>
      
      <div className={styles.questionTopRow}>
        <input 
          type="text"
          className={styles.questionTitleInput}
          value={question.title}
          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
          placeholder="Question"
        />
        {isActive && (
          <QuestionTypeSelector 
            value={question.type}
            onChange={(type) => {
              const updates: Partial<Question> = { type };
              if (["Multiple choice", "Checkboxes", "Dropdown"].includes(type) && (!question.options || question.options.length === 0)) {
                updates.options = [{ id: crypto.randomUUID(), text: "Option 1" }];
              }
              updateQuestion(question.id, updates);
            }}
          />
        )}
      </div>

      {!isActive && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {question.type} question
        </div>
      )}

      {isActive && needsOptions && (
        <OptionEditor 
          type={question.type}
          options={question.options || []}
          onChange={(options) => updateQuestion(question.id, { options })}
        />
      )}

      {isActive && !needsOptions && (
        <div style={{ marginTop: "1rem", color: "var(--text-muted)", borderBottom: "1px dashed var(--border-color)", paddingBottom: "0.5rem" }}>
          {question.type} text
        </div>
      )}

      {isActive && (
        <div className={styles.questionFooter}>
          <button className={styles.footerBtn} onClick={(e) => { e.stopPropagation(); moveUp(question.id); }} title="Move Up">↑</button>
          <button className={styles.footerBtn} onClick={(e) => { e.stopPropagation(); moveDown(question.id); }} title="Move Down">↓</button>
          <button className={styles.footerBtn} onClick={() => duplicateQuestion(question.id)} title="Duplicate">📑</button>
          <button className={styles.footerBtn} onClick={() => deleteQuestion(question.id)} title="Delete">🗑️</button>
          <div className={styles.toggleContainer}>
            Required
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={question.required}
                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                style={{ marginLeft: '0.5rem' }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page ---
export default function FormEditor() {
  const params = useParams();
  const formId = params.formId as string;
  const router = useRouter();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"Saved ✓" | "Saving..." | "Error saving" | "">("");
  
  // Debounce refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Load Form Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Form
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (formError || !formData) {
        console.error(formError);
        router.push("/dashboard");
        return;
      }
      setForm(formData);

      // Fetch Questions
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });
        
      if (!qError && questionsData) {
        if (questionsData.length === 0) {
          // Initialize with one question if empty
          const newQ: Question = {
            id: crypto.randomUUID(),
            form_id: formId,
            title: "Untitled Question",
            type: "Multiple choice",
            required: false,
            order: 0,
            options: [{ id: crypto.randomUUID(), text: "Option 1" }]
          };
          setQuestions([newQ]);
        } else {
          setQuestions(questionsData);
        }
      }
    };
    
    fetchData();
  }, [formId, router]);

  // Autosave to Supabase
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    if (!form) return;
    
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      // Update form metadata
      const { error: formError } = await supabase
        .from('forms')
        .update({
          title: form.title,
          description: form.description,
          theme: form.theme
        })
        .eq('id', form.id);
        
      if (formError) {
        console.error(formError);
        setSaveStatus("Error saving");
        return;
      }

      // Upsert questions
      // First delete questions that might have been removed (to prevent orphans)
      const currentIds = questions.map(q => q.id);
      if (currentIds.length > 0) {
        await supabase
          .from('questions')
          .delete()
          .eq('form_id', form.id)
          .not('id', 'in', `(${currentIds.join(',')})`);
      } else {
        await supabase.from('questions').delete().eq('form_id', form.id);
      }

      // Then upsert current questions
      if (questions.length > 0) {
        const { error: qError } = await supabase
          .from('questions')
          .upsert(questions.map((q, idx) => ({
            id: q.id,
            form_id: form.id,
            title: q.title,
            type: q.type,
            required: q.required,
            options: q.options,
            order: idx
          })));

        if (qError) {
          console.error(qError);
          setSaveStatus("Error saving");
          return;
        }
      }
      
      setSaveStatus("Saved ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 1500); // 1.5s debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [form, questions]);

  if (!form) return <div className={styles.mainContent}>Loading...</div>;

  const updateFormHeader = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const addQuestion = () => {
    const newId = crypto.randomUUID();
    setQuestions([
      ...questions,
      {
        id: newId,
        form_id: formId,
        type: "Multiple choice",
        title: "",
        required: false,
        order: questions.length,
        options: [{ id: crypto.randomUUID(), text: "Option 1" }]
      }
    ]);
    setActiveQuestionId(newId);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    const updated = questions.filter(q => q.id !== id);
    // Re-adjust order just to be clean
    const reordered = updated.map((q, idx) => ({ ...q, order: idx }));
    setQuestions(reordered);
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const duplicateQuestion = (id: string) => {
    const qToDup = questions.find(q => q.id === id);
    if (!qToDup) return;
    
    const newId = crypto.randomUUID();
    const newQ = { 
      ...qToDup, 
      id: newId, 
      options: qToDup.options ? qToDup.options.map(o => ({ ...o, id: crypto.randomUUID() })) : undefined
    };
    
    const idx = questions.findIndex(q => q.id === id);
    const updated = [...questions];
    updated.splice(idx + 1, 0, newQ);
    
    // Re-adjust order
    const reordered = updated.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
    setActiveQuestionId(newId);
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const idx = questions.findIndex(q => q.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === questions.length - 1)) return;
    
    const updated = [...questions];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    
    // Re-adjust order
    const reordered = updated.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Editor Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.leftControls}>
          <Link href="/" className={styles.logoIcon} title="Home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="var(--primary)"/>
              <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <input 
            type="text" 
            className={styles.formTitleInput}
            value={form.title}
            onChange={(e) => updateFormHeader("title", e.target.value)}
          />
          <span className={styles.saveStatus}>{saveStatus}</span>
        </div>
        <div className={styles.rightControls}>
          <button className={styles.btnAction}>🎨</button>
          <button className={styles.btnAction}>👁️</button>
          <button className={styles.btnPrimary}>Send</button>
          <button className={styles.btnAction}>⋮</button>
        </div>
      </header>

      {/* Editor Content */}
      <main className={styles.mainContent} onClick={() => setActiveQuestionId(null)}>
        <div className={styles.formContainer}>
          
          <div onClick={(e) => e.stopPropagation()}>
            <FormHeader 
              title={form.title} 
              description={form.description || ""} 
              onChange={updateFormHeader} 
            />
          </div>

          {questions.map((q) => (
            <div key={q.id} onClick={(e) => { e.stopPropagation(); setActiveQuestionId(q.id); }}>
              <QuestionCard 
                question={q}
                isActive={activeQuestionId === q.id}
                onClick={() => setActiveQuestionId(q.id)}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                duplicateQuestion={duplicateQuestion}
                moveUp={(id) => moveQuestion(id, "up")}
                moveDown={(id) => moveQuestion(id, "down")}
              />
            </div>
          ))}
          
          {/* Floating Actions */}
          <div className={styles.floatingActionMenu}>
            <button className={styles.actionMenuBtn} onClick={addQuestion} title="Add question">
              ➕
            </button>
            <button className={styles.actionMenuBtn} title="Add title and description">
              Tt
            </button>
            <button className={styles.actionMenuBtn} title="Add section">
              🟰
            </button>
          </div>
          
        </div>
      </main>
    </div>
  );
}
