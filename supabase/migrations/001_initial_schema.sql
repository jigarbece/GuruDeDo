-- =====================================================================
-- Gurudedo — Phase 1 initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,          -- emoji icon
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches table
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL DEFAULT 'Ahmedabad',
  area TEXT NOT NULL,           -- locality: Bopal, Satellite, Navrangpura etc
  pincode TEXT,
  category_id UUID REFERENCES categories(id),
  sub_skills TEXT[],            -- array: ['Guitar', 'Keyboard', 'Violin']
  experience_years INT DEFAULT 0,
  fee_min INT,                  -- per month in INR
  fee_max INT,
  fee_type TEXT DEFAULT 'monthly', -- monthly / hourly / per_session
  teaching_mode TEXT DEFAULT 'home_visit', -- home_visit / online / center / all
  demo_available BOOLEAN DEFAULT true,
  bio TEXT,
  profile_photo_url TEXT,
  teaching_photos TEXT[],       -- array of photo URLs
  status TEXT DEFAULT 'pending', -- pending / approved / rejected
  featured BOOLEAN DEFAULT false,
  gender TEXT,
  languages TEXT[],             -- languages they teach in
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enquiries table (when student clicks WhatsApp — log it)
CREATE TABLE enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id),
  student_name TEXT,
  student_phone TEXT,
  skill_needed TEXT,
  area TEXT,
  message TEXT,
  source TEXT DEFAULT 'whatsapp_button',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin config table
CREATE TABLE admin_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin password (change immediately after setup)
INSERT INTO admin_config (key, value) VALUES ('admin_password', 'gurudedo@admin123');

-- Insert default categories
INSERT INTO categories (name, icon, slug, sort_order) VALUES
  ('Academics', '📚', 'academics', 1),
  ('Music', '🎵', 'music', 2),
  ('Dance', '💃', 'dance', 3),
  ('Fitness & Yoga', '🧘', 'fitness', 4),
  ('Art & Drawing', '🎨', 'art', 5),
  ('Cooking & Baking', '👨‍🍳', 'cooking', 6),
  ('Beauty & Salon', '💅', 'beauty', 7),
  ('Language', '🗣️', 'language', 8),
  ('Tech & Coding', '💻', 'tech', 9),
  ('Spiritual & Meditation', '🪷', 'spiritual', 10),
  ('Photography', '📷', 'photography', 11),
  ('Other Skills', '⭐', 'other', 12);

-- Indexes for performance
CREATE INDEX idx_coaches_status ON coaches(status);
CREATE INDEX idx_coaches_category ON coaches(category_id);
CREATE INDEX idx_coaches_area ON coaches(area);
CREATE INDEX idx_coaches_featured ON coaches(featured);
CREATE INDEX idx_coaches_city ON coaches(city);

-- Keep updated_at fresh on coach updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Row Level Security
-- The backend talks to Supabase with the service-role key (bypasses RLS).
-- These policies protect the anon/public key used directly by the client.
-- =====================================================================

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public can read approved coaches only
CREATE POLICY "Public read approved coaches" ON coaches
  FOR SELECT USING (status = 'approved');

-- Public can submit a registration (always lands as pending; see CHECK)
CREATE POLICY "Public insert pending coaches" ON coaches
  FOR INSERT WITH CHECK (status = 'pending');

-- Public can insert enquiries
CREATE POLICY "Public insert enquiries" ON enquiries
  FOR INSERT WITH CHECK (true);

-- Public can read categories
CREATE POLICY "Public read categories" ON categories
  FOR SELECT USING (is_active = true);
