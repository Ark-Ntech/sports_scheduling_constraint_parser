-- Enhanced Sports Scheduling Constraint Parser Database Schema
-- This script sets up a hierarchical organization: Sport -> League -> Season -> Team -> Constraint Sets

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
-- Sports table
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI (e.g., 'basketball', 'soccer')
    color VARCHAR(7), -- Hex color code for UI theming
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table (belongs to a sport)
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Enhanced Constraint Sets table
CREATE TABLE IF NOT EXISTS constraint_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users
    sport_id UUID REFERENCES sports(id) ON DELETE SET NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    constraint_count INTEGER DEFAULT 0,
    tags TEXT[], -- Array of tag strings
    is_template BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Constraints table
CREATE TABLE IF NOT EXISTS constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID NOT NULL REFERENCES constraint_sets(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    parsed_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    tags TEXT[], -- Array of tag strings
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table (for user feedback on parsing accuracy)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constraint_id UUID NOT NULL REFERENCES constraints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table (for collaboration on constraint sets)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID NOT NULL REFERENCES constraint_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leagues_sport_id ON leagues(sport_id);
CREATE INDEX IF NOT EXISTS idx_seasons_league_id ON seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_season_id ON teams(season_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_user_id ON constraint_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_sport_id ON constraint_sets(sport_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_league_id ON constraint_sets(league_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_season_id ON constraint_sets(season_id);
CREATE INDEX IF NOT EXISTS idx_constraint_sets_team_id ON constraint_sets(team_id);
CREATE INDEX IF NOT EXISTS idx_constraints_set_id ON constraints(set_id);
CREATE INDEX IF NOT EXISTS idx_constraints_status ON constraints(status);
CREATE INDEX IF NOT EXISTS idx_feedback_constraint_id ON feedback(constraint_id);
CREATE INDEX IF NOT EXISTS idx_comments_set_id ON comments(set_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraint_sets_updated_at BEFORE UPDATE ON constraint_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_constraints_updated_at BEFORE UPDATE ON constraints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER trigger_update_constraint_count
    AFTER INSERT OR DELETE ON constraints
    FOR EACH ROW EXECUTE FUNCTION update_constraint_count();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraint_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Sports: Everyone can read, authenticated users can manage their sports
CREATE POLICY "Sports are viewable by everyone" ON sports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sports" ON sports FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sports they created" ON sports FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Leagues: Everyone can read, users can manage leagues for sports they have access to
CREATE POLICY "Leagues are viewable by everyone" ON leagues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert leagues" ON leagues FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update leagues" ON leagues FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Seasons: Everyone can read, users can manage seasons for leagues they have access to
CREATE POLICY "Seasons are viewable by everyone" ON seasons FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert seasons" ON seasons FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update seasons" ON seasons FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Teams: Everyone can read, users can manage teams for seasons they have access to
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert teams" ON teams FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update teams" ON teams FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Constraint Sets: Users can only access their own private sets, shared/public sets are viewable
CREATE POLICY "Users can view their own constraint sets" ON constraint_sets FOR SELECT 
    USING (auth.uid() = user_id OR visibility IN ('shared', 'public'));
CREATE POLICY "Users can insert their own constraint sets" ON constraint_sets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own constraint sets" ON constraint_sets FOR UPDATE 
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own constraint sets" ON constraint_sets FOR DELETE 
    USING (auth.uid() = user_id);

-- Constraints: Users can access constraints from sets they can view
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

-- Feedback: Users can provide feedback on any accessible constraint
CREATE POLICY "Users can view all feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert feedback" ON feedback FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON feedback FOR UPDATE 
    USING (auth.uid() = user_id);

-- Comments: Users can comment on accessible constraint sets
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
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE 
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE 
    USING (auth.uid() = user_id);

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

COMMENT ON TABLE sports IS 'Sports categories (Basketball, Soccer, etc.)';
COMMENT ON TABLE leagues IS 'Leagues within each sport (Metro League, Youth Association, etc.)';
COMMENT ON TABLE seasons IS 'Seasons within each league (Spring 2024, Fall Tournament, etc.)';
COMMENT ON TABLE teams IS 'Teams participating in seasons';
COMMENT ON TABLE constraint_sets IS 'Collections of scheduling constraints organized by sport/league/season/team';
COMMENT ON TABLE constraints IS 'Individual parsed scheduling constraints';
COMMENT ON TABLE feedback IS 'User feedback on constraint parsing accuracy';
COMMENT ON TABLE comments IS 'Collaborative comments on constraint sets'; 