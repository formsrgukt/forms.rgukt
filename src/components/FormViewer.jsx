import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loadGoogleFont } from '../utils/fontLoader';
import { getForm, saveResponse } from '../services/db';
import Icon from './Icon/Icon';
import Loader from './Loader';

function FormViewer() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      const currentForm = await getForm(formId);
      
      if (currentForm) {
        if (currentForm.settings?.theme?.fontFamily) {
          loadGoogleFont(currentForm.settings.theme.fontFamily);
        }

        if (!currentForm.settings) {
          currentForm.settings = {
            responses: { acceptingResponses: true, closedMessage: "This form is no longer accepting responses.", limitOnePerUser: false, allowEditing: false },
            privacy: { collectEmail: false, anonymousResponses: true, showRespondentIdentity: false },
            presentation: { showProgressBar: false, shuffleQuestions: false, confirmationMessage: "Your response has been recorded.", redirectUrl: "" },
            theme: { fontFamily: 'Inter' }
          };
        }
        setForm(currentForm);
        
        let initialQuestions = [...currentForm.questions];
        if (currentForm.settings?.presentation?.shuffleQuestions) {
          for (let i = initialQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialQuestions[i], initialQuestions[j]] = [initialQuestions[j], initialQuestions[i]];
          }
        }
        setQuestions(initialQuestions);

        const initialAnswers = {};
        initialQuestions.forEach(q => {
          initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '';
        });
        setAnswers(initialAnswers);
      }
      setLoading(false);
    };
    
    fetchForm();
  }, [formId]);

  const handleAnswerChange = (questionId, value, type) => {
    if (type === 'checkboxes') {
      const currentValues = answers[questionId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setAnswers({ ...answers, [questionId]: newValues });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
    
    if (errors[questionId]) {
      const newErrors = { ...errors };
      delete newErrors[questionId];
      setErrors(newErrors);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors['email']) {
      const newErrors = { ...errors };
      delete newErrors['email'];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let isValid = true;
    
    if (form.settings?.privacy?.collectEmail) {
      if (!email.trim()) {
        newErrors['email'] = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors['email'] = 'Must be a valid email address';
        isValid = false;
      }
    }

    questions.forEach(q => {
      if (q.required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[q.id] = 'This is a required question';
          isValid = false;
        }
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorId === 'email' ? 'email-input-card' : `question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setShowConfirmation(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (!isConfirmed) {
      alert("Please confirm that all data provided is correct.");
      return;
    }

    try {
      setIsSubmitting(true);
      const responseData = {
        answers,
        ...(form.settings?.privacy?.collectEmail ? { email } : {})
      };
      await saveResponse(formId, responseData);
      setSubmitted(true);
      setShowConfirmation(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}><Loader /></div>;
  if (!form) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Form not found</div>;

  const currentFont = form.settings?.theme?.fontFamily || 'Inter';
  const containerStyle = {
    '--font-body': `"${currentFont}", sans-serif`,
    '--font-heading': `"${currentFont}", sans-serif`,
    fontFamily: 'var(--font-body)',
    ...(form.settings?.theme?.color ? { '--primary-500': form.settings.theme.color } : {}),
    ...(form.settings?.theme?.textColor ? { '--text-primary': form.settings.theme.textColor, color: form.settings.theme.textColor } : {})
  };

  const isAccepting = form.settings?.responses?.acceptingResponses !== false;

  if (!isAccepting) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-10) var(--space-4) var(--space-10) var(--space-4)', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: 'var(--space-12) var(--space-6)', borderTop: '8px solid var(--error-500)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>{form.title}</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
            {form.settings?.responses?.closedMessage || "This form is no longer accepting responses."}
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitting || submitted) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-10) var(--space-4) var(--space-10) var(--space-4)', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', borderTop: `8px solid ${submitted ? 'var(--primary-500)' : 'var(--primary-300)'}`, transition: 'border-color var(--transition-slow)' }}>
          
          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            {isSubmitting ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ position: 'relative', width: '80px', height: '80px' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ 
                    position: 'absolute', inset: 0,
                    borderRadius: '50%', 
                    border: '6px solid var(--primary-100)', 
                    borderTopColor: 'var(--primary-500)'
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ width: '80px', height: '80px' }}
              >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="50" fill="#d1fae5"/>
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                    d="M30 50L45 65L70 35" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </div>

          <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
            {isSubmitting ? 'Submitting...' : form.title}
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
            {isSubmitting ? 'Please wait while we record your response.' : (form.settings?.presentation?.confirmationMessage || "Your response has been recorded.")}
          </p>

          {submitted && !form.settings?.responses?.limitOnePerUser && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="btn btn-secondary" 
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                const initialAnswers = {};
                questions.forEach(q => initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '');
                setAnswers(initialAnswers);
                setIsConfirmed(false);
              }} 
              style={{ marginTop: 'var(--space-8)' }}
            >
              Submit another response
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-4) var(--space-4) var(--space-16) var(--space-4)', maxWidth: '768px', margin: '0 auto' }}>
        <div className="card" style={{ borderTop: '8px solid var(--primary-500)', marginBottom: 'var(--space-4)' }}>
          <div className="card-body">
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Review your responses</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Please verify the information below before submitting.</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {form.settings?.privacy?.collectEmail && (
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Email</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', wordBreak: 'break-word' }}>{email}</div>
              </div>
            )}
            {questions.map(q => {
              const answer = answers[q.id];
              let displayAnswer = answer;
              if (Array.isArray(answer)) {
                displayAnswer = answer.join(', ');
              } else if (answer === undefined || answer === null || answer === '') {
                displayAnswer = <span style={{ color: 'var(--gray-400)' }}>-</span>;
              }
              
              return (
                <div key={q.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{q.title}</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', wordBreak: 'break-word' }}>{displayAnswer}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            marginBottom: 'var(--space-6)', 
            backgroundColor: isConfirmed ? 'var(--success-50)' : 'var(--gray-50)',
            border: isConfirmed ? '1px solid var(--success-200)' : '1px dashed var(--gray-300)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--success-600)', cursor: 'pointer', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: isConfirmed ? 'var(--success-700)' : 'var(--text-primary)' }}>
                  Confirm Submission
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: isConfirmed ? 'var(--success-600)' : 'var(--text-secondary)' }}>
                  I confirm that the data provided above is correct.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex-between">
          <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>
            Edit Responses
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleFinalSubmit} 
            disabled={!isConfirmed || isSubmitting} 
            style={{ opacity: (!isConfirmed || isSubmitting) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            {isSubmitting && <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
          </button>
        </div>
      </div>
    );
  }

  let progress = 0;
  if (form.settings?.presentation?.showProgressBar && questions.length > 0) {
    const answeredCount = questions.filter(q => {
      const a = answers[q.id];
      return a && (Array.isArray(a) ? a.length > 0 : String(a).trim().length > 0);
    }).length;
    progress = Math.round((answeredCount / questions.length) * 100);
  }

  return (
    <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-4) var(--space-4) var(--space-16) var(--space-4)', maxWidth: '768px', margin: '0 auto' }}>
      
      {form.settings?.presentation?.showProgressBar && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--bg-app)', padding: 'var(--space-4) 0', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>Page 1 of 1</span>
            <span>{progress}% Completed</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-500)', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      )}

      <div className="card" style={{ borderTop: '8px solid var(--primary-500)', marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>{form.title}</h1>
          {form.description && <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>{form.description}</p>}
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', fontSize: 'var(--text-sm)', color: 'var(--error-500)' }}>
            * Indicates required question
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Email Collection Card */}
        {form.settings?.privacy?.collectEmail && (
          <div id="email-input-card" className="card" style={{ marginBottom: 'var(--space-4)', border: errors['email'] ? '1px solid var(--error-500)' : '1px solid var(--border-color)' }}>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>
                Email <span style={{ color: 'var(--error-500)' }}>*</span>
              </div>
              <input
                type="email"
                className={`input-field ${errors['email'] ? 'error' : ''}`}
                style={{ width: '100%', maxWidth: '300px' }}
                placeholder="Your email"
                value={email}
                onChange={handleEmailChange}
              />
              {errors['email'] && (
                <div className="error-text" style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors['email']}
                </div>
              )}
            </div>
          </div>
        )}

        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            id={`question-${q.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
            style={{ 
              marginBottom: 'var(--space-4)',
              border: errors[q.id] ? '1px solid var(--error-500)' : '1px solid var(--border-color)'
            }}
          >
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>
                {q.title} {q.required && <span style={{ color: 'var(--error-500)' }}>*</span>}
              </div>
              
              <div>
                {q.type === 'short_answer' && (
                  <input
                    type="text"
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', maxWidth: '300px' }}
                    placeholder="Your answer"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                  />
                )}
                
                {q.type === 'paragraph' && (
                  <textarea
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                    placeholder="Your answer"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                  />
                )}
                
                {q.type === 'multiple_choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} className="hover-bg">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: 'var(--text-base)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {q.type === 'checkboxes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} className="hover-bg">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={(answers[q.id] || []).includes(opt)}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: 'var(--text-base)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'dropdown' && (
                  <select
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                  >
                    <option value="" disabled>Choose</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {errors[q.id] && (
                <div className="error-text" style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {errors[q.id]}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <div className="flex-between" style={{ marginTop: 'var(--space-8)' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-base)' }}>
            Submit
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => {
            if(window.confirm('Clear all answers?')) {
              const initialAnswers = {};
              questions.forEach(q => initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '');
              setAnswers(initialAnswers);
              setEmail('');
              setErrors({});
            }
          }}>
            Clear form
          </button>
        </div>
      </form>
      <style>{`
        .hover-bg:hover { background-color: var(--gray-50); }
      `}</style>
    </div>
  );
}

export default FormViewer;
