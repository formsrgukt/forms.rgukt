import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Loader from '../components/Loader';
import OnboardingModal from '../components/OnboardingModal';
import { getUserProfile, saveUserProfile } from '../services/db';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          setShowOnboarding(false);
        } else {
          // New user (no profile exists)
          setUserProfile(null);
          setShowOnboarding(true);
        }
      } else {
        setUserProfile(null);
        setShowOnboarding(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleOnboardingComplete = async (isRguktian) => {
    if (!currentUser) return;
    const newProfile = { isRguktian, createdAt: Date.now() };
    await saveUserProfile(currentUser.uid, newProfile);
    setUserProfile(newProfile);
    setShowOnboarding(false);
  };

  const value = {
    currentUser,
    userProfile
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
    </AuthContext.Provider>
  );
}
