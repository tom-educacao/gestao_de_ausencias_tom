/*
  # Create database views

  1. New Views
    - `teacher_profiles_view`: Combines teacher and profile information
    - `absence_details_view`: Provides complete absence information with related data
  2. Purpose
    - Simplify queries for teacher data
    - Provide a comprehensive view of absence records with all related information
*/

-- View that combines teacher and profile information
CREATE OR REPLACE VIEW teacher_profiles_view AS
SELECT 
  t.id,
  t.profile_id,
  p.name,
  p.email,
  t.department_id,
  d.name AS department_name,
  p.role,
  t.created_at,
  t.updated_at
FROM 
  teachers t
JOIN 
  profiles p ON t.profile_id = p.id
JOIN 
  departments d ON t.department_id = d.id;

-- View that provides complete absence information
CREATE OR REPLACE VIEW absence_details_view AS
SELECT 
  a.id,
  a.teacher_id,
  tp.name AS teacher_name,
  tp.department_id,
  d.name AS department_name,
  a.date,
  a.reason,
  a.notes,
  a.substitute_teacher_id,
  sub_tp.name AS substitute_teacher_name,
  a.duration,
  a.start_time,
  a.end_time,
  a.created_by,
  cp.name AS created_by_name,
  a.created_at,
  a.updated_at
FROM 
  absences a
JOIN 
  teacher_profiles_view tp ON a.teacher_id = tp.id
JOIN 
  departments d ON tp.department_id = d.id
LEFT JOIN 
  teacher_profiles_view sub_tp ON a.substitute_teacher_id = sub_tp.id
JOIN 
  profiles cp ON a.created_by = cp.id;