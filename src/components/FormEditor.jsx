import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useUndo } from '../hooks/useUndo';
import Icon from './Icon/Icon';
import FormSettings from './FormSettings';
import AutosaveIndicator from './AutosaveIndicator/AutosaveIndicator';
import ThemeSidebar from './ThemeSidebar';
import CustomDropdown from './CustomDropdown';
import Loader from './Loader';
import { loadGoogleFont } from '../utils/fontLoader';
import { getForm, saveForm, getResponses, deleteResponse } from '../services/db';
import { useToast } from '../contexts/ToastContext';

const QUESTION_TYPE_OPTIONS = [
  { value: 'short_answer', label: 'Short answer', icon: 'short_answer' },
  { value: 'paragraph', label: 'Paragraph', icon: 'paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice', icon: 'multiple_choice' },
  { value: 'checkboxes', label: 'Checkboxes', icon: 'checkboxes' },
  { value: 'dropdown', label: 'Dropdown', icon: 'dropdown' }
];

function FormEditor() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'questions';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [responseSearchTerm, setResponseSearchTerm] = useState('');
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [deletingResponseId, setDeletingResponseId] = useState(null);
  const initialLoadRef = useRef(false);

  const [form, setForm, { undo, redo, canUndo, canRedo }] = useUndo(null);

  useEffect(() => {
    if (!initialLoadRef.current) {
      const fetchForm = async () => {
        const currentForm = await getForm(formId);
        if (currentForm) {
          setForm(currentForm);
        } else {
          navigate('/');
        }
      };
      fetchForm();
      initialLoadRef.current = true;
    }
  }, [formId, navigate, setForm]);

  useEffect(() => {
    if (form && initialLoadRef.current) {
      setSaveStatus('saving');
      const timer = setTimeout(async () => {
        try {
          await saveForm(form);
          setSaveStatus('saved');
        } catch (error) {
          console.error("Error saving form:", error);
          setSaveStatus('error');
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [form, formId]);

  useEffect(() => {
    if (formId) {
      const fetchFormResponses = async () => {
        if (activeTab === 'responses') setLoadingResponses(true);
        const fetchedResponses = await getResponses(formId);
        setResponses(fetchedResponses);
        if (activeTab === 'responses') setLoadingResponses(false);
      };
      fetchFormResponses();
    }
  }, [formId, activeTab]);

  useEffect(() => {
    if (form?.settings?.theme?.fontFamily) {
      loadGoogleFont(form.settings.theme.fontFamily);
    }
  }, [form?.settings?.theme?.fontFamily]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const updateFormMeta = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addQuestion = () => {
    const newQuestion = {
      id: uuidv4(),
      type: 'multiple_choice',
      title: '',
      options: ['Option 1'],
      required: false
    };
    
    const newQuestions = [...form.questions];
    if (activeQuestion) {
      const index = newQuestions.findIndex(q => q.id === activeQuestion);
      newQuestions.splice(index + 1, 0, newQuestion);
    } else {
      newQuestions.push(newQuestion);
    }
    
    setForm({ ...form, questions: newQuestions });
    setActiveQuestion(newQuestion.id);
    showToast('Question added');
  };

  const updateQuestion = (id, field, value) => {
    const updatedQuestions = form.questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    );
    setForm({ ...form, questions: updatedQuestions });
  };

  const deleteQuestion = (id) => {
    const updatedQuestions = form.questions.filter(q => q.id !== id);
    setForm({ ...form, questions: updatedQuestions });
    if (activeQuestion === id) setActiveQuestion(null);
    showToast('Question deleted', 'error');
  };

  const duplicateQuestion = (question) => {
    const newQuestion = { ...question, id: uuidv4() };
    const index = form.questions.findIndex(q => q.id === question.id);
    const newQuestions = [...form.questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setForm({ ...form, questions: newQuestions });
    setActiveQuestion(newQuestion.id);
    showToast('Question duplicated');
  };

  const addOption = (questionId) => {
    const question = form.questions.find(q => q.id === questionId);
    const newOptions = [...question.options, `Option ${question.options.length + 1}`];
    updateQuestion(questionId, 'options', newOptions);
    showToast('Option added');
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = form.questions.find(q => q.id === questionId);
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, 'options', newOptions);
  };

  const removeOption = (questionId, optionIndex) => {
    const question = form.questions.find(q => q.id === questionId);
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionId, 'options', newOptions);
    showToast('Option removed', 'error');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(form.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setForm({ ...form, questions: items });
  };

  const filteredResponses = responses.filter(r => {
    if (!responseSearchTerm) return true;
    const term = responseSearchTerm.toLowerCase();
    
    if (new Date(r.submittedAt).toLocaleString().toLowerCase().includes(term)) return true;
    if (r.email && r.email.toLowerCase().includes(term)) return true;
    
    if (r.answers) {
      for (const key in r.answers) {
        const answer = r.answers[key];
        if (Array.isArray(answer)) {
          if (answer.join(', ').toLowerCase().includes(term)) return true;
        } else if (typeof answer === 'string' && answer.toLowerCase().includes(term)) {
          return true;
        } else if (typeof answer === 'number' && String(answer).toLowerCase().includes(term)) {
          return true;
        }
      }
    }
    
    return false;
  });

  const handleDeleteResponse = async () => {
    if (!responseToDelete) return;
    const responseId = responseToDelete;
    setDeletingResponseId(responseId);
    
    try {
      await deleteResponse(responseId);
      setResponses(responses.filter(r => r.id !== responseId));
      showToast('Response deleted successfully', 'success');
      setResponseToDelete(null);
    } catch (error) {
      console.error("Error deleting response:", error);
      showToast('Error deleting response', 'error');
    } finally {
      setDeletingResponseId(null);
    }
  };

  if (!form) return <div className="container flex-center" style={{ minHeight: '50vh' }}><Loader /></div>;

  return (
    <div>
      {/* Top Bar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky', 
        top: '-40px', /* Offset for app-content padding if needed, or 0 */
        zIndex: 100, 
        backgroundColor: 'var(--bg-app)', 
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
        borderBottom: '1px solid var(--border-color)',
        width: '100%'
      }}>
        {/* Left: Save Status & Undo/Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', whiteSpace: 'nowrap' }}>
          <AutosaveIndicator status={saveStatus} />
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn-icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ color: canUndo ? 'var(--text-secondary)' : 'var(--gray-300)' }}>
              <Icon name="undo" size={20} />
            </button>
            <button className="btn-icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{ color: canRedo ? 'var(--text-secondary)' : 'var(--gray-300)' }}>
              <Icon name="redo" size={20} />
            </button>
          </div>
        </div>

        {/* Center: Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-6)', justifyContent: 'center' }}>
          <button 
            style={{ 
              background: 'none', border: 'none', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)',
              color: activeTab === 'questions' ? 'var(--primary-600)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'questions' ? '3px solid var(--primary-500)' : '3px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
          <button 
            style={{ 
              background: 'none', border: 'none', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)',
              color: activeTab === 'responses' ? 'var(--primary-600)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'responses' ? '3px solid var(--primary-500)' : '3px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setActiveTab('responses')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Responses
              {responses.length > 0 && (
                <span style={{ 
                  backgroundColor: activeTab === 'responses' ? 'var(--primary-100)' : 'var(--gray-200)', 
                  color: activeTab === 'responses' ? 'var(--primary-700)' : 'var(--text-secondary)',
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'bold',
                  transition: 'all var(--transition-fast)'
                }}>
                  {responses.length}
                </span>
              )}
            </div>
          </button>
          <button 
            style={{ 
              background: 'none', border: 'none', padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)',
              color: activeTab === 'settings' ? 'var(--primary-600)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'settings' ? '3px solid var(--primary-500)' : '3px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn-icon" onClick={() => setShowThemeSidebar(true)} title="Customize Theme" style={{ color: 'var(--text-secondary)' }}>
            <Icon name="theme" size={22} />
          </button>
          <button className="btn-icon" onClick={() => window.open(`/view/${form.id}`, '_blank')} title="Preview" style={{ color: 'var(--text-secondary)' }}>
            <Icon name="preview" size={22} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowPublishModal(true)} style={{ padding: 'var(--space-2) var(--space-6)', marginLeft: 'var(--space-2)' }}>
            Publish
          </button>
        </div>
      </div>

      <div className="form-builder-container animate-fade-in" style={{ 
        position: 'relative', 
        maxWidth: activeTab === 'responses' ? '100%' : undefined,
        padding: activeTab === 'responses' ? '0 var(--space-6)' : undefined,
        '--font-body': `"${form.settings?.theme?.fontFamily || 'Inter'}", sans-serif`,
        '--font-heading': `"${form.settings?.theme?.fontFamily || 'Inter'}", sans-serif`,
        ...(form.settings?.theme?.color ? { '--primary-500': form.settings.theme.color } : {}),
        ...(form.settings?.theme?.textColor ? { '--text-primary': form.settings.theme.textColor, color: form.settings.theme.textColor } : {})
      }}>
        {/* Editor Content Area */}

        {activeTab === 'settings' && (
        <FormSettings form={form} updateFormMeta={updateFormMeta} />
      )}

      {activeTab === 'responses' && (
        <div>
          {loadingResponses ? (
            <div className="container flex-center" style={{ minHeight: '30vh' }}><Loader /></div>
          ) : responses.length === 0 ? (
            <div className="card" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
                <Icon name="bar-chart" size={32} color="var(--gray-400)" />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>0 responses</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Waiting for responses...</p>
            </div>
          ) : (
            <div>
              <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', borderTop: '8px solid var(--primary-500)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>{responses.length} {responses.length === 1 ? 'response' : 'responses'}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Latest responses to your form.</p>
                  </div>
                  <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}>
                      <Icon name="search" size={18} />
                    </div>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '38px', width: '100%' }}
                      placeholder="Search across all responses..." 
                      value={responseSearchTerm}
                      onChange={(e) => setResponseSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border-color)' }}>Timestamp</th>
                      {form.settings?.privacy?.collectEmail && (
                        <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border-color)' }}>Email</th>
                      )}
                      {form.questions.map(q => (
                        <th key={q.id} style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border-color)' }}>
                          {q.title}
                        </th>
                      ))}
                      <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.length === 0 ? (
                      <tr>
                        <td colSpan={form.questions.length + (form.settings?.privacy?.collectEmail ? 3 : 2)} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No matching responses found.
                        </td>
                      </tr>
                    ) : (
                      filteredResponses.map((response) => (
                        <tr key={response.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }} className="dashboard-table-row">
                          <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-color)' }}>
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        {form.settings?.privacy?.collectEmail && (
                          <td style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-sm)', borderRight: '1px solid var(--border-color)' }}>
                            {response.email || '-'}
                          </td>
                        )}
                        {form.questions.map(q => {
                          const answer = response.answers?.[q.id];
                          let displayAnswer = answer;
                          if (Array.isArray(answer)) {
                            displayAnswer = answer.join(', ');
                          } else if (answer === undefined || answer === null || answer === '') {
                            displayAnswer = <span style={{ color: 'var(--gray-400)' }}>-</span>;
                          }
                          return (
                            <td key={q.id} style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-sm)', minWidth: '150px', borderRight: '1px solid var(--border-color)' }}>
                              {displayAnswer}
                            </td>
                          );
                        })}
                        <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'center' }}>
                          <button 
                            className="btn-icon" 
                            style={{ color: deletingResponseId === response.id ? 'var(--gray-400)' : 'var(--error-500)', opacity: deletingResponseId === response.id ? 0.7 : 1, cursor: deletingResponseId === response.id ? 'not-allowed' : 'pointer' }}
                            onClick={() => !deletingResponseId && setResponseToDelete(response.id)}
                            title="Delete Response"
                            disabled={deletingResponseId === response.id}
                          >
                            {deletingResponseId === response.id ? (
                              <Icon name="loader" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Icon name="delete" size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Header Card */}
          <div className="card" style={{ borderTop: '8px solid var(--primary-500)', marginBottom: 'var(--space-6)' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)', border: 'none', padding: 'var(--space-2) 0', borderBottom: '2px solid transparent', borderRadius: 0 }}
                value={form.title}
                onChange={(e) => updateFormMeta('title', e.target.value)}
                placeholder="Form Title"
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary-500)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
              <input
                type="text"
                className="input-field"
                style={{ fontSize: 'var(--text-base)', border: 'none', padding: 'var(--space-2) 0', borderBottom: '1px solid transparent', borderRadius: 0 }}
                value={form.description}
                onChange={(e) => updateFormMeta('description', e.target.value)}
                placeholder="Form Description"
                onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary-500)'}
                onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
            </div>
          </div>

          {/* Question List via Drag and Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {form.questions.map((q, index) => (
                    <Draggable key={q.id} draggableId={q.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`card ${activeQuestion === q.id ? 'active' : ''}`}
                          style={{ 
                            marginBottom: 'var(--space-4)', 
                            borderLeft: activeQuestion === q.id ? '6px solid var(--primary-500)' : '1px solid var(--border-color)',
                            boxShadow: snapshot.isDragging ? 'var(--shadow-xl)' : (activeQuestion === q.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'),
                            ...provided.draggableProps.style 
                          }}
                          onClick={() => setActiveQuestion(q.id)}
                        >
                          {/* Drag Handle */}
                          <div {...provided.dragHandleProps} style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-1) 0', color: 'var(--gray-300)', cursor: 'grab' }}>
                            <Icon name="drag" size={20} />
                          </div>

                          <div className="card-body" style={{ paddingTop: 0 }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ flex: 1, backgroundColor: 'var(--gray-50)' }}
                                value={q.title}
                                onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                                placeholder="Question Title"
                              />
                              {activeQuestion === q.id && (
                                <div style={{ width: '220px' }}>
                                  <CustomDropdown
                                    value={q.type}
                                    options={QUESTION_TYPE_OPTIONS}
                                    onChange={(value) => updateQuestion(q.id, 'type', value)}
                                  />
                                </div>
                              )}
                            </div>

                            <div style={{ paddingLeft: 'var(--space-2)' }}>
                              {q.type === 'short_answer' && (
                                <div style={{ borderBottom: '1px dotted var(--gray-400)', width: '50%', padding: 'var(--space-2) 0', color: 'var(--text-tertiary)' }}>
                                  Short answer text
                                </div>
                              )}
                              {q.type === 'paragraph' && (
                                <div style={{ borderBottom: '1px dotted var(--gray-400)', width: '100%', padding: 'var(--space-2) 0', color: 'var(--text-tertiary)' }}>
                                  Long answer text
                                </div>
                              )}
                              {(q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                  {q.options.map((opt, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                      <div style={{ color: 'var(--gray-400)' }}>
                                        <Icon name={q.type} size={16} />
                                      </div>
                                      <input
                                        type="text"
                                        className="option-input"
                                        value={opt}
                                        onChange={(e) => updateOption(q.id, i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                      />
                                      {activeQuestion === q.id && q.options.length > 1 && (
                                        <button className="btn-icon" onClick={() => removeOption(q.id, i)}>
                                          <Icon name="delete" size={16} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  {activeQuestion === q.id && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                                      <div style={{ color: 'var(--gray-300)' }}>
                                        <Icon name={q.type} size={16} />
                                      </div>
                                      <button className="btn-ghost" onClick={() => addOption(q.id)} style={{ padding: 'var(--space-1) var(--space-2)' }}>
                                        Add option
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {activeQuestion === q.id && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                                <button className="btn-icon" onClick={() => duplicateQuestion(q)} title="Duplicate">
                                  <Icon name="duplicate" size={20} />
                                </button>
                                <button className="btn-icon" onClick={() => deleteQuestion(q.id)} title="Delete">
                                  <Icon name="delete" size={20} />
                                </button>
                                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                                  Required
                                  <input
                                    type="checkbox"
                                    checked={q.required || false}
                                    onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        </div>
      )}
      </div>

      {/* Floating Toolbar (Placed outside animated container to prevent fixed positioning issues) */}
      {activeTab === 'questions' && (
        <div style={{ position: 'fixed', right: 'var(--space-6)', top: '160px', zIndex: 150 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-2)', gap: 'var(--space-2)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            <button className="btn-icon" onClick={addQuestion} title="Add Question" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <Icon name="add" size={20} />
            </button>
            <button className="btn-icon" title="Import questions" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="download" size={20} />
            </button>
            <button className="btn-icon" title="Add title and description" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="short_answer" size={20} />
            </button>
            <button className="btn-icon" title="Add image" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="image" size={20} />
            </button>
            <button className="btn-icon" title="Add video" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="video" size={20} />
            </button>
            <button className="btn-icon" title="Add section" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="section" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: 'var(--space-6)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icon name="share" size={24} color="var(--primary-600)" /> Publish Form
              </h2>
              <button className="btn-icon" onClick={() => setShowPublishModal(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Share this link to start collecting responses from students.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <input 
                type="text" 
                className="input-field" 
                style={{ flex: 1, backgroundColor: 'var(--gray-50)' }} 
                readOnly 
                value={`${window.location.origin}/view/${form.id}`} 
              />
              <button 
                className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`} 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/view/${form.id}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={18} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowPublishModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Theme Sidebar */}
      {showThemeSidebar && (
        <ThemeSidebar 
          form={form} 
          updateFormMeta={updateFormMeta} 
          onClose={() => setShowThemeSidebar(false)} 
        />
      )}

      {/* Delete Response Confirmation Modal */}
      {responseToDelete && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-6)', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--error-600)' }}>
              <Icon name="delete" size={24} />
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Delete Response</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Are you sure you want to delete this response? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-primary)', border: 'none', opacity: deletingResponseId ? 0.7 : 1 }} 
                onClick={() => setResponseToDelete(null)}
                disabled={deletingResponseId !== null}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--error-600)', color: 'white', border: 'none', opacity: deletingResponseId ? 0.7 : 1, minWidth: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }} 
                onClick={handleDeleteResponse}
                disabled={deletingResponseId !== null}
              >
                {deletingResponseId ? (
                  <>
                    <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .dashboard-table-row:hover {
          background-color: var(--gray-50);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FormEditor;
