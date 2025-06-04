import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get user profile from Supabase
export const getUserProfile = async (firebaseUid: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', firebaseUid)
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Create or update user profile in Supabase
export const upsertUserProfile = async (
  id: string,
  name: string,
  email: string,
  role: 'admin' | 'coordinator' | 'teacher'
) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: id,
        name,
        email,
        role
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
};

// Delete user profile from Supabase
export const deleteUserProfile = async (firebaseUid: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', firebaseUid);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};