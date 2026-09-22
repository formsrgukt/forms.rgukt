import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FORMS_COLLECTION = 'forms';
const RESPONSES_COLLECTION = 'responses';
const USERS_COLLECTION = 'users';

// In-memory cache for lightning-fast loads
let formsCache = null;
let responsesCache = null;

export const clearCache = () => {
  formsCache = null;
  responsesCache = null;
};

export const getForms = async (userId = null, forceRefresh = false) => {
  if (formsCache && !forceRefresh) {
    return userId ? formsCache.filter(f => f.userId === userId) : formsCache;
  }
  try {
    const q = query(collection(db, FORMS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    formsCache = querySnapshot.docs.map(doc => doc.data());
    return userId ? formsCache.filter(f => f.userId === userId) : formsCache;
  } catch (error) {
    console.error("Error getting forms: ", error);
    return [];
  }
};

export const getForm = async (id) => {
  try {
    const docRef = doc(db, FORMS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No such form!");
      return null;
    }
  } catch (error) {
    console.error("Error getting form: ", error);
    return null;
  }
};

export const saveForm = async (form) => {
  try {
    const formToSave = {
      ...form,
      updatedAt: form.updatedAt || Date.now(), // Fallback to timestamp if not provided by app
    };
    await setDoc(doc(db, FORMS_COLLECTION, form.id), formToSave);
    
    // Update cache
    if (formsCache) {
      const index = formsCache.findIndex(f => f.id === form.id);
      if (index >= 0) {
        formsCache[index] = formToSave;
      } else {
        formsCache.unshift(formToSave);
      }
    }
    
    return formToSave;
  } catch (error) {
    console.error("Error saving form: ", error);
    throw error;
  }
};

export const deleteForm = async (id) => {
  try {
    await deleteDoc(doc(db, FORMS_COLLECTION, id));
    
    // Update cache
    if (formsCache) {
      formsCache = formsCache.filter(f => f.id !== id);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting form: ", error);
    throw error;
  }
};

export const saveResponse = async (formId, response) => {
  try {
    const responseToSave = {
      formId,
      answers: response.answers || response, // handle format gracefully
      email: response.email || null,
      submittedAt: Date.now(),
    };
    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), responseToSave);
    const newResponse = { id: docRef.id, ...responseToSave };
    
    if (responsesCache) {
      responsesCache.unshift(newResponse);
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving response: ", error);
    throw error;
  }
};

export const deleteResponse = async (id) => {
  try {
    await deleteDoc(doc(db, RESPONSES_COLLECTION, id));
    
    if (responsesCache) {
      responsesCache = responsesCache.filter(r => r.id !== id);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting response: ", error);
    throw error;
  }
};

export const getResponses = async (formId, forceRefresh = false) => {
  try {
    const all = await getAllResponses(forceRefresh);
    const filteredResponses = all.filter(r => r.formId === formId);
    return filteredResponses.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (error) {
    console.error("Error getting responses: ", error);
    return [];
  }
};

export const getAllResponses = async (forceRefresh = false) => {
  if (responsesCache && !forceRefresh) return responsesCache;
  try {
    const q = query(collection(db, RESPONSES_COLLECTION), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    responsesCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return responsesCache;
  } catch (error) {
    console.error("Error getting all responses: ", error);
    return [];
  }
};

export const subscribeToResponses = (formId, callback) => {
  const q = query(collection(db, RESPONSES_COLLECTION), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const allResponses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    responsesCache = allResponses;
    const filtered = allResponses.filter(r => r.formId === formId);
    callback(filtered);
  }, (error) => {
    console.error("Error subscribing to responses: ", error);
  });
};

export const getStudentById = async (studentId) => {
  if (!studentId) return null;
  try {
    const docRef = doc(db, 'students', studentId.trim().toUpperCase());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const saveUserProfile = async (uid, profileData) => {
  if (!uid) return null;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(docRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const deleteUserAccountAndData = async (uid, onProgress) => {
  if (!uid) return;
  try {
    if (onProgress) onProgress('Gathering data...');
    // 1. Delete all forms created by this user
    const q = query(collection(db, FORMS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const formsToDelete = querySnapshot.docs.filter(doc => doc.data().userId === uid);
    
    if (onProgress) onProgress(`Deleting ${formsToDelete.length} form(s)...`);
    // We run the deletions in parallel
    await Promise.all(formsToDelete.map(formDoc => deleteDoc(doc(db, FORMS_COLLECTION, formDoc.id))));
    
    if (onProgress) onProgress('Removing user profile...');
    // 2. Delete the user profile
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
    
    // Note: We don't delete responses here as it would require querying all responses 
    // for all deleted forms. For now, wiping the forms and user record is sufficient 
    // for standard account deletion.
    
    return true;
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};
