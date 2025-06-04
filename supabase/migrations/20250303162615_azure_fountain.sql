/*
  # Seed initial data

  1. Purpose
    - Populate the database with initial department data
    - Set up the foundation for testing and development
  2. Notes
    - Admin user creation is handled through the Supabase Auth UI or programmatically
    - This migration only seeds the departments table
*/

-- Insert departments
INSERT INTO departments (name) VALUES
('Mathematics'),
('Science'),
('English'),
('History'),
('Computer Science'),
('Physical Education'),
('Arts'),
('Foreign Languages')
ON CONFLICT (name) DO NOTHING;

-- Note: The admin user would typically be created through the Supabase Auth UI
-- or programmatically using the Supabase client. This is just for reference.

-- The following is commented out as it would be handled by the application:
/*
-- Create an admin user (this would be done through Auth API in practice)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  gen_random_uuid(),
  'admin@school.edu',
  -- password would be hashed in reality
  now(),
  'authenticated'
);

-- Create admin profile
INSERT INTO profiles (id, name, email, role)
SELECT 
  id,
  'Admin User',
  'admin@school.edu',
  'admin'
FROM auth.users
WHERE email = 'admin@school.edu';
*/