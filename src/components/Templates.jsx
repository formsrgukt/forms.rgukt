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

  const createStudentFeedbackTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Student Feedback Form',
      description: 'Please provide your feedback.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Student Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Student ID', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'Course/Subject', required: true, options: ['Course 1', 'Course 2', 'Course 3'] },
        { id: uuidv4(), type: 'dropdown', title: 'Faculty Name', required: true, options: ['Faculty 1', 'Faculty 2'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Teaching Quality', required: true, options: ['1 (Poor)', '2', '3', '4', '5 (Excellent)'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Subject Understanding', required: true, options: ['1 (Poor)', '2', '3', '4', '5 (Excellent)'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Faculty Interaction', required: true, options: ['1 (Poor)', '2', '3', '4', '5 (Excellent)'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Course Difficulty', required: true, options: ['Too Easy', 'Just Right', 'Too Difficult'] },
        { id: uuidv4(), type: 'paragraph', title: 'What did you like?', required: false, options: [] },
        { id: uuidv4(), type: 'paragraph', title: 'Suggestions', required: false, options: [] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Overall Rating', required: true, options: ['1 (Poor)', '2', '3', '4', '5 (Excellent)'] }
      ],
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
          showProgressBar: true,
          shuffleQuestions: false,
          confirmationMessage: "Thank you for your feedback!",
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
      console.error("Error creating feedback template:", error);
    }
  };

  const createEventRegistrationTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Event Registration Form',
      description: 'Please fill out this form to register for the event.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Full Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Student ID', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Email', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Mobile Number', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'College/Department', required: true, options: ['Engineering', 'Pre-University Course', 'Other'] },
        { id: uuidv4(), type: 'dropdown', title: 'Branch', required: true, options: ['CSE', 'ECE', 'CE', 'ME', 'MME', 'CHEM'] },
        { id: uuidv4(), type: 'dropdown', title: 'Year', required: true, options: ['E1', 'E2', 'E3', 'E4', 'PUC 1', 'PUC 2'] },
        { id: uuidv4(), type: 'dropdown', title: 'Event Name', required: true, options: ['Technical Symposium', 'Cultural Fest', 'Sports Meet', 'Workshop'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Participation Type', required: true, options: ['Individual', 'Team'] },
        { id: uuidv4(), type: 'short_answer', title: 'Team Name (if applicable)', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Number of Team Members', required: false, options: [] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Dietary Preference', required: true, options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
        { id: uuidv4(), type: 'checkboxes', title: 'Consent', required: true, options: ['I agree to the terms and conditions'] }
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
          confirmationMessage: "Your event registration is complete!",
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
      console.error("Error creating event registration template:", error);
    }
  };

  const createJobApplicationTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Job Application Form',
      description: 'Please fill out this form to apply for the position.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Full Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Email', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Phone', required: true, options: [] },
        { id: uuidv4(), type: 'date', title: 'Date of Birth', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Location', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'Highest Qualification', required: true, options: ['High School', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD'] },
        { id: uuidv4(), type: 'checkboxes', title: 'Skills', required: true, options: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'NoSQL', 'HTML/CSS', 'AWS/Cloud'] },
        { id: uuidv4(), type: 'short_answer', title: 'Years of Experience', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Previous Company', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Portfolio URL', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'LinkedIn URL', required: false, options: [] },
        { id: uuidv4(), type: 'file_upload', title: 'Resume', required: true, options: [] },
        { id: uuidv4(), type: 'paragraph', title: 'Cover Letter', required: false, options: [] }
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
          confirmationMessage: "Your application has been submitted successfully!",
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
      console.error("Error creating job application template:", error);
    }
  };

  const createHackathonTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Hackathon Registration Form',
      description: 'Register your team for the upcoming hackathon.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Team Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Team Leader Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Leader Email', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Leader Phone', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Team Size', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 1 Name', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 1 ID', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 2 Name', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 2 ID', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 3 Name', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Member 3 ID', required: false, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Project Title', required: true, options: [] },
        { id: uuidv4(), type: 'paragraph', title: 'Project Description', required: true, options: [] },
        { id: uuidv4(), type: 'checkboxes', title: 'Technology Stack', required: true, options: ['React', 'Node.js', 'Python', 'Java', 'C++', 'AI/ML', 'Blockchain', 'Other'] },
        { id: uuidv4(), type: 'short_answer', title: 'GitHub Repository URL', required: false, options: [] },
        { id: uuidv4(), type: 'file_upload', title: 'Project Presentation', required: false, options: [] }
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
          confirmationMessage: "Your hackathon registration is confirmed. Good luck!",
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
      console.error("Error creating hackathon template:", error);
    }
  };

  const createComplaintTemplate = async () => {
    const newForm = {
      id: uuidv4(),
      title: 'Complaint / Grievance Form',
      description: 'Please submit your complaint or grievance using this form.',
      questions: [
        { id: uuidv4(), type: 'short_answer', title: 'Name', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Student ID', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Email', required: true, options: [] },
        { id: uuidv4(), type: 'dropdown', title: 'Complaint Category', required: true, options: ['Academic', 'Hostel', 'Mess', 'Infrastructure', 'Harassment', 'Other'] },
        { id: uuidv4(), type: 'short_answer', title: 'Subject', required: true, options: [] },
        { id: uuidv4(), type: 'paragraph', title: 'Description', required: true, options: [] },
        { id: uuidv4(), type: 'short_answer', title: 'Location', required: false, options: [] },
        { id: uuidv4(), type: 'date', title: 'Date of Incident', required: false, options: [] },
        { id: uuidv4(), type: 'file_upload', title: 'Supporting Document', required: false, options: [] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] },
        { id: uuidv4(), type: 'multiple_choice', title: 'Preferred Contact Method', required: true, options: ['Email', 'Phone', 'In-person'] }
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
          confirmationMessage: "Your complaint has been submitted. We will look into it shortly.",
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
      console.error("Error creating complaint template:", error);
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

        {/* Student Feedback Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createStudentFeedbackTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--success-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-600)' }}>
             <Icon name="bar-chart" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Student Feedback</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>

        {/* Event Registration Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createEventRegistrationTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--warning-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-600)' }}>
             <Icon name="activity" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Event Registration</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>
        
        {/* Job Application Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createJobApplicationTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--primary-100)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
             <Icon name="users" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Job Application</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>

        {/* Hackathon Registration Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createHackathonTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--secondary-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-500)' }}>
             <Icon name="star" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Hackathon Registration</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>

        {/* Complaint / Grievance Template */}
        <div 
          className="card card-hover" 
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative' }}
          onClick={createComplaintTemplate}
        >
          <div style={{ width: '100%', height: '120px', backgroundColor: 'var(--gray-200)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)' }}>
             <Icon name="short_answer" size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>Complaint / Grievance</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Template</p>
        </div>
      </div>
    </div>
  );
}

export default Templates;