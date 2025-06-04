import React from 'react';
import Layout from '../components/layout/Layout';
import AbsenceForm from '../components/absence/AbsenceForm';
import { useNavigate } from 'react-router-dom';

const RegisterAbsence: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Faltas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registrar uma nova ausência de professor no sistema
        </p>
      </div>
      
      <AbsenceForm onSuccess={handleSuccess} />
    </Layout>
  );
};

export default RegisterAbsence;