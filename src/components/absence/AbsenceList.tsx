import React, { useState, useEffect } from 'react';
import { useAbsences } from '../../context/AbsenceContext';
import { Absence } from '../../types';
import Table from '../ui/Table';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { CreditCard as Edit, Trash2, Eye, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import SubstituteSelect from './SubstituteSelect';

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
  const { absences: contextAbsences, deleteAbsence, loading, departments, teachers, refetch, fetchAllAbsencesRaw } = useAbsences();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [formData, setFormData] = useState<Partial<Absence>>({});
const [file, setFile] = useState<File | null>(null);
const [fileUrl, setFileUrl] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);


  // ---------------------------
  // Seleção em massa
  // ---------------------------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const sourceAbsences = absences ?? contextAbsences;
  const sortedAbsences = [...sourceAbsences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allSelected = sortedAbsences.length > 0 && selectedIds.size === sortedAbsences.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size === sortedAbsences.length) return new Set(); // limpa
      return new Set(sortedAbsences.map(a => a.id));
    });
  };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files ? e.target.files[0] : null;
  setFile(selectedFile);
};

const handleUpload = async () => {
  if (!file || !formData.teacherName || !formData.date) return;

  try {
    setUploading(true);
    const filePath = `${formData.teacherName}/${formData.date}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('teachers') // bucket
      .upload(filePath, file);

    if (error) {
      console.error('Erro ao fazer upload do arquivo:', error.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('teachers')
      .getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      setFileUrl(publicUrlData.publicUrl);
      console.log('Arquivo enviado com sucesso:', publicUrlData.publicUrl);
    }
  } catch (error) {
    console.error('Erro ao tentar fazer o upload', error);
  } finally {
    setUploading(false);
  }
};


  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (!confirmBulk) {
      setConfirmBulk(true);
      setTimeout(() => setConfirmBulk(false), 3000);
      return;
    }
    setIsBulkDeleting(true);
    try {
      // Deleção em paralelo, usando a função já existente no contexto
      await Promise.all([...selectedIds].map(id => deleteAbsence(id)));
      clearSelection();
    } catch (err) {
      console.error('Erro ao deletar em massa:', err);
    } finally {
      setIsBulkDeleting(false);
      setConfirmBulk(false);
    }
  };

  // Opcional: manter seleção coerente quando a lista muda (filtro, refetch)
  useEffect(() => {
    const currentIds = new Set(sortedAbsences.map(a => a.id));
    setSelectedIds(prev => new Set([...prev].filter(id => currentIds.has(id))));
  }, [sortedAbsences]);

const openEditModal = (absence: Absence) => {
  setEditingAbsence(absence);
  setFormData({
    ...absence,
    // garante que o ID venha preenchido para não tentar salvar "nome" depois
    substituteTeacherId: absence.substituteTeacherId ?? '',
  });
};

  
  const closeModal = () => {
    setEditingAbsence(null);
    setFormData({});
  };
  
const handleFormChange = (field: keyof Absence, value: any) => {
  setFormData(prev => {
    const next = { ...prev, [field]: value };

    if (field === 'hasSubstitute' && value === 'Não') {
      next.substituteType = '';
      next.substituteTeacherId = '';
      next.substituteTeacherName = '';
      next.substituteTeacherName2 = '';
      next.substituteTeacherName3 = '';
      next.substitute_total_classes = null;
    }

    if (field === 'substituteType' && value !== 'Tutor Substituto') {
      next.substituteTeacherId = '';
      next.substituteTeacherName = '';
    }

    return next;
  });
};

  
  const saveChanges = async () => {
    if (editingAbsence) {
      // Mapeia os campos camelCase para snake_case conforme esperado pelo Supabase
      const updatedFields = {
        reason: formData.reason || '',
        date: formData.date || '',
        contract_type: formData.contractType || '',
        course: formData.course || '',
        teachingPeriod: formData.teachingPeriod || '',
        classes: formData.classes || '',
        hasSubstitute: formData.hasSubstitute || '',
        substituteType: formData.substituteType || '',
        substitute_teacher_name2: formData.substituteTeacherName2 || '',
        substitute_teacher_name3: formData.substituteTeacherName3 || '',
        substitute_total_classes: formData.substitute_total_classes === '' ? null : formData.substitute_total_classes,
substitute_teacher_id:
  formData.substituteType === 'Tutor Substituto'
    ? formData.substituteTeacherId ?? null
    : null,

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
        // também remove da seleção, se marcado
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
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

  const toRow = (absence: Absence) => {
    const department = departments.find(d => d.id === absence.departmentId);
    const disciplinaId = department?.disciplinaId || '';
    const departamentoCompleto = disciplinaId ? `${absence.departmentName} - ${disciplinaId}` : absence.departmentName;
    const teacher = teachers.find(t => t.id === absence.teacherId);
    const regencia = teacher?.regencia ?? '-';

    return {
      Unidade: absence.unit || '-',
      Data: format(parseISO(absence.date), 'MMM dd, yyyy'),
      Professor: absence.teacherName,
      Categoria: absence.contractType || '-',
      Curso: absence.course || '-',
      Departamento: departamentoCompleto,
      Período: absence.teachingPeriod || '-',
      Razão: absence.reason,
      Duração: `${absence.classes} aulas`,
      Substituto: absence.substituteTeacherName || absence.substituteTeacherName2 || absence.substituteTeacherName3 || 'Nenhum',
      Substituto_aulas: absence.substitute_total_classes || 'Nenhum',
      Regência: regencia,
      Categoria_Substituto: absence.substituteTeacherName ? 'Tutor'
        : absence.substituteTeacherName2 ? 'Professor'
        : absence.substituteTeacherName3 ? 'Outro' : 'Nenhum',
      Notas: absence.notes || '',
    };
  };

  const toPdfRow = (absence: Absence) => {
    const department = departments.find(d => d.id === absence.departmentId);
    const disciplinaId = department?.disciplinaId || '';
    const departamentoCompleto = disciplinaId ? `${absence.departmentName} - ${disciplinaId}` : absence.departmentName;
    const teacher = teachers.find(t => t.id === absence.teacherId);
    const regencia = teacher?.regencia ?? '-';

    return [
      absence.unit || '-',
      format(parseISO(absence.date), 'MMM dd, yyyy'),
      absence.teacherName,
      absence.contractType || '-',
      absence.course || '-',
      departamentoCompleto,
      absence.teachingPeriod || '-',
      absence.reason,
      `${absence.classes} aulas`,
      absence.substituteTeacherName || absence.substituteTeacherName2 || absence.substituteTeacherName3 || 'Nenhum',
      absence.substitute_total_classes || 'Nenhum',
      regencia,
    ];
  };

  // Export to PDF
  const exportPageToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Faltas dos Professores', 14, 22);
    doc.setFontSize(11);
    doc.text(`Gerado em ${format(new Date(), 'dd MMMM, yyyy')}`, 14, 30);
    const tableColumn = ['Unidade','Data','Professor','Categoria','Curso','Departamento','Período','Razão','Duração','Substituto','Aulas dadas pelo substituto','Regência'];
    const tableRows = sortedAbsences.map(toPdfRow);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40, styles: { fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: [66, 139, 202] }});
    doc.save('faltas_professores_pagina.pdf');
  };
  
  const exportPageToExcel = async () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedAbsences.map(toRow));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Absences');
    // (opcional) manter sua aba de 'Atestado' só para a página:
    const atestadoFiles: any[] = [];
    for (let absence of sortedAbsences) {
      const { teacherName, date } = absence;
      const absenceDate = format(parseISO(date), 'yyyy-MM-dd');
      const fileUrls = await fetchFilesFromSupabase(teacherName, absenceDate);
      fileUrls.forEach(file => {
        const atestadoUrl = file.data.publicUrl;
        atestadoFiles.push({ Professor: teacherName, Data: absenceDate, Atestado: atestadoUrl });
      });
    }
    if (atestadoFiles.length) {
      const atestadoSheet = XLSX.utils.json_to_sheet(atestadoFiles);
      XLSX.utils.book_append_sheet(workbook, atestadoSheet, 'Atestado');
    }
    XLSX.writeFile(workbook, 'faltas_professores_pagina.xlsx');
  };

  // ---------------------------
  // EXPORTAÇÕES - TODOS OS REGISTROS (busca em lotes + chunks)
  // ---------------------------
  const chunk = <T,>(arr: T[], size: number) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const exportAllToExcel = async () => {
    // Busca tudo do banco (em lotes, via Context)
    const raw = await fetchAllAbsencesRaw();
    // Transform para o shape Absence (mesma transformação de fetchData)
    const all: Absence[] = raw.map((absence: any) => ({
      id: absence.id,
      teacherId: absence.teacher_id,
      teacherName: absence.teacher?.profiles?.name || '',
      departmentId: absence.department_id || '',
      departmentName: absence.name || '',
      unit: absence.teacher?.unit || undefined,
      contractType: absence.contract_type || absence.teacher?.contract_type || undefined,
      course: absence.course || undefined,
      teachingPeriod: absence.teachingPeriod || undefined,
      date: absence.date,
      reason: absence.reason,
      notes: absence.notes || undefined,
      substituteTeacherId: absence.substitute_teacher_id || undefined,
      substituteTeacherName: absence.substitutes?.name || undefined,
      substituteTeacherName2: absence.substitute_teacher_name2 || undefined,
      substituteTeacherName3: absence.substitute_teacher_name3 || undefined,
      substituteContent: absence.substituteContent || undefined,
      substitute_total_classes: absence.substitute_total_classes || null,
      duration: absence.duration,
      startTime: absence.start_time || undefined,
      endTime: absence.end_time || undefined,
      classes: absence.classes,
      createdAt: absence.created_at,
      updatedAt: absence.updated_at
    }));

    // Ordena por data desc como na tela
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, ws, 'Absences');

    // Append em chunks (2k por vez é estável)
    const CHUNK_SIZE = 2000;
    for (const part of chunk(all, CHUNK_SIZE)) {
      const rows = part.map(toRow);
      XLSX.utils.sheet_add_json(ws, rows, { origin: -1 });
    }

    XLSX.writeFile(workbook, 'faltas_professores_TODOS.xlsx');
  };

  const exportAllToPDF = async () => {
    const raw = await fetchAllAbsencesRaw();
    const all: Absence[] = raw.map((absence: any) => ({
      id: absence.id,
      teacherId: absence.teacher_id,
      teacherName: absence.teacher?.profiles?.name || '',
      departmentId: absence.department_id || '',
      departmentName: absence.name || '',
      unit: absence.teacher?.unit || undefined,
      contractType: absence.contract_type || absence.teacher?.contract_type || undefined,
      course: absence.course || undefined,
      teachingPeriod: absence.teachingPeriod || undefined,
      date: absence.date,
      reason: absence.reason,
      notes: absence.notes || undefined,
      substituteTeacherId: absence.substitute_teacher_id || undefined,
      substituteTeacherName: absence.substitutes?.name || undefined,
      substituteTeacherName2: absence.substitute_teacher_name2 || undefined,
      substituteTeacherName3: absence.substitute_teacher_name3 || undefined,
      substituteContent: absence.substituteContent || undefined,
      substitute_total_classes: absence.substitute_total_classes || null,
      duration: absence.duration,
      startTime: absence.start_time || undefined,
      endTime: absence.end_time || undefined,
      classes: absence.classes,
      createdAt: absence.created_at,
      updatedAt: absence.updated_at
    }));

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório de Faltas dos Professores (TODOS)', 14, 22);
    doc.setFontSize(11);
    doc.text(`Gerado em ${format(new Date(), 'dd MMMM, yyyy')}`, 14, 30);
    const head = [['Unidade','Data','Professor','Categoria','Curso','Departamento','Período','Razão','Duração','Substituto','Aulas dadas pelo substituto','Regência']];

    // gerar em blocos para reduzir memória
    const CHUNK_SIZE = 2000;
    const parts = chunk(all, CHUNK_SIZE);
    parts.forEach((part, idx) => {
      autoTable(doc, {
        head: idx === 0 ? head : undefined, // cabeça só na primeira
        body: part.map(toPdfRow),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    });

    doc.save('faltas_professores_TODOS.pdf');
  };

  // ---------------------------
  // COLUNAS DA TABELA (com checkboxes)
  // ---------------------------
  const columns = [
    {
      header: (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            aria-label="Selecionar todos"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleSelectAll}
            className="cursor-pointer"
          />
          <span>Ações</span>
        </div>
      ),
      accessor: (absence: Absence) => (
        <div className="flex items-center gap-2 justify-end">
          <input
            type="checkbox"
            aria-label={`Selecionar ${absence.teacherName} em ${absence.date}`}
            checked={selectedIds.has(absence.id)}
            onChange={() => toggleSelect(absence.id)}
            className="cursor-pointer"
          />
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
      accessor: (absence: Absence) => {
        // Buscar o departamento correspondente para obter o disciplinaId
        const department = departments.find(d => d.id === absence.departmentId);
        const disciplinaId = department?.disciplinaId || '';
        return disciplinaId ? `${absence.departmentName} - ${disciplinaId}` : absence.departmentName;
      },
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
        if ((absence.substitute_total_classes ?? 0) > 0){
          return `${absence.substitute_total_classes} aulas`;
        }  else {
        return '-'
        }
      }
    },
    
    {
      header: 'Regência',
      accessor: (absence: Absence) => {
        const teacher = teachers.find(t => t.id === absence.teacherId);
        return teacher?.regencia ?? 'NÃO REGÊNCIA';
      },
    },
  ];

  return (
    <>
      <Card
        title={title}
        footer={
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center">
            <div className="text-sm text-gray-500">
              {sortedAbsences.length} {sortedAbsences.length === 1 ? 'registro' : 'registros'} nesta página
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Página atual */}
              <Button variant="outline" size="sm" onClick={exportPageToPDF} icon={<Download size={16} />}>
                PDF (página)
              </Button>
              <Button variant="outline" size="sm" onClick={exportPageToExcel} icon={<Download size={16} />}>
                Excel (página)
              </Button>

              {/* TODOS os registros */}
              <Button variant="primary" size="sm" onClick={exportAllToPDF} icon={<Download size={16} />}>
                PDF (todos)
              </Button>
              <Button variant="primary" size="sm" onClick={exportAllToExcel} icon={<Download size={16} />}>
                Excel (todos)
              </Button>

              {/* Deletar selecionados */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                icon={<Trash2 size={16} />}
                disabled={selectedIds.size === 0 || isBulkDeleting}
                className={`${
                  confirmBulk ? 'bg-red-100' : ''
                } ${selectedIds.size === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isBulkDeleting
                  ? 'Deletando...'
                  : confirmBulk
                    ? `Confirma deletar ${selectedIds.size} selecionado(s)`
                    : `Deletar selecionados (${selectedIds.size})`}
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

          {/* Campo: Houve substituto? */}
          <label className="block">
            Houve substituto?
            <select
              className="w-full border p-2 mt-1"
              value={formData.hasSubstitute || ''}
              onChange={(e) => handleFormChange('hasSubstitute', e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </label>
          
          {/* Campo: Quem substituiu? */}
          {formData.hasSubstitute === 'Sim' && (
            <label className="block">
              Quem substituiu?
              <select
                className="w-full border p-2 mt-1"
                value={formData.substituteType || ''}
                onChange={(e) => handleFormChange('substituteType', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Professor">Professor</option>
                <option value="Tutor Substituto">Tutor Substituto</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
          )}
          
          {/* Nome do Professor Substituto */}
          {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Professor' && (
            <label className="block">
              Nome do Professor Substituto:
              <input
                type="text"
                className="w-full border p-2 mt-1"
                value={formData.substituteTeacherName2 || ''}
                onChange={(e) => handleFormChange('substituteTeacherName2', e.target.value)}
              />
            </label>
          )}
          
          {/* Nome/Cargo do Outro Substituto */}
          {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Outro' && (
            <label className="block">
              Nome/Cargo do substituto:
              <input
                type="text"
                className="w-full border p-2 mt-1"
                value={formData.substituteTeacherName3 || ''}
                onChange={(e) => handleFormChange('substituteTeacherName3', e.target.value)}
              />
            </label>
          )}

          {/* Se Tutor Substituto, selecionar o professor substituto */}
          {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Tutor Substituto' && (
            <div className="block">
              <label className="block mb-1">Tutor Substituto:</label>
              <SubstituteSelect
                value={formData.substituteTeacherId || ''}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    substituteTeacherId: value,
                    substituteTeacherName: value
                  }));
                }}
                unit={formData.unit}
                error={undefined}
              />

            </div>
          )}
          
          {/* Se NÃO houve substituto, campo só para exibir */}
          {formData.hasSubstitute === 'Não' && (
            <label className="block">
              Substituição:
              <input
                type="text"
                className="w-full border p-2 mt-1"
                value="Não"
                readOnly
              />
            </label>
          )}
          
          {/* Quantas aulas o substituto deu */}
          {formData.hasSubstitute === 'Sim' && (
            <label className="block">
              Quantas aulas o substituto deu?
              <input
                type="number"
                min={0}
                className="w-full border p-2 mt-1"
                value={formData.substitute_total_classes || ''}
                onChange={(e) => handleFormChange('substitute_total_classes', parseInt(e.target.value, 10))}
              />
            </label>
          )}

{/* Upload de Atestado */}
<div className="border-t pt-4 mt-4">
  <label className="block font-medium mb-1">Anexar Atestado:</label>
  <input
    type="file"
    accept="image/*,application/pdf"
    onChange={handleFileChange}
    className="block w-full border p-2 mb-2"
  />
  <Button
    variant="outline"
    size="sm"
    onClick={handleUpload}
    disabled={!file || uploading}
  >
    {uploading ? 'Enviando...' : 'Enviar Atestado'}
  </Button>

  {fileUrl && (
    <p className="text-sm text-green-600 mt-2">
      ✅ Atestado enviado com sucesso!{' '}
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600"
      >
        Ver arquivo
      </a>
    </p>
  )}
</div>


    
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
