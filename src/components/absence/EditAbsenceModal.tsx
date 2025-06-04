// components/modals/EditAbsenceModal.tsx
import React, { useState, useEffect } from 'react';
import { Absence } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

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
        {/* Adicione mais campos conforme necessário */}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditAbsenceModal;
