# Teacher Absence Management System - Supabase Implementation

This document outlines the Supabase database implementation for the Teacher Absence Management System.

## Database Schema

### Tables

1. **profiles**
   - Stores user profile information
   - Linked to Supabase Auth users
   - Contains user roles (admin, coordinator, teacher)

2. **departments**
   - Stores school departments/units
   - Referenced by teachers

3. **teachers**
   - Links profiles to departments
   - Contains teacher-specific information

4. **absences**
   - Stores absence records
   - Links to teachers and substitute teachers
   - Contains absence details (date, reason, duration, etc.)

### Views

1. **teacher_profiles_view**
   - Combines teacher and profile information
   - Simplifies queries for teacher data

2. **absence_details_view**
   - Provides complete absence information
   - Includes teacher and department details

### Functions

1. **get_teacher_absences**
   - Get absences for a specific teacher

2. **get_department_absences**
   - Get absences for a specific department

3. **get_absences_by_date_range**
   - Get absences within a date range

4. **get_monthly_absence_stats**
   - Get monthly absence statistics by department

## Security

- Row Level Security (RLS) is enabled on all tables
- Policies control access based on user roles:
  - Admins have full access
  - Coordinators can manage absences and view all data
  - Teachers can view their own absences
  - All authenticated users can view basic information

## Implementation Steps

1. Create the database tables and relationships
2. Set up Row Level Security policies
3. Create views for simplified data access
4. Create helper functions for common queries
5. Seed initial data for testing
6. Connect the frontend to Supabase

## Frontend Integration

The frontend uses the Supabase JavaScript client to:
- Authenticate users
- Query and manipulate data
- Subscribe to real-time updates

## Development Setup

1. Create a Supabase project
2. Run the migration scripts in the `supabase/migrations` directory
3. Set up environment variables for the frontend
4. Connect the frontend to Supabase

## Production Considerations

- Set up proper backups
- Monitor database performance
- Implement proper error handling
- Consider adding indexes for frequently queried columns
- Set up proper logging and monitoring