import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getForm, saveForm } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Loader from './Loader';
import Icon from './Icon/Icon';

function ImportForm() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasImported = useRef(false);

  useEffect(() => {
    const importForm = async () => {
      if (!currentUser || hasImported.current) return;
      hasImported.current = true;
      
      try {
        const originalForm = await getForm(formId);
        
        if (!originalForm) {
          setError("Template not found or has been deleted.");
          setLoading(false);
          return;
        }

        const newFormId = uuidv4();
        
        // Regenerate question IDs
        const updatedQuestions = (originalForm.questions || []).map(q => ({
           ...q,
           id: uuidv4(),
           options: q.options ? [...q.options] : undefined
        }));
        
        const newForm = {
          id: newFormId,
          userId: currentUser.uid,
          title: originalForm.title + ' (Imported)',
          description: originalForm.description || '',
          questions: updatedQuestions,
          settings: originalForm.settings || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isImported: true
        };
        
        await saveForm(newForm);
        showToast('Form imported successfully from link!', 'success');
        navigate(`/edit/${newFormId}`);
      } catch (err) {
        console.error(err);
        setError("An error occurred while importing this form template.");
        setLoading(false);
      }
    };

    importForm();
  }, [formId, currentUser, navigate, showToast]);

  if (error) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', borderTop: '8px solid var(--error-500)' }}>
          <Icon name="error" size={48} color="var(--error-500)" />
          <h2 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-4) 0', color: 'var(--text-primary)' }}>Import Failed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/forms')}>
            Go to My Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Loader />
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>Importing form template...</p>
    </div>
  );
}

export default ImportForm;
