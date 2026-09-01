import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard';
import FormEditor from './components/FormEditor';
import FormViewer from './components/FormViewer';
import Analytics from './components/Analytics';
import MyForms from './components/MyForms';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/edit/:formId" element={<Layout><FormEditor /></Layout>} />
        <Route path="/view/:formId" element={<FormViewer />} />
        <Route path="/forms" element={<Layout><MyForms /></Layout>} />
        <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
        <Route path="*" element={<Layout><Dashboard /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
