import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon/Icon';
import Loader from './Loader';
import { v4 as uuidv4 } from 'uuid';
import { getForms, saveForm } from '../services/db';

function Dashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

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

  const createNewForm = async () => {
    if (creating) return;
    setCreating(true);
    const newForm = {
      id: uuidv4(),
      title: 'Untitled Form',
      description: '',
      questions: [],
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
        }
      },
      createdAt: new Date().toISOString()
    };
    
    try {
      // Fire and forget so we don't wait for backend confirmation
      // The local cache will be updated instantly due to persistence
      saveForm(newForm).catch(error => {
        console.error("Background sync error creating form:", error);
      });
      navigate(`/edit/${newForm.id}`);
    } catch (error) {
      console.error("Error creating form:", error);
      setCreating(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header section */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Welcome back, Admin</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here is what's happening with your forms today.</p>
        </div>
        <button className="btn btn-primary" onClick={createNewForm} disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
          <Icon name="add" size={18} /> {creating ? 'Creating...' : 'Create Form'}
        </button>
      </div>

      {/* Statistics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="form" size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Forms</p>
            <h3 style={{ fontSize: 'var(--text-2xl)' }}>{forms.length}</h3>
          </div>
        </div>

        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--success-100)', color: 'var(--success-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="responses" size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Total Responses</p>
            <h3 style={{ fontSize: 'var(--text-2xl)' }}>0</h3>
          </div>
        </div>

        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--warning-100)', color: 'var(--warning-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="analytics" size={24} />
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Completion Rate</p>
            <h3 style={{ fontSize: 'var(--text-2xl)' }}>0%</h3>
          </div>
        </div>
      </div>

      {/* Start a new form Section */}
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Start a new form</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Blank Form */}
          <div 
            className="card card-hover" 
            style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: creating ? 'not-allowed' : 'pointer', textAlign: 'center', border: '2px dashed var(--gray-400)', backgroundColor: 'transparent', opacity: creating ? 0.7 : 1 }}
            onClick={createNewForm}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <Icon name="add" size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>{creating ? 'Creating...' : 'Blank Form'}</h3>
          </div>

          {/* View All Templates shortcut */}
          <div 
            className="card card-hover" 
            style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', backgroundColor: 'var(--primary-50)' }}
            onClick={() => navigate('/templates')}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <Icon name="templates" size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>View Templates</h3>
          </div>
        </div>
      </div>
      <style>{`
        .dashboard-table-row:hover {
          background-color: var(--gray-50);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
