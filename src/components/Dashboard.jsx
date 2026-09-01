import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon/Icon';
import { v4 as uuidv4 } from 'uuid';

function Dashboard() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedForms = JSON.parse(localStorage.getItem('rgukt_forms') || '[]');
    setForms(savedForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  const createNewForm = () => {
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
    const updatedForms = [newForm, ...forms];
    localStorage.setItem('rgukt_forms', JSON.stringify(updatedForms));
    navigate(`/edit/${newForm.id}`);
  };

  const deleteForm = (id) => {
    const updatedForms = forms.filter(f => f.id !== id);
    localStorage.setItem('rgukt_forms', JSON.stringify(updatedForms));
    setForms(updatedForms);
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Header section */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Welcome back, Admin</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here is what's happening with your forms today.</p>
        </div>
        <button className="btn btn-primary" onClick={createNewForm}>
          <Icon name="add" size={18} /> Create Form
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
            style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', border: '2px dashed var(--gray-400)', backgroundColor: 'transparent' }}
            onClick={createNewForm}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <Icon name="add" size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>Blank Form</h3>
          </div>

          {/* Example Template 1 */}
          <div 
            className="card card-hover" 
            style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
               <Icon name="form" size={32} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Course Evaluation</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
          </div>

          {/* Example Template 2 */}
          <div 
            className="card card-hover" 
            style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--warning-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-600)' }}>
               <Icon name="activity" size={32} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Event Registration</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
          </div>
          
          {/* Example Template 3 */}
          <div 
            className="card card-hover" 
            style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--success-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-600)' }}>
               <Icon name="users" size={32} />
            </div>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Contact Information</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
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
