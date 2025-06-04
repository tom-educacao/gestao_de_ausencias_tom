import React, { createContext, useContext, useState, useEffect } from 'react';
import { Absence, Teacher, Department, Substitute } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AbsenceContextType {
  absences: Absence[];
  teachers: Teacher[];
  departments: Department[];
  substitutes: Substitute[];
  addAbsence: (absence: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAbsence: (id: string, absence: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const AbsenceContext = createContext<AbsenceContextType | undefined>(undefined);

export const AbsenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [substitutes, setSubstitutes] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

const fetchData = async () => {
  setLoading(true);
  setError(null);

  try {
    // Fetch departments
    const { data: departmentsData, error: departmentsError } = await supabase
      .from('departments')
      .select('*');

    const { data: substitutesData} = await supabase
      .from('substitutes')
      .select('*');

    if (departmentsError) throw departmentsError;

    // Fetch teachers with their profiles and department info
    const { data: teachersData, error: teachersError } = await supabase
      .from('teachers')
      .select(`
        id,
        profile_id,
        department_id,
        unit,
        contract_type,
        course,
        teaching_period,
        profiles(name, email),
        departments(name)
      `)
      .range(0, 4999);

    if (teachersError) throw teachersError;

    // Fetch absences with all related info
    const { data: absencesData, error: absencesError } = await supabase
      .from('absences')
      .select(`
        id,
        teacher_id,
        department_id,
        name,
        date,
        reason,
        notes,
        substitute_teacher_id,
        substitute_teacher_name2,
        substitute_teacher_name3,
        substituteContent,
        duration,
        start_time,
        end_time,
        created_by,
        created_at,
        updated_at,
        teachingPeriod,
        contract_type,
        classes,
        course,
        teacher:teachers(id, unit, contract_type, course, teaching_period, profiles(name), departments(id, name)),
        substitute:teachers(id, profiles(name)),
        substitutes:substitutes(id, name)
      `)
      .order('date', { ascending: false });

    if (absencesError) throw absencesError;

    // Transform data to match our types
    const transformedDepartments: Department[] = departmentsData.map(dept => ({
      id: dept.id,
      name: dept.name
    }));

    const transformedTeachers: Teacher[] = teachersData.map(teacher => ({
      id: teacher.id,
      name: teacher.profiles?.name || '',
      department: teacher.department_id,
      email: teacher.profiles?.email || '',
      unit: teacher.unit || undefined,
      contractType: teacher.contract_type || undefined,
      course: teacher.course || undefined,
      teachingPeriod: teacher.teachingPeriod || undefined
    }));

    const transformedAbsences: Absence[] = absencesData.map(absence => ({
      id: absence.id,
      teacherId: absence.teacher_id,
      teacherName: absence.teacher?.profiles?.name || '',
      departmentId: absence.department_id || '',
      departmentName: absence.name || '',
      unit: absence.teacher?.unit || undefined,
      contractType: absence.contract_type || absence.teacher?.contract_type || undefined,
      course: absence.course || undefined,
      teachingPeriod: absence.teachingPeriod || undefined,
      date: absence.date,
      reason: absence.reason as any,
      notes: absence.notes || undefined,
      substituteTeacherId: absence.substitute_teacher_id || undefined,
      substituteTeacherName: absence.substitutes?.name || undefined,
      substituteTeacherName2: absence.substitute_teacher_name2 || undefined,
      substituteTeacherName3: absence.substitute_teacher_name3 || undefined,
      substituteContent: absence.substituteContent || undefined,
      duration: absence.duration as any,
      startTime: absence.start_time || undefined,
      endTime: absence.end_time || undefined,
      classes: absence.classes,
      createdAt: absence.created_at,
      updatedAt: absence.updated_at
    }));

    setDepartments(transformedDepartments);
    setTeachers(transformedTeachers);
    setAbsences(transformedAbsences);
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Failed to load data. Please try again later.');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for absences
    const absencesSubscription = supabase
      .channel('absences-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'absences' 
      }, () => {
        // Refetch data when changes occur
        fetchData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(absencesSubscription);
    };
  }, []);

  const addAbsence = async (absence: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add an absence');
    }
    
    try {
      // Ensure duration is exactly one of the allowed values
      const duration = absence.duration === 'Full Day' ? 'Full Day' : 'Partial Day';
      
      // Insert into the absences table
      const { data, error } = await supabase
        .from('absences')
        .insert({
          teacher_id: absence.teacherId,
          date: absence.date,
          reason: absence.reason,
          notes: absence.notes || null,
          substitute_teacher_id: absence.substituteTeacherId || null,
          substitute_teacher_name2: absence.substituteTeacherName2 || null,
          substitute_teacher_name3: absence.substituteTeacherName3 || null,
          duration: duration,
          course: absence.course,
          start_time: duration === 'Partial Day' ? absence.startTime : null,
          end_time: duration === 'Partial Day' ? absence.endTime : null,
          created_by: user.id,
          contract_type: absence.contractType,
          department_id: absence.departmentId,
          name: absence.departmentName,
          classes: absence.classes,
          teachingPeriod: absence.teachingPeriod,
          substituteContent: absence.substituteContent,
        })
        .select();
      
      if (error) {
        console.error("Error adding absence:", error);
        throw error;
      }
      
      // Refetch to get the updated data
      await fetchData();
    } catch (err) {
      console.error('Error adding absence:', err);
      throw err;
    }
  };

  const updateAbsence = async (id: string, updatedFields: Partial<Absence>) => {
    try {
      // Map our types to database column names
      const dbFields: any = {};
      
      if (updatedFields.teacherId) dbFields.teacher_id = updatedFields.teacherId;
      if (updatedFields.date) dbFields.date = updatedFields.date;
      if (updatedFields.reason) dbFields.reason = updatedFields.reason;
      if ('notes' in updatedFields) dbFields.notes = updatedFields.notes || null;
      if ('substituteTeacherId' in updatedFields) {
        dbFields.substitute_teacher_id = updatedFields.substituteTeacherId || null;
      }
      
      // Ensure duration is exactly one of the allowed values
      if (updatedFields.duration) {
        dbFields.duration = updatedFields.duration === 'Full Day' ? 'Full Day' : 'Partial Day';
      }
      
      // Only include time fields if duration is Partial Day
      if ('startTime' in updatedFields) {
        dbFields.start_time = (updatedFields.duration === 'Partial Day' || 
                              (updatedFields.duration === undefined && 
                               absences.find(a => a.id === id)?.duration === 'Partial Day')) 
                              ? updatedFields.startTime : null;
      }
      
      if ('endTime' in updatedFields) {
        dbFields.end_time = (updatedFields.duration === 'Partial Day' || 
                            (updatedFields.duration === undefined && 
                             absences.find(a => a.id === id)?.duration === 'Partial Day')) 
                            ? updatedFields.endTime : null;
      }
      
      // Update the absence
      const { error } = await supabase
        .from('absences')
        .update(dbFields)
        .eq('id', id);
      
      if (error) {
        console.error("Error updating absence:", error);
        throw error;
      }
      
      // Refetch to get the updated data
      await fetchData();
    } catch (err) {
      console.error('Error updating absence:', err);
      throw err;
    }
  };

  const deleteAbsence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setAbsences(prev => prev.filter(absence => absence.id !== id));
    } catch (err) {
      console.error('Error deleting absence:', err);
      throw err;
    }
  };

  return (
    <AbsenceContext.Provider 
      value={{ 
        absences, 
        teachers, 
        departments, 
        addAbsence, 
        updateAbsence, 
        deleteAbsence, 
        loading,
        error,
        refetch: fetchData
      }}
    >
      {children}
    </AbsenceContext.Provider>
  );
};

export const useAbsences = (): AbsenceContextType => {
  const context = useContext(AbsenceContext);
  if (context === undefined) {
    throw new Error('useAbsences must be used within an AbsenceProvider');
  }
  return context;
};