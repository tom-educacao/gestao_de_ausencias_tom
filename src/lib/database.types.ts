export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'coordinator' | 'teacher'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'admin' | 'coordinator' | 'teacher'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'coordinator' | 'teacher'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          id: string
          profile_id: string
          department_id: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          department_id: string
          unit?: string | null
          contract_type?: string | null
          course?: string | null
          teaching_period?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          department_id?: string
          unit?: string | null
          contract_type?: string | null
          course?: string | null
          teaching_period?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      absences: {
        Row: {
          id: string
          teacher_id: string
          date: string
          reason: string
          notes: string | null
          substitute_teacher_id: string | null
          duration: 'Full Day' | 'Partial Day'
          start_time: string | null
          end_time: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          date: string
          reason: string
          notes?: string | null
          substitute_teacher_id?: string | null
          duration: 'Full Day' | 'Partial Day'
          start_time?: string | null
          end_time?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          date?: string
          reason?: string
          notes?: string | null
          substitute_teacher_id?: string | null
          duration?: 'Full Day' | 'Partial Day'
          start_time?: string | null
          end_time?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_substitute_teacher_id_fkey"
            columns: ["substitute_teacher_id"]
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      teacher_profiles_view: {
        Row: {
          id: string
          profile_id: string
          name: string
          email: string
          department_id: string
          department_name: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      absence_details_view: {
        Row: {
          id: string
          teacher_id: string
          teacher_name: string
          department_id: string
          department_name: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          date: string
          reason: string
          notes: string | null
          substitute_teacher_id: string | null
          substitute_teacher_name: string | null
          duration: string
          start_time: string | null
          end_time: string | null
          created_by: string
          created_by_name: string
          created_at: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_teacher_id_fkey"
            columns: ["teacher_id"]
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_substitute_teacher_id_fkey"
            columns: ["substitute_teacher_id"]
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      get_teacher_absences: {
        Args: {
          teacher_id_param: string
        }
        Returns: {
          id: string
          teacher_id: string
          teacher_name: string
          department_id: string
          department_name: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          date: string
          reason: string
          notes: string | null
          substitute_teacher_id: string | null
          substitute_teacher_name: string | null
          duration: string
          start_time: string | null
          end_time: string | null
          created_by: string
          created_by_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_department_absences: {
        Args: {
          department_id_param: string
        }
        Returns: {
          id: string
          teacher_id: string
          teacher_name: string
          department_id: string
          department_name: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          date: string
          reason: string
          notes: string | null
          substitute_teacher_id: string | null
          substitute_teacher_name: string | null
          duration: string
          start_time: string | null
          end_time: string | null
          created_by: string
          created_by_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_absences_by_date_range: {
        Args: {
          start_date: string
          end_date: string
        }
        Returns: {
          id: string
          teacher_id: string
          teacher_name: string
          department_id: string
          department_name: string
          unit: string | null
          contract_type: string | null
          course: string | null
          teaching_period: string | null
          date: string
          reason: string
          notes: string | null
          substitute_teacher_id: string | null
          substitute_teacher_name: string | null
          duration: string
          start_time: string | null
          end_time: string | null
          created_by: string
          created_by_name: string
          created_at: string
          updated_at: string
        }[]
      }
      get_monthly_absence_stats: {
        Args: {
          year_param: number
          month_param: number
        }
        Returns: {
          department_id: string
          department_name: string
          absence_count: bigint
        }[]
      }
    }
  }
}