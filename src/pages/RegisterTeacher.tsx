import React from 'react';
import Layout from '../components/layout/Layout';
import TeacherForm from '../components/teacher/TeacherForm';
import { useNavigate } from 'react-router-dom';

const RegisterTeacher: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <Layout>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-901">Registro de Professores</h1>
        <p className="mt-2 text-sm text-gray-500">
          Registrar um novo professor no sistema
        </p>
      </div>
      
      <TeacherForm onSuccess={handleSuccess} />
    </Layout>
  );
};

export default RegisterTeacher;