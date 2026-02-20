import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Homepage';
import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Dashboard from './pages/DashBoard';
import Workouts from './pages/Workouts';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import ProgressPhotos from './pages/ProgressPhotos';
import Social from './pages/Social';
import WorkoutTemplates from './pages/WorkoutTemplates';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Protected routes (after login) */}
      
      
      <Route path="/profile" element={<Profile />} />
      <Route path="/workouts" element={<Workouts />} />
      <Route path="/habits" element={<Habits />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/progress-photos" element={<ProgressPhotos />} />
      <Route path="/social" element={<Social />} />
      <Route path="/workout-templates" element={<WorkoutTemplates />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;