import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Login from './auth/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminTransaction from './pages/AdminTransaction';
import AdminDashboard from './pages/AdminDahboard';
import { LOCAL_STORAGE_KEYS } from './utils/constants';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID));

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUserId(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID));
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Also listen for changes within the same tab
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
      if (currentUserId !== userId) {
        setUserId(currentUserId);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [userId]);

  const isAdmin = userId === '3';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUserId={setUserId} />} />
        <Route element={<ProtectedRoute userId={userId} />}>
          <Route path="/" element={<Layout userId={userId} />}>
            {/* Default route based on user role */}
            <Route index element={isAdmin ? <AdminDashboard /> : <Dashboard />} />
            
            {/* User routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin routes */}
            <Route path="admin/transactions" element={<AdminTransaction />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;