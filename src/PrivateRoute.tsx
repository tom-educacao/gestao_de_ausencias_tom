import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto estiver carregando, você pode renderizar um loader ou uma tela de carregamento
  if (loading) {
    return <div>Loading...</div>;
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Caso esteja autenticado, renderiza os filhos (as páginas)
  return <>{children}</>;
};

export default PrivateRoute;
