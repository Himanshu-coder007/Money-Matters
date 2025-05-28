import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Login from './auth/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminTransaction from './pages/AdminTransaction';
import AdminDahboard from './pages/AdminDahboard';
import { LOCAL_STORAGE_KEYS } from './utils/constants';

function App() {
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {userId === '3' ? (
              <Route index element={<AdminDahboard />} />
            ) : (
              <Route index element={<Dashboard />} />
            )}
            <Route path="transactions" element={<Transactions />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/transactions" element={<AdminTransaction />} />
            <Route path="admin/dashboard" element={<AdminDahboard />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;