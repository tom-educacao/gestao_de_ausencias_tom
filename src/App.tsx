import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AbsenceProvider } from './context/AbsenceContext';
import Dashboard from './pages/Dashboard';
import RegisterAbsence from './pages/RegisterAbsence';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterTeacher from './pages/RegisterTeacher';
import RegisterSubstitute from './pages/RegisterSubstitute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AbsenceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register-absence" element={<Register />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegisterAbsence />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/teacher" element={<RegisterTeacher />} />
            <Route path="/substitute" element={<RegisterSubstitute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AbsenceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;