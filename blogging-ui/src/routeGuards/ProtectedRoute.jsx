
import { Navigate } from 'react-router-dom';

import { clearToken, getToken, isTokenUsable } from '../utils/authStorage';
import { getCurrentUser } from '../services/authService';
import { getDashboardPath } from '../utils/dashboardPath';

export default function ProtectedRoute({ children, roles }) {
  const token = getToken();
  if (!isTokenUsable(token)) {
    clearToken();
    localStorage.removeItem('auth_user');
    return <Navigate to="/login" replace />;
  }
  const user = getCurrentUser();
  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }
  return children;
}

