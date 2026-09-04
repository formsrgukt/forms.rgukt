import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon/Icon';
import { v4 as uuidv4 } from 'uuid';
import { saveForm } from '../services/db';

function Templates() {
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

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
      saveForm(newForm).catch(error => {
        console.error("Background sync error creating form:", error);
      });
      navigate(`/edit/${newForm.id}`);
    } catch (error) {
      console.error("Error creating form:", error);
      setCreating(false);
    }
  };

  const createRguktTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'RGUKT Students Form',
      description: 'Please provide your details.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Id number', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Full Name', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'Branch', required: true, options: ['PUC', 'CSE', 'ECE', 'CE', 'ME', 'MME', 'CHEM'] },
        { id: uuidv4(), type: 'short_answer', title: 'Year of Study', required: true, options: [] }
      ],
      settings: {
        responses: {
          acceptingResponses: true,
          closedMessage: "This form is no longer accepting responses.",
          limitOnePerUser: false,
          allowEditing: false
        },
        privacy: {
          collectEmail: true,
          anonymousResponses: false,
          showRespondentIdentity: true
        },
        presentation: {
          showProgressBar: true,
          shuffleQuestions: false,
          confirmationMessage: "Thank you, your response has been recorded.",
          redirectUrl: ""
        }
      },
      createdAt: new Date().toISOString()
    };
    
    try {
      saveForm(newForm).catch(error => {
        console.error("Background sync error creating template:", error);
      });
      navigate(`/edit/${newForm.id}`);
    } catch (error) {
      console.error("Error creating RGUKT template:", error);
    }
  };

  const createStudentRegistrationTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Student Registration Form',
      description: 'Please fill out this form to register as a student.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Full Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Student ID', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Email', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Mobile Number', required: true, options: [] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
        { id: uuidv4(), type: 'date', title: 'Date of Birth', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'Campus', required: true, options: ['Basar', 'Nuzvid', 'RK Valley', 'Ongole'] },
        { id: uuidv4(), type: 'dropdown', title: 'College/Department', required: true, options: ['Engineering', 'Pre-University Course'] },
        { id: uuidv4(), type: 'dropdown', title: 'Branch', required: true, options: ['CSE', 'ECE', 'CE', 'ME', 'MME', 'CHEM'] },
        { id: uuidv4(), type: 'dropdown', title: 'Year', required: true, options: ['E1', 'E2', 'E3', 'E4', 'PUC 1', 'PUC 2'] },
        { id: uuidv4(), type: 'paragraph', title: 'Address', required: true, options: [] },
        { id: uuidv4(), type: 'file_upload', title: 'Profile Photo', required: true, options: [] }
      ],
      settings: {
        responses: {
          acceptingResponses: true,
          closedMessage: "This form is no longer accepting responses.",
          limitOnePerUser: false,
          allowEditing: false
        },
        privacy: {
          collectEmail: true,
          anonymousResponses: false,
          showRespondentIdentity: true
        },
        presentation: {
          showProgressBar: true,
          shuffleQuestions: false,
          confirmationMessage: "Registration successful. Thank you!",
          redirectUrl: ""
        }
      },
      createdAt: new Date().toISOString()
    };
    
    try {
      saveForm(newForm).catch(error => {
        console.error("Background sync error creating template:", error);
      });
      navigate(`/edit/${newForm.id}`);
    } catch (error) {
      console.error("Error creating registration template:", error);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>Template Gallery</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Start with a blank form or choose a pre-made template.</p>
        </div>
      </div>

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

        {/* RGUKT Students Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createRguktTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--primary-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
             <Icon name="users" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Forms for RGUKT students</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>

        {/* Student Registration Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createStudentRegistrationTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}>
             <Icon name="form" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Student Registration</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>

        {/* Event Registration Template */}
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
        
        {/* Contact Information Template */}
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
  );
}

export default Templates;