-- Ideas Taxonomy Database Schema
-- Run this in your Supabase SQL Editor to create the database structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE idea_status AS ENUM ('planned', 'active', 'completed', 'archived');
CREATE TYPE story_status AS ENUM ('backlog', 'planned', 'in-progress', 'done');
CREATE TYPE story_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE sprint_status AS ENUM ('planned', 'active', 'completed');
CREATE TYPE update_type AS ENUM ('progress', 'completion', 'blocker', 'note');
CREATE TYPE figure_status AS ENUM ('active', 'archived');

-- ============================================
-- MAIN TABLES
-- ============================================

-- Ideas table
CREATE TABLE ideas (
  id SERIAL PRIMARY KEY,
  idea_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status idea_status NOT NULL DEFAULT 'planned',
  created DATE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  story_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status story_status NOT NULL DEFAULT 'backlog',
  priority story_priority NOT NULL DEFAULT 'medium',
  created DATE NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sprints table
CREATE TABLE sprints (
  id SERIAL PRIMARY KEY,
  sprint_id VARCHAR(4) UNIQUE NOT NULL, -- YYSS format
  year INTEGER NOT NULL,
  sprint_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status NOT NULL DEFAULT 'planned',
  goals TEXT[] DEFAULT '{}',
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updates table
CREATE TABLE updates (
  id SERIAL PRIMARY KEY,
  sprint_id VARCHAR(4) NOT NULL REFERENCES sprints(sprint_id),
  idea_number INTEGER NOT NULL REFERENCES ideas(idea_number),
  story_number INTEGER NOT NULL REFERENCES stories(story_number),
  notation VARCHAR(20) NOT NULL, -- e.g., "2609.5.56"
  date DATE NOT NULL,
  type update_type NOT NULL DEFAULT 'progress',
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sprint_id, idea_number, story_number)
);

-- Figures table
CREATE TABLE figures (
  id SERIAL PRIMARY KEY,
  figure_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT NOT NULL,
  alt_text TEXT,
  created DATE NOT NULL,
  uploaded_date DATE,
  file_type VARCHAR(20),
  status figure_status NOT NULL DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  dimensions VARCHAR(20),
  file_size VARCHAR(20),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  author TEXT,
  tags TEXT[] DEFAULT '{}',
  excerpt TEXT,
  canonical_source_url TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JUNCTION TABLES (Many-to-Many Relationships)
-- ============================================

-- Idea <-> Story
CREATE TABLE idea_stories (
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, story_id)
);

-- Idea <-> Sprint
CREATE TABLE idea_sprints (
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, sprint_id)
);

-- Idea <-> Figure
CREATE TABLE idea_figures (
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  figure_id INTEGER REFERENCES figures(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, figure_id)
);

-- Idea <-> Material
CREATE TABLE idea_materials (
  idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, material_id)
);

-- Story <-> Sprint
CREATE TABLE story_sprints (
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, sprint_id)
);

-- Story <-> Figure
CREATE TABLE story_figures (
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  figure_id INTEGER REFERENCES figures(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, figure_id)
);

-- Story <-> Material
CREATE TABLE story_materials (
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, material_id)
);

-- Sprint <-> Figure
CREATE TABLE sprint_figures (
  sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
  figure_id INTEGER REFERENCES figures(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, figure_id)
);

-- Sprint <-> Material
CREATE TABLE sprint_materials (
  sprint_id INTEGER REFERENCES sprints(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, material_id)
);

-- Figure <-> Material
CREATE TABLE figure_materials (
  figure_id INTEGER REFERENCES figures(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
  PRIMARY KEY (figure_id, material_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_created ON ideas(created);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_priority ON stories(priority);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_dates ON sprints(start_date, end_date);
CREATE INDEX idx_updates_date ON updates(date);
CREATE INDEX idx_updates_type ON updates(type);
CREATE INDEX idx_figures_status ON figures(status);
CREATE INDEX idx_materials_date ON materials(date);
CREATE INDEX idx_materials_slug ON materials(slug);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updates_updated_at
  BEFORE UPDATE ON updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_figures_updated_at
  BEFORE UPDATE ON figures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view)
CREATE POLICY "Public read access" ON ideas FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sprints FOR SELECT USING (true);
CREATE POLICY "Public read access" ON updates FOR SELECT USING (true);
CREATE POLICY "Public read access" ON figures FOR SELECT USING (true);
CREATE POLICY "Public read access" ON materials FOR SELECT USING (true);

-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated insert" ON ideas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON ideas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON ideas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON stories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON stories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON stories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON sprints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON sprints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON sprints FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON updates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON updates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON updates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON figures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON figures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON figures FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated insert" ON materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update" ON materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON materials FOR DELETE TO authenticated USING (true);

-- Junction tables - public read, authenticated write
ALTER TABLE idea_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE figure_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON idea_stories FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON idea_stories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON idea_sprints FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON idea_sprints FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON idea_figures FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON idea_figures FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON idea_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON idea_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON story_sprints FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON story_sprints FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON story_figures FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON story_figures FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON story_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON story_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON sprint_figures FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON sprint_figures FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON sprint_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON sprint_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON figure_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON figure_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET FOR FIGURES
-- ============================================

-- Create a storage bucket for figure images
-- Run this in the Supabase Dashboard under Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('figures', 'figures', true);
