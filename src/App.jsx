import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Login from './auth/Login';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminTransaction from './pages/AdminTransaction';
import AdminDahboard from './pages/AdminDahboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
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