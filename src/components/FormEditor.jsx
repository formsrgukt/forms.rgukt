import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useUndo } from '../hooks/useUndo';
import Icon from './Icon/Icon';
import FormSettings from './FormSettings';
import AutosaveIndicator from './AutosaveIndicator/AutosaveIndicator';
import ThemeSidebar from './ThemeSidebar';
import { loadGoogleFont } from '../utils/fontLoader';

function FormEditor() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const [copied, setCopied] = useState(false);
  const initialLoadRef = useRef(false);

  const [form, setForm, { undo, redo, canUndo, canRedo }] = useUndo(null);

  useEffect(() => {
    if (!initialLoadRef.current) {
      const savedForms = JSON.parse(localStorage.getItem('rgukt_forms') || '[]');
      const currentForm = savedForms.find(f => f.id === formId);
      if (currentForm) {
        setForm(currentForm);
      } else {
        navigate('/');
      }
      initialLoadRef.current = true;
    }
  }, [formId, navigate, setForm]);

  useEffect(() => {
    if (form && initialLoadRef.current) {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        const savedForms = JSON.parse(localStorage.getItem('rgukt_forms') || '[]');
        const updatedForms = savedForms.map(f => f.id === formId ? form : f);
        localStorage.setItem('rgukt_forms', JSON.stringify(updatedForms));
        setSaveStatus('saved');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [form, formId]);

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
  };

  const duplicateQuestion = (question) => {
    const newQuestion = { ...question, id: uuidv4() };
    const index = form.questions.findIndex(q => q.id === question.id);
    const newQuestions = [...form.questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setForm({ ...form, questions: newQuestions });
    setActiveQuestion(newQuestion.id);
  };

  const addOption = (questionId) => {
    const question = form.questions.find(q => q.id === questionId);
    const newOptions = [...question.options, `Option ${question.options.length + 1}`];
    updateQuestion(questionId, 'options', newOptions);
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
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(form.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setForm({ ...form, questions: items });
  };

  if (!form) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Loading...</div>;

  return (
    <>
      {/* Top Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        alignItems: 'center',
        position: 'sticky', 
        top: '-40px', /* Offset for app-content padding if needed, or 0 */
        zIndex: 100, 
        backgroundColor: 'var(--bg-app)', 
        padding: 'var(--space-4) 0',
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
            Responses
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
        '--font-body': `"${form.settings?.theme?.fontFamily || 'Inter'}", sans-serif`,
        '--font-heading': `"${form.settings?.theme?.fontFamily || 'Inter'}", sans-serif`
      }}>
        {/* Editor Content Area */}

        {activeTab === 'settings' && (
        <FormSettings form={form} updateFormMeta={updateFormMeta} />
      )}

      {activeTab === 'responses' && (
        <div className="card" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
            <Icon name="bar-chart" size={32} color="var(--gray-400)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>0 responses</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Waiting for responses...</p>
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
                                <div style={{ width: '200px' }}>
                                  <select
                                    className="input-field"
                                    value={q.type}
                                    onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <option value="short_answer">Short answer</option>
                                    <option value="paragraph">Paragraph</option>
                                    <option value="multiple_choice">Multiple choice</option>
                                    <option value="checkboxes">Checkboxes</option>
                                    <option value="dropdown">Dropdown</option>
                                  </select>
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
                                        className="input-field"
                                        style={{ flex: 1, border: 'none', borderBottom: '1px solid transparent', borderRadius: 0, padding: 'var(--space-1) 0' }}
                                        value={opt}
                                        onChange={(e) => updateOption(q.id, i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        onFocus={(e) => e.target.style.borderBottomColor = 'var(--primary-300)'}
                                        onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
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
                                      <button className="btn-ghost text-sm" onClick={() => addOption(q.id)} style={{ padding: 'var(--space-1) 0' }}>
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
    </>
  );
}

export default FormEditor;
