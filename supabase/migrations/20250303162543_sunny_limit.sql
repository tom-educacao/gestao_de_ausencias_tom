/*
  # Create teachers table

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, not null, references profiles)
      - `department_id` (uuid, not null, references departments)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `teachers` table
    - Add policies for viewing, inserting, updating, and deleting teachers
  3. Indexes
    - Add index on `department_id` for faster lookups
  4. Constraints
    - Add unique constraint on `profile_id` to ensure one teacher record per profile
*/

CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view teachers"
  ON teachers
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins and coordinators can insert teachers"
  ON teachers
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins and coordinators can update teachers"
  ON teachers
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins can delete teachers"
  ON teachers
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS teachers_department_id_idx ON teachers(department_id);