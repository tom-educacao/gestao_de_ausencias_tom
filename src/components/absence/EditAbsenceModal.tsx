// components/modals/EditAbsenceModal.tsx
import React, { useState, useEffect } from 'react';
import { Absence } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import SubstituteSelect from './SubstituteSelect';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

interface EditAbsenceModalProps {
  absence: Absence | null;
  onClose: () => void;
  onSave: (updatedAbsence: Absence) => void;
}

const EditAbsenceModal: React.FC<EditAbsenceModalProps> = ({ absence, onClose, onSave }) => {
  const [formData, setFormData] = useState<Absence | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    setFormData(absence);
  }, [absence]);

  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    if (selectedFile) {
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file || !formData) return;

    try {
      setUploading(true);

      const filePath = `${formData.teacherName}/${formData.date}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('teachers')
        .upload(filePath, file);

      if (error) {
        console.error('Erro ao fazer o upload do arquivo:', error.message);
        return;
      }

      const fileUrl = `${supabase.storage.from('my_bucket').getPublicUrl(filePath).publicURL}`;
      setFileUrl(fileUrl);

      console.log('Arquivo enviado com sucesso! URL:', fileUrl);
    } catch (error) {
      console.error('Erro ao tentar fazer o upload', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (file) {
      await handleUpload();
    }
    if (formData) onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Editar Falta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
        <Input
          label="Professor"
          name="teacherName"
          value={formData.teacherName}
          onChange={handleChange}
        />
        <Input
          label="Razão"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
        />
        <Input
          label="Data"
          name="date"
          type="date"
          value={formData.date.slice(0, 10)}
          onChange={handleChange}
        />
    
        {/* Houve substituto? */}
        <select
          name="hasSubstitute"
          value={formData.hasSubstitute || ''}
          onChange={handleChange}
          className="border rounded p-2 w-full"
        >
          <option value="">Houve substituto?</option>
          <option value="Sim">Sim</option>
          <option value="Não">Não</option>
        </select>
    
        {/* Quem substituiu? */}
        {formData.hasSubstitute === 'Sim' && (
          <select
            name="substituteType"
            value={formData.substituteType || ''}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          >
            <option value="">Quem substituiu?</option>
            <option value="Professor">Professor</option>
            <option value="Tutor Substituto">Tutor Substituto</option>
            <option value="Outro">Outro</option>
          </select>
        )}
    
        {/* Nome do substituto */}
        {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Professor' && (
          <Input
            label="Nome do Professor Substituto"
            name="substituteTeacherName2"
            value={formData.substituteTeacherName2 || ''}
            onChange={handleChange}
          />
        )}
    
        {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Outro' && (
          <Input
            label="Nome/Cargo do substituto"
            name="substituteTeacherName3"
            value={formData.substituteTeacherName3 || ''}
            onChange={handleChange}
          />
        )}

        {formData.hasSubstitute === 'Sim' && formData.substituteType === 'Tutor Substituto' && (
          <SubstituteSelect
            value={formData.substituteTeacherId || ''}
            onChange={(value) => setFormData(prev => prev ? {
              ...prev,
              substituteTeacherId: value,
              substituteTeacherName: value
            } : null)}
            unit={formData.unit}
            error={undefined}
          />
        )}

        {formData.hasSubstitute === 'Não' && (
          <Input
            label="Substituição"
            name="substituteTeacherName"
            value="Não"
            readOnly
          />
        )}
    
        {formData.hasSubstitute === 'Sim' && (
          <Input
            label="Quantas aulas o substituto deu?"
            name="substitute_total_classes"
            type="number"
            min="0"
            step="1"
            value={formData.substitute_total_classes || ''}
            onChange={handleChange}
          />
        )}

        <div>
          <label
            htmlFor="fileInputEdit"
            className="bg-blue-400 text-white rounded-lg py-2 px-4 cursor-pointer hover:bg-blue-500 transition duration-200 inline-block"
          >
            {uploading ? 'Enviando...' : 'Clique para fazer upload do atestado'}
          </label>
          <input
            id="fileInputEdit"
            type="file"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {file && (
            <div className="mt-2 text-left">
              <p className="text-green-600">Arquivo carregado com sucesso!</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? 'Enviando...' : 'Salvar'}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditAbsenceModal;
