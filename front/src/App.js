import './App.css';

import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './auth/AuthContext';

import AssignmentPage from './pages/AssignmentPage';
import ChatPage from './pages/ChatPage';
import DisciplinesPage from './pages/DisciplinesPage';
import HomePage from './pages/HomePage';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ScheduleFullPage from './pages/ScheduleFullPage';
import SchedulePage from './pages/SchedulePage';
import TopicPage from './pages/TopicPage';

function RequireTeacher({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'teacher') return <Navigate to="/disciplines" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/journal" element={<RequireTeacher><JournalPage /></RequireTeacher>} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/schedule/full" element={<ScheduleFullPage />} />
          <Route path="/disciplines" element={<DisciplinesPage />} />
          <Route path="/topics/:topicId" element={<TopicPage />} />
          <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
