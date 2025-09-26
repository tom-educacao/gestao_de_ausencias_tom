import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Leave } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Calendar, FileText, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeaveFormProps {
  teacherId: string;
  teacherName: string;
  onSuccess: (leave: Leave) => void;
  onCancel: () => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ 
  teacherId, 
  teacherName, 
  onSuccess, 
  onCancel 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
  };

const uploadFile = async (): Promise<string | null> => {
  if (!file) return null;

  try {
    setUploading(true);

    // Usa a data do form (yyyy-MM-dd)
    const dateFolder = formData.startDate || new Date().toISOString().split('T')[0];

    const filePath = `${teacherName}/${dateFolder}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('teachers')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('teachers')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  } finally {
    setUploading(false);
  }
};


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Data de fim é obrigatória';
    }
    
    if (!formData.reason) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload file if provided
      const documentUrl = await uploadFile();
      
      // Create leave record
      const { data, error } = await supabase
        .from('leaves')
        .insert({
          teacher_id: teacherId,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          document_url: documentUrl,
          status: 'active',
          created_by: user.id
        })
        .select(`
          *,
          teacher:teachers(
            id,
            profiles(name)
          )
        `)
        .single();

      if (error) throw error;

      const newLeave: Leave = {
        id: data.id,
        teacherId: data.teacher_id,
        teacherName: data.teacher?.profiles?.name || teacherName,
        startDate: data.start_date,
        endDate: data.end_date,
        reason: data.reason,
        documentUrl: data.document_url,
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      onSuccess(newLeave);
    } catch (error) {
      console.error('Error creating leave:', error);
      setErrors({ submit: 'Erro ao criar afastamento. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={`Criar Novo Afastamento - ${teacherName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data de Início"
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
            required
            icon={<Calendar size={18} className="text-gray-400" />}
          />
          
          <Input
            label="Data de Fim"
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
            required
            icon={<Calendar size={18} className="text-gray-400" />}
          />
        </div>

        <Select
          label="Motivo do Afastamento"
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
          options={[
            { value: 'Licença médica', label: 'Licença médica' },
            { value: 'Licença maternidade', label: 'Licença maternidade' },
            { value: 'Licença paternidade', label: 'Licença paternidade' },
            { value: 'Licença sem vencimentos', label: 'Licença sem vencimentos' },
            { value: 'Afastamento para capacitação', label: 'Afastamento para capacitação' },
            { value: 'Outros', label: 'Outros' },
          ]}
          error={errors.reason}
          required
          icon={<FileText size={18} className="text-gray-400" />}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documento (Atestado/Comprovante)
          </label>
          <div className="flex items-center space-x-2">
            <label
              htmlFor="fileInput"
              className="bg-blue-500 text-white rounded-lg py-2 px-4 cursor-pointer hover:bg-blue-600 transition duration-200 inline-flex items-center"
            >
              <Upload size={16} className="mr-2" />
              {file ? 'Alterar arquivo' : 'Selecionar arquivo'}
            </label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {file && (
              <span className="text-sm text-green-600">
                {file.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting || uploading}
          >
            Criar Afastamento
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LeaveForm;