import React from 'react';
import Icon from './Icon/Icon';
import { useToast } from '../contexts/ToastContext';

function FormSettings({ form, updateFormMeta }) {
  const { showToast } = useToast();
  // Ensure settings object exists to avoid errors on older forms
  const settings = form.settings || {
    responses: { acceptingResponses: true, closedMessage: "This form is no longer accepting responses.", limitOnePerUser: false, allowEditing: false, limitResponses: false, expirationDate: "", maxResponses: "", preventDuplicateIds: false },
    privacy: { collectEmail: false, anonymousResponses: true, showRespondentIdentity: false },
    presentation: { showProgressBar: false, shuffleQuestions: false, showSubmitAnotherResponse: true, confirmationMessage: "Your response has been recorded.", redirectUrl: "", focusMode: false },
    proctoring: { antiPaste: false, tabSwitchLimit: false, maxTabSwitches: 3, requireWebcamSnapshot: false, fullscreenMode: false, disableRightClick: false },
    gamification: { enableConfetti: false, soundEffects: false, enableBackgroundMusic: false, cursorEffect: 'none' },
    geofencing: { enabled: false, latitude: '', longitude: '', radiusMeters: 500 },
    accessibility: { enableVoiceRead: false },
    timeLimit: { enabled: false, durationMinutes: 10 },
    coverScreen: { enabled: false, title: "", description: "", buttonText: "Start", icon: "form", animation: "fade-up", backgroundColor: "#ffffff", textColor: "#1f2937", buttonColor: "#3b82f6", fontFamily: "Inter" }
  };

  const updateSetting = (category, key, value) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        ...(settings[category] || {}),
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
          <SettingToggle 
            label="Prevent duplicate IDs" 
            description="Ensure each student ID can only be submitted once per form."
            checked={settings.responses.preventDuplicateIds || false} 
            onChange={(v) => updateSetting('responses', 'preventDuplicateIds', v)} 
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
          <SettingToggle 
            label="Show respondent identity" 
            description="Display the respondent's identity when viewing responses."
            checked={settings.privacy.showRespondentIdentity || false} 
            onChange={(v) => updateSetting('privacy', 'showRespondentIdentity', v)} 
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
            label="Focus Mode (One-by-one)" 
            description="Display one question at a time to reduce respondent distraction."
            checked={settings.presentation?.focusMode || false} 
            onChange={(v) => updateSetting('presentation', 'focusMode', v)} 
          />
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
          <SettingToggle 
            label="Show link to submit another response" 
            description="Allow respondents to submit the form multiple times."
            checked={settings.presentation.showSubmitAnotherResponse ?? true} 
            onChange={(v) => updateSetting('presentation', 'showSubmitAnotherResponse', v)} 
          />
          
          <div style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Redirect URL</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Redirect respondents to this URL after submitting.</p>
            <input 
              type="url"
              className="input-field" 
              value={settings.presentation.redirectUrl || ""}
              onChange={(e) => updateSetting('presentation', 'redirectUrl', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

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

      {/* Security & Proctoring */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="lock" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Proctoring & Security</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Prevent cheating and enforce testing conditions.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Anti-Paste" 
            description="Prevent respondents from copying and pasting answers into text fields."
            checked={settings.proctoring?.antiPaste || false} 
            onChange={(v) => updateSetting('proctoring', 'antiPaste', v)} 
          />
          <SettingToggle 
            label="Tab Switch Limit" 
            description="Warn respondents or submit the form if they switch browser tabs."
            checked={settings.proctoring?.tabSwitchLimit || false} 
            onChange={(v) => updateSetting('proctoring', 'tabSwitchLimit', v)} 
          />
          {settings.proctoring?.tabSwitchLimit && (
             <div style={{ marginLeft: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', border: '1px solid var(--border-color)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Maximum Tab Switches Allowed</p>
                <input 
                  type="number"
                  min="1"
                  className="input-field" 
                  value={settings.proctoring?.maxTabSwitches || 3}
                  onChange={(e) => updateSetting('proctoring', 'maxTabSwitches', parseInt(e.target.value) || 3)}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>
          )}
          <SettingToggle 
            label="Webcam Snapshot on Submit" 
            description="Take a photo of the respondent when they submit the form to verify identity."
            checked={settings.proctoring?.requireWebcamSnapshot || false} 
            onChange={(v) => updateSetting('proctoring', 'requireWebcamSnapshot', v)} 
          />
          <SettingToggle 
            label="Require Fullscreen" 
            description="Require respondents to enter fullscreen mode to take the form. Form cannot be submitted if they exit."
            checked={settings.proctoring?.fullscreenMode || false} 
            onChange={(v) => updateSetting('proctoring', 'fullscreenMode', v)} 
          />
          <SettingToggle 
            label="Disable Right-Click" 
            description="Prevent respondents from opening the context menu or inspecting the page."
            checked={settings.proctoring?.disableRightClick || false} 
            onChange={(v) => updateSetting('proctoring', 'disableRightClick', v)} 
          />
        </div>
      </div>

      {/* Geofencing */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="location" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Geofencing (Location Restriction)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Only allow responses from a specific physical location.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Enable Geofencing" 
            description="Require the respondent to be within a specific radius of a location."
            checked={settings.geofencing?.enabled || false} 
            onChange={(v) => updateSetting('geofencing', 'enabled', v)} 
          />
          {settings.geofencing?.enabled && (
             <div style={{ marginLeft: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', border: '1px solid var(--border-color)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Latitude</p>
                <input 
                  type="number"
                  step="any"
                  className="input-field" 
                  placeholder="e.g. 37.7749"
                  value={settings.geofencing?.latitude || ''}
                  onChange={(e) => updateSetting('geofencing', 'latitude', e.target.value)}
                />
              </div>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Longitude</p>
                <input 
                  type="number"
                  step="any"
                  className="input-field" 
                  placeholder="e.g. -122.4194"
                  value={settings.geofencing?.longitude || ''}
                  onChange={(e) => updateSetting('geofencing', 'longitude', e.target.value)}
                />
              </div>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Radius (in meters)</p>
                <input 
                  type="number"
                  min="1"
                  className="input-field" 
                  value={settings.geofencing?.radiusMeters || 500}
                  onChange={(e) => updateSetting('geofencing', 'radiusMeters', parseInt(e.target.value) || 500)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification & Engagement */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="star" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Gamification & Interactivity</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Make your form more fun and engaging.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Confetti on Submit" 
            description="Celebrate successful submissions with a confetti burst."
            checked={settings.gamification?.enableConfetti || false} 
            onChange={(v) => updateSetting('gamification', 'enableConfetti', v)} 
          />
          <SettingToggle 
            label="Satisfying Sound Effects" 
            description="Play subtle sound effects when selecting options."
            checked={settings.gamification?.soundEffects || false} 
            onChange={(v) => updateSetting('gamification', 'soundEffects', v)} 
          />
          <SettingToggle 
            label="Ambient Background Music" 
            description="Play soft lofi focus music in the background."
            checked={settings.gamification?.enableBackgroundMusic || false} 
            onChange={(v) => updateSetting('gamification', 'enableBackgroundMusic', v)} 
          />
          <div style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Custom Cursor Trail</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Add a playful, interactive canvas effect that follows the cursor.</p>
            <select 
              className="input-field" 
              value={settings.gamification?.cursorEffect || 'none'}
              onChange={(e) => updateSetting('gamification', 'cursorEffect', e.target.value)}
            >
              <option value="none">None</option>
              <option value="sparkles">Sparkles ✨</option>
              <option value="bubbles">Bubbles 🫧</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Limits */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="clock" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Time Constraint (Speedrun Mode)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Set a countdown timer for completing the form.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Enable Time Limit" 
            description="Form will automatically submit when time is up."
            checked={settings.timeLimit?.enabled || false} 
            onChange={(v) => updateSetting('timeLimit', 'enabled', v)} 
          />
          {settings.timeLimit?.enabled && (
             <div style={{ marginLeft: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', border: '1px solid var(--border-color)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
              <div>
                <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Duration (in minutes)</p>
                <input 
                  type="number"
                  min="1"
                  className="input-field" 
                  value={settings.timeLimit?.durationMinutes || 10}
                  onChange={(e) => updateSetting('timeLimit', 'durationMinutes', parseInt(e.target.value) || 1)}
                  onWheel={(e) => e.target.blur()}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessibility */}
      <div className="card">
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="view" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Accessibility</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Make the form accessible to all users.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <SettingToggle 
            label="Enable Read Aloud" 
            description="Add a button to read questions aloud using Text-to-Speech."
            checked={settings.accessibility?.enableVoiceRead || false} 
            onChange={(v) => updateSetting('accessibility', 'enableVoiceRead', v)} 
          />
        </div>
      </div>

      {/* Share Template */}
      <div className="card" style={{ opacity: form.publishedAt ? 1 : 0.7 }}>
        <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ color: 'var(--primary-600)' }}><Icon name="link" size={24} /></div>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Share Template</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Share a duplicate of this form with others.</p>
        </div>
        <div className="card-body" style={{ paddingTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {!form.publishedAt ? (
            <div style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-700)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', width: '100%', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Icon name="info" size={18} />
              <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>You must publish this form before you can share it as a template.</p>
            </div>
          ) : (
            <>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                onClick={() => {
                  const importUrl = `${window.location.origin}/import/${form.id}`;
                  navigator.clipboard.writeText(importUrl)
                    .then(() => showToast('Template link copied to clipboard!', 'success'))
                    .catch(() => showToast('Failed to copy link', 'error'));
                }}
              >
                <Icon name="link" size={18} /> Copy Share Link
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                onClick={() => {
                  const exportData = {
                    title: form.title,
                    description: form.description,
                    questions: form.questions,
                    settings: form.settings,
                  };
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `${form.title.replace(/\s+/g, '_')}_Template.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                  showToast('Form template exported!', 'success');
                }}
              >
                <Icon name="download" size={18} /> Download JSON
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default FormSettings;
