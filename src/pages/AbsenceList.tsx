import React from 'react';
import { Absence } from '../../types';

interface AbsenceListProps {
  title: string;
  absences: Absence[];
  onView: (absence: Absence) => void;
}

const AbsenceList: React.FC<AbsenceListProps> = ({ title, absences, onView }) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razão</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substituto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {absences.map((absence) => (
              <tr key={absence.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.unit}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.date}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.teacherName}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.contractType}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.course}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.departmentName}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.teachingPeriod}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.reason}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.duration}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{absence.substituteTeacherName}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 cursor-pointer">
                  <button onClick={() => onView(absence)}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {absences.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">Nenhuma falta encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default AbsenceList;
