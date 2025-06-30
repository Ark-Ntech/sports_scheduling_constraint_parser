-- Database Migration Script: Basic Schema → Enhanced Hierarchical Schema
-- This script upgrades your existing constraint parser database to support:
-- Sport → League → Season → Team → Constraint Sets hierarchy

-- ==================================================
-- STEP 1: CREATE NEW TABLES FOR HIERARCHY
-- ==================================================

-- Sports table (top level)
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI (e.g., 'basketball', 'soccer')
    color VARCHAR(7), -- Hex color code for UI theming
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table (belongs to a sport)
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    organization VARCHAR(100), -- e.g., "NCAA", "High School", "Community"
    level VARCHAR(50), -- e.g., "Professional", "Amateur", "Youth"
    region VARCHAR(100), -- e.g., "North Region", "State Championship"
    logo_url TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table (belongs to a league)
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (belongs to a season)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    coach_name VARCHAR(100),
    contact_email VARCHAR(255),
    home_venue VARCHAR(150),
    color VARCHAR(7), -- Hex color code for team theming
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- STEP 2: ENHANCE EXISTING CONSTRAINT_SETS TABLE
-- ==================================================

-- Add new columns to constraint_sets for hierarchy support
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES sports(id) ON DELETE SET NULL;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id) ON DELETE SET NULL;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS constraint_count INTEGER DEFAULT 0;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array of tag strings
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
ALTER TABLE constraint_sets ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public'));

-- ==================================================
-- STEP 3: ENHANCE EXISTING CONSTRAINTS TABLE
-- ==================================================

-- Add new columns to constraints for enhanced features
ALTER TABLE constraints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE constraints ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
ALTER TABLE constraints ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array of tag strings
ALTER TABLE constraints ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==================================================
-- STEP 4: CREATE NEW INDEXES
-- ==================================================

-- New indexes for hierarchy tables
CREATE INDEX IF NOT EXISTS idx_leagues_sport_id ON leagues(sport_id);
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_season_id ON teams(season_id);

-- New indexes for enhanced constraint_sets
CREATE INDEX IF NOT EXISTS idx_constraint_sets_sport_id ON constraint_sets(sport_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_league_id ON constraint_sets(league_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_season_id ON constraint_sets(season_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_team_id ON constraint_sets(team_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_visibility ON constraint_sets(visibility);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_is_template ON constraint_sets(is_template);

-- New indexes for enhanced constraints
CREATE INDEX IF NOT EXISTS idx_constraints_priority ON constraints(priority);
CREATE INDEX IF NOT EXISTS idx_constraints_status ON constraints(status);

-- ==================================================
-- STEP 5: CREATE UPDATED_AT TRIGGERS FOR NEW TABLES
-- ==================================================

-- Triggers for new tables (updated_at function already exists)
CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- STEP 6: CREATE CONSTRAINT COUNT TRIGGER
-- ==================================================

-- Function to update constraint count in constraint_sets
CREATE OR REPLACE FUNCTION update_constraint_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE constraint_sets 
        SET constraint_count = constraint_count - 1 
        WHERE id = OLD.set_id;
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        UPDATE constraint_sets 
        SET constraint_count = constraint_count + 1 
        WHERE id = NEW.set_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update constraint count
CREATE TRIGGER trigger_update_constraint_count
    AFTER INSERT OR DELETE ON constraints
    FOR EACH ROW EXECUTE FUNCTION update_constraint_count();

-- ==================================================
-- STEP 7: ENABLE RLS ON NEW TABLES
-- ==================================================

-- Enable RLS on new tables
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 8: CREATE RLS POLICIES FOR NEW TABLES
-- ==================================================

-- Sports: Everyone can read, authenticated users can manage
CREATE POLICY "Sports are viewable by everyone" ON sports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sports" ON sports FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sports" ON sports FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Leagues: Everyone can read, authenticated users can manage
CREATE POLICY "Leagues are viewable by everyone" ON leagues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert leagues" ON leagues FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update leagues" ON leagues FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Seasons: Everyone can read, authenticated users can manage
CREATE POLICY "Seasons are viewable by everyone" ON seasons FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert seasons" ON seasons FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update seasons" ON seasons FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Teams: Everyone can read, authenticated users can manage
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update teams" ON teams FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- ==================================================
-- STEP 9: UPDATE CONSTRAINT_SETS RLS POLICIES
-- ==================================================

-- Drop existing policies and recreate with enhanced visibility support
DROP POLICY IF EXISTS "Users can view their own constraint sets" ON constraint_sets;
DROP POLICY IF EXISTS "Users can insert their own constraint sets" ON constraint_sets;
DROP POLICY IF EXISTS "Users can update their own constraint sets" ON constraint_sets;
DROP POLICY IF EXISTS "Users can delete their own constraint sets" ON constraint_sets;

-- Enhanced constraint sets policies with visibility support
CREATE POLICY "Users can view accessible constraint sets" ON constraint_sets FOR SELECT 
    USING (auth.uid() = user_id OR visibility IN ('shared', 'public'));

CREATE POLICY "Users can insert their own constraint sets" ON constraint_sets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own constraint sets" ON constraint_sets FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own constraint sets" ON constraint_sets FOR DELETE 
    USING (auth.uid() = user_id);

-- ==================================================
-- STEP 10: UPDATE CONSTRAINTS RLS POLICIES
-- ==================================================

-- Drop existing policies and recreate with enhanced visibility support
DROP POLICY IF EXISTS "Users can view constraints from their sets" ON constraints;
DROP POLICY IF EXISTS "Users can insert constraints to their sets" ON constraints;
DROP POLICY IF EXISTS "Users can update constraints in their sets" ON constraints;
DROP POLICY IF EXISTS "Users can delete constraints from their sets" ON constraints;

-- Enhanced constraints policies with visibility support
CREATE POLICY "Users can view constraints from accessible sets" ON constraints FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = constraints.set_id 
        AND (cs.user_id = auth.uid() OR cs.visibility IN ('shared', 'public'))
    ));

CREATE POLICY "Users can insert constraints to their sets" ON constraints FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = constraints.set_id AND cs.user_id = auth.uid()
    ));

CREATE POLICY "Users can update constraints in their sets" ON constraints FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = constraints.set_id AND cs.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete constraints from their sets" ON constraints FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = constraints.set_id AND cs.user_id = auth.uid()
    ));

-- ==================================================
-- STEP 11: UPDATE COMMENTS RLS POLICIES
-- ==================================================

-- Drop existing policies and recreate with enhanced visibility support
DROP POLICY IF EXISTS "Users can view comments on their sets" ON comments;
DROP POLICY IF EXISTS "Users can insert comments on sets they own" ON comments;

-- Enhanced comments policies with visibility support
CREATE POLICY "Users can view comments on accessible sets" ON comments FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = comments.set_id 
        AND (cs.user_id = auth.uid() OR cs.visibility IN ('shared', 'public'))
    ));

CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM constraint_sets cs 
        WHERE cs.id = comments.set_id 
        AND (cs.user_id = auth.uid() OR cs.visibility IN ('shared', 'public'))
    ));

-- ==================================================
-- STEP 12: INSERT SAMPLE DATA
-- ==================================================

-- Insert sample sports data
INSERT INTO sports (name, description, icon, color) VALUES 
    ('Basketball', 'Indoor/outdoor basketball leagues and tournaments', 'basketball', '#FF8C00'),
    ('Soccer', 'Football/soccer leagues and tournaments', 'soccer', '#228B22'),
    ('Baseball', 'Baseball and softball leagues', 'baseball', '#FF4500'),
    ('Tennis', 'Tennis tournaments and leagues', 'tennis', '#FFD700'),
    ('Volleyball', 'Indoor and beach volleyball', 'volleyball', '#1E90FF'),
    ('Hockey', 'Ice hockey and field hockey', 'hockey', '#8B0000')
ON CONFLICT DO NOTHING;

-- Sample leagues for different sports
INSERT INTO leagues (sport_id, name, description, organization, level, region) VALUES 
    ((SELECT id FROM sports WHERE name = 'Basketball'), 'Metro Basketball League', 'Urban basketball league for all skill levels', 'Community Sports', 'Amateur', 'Metro Area'),
    ((SELECT id FROM sports WHERE name = 'Basketball'), 'Youth Basketball Association', 'Youth development basketball league', 'Youth Sports Inc', 'Youth', 'City Wide'),
    ((SELECT id FROM sports WHERE name = 'Soccer'), 'Premier Soccer League', 'Competitive adult soccer league', 'Premier Sports', 'Semi-Professional', 'Regional'),
    ((SELECT id FROM sports WHERE name = 'Soccer'), 'Youth Soccer Federation', 'Youth soccer development program', 'Youth Federation', 'Youth', 'State Wide'),
    ((SELECT id FROM sports WHERE name = 'Baseball'), 'Community Baseball League', 'Local community baseball league', 'Community Athletics', 'Amateur', 'Local')
ON CONFLICT DO NOTHING;

-- Sample seasons for leagues
INSERT INTO seasons (league_id, name, description, start_date, end_date, status) VALUES 
    ((SELECT id FROM leagues WHERE name = 'Metro Basketball League'), 'Spring 2024 Season', 'Spring basketball season', '2024-03-01', '2024-06-30', 'completed'),
    ((SELECT id FROM leagues WHERE name = 'Metro Basketball League'), 'Fall 2024 Season', 'Fall basketball season', '2024-09-01', '2024-12-15', 'active'),
    ((SELECT id FROM leagues WHERE name = 'Youth Basketball Association'), 'Summer 2024 Camp League', 'Summer youth basketball league', '2024-06-15', '2024-08-15', 'completed'),
    ((SELECT id FROM leagues WHERE name = 'Premier Soccer League'), '2024-2025 Championship', 'Annual championship season', '2024-08-01', '2025-05-31', 'active'),
    ((SELECT id FROM leagues WHERE name = 'Youth Soccer Federation'), 'Fall 2024 Development', 'Youth development season', '2024-09-01', '2024-11-30', 'planning')
ON CONFLICT DO NOTHING;

-- ==================================================
-- STEP 13: UPDATE EXISTING DATA
-- ==================================================

-- Initialize constraint_count for existing constraint sets
UPDATE constraint_sets 
SET constraint_count = (
    SELECT COUNT(*) 
    FROM constraints 
    WHERE constraints.set_id = constraint_sets.id 
    AND constraints.status = 'active'
)
WHERE constraint_count = 0 OR constraint_count IS NULL;

-- Set default priority for existing constraints
UPDATE constraints 
SET priority = 'medium' 
WHERE priority IS NULL;

-- Set default status for existing constraints
UPDATE constraints 
SET status = 'active' 
WHERE status IS NULL;

-- Set default visibility for existing constraint sets
UPDATE constraint_sets 
SET visibility = 'private' 
WHERE visibility IS NULL;

-- Set default is_template for existing constraint sets
UPDATE constraint_sets 
SET is_template = FALSE 
WHERE is_template IS NULL;

-- ==================================================
-- STEP 14: ENABLE REALTIME FOR NEW TABLES
-- ==================================================

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE sports;
ALTER PUBLICATION supabase_realtime ADD TABLE leagues;
ALTER PUBLICATION supabase_realtime ADD TABLE seasons;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================

-- Add comments to document the new structure
COMMENT ON TABLE sports IS 'Top-level sports categories (Basketball, Soccer, etc.)';
COMMENT ON TABLE leagues IS 'Leagues within each sport (Metro League, Youth Association, etc.)';
COMMENT ON TABLE seasons IS 'Seasons within each league (Spring 2024, Fall Tournament, etc.)';
COMMENT ON TABLE teams IS 'Teams participating in seasons';
COMMENT ON TABLE constraint_sets IS 'Enhanced constraint sets with hierarchical organization and visibility controls';
COMMENT ON TABLE constraints IS 'Enhanced constraints with priority, status, and tagging support';

-- Verify migration
SELECT 'Migration completed successfully!' as status,
       (SELECT COUNT(*) FROM sports) as sports_count,
       (SELECT COUNT(*) FROM leagues) as leagues_count,
       (SELECT COUNT(*) FROM seasons) as seasons_count,
       (SELECT COUNT(*) FROM constraint_sets) as constraint_sets_count,
       (SELECT COUNT(*) FROM constraints) as constraints_count; 