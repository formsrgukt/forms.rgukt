import React from 'react';
import Icon from './Icon/Icon';

function FormSettings({ form, updateFormMeta }) {
  // Ensure settings object exists to avoid errors on older forms
  const settings = form.settings || {
    responses: { acceptingResponses: true, closedMessage: "This form is no longer accepting responses.", limitOnePerUser: false, allowEditing: false, limitResponses: false, expirationDate: "", maxResponses: "" },
    privacy: { collectEmail: false, anonymousResponses: true, showRespondentIdentity: false },
    presentation: { showProgressBar: false, shuffleQuestions: false, confirmationMessage: "Your response has been recorded.", redirectUrl: "" },
    coverScreen: { enabled: false, title: "", description: "", buttonText: "Start", icon: "form", animation: "fade-up", backgroundColor: "#ffffff", textColor: "#1f2937", buttonColor: "#3b82f6", fontFamily: "Inter" }
  };

  const updateSetting = (category, key, value) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    updateFormMeta('settings', updatedSettings);
  };

  const SettingToggle = ({ label, description, checked, onChange }) => (
    <div className="flex-between" style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-color)' }}>
      <div>
        <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{label}</p>
        {description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: '40px', height: '24px', opacity: 0, position: 'absolute', zIndex: 1, cursor: 'pointer' }}
        />
        <div style={{ 
          width: '40px', height: '24px', borderRadius: '12px', 
          backgroundColor: checked ? 'var(--primary-500)' : 'var(--gray-400)',
          position: 'relative', transition: 'background-color 0.2s'
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
            position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}></div>
        </div>
      </label>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {/* Responses Settings */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="responses" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Responses</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Manage how responses are collected and processed.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Accepting responses" 
            description="Turn off to close the form to new submissions."
            checked={settings.responses.acceptingResponses} 
            onChange={(v) => updateSetting('responses', 'acceptingResponses', v)} 
          />
          
          {!settings.responses.acceptingResponses && (
            <div style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Message for respondents</p>
              <textarea 
                className="input-field" 
                rows="2"
                value={settings.responses.closedMessage}
                onChange={(e) => updateSetting('responses', 'closedMessage', e.target.value)}
                placeholder="Message to show when the form is closed"
              />
            </div>
          )}

          <SettingToggle 
            label="Limit to 1 response" 
            description="Requires respondents to sign in."
            checked={settings.responses.limitOnePerUser} 
            onChange={(v) => updateSetting('responses', 'limitOnePerUser', v)} 
          />
          <SettingToggle 
            label="Set response limits" 
            description="Automatically close the form based on a date/time or maximum number of responses."
            checked={settings.responses.limitResponses || false} 
            onChange={(v) => updateSetting('responses', 'limitResponses', v)} 
          />
          {settings.responses.limitResponses && (
            <div style={{ marginLeft: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', border: '1px solid var(--border-color)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Maximum number of responses</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Form will automatically close after this many responses. Leave blank for no limit.</p>
                <input 
                  type="number"
                  min="1"
                  className="input-field" 
                  value={settings.responses.maxResponses || ""}
                  onChange={(e) => updateSetting('responses', 'maxResponses', e.target.value)}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
              <div style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Form expiration date and time</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Form will automatically close after this time. Leave blank for no expiration.</p>
                <input 
                  type="datetime-local"
                  className="input-field" 
                  value={settings.responses.expirationDate || ""}
                  onChange={(e) => updateSetting('responses', 'expirationDate', e.target.value)}
                />
              </div>
            </div>
          )}
          <SettingToggle 
            label="Allow response editing" 
            description="Respondents can change their answers after submitting."
            checked={settings.responses.allowEditing} 
            onChange={(v) => updateSetting('responses', 'allowEditing', v)} 
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="lock" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Privacy</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Configure email collection and anonymity.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Collect email addresses" 
            description="Require respondents to provide an email."
            checked={settings.privacy.collectEmail} 
            onChange={(v) => updateSetting('privacy', 'collectEmail', v)} 
          />
          <SettingToggle 
            label="Anonymous responses" 
            description="Do not track who submitted the form."
            checked={settings.privacy.anonymousResponses} 
            onChange={(v) => updateSetting('privacy', 'anonymousResponses', v)} 
          />
        </div>
      </div>

      {/* Presentation Settings */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="presentation" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Presentation</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Manage how the form is presented to respondents.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Show progress bar" 
            description="Help respondents see how much of the form they have completed."
            checked={settings.presentation.showProgressBar} 
            onChange={(v) => updateSetting('presentation', 'showProgressBar', v)} 
          />
          <SettingToggle 
            label="Shuffle question order" 
            description="Randomize the order of questions for each respondent."
            checked={settings.presentation.shuffleQuestions} 
            onChange={(v) => updateSetting('presentation', 'shuffleQuestions', v)} 
          />
          
          <div style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Confirmation message</p>
            <textarea 
              className="input-field" 
              rows="2"
              value={settings.presentation.confirmationMessage}
              onChange={(e) => updateSetting('presentation', 'confirmationMessage', e.target.value)}
              placeholder="Your response has been recorded."
            />
          </div>
        </div>
      </div>

    </div>
  );
}

export default FormSettings;
