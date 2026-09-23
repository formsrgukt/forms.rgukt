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
import CoverScreenModal from './CoverScreenModal';
import { loadGoogleFont } from '../utils/fontLoader';
import { getForm, saveForm, deleteForm, getResponses, subscribeToResponses, deleteResponse } from '../services/db';
import { useToast } from '../contexts/ToastContext';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const QUESTION_TYPE_OPTIONS = [
  { value: 'short_answer', label: 'Short answer', icon: 'short_answer' },
  { value: 'paragraph', label: 'Paragraph', icon: 'paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice', icon: 'multiple_choice' },
  { value: 'checkboxes', label: 'Checkboxes', icon: 'checkboxes' },
  { value: 'dropdown', label: 'Dropdown', icon: 'dropdown' },
  { value: 'file_upload', label: 'File upload', icon: 'file_upload' },
  { value: 'linear_scale', label: 'Linear scale', icon: 'linear_scale' },
  { value: 'date', label: 'Date', icon: 'date' },
  { value: 'time', label: 'Time', icon: 'time' }
];

const COVER_ICONS = [
  { value: 'form', label: 'Document' },
  { value: 'star', label: 'Star' },
  { value: 'check-circle', label: 'Check' },
  { value: 'activity', label: 'Activity' },
  { value: 'presentation', label: 'Presentation' }
];

const COVER_ANIMATIONS = [
  { value: 'fade-up', label: 'Fade Up' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' }
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
  const [viewingFile, setViewingFile] = useState(null);
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [deletingResponseId, setDeletingResponseId] = useState(null);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [hasChangesToPublish, setHasChangesToPublish] = useState(false);
  const [publishStatus, setPublishStatus] = useState('idle');
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const initialLoadRef = useRef(false);
  const isPublishingRef = useRef(false);

  const [form, setForm, { undo, redo, canUndo, canRedo }] = useUndo(null);

  useEffect(() => {
    if (!initialLoadRef.current) {
      const fetchForm = async () => {
        const currentForm = await getForm(formId);
        if (currentForm) {
          // Auto-fix branch options: change CE to CIVIL and sort alphabetically
          if (currentForm.questions) {
            currentForm.questions.forEach(q => {
              if (['dropdown', 'multiple_choice', 'checkboxes'].includes(q.type) && Array.isArray(q.options)) {
                q.options = q.options.map(opt => opt === 'CE' ? 'CIVIL' : opt);
                if (q.title && q.title.toLowerCase().includes('branch')) {
                  q.options.sort((a, b) => String(a).localeCompare(String(b)));
                }
              }
            });
          }
          
          setForm(currentForm);
          const hasChanges = !currentForm.publishedAt || (currentForm.updatedAt && currentForm.publishedAt && currentForm.updatedAt > currentForm.publishedAt);
          setHasChangesToPublish(hasChanges);
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
      if (!isPublishingRef.current) {
        setHasChangesToPublish(true);
        setSaveStatus('unsaved'); // Indicate there are unsaved changes
      }
    }
  }, [form]);

  useEffect(() => {
    if (formId) {
      if (activeTab === 'responses') setLoadingResponses(true);
      const unsubscribe = subscribeToResponses(formId, (fetchedResponses) => {
        setResponses(fetchedResponses);
        if (activeTab === 'responses') setLoadingResponses(false);
      });
      return () => unsubscribe();
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

  const handlePublishClick = async () => {
    if (!form.publishedAt || hasChangesToPublish || form.isImported) {
      const isInitialPublish = !form.publishedAt || form.isImported;
      isPublishingRef.current = true;
      setPublishStatus('publishing');
      setSaveStatus('saving');
      
      try {
        const now = Date.now();
        let updatedForm = { ...form, publishedAt: now, updatedAt: now };

        if (updatedForm.isImported) {
          const newFormId = uuidv4();
          updatedForm = { ...updatedForm, id: newFormId, isImported: false };
          await saveForm(updatedForm);
          await deleteForm(form.id); // Delete the temporary imported draft
          
          showToast('Form Published Successfully!');
          // We must navigate since the ID changed. The user can share from the new URL.
          navigate(`/edit/${newFormId}`, { replace: true });
          return; // Exit early since component will unmount
        } else {
          await saveForm(updatedForm);
          setForm(updatedForm);
        }

        setHasChangesToPublish(false);
        setPublishStatus('idle');
        setSaveStatus('saved');
        setTimeout(() => {
          isPublishingRef.current = false;
        }, 50);
        showToast(isInitialPublish ? 'Form Published Successfully!' : 'Form Updated Successfully!');
        if (isInitialPublish) {
          setShowPublishModal(true);
        }
      } catch (err) {
        setPublishStatus('idle');
        setSaveStatus('error');
        isPublishingRef.current = false;
        showToast('Error saving form', 'error');
      }
    } else {
      setShowPublishModal(true);
    }
  };

  const updateCoverScreenSettings = (coverScreenSettings) => {
    const currentSettings = form.settings || {};
    setForm({
      ...form,
      settings: {
        ...currentSettings,
        coverScreen: coverScreenSettings
      }
    });
  };

  const exportToExcel = () => {
    setShowExportDropdown(false);
    if (responses.length === 0) return showToast('No responses to export', 'warning');
    
    const headers = ['Timestamp'];
    if (form.settings?.privacy?.collectEmail) headers.push('Email');
    form.questions.forEach(q => headers.push(q.title || 'Untitled Question'));
    
    const rows = responses.map(response => {
      const row = [new Date(response.submittedAt).toLocaleString()];
      if (form.settings?.privacy?.collectEmail) row.push(response.email || '');
      form.questions.forEach(q => {
        let answer = response.answers?.[q.id] || '';
        if (Array.isArray(answer)) answer = answer.join(', ');
        row.push(answer);
      });
      return row;
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, `${form.title.replace(/\s+/g, '_')}_Responses.xlsx`);
    showToast('Exported to Excel', 'success');
  };

  const exportToPDF = () => {
    setShowExportDropdown(false);
    if (responses.length === 0) return showToast('No responses to export', 'warning');
    
    const headers = ['Timestamp'];
    if (form.settings?.privacy?.collectEmail) headers.push('Email');
    form.questions.forEach(q => headers.push(q.title || 'Untitled Question'));
    
    const rows = responses.map(response => {
      const row = [new Date(response.submittedAt).toLocaleString()];
      if (form.settings?.privacy?.collectEmail) row.push(response.email || '');
      form.questions.forEach(q => {
        let answer = response.answers?.[q.id] || '';
        if (Array.isArray(answer)) answer = answer.join(', ');
        row.push(answer);
      });
      return row;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${form.title} - Responses</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #4f46e5;
              --primary-light: #e0e7ff;
              --text-main: #111827;
              --text-muted: #6b7280;
              --border: #e5e7eb;
              --bg-alt: #f9fafb;
            }
            
            @page {
              margin: 0;
              size: A4 portrait;
            }
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: var(--text-main);
              margin: 20mm;
              padding: 0;
              line-height: 1.5;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .header {
              border-bottom: 2px solid var(--primary);
              padding-bottom: 24px;
              margin-bottom: 32px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }

            .header-content h1 { 
              margin: 0 0 8px 0; 
              font-size: 28px; 
              font-weight: 700;
              color: var(--text-main);
              letter-spacing: -0.02em;
            }
            
            .header-meta {
              font-size: 14px;
              color: var(--text-muted);
              font-weight: 500;
            }
            
            .stat-badge {
              background-color: var(--primary-light);
              color: var(--primary);
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 14px;
            }

            .table-container {
              border: 1px solid var(--border);
              border-radius: 8px;
              overflow: hidden;
            }

            table { 
              width: 100%; 
              border-collapse: collapse; 
              text-align: left;
            }
            
            th { 
              background-color: var(--bg-alt);
              color: var(--text-muted);
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 14px 16px;
              border-bottom: 1px solid var(--border);
            }
            
            td { 
              padding: 14px 16px; 
              font-size: 14px;
              border-bottom: 1px solid var(--border);
              color: var(--text-main);
            }
            
            tbody tr:last-child td {
              border-bottom: none;
            }

            tbody tr:nth-child(even) {
              background-color: #fcfcfd;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px solid var(--border);
              text-align: center;
              font-size: 12px;
              color: var(--text-muted);
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-content">
              <h1>${form.title || 'Untitled Form'}</h1>
              <div class="header-meta">Generated on ${new Date().toLocaleString()}</div>
            </div>
            <div class="stat-badge">
              ${responses.length} ${responses.length === 1 ? 'Response' : 'Responses'}
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell || '<span style="color: #9ca3af; font-style: italic;">Empty</span>'}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            Generated securely by RGUKT Forms • All rights reserved
          </div>
        </body>
      </html>
    `;

    setPdfPreviewHtml(htmlContent);
    setShowPdfPreviewModal(true);
  };

  const confirmDownloadPDF = () => {
    const opt = {
      margin:       0,
      filename:     `${form.title || 'Form'}_Responses.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    showToast('Preparing PDF download...', 'success');
    html2pdf().set(opt).from(pdfPreviewHtml).save().then(() => {
      setShowPdfPreviewModal(false);
    });
  };

  const addQuestion = (type = 'multiple_choice') => {
    const newQuestion = {
      id: uuidv4(),
      type: type,
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

  const addPredefinedQuestion = (presetType) => {
    let newQuestion = {
      id: uuidv4(),
      required: true
    };
    
    switch(presetType) {
      case 'id':
        newQuestion = { ...newQuestion, type: 'short_answer', title: 'ID Number', options: [] };
        break;
      case 'mail':
        newQuestion = { ...newQuestion, type: 'short_answer', title: 'RGUKT Mail', options: [] };
        break;
      case 'branch':
        newQuestion = { ...newQuestion, type: 'dropdown', title: 'Branch', options: ['CSE', 'ECE', 'CIVIL', 'MECH', 'CHEM', 'MME', 'EEE'] };
        break;
      default:
        return;
    }

    const newQuestions = [...form.questions];
    if (activeQuestion) {
      const index = newQuestions.findIndex(q => q.id === activeQuestion);
      newQuestions.splice(index + 1, 0, newQuestion);
    } else {
      newQuestions.push(newQuestion);
    }
    
    setForm({ ...form, questions: newQuestions });
    setActiveQuestion(newQuestion.id);
    showToast(`${newQuestion.title} question added`);
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
          <button className="btn-icon" onClick={() => window.open(`/view/${form.id}?preview=true`, '_blank')} title="Preview" style={{ color: 'var(--text-secondary)' }}>
            <Icon name="preview" size={22} />
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePublishClick} 
            disabled={publishStatus === 'publishing'}
            style={{ 
              padding: 'var(--space-2) var(--space-6)', 
              marginLeft: 'var(--space-2)',
              minWidth: '110px'
            }}
          >
            {publishStatus === 'publishing' && <Icon name="loader" size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {publishStatus === 'publishing'
                ? (form.publishedAt && hasChangesToPublish ? 'Updating...' : 'Publishing...')
                : (!form.publishedAt ? 'Publish' : (hasChangesToPublish ? 'Update' : 'Share'))}
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
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    
                    <div style={{ position: 'relative' }}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setShowExportDropdown(true)}
                        disabled={responses.length === 0}
                      >
                        <Icon name="download" size={18} /> Export
                      </button>
                    </div>
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
                        <tr 
                          key={response.id} 
                          style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }} 
                          className={`dashboard-table-row ${Date.now() - response.submittedAt < 5000 ? 'new-response-row' : ''}`}
                        >
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
                          if (typeof answer === 'string' && (answer.startsWith('https://drive.google.com/file/d/') || answer.startsWith('https://docs.google.com/'))) {
                            displayAnswer = (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
                                onClick={() => {
                                  let previewUrl = answer;
                                  try {
                                    let match = answer.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                    if (match && match[1]) {
                                      previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                                    } else {
                                      match = answer.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
                                      if (match && match[1] && match[2]) {
                                        previewUrl = `https://docs.google.com/${match[1]}/d/${match[2]}/preview`;
                                      } else {
                                        previewUrl = answer.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
                                      }
                                    }
                                  } catch (e) {
                                    previewUrl = answer.replace('/view', '/preview').replace('/edit', '/preview');
                                  }
                                  setViewingFile({ url: previewUrl, original: answer });
                                }}
                              >
                                <Icon name="external-link" size={14} /> View File
                              </button>
                            );
                          } else if (Array.isArray(answer)) {
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
                                style={{ flex: 1, backgroundColor: 'var(--gray-50)', fontSize: q.type === 'section_block' ? 'var(--text-lg)' : 'inherit', fontWeight: q.type === 'section_block' ? 'var(--font-weight-semibold)' : 'inherit' }}
                                value={q.title}
                                onChange={(e) => updateQuestion(q.id, 'title', e.target.value)}
                                placeholder={q.type === 'section_block' ? 'Section Title' : q.type === 'title_block' ? 'Title' : q.type === 'image_block' ? 'Image Title (optional)' : q.type === 'video_block' ? 'Video Title (optional)' : 'Question Title'}
                              />
                              {activeQuestion === q.id && !['title_block', 'image_block', 'video_block', 'section_block'].includes(q.type) && (
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
                              {(q.type === 'title_block' || q.type === 'section_block') && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ width: '100%', backgroundColor: 'var(--gray-50)' }}
                                    value={q.description || ''}
                                    onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                    placeholder="Description (optional)"
                                  />
                                </div>
                              )}
                              
                              {q.type === 'image_block' && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ width: '100%', backgroundColor: 'var(--gray-50)', marginBottom: 'var(--space-3)' }}
                                    value={q.imageUrl || ''}
                                    onChange={(e) => updateQuestion(q.id, 'imageUrl', e.target.value)}
                                    placeholder="Paste Image URL here"
                                  />
                                  {q.imageUrl && (
                                    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: 'var(--gray-100)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                                      <img src={q.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {q.type === 'video_block' && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                  <input
                                    type="text"
                                    className="input-field"
                                    style={{ width: '100%', backgroundColor: 'var(--gray-50)', marginBottom: 'var(--space-3)' }}
                                    value={q.videoUrl || ''}
                                    onChange={(e) => updateQuestion(q.id, 'videoUrl', e.target.value)}
                                    placeholder="Paste YouTube Video URL here"
                                  />
                                  {q.videoUrl && (
                                    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: 'var(--gray-100)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                                      <iframe 
                                        width="100%" 
                                        height="300" 
                                        src={q.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                        title="Video preview" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                        style={{ maxWidth: '500px' }}
                                      ></iframe>
                                    </div>
                                  )}
                                </div>
                              )}

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
                              {q.type === 'file_upload' && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2) 0' }}>
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3) var(--space-4)',
                                    border: '2px dashed var(--gray-300)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--gray-50)',
                                    width: '100%',
                                    maxWidth: '300px',
                                  }}>
                                    <Icon name="file_upload" size={20} color="var(--primary-500)" />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                      Respondents will upload files here
                                    </span>
                                  </div>
                                </div>
                              )}
                              {q.type === 'linear_scale' && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0', overflowX: 'auto', color: 'var(--text-secondary)' }}>
                                  <table style={{ borderSpacing: '0', borderCollapse: 'collapse', textAlign: 'center' }}>
                                    <thead>
                                      <tr>
                                        {[1, 2, 3, 4, 5].map(num => (
                                          <td key={`th-${num}`} style={{ padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', paddingBottom: 'var(--space-3)' }}>
                                            {num}
                                          </td>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {[1, 2, 3, 4, 5].map(num => (
                                          <td key={`td-${num}`} style={{ padding: '0 var(--space-3)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--gray-300)' }}></div>
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {q.type === 'date' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderBottom: '1px dotted var(--gray-400)', width: 'fit-content', padding: 'var(--space-2) 0', color: 'var(--text-tertiary)' }}>
                                  <span>Month, day, year</span>
                                  <Icon name="date" size={16} />
                                </div>
                              )}
                              {q.type === 'time' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderBottom: '1px dotted var(--gray-400)', width: 'fit-content', padding: 'var(--space-2) 0', color: 'var(--text-tertiary)' }}>
                                  <span>Time</span>
                                  <Icon name="time" size={16} />
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
                                {!['title_block', 'image_block', 'video_block', 'section_block'].includes(q.type) && (
                                  <>
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
                                  </>
                                )}
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
            <button 
              className="btn-icon" 
              onClick={() => setShowAddMenu(true)} 
              title="Add Question" 
              style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}
            >
              <Icon name="add" size={20} />
            </button>
            <button className="btn-icon" title="Import questions" style={{ color: 'var(--text-secondary)' }} onClick={() => alert('Feature coming soon')}>
              <Icon name="download" size={20} />
            </button>
            <button className="btn-icon" title="Add title and description" style={{ color: 'var(--text-secondary)' }} onClick={() => addQuestion('title_block')}>
              <Icon name="short_answer" size={20} />
            </button>
            <button className="btn-icon" title="Add image" style={{ color: 'var(--text-secondary)' }} onClick={() => addQuestion('image_block')}>
              <Icon name="image" size={20} />
            </button>
            <button className="btn-icon" title="Add video" style={{ color: 'var(--text-secondary)' }} onClick={() => addQuestion('video_block')}>
              <Icon name="video" size={20} />
            </button>
            <button className="btn-icon" title="Add section" style={{ color: 'var(--text-secondary)' }} onClick={() => addQuestion('section_block')}>
              <Icon name="section" size={20} />
            </button>
            <button className="btn-icon" title={form.settings?.coverScreen?.enabled ? "Edit Cover Screen" : "Add Cover Screen"} style={{ color: form.settings?.coverScreen?.enabled ? 'var(--primary-600)' : 'var(--text-secondary)', backgroundColor: form.settings?.coverScreen?.enabled ? 'var(--primary-50)' : 'transparent' }} onClick={() => setShowCoverModal(true)}>
              <Icon name="presentation" size={20} />
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

      {/* Cover Screen Modal */}
      {showCoverModal && (
        <CoverScreenModal
          initialSettings={form.settings?.coverScreen}
          onSave={updateCoverScreenSettings}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {viewingFile && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}>
          <div className="animate-fade-in" style={{ width: '95%', maxWidth: '1400px', height: '92%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}>
            <div className="flex-between" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--gray-200)', backgroundColor: '#ffffff', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--primary-50)', borderRadius: '10px', color: 'var(--primary-600)' }}>
                  <Icon name="presentation" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--gray-900)' }}>File Preview</h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Google Drive securely embeds this file</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <a 
                  href={viewingFile.original} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn" 
                  style={{ padding: '8px 16px', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-100)', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-100)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-50)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Icon name="external-link" size={16} />
                  Open in New Tab
                </a>
                <button 
                  className="btn-icon" 
                  onClick={() => setViewingFile(null)}
                  style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--error-600)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--gray-100)'; e.currentTarget.style.color = 'var(--gray-600)'; }}
                >
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f8f9fa', position: 'relative' }}>
              <iframe 
                src={viewingFile.url} 
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
                title="File Viewer"
                allow="autoplay; camera; microphone; fullscreen; picture-in-picture"
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Export Modal */}
      {showExportDropdown && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }} onClick={() => setShowExportDropdown(false)}>
          <div className="card animate-pop-in" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Export Responses</h3>
              <button className="btn-icon" onClick={() => setShowExportDropdown(false)}><Icon name="close" size={20} /></button>
            </div>
            
            <div style={{ padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <button className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={exportToExcel} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.backgroundColor = 'var(--primary-50)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}>
                <img src="/excel-icon.png" alt="Excel" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Excel Document</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>.xlsx format</span>
                </div>
              </button>

              <button className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={exportToPDF} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.backgroundColor = 'var(--primary-50)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}>
                <img src="/pdf-icon.png" alt="PDF" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>PDF Document</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Printable format</span>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PDF Preview Modal */}
      {showPdfPreviewModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 'var(--space-6)' }} onClick={() => setShowPdfPreviewModal(false)}>
          <div className="card animate-pop-in" style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>PDF Preview</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Verify how your responses will look before downloading.</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-secondary" onClick={() => setShowPdfPreviewModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Icon name="download" size={18} /> Confirm Download
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: 'var(--space-6)', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '210mm', minHeight: '297mm', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
                <iframe 
                  srcDoc={pdfPreviewHtml} 
                  style={{ width: '100%', height: '100%', minHeight: '297mm', border: 'none' }}
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Question Modal */}
      {showAddMenu && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 'var(--space-4)' }} onClick={() => setShowAddMenu(false)}>
          <div className="card animate-pop-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Add Question</h3>
              <button className="btn-icon" onClick={() => setShowAddMenu(false)}><Icon name="close" size={20} /></button>
            </div>
            
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button 
                className="card" 
                style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', border: '1px solid var(--border-color)' }} 
                onClick={() => { addQuestion(); setShowAddMenu(false); }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-500)'; e.currentTarget.style.backgroundColor = 'var(--primary-50)'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ padding: '8px', backgroundColor: 'var(--primary-100)', borderRadius: '8px', color: 'var(--primary-600)' }}>
                  <Icon name="add" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-medium)' }}>New Question</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Add a blank question</div>
                </div>
              </button>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', padding: 'var(--space-2) 0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 'var(--space-2)' }}>RGUKT Presets</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-2)' }}>
                <button 
                  className="btn-ghost" 
                  style={{ textAlign: 'left', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: '1px solid var(--gray-200)' }} 
                  onClick={() => { addPredefinedQuestion('id'); setShowAddMenu(false); }}
                >
                  <Icon name="short_answer" size={18} color="var(--gray-500)" />
                  ID Number
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ textAlign: 'left', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: '1px solid var(--gray-200)' }} 
                  onClick={() => { addPredefinedQuestion('mail'); setShowAddMenu(false); }}
                >
                  <Icon name="short_answer" size={18} color="var(--gray-500)" />
                  RGUKT Mail
                </button>
                <button 
                  className="btn-ghost" 
                  style={{ textAlign: 'left', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: '1px solid var(--gray-200)' }} 
                  onClick={() => { addPredefinedQuestion('branch'); setShowAddMenu(false); }}
                >
                  <Icon name="dropdown" size={18} color="var(--gray-500)" />
                  Branch Selection
                </button>
              </div>
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
