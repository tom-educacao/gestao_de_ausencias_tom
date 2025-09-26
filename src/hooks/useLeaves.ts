import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Leave } from '../types';

interface UseLeavesOptions {
  teacherId?: string;
  date?: string;
  status?: string;
}

interface UseLeavesReturn {
  leaves: Leave[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createLeave: (leave: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Leave>;
  updateLeave: (id: string, updates: Partial<Leave>) => Promise<void>;
}

export function useLeaves(options: UseLeavesOptions = {}): UseLeavesReturn {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leaves')
        .select(`
          *,
          teacher:teachers(
            id,
            profiles(name)
          )
        `)
        .order('start_date', { ascending: false });

      // Apply filters
      if (options.teacherId) {
        query = query.eq('teacher_id', options.teacherId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.date) {
        query = query
          .lte('start_date', options.date)
          .gte('end_date', options.date);
      }

      const { data, error: apiError } = await query;

      if (apiError) {
        throw apiError;
      }

      const transformedData: Leave[] = data.map((leave: any) => ({
        id: leave.id,
        teacherId: leave.teacher_id,
        teacherName: leave.teacher?.profiles?.name || '',
        startDate: leave.start_date,
        endDate: leave.end_date,
        reason: leave.reason,
        documentUrl: leave.document_url,
        status: leave.status,
        createdBy: leave.created_by,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at
      }));

      setLeaves(transformedData);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to load leaves. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const createLeave = async (leaveData: Omit<Leave, 'id' | 'createdAt' | 'updatedAt'>): Promise<Leave> => {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .insert({
          teacher_id: leaveData.teacherId,
          start_date: leaveData.startDate,
          end_date: leaveData.endDate,
          reason: leaveData.reason,
          document_url: leaveData.documentUrl,
          status: leaveData.status,
          created_by: leaveData.createdBy
        })
        .select(`
          *,
          teacher:teachers(
            id,
            profiles(name)
          )
        `)
        .single();

      if (error) throw error;

      const newLeave: Leave = {
        id: data.id,
        teacherId: data.teacher_id,
        teacherName: data.teacher?.profiles?.name || '',
        startDate: data.start_date,
        endDate: data.end_date,
        reason: data.reason,
        documentUrl: data.document_url,
        status: data.status,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setLeaves(prev => [newLeave, ...prev]);
      return newLeave;
    } catch (err) {
      console.error('Error creating leave:', err);
      throw err;
    }
  };

  const updateLeave = async (id: string, updates: Partial<Leave>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.endDate) dbUpdates.end_date = updates.endDate;
      if (updates.reason) dbUpdates.reason = updates.reason;
      if (updates.documentUrl !== undefined) dbUpdates.document_url = updates.documentUrl;
      if (updates.status) dbUpdates.status = updates.status;

      const { error } = await supabase
        .from('leaves')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setLeaves(prev => prev.map(leave => 
        leave.id === id ? { ...leave, ...updates } : leave
      ));
    } catch (err) {
      console.error('Error updating leave:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [options.teacherId, options.date, options.status]);

  return {
    leaves,
    loading,
    error,
    refetch: fetchLeaves,
    createLeave,
    updateLeave
  };
}