// components/modals/EditAbsenceModal.tsx
import React, { useState, useEffect } from 'react';
import { Absence } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import SubstituteSelect from './SubstituteSelect';

interface EditAbsenceModalProps {
  absence: Absence | null;
  onClose: () => void;
  onSave: (updatedAbsence: Absence) => void;
}

const EditAbsenceModal: React.FC<EditAbsenceModalProps> = ({ absence, onClose, onSave }) => {
  const [formData, setFormData] = useState<Absence | null>(null);

  useEffect(() => {
    setFormData(absence);
  }, [absence]);

  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = () => {
    if (formData) onSave(formData);
    onClose();
  };

  return (
    <Modal title="Editar Falta" onClose={onClose}>
      <div className="space-y-4">
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
    
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </div>
    </Modal>

  );
};

export default EditAbsenceModal;
