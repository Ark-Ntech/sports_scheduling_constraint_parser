-- Database Status Check Script
-- Run this to see your current database state before migration

-- Check existing tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('constraint_sets', 'constraints', 'feedback', 'comments', 'sports', 'leagues', 'seasons', 'teams')
ORDER BY tablename;

-- Check constraint_sets table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'constraint_sets' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints table structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'constraints' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count existing data
SELECT 
    'constraint_sets' as table_name,
    COUNT(*) as record_count
FROM constraint_sets
UNION ALL
SELECT 
    'constraints' as table_name,
    COUNT(*) as record_count
FROM constraints
UNION ALL
SELECT 
    'feedback' as table_name,
    COUNT(*) as record_count
FROM feedback
UNION ALL
SELECT 
    'comments' as table_name,
    COUNT(*) as record_count
FROM comments;

-- Check if new hierarchy tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sports') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as sports_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leagues') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as leagues_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seasons') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as seasons_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as teams_table; 