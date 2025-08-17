import React, { useState, useEffect } from 'react';
import { useAbsences } from '../../context/AbsenceContext';
import { Absence, AbsenceDuration, AbsenceReason } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SubstituteSelect from './SubstituteSelect';
import { Calendar, FileText, User, Building, Briefcase, BookOpen, Clock12, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AbsenceFormProps {
  onSuccess?: () => void;
  initialData?: Partial<Absence>;
  isEditing?: boolean;
}

const AbsenceForm: React.FC<AbsenceFormProps> = ({ 
  onSuccess, 
  initialData = {}, 
  isEditing = false 
}) => {
  const { teachers, departments, addAbsence, updateAbsence } = useAbsences();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [roleType, setRoleType] = useState<'Professor' | 'Técnico pedagógico' | ''>('');
  const [formKey, setFormKey] = useState(0);
  
  // Modal states
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [askToSaveDialogOpen, setAskToSaveDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Absence>>({
    teacherId: initialData.teacherId || '',
    teacherName: initialData.teacherName || '',
    departmentId: initialData.departmentId || '',
    departmentName: initialData.departmentName || '',
    disciplinaId: initialData.disciplinaId || '',
    unit: initialData.unit || '',
    contractType: initialData.contractType || '',
    course: initialData.course || '',
    teachingPeriod: initialData.teachingPeriod || '',
    date: initialData.date || new Date().toISOString().split('T')[0],
    reason: initialData.reason || '' as AbsenceReason,
    notes: initialData.notes || '',
    substituteTeacherId: initialData.substituteTeacherId || '',
    substituteTeacherName: initialData.substituteTeacherName || '',
    substituteTeacherName2: initialData.substituteTeacherName2 || '',
    substituteTeacherName3: initialData.substituteTeacherName3 || '',
    duration: initialData.duration || 'Full Day' as AbsenceDuration,
    classes: initialData.classes || '',
    hasSubstitute: initialData.hasSubstitute || '', // Novo campo
    substituteType: initialData.substituteType || '', // Novo campo
    substituteContent: initialData.substituteContent || '',
    substitute_total_classes: initialData.substitute_total_classes || '',
  });

  const [isDepartmentChanged, setIsDepartmentChanged] = useState(false);

  const filteredTeachers = teachers.filter(teacher => {
    if (teacher.unit !== formData.unit) return false;
  
    if (roleType === 'Professor') {
      return teacher.regencia === null;
    }
    
    if (roleType === 'Técnico pedagógico') {
      return teacher.regencia === 'REGENCIA';
    }
  
    return false;
  });
  
  // Remove nomes duplicados
  const uniqueTeachers = [
    ...new Map(filteredTeachers.map((teacher) => [teacher.name, teacher])).values(),
  ];

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!e.target) return;
  
    const { name, value } = e.target;
    
    if (!name || value === undefined) return;
  
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  
    // If department was manually changed, set it as changed
    if (name === "departmentId") {
      setIsDepartmentChanged(true);
    }
  };

// Handle teacher selection com salvamento no localStorage
const handleTeacherChange = (teacherId: string) => {
  const selectedTeacher = teachers.find(t => t.id === teacherId);
  const department = departments.find(d => d.id === selectedTeacher?.department);

  // Atualiza o estado do formulário
  setFormData(prev => ({
    ...prev,
    teacherId,
    teacherName: selectedTeacher?.name || '',
    unit: selectedTeacher?.unit || '',
    contractType: selectedTeacher?.contractType || '',
    course: selectedTeacher?.course || '',
    teachingPeriod: selectedTeacher?.teachingPeriod || '',
    departmentId: isDepartmentChanged ? prev.departmentId : department?.id || '',
    departmentName: isDepartmentChanged ? prev.departmentName : department?.name || '',
  }));
};


  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile); // Armazena o arquivo no estado
    setFilePreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);

      const filePath = `${formData.teacherName}/${formData.date}/${Date.now()}_${file.name}`; // Caminho do arquivo no storage
      const { data, error } = await supabase.storage
        .from('teachers') // Nome do seu bucket
        .upload(filePath, file);

      if (error) {
        console.error('Erro ao fazer o upload do arquivo:', error.message);
        return;
      }

      // Se o upload for bem-sucedido, o link do arquivo será retornado
      const fileUrl = `${supabase.storage.from('my_bucket').getPublicUrl(filePath).publicURL}`;
      setFileUrl(fileUrl); // Você pode armazenar a URL do arquivo, se quiser exibir ou salvar

      console.log('Arquivo enviado com sucesso! URL:', fileUrl);
    } catch (error) {
      console.error('Erro ao tentar fazer o upload', error);
    } finally {
      setUploading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.teacherId) {
      newErrors.teacherId = 'Professor é obrigatório';
    }
    
    if (!formData.date) {
      newErrors.date = 'Data é obrigatório';
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Razão é obrigatório';
    }

    if (!formData.course) {
      newErrors.course = 'Curso é obrigatório';
    }

    if (!formData.classes) {
      newErrors.classes = 'A quantidade de aulas faltadas é obrigatória';
    }

    const faltadas = Number(formData.classes);
    const substituidas = Number(formData.substitute_total_classes);
  
    if (
      formData.hasSubstitute === 'Sim' &&
      !isNaN(faltadas) &&
      !isNaN(substituidas) &&
      substituidas > faltadas
    ) {
      newErrors.substitute_total_classes = 'As aulas substituídas não podem exceder as aulas faltadas.';
    }
    
    if (formData.duration === 'Partial Day') {
      if (formData.startTime || formData.endTime) {
        newErrors.startTime = 'Não é necessário preencher os horários de início e fim para "Dia Parcial"';
        newErrors.endTime = 'Não é necessário preencher os horários de início e fim para "Dia Parcial"';
      }
    }

    if (formData.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // zera horas para evitar fuso/horário
    
      const absenceDate = new Date(formData.date);
      absenceDate.setHours(0, 0, 0, 0);
    
      const diffInMs = absenceDate.getTime() - today.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
      // Se for no futuro e passar de 7 dias → erro
      if (diffInDays > 7) {
        newErrors.date = 'A data da ausência não pode ser superior a 7 dias no futuro.';
      }
    }

    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const absenceData = {
        ...formData,
        duration: formData.duration === 'Full Day' ? 'Full Day' : 'Partial Day',
      };
      
      if (isEditing && initialData.id) {
        await updateAbsence(initialData.id, absenceData);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        await addAbsence(absenceData as Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>);
        handleUpload();
        // Mostrar modal de sucesso apenas para novos registros
        setSuccessDialogOpen(true);
      }
    } catch (error) {
      console.error('Error submitting absence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving teacher data to localStorage
  const handleSaveTeacherData = () => {
    localStorage.setItem('ultimaUnidade', formData.unit || '');
    localStorage.setItem('ultimoProfessorId', formData.teacherId || '');
    localStorage.setItem('ultimoDepartmentId', formData.departmentId || '');
    localStorage.setItem('ultimoDepartmentName', formData.departmentName || '');
    localStorage.setItem('ultimoContractType', formData.contractType || '');
    localStorage.setItem('ultimoCourse', formData.course || '');
    localStorage.setItem('ultimoTeachingPeriod', formData.teachingPeriod || '');
    localStorage.setItem('ultimaRazao', formData.reason || '');
    localStorage.setItem('ultimasAulas', formData.classes || '');
    
    setAskToSaveDialogOpen(false);
      setFormKey(prev => prev + 1);
    if (onSuccess) onSuccess();
  };

  // Handle not saving teacher data
  const handleDontSaveTeacherData = () => {
    setAskToSaveDialogOpen(false);
    if (onSuccess) onSuccess();
  };

useEffect(() => {
  if (isEditing) return; // Não sobrescreve se estiver editando

  const ultimaUnidade = localStorage.getItem('ultimaUnidade');
  const ultimoProfessorId = localStorage.getItem('ultimoProfessorId');
  const ultimoDepartmentId = localStorage.getItem('ultimoDepartmentId');
  const ultimoDepartmentName = localStorage.getItem('ultimoDepartmentName');
  const ultimoContractType = localStorage.getItem('ultimoContractType');
  const ultimoCourse = localStorage.getItem('ultimoCourse');
  const ultimoTeachingPeriod = localStorage.getItem('ultimoTeachingPeriod');
  const ultimaRazao = localStorage.getItem('ultimaRazao');
  const ultimasAulas = localStorage.getItem('ultimasAulas');

  if (ultimaUnidade && ultimoProfessorId) {
    const professor = teachers.find(t => t.id === ultimoProfessorId);
    const departamento = departments.find(d => d.id === professor?.department);

    setFormData(prev => ({
      ...prev,
      unit: ultimaUnidade,
      teacherId: professor?.id || '',
      teacherName: professor?.name || '',
      contractType: ultimoContractType || professor?.contractType || '',
      course: ultimoCourse || professor?.course || '',
      teachingPeriod: ultimoTeachingPeriod || professor?.teachingPeriod || '',
      departmentId: ultimoDepartmentId || departamento?.id || '',
      departmentName: ultimoDepartmentName || departamento?.name || '',
      reason: ultimaRazao || '',
      classes: ultimasAulas || '',
    }));
  }
}, [teachers, departments, isEditing, formKey]);

  return (
    <>
      <Card title={isEditing ? 'Edit Absence' : 'Register New Absence'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Select
              label="Tipo de Funcionário"
              id="roleType"
              name="roleType"
              value={roleType}
              onChange={(value) => {
                setRoleType(value as 'Professor' | 'Técnico pedagógico');

                const ultimaUnidade = localStorage.getItem('ultimaUnidade') || '';
                const ultimoProfessorId = localStorage.getItem('ultimoProfessorId') || '';
                const ultimoDepartmentId = localStorage.getItem('ultimoDepartmentId') || '';
                const ultimoDepartmentName = localStorage.getItem('ultimoDepartmentName') || '';
                const ultimoContractType = localStorage.getItem('ultimoContractType') || '';
                const ultimoCourse = localStorage.getItem('ultimoCourse') || '';
                const ultimoTeachingPeriod = localStorage.getItem('ultimoTeachingPeriod') || '';
                const ultimaRazao = localStorage.getItem('ultimaRazao') || '';
                const ultimasAulas = localStorage.getItem('ultimasAulas') || '';
                
                setFormData(prev => ({
                  ...prev,
                  unit: ultimaUnidade,
                  teacherId: ultimoProfessorId,
                  teacherName: '',
                  departmentId: ultimoDepartmentId,
                  departmentName: ultimoDepartmentName,
                  contractType: ultimoContractType,
                  course: ultimoCourse,
                  teachingPeriod: '',
                }));
              }}
              options={[
                { value: 'Professor', label: 'Professor' },
                { value: 'Técnico pedagógico', label: 'Técnico pedagógico' },
              ]}
              required
            />
          </div>

          {roleType !== '' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unit */}
                <Select
                  label="Unidade"
                  id="unit"
                  name="unit"
                  value={formData.unit || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  options={[
                  { value: 'ANTONIO T R DE OLIVEIRA, C E-EF M', label: 'ANTONIO T R DE OLIVEIRA, C E-EF M' },
                  { value: 'NILO CAIRO, C E-EF M N PROFIS', label: 'NILO CAIRO, C E-EF M N PROFIS' },
                  { value: 'UNIDADE POLO, C E-EF M PROFIS', label: 'UNIDADE POLO, C E-EF M PROFIS' },
                  { value: 'LEOCADIA B RAMOS, C E-EF M PROFIS', label: 'LEOCADIA B RAMOS, C E-EF M PROFIS' },
                  { value: 'MATHIAS JACOMEL, C E-EF M PROFIS', label: 'MATHIAS JACOMEL, C E-EF M PROFIS' },
                  { value: 'ANIBAL KHURY NETO, C E-EF M PROFIS', label: 'ANIBAL KHURY NETO, C E-EF M PROFIS' },
                  { value: 'ELIAS ABRAHAO, C E PROF-EF M PROFIS', label: 'ELIAS ABRAHAO, C E PROF-EF M PROFIS' },
                  { value: 'HILDEBRANDO DE ARAUJO, C E-EF M PROFIS', label: 'HILDEBRANDO DE ARAUJO, C E-EF M PROFIS' },
                  { value: 'NATALIA REGINATO, C E-EF M PROFIS', label: 'NATALIA REGINATO, C E-EF M PROFIS' },
                  { value: 'OLIVIO BELICH, C E DEP-EF M', label: 'OLIVIO BELICH, C E DEP-EF M' },
                  { value: 'AYRTON SENNA DA SILVA, C E-EF M N PROFIS', label: 'AYRTON SENNA DA SILVA, C E-EF M N PROFIS' },
                  { value: 'GUSTAVO D DA SILVA, C E-EF M PROFIS', label: 'GUSTAVO D DA SILVA, C E-EF M PROFIS' },
                  { value: 'JUSCELINO K DE OLIVEIRA, C E-EFMPN', label: 'JUSCELINO K DE OLIVEIRA, C E-EFMPN' },
                  { value: 'TAMANDARE, C E ALM-EF M PROFIS', label: 'TAMANDARE, C E ALM-EF M PROFIS' },
                  { value: 'RUI BARBOSA, C E C-EF M', label: 'RUI BARBOSA, C E C-EF M' },
                  { value: 'BELO HORIZONTE, C E-EF M PROFIS', label: 'BELO HORIZONTE, C E-EF M PROFIS' },
                  { value: 'DURVAL RAMOS FILHO, C E-EF M PROFIS', label: 'DURVAL RAMOS FILHO, C E-EF M PROFIS' },
                  { value: 'GERALDO FERNANDES, C E D-EF M', label: 'GERALDO FERNANDES, C E D-EF M' },
                  { value: 'JARDIM SAN RAFAEL, C E DO-EF M', label: 'JARDIM SAN RAFAEL, C E DO-EF M' },
                  { value: 'KAZUCO OHARA, E E PROF-EF', label: 'KAZUCO OHARA, E E PROF-EF' },
                  { value: 'NOSSA SRA LOURDES, C E-EF M', label: 'NOSSA SRA LOURDES, C E-EF M' },
                  { value: 'UBEDULHA C OLIVEIRA, C E PROFA-EF M P N', label: 'UBEDULHA C OLIVEIRA, C E PROFA-EF M P N' },
                  { value: 'WILLIE DAVIDS, C E DR-EF M', label: 'WILLIE DAVIDS, C E DR-EF M' },
                  { value: 'AMANDA CARNEIRO DE MELLO, C E-EF M PROFI', label: 'AMANDA CARNEIRO DE MELLO, C E-EF M PROFI' },
                  { value: 'FRITZ KLIEWER, C E C-EF M', label: 'FRITZ KLIEWER, C E C-EF M' },
                  { value: 'JORGE Q NETTO, C E-EF M P N', label: 'JORGE Q NETTO, C E-EF M P N' },
                  { value: 'ANA DIVANIR BORATTO, C E-EFM', label: 'ANA DIVANIR BORATTO, C E-EFM' },
                  { value: 'ARNALDO JANSEN, C E PE-EF M PROFIS', label: 'ARNALDO JANSEN, C E PE-EF M PROFIS' },
                  { value: 'CORREIA, C E SEN-EF M PROFIS', label: 'CORREIA, C E SEN-EF M PROFIS' },
                  { value: 'FRANCISCO PIRES MACHADO, C E-EF M PROFIS', label: 'FRANCISCO PIRES MACHADO, C E-EF M PROFIS' },
                  { value: 'LINDA S BACILA, C E PROFA-EF M PROFIS', label: 'LINDA S BACILA, C E PROFA-EF M PROFIS' },
                  { value: 'RODRIGUES ALVES, C E-EF M N PROFIS', label: 'RODRIGUES ALVES, C E-EF M N PROFIS' }
                ]}
                  icon={<Building size={18} className="text-gray-400" />}
                />
                
                {/* Teacher Selection */}
                <Select
                  label={roleType === 'Professor' ? 'Professor' : 'Técnico pedagógico'}
                  id="teacherId"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleTeacherChange}
                  options={uniqueTeachers.map(teacher => ({
                    value: teacher.id,
                    label: `${teacher.name}`,
                  }))}
                  error={errors.teacherId}
                  required
                />
      
                {/* Department (auto-filled based on teacher) */}
                <Select
                  label={roleType === 'Professor' ? 'Disciplina' : 'Cargo'}
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={(value: string) => {
                    const selectedDepartment = departments.find(d => d.id === value);
                    
                    handleChange({
                      target: { 
                        name: 'departmentId', 
                        value 
                      } 
                    });
                
                    // Atualiza também o departmentName e disciplinaId
                    if (selectedDepartment) {
                      setFormData(prev => ({
                        ...prev,
                        departmentName: selectedDepartment.name,
                        disciplinaId: selectedDepartment.disciplinaId, // Adicionando disciplinaId
                      }));
                    }
                  }} 
                  options={departments.map(department => ({
                    value: department.id,
                    label: `${department.name} - ${department.disciplinaId}`, // Mostra o departmentName e disciplinaId juntos
                  }))}
                  error={errors.departmentId}
                  required
                  icon={<FileText size={18} className="text-gray-400" />}
                />
      
                
                {/* Course */}
                <Select
                  label="Curso"
                  id="course"
                  name="course"
                  value={formData.course || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                  options={[
                    { value: 'Ensino Médio', label: 'Ensino Médio' },
                    { value: 'Anos Finais', label: 'Anos Finais' },
                    { value: 'Outros', label: 'Outros' },
                  ]}
                  icon={<BookOpen size={18} className="text-gray-400" />}
                  required
                />
      
                {/* Contract Type */}
                <Select
                  label="Categoria"
                  id="contractType"
                  name="contractType"
                  value={formData.contractType || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, contractType: value }))}
                  options={[
                    { value: 'GPES', label: 'GPES' },
                    { value: 'MUN', label: 'MUN' },
                    { value: 'QFEB', label: 'QFEB' },
                    { value: 'QPM', label: 'QPM'},
                    { value: 'REPR', label: 'REPR'},
                    { value: 'S100', label: 'S100'},
                    { value: 'SC02', label: 'SC02'},
                  ]}
                  icon={<Briefcase size={18} className="text-gray-400" />}
                />
      
                {/* Number of classes missed */}
                <Input
                  label={roleType === 'Professor' ? `${formData.teacherName} faltou quantas aulas?` : 'Horas de ausência'}
                  id="classes"
                  name="classes"
                  type="number"
                  value={formData.classes}
                  onChange={handleChange}
                  error={errors.classes}
                  required
                />
      
                {/* Aulas substituidas */}
                
                {/* Houve substituto? */}
                <Select
                  label="Houve substituto?"
                  id="hasSubstitute"
                  name="hasSubstitute"
                  value={formData.hasSubstitute}
                  onChange={(value) => setFormData(prev => ({ ...prev, hasSubstitute: value }))}
                  options={[
                    { value: 'Sim', label: 'Sim' },
                    { value: 'Não', label: 'Não' },
                  ]}
                />
                
                {/* Se Sim, quem substituiu? */}
                {formData.hasSubstitute === 'Sim' && (
                  <Select
                    label="Quem substituiu?"
                    id="substituteType"
                    name="substituteType"
                    value={formData.substituteType}
                    onChange={(value) => setFormData(prev => ({ ...prev, substituteType: value }))}
                    options={[
                      { value: 'Professor', label: 'Professor' },
                      { value: 'Tutor Substituto', label: 'Tutor Substituto' },
                      { value: 'Outro', label: 'Outro' },
                    ]}
                  />
                )}
      
                {/* Se Professor, campo para nome */}
                {formData.substituteType === 'Professor' && (
                  <Input
                    label="Nome do Professor Substituto"
                    id="substituteTeacherName2"
                    name="substituteTeacherName2"
                    value={formData.substituteTeacherName2 || ''}
                    onChange={handleChange}
                  />
                )}
      
                {formData.substituteType === 'Outro' && (
                  <Input
                    label="Nome/Cargo do substituto"
                    id="substituteTeacherName3"
                    name="substituteTeacherName3"
                    value={formData.substituteTeacherName3 || ''}
                    onChange={handleChange}
                  />
                )}
      
                {/* Se Tutor Substituto, selecionar o professor substituto */}
                {formData.substituteType === 'Tutor Substituto' && (
                  <SubstituteSelect
                    value={formData.substituteTeacherId || ''}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      substituteTeacherId: value,
                      substituteTeacherName: value
                    }))}
                    unit={formData.unit}
                    error={errors.substituteTeacherId}
                  />
                )}
      
                {/* Se Não, preencher com Não */}
                {formData.hasSubstitute === 'Não' && (
                  <div className="col-span-2">
                    <Input
                      label="Substituição"
                      id="substituteTeacherName"
                      name="substituteTeacherName"
                      value="Não"
                      readOnly
                    />
                  </div>
                )}
      
                {/* Campo: Quantas aulas o substituto deu? */}
                {formData.hasSubstitute === 'Sim' && (
                  <Input
                    label="Quantas aulas o substituto deu?"
                    id="substitute_total_classes"
                    name="substitute_total_classes"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.substitute_total_classes || ''}
                    onChange={handleChange}
                  />
                )}
      
                
                {/* Absence Date */}
                <Input
                  label="Data de Ausência"
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                  required
                  icon={<Calendar size={18} className="text-gray-400" />}
                />
                
                {/* Reason for Absence */}
                <Select
                  label="Motivo da Ausência"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={(value) => setFormData(prev => ({ ...prev, reason: value as AbsenceReason }))}
                  options={[
                    { value: 'Sick Leave', label: 'Licença médica' },
                    { value: 'Personal Leave', label: 'Licença Pessoal' },
                    { value: 'Professional Development', label: 'Desenvolvimento Profissional' },
                    { value: 'Conference', label: 'Conferência' },
                    { value: 'Family Emergency', label: 'Emergência Familiar' },
                    { value: 'Demissao', label: 'Demissão' },
                    { value: 'Other', label: 'Outro' },
                  ]}
                  error={errors.reason}
                  required
                />
      
                  {roleType === 'Técnico pedagógico' && (
                    <Select
                      label="Período"
                      id="teachingPeriod"
                      name="teachingPeriod"
                      value={formData.teachingPeriod || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, teachingPeriod: value }))}
                      options={[
                        { value: 'Morning', label: 'Manhã' },
                        { value: 'Afternoon', label: 'Tarde' },
                        { value: 'Evening', label: 'Noite' },
                      ]}
                      icon={<Clock12 size={18} className="text-gray-400" />}
                    />
                  )}
                
              </div>
      
              <Input
                label="Notas"
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                error={errors.notes}
                required={false} // Torne este campo opcional se preferir
                icon={<FileText size={18} className="text-gray-400" />}
              />
      
              {/* Documento (Novo campo para anexar documento) */}
              <div>
                <label
                  htmlFor="fileInput"
                  className="bg-blue-400 text-white rounded-lg py-2 px-4 cursor-pointer hover:bg-blue-500 transition duration-200 inline-block"
                >
                  Clique para fazer upload do atestado
                </label>
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && (
                  <div className="mt-2 text-left">
                    <p className="text-green-600">Arquivo carregado com sucesso!</p>
                  </div>
                )}
              </div>
      
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('ultimaUnidade');
                    localStorage.removeItem('ultimoProfessorId');
                    localStorage.removeItem('ultimoDepartmentId');
                    localStorage.removeItem('ultimoDepartmentName');
                    localStorage.removeItem('ultimoContractType');
                    localStorage.removeItem('ultimoCourse');
                    localStorage.removeItem('ultimoTeachingPeriod');
                    localStorage.removeItem('ultimaRazao');
                    localStorage.removeItem('ultimasAulas');
                    setFormData(prev => ({
                      ...prev,
                      unit: '',
                      teacherId: '',
                      teacherName: '',
                      departmentId: '',
                      departmentName: '',
                      contractType: '',
                      course: '',
                      teachingPeriod: '',
                    }));
                  }}
                >
                  Apagar Seleção
                </Button>
      
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSuccess}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                >
                  {isEditing ? 'Atualizar Falta' : 'Registrar Falta'}
                </Button>
              </div>
    
            </>
          )}
        </form>
      </Card>

      {/* Modal de Sucesso */}
      {successDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Falta registrada com sucesso!</h2>
                <p className="text-sm text-gray-600">O registro foi salvo no sistema.</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-4">
                Deseja salvar os dados deste profissional para facilitar o próximo registro?
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccessDialogOpen(false);
                    handleDontSaveTeacherData();
                  }}
                >
                  Não, obrigado
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSuccessDialogOpen(false);
                    setAskToSaveDialogOpen(true);
                  }}
                  icon={<Save size={16} />}
                >
                  Sim, salvar dados
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Salvar */}
      {askToSaveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Save className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirmar salvamento</h2>
                <p className="text-sm text-gray-600">
                  Os dados da unidade e professor serão salvos para o próximo registro.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-blue-800">
                <p><strong>Unidade:</strong> {formData.unit}</p>
                <p><strong>Professor:</strong> {formData.teacherName}</p>
                <p><strong>Disciplina:</strong> {formData.departmentName }</p>
                <p><strong>Curso:</strong> {formData.course}</p>
                <p><strong>Categoria:</strong> {formData.contractType}</p>
                <p><strong>Aulas faltadas:</strong> {formData.classes}</p>
                <p><strong>Razão da falta:</strong> {formData.reason}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleDontSaveTeacherData}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveTeacherData}
                icon={<Save size={16} />}
              >
                Confirmar e salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AbsenceForm;