import React, { useState } from 'react';
import { useAbsences } from '../../context/AbsenceContext';
import { useAuth } from '../../context/AuthContext';
import { Leave, Absence } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import SubstituteSelect from './SubstituteSelect';

interface BulkAbsenceGeneratorProps {
  leave: Leave;
  onSuccess: () => void;
  onCancel: () => void;
}

// acima de handleGenerate:
const mapLeaveReasonToAbsenceReason = (r: string): Absence['reason'] => {
  const map: Record<string, Absence['reason']> = {
    'Licença médica': 'Sick Leave',
    'Sick Leave': 'Sick Leave',

    'Licença Pessoal': 'Personal Leave',
    'Personal Leave': 'Personal Leave',

    'Desenvolvimento Profissional': 'Professional Development',
    'Professional Development': 'Professional Development',

    'Conferência': 'Conference',
    'Conference': 'Conference',

    'Emergência Familiar': 'Family Emergency',
    'Family Emergency': 'Family Emergency',

    'Demissão': 'Demissao',
    'Demissao': 'Demissao',

    'Outro': 'Other',
    'Other': 'Other',
  };
  return map[r] ?? 'Other'; // fallback seguro
};

const BulkAbsenceGenerator: React.FC<BulkAbsenceGeneratorProps> = ({
  leave,
  onSuccess,
  onCancel
}) => {
  const { addAbsence, teachers, departments } = useAbsences();
  const { user } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [classesPerDay, setClassesPerDay] = useState('');

  // Substituição
  const [hasSubstitute, setHasSubstitute] = useState<'Sim' | 'Não'>('Não');
  const [substituteType, setSubstituteType] = useState<'Professor' | 'Tutor Substituto' | 'Outro' | ''>('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');
  const [substituteTeacherName, setSubstituteTeacherName] = useState<string>(''); // usado com Tutor
  const [substituteTeacherName2, setSubstituteTeacherName2] = useState<string>(''); // nome do Professor substituto
  const [substituteTeacherName3, setSubstituteTeacherName3] = useState<string>(''); // nome/cargo "Outro"
  const [substituteTotalClasses, setSubstituteTotalClasses] = useState<string>('');

  const teacher = teachers.find(t => t.id === leave.teacherId);
  const department = departments.find(d => d.id === teacher?.department);

  // Calculate the days that will be generated
  const allDays = eachDayOfInterval({
    start: parseISO(leave.startDate),
    end: parseISO(leave.endDate)
  });

  const workingDays = includeWeekends
    ? allDays
    : allDays.filter(day => !isWeekend(day));

  const handleGenerate = async () => {
    if (!user || !teacher || !department) return;
    
    const classesNum = parseInt(classesPerDay) / workingDays.length;
    if (isNaN(classesNum) || classesNum <= 0) {
      alert('Informe um número válido de aulas por dia.');
      setIsGenerating(false);
      return;
    }

    if (hasSubstitute === 'Sim') {
      const subNum = parseInt(substituteTotalClasses) / workingDays.length;
      if (isNaN(subNum) || subNum < 0) {
        alert('Informe um número válido de aulas substituídas.');
        setIsGenerating(false);
        return;
      }
      if (subNum > classesNum) {
        alert('As aulas substituídas não podem exceder as aulas faltadas.');
        setIsGenerating(false);
        return;
      }
      if (substituteType === 'Tutor Substituto' && !substituteTeacherId) {
        alert('Selecione o Tutor substituto.');
        setIsGenerating(false);
        return;
      }
      if (substituteType === 'Professor' && !substituteTeacherName2.trim()) {
        alert('Informe o nome do Professor substituto.');
        setIsGenerating(false);
        return;
      }
      if (substituteType === 'Outro' && !substituteTeacherName3.trim()) {
        alert('Informe o nome/cargo do substituto.');
        setIsGenerating(false);
        return;
      }
    }

    setIsGenerating(true);

    try {
      const promises = workingDays.map(day => {
        const reason = mapLeaveReasonToAbsenceReason(leave.reason); // usar o mapper

        const subTotal = hasSubstitute === 'Sim'
          ? parseInt(substituteTotalClasses) / workingDays.length
          : null;

        // Derivar campos de “quem substituiu”
        let subTeacherId = '';
        let subTeacherName = hasSubstitute === 'Não' ? 'Não' : '';
        let subType = hasSubstitute === 'Sim' ? substituteType : '';

        if (hasSubstitute === 'Sim') {
          if (substituteType === 'Professor') {
            subTeacherName = substituteTeacherName2;
          } else if (substituteType === 'Tutor Substituto') {
            subTeacherId = substituteTeacherId;
            subTeacherName = substituteTeacherName || substituteTeacherId; // mesmo padrão do form
          } else if (substituteType === 'Outro') {
            subTeacherName = substituteTeacherName3;
          }
        }

        const absenceData: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'> = {
          teacherId: leave.teacherId,
          teacherName: leave.teacherName,
          departmentId: teacher.department,
          departmentName: department.name,
          disciplinaId: department.disciplinaId,
          unit: teacher.unit,
          contractType: teacher.contractType,
          course: teacher.course,
          teachingPeriod: teacher.teachingPeriod,
          date: format(day, 'yyyy-MM-dd'),
          reason,
          notes: `Gerado automaticamente do afastamento: ${leave.reason}`,
          duration: 'Full Day' as any,
          classes: classesNum,

          // Substituição
          hasSubstitute,
          substituteType: subType,
          substituteTeacherId: subTeacherId || '',
          substituteTeacherName: subTeacherName || (hasSubstitute === 'Não' ? 'Não' : ''),
          substituteTeacherName2: substituteType === 'Professor' ? substituteTeacherName2 : '',
          substituteTeacherName3: substituteType === 'Outro' ? substituteTeacherName3 : '',
          substituteContent: hasSubstitute === 'Sim' ? 'Sim' : 'Não',
          substitute_total_classes: subTotal,
        };

        return addAbsence(absenceData);
      });

      await Promise.all(promises);
      onSuccess();
    } catch (error) {
      console.error('Error generating bulk absences:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card title="Gerar Faltas em Lote">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Afastamento Criado</h4>
              <p className="text-sm text-blue-700 mt-1">
                <strong>{leave.teacherName}</strong> - {leave.reason}
              </p>
              <p className="text-sm text-blue-700">
                Período: {format(parseISO(leave.startDate), 'dd/MM/yyyy')} até {format(parseISO(leave.endDate), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total de AULAS que o professor irá faltar
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={classesPerDay}
              onChange={(e) => setClassesPerDay(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              id="includeWeekends"
              type="checkbox"
              checked={includeWeekends}
              onChange={(e) => setIncludeWeekends(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeWeekends" className="ml-2 block text-sm text-gray-700">
              Incluir fins de semana
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {/* Houve substituto? */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Houve substituto?</label>
            <select
              value={hasSubstitute}
              onChange={(e) => {
                const v = e.target.value as 'Sim' | 'Não';
                setHasSubstitute(v);
                if (v === 'Não') {
                  setSubstituteType('');
                  setSubstituteTeacherId('');
                  setSubstituteTeacherName('');
                  setSubstituteTeacherName2('');
                  setSubstituteTeacherName3('');
                  setSubstituteTotalClasses('');
                }
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </select>
          </div>

          {/* Se Sim, quem substituiu? */}
          {hasSubstitute === 'Sim' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quem substituiu?</label>
                <select
                  value={substituteType}
                  onChange={(e) => {
                    setSubstituteType(e.target.value as any);
                    setSubstituteTeacherId('');
                    setSubstituteTeacherName('');
                    setSubstituteTeacherName2('');
                    setSubstituteTeacherName3('');
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="Professor">Professor</option>
                  <option value="Tutor Substituto">Tutor Substituto</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Professor substituto: nome livre */}
              {substituteType === 'Professor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Professor Substituto</label>
                  <input
                    type="text"
                    value={substituteTeacherName2}
                    onChange={(e) => setSubstituteTeacherName2(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Tutor Substituto: usa Select por unidade */}
              {substituteType === 'Tutor Substituto' && (
                <SubstituteSelect
                  value={substituteTeacherId}
                  onChange={(value) => {
                    setSubstituteTeacherId(value);
                    setSubstituteTeacherName(value); // mesmo padrão do form
                  }}
                  unit={teacher?.unit || ''}  // unidade do professor do afastamento
                  error={undefined}
                />
              )}

              {/* Outro: nome/cargo livre */}
              {substituteType === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome/Cargo do substituto</label>
                  <input
                    type="text"
                    value={substituteTeacherName3}
                    onChange={(e) => setSubstituteTeacherName3(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 sm:text-sm"
                  />
                </div>
              )}

              {/* Quantas aulas o substituto deu? */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantas aulas o substituto deu?</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={substituteTotalClasses}
                  onChange={(e) => setSubstituteTotalClasses(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Não pode exceder {classesPerDay} aulas neste dia.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Resumo da Geração</h4>
              <p className="text-sm text-gray-600 mt-1">
                Serão criados <strong>{workingDays.length} registros de falta</strong>
              </p>
              <p className="text-sm text-gray-600">
                Total de aulas: <strong>{(parseInt(classesPerDay) / workingDays.length).toFixed(2)} aulas</strong>
              </p>
            </div>
          </div>
        </div>

        {workingDays.length > 30 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Atenção</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Você está prestes a gerar mais de 30 registros. Esta operação pode demorar alguns segundos.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            isLoading={isGenerating}
          >
            Gerar {workingDays.length} Faltas
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BulkAbsenceGenerator;
