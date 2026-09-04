import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Icon from './Icon/Icon';
import Loader from './Loader';
import { useToast } from '../contexts/ToastContext';
import { getForms, deleteForm, saveForm } from '../services/db';

function MyForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formToDelete, setFormToDelete] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      const data = await getForms();
      setForms(data);
      setLoading(false);
    };
    fetchForms();
  }, []);

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}><Loader /></div>;

  const createBlankForm = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const newFormId = uuidv4();
      const initialForm = {
        id: newFormId,
        title: 'Untitled Form',
        description: '',
        questions: [{
          id: uuidv4(),
          type: 'multiple_choice',
          title: '',
          options: ['Option 1'],
          required: false
        }],
        settings: {
          responses: {
            acceptingResponses: true,
            closedMessage: "This form is no longer accepting responses.",
            limitOnePerUser: false,
            allowEditing: false
          },
          privacy: {
            collectEmail: false,
            anonymousResponses: true,
            showRespondentIdentity: false
          },
          presentation: {
            showProgressBar: false,
            shuffleQuestions: false,
            confirmationMessage: "Your response has been recorded.",
            redirectUrl: ""
          },
          theme: { color: '#000666', fontFamily: 'Inter' }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      saveForm(initialForm).catch(error => {
        console.error("Background sync error creating form:", error);
      });
      showToast('New form created', 'success');
      navigate(`/edit/${newFormId}`);
    } catch (error) {
      console.error("Error creating form:", error);
      showToast('Error creating form', 'error');
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;
    const id = formToDelete;
    setDeletingId(id);
    try {
      await deleteForm(id);
      setForms(forms.filter(f => f.id !== id));
      showToast('Form deleted successfully', 'success');
      setFormToDelete(null); // Close modal only on success
    } catch (error) {
      console.error("Error deleting form:", error);
      showToast('Error deleting form', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="my-forms-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>My Forms</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all your created forms here.</p>
        </div>
        <button className="btn btn-primary" onClick={createBlankForm} disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
          <Icon name="add" size={18} /> {creating ? 'Creating...' : 'Create Form'}
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
          <div style={{ width: '150px', height: '150px', margin: '0 auto var(--space-4)' }}>
            <img src="/no-forms.svg" alt="No forms yet" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>No forms created yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
            You haven't created any forms. Go to the Dashboard to start building a new form.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <Icon name="dashboard" size={18} /> Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>Form Name</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>Created</th>
                <th style={{ padding: 'var(--space-3) var(--space-5)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color var(--transition-fast)' }} className="dashboard-table-row">
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="form" size={18} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{form.title}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{form.questions?.length || 0} questions</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <span className="badge badge-success">Active</span>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Icon name="clock" size={14} />
                      {new Date(form.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      <button className="btn-icon" onClick={() => navigate(`/view/${form.id}`)} title="View">
                        <Icon name="preview" size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => navigate(`/edit/${form.id}`)} title="Edit">
                        <Icon name="edit" size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ color: deletingId === form.id ? 'var(--gray-400)' : 'var(--error-500)', opacity: deletingId === form.id ? 0.7 : 1, cursor: deletingId === form.id ? 'not-allowed' : 'pointer' }} 
                        onClick={() => !deletingId && setFormToDelete(form.id)} 
                        title="Delete"
                        disabled={deletingId === form.id}
                      >
                        {deletingId === form.id ? (
                          <Icon name="loader" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Icon name="delete" size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {formToDelete && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-6)', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--error-600)' }}>
              <Icon name="delete" size={24} />
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Delete Form</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Are you sure you want to delete this form? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-primary)', border: 'none', opacity: deletingId ? 0.7 : 1 }} 
                onClick={() => setFormToDelete(null)}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--error-600)', color: 'white', border: 'none', opacity: deletingId ? 0.7 : 1, minWidth: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }} 
                onClick={handleDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? (
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

export default MyForms;
