import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import HomePage from './pages/Homepage';
import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { EnhancedOnboarding } from './components/EnhancedOnboarding';
import Profile from './pages/Profile';
import Dashboard from './pages/DashBoard';
import Workouts from './pages/Workouts';
import Habits from './pages/Habits';
import Progress from './pages/Progress';
import Social from './pages/Social';
import GroupDetail from './pages/GroupDetail';
import ActiveWorkout from './pages/ActiveWorkout';
import Templates from './pages/Templates';
import ExerciseBank from './pages/ExerciseBank';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<PrivateRoute><EnhancedOnboarding /></PrivateRoute>} />
      <Route path="/onboarding-basic" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

      {/* Core protected routes (5 nav items + profile + active workout) */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/train" element={<PrivateRoute><Workouts /></PrivateRoute>} />
      <Route path="/active-workout" element={<PrivateRoute><ActiveWorkout /></PrivateRoute>} />
      <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
      <Route path="/exercises" element={<PrivateRoute><ExerciseBank /></PrivateRoute>} />
      <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
      <Route path="/habits" element={<PrivateRoute><Habits /></PrivateRoute>} />
      <Route path="/community" element={<PrivateRoute><Social /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />

      {/* Redirects: old routes → new structure */}
      <Route path="/workouts" element={<Navigate to="/train" replace />} />
      <Route path="/analytics" element={<Navigate to="/progress" replace />} />
      <Route path="/body-tracking" element={<Navigate to="/profile" replace />} />
      <Route path="/goals" element={<Navigate to="/habits" replace />} />
      <Route path="/social" element={<Navigate to="/community" replace />} />
      <Route path="/messages" element={<Navigate to="/community" replace />} />
      <Route path="/groups" element={<Navigate to="/community" replace />} />
      <Route path="/progress-photos" element={<Navigate to="/progress" replace />} />
      <Route path="/achievements" element={<Navigate to="/profile" replace />} />
      <Route path="/schedule" element={<Navigate to="/dashboard" replace />} />
      <Route path="/cardio" element={<Navigate to="/active-workout" replace />} />
      <Route path="/programs" element={<Navigate to="/train" replace />} />
      <Route path="/workout-templates" element={<Navigate to="/train" replace />} />
      <Route path="/challenges" element={<Navigate to="/community" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
