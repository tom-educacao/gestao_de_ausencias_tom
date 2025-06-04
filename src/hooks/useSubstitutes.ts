import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Substitute } from '../types';

interface UseSubstitutesOptions {
  unit?: string;
  cacheTime?: number;
}

interface UseSubstitutesReturn {
  substitutes: Substitute[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const cache = new Map<string, { data: Substitute[]; timestamp: number }>();

export function useSubstitutes({ unit, cacheTime = 5 * 60 * 1000 }: UseSubstitutesOptions = {}): UseSubstitutesReturn {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `substitutes-${unit || 'all'}`;

  const fetchSubstitutes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setSubstitutes(cached.data);
        setLoading(false);
        return;
      }

      // Build query
      let query = supabase
        .from('substitutes')
        .select('*')
        .eq('active', true)
        .order('name');

      // Add unit filter if specified
      if (unit) {
        query = query.eq('unit', unit);
      }

      const { data, error: apiError } = await query;

      if (apiError) {
        throw apiError;
      }

      const transformedData = data.map((substitute): Substitute => ({
        id: substitute.id,
        name: substitute.name,
        unit: substitute.unit,
        active: substitute.active,
        createdAt: substitute.created_at,
        updatedAt: substitute.updated_at
      }));

      // Update cache
      cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      setSubstitutes(transformedData);
    } catch (err) {
      console.error('Error fetching substitutes:', err);
      setError('Failed to load substitutes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubstitutes();

    // Set up real-time subscription
    const subscription = supabase
      .channel('substitutes-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'substitutes'
      }, () => {
        // Clear cache and refetch on any changes
        cache.delete(cacheKey);
        fetchSubstitutes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [unit, cacheTime]);

  return {
    substitutes,
    loading,
    error,
    refetch: fetchSubstitutes
  };
}