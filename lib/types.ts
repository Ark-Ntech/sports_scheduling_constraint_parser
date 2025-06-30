import type { Message } from 'ai';

export interface Chat {
  id: string;
  title: string;
  createdAt: Date | string;
  userId: string;
  visibility: 'private' | 'public';
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  title: string;
  content?: string;
  userId: string;
  createdAt: Date;
  kind: 'text' | 'code';
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface UIMessage extends Message {
  id: string;
  display?: {
    name: string;
    props: Record<string, unknown>;
  };
  attachments?: Array<{
    name: string;
    contentType: string;
    size: number;
    url: string;
  }>;
}

export interface Block {
  documentId: string;
  content: string;
  title: string;
  status: 'streaming' | 'idle';
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface UIBlock {
  title: string;
  documentId: string;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export type StreamingData = {
  [key: string]: {
    fullResponse: string;
    snapshot: string;
    title: string;
  };
};

export type Weather = {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
};

export type VisibilityType = 'private' | 'public';

export type DataPart = { type: 'append-message'; message: string };

// Database Types
export interface Sport {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  sport_id: string;
  name: string;
  description?: string;
  organization?: string; // e.g., "NCAA", "High School", "Community"
  level?: string; // e.g., "Professional", "Amateur", "Youth"
  region?: string; // e.g., "North Region", "State Championship"
  logo_url?: string;
  website?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
  sport?: Sport; // Populated with joins
}

export interface Season {
  id: string;
  league_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  league?: League; // Populated with joins
}

export interface Team {
  id: string;
  season_id: string;
  name: string;
  description?: string;
  coach_name?: string;
  contact_email?: string;
  home_venue?: string;
  color?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  season?: Season; // Populated with joins
}

export interface ConstraintSet {
  id: string;
  user_id: string;
  sport_id?: string;
  league_id?: string;
  season_id?: string;
  team_id?: string;
  name: string;
  description?: string;
  constraint_count: number;
  tags?: string[];
  is_template: boolean;
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
  // Populated with joins
  sport?: Sport;
  league?: League;
  season?: Season;
  team?: Team;
}

export interface Constraint {
  id: string;
  set_id: string;
  raw_text: string;
  parsed_data: ParsedConstraintData;
  confidence_score?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive' | 'archived';
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  constraint_id: string;
  user_id: string;
  is_correct: boolean;
  notes?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  set_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Parsed Constraint Data Structure
export interface ParsedConstraintData {
  type: ConstraintType;
  entities: Entity[];
  conditions: Condition[];
  temporal?: TemporalConstraint;
  capacity?: CapacityConstraint;
  rest?: RestConstraint;
  location?: LocationConstraint;
  llmJudge?: LLMJudgeResult;
}

export type ConstraintType =
  | 'temporal' // Time-based constraints
  | 'capacity' // Resource capacity constraints
  | 'rest' // Rest period constraints
  | 'location' // Venue/location constraints
  | 'preference' // Soft preferences
  | 'prohibition' // Hard prohibitions
  | 'assignment'; // Resource assignment constraints

export interface Entity {
  type: EntityType;
  value: string;
  confidence?: number;
}

export type EntityType =
  | 'team'
  | 'player'
  | 'venue'
  | 'field'
  | 'court'
  | 'time'
  | 'date'
  | 'day_of_week'
  | 'duration'
  | 'number'
  | 'time_period'
  | 'capacity_indicator'
  | 'personnel' // Added for supervision requirements
  | 'requirement' // Added for policy indicators
  | 'organization'; // Added for league/organization indicators

export interface Condition {
  operator: ConditionOperator;
  value: string | number;
  unit?: string;
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'between'
  | 'not_between';

export interface TemporalConstraint {
  days_of_week?: string[];
  time_ranges?: TimeRange[];
  dates?: string[];
  excluded_dates?: string[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface CapacityConstraint {
  resource: string;
  max_concurrent?: number;
  max_per_day?: number;
  max_per_week?: number;
}

export interface RestConstraint {
  min_hours?: number;
  min_days?: number;
  between_games?: boolean;
  between_practices?: boolean;
}

export interface LocationConstraint {
  required_venue?: string;
  excluded_venues?: string[];
  home_venue_required?: boolean;
  max_distance?: number;
  distance_unit?: 'miles' | 'kilometers';
}

// API Response Types
export interface ParseResponse {
  success: boolean;
  data?: ParsedConstraintData;
  confidence_score?: number;
  error?: string;
}

export interface JudgeResponse {
  success: boolean;
  confidence_score?: number;
  explanation?: string;
  error?: string;
}

// UI State Types
export interface ConstraintFormData {
  raw_text: string;
  set_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  notes?: string;
}

export interface ConstraintSetFormData {
  name: string;
  description?: string;
  sport_id?: string;
  league_id?: string;
  season_id?: string;
  team_id?: string;
  tags?: string[];
  is_template?: boolean;
  visibility?: 'private' | 'shared' | 'public';
}

export interface SportFormData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface LeagueFormData {
  sport_id: string;
  name: string;
  description?: string;
  organization?: string;
  level?: string;
  region?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
}

export interface SeasonFormData {
  league_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
}

export interface TeamFormData {
  season_id: string;
  name: string;
  description?: string;
  coach_name?: string;
  contact_email?: string;
  home_venue?: string;
  color?: string;
  logo_url?: string;
}

// User Types (extending Supabase User)
export interface User {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Supabase Database Types (generated types would go here in a real app)
export interface Database {
  public: {
    Tables: {
      sports: {
        Row: Sport;
        Insert: Omit<Sport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Sport, 'id' | 'created_at' | 'updated_at'>>;
      };
      leagues: {
        Row: League;
        Insert: Omit<League, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<League, 'id' | 'created_at' | 'updated_at'>>;
      };
      seasons: {
        Row: Season;
        Insert: Omit<Season, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Season, 'id' | 'created_at' | 'updated_at'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at' | 'updated_at'>>;
      };
      constraint_sets: {
        Row: ConstraintSet;
        Insert: Omit<
          ConstraintSet,
          'id' | 'created_at' | 'updated_at' | 'constraint_count'
        >;
        Update: Partial<
          Omit<
            ConstraintSet,
            'id' | 'created_at' | 'updated_at' | 'constraint_count'
          >
        >;
      };
      constraints: {
        Row: Constraint;
        Insert: Omit<Constraint, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Constraint, 'id' | 'created_at' | 'updated_at'>>;
      };
      feedback: {
        Row: Feedback;
        Insert: Omit<Feedback, 'id' | 'created_at'>;
        Update: Partial<Omit<Feedback, 'id' | 'created_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface LLMJudgeResult {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  suggestedCorrection?: string;
  enhancedResult?: any;
  suggestedCorrections?: Array<{
    field: string;
    current: string;
    suggested: string;
    reason: string;
  }>;
  completenessScore?: number;
  contextualInsights?: string;
}
