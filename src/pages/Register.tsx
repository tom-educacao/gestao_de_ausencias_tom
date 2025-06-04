import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Lock, User, LogIn } from 'lucide-react';
import { registerUser } from '../lib/firebase';
import { upsertUserProfile } from '../lib/supabase';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Register with Firebase
      const { success, user: firebaseUser } = await registerUser(formData.email, formData.password);
      
      if (success && firebaseUser) {
        // Create profile in Supabase
        await upsertUserProfile(
          firebaseUser.uid,
          formData.name,
          formData.email,
          'admin'
        );
        
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Erro ao registrar usuário. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  return (
    <Layout requireAuth={false}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Criar nova conta</h1>
            <p className="mt-2 text-gray-600">Preencha os dados para se registrar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="João Silva"
              required
              icon={<User size={18} className="text-gray-400" />}
            />

            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="joao@exemplo.com"
              required
              icon={<Mail size={18} className="text-gray-400" />}
            />

            <Input
              label="Senha"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              icon={<Lock size={18} className="text-gray-400" />}
            />

            <Input
              label="Confirmar senha"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
                Registrar
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Faça login
              </button>
            </p>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;