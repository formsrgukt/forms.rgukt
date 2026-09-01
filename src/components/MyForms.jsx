import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon/Icon';

function MyForms() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedForms = JSON.parse(localStorage.getItem('rgukt_forms') || '[]');
    setForms(savedForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, []);

  const deleteForm = (id) => {
    const updatedForms = forms.filter(f => f.id !== id);
    localStorage.setItem('rgukt_forms', JSON.stringify(updatedForms));
    setForms(updatedForms);
  };

  return (
    <div className="my-forms-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>My Forms</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all your created forms here.</p>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
            <Icon name="form" size={32} color="var(--gray-400)" />
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
                      <button className="btn-icon" style={{ color: 'var(--error-500)' }} onClick={() => deleteForm(form.id)} title="Delete">
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .dashboard-table-row:hover {
          background-color: var(--gray-50);
        }
      `}</style>
    </div>
  );
}

export default MyForms;
