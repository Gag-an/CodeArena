import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Landing from './pages/Landing/Landing';
import UserAuth from './pages/Auth/UserAuth';
import AdminAuth from './pages/Auth/AdminAuth';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import MatchLoading from './pages/MatchLoading/MatchLoading';
import CompetitiveMatch from './pages/CompetitiveMatch/CompetitiveMatch';
import FriendlyMatch from './pages/FriendlyMatch/FriendlyMatch';
import './App.css';

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>Loading...</div>;
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" state={{ fromLogin: true }} /> : <UserAuth />} />
        <Route path="/admin" element={<AdminAuth />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/auth" />} />
        <Route path="/match-loading" element={user ? <MatchLoading /> : <Navigate to="/auth" />} />
        <Route path="/competitive-match" element={user ? <CompetitiveMatch /> : <Navigate to="/auth" />} />
        <Route path="/friendly-match" element={user ? <FriendlyMatch /> : <Navigate to="/auth" />} />
      </Routes>
    </main>
    <Footer />
  </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
