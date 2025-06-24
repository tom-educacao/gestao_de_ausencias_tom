import React, { useState, useEffect } from 'react';
import { useAbsences } from '../../context/AbsenceContext';
import { Absence, AbsenceDuration, AbsenceReason } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SubstituteSelect from './SubstituteSelect';
import { Calendar, FileText, User, Building, Briefcase, BookOpen, Clock12 } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(null); // Novo estado para o arquivo
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

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

  // Filter teachers by selected unit
  const filteredTeachers = teachers.filter(teacher => teacher.unit === formData.unit);

  // Cria um Set para garantir que o nome do professor seja único
  const uniqueTeachers = [
    ...new Map(filteredTeachers.map(teacher => [teacher.name, teacher])).values()
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

  // Handle teacher selection
  const handleTeacherChange = (teacherId: string) => {
    const selectedTeacher = teachers.find(t => t.id === teacherId);
    const department = departments.find(d => d.id === selectedTeacher?.department);
    
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

    if (!formData.classes) {
      newErrors.classes = 'A quantidade de aulas faltadas é obrigatória';
    }
    
    if (formData.duration === 'Partial Day') {
      if (formData.startTime || formData.endTime) {
        newErrors.startTime = 'Não é necessário preencher os horários de início e fim para "Dia Parcial"';
        newErrors.endTime = 'Não é necessário preencher os horários de início e fim para "Dia Parcial"';
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
      } else {
        await addAbsence(absenceData as Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>);
        handleUpload();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting absence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={isEditing ? 'Edit Absence' : 'Register New Absence'}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            label="Professor"
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
            label="Disciplina"
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
            label={`${formData.teacherName} faltou quantas aulas?`}
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
      </form>
    </Card>
  );
};

export default AbsenceForm;
