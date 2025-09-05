import React, { useState, useEffect } from 'react';
import { useAbsences } from '../context/AbsenceContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import AbsenceList from '../components/absence/AbsenceList';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Calendar, Users, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Absence } from '../types';

const Dashboard: React.FC = () => {
  const { absences, teachers, departments, loading } = useAbsences();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [selectedUnit, setSelectedUnit] = useState<string>('Todas');
  const allUnits = Array.from(new Set(absences.map(abs => abs.unit).filter(Boolean))).sort();

  // Calculate date range for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Filter absences for current month
  const currentMonthAbsences = absences.filter(
    absence => absence.date >= monthStartStr && absence.date <= monthEndStr
  );

  const availableMonths = Array.from(
    new Set(
      absences
        .map(abs => format(parseISO(abs.date), 'yyyy-MM'))
    )
  ).sort().reverse();

  // Calculate statistics
  const totalTeachers = 3348;
  const teachersAbsentThisMonth = new Set(currentMonthAbsences.map(a => a.teacherId)).size;
  const absentPercentage = totalTeachers > 0 
    ? Math.round((teachersAbsentThisMonth / totalTeachers) * 100) 
    : 0;

  // Department with most absences this month
  const departmentCounts = currentMonthAbsences.reduce((acc, absence) => {
    acc[absence.departmentId] = (acc[absence.departmentId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let highestDeptId = '';
  let highestCount = 0;
  
  Object.entries(departmentCounts).forEach(([deptId, count]) => {
    if (count > highestCount) {
      highestCount = count;
      highestDeptId = deptId;
    }
  });

  const highestDept = departments.find(d => d.id === highestDeptId);

const filteredAndSortedAbsences = [...absences]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .filter(absence => {
    if (selectedUnit !== 'Todas' && absence.unit !== selectedUnit) return false;
    if (selectedMonth) {
      const d = parseISO(absence.date);
      return d >= startOfMonth(selectedMonth) && d <= endOfMonth(selectedMonth);
    }
    return true;
  });

  // Get recent absences (last 5) from filtered list
  const recentAbsences = filteredAndSortedAbsences;

const [page, setPage] = useState(1);
const pageSize = 500;
const totalItems = recentAbsences.length;
const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
const paginatedAbsences = recentAbsences.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [selectedUnit, selectedMonth]);

  // Navigate between months
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleViewAbsence = (absence: Absence) => {
    setSelectedAbsence(absence);
    console.log(absence)
  };

  interface AbsenceListProps {
    title: string;
    absences: Absence[];
    onView: (absence: Absence) => void;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral dos professores e estatísticas
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          Estatísticas para {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-blue-50 border border-blue-100">
          <div className="flex items-start">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total de Faltas</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {currentMonthAbsences.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Este Mês
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border border-green-100">
          <div className="flex items-start">
            <div className="p-3 bg-green-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Faltas dos Professores</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {teachersAbsentThisMonth} <span className="text-sm text-gray-500">de {totalTeachers}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {absentPercentage}% do corpo docente
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-purple-50 border border-purple-100">
          <div className="flex items-start">
            <div className="p-3 bg-purple-500 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Departamento</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {highestDept?.name || 'None'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Mais Faltas ({highestCount})
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-amber-50 border border-amber-100">
          <div className="flex items-start">
            <div className="p-3 bg-amber-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-amber-600">Atividades Recentes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {recentAbsences.length}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Novos registros de faltas
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent absences with filter */}
      <div className="mb-6">
        <div className="mb-4">
          <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Unidade:
          </label>
          <select
            id="unit-select"
            className="mt-1 block w-full max-w-xs border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="Todas">Todas</option>
            {allUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Mês:
          </label>
          <select
            id="month-select"
            className="mt-1 block w-full max-w-xs border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={selectedMonth ? format(selectedMonth, 'yyyy-MM') : ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedMonth(val ? parseISO(val + '-01') : null);
            }}
          >
            <option value="">Todos os Meses</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{format(parseISO(month + '-01'), 'MMMM yyyy')}</option>
            ))}
          </select>
        </div>

      {/* Controles de paginação acima da lista */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          Página {page} de {totalPages} — exibindo {(paginatedAbsences.length)} de {totalItems} registros
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === 1}
          >
            Anterior
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === totalPages}
          >
            Próxima
          </button>
        </div>
      </div>

      <AbsenceList
        title={`Faltas Recentes ${selectedUnit !== 'Todas' ? `- ${selectedUnit}` : ''}`}
        absences={paginatedAbsences} // agora exibe só 500 por página
        onView={handleViewAbsence}
      />
      </div>
      {/* Controles de paginação abaixo também (opcional) */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage(1)} className="px-3 py-1 border rounded" disabled={page===1}>Primeira</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded" disabled={page===1}>Anterior</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded" disabled={page===totalPages}>Próxima</button>
          <button onClick={() => setPage(totalPages)} className="px-3 py-1 border rounded" disabled={page===totalPages}>Última</button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;