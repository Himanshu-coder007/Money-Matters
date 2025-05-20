import { Navigate, Outlet } from 'react-router-dom';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

const ProtectedRoute = () => {
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  
  if (!userId) {
    // If no userId is present, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If userId exists, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;