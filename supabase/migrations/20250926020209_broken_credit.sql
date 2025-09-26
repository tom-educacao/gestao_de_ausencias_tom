/*
  # Create leaves table for managing teacher leaves/absences periods

  1. New Tables
    - `leaves`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, not null, references teachers)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `reason` (text, not null)
      - `document_url` (text, nullable - for uploaded documents)
      - `status` (text, not null, default 'active')
      - `created_by` (uuid, not null, references profiles)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `leaves` table
    - Add policies for viewing, inserting, updating, and deleting leaves
  3. Constraints
    - Add constraint to ensure end_date is after start_date
  4. Indexes
    - Add indexes for faster lookups and filtering
*/

CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint to ensure end_date is after or equal to start_date
  CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date)
);

-- Enable Row Level Security
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view leaves"
  ON leaves
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and coordinators can insert leaves"
  ON leaves
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Admins and coordinators can update leaves"
  ON leaves
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Admins and coordinators can delete leaves"
  ON leaves
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_leaves_updated_at
BEFORE UPDATE ON leaves
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create indexes for faster lookups and filtering
CREATE INDEX IF NOT EXISTS leaves_teacher_id_idx ON leaves(teacher_id);
CREATE INDEX IF NOT EXISTS leaves_date_range_idx ON leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS leaves_status_idx ON leaves(status);

-- Add leave_id column to absences table to link absences to leaves
ALTER TABLE absences ADD COLUMN IF NOT EXISTS leave_id UUID REFERENCES leaves(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS absences_leave_id_idx ON absences(leave_id);