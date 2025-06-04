/*
  # Create database functions

  1. New Functions
    - `get_teacher_absences`: Get absences for a specific teacher
    - `get_department_absences`: Get absences for a specific department
    - `get_absences_by_date_range`: Get absences within a date range
    - `get_monthly_absence_stats`: Get monthly absence statistics by department
  2. Purpose
    - Provide reusable database functions for common queries
    - Optimize performance for frequently used data access patterns
    - Ensure consistent data retrieval across the application
*/

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

-- Function to get monthly absence statistics
CREATE OR REPLACE FUNCTION get_monthly_absence_stats(year_param INT, month_param INT)
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  absence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    department_id,
    department_name,
    COUNT(*) AS absence_count
  FROM 
    absence_details_view
  WHERE 
    EXTRACT(YEAR FROM date) = year_param AND
    EXTRACT(MONTH FROM date) = month_param
  GROUP BY 
    department_id, department_name
  ORDER BY 
    absence_count DESC;
END;
$$ LANGUAGE plpgsql;