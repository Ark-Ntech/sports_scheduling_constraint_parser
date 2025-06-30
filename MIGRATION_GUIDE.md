# Database Migration Guide: Basic → Enhanced Hierarchical Schema

## Overview

This guide will help you migrate your existing Sports Scheduling Constraint Parser database from the basic schema to the enhanced hierarchical system that supports:

**Sport → League → Season → Team → Constraint Sets**

## Prerequisites

- Access to your Supabase SQL Editor
- Backup of your existing data (recommended)
- Understanding that this migration is **backward compatible** - existing functionality will continue to work

## Migration Steps

### Step 1: Check Current Database State

First, let's see what you currently have:

```sql
-- Run this in Supabase SQL Editor to check your current setup
```

Copy and run the contents of `check-database-status.sql` to see your current database structure.

### Step 2: Backup Your Data (Recommended)

Before making any changes, backup your existing data:

```sql
-- Export existing constraint sets
COPY constraint_sets TO '/tmp/backup_constraint_sets.csv' CSV HEADER;

-- Export existing constraints
COPY constraints TO '/tmp/backup_constraints.csv' CSV HEADER;

-- Export feedback
COPY feedback TO '/tmp/backup_feedback.csv' CSV HEADER;

-- Export comments
COPY comments TO '/tmp/backup_comments.csv' CSV HEADER;
```

### Step 3: Run the Migration Script

Execute the migration script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire contents of database-migration.sql
-- This will add new tables and enhance existing ones
```

### Step 4: Verify Migration Success

After running the migration, verify everything worked:

```sql
-- Check that new tables were created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('sports', 'leagues', 'seasons', 'teams')
ORDER BY tablename;

-- Check that constraint_sets has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'constraint_sets'
    AND table_schema = 'public'
    AND column_name IN ('sport_id', 'league_id', 'season_id', 'team_id', 'constraint_count', 'tags', 'is_template', 'visibility');

-- Verify sample data was inserted
SELECT name FROM sports ORDER BY name;
SELECT name FROM leagues ORDER BY name;
SELECT name FROM seasons ORDER BY name;
```

### Step 5: Update Your Application Code

Now you need to update your application to use the enhanced database functions:

1. **Replace lib/database.ts** with the enhanced version
2. **Update API routes** to handle hierarchical data
3. **Create new UI components** for hierarchy management

## What the Migration Does

### ✅ **Preserves All Existing Data**

- Your existing constraint sets remain unchanged
- All constraints stay exactly as they are
- Feedback and comments are preserved
- All existing functionality continues to work

### ✅ **Adds New Tables**

- `sports` - Basketball, Soccer, Baseball, etc.
- `leagues` - Metro League, Youth Association, etc.
- `seasons` - Spring 2024, Fall Championship, etc.
- `teams` - Individual teams in seasons

### ✅ **Enhances Existing Tables**

- **constraint_sets** gains hierarchy references and metadata:

  - `sport_id`, `league_id`, `season_id`, `team_id` (optional associations)
  - `constraint_count` (auto-updated)
  - `tags` (array of strings)
  - `is_template` (for reusable templates)
  - `visibility` ('private', 'shared', 'public')

- **constraints** gains enhanced features:
  - `priority` ('low', 'medium', 'high', 'critical')
  - `status` ('active', 'inactive', 'archived')
  - `tags` (array of strings)
  - `notes` (additional context)

### ✅ **Updates Security & Performance**

- Enhanced RLS policies with visibility support
- New indexes for better query performance
- Automatic constraint counting
- Real-time subscriptions for new tables

## Sample Hierarchy After Migration

```
Basketball (Sport)
├── Metro Basketball League (League)
│   ├── Spring 2024 Season (Season)
│   │   ├── Thunder Hawks (Team)
│   │   └── Lightning Bolts (Team)
│   └── Fall 2024 Season (Season)
│       ├── Storm Eagles (Team)
│       └── Fire Dragons (Team)
└── Youth Basketball Association (League)
    └── Summer Camp League (Season)
        ├── Young Shooters (Team)
        └── Future Stars (Team)

Your Existing Constraint Sets
├── "Basketball Tournament Rules" → Can now be associated with Basketball sport
├── "Team A Preferences" → Can now be associated with specific team
└── "General Scheduling Rules" → Can remain unassociated (global)
```

## Backward Compatibility

✅ **All existing functionality continues to work:**

- Existing constraint sets load normally
- Constraint parsing works exactly the same
- All API endpoints remain functional
- UI components continue to work

✅ **New functionality is optional:**

- You can use constraint sets without hierarchy (as before)
- Or gradually organize them into sports/leagues/seasons/teams
- Templates and visibility are optional features

## Testing the Migration

### Basic Functionality Test

1. Load your existing constraint sets - they should appear normally
2. Parse new constraints - should work exactly as before
3. View confidence methodology - should work the same

### New Functionality Test

1. Browse the sports that were created
2. Explore leagues within sports
3. Check seasons within leagues
4. Try creating a constraint set associated with a specific team

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove new tables (this won't affect your existing data)
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS sports CASCADE;

-- Remove new columns from constraint_sets (optional)
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS sport_id;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS league_id;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS season_id;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS team_id;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS constraint_count;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS tags;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS is_template;
ALTER TABLE constraint_sets DROP COLUMN IF EXISTS visibility;

-- Remove new columns from constraints (optional)
ALTER TABLE constraints DROP COLUMN IF EXISTS priority;
ALTER TABLE constraints DROP COLUMN IF EXISTS status;
ALTER TABLE constraints DROP COLUMN IF EXISTS tags;
ALTER TABLE constraints DROP COLUMN IF EXISTS notes;
```

## Next Steps After Migration

1. **Test thoroughly** - Make sure everything works
2. **Update application code** - Implement new database functions
3. **Create new UI components** - For hierarchy management
4. **Train users** - On new organizational features
5. **Gradually organize** - Move existing constraint sets into hierarchy

## Support

If you encounter any issues:

1. Check the verification queries to see what succeeded
2. Review the Supabase logs for any errors
3. Use the rollback plan if needed
4. All your original data remains safe in the existing tables

The migration is designed to be **safe and reversible** while providing powerful new organizational capabilities!
