import React from 'react';
import Layout from '../components/layout/Layout';
import SubstituteForm from '../components/substitute/SubstituteForm';
import { useNavigate } from 'react-router-dom';

const RegisterSubstitute: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Substitutos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registrar um novo substituto no sistema
        </p>
      </div>
      
      <SubstituteForm onSuccess={handleSuccess} />
    </Layout>
  );
};

export default RegisterSubstitute;