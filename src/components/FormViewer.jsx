import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loadGoogleFont } from '../utils/fontLoader';
import { getForm, saveResponse, getStudentById, getResponses } from '../services/db';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth as fallbackAuth, firebaseConfig, googleProvider } from '../firebase';

import Icon from './Icon/Icon';
import Loader from './Loader';
import { useToast } from '../contexts/ToastContext';
import confetti from 'canvas-confetti';

let viewerAuth;
try {
  const viewerApp = getApps().find(app => app.name === 'ViewerApp') || initializeApp(firebaseConfig, 'ViewerApp');
  viewerAuth = getAuth(viewerApp);
} catch (e) {
  console.error('Secondary Auth error:', e);
  viewerAuth = fallbackAuth;
}

const CustomDropdown = ({ options, value, onChange, error, placeholder = "Choose" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <div 
        className={`input-field ${error ? 'error' : ''}`}
        style={{ 
          width: '100%', 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--bg-surface)',
          borderColor: isOpen ? 'var(--primary-500)' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 3px var(--primary-100)' : 'none',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {value || placeholder}
        </span>
        <Icon name="chevron-down" size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {isOpen && (
        <div 
          className="no-scrollbar"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            maxHeight: '250px',
            overflowY: 'auto',
            padding: 'var(--space-1) 0'
          }}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                cursor: 'pointer',
                background: value === opt ? 'var(--primary-50)' : 'transparent',
                color: value === opt ? 'var(--primary-700)' : 'var(--text-primary)',
                fontWeight: value === opt ? '500' : '400',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => {
                if (value !== opt) e.currentTarget.style.background = 'var(--gray-50)';
              }}
              onMouseLeave={(e) => {
                if (value !== opt) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function FormViewer() {
  const { formId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [questions, setQuestions] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pages = React.useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const result = [];
    let currentPage = [];
    questions.forEach(q => {
      if (q.type === 'page_break') {
        if (currentPage.length > 0) result.push(currentPage);
        currentPage = [q];
      } else {
        currentPage.push(q);
      }
    });
    if (currentPage.length > 0) result.push(currentPage);
    return result;
  }, [questions]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [showCoverScreen, setShowCoverScreen] = useState(false);
  const [viewerUser, setViewerUser] = useState(null);
  const { showToast } = useToast();
  const [signingIn, setSigningIn] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [duplicateResponse, setDuplicateResponse] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUploadStatus, setFileUploadStatus] = useState({});
  const [uploadedFileNames, setUploadedFileNames] = useState({});
  const [focusIndex, setFocusIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!viewerAuth) return;
    const unsubscribe = onAuthStateChanged(viewerAuth, async (user) => {
      if (user && user.email && !user.email.endsWith('@rguktrkv.ac.in')) {
        await signOut(viewerAuth);
        showToast('Only @rguktrkv.ac.in emails are allowed to respond.', 'error');
        setViewerUser(null);
      } else {
        setViewerUser(user);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (viewerUser && form?.settings?.privacy?.collectEmail) {
      setEmail(viewerUser.email);
    }
  }, [viewerUser, form]);

  useEffect(() => {
    const autoFillStudentData = async () => {
      if (viewerUser && viewerUser.email && viewerUser.email.endsWith('@rguktrkv.ac.in') && questions.length > 0) {
        const studentId = viewerUser.email.split('@')[0].toUpperCase();
        const student = await getStudentById(studentId);
        
        if (student) {
          setAnswers(prev => {
            const newAnswers = { ...prev };
            let hasChanges = false;
            
            questions.forEach(q => {
              const titleLower = q.title.toLowerCase();
              if (/\bid\b/i.test(q.title)) {
                if (!newAnswers[q.id]) { newAnswers[q.id] = student.id; hasChanges = true; }
              } else if (titleLower.includes('name')) {
                if (!newAnswers[q.id]) { newAnswers[q.id] = student.name; hasChanges = true; }
              } else if (titleLower.includes('branch')) {
                if (!newAnswers[q.id]) {
                  let b = student.branch;
                  if (b === 'CE') b = 'CIVIL';
                  newAnswers[q.id] = b;
                  hasChanges = true;
                }
              } else if (titleLower === 'gender' || titleLower === 'sex') {
                if (!newAnswers[q.id]) {
                  let g = student.gender;
                  if (g === 'M' || g?.toLowerCase() === 'male') g = 'Male';
                  else if (g === 'F' || g?.toLowerCase() === 'female') g = 'Female';
                  newAnswers[q.id] = g;
                  hasChanges = true;
                }
              } else if (titleLower.includes('section') || titleLower.includes('class')) {
                if (!newAnswers[q.id] && student.classSection) { newAnswers[q.id] = student.classSection; hasChanges = true; }
              } else if (titleLower.includes('email') || titleLower.includes('e-mail')) {
                if (!newAnswers[q.id] && student.email) { newAnswers[q.id] = student.email; hasChanges = true; }
              }
            });
            
            return hasChanges ? newAnswers : prev;
          });
        }
      }
    };
    
    autoFillStudentData();
  }, [viewerUser, questions]);

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      const currentForm = await getForm(formId);
      
      if (currentForm) {
        if (currentForm.settings?.theme?.fontFamily) {
          loadGoogleFont(currentForm.settings.theme.fontFamily);
        }
        if (currentForm.settings?.coverScreen?.fontFamily) {
          loadGoogleFont(currentForm.settings.coverScreen.fontFamily);
        }

        if (!currentForm.settings) {
          currentForm.settings = {
            responses: { acceptingResponses: true, closedMessage: "This form is no longer accepting responses.", limitOnePerUser: false, allowEditing: false },
            privacy: { collectEmail: false, anonymousResponses: true, showRespondentIdentity: false },
            presentation: { showProgressBar: false, shuffleQuestions: false, showSubmitAnotherResponse: true, confirmationMessage: "Your response has been recorded.", redirectUrl: "" },
            theme: { fontFamily: 'Inter' }
          };
        }
        
        if (currentForm.settings?.responses?.limitResponses && currentForm.settings?.responses?.maxResponses) {
          const max = parseInt(currentForm.settings.responses.maxResponses, 10);
          if (!isNaN(max) && max > 0) {
            const responses = await getResponses(formId);
            if (responses.length >= max) {
              currentForm.settings.responses.acceptingResponses = false;
              if (!currentForm.settings.responses.closedMessage || currentForm.settings.responses.closedMessage === "This form is no longer accepting responses.") {
                currentForm.settings.responses.closedMessage = "This form has reached the maximum number of allowed responses.";
              }
            }
          }
        }
        
        setForm(currentForm);
        
        if (currentForm.settings?.coverScreen?.enabled) {
          setShowCoverScreen(true);
        }
        
        let initialQuestions = [...currentForm.questions];
        if (currentForm.settings?.presentation?.shuffleQuestions) {
          for (let i = initialQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialQuestions[i], initialQuestions[j]] = [initialQuestions[j], initialQuestions[i]];
          }
        }
        setQuestions(initialQuestions);

        const initialAnswers = {};
        initialQuestions.forEach(q => {
          initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '';
        });
        setAnswers(initialAnswers);
      }
      setLoading(false);
    };
    
    fetchForm();
  }, [formId]);

  useEffect(() => {
    if (!form || !form.settings?.timeLimit?.enabled || submitted || isSubmitting) return;

    if (timeLeft === null) {
      setTimeLeft((form.settings.timeLimit.durationMinutes || 10) * 60);
      return;
    }

    if (timeLeft <= 0) {
      showToast("Time's up! Submitting form...", "error");
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [form, timeLeft, submitted, isSubmitting]);

  useEffect(() => {
    if (!form || !form.settings?.proctoring?.tabSwitchLimit || submitted || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          const max = form.settings.proctoring.maxTabSwitches || 3;
          if (newCount >= max) {
            showToast("Maximum tab switches exceeded. Form will auto-submit.", "error");
            handleFinalSubmit();
          } else {
            showToast(`Warning: Tab switched. (${newCount}/${max})`, "error");
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [form, submitted, isSubmitting]);

  useEffect(() => {
    if (!form || !form.settings?.proctoring?.antiPaste) return;
    const handlePaste = (e) => {
      e.preventDefault();
      showToast("Pasting is disabled for this form.", "error");
    };
    document.addEventListener("paste", handlePaste, true);
    return () => document.removeEventListener("paste", handlePaste, true);
  }, [form]);

  useEffect(() => {
    if (!form || !form.settings?.proctoring?.disableRightClick) return;
    const handleContextMenu = (e) => {
      e.preventDefault();
      showToast("Right-click is disabled for this form.", "error");
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [form]);

  useEffect(() => {
    if (!form || !form.settings?.gamification?.enableBackgroundMusic) return;
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3");
    audio.loop = true;
    audio.volume = 0.2;
    const playMusic = () => {
      audio.play().catch(e => console.log("Audio play blocked by browser"));
      document.removeEventListener('click', playMusic);
    };
    document.addEventListener('click', playMusic);
    return () => {
      audio.pause();
      document.removeEventListener('click', playMusic);
    };
  }, [form]);

  useEffect(() => {
    if (!form || !form.settings?.gamification?.cursorEffect || form.settings.gamification.cursorEffect === 'none') return;
    const handleMouseMove = (e) => {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        el.style.pointerEvents = 'none';
        el.style.zIndex = 9999;
        el.style.fontSize = '20px';
        el.innerText = form.settings.gamification.cursorEffect === 'sparkles' ? '✨' : '🫧';
        el.style.transition = 'all 1s ease-out';
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.transform = `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) scale(0)`;
            el.style.opacity = 0;
        });
        setTimeout(() => el.remove(), 1000);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [form]);

  useEffect(() => {
    if (!form || !form.settings?.geofencing?.enabled) return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const targetLat = parseFloat(form.settings.geofencing.latitude);
        const targetLon = parseFloat(form.settings.geofencing.longitude);
        const maxRadius = parseInt(form.settings.geofencing.radiusMeters, 10);
        if (isNaN(targetLat) || isNaN(targetLon)) return;

        const R = 6371e3;
        const f1 = latitude * Math.PI/180;
        const f2 = targetLat * Math.PI/180;
        const df = (targetLat-latitude) * Math.PI/180;
        const dl = (targetLon-longitude) * Math.PI/180;
        const a = Math.sin(df/2) * Math.sin(df/2) + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) * Math.sin(dl/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance > maxRadius) {
          setGeoError(`You must be within ${maxRadius}m of the required location. You are currently ${Math.round(distance)}m away.`);
        }
      },
      (error) => {
        setGeoError("Unable to retrieve your location. Please allow location access to fill out this form.");
      }
    );
  }, [form]);

  const playSound = () => {
    if (!form?.settings?.gamification?.soundEffects) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  const readAloud = (text) => {
    if (!('speechSynthesis' in window)) {
      showToast("Text-to-speech not supported in this browser.", "error");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleAnswerChange = (questionId, value, type) => {
    playSound();

    // Auto-fetch ID if it reaches 7 chars or user types a space
    const question = questions.find(q => q.id === questionId);
    if (type === 'short_answer' && question && /\bid\b/i.test(question.title)) {
      const trimmed = value.trim();
      if ((trimmed.length === 7 || value.endsWith(' ')) && !verifyingId) {
        if (trimmed.length > 0) {
          setTimeout(() => handleVerifyId(questionId, trimmed), 0);
        }
      }
    }

    if (type === 'checkboxes') {
      const currentValues = answers[questionId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setAnswers({ ...answers, [questionId]: newValues });
    } else {
      setAnswers({ ...answers, [questionId]: value.trim() === value ? value : value.trim() + (value.endsWith(' ') ? ' ' : '') });
    }
    
    if (errors[questionId]) {
      const newErrors = { ...errors };
      delete newErrors[questionId];
      setErrors(newErrors);
      if (duplicateResponse) setDuplicateResponse(null);
    }
    
    // If they clear the file or pick a new one, remove the old uploaded file name
    if (type === 'file_upload' && value instanceof File === false && !value) {
      if (uploadedFileNames[questionId]) {
        const newNames = { ...uploadedFileNames };
        delete newNames[questionId];
        setUploadedFileNames(newNames);
      }
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors['email']) {
      const newErrors = { ...errors };
      delete newErrors['email'];
      setErrors(newErrors);
    }
  };

  const handleVerifyId = async (qId, value) => {
    if (!value || !value.trim()) {
      showToast("Please enter an ID first", 'error');
      return;
    }
    setVerifyingId(qId);
    
    // Check if duplicate first
    if (form.settings?.responses?.preventDuplicateIds) {
      const allResponses = await getResponses(formId, true);
      const duplicate = allResponses.find(r => {
        const val = r.answers && r.answers[qId];
        return val && String(val).trim().toLowerCase() === String(value).trim().toLowerCase();
      });
      if (duplicate) {
        const newErrors = { ...errors };
        newErrors[qId] = 'Response already submitted.';
        setErrors(newErrors);
        setDuplicateResponse(duplicate);
        setVerifyingId(null);
        return;
      }
    }
    const student = await getStudentById(value.trim());
    setVerifyingId(null);

    if (student) {
      showToast(`Student verified: ${student.name}`);
      const newAnswers = { ...answers };
      
      if (form.settings?.privacy?.collectEmail && student.email) {
        setEmail(student.email);
        if (errors['email']) {
          const newErrors = { ...errors };
          delete newErrors['email'];
          setErrors(newErrors);
        }
      }

      questions.forEach(q => {
        if (q.id === qId) return; // don't overwrite the ID itself just in case
        
        const titleLower = q.title.toLowerCase();
        if (titleLower.includes('name')) {
          newAnswers[q.id] = student.name;
        } else if (titleLower.includes('branch')) {
          let b = student.branch;
          if (b === 'CE') b = 'CIVIL';
          newAnswers[q.id] = b;
        } else if (titleLower === 'gender' || titleLower === 'sex') {
          let g = student.gender;
          if (g === 'M' || g?.toLowerCase() === 'male') g = 'Male';
          else if (g === 'F' || g?.toLowerCase() === 'female') g = 'Female';
          newAnswers[q.id] = g;
        } else if (titleLower.includes('section') || titleLower.includes('class')) {
          newAnswers[q.id] = student.classSection;
        } else if (titleLower.includes('email') || titleLower.includes('e-mail')) {
          if (student.email) newAnswers[q.id] = student.email;
        }
      });
      setAnswers(newAnswers);
    } else {
      showToast("Student ID not found in database.", 'error');
    }
  };

  const uploadFileInline = async (qId, file) => {
    if (!file) return;
    try {
      setFileUploadStatus(prev => ({ ...prev, [qId]: { uploading: true, progress: 0 } }));
      
      let accessToken = localStorage.getItem('google_drive_token');
      if (!accessToken) {
        showToast("Please grant Google Drive access to upload your files.");
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        const result = await signInWithPopup(viewerAuth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        accessToken = credential?.accessToken;
        if (accessToken) localStorage.setItem('google_drive_token', accessToken);
      }
      
      if (!accessToken) throw new Error("Failed to get Google Drive access token.");
      
      const metadata = { name: file.name, mimeType: file.type };
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);
      
      const uploadRes = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setFileUploadStatus(prev => ({ ...prev, [qId]: { uploading: true, progress: percentComplete } }));
          }
        };
        xhr.onload = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data: JSON.parse(xhr.responseText || '{}') });
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });
      
      if (!uploadRes.ok) {
        if (uploadRes.status === 401) {
          localStorage.removeItem('google_drive_token');
          throw new Error("Your session expired. Please try again to re-authenticate.");
        }
        throw new Error(`Upload failed: ${uploadRes.data.error?.message || uploadRes.statusText}`);
      }
      
      const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadRes.data.id}/permissions`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      });
      
      if (!permRes.ok) throw new Error("Failed to set file permissions.");
      
      setUploadedFileNames(prev => ({ ...prev, [qId]: file.name }));
      handleAnswerChange(qId, uploadRes.data.webViewLink, 'file_upload');
      showToast(`Uploaded ${file.name} successfully!`, 'success');
    } catch (error) {
      console.error("Upload error:", error);
      showToast(error.message, 'error');
    } finally {
      setFileUploadStatus(prev => ({ ...prev, [qId]: { uploading: false, progress: 0 } }));
    }
  };

  const handleNextPage = () => {
    const newErrors = {};
    let isValid = true;
    
    if (currentPageIndex === 0 && form.settings?.privacy?.collectEmail) {
      if (!email.trim()) {
        newErrors['email'] = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors['email'] = 'Must be a valid email address';
        isValid = false;
      }
    }

    const currentQuestions = pages[currentPageIndex] || [];
    currentQuestions.forEach(q => {
      if (q.required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[q.id] = 'This is a required question';
          isValid = false;
        }
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorId === 'email' ? 'email-input-card' : `question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setErrors({});
    setCurrentPageIndex(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let isValid = true;
    
    if (form.settings?.privacy?.collectEmail) {
      if (!email.trim()) {
        newErrors['email'] = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors['email'] = 'Must be a valid email address';
        isValid = false;
      }
    }

    const currentQuestions = pages[currentPageIndex] || [];
    currentQuestions.forEach(q => {
      if (q.required) {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[q.id] = 'This is a required question';
          isValid = false;
        }
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorId === 'email' ? 'email-input-card' : `question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (form.settings?.responses?.preventDuplicateIds) {
      const idQuestion = questions.find(q => /\bid\b/i.test(q.title));
      if (idQuestion) {
        const idAnswer = answers[idQuestion.id];
        if (idAnswer && String(idAnswer).trim()) {
          const allResponses = await getResponses(formId, true);
          const duplicate = allResponses.find(r => {
            const val = r.answers && r.answers[idQuestion.id];
            return val && String(val).trim().toLowerCase() === String(idAnswer).trim().toLowerCase();
          });
          
          if (duplicate) {
            newErrors[idQuestion.id] = 'Response already submitted.';
            setErrors(newErrors);
            setDuplicateResponse(duplicate);
            setTimeout(() => {
              const element = document.getElementById(`question-${idQuestion.id}`);
              if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
          }
        }
      }
    }

    setShowConfirmation(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (!isConfirmed) {
      showToast("Please confirm that all data provided is correct.", 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const filesToUpload = [];
      const updatedAnswers = { ...answers };
      
      Object.keys(answers).forEach(qId => {
        if (answers[qId] instanceof File) {
          filesToUpload.push({ qId, file: answers[qId] });
        }
      });
      
      if (filesToUpload.length > 0) {
        let accessToken = localStorage.getItem('google_drive_token');
        
        if (!accessToken) {
          showToast("Please grant Google Drive access to upload your files.");
          const provider = new GoogleAuthProvider();
          provider.addScope('https://www.googleapis.com/auth/drive.file');
          
          const result = await signInWithPopup(viewerAuth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          accessToken = credential?.accessToken;
          if (accessToken) localStorage.setItem('google_drive_token', accessToken);
        }
        
        if (!accessToken) {
          throw new Error("Failed to get Google Drive access token.");
        }
        
        for (const { qId, file } of filesToUpload) {
          showToast(`Uploading ${file.name}...`);
          
          const metadata = { name: file.name, mimeType: file.type };
          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', file);
          
          setUploadProgress(1);
          const uploadRes = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ ok: true, data: JSON.parse(xhr.responseText) });
              } else {
                resolve({ ok: false, status: xhr.status, statusText: xhr.statusText, data: JSON.parse(xhr.responseText || '{}') });
              }
            };
            
            xhr.onerror = () => reject(new Error("Network Error"));
            xhr.send(formData);
          });
          
          if (!uploadRes.ok) {
            if (uploadRes.status === 401) {
              localStorage.removeItem('google_drive_token');
              throw new Error("Your session expired. Please submit again to re-authenticate.");
            }
            throw new Error(`Upload failed: ${uploadRes.data.error?.message || uploadRes.statusText}`);
          }
          const fileData = uploadRes.data;
          setUploadProgress(100);
          
          const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
          });
          
          if (!permRes.ok) {
            if (permRes.status === 401) {
              localStorage.removeItem('google_drive_token');
              throw new Error("Your session expired. Please submit again to re-authenticate.");
            }
            const errData = await permRes.json().catch(() => ({}));
            throw new Error(`Permissions update failed: ${errData.error?.message || permRes.statusText}`);
          }
          
          updatedAnswers[qId] = fileData.webViewLink;
        }
      }

      let webcamImage = null;
      if (form.settings?.proctoring?.requireWebcamSnapshot) {
          try {
              showToast("Capturing identity verification snapshot...", "info");
              webcamImage = await new Promise((resolve, reject) => {
                  navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                      const video = document.createElement('video');
                      video.srcObject = stream;
                      video.play();
                      video.onloadedmetadata = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        stream.getTracks().forEach(track => track.stop());
                        resolve(dataUrl);
                      };
                    })
                    .catch(reject);
              });
          } catch(e) {
              showToast("Failed to access webcam. This form requires a webcam snapshot to submit.", 'error');
              setIsSubmitting(false);
              return;
          }
      }

      const responseData = {
        answers: updatedAnswers,
        ...(form.settings?.privacy?.collectEmail ? { email } : {}),
        ...(webcamImage ? { proctoringSnapshot: webcamImage } : {})
      };
      await saveResponse(formId, responseData);
      setSubmitted(true);
      setShowConfirmation(false);
      
      if (form.settings?.gamification?.enableConfetti) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      if (form.settings?.presentation?.redirectUrl) {
        window.location.href = form.settings.presentation.redirectUrl;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast(`There was an error submitting your form or uploading files: ${error.message || error}. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      const result = await signInWithPopup(viewerAuth, provider);
      
      if (result.user && result.user.email && !result.user.email.endsWith('@rguktrkv.ac.in')) {
        await signOut(viewerAuth);
        showToast('Only @rguktrkv.ac.in emails are allowed to respond.', 'error');
        return;
      }
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_drive_token', credential.accessToken);
      }
    } catch (error) {
      console.error("Google login failed:", error);
      showToast('Failed to sign in. Please try again.', 'error');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      setIsSwitchingAccount(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signOut(viewerAuth);
      const result = await signInWithPopup(viewerAuth, provider);
      
      if (result.user && result.user.email && !result.user.email.endsWith('@rguktrkv.ac.in')) {
        await signOut(viewerAuth);
        showToast('Only @rguktrkv.ac.in emails are allowed to respond.', 'error');
        return;
      }
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_drive_token', credential.accessToken);
      }
      showToast('Account switched successfully.');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Error switching account:", error);
        showToast("Failed to switch account.", 'error');
      }
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}><Loader /></div>;
  if (!form) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Form not found</div>;
  if (isSwitchingAccount) return <div className="container flex-center" style={{ minHeight: '50vh' }}><Loader /></div>;

  if (geoError) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ padding: 'var(--space-4)', maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ padding: 'var(--space-12) var(--space-8)', borderTop: '8px solid var(--error-500)', textAlign: 'center', width: '100%' }}>
          <Icon name="location" size={48} color="var(--error-500)" />
          <h2 style={{ fontSize: 'var(--text-2xl)', margin: 'var(--space-4) 0', color: 'var(--text-primary)' }}>Location Verification Failed</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--error-600)' }}>{geoError}</p>
        </div>
      </div>
    );
  }

  if (!viewerUser) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ padding: 'var(--space-4)', maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ padding: 'var(--space-12) var(--space-8)', borderTop: '8px solid var(--primary-500)', textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
             <img src="/logo.png" alt="RGUKT FORMS Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>{form.title}</h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
            Sign in with your Google account to view and respond to this form.
          </p>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleGoogleLogin}
            disabled={signingIn}
            style={{ padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-base)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)', margin: '0 auto' }}
          >
            {signingIn ? (
              <>
                <Icon name="loader" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const currentFont = form.settings?.theme?.fontFamily || 'Inter';
  const containerStyle = {
    '--font-body': `"${currentFont}", sans-serif`,
    '--font-heading': `"${currentFont}", sans-serif`,
    fontFamily: 'var(--font-body)',
    ...(form.settings?.theme?.color ? { '--primary-500': form.settings.theme.color } : {}),
    ...(form.settings?.theme?.textColor ? { '--text-primary': form.settings.theme.textColor, color: form.settings.theme.textColor } : {})
  };

  let isAccepting = form.settings?.responses?.acceptingResponses !== false;
  if (isAccepting && form.settings?.responses?.limitResponses && form.settings?.responses?.expirationDate) {
    const expirationDate = new Date(form.settings.responses.expirationDate);
    if (new Date() > expirationDate) {
      isAccepting = false;
    }
  }

  if (!isAccepting) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-4)', maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card" style={{ padding: 'var(--space-12) var(--space-8)', borderTop: '8px solid var(--error-500)', textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ width: '80px', height: '80px' }}
            >
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="var(--error-100)"/>
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  d="M35 35L65 65M65 35L35 65" 
                  stroke="var(--error-500)" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
              </svg>
            </motion.div>
          </div>
          <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>{form.title}</h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
            {form.settings?.responses?.closedMessage || "This form is no longer accepting responses."}
          </p>
        </div>
      </div>
    );
  }

  if (showCoverScreen) {
    const coverSettings = form.settings?.coverScreen || {};
    const animationType = coverSettings.animation || 'fade-up';
    const bgColor = coverSettings.backgroundColor || '#ffffff';
    const txtColor = coverSettings.textColor || '#1f2937';
    const btnColor = coverSettings.buttonColor || '#3b82f6';
    const fontFam = coverSettings.fontFamily || 'Inter';

    let animProps = {
      initial: { opacity: 0, y: 30, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.6, ease: "easeOut" }
    };
    if (animationType === 'zoom-in') {
      animProps = {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: "easeOut" }
      };
    } else if (animationType === 'bounce') {
      animProps = {
        initial: { opacity: 0, y: -50 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 300, damping: 15 }
      };
    }

    return (
      <div className="form-viewer-container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', backgroundColor: bgColor, fontFamily: `"${fontFam}", sans-serif` }}>
        <motion.div 
          className="card" 
          {...animProps}
          style={{ padding: 'var(--space-12) var(--space-8)', textAlign: 'center', maxWidth: '600px', width: '100%', backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            style={{ width: '80px', height: '80px', margin: '0 auto var(--space-6)', backgroundColor: `${btnColor}20`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: btnColor }}
          >
            <Icon name={coverSettings.icon || 'form'} size={40} />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)', color: txtColor, fontWeight: 'bold' }}
          >
            {coverSettings.title || form.title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            style={{ fontSize: 'var(--text-lg)', color: txtColor, opacity: 0.8, marginBottom: 'var(--space-10)', lineHeight: '1.6' }}
          >
            {coverSettings.description || form.description}
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            onClick={() => setShowCoverScreen(false)}
            style={{ padding: 'var(--space-4) var(--space-10)', fontSize: 'var(--text-xl)', borderRadius: 'var(--radius-full)', backgroundColor: btnColor, color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: '600', boxShadow: `0 4px 14px 0 ${btnColor}40` }}
          >
            {coverSettings.buttonText || 'Start'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (isSubmitting || submitted) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-10) var(--space-4) var(--space-10) var(--space-4)', maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', borderTop: `8px solid ${submitted ? 'var(--primary-500)' : 'var(--primary-300)'}`, transition: 'border-color var(--transition-slow)' }}>
          
          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            {isSubmitting ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ position: 'relative', width: '80px', height: '80px' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ 
                    position: 'absolute', inset: 0,
                    borderRadius: '50%', 
                    border: '6px solid var(--primary-100)', 
                    borderTopColor: 'var(--primary-500)'
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{ width: '80px', height: '80px' }}
              >
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="50" fill="#d1fae5"/>
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                    d="M30 50L45 65L70 35" 
                    stroke="#10b981" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </div>

          <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>
            {isSubmitting ? 'Submitting...' : form.title}
          </h2>
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>
            {isSubmitting ? 'Please wait while we record your response.' : (form.settings?.presentation?.confirmationMessage || "Your response has been recorded.")}
          </p>

              {submitted && !form.settings?.responses?.limitOnePerUser && form.settings?.presentation?.showSubmitAnotherResponse !== false && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="btn btn-secondary" 
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                const initialAnswers = {};
                questions.forEach(q => initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '');
                setAnswers(initialAnswers);
                setUploadedFileNames({});
                setIsConfirmed(false);
              }} 
              style={{ marginTop: 'var(--space-8)' }}
            >
              Submit another response
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-4) var(--space-4) var(--space-16) var(--space-4)', maxWidth: '768px', margin: '0 auto' }}>
        <div className="card" style={{ borderTop: '8px solid var(--primary-500)', marginBottom: 'var(--space-4)' }}>
          <div className="card-body">
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>Review your responses</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Please verify the information below before submitting.</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {form.settings?.privacy?.collectEmail && (
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Email</div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', wordBreak: 'break-word' }}>{email}</div>
              </div>
            )}
            {questions.map(q => {
              const answer = answers[q.id];
              let displayAnswer = answer;
              if (answer instanceof File) {
                displayAnswer = answer.name;
              } else if (q.type === 'file_upload' && uploadedFileNames[q.id]) {
                displayAnswer = uploadedFileNames[q.id];
              } else if (Array.isArray(answer)) {
                displayAnswer = answer.join(', ');
              } else if (answer === undefined || answer === null || answer === '') {
                displayAnswer = <span style={{ color: 'var(--gray-400)' }}>-</span>;
              }
              
              return (
                <div key={q.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>{q.title}</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', wordBreak: 'break-word' }}>{displayAnswer}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            marginBottom: 'var(--space-6)', 
            backgroundColor: isConfirmed ? 'var(--success-50)' : 'var(--gray-50)',
            border: isConfirmed ? '1px solid var(--success-200)' : '1px dashed var(--gray-300)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--success-600)', cursor: 'pointer', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)', color: isConfirmed ? 'var(--success-700)' : 'var(--text-primary)' }}>
                  Confirm Submission
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: isConfirmed ? 'var(--success-600)' : 'var(--text-secondary)' }}>
                  I confirm that the data provided above is correct.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex-between">
          <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>
            Edit Responses
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleFinalSubmit} 
            disabled={!isConfirmed || isSubmitting} 
            style={{ opacity: (!isConfirmed || isSubmitting) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            {isSubmitting && <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {isSubmitting 
              ? (uploadProgress > 0 && uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Submitting...') 
              : 'Confirm Submit'}
          </button>
        </div>
      </div>
    );
  }

  let progress = 0;
  if (form.settings?.presentation?.showProgressBar && questions.length > 0) {
    if (pages.length > 1) {
      progress = Math.round(((currentPageIndex + 1) / pages.length) * 100);
    } else {
      const answeredCount = questions.filter(q => {
        const a = answers[q.id];
        return a && (Array.isArray(a) ? a.length > 0 : String(a).trim().length > 0);
      }).length;
      progress = Math.round((answeredCount / questions.length) * 100);
    }
  }

  return (
    <div className="form-viewer-container animate-fade-in" style={{ ...containerStyle, padding: 'var(--space-4) var(--space-4) var(--space-16) var(--space-4)', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {form.settings?.timeLimit?.enabled && timeLeft !== null && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--error-500)', color: 'white', padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'bold', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          Time Remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      )}
      {form.settings?.presentation?.showProgressBar && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--bg-app)', padding: 'var(--space-4) 0', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>Page {currentPageIndex + 1} of {pages.length}</span>
            <span>{progress}% Completed</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-500)', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      )}

      <div className="card" style={{ borderTop: '8px solid var(--primary-500)', marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-2)' }}>{form.title}</h1>
          {form.description && <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>{form.description}</p>}
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', fontSize: 'var(--text-sm)', color: 'var(--error-500)' }}>
            * Indicates required question
          </div>
        </div>
      </div>

      {viewerUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 'var(--text-sm)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
          </svg>
          
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: '1.4' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Signed in as</span>
            <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              {viewerUser.email}
            </strong>
          </div>
          
          <button type="button" onClick={handleSwitchAccount} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', flexShrink: 0 }}>
            Switch account
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="questions-grid">
        {/* Email Collection Card */}
        {form.settings?.privacy?.collectEmail && currentPageIndex === 0 && (
          <div id="email-input-card" className="card" style={{ border: errors['email'] ? '1px solid var(--error-500)' : '1px solid var(--border-color)' }}>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>
                Email <span style={{ color: 'var(--error-500)' }}>*</span>
              </div>
              <input
                type="email"
                className={`input-field ${errors['email'] ? 'error' : ''}`}
                style={{ width: '100%', maxWidth: '300px' }}
                placeholder="Your email"
                value={email}
                onChange={handleEmailChange}
              />
              {errors['email'] && (
                <div className="error-text" style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {errors['email']}
                </div>
              )}
            </div>
          </div>
        )}

        {(pages[currentPageIndex] || []).map((q, index) => {
          if (form.settings?.presentation?.focusMode && index !== focusIndex) return null;
          return (
          <motion.div
            key={q.id}
            id={`question-${q.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
            style={{ 
              border: errors[q.id] ? '1px solid var(--error-500)' : '1px solid var(--border-color)'
            }}
          >
            <div className="card-body">
              {['title_block', 'section_block', 'page_break'].includes(q.type) ? (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: ['section_block', 'page_break'].includes(q.type) ? 'var(--text-2xl)' : 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: q.description ? 'var(--space-2)' : 0 }}>
                    {q.title}
                  </div>
                  {q.description && (
                    <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {q.description}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>{q.title} {q.required && <span style={{ color: 'var(--error-500)' }}>*</span>}</div>
                  {form.settings?.accessibility?.enableVoiceRead && (
                    <button type="button" onClick={() => readAloud(q.title)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary-500)', flexShrink: 0 }} title="Read question aloud">
                      <Icon name="volume_up" size={24} />
                    </button>
                  )}
                </div>
              )}
              
              <div>
                {q.type === 'image_block' && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                    {q.imageUrl && <img src={q.imageUrl} alt={q.title || 'Image'} style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)' }} onError={(e) => e.target.style.display = 'none'} />}
                  </div>
                )}
                {q.type === 'video_block' && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
                    {q.videoUrl && (
                      <iframe 
                        width="100%" 
                        height="400" 
                        src={q.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                        title={q.title || 'Video preview'} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        style={{ maxWidth: '700px', borderRadius: 'var(--radius-md)' }}
                      ></iframe>
                    )}
                  </div>
                )}
                {q.type === 'short_answer' && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                      <input
                        type="text"
                        className={`input-field ${errors[q.id] ? 'error' : ''}`}
                        style={{ width: '100%' }}
                        placeholder="Your answer"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                        onPaste={(e) => { if(form.settings?.proctoring?.antiPaste) { e.preventDefault(); showToast("Pasting is disabled for this form.", "error"); } }}
                      />
                      {/\bid\b/i.test(q.title) && verifyingId === q.id && (
                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                          <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-500)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {q.type === 'paragraph' && (
                  <textarea
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                    placeholder="Your answer"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                    onPaste={(e) => { if(form.settings?.proctoring?.antiPaste) { e.preventDefault(); showToast("Pasting is disabled for this form.", "error"); } }}
                  />
                )}
                
                {q.type === 'multiple_choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} className="hover-bg">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: 'var(--text-base)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {q.type === 'checkboxes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {q.options.map((opt, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} className="hover-bg">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={(answers[q.id] || []).includes(opt)}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)' }}
                        />
                        <span style={{ fontSize: 'var(--text-base)' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'dropdown' && (
                  <CustomDropdown 
                    options={[...q.options].map(opt => opt === 'CE' ? 'CIVIL' : opt).sort((a, b) => String(a).localeCompare(String(b)))}
                    value={answers[q.id] || ''}
                    onChange={(val) => handleAnswerChange(q.id, val, q.type)}
                    error={errors[q.id]}
                  />
                )}

                {q.type === 'file_upload' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
                    <label style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      border: '2px dashed var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      backgroundColor: 'var(--gray-50)',
                      width: '100%',
                      maxWidth: '300px',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }} className="hover-border-primary">
                      <Icon name="file_upload" size={20} color="var(--primary-500)" />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {answers[q.id] ? (answers[q.id].name || uploadedFileNames[q.id] || (typeof answers[q.id] === 'string' && answers[q.id].startsWith('http') ? 'File Uploaded' : answers[q.id])) : 'Click to upload a file'}
                      </span>
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => handleAnswerChange(q.id, e.target.files[0] || '', q.type)}
                      />
                    </label>
                    
                    {answers[q.id] instanceof File && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => uploadFileInline(q.id, answers[q.id])}
                        disabled={fileUploadStatus[q.id]?.uploading}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                      >
                        {fileUploadStatus[q.id]?.uploading ? (
                          <>
                            <Icon name="loader" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Uploading... {fileUploadStatus[q.id].progress}%
                          </>
                        ) : (
                          'Upload Now'
                        )}
                      </button>
                    )}
                    
                    {typeof answers[q.id] === 'string' && answers[q.id].startsWith('http') && (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                        <Icon name="check" size={16} /> {uploadedFileNames[q.id] ? `${uploadedFileNames[q.id]} uploaded` : 'Uploaded successfully'}
                      </span>
                    )}
                  </div>
                )}
                
                {q.type === 'linear_scale' && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0', overflowX: 'auto' }}>
                    <table style={{ borderSpacing: '0', borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr>
                          {[1, 2, 3, 4, 5].map(num => (
                            <td key={`th-${num}`} style={{ padding: '0 var(--space-3)', fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)', paddingBottom: 'var(--space-3)' }}>
                              {num}
                            </td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {[1, 2, 3, 4, 5].map(num => (
                            <td key={`td-${num}`} style={{ padding: '0 var(--space-3)' }}>
                              <label style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: '4px', borderRadius: '50%' }} className="hover-bg">
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={num.toString()}
                                  checked={answers[q.id] === num.toString()}
                                  onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)', cursor: 'pointer', margin: 0 }}
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {q.type === 'date' && (
                  <input
                    type="date"
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', maxWidth: '200px' }}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                  />
                )}
                
                {q.type === 'time' && (
                  <input
                    type="time"
                    className={`input-field ${errors[q.id] ? 'error' : ''}`}
                    style={{ width: '100%', maxWidth: '200px' }}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                  />
                )}
              </div>
              
              {errors[q.id] && (
                <div className="error-text" style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span style={{ flex: 1 }}>{errors[q.id]}</span>
                  {duplicateResponse && errors[q.id] === 'Response already submitted.' && (
                    <button 
                      type="button"
                      onClick={() => setShowDuplicateModal(true)} 
                      className="btn" 
                      style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', border: '1px solid currentColor', backgroundColor: 'transparent', color: 'inherit', flexShrink: 0 }}
                    >
                      View
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )})}
        </div>

        {form.settings?.presentation?.focusMode && questions.length > 1 && (
          <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { setFocusIndex(prev => Math.max(0, prev - 1)); window.scrollTo(0,0); }}
              disabled={focusIndex === 0}
            >Previous</button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => { setFocusIndex(prev => Math.min(questions.length - 1, prev + 1)); window.scrollTo(0,0); }}
              disabled={focusIndex === questions.length - 1}
            >Next</button>
          </div>
        )}

        <div className="flex-between" style={{ marginTop: 'var(--space-8)' }}>
          <div>
            <button type="button" className="btn btn-ghost" onClick={() => setShowClearConfirm(true)}>
              Clear form
            </button>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            {currentPageIndex > 0 && (
              <button type="button" className="btn btn-secondary" onClick={handlePrevPage}>
                Back
              </button>
            )}
            {currentPageIndex < pages.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={handleNextPage} style={{ padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-base)' }}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-base)' }}>
                Submit
              </button>
            )}
          </div>
        </div>
      </form>

      {showClearConfirm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-6)', maxWidth: '400px', width: '90%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--text-primary)' }}>
              <Icon name="delete" size={24} />
              <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Clear all answers?</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              This will remove all answers from all questions, and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--gray-100)', color: 'var(--text-primary)', border: 'none' }} 
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                onClick={() => {
                  const initialAnswers = {};
                  questions.forEach(q => initialAnswers[q.id] = q.type === 'checkboxes' ? [] : '');
                  setAnswers(initialAnswers);
                  if (form?.settings?.privacy?.collectEmail && !viewerUser) {
                    setEmail('');
                  }
                  setErrors({});
                  setShowClearConfirm(false);
                  showToast('Form cleared');
                }}
              >
                Clear form
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDuplicateModal && duplicateResponse && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)', padding: 'var(--space-4)' }}>
          <div className="card animate-fade-in" style={{ padding: 'var(--space-6)', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', margin: 0, color: 'var(--text-primary)' }}>Previously Submitted Response</h3>
              <button type="button" className="btn-icon" onClick={() => setShowDuplicateModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {duplicateResponse.email && (
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Email</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>{duplicateResponse.email}</div>
                </div>
              )}
              {questions.map(q => {
                const answer = duplicateResponse.answers[q.id];
                if (answer === undefined || answer === null || answer === '') return null;
                return (
                  <div key={q.id}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{q.title}</div>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>
                      {Array.isArray(answer) ? answer.join(', ') : answer}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDuplicateModal(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .hover-bg:hover { background-color: var(--gray-50); }
      `}</style>
    </div>
  );
}

export default FormViewer;
