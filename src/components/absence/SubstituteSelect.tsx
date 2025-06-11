import React from 'react';
import Select from '../ui/Select';
import { useSubstitutes } from '../../hooks/useSubstitutes';
import { User } from 'lucide-react';

interface SubstituteSelectProps {
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  error?: string;
  required?: boolean;
}

const SubstituteSelect: React.FC<SubstituteSelectProps> = ({
  value,
  onChange,
  unit,
  error,
  required = false
}) => {
  const { substitutes, loading, error: substituteError } = useSubstitutes({ unit });

  const options = substitutes.map(substitute => ({
    value: substitute.id,
    label: `${substitute.name} (${substitute.unit})`
  }));

  return (
    <Select
      label="Tutor Substituto"
      id="substituteTeacherId"
      name="substituteTeacherId"
      value={value}
      onChange={onChange}
      options={options}
      error={error || substituteError}
      required={required}
      disabled={loading}
      icon={<User size={18} className="text-gray-400" />}
    />
  );
};

export default SubstituteSelect;
