/*
  # Create absences table

  1. New Tables
    - `absences`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, not null, references teachers)
      - `date` (date, not null)
      - `reason` (text, not null, check constraint for valid reasons)
      - `notes` (text, nullable)
      - `substitute_teacher_id` (uuid, nullable, references teachers)
      - `duration` (text, not null, check constraint for valid durations)
      - `start_time` (time, nullable)
      - `end_time` (time, nullable)
      - `created_by` (uuid, not null, references profiles)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `absences` table
    - Add policies for viewing, inserting, updating, and deleting absences
  3. Constraints
    - Add constraint to ensure start_time and end_time are provided for partial day absences
    - Add constraint to ensure end_time is after start_time
    - Add constraint to prevent a teacher from being their own substitute
  4. Indexes
    - Add indexes for faster lookups and filtering
*/

CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'Sick Leave', 
      'Personal Leave', 
      'Professional Development', 
      'Conference', 
      'Family Emergency', 
      'Other'
    )
  ),
  notes TEXT,
  substitute_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  duration TEXT NOT NULL CHECK (duration IN ('Full Day', 'Partial Day')),
  start_time TIME,
  end_time TIME,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint to ensure start_time and end_time are provided for partial day absences
  CONSTRAINT partial_day_times_required CHECK (
    (duration = 'Partial Day' AND start_time IS NOT NULL AND end_time IS NOT NULL) OR
    (duration = 'Full Day')
  ),
  
  -- Constraint to ensure end_time is after start_time
  CONSTRAINT end_time_after_start_time CHECK (
    (duration = 'Partial Day' AND end_time > start_time) OR
    (duration = 'Full Day')
  ),
  
  -- Constraint to prevent a teacher from being their own substitute
  CONSTRAINT different_substitute CHECK (teacher_id != substitute_teacher_id)
);

-- Enable Row Level Security
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view absences"
  ON absences
  FOR SELECT
  USING (true);

CREATE POLICY "Teachers can view their own absences"
  ON absences
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins and coordinators can insert absences"
  ON absences
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Admins and coordinators can update absences"
  ON absences
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Admins and coordinators can delete absences"
  ON absences
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_absences_updated_at
BEFORE UPDATE ON absences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS absences_teacher_id_idx ON absences(teacher_id);
CREATE INDEX IF NOT EXISTS absences_date_idx ON absences(date);
CREATE INDEX IF NOT EXISTS absences_substitute_teacher_id_idx ON absences(substitute_teacher_id);