import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from './Layout';

export default function ProtectedRouteWrapper() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? <Layout /> : <Navigate to="/login" />;
}
