-- Database Cleanup Script for ResourceFlow
-- This script removes test/dummy data from the production database
-- Run this script before going live

-- Backup current data (optional but recommended)
-- CREATE TABLE team_members_backup AS SELECT * FROM team_members;
-- CREATE TABLE projects_backup AS SELECT * FROM projects;
-- CREATE TABLE holidays_backup AS SELECT * FROM holidays;
-- CREATE TABLE vacations_backup AS SELECT * FROM vacations;
-- CREATE TABLE project_allocations_backup AS SELECT * FROM project_allocations;

-- Clean up test team members
DELETE FROM team_members 
WHERE name LIKE '%Test%' 
   OR name LIKE '%Teest%' 
   OR name LIKE '%Import%'
   OR name LIKE '%Dummy%'
   OR name LIKE '%Mock%'
   OR name LIKE '%Sample%';

-- Clean up test projects
DELETE FROM projects 
WHERE name LIKE '%Project%' AND name REGEXP '[0-9]'
   OR name LIKE '%Test%'
   OR name LIKE '%Dummy%'
   OR name LIKE '%Mock%'
   OR name LIKE '%Sample%';

-- Clean up test holidays
DELETE FROM holidays 
WHERE name LIKE '%Test%'
   OR name LIKE '%Dummy%'
   OR name LIKE '%Mock%'
   OR name LIKE '%Sample%';

-- Clean up test vacations
DELETE FROM vacations 
WHERE employee_name LIKE '%Test%'
   OR employee_name LIKE '%Dummy%'
   OR employee_name LIKE '%Mock%'
   OR employee_name LIKE '%Sample%';

-- Clean up test project allocations
DELETE FROM project_allocations 
WHERE employee_id IN (
  SELECT id FROM team_members WHERE name LIKE '%Test%'
)
   OR project_id IN (
  SELECT id FROM projects WHERE name LIKE '%Test%'
);

-- Clean up orphaned allocations (where employee or project no longer exists)
DELETE FROM project_allocations 
WHERE employee_id NOT IN (SELECT id FROM team_members)
   OR project_id NOT IN (SELECT id FROM projects);

-- Clean up orphaned vacations (where employee no longer exists)
DELETE FROM vacations 
WHERE employee_id NOT IN (SELECT id FROM team_members);

-- Reset auto-increment counters (optional)
-- DELETE FROM sqlite_sequence WHERE name IN ('team_members', 'projects', 'holidays', 'vacations', 'project_allocations');

-- Verify cleanup results
SELECT 'team_members' as table_name, COUNT(*) as count FROM team_members
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'holidays', COUNT(*) FROM holidays
UNION ALL
SELECT 'vacations', COUNT(*) FROM vacations
UNION ALL
SELECT 'project_allocations', COUNT(*) FROM project_allocations
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- Show remaining data for verification
SELECT 'Remaining team members:' as info;
SELECT id, name, role, country FROM team_members ORDER BY name;

SELECT 'Remaining projects:' as info;
SELECT id, name, start_date, end_date, status FROM projects ORDER BY name;

SELECT 'Remaining holidays:' as info;
SELECT id, name, date, country FROM holidays ORDER BY date;

SELECT 'Remaining vacations:' as info;
SELECT id, employee_name, start_date, end_date, type FROM vacations ORDER BY employee_name;

SELECT 'Remaining allocations:' as info;
SELECT id, employee_id, project_id, start_date, end_date FROM project_allocations ORDER BY employee_id; 