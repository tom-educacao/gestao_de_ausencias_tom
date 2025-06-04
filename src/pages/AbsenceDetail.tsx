import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAbsences } from '../context/AbsenceContext';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, FileText, User, BookOpen, MessageSquare, Building, Briefcase, Clock12 } from 'lucide-react';

const AbsenceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { absences, deleteAbsence } = useAbsences();
  const navigate = useNavigate();
  
  const absence = absences.find(a => a.id === id);
  
  if (!absence) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700">Registro de ausência não encontrado</h2>
          <Button 
            className="mt-4"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </Layout>
    );
  }
  
  const handleDelete = () => {
    if (window.confirm('Tem certeza de que deseja excluir este registro de ausência?')) {
      deleteAbsence(absence.id);
      navigate('/');
    }
  };
  
  const handleEdit = () => {
    navigate(`/edit/${absence.id}`);
  };
  
  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft size={16} />}
          >
            Voltar
          </Button>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Detalhes de Falta</h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleEdit}
            icon={<Edit size={16} />}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 size={16} />}
          >
            Excluir
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Professor</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.teacherName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Departamento</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.departmentName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Unidade</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.unit || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Categoria</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.contractType || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Curso</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.course || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Clock12 className="h-5 w-5 text-rose-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Período</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.teachingPeriod || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Data</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(parseISO(absence.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Duração</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {absence.duration === 'Full Day' 
                      ? 'Full Day' 
                      : `Partial Day (${absence.startTime} - ${absence.endTime})`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">Razão</h3>
                  <p className="text-lg font-semibold text-gray-900">{absence.reason}</p>
                </div>
              </div>
              
              {absence.substituteTeacherName && (
                <div className="flex items-start">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-500">Substituto</h3>
                    <p className="text-lg font-semibold text-gray-900">{absence.substituteTeacherName}</p>
                  </div>
                </div>
              )}
              
              {absence.notes && (
                <div className="flex items-start">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-500">Notas</h3>
                    <p className="text-base text-gray-700">{absence.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <h3 className="text-lg font-medium mb-4">Informações do Registro</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Criado</p>
                <p className="text-base text-gray-900">
                  {format(parseISO(absence.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Última atualização</p>
                <p className="text-base text-gray-900">
                  {format(parseISO(absence.updatedAt), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">ID do registro</p>
                <p className="text-base text-gray-900">{absence.id}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AbsenceDetail;