import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAbsences } from '../context/AbsenceContext';
import Layout from '../components/layout/Layout';
import AbsenceForm from '../components/absence/AbsenceForm';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const EditAbsence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { absences } = useAbsences();
  const navigate = useNavigate();
  
  const absence = absences.find(a => a.id === id);
  
  if (!absence) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">Registro de falta não encontrada</h2>
          <Button 
            className="mt-4"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Voltar para o Dashboard
          </Button>
        </div>
      </Layout>
    );
  }
  
  const handleSuccess = () => {
    navigate(`/view/${absence.id}`);
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/view/${absence.id}`)}
          icon={<ArrowLeft size={16} />}
        >
          Voltar para Detalhes
        </Button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Editar Falta</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atualizar o registro de ausência de {absence.teacherName}
        </p>
      </div>
      
      <AbsenceForm 
        initialData={absence}
        isEditing={true}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
};

export default EditAbsence;