/*
  # Create departments table

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, not null, unique)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `departments` table
    - Add policies for viewing, inserting, updating, and deleting departments
  3. Triggers
    - Add trigger to update the `updated_at` column automatically
*/

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view departments"
  ON departments
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins and coordinators can insert departments"
  ON departments
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins and coordinators can update departments"
  ON departments
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins can delete departments"
  ON departments
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();