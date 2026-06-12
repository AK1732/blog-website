
import { Navigate } from 'react-router-dom';

import { getToken } from '../utils/authStorage';
import { getCurrentUser } from '../services/authService';

export default function ProtectedRoute({ children, roles }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  const user = getCurrentUser();
  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'writer' ? '/writer' : '/dashboard'} replace />;
  }
  return children;
}

