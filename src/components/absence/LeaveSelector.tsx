import React from 'react';
import { Leave } from '../../types';
import { format, parseISO } from 'date-fns';
import { Calendar, FileText } from 'lucide-react';

interface LeaveSelectorProps {
  leaves: Leave[];
  selectedLeaveId: string | null;
  onSelectLeave: (leaveId: string) => void;
  loading?: boolean;
}

const LeaveSelector: React.FC<LeaveSelectorProps> = ({
  leaves,
  selectedLeaveId,
  onSelectLeave,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse bg-gray-200 h-16 rounded-md"></div>
        <div className="animate-pulse bg-gray-200 h-16 rounded-md"></div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>Nenhum afastamento ativo encontrado para este professor nesta data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Afastamentos ativos para vincular:
      </h4>
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
            selectedLeaveId === leave.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onSelectLeave(leave.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">{leave.reason}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(parseISO(leave.startDate), 'dd/MM/yyyy')} - {format(parseISO(leave.endDate), 'dd/MM/yyyy')}
                </span>
              </div>
              {leave.documentUrl && (
                <div className="mt-2">
                  <a
                    href={leave.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver documento anexado
                  </a>
                </div>
              )}
            </div>
            <div className="ml-4">
              <input
                type="radio"
                checked={selectedLeaveId === leave.id}
                onChange={() => onSelectLeave(leave.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaveSelector;