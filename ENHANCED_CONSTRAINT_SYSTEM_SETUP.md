# Enhanced Constraint Set System Setup Guide

## Overview

This guide will help you implement the drastically improved constraint set system with hierarchical organization:

**Sport → League → Season → Team → Constraint Sets**

## Database Schema Changes

### New Hierarchy Structure

1. **Sports** (Top Level)

   - Basketball, Soccer, Baseball, etc.
   - Contains leagues

2. **Leagues** (New Addition)

   - Metro Basketball League, Premier Soccer League, etc.
   - Organization level (NCAA, High School, Community)
   - Skill level (Professional, Amateur, Youth)
   - Regional scope

3. **Seasons**

   - Spring 2024, Fall Tournament, etc.
   - Belongs to a league
   - Has start/end dates and status

4. **Teams**

   - Individual teams in a season
   - Coach info, home venue, contact details

5. **Constraint Sets**
   - Can be associated with any level (Sport, League, Season, Team)
   - Template support for reusability
   - Visibility controls (private, shared, public)

## Implementation Steps

### 1. Database Setup

Run the enhanced database schema:

```bash
# Connect to your Supabase project and run:
psql -h your-supabase-host -U postgres -d postgres -f database-setup.sql
```

### 2. Update Database Functions

Create enhanced database functions in `lib/database.ts`:

```typescript
// Sports Management
export async function getSports(): Promise<Sport[]>;
export async function createSport(data: SportFormData): Promise<Sport>;

// Leagues Management
export async function getLeagues(sportId?: string): Promise<League[]>;
export async function createLeague(data: LeagueFormData): Promise<League>;

// Seasons Management
export async function getSeasons(leagueId?: string): Promise<Season[]>;
export async function createSeason(data: SeasonFormData): Promise<Season>;

// Teams Management
export async function getTeams(seasonId?: string): Promise<Team[]>;
export async function createTeam(data: TeamFormData): Promise<Team>;

// Enhanced Constraint Sets
export async function getConstraintSets(filters?: {
  sportId?: string;
  leagueId?: string;
  seasonId?: string;
  teamId?: string;
  visibility?: "private" | "shared" | "public";
}): Promise<ConstraintSet[]>;
```

### 3. API Routes

Create comprehensive API routes:

- `/api/sports` - CRUD operations for sports
- `/api/leagues` - CRUD operations for leagues
- `/api/seasons` - CRUD operations for seasons
- `/api/teams` - CRUD operations for teams
- `/api/constraint-sets` - Enhanced constraint set management

### 4. UI Components

Create hierarchical management components:

#### Sports & Leagues Manager

```typescript
// components/sports-leagues-manager.tsx
- Sport creation and management
- League creation within sports
- Hierarchical tree view
- Search and filtering
```

#### Seasons & Teams Manager

```typescript
// components/seasons-teams-manager.tsx
- Season management within leagues
- Team registration for seasons
- Calendar integration
- Status tracking
```

#### Enhanced Constraint Set Manager

```typescript
// components/enhanced-constraint-set-manager.tsx
- Hierarchical organization selector
- Template creation and sharing
- Bulk operations
- Advanced filtering and search
```

### 5. Enhanced Constraint Parser

Update the constraint parser to work with the new hierarchy:

```typescript
// components/enhanced-constraint-parser.tsx
- Hierarchical context selection
- Smart defaults based on current context
- Template application
- Bulk constraint processing
```

## Key Features

### 1. Hierarchical Organization

- Navigate: Sport → League → Season → Team
- Context-aware constraint creation
- Inherited settings and templates

### 2. Template System

- Create reusable constraint templates
- Share templates across organizations
- Apply templates to new seasons/teams

### 3. Collaboration Features

- Share constraint sets between users
- Comment system for collaborative planning
- Feedback system for constraint accuracy

### 4. Advanced Search & Filtering

- Filter by sport, league, season, team
- Tag-based organization
- Status-based filtering
- Date range filtering

### 5. Bulk Operations

- Import/export constraint sets
- Bulk apply templates
- Mass updates across seasons

## Sample Data Structure

```typescript
// Example hierarchy:
Sport: "Basketball"
├── League: "Metro Basketball League"
│   ├── Season: "Fall 2024 Season"
│   │   ├── Team: "Thunder Hawks"
│   │   │   └── Constraint Set: "Hawks Game Rules"
│   │   └── Team: "Lightning Bolts"
│   │       └── Constraint Set: "Bolts Preferences"
│   └── Season: "Spring 2025 Season"
│       └── Constraint Set: "Spring League Rules" (Template)
└── League: "Youth Basketball Association"
    └── Season: "Summer Camp League"
        └── Constraint Set: "Youth Safety Rules" (Template)
```

## Migration Steps

### 1. Backup Current Data

```sql
-- Export existing constraint sets
COPY constraint_sets TO 'backup_constraint_sets.csv' CSV HEADER;
COPY constraints TO 'backup_constraints.csv' CSV HEADER;
```

### 2. Run Database Migration

```sql
-- Run the enhanced schema
\i database-setup.sql
```

### 3. Data Migration

```sql
-- Migrate existing constraint sets to new structure
-- Create default sport/league for existing data
```

### 4. Update Application Code

- Replace old constraint set components
- Update API routes
- Test all functionality

## Benefits

1. **Better Organization**: Clear hierarchy makes it easy to find and manage constraints
2. **Scalability**: Supports organizations with multiple sports and leagues
3. **Reusability**: Templates reduce repetitive constraint creation
4. **Collaboration**: Sharing and commenting features improve team coordination
5. **Flexibility**: Can create constraints at any hierarchy level
6. **Analytics**: Better reporting and insights with structured data

## Next Steps

1. Run the database setup script
2. Implement the enhanced database functions
3. Create the new API routes
4. Build the hierarchical UI components
5. Test with sample data
6. Migrate existing constraint sets
7. Deploy and train users

This enhanced system will provide a much more professional and scalable solution for sports scheduling constraint management!
