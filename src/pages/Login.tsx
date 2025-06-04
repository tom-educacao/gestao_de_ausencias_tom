import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || '/';
      navigate(returnTo);
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (!success) {
        setError('Email ou senha inválidos');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Um erro ocorreu durante o login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout requireAuth={false}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Gestão de ausências de professores</h1>
            <p className="mt-2 text-gray-600">Faça login na sua conta</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              icon={<Mail size={18} className="text-gray-400" />}
            />
            
            <Input
              label="Senha"
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              icon={<Lock size={18} className="text-gray-400" />}
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<LogIn size={18} />}
              >
                Entrar
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register-absence')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Registre-se
              </button>
            </p>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;