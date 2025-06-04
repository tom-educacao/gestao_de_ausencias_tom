/*
  # Add teacher profile fields

  1. New Columns
    - `unit` - The teacher's unit of activity
    - `contract_type` - The teacher's contract regime (CLT or QPM)
    - `course` - The course the teacher teaches
    - `teaching_period` - The period in which the teacher teaches classes
  
  2. View Updates
    - Update views to include new fields
    - Preserve function dependencies
*/

-- Add new columns to the teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contract_type TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teaching_period TEXT;

-- Drop the existing views and dependent functions with CASCADE
DROP VIEW IF EXISTS absence_details_view CASCADE;
DROP VIEW IF EXISTS teacher_profiles_view CASCADE;

-- Recreate the teacher_profiles_view with the new columns
CREATE VIEW teacher_profiles_view AS
SELECT 
  t.id,
  t.profile_id,
  p.name,
  p.email,
  t.department_id,
  d.name AS department_name,
  p.role,
  t.unit,
  t.contract_type,
  t.course,
  t.teaching_period,
  t.created_at,
  t.updated_at
FROM 
  teachers t
JOIN 
  profiles p ON t.profile_id = p.id
JOIN 
  departments d ON t.department_id = d.id;

-- Recreate the absence_details_view with the new columns
CREATE VIEW absence_details_view AS
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
  tp.unit,
  tp.contract_type,
  tp.course,
  tp.teaching_period,
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

-- Recreate the functions that depend on the views
-- Function to get absences for a specific teacher
CREATE OR REPLACE FUNCTION get_teacher_absences(teacher_id_param UUID)
RETURNS SETOF absence_details_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM absence_details_view
  WHERE teacher_id = teacher_id_param
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get absences for a specific department
CREATE OR REPLACE FUNCTION get_department_absences(department_id_param UUID)
RETURNS SETOF absence_details_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM absence_details_view
  WHERE department_id = department_id_param
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get absences within a date range
CREATE OR REPLACE FUNCTION get_absences_by_date_range(start_date DATE, end_date DATE)
RETURNS SETOF absence_details_view AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM absence_details_view
  WHERE date BETWEEN start_date AND end_date
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;