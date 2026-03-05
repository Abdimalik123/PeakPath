import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
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
import Challenges from './pages/Challenges';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Messages from './pages/Messages';
import Programs from './pages/Programs';
import CardioLogger from './pages/CardioLogger';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Protected routes (after login) */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
      <Route path="/habits" element={<PrivateRoute><Habits /></PrivateRoute>} />
      <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
      <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/progress-photos" element={<PrivateRoute><ProgressPhotos /></PrivateRoute>} />
      <Route path="/social" element={<PrivateRoute><Social /></PrivateRoute>} />
      <Route path="/workout-templates" element={<PrivateRoute><WorkoutTemplates /></PrivateRoute>} />
      <Route path="/challenges" element={<PrivateRoute><Challenges /></PrivateRoute>} />
      <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
      <Route path="/groups/:groupId" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/programs" element={<PrivateRoute><Programs /></PrivateRoute>} />
      <Route path="/cardio" element={<PrivateRoute><CardioLogger /></PrivateRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;