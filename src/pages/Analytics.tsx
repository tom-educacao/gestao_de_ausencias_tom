import React, { useState, useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAbsences } from '../context/AbsenceContext';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { Absence } from '../types';
import { useSubstitutes } from '../hooks/useSubstitutes';

const Analytics: React.FC = () => {
  const { absences, teachers, departments } = useAbsences();
  const { substitutes, loading, error: substituteError } = useSubstitutes();
  const [filters, setFilters] = useState({
    teacherId: '',
    departmentId: '',
    unit: '',
    contractType: '',
    course: '',
    teachingPeriod: '',
    startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  // Apply filters
  const filteredAbsences = useMemo(() => {
    return absences.filter(absence => {
      if (filters.teacherId && absence.teacherId !== filters.teacherId) return false;
      if (filters.departmentId && absence.departmentId !== filters.departmentId) return false;
      if (filters.unit && absence.unit !== filters.unit) return false;
      if (filters.contractType && absence.contractType !== filters.contractType) return false;
      if (filters.course && absence.course !== filters.course) return false;
      if (filters.teachingPeriod && absence.teachingPeriod !== filters.teachingPeriod) return false;
      if (filters.reason && absence.reason !== filters.reason) return false;
      if (filters.startDate && absence.date < filters.startDate) return false;
      if (filters.endDate && absence.date > filters.endDate) return false;
      return true;
    });
  }, [absences, filters]);

  // Reset filters
  const resetFilters = () => {
    setFilters({
      teacherId: '',
      departmentId: '',
      unit: '',
      contractType: '',
      course: '',
      teachingPeriod: '',
      startDate: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
    });
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Data for monthly absences bar chart
  const monthlyData = useMemo(() => {
    const startDate = parseISO(filters.startDate);
    const endDate = parseISO(filters.endDate);
    
    // Get all months in the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthStartStr = format(monthStart, 'yyyy-MM-dd');
      const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
      
      const count = filteredAbsences.filter(
        absence => absence.date >= monthStartStr && absence.date <= monthEndStr
      ).length;
      
      return {
        name: format(month, 'MMM yyyy'),
        count,
      };
    });
  }, [filteredAbsences, filters.startDate, filters.endDate]);

  // Data for department distribution pie chart
  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    
    filteredAbsences.forEach(absence => {
      deptCounts[absence.departmentId] = (deptCounts[absence.departmentId] || 0) + 1;
    });
    
    return Object.entries(deptCounts).map(([deptId, count]) => {
      const department = departments.find(d => d.id === deptId);
      return {
        name: department?.name || 'Unknown',
        value: count,
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredAbsences, departments]);

  // Data for unit distribution
  const unitData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    
    filteredAbsences.forEach(absence => {
      const unit = absence.unit || 'Not Specified';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    
    return Object.entries(unitCounts).map(([unit, count]) => {
      return {
        name: unit,
        count,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredAbsences]);

  // Data for reason distribution
  const reasonData = useMemo(() => {
    const reasonCounts: Record<string, number> = {};
    
    filteredAbsences.forEach(absence => {
      reasonCounts[absence.reason] = (reasonCounts[absence.reason] || 0) + 1;
    });
    
    return Object.entries(reasonCounts).map(([reason, count]) => {
      return {
        name: reason,
        count,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredAbsences]);

  // Data for Duration X Unit
  const durationByUnitData = useMemo(() => {
    const unitDuration: Record<string, number> = {};
  
    filteredAbsences.forEach(absence => {
      const unit = absence.unit || 'Not Specified';
      unitDuration[unit] = (unitDuration[unit] || 0) + (absence.classes || 0);
    });
  
    return Object.entries(unitDuration).map(([unit, totalDuration]) => {
      return {
        name: unit,
        totalDuration,
      };
    }).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [filteredAbsences]);

  // Data for Duration X Teacher
  const durationByTeacherData = useMemo(() => {
    const teacherDuration: Record<string, number> = {};
  
    filteredAbsences.forEach(absence => {
      const teacherId = absence.teacherId;
      teacherDuration[teacherId] = (teacherDuration[teacherId] || 0) + (absence.classes || 0);
    });
  
    return Object.entries(teacherDuration).map(([teacherId, totalDuration]) => {
      const teacher = teachers.find(t => t.id === teacherId);
      return {
        name: teacher?.name || 'Unknown',
        totalDuration,
      };
    }).sort((a, b) => b.totalDuration - a.totalDuration);
  }, [filteredAbsences, teachers]);


  // Teacher absence frequency
  const teacherFrequency = useMemo(() => {
    const teacherCounts: Record<string, number> = {};
    
    filteredAbsences.forEach(absence => {
      teacherCounts[absence.teacherId] = (teacherCounts[absence.teacherId] || 0) + 1;
    });
    
    return Object.entries(teacherCounts)
      .map(([teacherId, count]) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return {
          id: teacherId,
          name: teacher?.name || 'Unknown',
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 teachers
  }, [filteredAbsences, teachers]);

  // Data for Contract Type Distribution Pie Chart
  const contractTypeData = useMemo(() => {
    const contractCounts: Record<string, number> = {};

    filteredAbsences.forEach(absence => {
      contractCounts[absence.contractType] = (contractCounts[absence.contractType] || 0) + 1;
    });

    const total = Object.values(contractCounts).reduce((acc, count) => acc + count, 0);

    return Object.entries(contractCounts).map(([contractType, count]) => {
      return {
        name: `${contractType} (${((count / total) * 100).toFixed(2)}%)`,
        value: count,
      };
    });
  }, [filteredAbsences]);

  // Data for absences by teaching period and unit by teacher
  const absencesByTeachingPeriod = useMemo(() => {
    const periodCounts: Record<string, Record<string, Record<string, number>>> = {}; // {unit: {teacherId: {teachingPeriod: count}}}
  
    filteredAbsences.forEach(absence => {
      const { unit, teacherId, teachingPeriod } = absence;
      if (!periodCounts[unit]) periodCounts[unit] = {};
      if (!periodCounts[unit][teacherId]) periodCounts[unit][teacherId] = { Morning: 0, Afternoon: 0, Evening: 0 };
      periodCounts[unit][teacherId][teachingPeriod] += 1;
    });
  
    // Convert the data into a format suitable for the BarChart
    const chartData = [];
    Object.entries(periodCounts).forEach(([unit, teachers]) => {
      Object.entries(teachers).forEach(([teacherId, periods]) => {
        chartData.push({
          unit,
          teacher: teachers[teacherId],
          morning: periods.Morning,
          afternoon: periods.Afternoon,
          evening: periods.Evening,
        });
      });
    });
    return chartData;
  }, [filteredAbsences]);

  const absencesGroupedByUnitAndTeacher = useMemo(() => {
    const groupedData: Record<string, Record<string, Record<string, number>>> = {};
  
    filteredAbsences.forEach(absence => {
      const { unit, teacherId, teachingPeriod } = absence;
      const key = `${unit}-${teacherId}-${teachingPeriod}`;
  
      if (!groupedData[key]) {
        groupedData[key] = { count: 0, teacherName: teachers.find(t => t.id === teacherId)?.name || 'Unknown' };
      }
  
      groupedData[key].count += 1;
    });
  
    return Object.values(groupedData).map(item => ({
      teacherName: item.teacherName,
      unit: item.unit,
      teachingPeriod: item.teachingPeriod,
      count: item.count
    }));
  }, [filteredAbsences, teachers]);

  const absencesGroupedByUnit = useMemo(() => {
    const groupedData: Record<string, Array<{ teacherName: string, teachingPeriod: string, totalClasses: number }>> = {};
  
    filteredAbsences.forEach(absence => {
      const { unit, teacherId, teachingPeriod, classes } = absence; // Pegando o campo classes diretamente
      const teacher = teachers.find(t => t.id === teacherId);
  
      if (teacher) {
        const key = unit;
        if (!groupedData[key]) {
          groupedData[key] = [];
        }
  
        // Verificando se já existe o professor na lista para a unidade e o turno
        const existing = groupedData[key].find(
          item => item.teacherName === teacher.name && item.teachingPeriod === teachingPeriod
        );
  
        if (existing) {
          // Caso já exista, somamos as aulas (campo classes)
          existing.totalClasses += classes;  // Adiciona o número de aulas de faltas
        } else {
          // Caso não exista, criamos o registro com o número de aulas
          groupedData[key].push({ teacherName: teacher.name, teachingPeriod, totalClasses: classes });
        }
      }
    });
  
    // Filtrando para mostrar apenas as unidades que possuem faltas
    return Object.entries(groupedData)
      .filter(([unit, data]) => data.length > 0)
      .map(([unit, data]) => ({
        unit,
        data
      }));
  }, [filteredAbsences, teachers]);

  const substitutionData = useMemo(() => {
    const withSubstitution = filteredAbsences.filter(abs => abs.substituteTeacherName).length;
    const withSubstitution2 = filteredAbsences.filter(abs => abs.substituteTeacherName2).length;
    const withSubstitution3 = filteredAbsences.filter(abs => abs.substituteTeacherName3).length;
    const withoutSubstitution = filteredAbsences.filter(abs => !abs.substituteTeacherName && !abs.substituteTeacherName2 && !abs.substituteTeacherName3).length;

    const withSum = withSubstitution + withSubstitution2 + withSubstitution3
  
    return [
      { name: 'Com Substituição', value: withSum },
      { name: 'Sem Substituição', value: withoutSubstitution },
    ];
  }, [filteredAbsences]);

  const substitutionTypeData = useMemo(() => {
    let tutorCount = 0;
    let professorCount = 0;
    let otherCount = 0;
  
    filteredAbsences.forEach(abs => {
      if (abs.substituteTeacherName) {
        tutorCount += 1;
      } else if (abs.substituteTeacherName3) {
        otherCount += 1;
      } else if (abs.substituteTeacherName2) {
        professorCount += 1;
      }
    });
  
    return [
      { name: 'Tutor', value: tutorCount },
      { name: 'Professor', value: professorCount },
      { name: 'Outro', value: otherCount },
    ];
  }, [filteredAbsences]);


  const substitutionContent = useMemo(() => {
    let yes = 0;
    let no = 0;

    
    filteredAbsences.forEach(abs => {
      if (abs.substituteContent === "Sim") {
        yes += 1;
      } else if (abs.substituteContent === "Não") {
        no += 1;
      }
    });
  
    return [
      { name: 'Sim', value: yes },
      { name: 'Não', value: no },
    ];
  }, [filteredAbsences]);


  const absencesGroupedByPeriod = useMemo(() => {
    const groupedData: Record<string, Array<{ teacherName: string, unit: string, totalClasses: number }>> = {
      Morning: [],
      Afternoon: [],
      Night: [],
    };
  
    filteredAbsences.forEach(absence => {
      const { unit, teacherId, teachingPeriod, classes } = absence; // Pegando o campo classes diretamente
      const teacher = teachers.find(t => t.id === teacherId);
  
      if (teacher) {
        // Verificando o período de ensino (Manhã, Tarde ou Noite)
        if (groupedData[teachingPeriod]) {
          // Agrupa as faltas por período e unidade
          const existing = groupedData[teachingPeriod].find(
            item => item.teacherName === teacher.name && item.unit === unit
          );
  
          if (existing) {
            // Caso já exista, somamos as aulas
            existing.totalClasses += classes; 
          } else {
            // Caso não exista, criamos o registro
            groupedData[teachingPeriod].push({ teacherName: teacher.name, unit, totalClasses: classes });
          }
        }
      }
    });
  
    // Retorna os dados agrupados por período
    return groupedData;
  }, [filteredAbsences, teachers]);



  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Análises</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analise padrões e tendências de ausência
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="text-gray-500 mr-2" />
          <h2 className="text-lg font-medium">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Select
            label="Professor"
            id="teacherId"
            name="teacherId"
            value={filters.teacherId}
            onChange={(value) => setFilters(prev => ({ ...prev, teacherId: value }))}
            options={teachers.map(teacher => ({
              value: teacher.id,
              label: teacher.name,
            }))}
          />
          
          <Select
            label="Departamento"
            id="departmentId"
            name="departmentId"
            value={filters.departmentId}
            onChange={(value) => setFilters(prev => ({ ...prev, departmentId: value }))}
            options={departments.map(dept => ({
              value: dept.id,
              label: dept.name,
            }))}
          />
          
          <Select
            label="Unidade"
            id="unit"
            name="unit"
            value={filters.unit}
            onChange={(value) => setFilters(prev => ({ ...prev, unit: value }))}
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
          />
          
          <Select
            label="Categoria"
            id="contractType"
            name="contractType"
            value={filters.contractType}
            onChange={(value) => setFilters(prev => ({ ...prev, contractType: value }))}
            options={[
              { value: 'GPES', label: 'GPES' },
              { value: 'MUN', label: 'MUN' },
              { value: 'QFEB', label: 'QFEB' },
              { value: 'QPM', label: 'QPM' },
              { value: 'REPR', label: 'REPR' },
              { value: 'S100', label: 'S100' },
              { value: 'SC02', label: 'SC02' }
            ]}
          />
          
          <Select
            label="Curso"
            id="course"
            name="course"
            value={filters.course}
            onChange={(value) => setFilters(prev => ({ ...prev, course: value }))}
            options={[
              { value: 'Ensino Médio', label: 'Ensino Médio' },
              { value: 'Anos Finais', label: 'Anos Finais' },
              { value: 'Outros', label: 'Outros' },
            ]}
          />
          
          <Select
            label="Período"
            id="teachingPeriod"
            name="teachingPeriod"
            value={filters.teachingPeriod}
            onChange={(value) => setFilters(prev => ({ ...prev, teachingPeriod: value }))}
            options={[
              { value: 'Morning', label: 'Manhã' },
              { value: 'Afternoon', label: 'Tarde' },
              { value: 'Evening', label: 'Noite' },
            ]}
          />
          
          <Select
            label="Razão"
            id="reason"
            name="reason"
            value={filters.reason}
            onChange={(value) => setFilters(prev => ({ ...prev, reason: value }))}
            options={[
              { value: 'Licença médica', label: 'Licença médica' },
              { value: 'Personal Leave', label: 'Licença Pessoal' },
              { value: 'Professional Development', label: 'Desenvolvimento Profissional' },
              { value: 'Conference', label: 'Conferência' },
              { value: 'Emergência Familiar', label: 'Emergência Familiar' },
              { value: 'Demissao', label: 'Demissão' },
              { value: 'Other', label: 'Outro' },
            ]}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Data de início"
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            icon={<Calendar size={18} className="text-gray-400" />}
          />
          
          <Input
            label="Data fim"
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            icon={<Calendar size={18} className="text-gray-400" />}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={resetFilters}
            icon={<RefreshCw size={16} />}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-medium mb-2">Total de Faltas</h3>
          <p className="text-3xl font-bold">{filteredAbsences.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {format(parseISO(filters.startDate), 'MMM d, yyyy')} - {format(parseISO(filters.endDate), 'MMM d, yyyy')}
          </p>
        </Card>
        
        <Card>
          <h3 className="text-lg font-medium mb-2">Professores Afetados</h3>
          <p className="text-3xl font-bold">
            {new Set(filteredAbsences.map(a => a.teacherId)).size}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {((new Set(filteredAbsences.map(a => a.teacherId)).size / teachers.length) * 100).toFixed(1)}% do corpo docente
          </p>
        </Card>
        
        <Card>
          <h3 className="text-lg font-medium mb-2">Departamentos Afetados</h3>
          <p className="text-3xl font-bold">
            {new Set(filteredAbsences.map(a => a.departmentId)).size}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {((new Set(filteredAbsences.map(a => a.departmentId)).size / departments.length) * 100).toFixed(1)}% dos departamentos
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        {/* Monthly Trend */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Tendência Mensal de Ausências</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Absences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Department Distribution */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Distribuição do Departamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} absences`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Unit Distribution */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Distribuição por Unidade</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={unitData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" name="Absences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Reason Distribution */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Razão das Faltas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasonData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Absences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-medium mb-4">Aulas com vs sem Substituição</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={substitutionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#82ca9d"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {substitutionData.map((entry, index) => (
                    <Cell key={`cell-sub-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} aulas`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-medium mb-4">Substituições por Tipo de Substituto</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={substitutionTypeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FF8042" name="Total de Substituições" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        <Card>
          <h3 className="text-lg font-medium mb-4">
            Substitutos seguiram ou não o conteúdo do professor em sua ausência
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={substitutionContent}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        {/* Teacher Frequency */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Top 10 professores por frequência de ausência</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherFrequency}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" name="Absences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Duração X Professor */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Duração X Professor</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={durationByTeacherData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="totalDuration" fill="#FF8042" name="Duração Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>


        {/* Duration X Unit */}
        <Card>
          <h3 className="text-lg font-medium mb-4">Duração X Unidade</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={durationByUnitData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="totalDuration" fill="#FF8042" name="Duração Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contract Type Pie Chart */}
        <Card>
          <h2 className="text-lg font-medium mb-4">Distribuição por Tipo de Contrato</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contractTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name }) => name}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {contractTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-medium mb-4">Total de Aulas por Período</h3>
        {/* Exibindo o nome da unidade */}
        <h3 className="text-lg font-medium mb-4">
          {filteredAbsences.length > 0 ? filteredAbsences[0].unit : 'Unidade Não Definida'}
        </h3>
        <div className="space-y-6">
          {['Morning', 'Afternoon', 'Night'].map(period => (
            <div key={period}>
              <h4 className="text-xl font-semibold mb-4">Período: {period}</h4>
              {absencesGroupedByPeriod[period].length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={absencesGroupedByPeriod[period]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="teacherName" />
                      <YAxis />
                      <Tooltip content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const { teacherName, unit, totalClasses } = payload[0].payload;
                          
                          // Calcular o total da unidade
                          const totalClassesUnit = absencesGroupedByPeriod[period]
                            .filter(item => item.unit === unit)  // Filtra por unidade
                            .reduce((sum, item) => sum + item.totalClasses, 0);  // Soma as aulas
      
                          // Calcular o percentual
                          const totalPercent = (totalClasses * 100) / totalClassesUnit;
      
                          return (
                            <div>
                              <p><strong>Professor:</strong> {teacherName}</p>
                              <p><strong>Unidade:</strong> {unit}</p>
                              <p><strong>Total de Aulas:</strong> {totalClasses}</p>
                              <p><strong>Total da Unidade:</strong> {totalClassesUnit}</p>
                              <p><strong>Total Percentual da Unidade:</strong> {totalPercent.toFixed(2)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="totalClasses" fill="#82ca9d" name="Total de Aulas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>Sem faltas para este período.</p>
              )}
            </div>
          ))}
        </div>
      </Card>


      </div>
    </Layout>
  );
};

export default Analytics;
