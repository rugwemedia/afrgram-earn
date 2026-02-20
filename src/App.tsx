import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Notifications } from './pages/Notifications';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminPanel } from './pages/AdminPanel';
import { useAuth } from './context/AuthContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { isConfigured } from './lib/supabase';

import { SocialFeed } from './pages/SocialFeed';
import { Reels } from './pages/Reels';
import { Landing } from './pages/Landing';
import { Settings } from './pages/Settings';
import { Friends } from './pages/Friends';
import { UserProfile } from './pages/UserProfile';
import { TaskPage } from './pages/TaskPage';
import { Messages } from './pages/Messages';
import { PostPage } from './pages/PostPage';
import { ResetPassword } from './pages/ResetPassword';
import { TasksPage } from './pages/TasksPage';
import { Live } from './pages/Live';
import { CallOverlay } from './components/CallOverlay';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { SupportWidget } from './components/SupportWidget';

function App() {
  const { user, loading } = useAuth();
  const isAdmin = user?.email === 'sharibaru0@gmail.com';

  console.log('App Rendering State:', { loading, hasUser: !!user, isAdmin, isConfigured });

  // 1. Show Configuration Error if keys are missing
  if (!isConfigured) {
    return <ConfigErrorView />;
  }

  // 2. Show Loading Spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <CallOverlay />
      <SupportWidget />
      <AnalyticsTracker />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/*" element={
          user ? (
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
                <Route path="/feed" element={<SocialFeed />} />
                <Route path="/reels" element={<Reels />} />
                <Route path="/live" element={<Live />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/task/:taskId" element={<TaskPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/post/:postId" element={<PostPage />} />
                <Route path="/alerts" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </>
  );
}




function ConfigErrorView() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full p-10 rounded-[2.5rem] text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic">Setup Required</h2>
          <p className="text-muted-foreground">
            Supabase environment variables are missing. Please add your credentials to the `.env` file to unlock the platform.
          </p>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-left space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Required Keys:</p>
          <code className="block text-[10px] text-amber-500 font-mono">VITE_SUPABASE_URL</code>
          <code className="block text-[10px] text-amber-500 font-mono">VITE_SUPABASE_ANON_KEY</code>
        </div>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground font-bold">
          <ShieldCheck size={14} className="text-primary" /> End-to-End Encryption Enabled
        </div>
      </div>
    </div>
  );
}


export default App;
