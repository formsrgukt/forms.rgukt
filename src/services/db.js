import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const FORMS_COLLECTION = 'forms';
const RESPONSES_COLLECTION = 'responses';

export const getForms = async () => {
  try {
    const q = query(collection(db, FORMS_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
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
    return formToSave;
  } catch (error) {
    console.error("Error saving form: ", error);
    throw error;
  }
};

export const deleteForm = async (id) => {
  try {
    await deleteDoc(doc(db, FORMS_COLLECTION, id));
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
    return docRef.id;
  } catch (error) {
    console.error("Error saving response: ", error);
    throw error;
  }
};

export const getResponses = async (formId) => {
  try {
    const q = query(collection(db, RESPONSES_COLLECTION));
    const querySnapshot = await getDocs(q);
    const allResponses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filteredResponses = allResponses.filter(r => r.formId === formId);
    return filteredResponses.sort((a, b) => b.submittedAt - a.submittedAt);
  } catch (error) {
    console.error("Error getting responses: ", error);
    return [];
  }
};
