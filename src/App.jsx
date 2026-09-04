import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormViewer from './components/FormViewer';
import Analytics from './components/Analytics';
import MyForms from './components/MyForms';
import Login from './components/Login';
import Templates from './components/Templates';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/edit/:formId" element={<ProtectedRoute><Layout><FormEditor /></Layout></ProtectedRoute>} />
            <Route path="/view/:formId" element={<FormViewer />} />
            <Route path="/forms" element={<ProtectedRoute><Layout><MyForms /></Layout></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Layout><Templates /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
