/*
  # Create substitutes table

  1. New Tables
    - `substitutes`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `unit` (text, not null)
      - `active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `substitutes` table
    - Add policies for viewing, inserting, updating, and deleting substitutes
  3. Triggers
    - Add trigger to update the `updated_at` column automatically
*/

CREATE TABLE IF NOT EXISTS substitutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE substitutes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active substitutes"
  ON substitutes
  FOR SELECT
  USING (active = true);

CREATE POLICY "Only admins and coordinators can insert substitutes"
  ON substitutes
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins and coordinators can update substitutes"
  ON substitutes
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Only admins can delete substitutes"
  ON substitutes
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_substitutes_updated_at
BEFORE UPDATE ON substitutes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();