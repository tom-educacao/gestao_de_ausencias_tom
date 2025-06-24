import React, { useState } from 'react';
import { useAbsences } from '../../context/AbsenceContext';
import { Absence } from '../../types';
import Table from '../ui/Table';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Edit, Trash2, Eye, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface AbsenceListProps {
  onEdit?: (absence: Absence) => void;
  onView?: (absence: Absence) => void;
  absences?: Absence[]; // <-- Agora pode receber a lista diretamente
  title?: string;
}

const AbsenceList: React.FC<AbsenceListProps> = ({ 
  onEdit, 
  onView, 
  absences, 
  title = "Absence Records" 
}) => {
  const { absences: contextAbsences, deleteAbsence, loading } = useAbsences();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [formData, setFormData] = useState<Partial<Absence>>({});


  const sourceAbsences = absences ?? contextAbsences;

  const sortedAbsences = [...sourceAbsences].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const openEditModal = (absence: Absence) => {
    console.log(absence)
    setEditingAbsence(absence);
    setFormData(absence); // Preenche o formulário com os dados atuais
  };
  
  const closeModal = () => {
    setEditingAbsence(null);
    setFormData({});
  };
  
  const handleFormChange = (field: keyof Absence, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const saveChanges = async () => {
    if (editingAbsence) {
      // Mapeia os campos camelCase para snake_case conforme esperado pelo Supabase
      const updatedFields = {
        reason: formData.reason,
        date: formData.date,
        contract_type: formData.contractType,
        course: formData.course,
        teachingPeriod: formData.teachingPeriod,
        classes: formData.classes,
        // Adicione mais campos aqui se necessário
      };
  
      try {
        const { error } = await supabase
          .from('absences')
          .update(updatedFields)
          .eq('id', editingAbsence.id);
  
        if (error) {
          console.error('Erro ao atualizar ausência:', error);
          return;
        }
  
        console.log('Ausência atualizada com sucesso');
        closeModal();
      } catch (err) {
        console.error('Erro inesperado ao salvar alterações:', err);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      setIsDeleting(id);
      try {
        await deleteAbsence(id);
      } catch (error) {
        console.error('Error deleting absence:', error);
      } finally {
        setIsDeleting(null);
        setConfirmDelete(null);
      }
    } else {
      setConfirmDelete(id);
      // Auto-reset confirm state after 3 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 3000);
    }
  };

  // Função para listar arquivos de uma pasta no Supabase
  const fetchFilesFromSupabase = async (teacherName: string, absenceDate: string) => {
    // Definindo o caminho da pasta
    const folderPath = `${teacherName}/${absenceDate}`; // Pasta do professor e a data da ausência
  
    // Listando arquivos na pasta
    const { data, error } = await supabase
      .storage
      .from('teachers') // Nome do seu bucket
      .list(folderPath, { limit: 100, offset: 0 }); // Você pode ajustar o limite
  
    if (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  
    // Gerando as URLs públicas dos arquivos
    const fileUrls = data.map(file => {
      return supabase
        .storage
        .from('teachers')
        .getPublicUrl(`${folderPath}/${file.name}`);
    });
  
    return fileUrls;
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Relatório de Faltas dos Professores', 14, 22);
    doc.setFontSize(11);
    doc.text(`Gerado em ${format(new Date(), 'dd MMMM, yyyy')}`, 14, 30);
    
    // Create table
    const tableColumn = ['Unidade', 'Data', 'Professor', 'Categoria', 'Curso', 'Departamento', 'Período', 'Razão', 'Duração', 'Substituto', 'Aulas dadas pelo substituto'];
    const tableRows = sortedAbsences.map(absence => [
      absence.unit || '-',
      format(parseISO(absence.date), 'MMM dd, yyyy'),
      absence.teacherName,
      absence.contractType || '-',
      absence.course || '-',
      absence.departmentName,
      absence.teachingPeriod || '-',
      absence.reason,
      `${absence.classes} aulas`,
      absence.substituteTeacherName || absence.substituteTeacherName2 || absence.substituteTeacherName3 || 'Nenhum',
      absence.substitute_total_classes || 'Nenhum',
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save('faltas_professores.pdf');
  };
  
  // Export to Excel
  const exportToExcel = async () => {
    // Criando o worksheet para os registros de faltas
    const worksheet = XLSX.utils.json_to_sheet(
      sortedAbsences.map(absence => {
        const categoriaSubstituto = absence.substituteTeacherName
          ? 'Tutor'
          : absence.substituteTeacherName2
          ? 'Professor'
          : absence.substituteTeacherName3
          ? 'Outro'
          : 'Nenhum';
  
        return {
          Unidade: absence.unit || '-',
          Data: format(parseISO(absence.date), 'MMM dd, yyyy'),
          Professor: absence.teacherName,
          Categoria: absence.contractType || '-',
          Curso: absence.course || '-',
          Departamento: absence.departmentName,
          Período: absence.teachingPeriod || '-',
          Razão: absence.reason,
          Duração: `${absence.classes} aulas`,
          Substituto: absence.substituteTeacherName || absence.substituteTeacherName2 || absence.substituteTeacherName3 || 'Nenhum',
          Substituto_aulas: absence.substitute_total_classes || 'Nenhum',
          Categoria_Substituto: categoriaSubstituto, // <-- Nova coluna adicionada aqui
          Notas: absence.notes || '',
        };
      })
    );
  
    // Agora vamos iterar sobre as ausências para adicionar os arquivos correspondentes na aba 'atestado'
    const atestadoFiles = [];
  
    for (let absence of sortedAbsences) {
      const { teacherName, date } = absence;
      const absenceDate = format(parseISO(date), 'yyyy-MM-dd'); // Formatando para o formato esperado
  
      // Buscando os arquivos para aquele professor e data
      const fileUrls = await fetchFilesFromSupabase(teacherName, absenceDate);
  
      if (fileUrls.length > 0) {
        fileUrls.forEach(file => {
          // Acesse corretamente a URL do arquivo
          const atestadoUrl = file.data.publicUrl;
  
          // Agora preenche a lista 'atestadoFiles' corretamente
          atestadoFiles.push({
            Professor: teacherName,
            Data: absenceDate,
            Atestado: atestadoUrl,
          });
        });
      }
    }
  
    // Criando a aba 'atestado' com os links dos arquivos
    const atestadoSheet = XLSX.utils.json_to_sheet(atestadoFiles);
  
    // Criando o livro de trabalho e adicionando as duas abas: 'Absences' e 'Atestado'
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absences');
    XLSX.utils.book_append_sheet(workbook, atestadoSheet, 'Atestado');
  
    // Exportando o arquivo Excel
    XLSX.writeFile(workbook, 'faltas_professores_com_atestados.xlsx');
  };

  const columns = [
    {
      header: 'Unidade',
      accessor: (absence: Absence) => absence.unit || '-',
    },
    {
      header: 'Data',
      accessor: (absence: Absence) => format(parseISO(absence.date), 'MMM dd, yyyy'),
    },
    {
      header: 'Professor',
      accessor: 'teacherName',
    },
    {
      header: 'Categoria',
      accessor: (absence: Absence) => absence.contractType || '-',
    },
    {
      header: 'Curso',
      accessor: (absence: Absence) => absence.course || '-',
    },
    {
      header: 'Departamento',
      accessor: 'departmentName',
    },

    {
      header: 'Razão',
      accessor: 'reason',
    },
    {
      header: 'Duração',
      accessor: (absence: Absence) => {
        if (absence.duration === 'Full Day') {
          return `${absence.classes} aulas`;
        }
        return `${absence.classes} aulas`;
      },
    },
    {
      header: 'Substituto',
      accessor: (absence: Absence) => absence.substituteTeacherName || absence.substituteTeacherName2 || absence.substituteTeacherName3 || 'Nenhum',
    },

    {
      header: 'Aulas dadas pelo substituto',
      accessor: (absence: Absence) => {
        if (absence.substitute_total_classes > 0){
          return `${absence.substitute_total_classes} aulas`;
        }  else {
        return '-'
        }
      }
    },
  
    {
      header: 'Ações',
      accessor: (absence: Absence) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEditModal(absence)}
            icon={<Edit size={16} />}
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(absence.id)}
            icon={<Trash2 size={16} />}
            isLoading={isDeleting === absence.id}
            className={confirmDelete === absence.id ? 'bg-red-100' : ''}
          >
            {confirmDelete === absence.id ? 'Confirma' : 'Deletar'}
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <>
      <Card 
        title={title}
        footer={
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {sortedAbsences.length} {sortedAbsences.length === 1 ? 'registro' : 'registros'} encontrados
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                icon={<Download size={16} />}
              >
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                icon={<Download size={16} />}
              >
                Exportar Excel
              </Button>
            </div>
          </div>
        }
      >
        <Table
          columns={columns}
          data={sortedAbsences}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          emptyMessage="Nenhuma falta encontrada"
        />
      </Card>
  
    {editingAbsence && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
          <h2 className="text-lg font-bold">Editar Falta</h2>
    
          {/* Campo: Data */}
          <label className="block">
            Data:
            <input
              type="date"
              className="w-full border p-2 mt-1"
              value={formData.date || ''}
              onChange={(e) => handleFormChange('date', e.target.value)}
            />
          </label>
    
          {/* Campo: Categoria */}
          <label className="block">
            Categoria:
            <select
              className="w-full border p-2 mt-1"
              value={formData.contractType || ''}
              onChange={(e) => handleFormChange('contractType', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="GPES">GPES</option>
              <option value="MUN">MUN</option>
              <option value="QFEB">QFEB</option>
              <option value="QPM">QPM</option>
              <option value="REPR">REPR</option>
              <option value="S100">S100</option>
              <option value="SC02">SC02</option>
            </select>
          </label>
    
          {/* Campo: Curso */}
          <label className="block">
            Curso:
            <select
              className="w-full border p-2 mt-1"
              value={formData.course || ''}
              onChange={(e) => handleFormChange('course', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Ensino Médio">Ensino Médio</option>
              <option value="Anos Finais">Anos Finais</option>
              <option value="Outros">Outros</option>
            </select>
          </label>
    
          {/* Campo: Duração */}
          <label className="block">
            Duração (nº de aulas):
            <input
              type="number"
              min={1}
              className="w-full border p-2 mt-1"
              value={formData.classes || ''}
              onChange={(e) => handleFormChange('classes', parseInt(e.target.value, 10))}
            />
          </label>
    
          {/* Campo: Razão */}
          <label className="block">
            Razão:
            <select
              className="w-full border p-2 mt-1"
              value={formData.reason || ''}
              onChange={(e) => handleFormChange('reason', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Sick Leave">Licença Médica</option>
              <option value="Personal Leave">Licença Pessoal</option>
              <option value="Professional Development">Desenvolvimento Profissional</option>
              <option value="Conference">Conferência</option>
              <option value="Family Emergency">Emergência Familiar</option>
              <option value="Demissao">Demissão</option>
            </select>
          </label>
    
          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={closeModal}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={saveChanges}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default AbsenceList;
