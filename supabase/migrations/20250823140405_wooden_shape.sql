/*
  # Complete Tours Management System

  1. New Tables
    - `tours` - Complete tour packages with all features
    - Storage buckets for tour media

  2. Tour Features
    - Complete tour information (title, location, duration, pricing)
    - Itinerary management with day-by-day breakdown
    - Media management (images and videos)
    - Booking and group size management
    - Category and difficulty classification
    - Admin approval workflow

  3. Security
    - Enable RLS on tours table
    - Policies for admins to manage tours
    - Public can view active tours
    - Secure media storage

  4. Performance
    - Optimized indexes for search and filtering
    - Efficient data types and constraints
*/

-- Create tours table with complete schema
CREATE TABLE IF NOT EXISTS tours (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic tour information
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  price INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER NOT NULL CHECK (original_price >= price),
  
  -- Tour details
  group_size TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Moderate', 'Challenging')),
  category TEXT NOT NULL CHECK (category IN ('Cultural', 'Adventure', 'Nature', 'Wildlife', 'Beach', 'Heritage')),
  
  -- Tour content
  highlights TEXT[] DEFAULT '{}',
  includes TEXT[] DEFAULT '{}',
  excludes TEXT[] DEFAULT '{}',
  itinerary JSONB DEFAULT '[]'::jsonb,
  
  -- Media storage
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  
  -- Booking and availability
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  max_bookings_per_day INTEGER DEFAULT 1,
  advance_booking_days INTEGER DEFAULT 90,
  
  -- Reviews and ratings
  rating DECIMAL(3,2) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  
  -- SEO and marketing
  seo_title TEXT,
  seo_description TEXT,
  featured BOOLEAN DEFAULT false,
  priority_listing BOOLEAN DEFAULT false,
  
  -- Admin workflow
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Create policies for tours
CREATE POLICY "Admins can manage all tours" ON tours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active tours" ON tours
  FOR SELECT USING (
    status = 'active' AND 
    is_active = true AND 
    is_available = true
  );

CREATE POLICY "Tour creators can view their tours" ON tours
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Tour creators can update their tours" ON tours
  FOR UPDATE USING (auth.uid() = created_by);

-- Create storage bucket for tour media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tour-media',
  'tour-media',
  true,
  52428800, -- 50MB limit for videos
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/avi'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for tour media
CREATE POLICY "Anyone can view tour media" ON storage.objects
  FOR SELECT USING (bucket_id = 'tour-media');

CREATE POLICY "Authenticated users can upload tour media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tour-media' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own tour media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tour-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own tour media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tour-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tours_created_by ON tours(created_by);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_category ON tours(category);
CREATE INDEX IF NOT EXISTS idx_tours_difficulty ON tours(difficulty);
CREATE INDEX IF NOT EXISTS idx_tours_location ON tours USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_tours_price_range ON tours(price);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON tours(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_tours_active ON tours(is_active, is_available) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tours_rating ON tours(rating);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_tour_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  
  -- Set published_at when tour becomes active for the first time
  IF OLD.status != 'active' AND NEW.status = 'active' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tours_timestamps
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_timestamps();

-- Create function to validate itinerary structure
CREATE OR REPLACE FUNCTION validate_tour_itinerary(itinerary JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  day_item JSONB;
BEGIN
  -- Check if itinerary is an array
  IF jsonb_typeof(itinerary) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each day structure
  FOR day_item IN SELECT jsonb_array_elements(itinerary)
  LOOP
    -- Check required fields
    IF NOT (
      day_item ? 'day' AND
      day_item ? 'title' AND
      day_item ? 'description'
    ) THEN
      RETURN FALSE;
    END IF;
    
    -- Check day is a positive integer
    IF NOT (jsonb_typeof(day_item->'day') = 'number' AND (day_item->>'day')::integer > 0) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate itinerary JSON structure
ALTER TABLE tours 
ADD CONSTRAINT valid_itinerary_structure 
CHECK (validate_tour_itinerary(itinerary));

-- Create view for public tours with additional computed fields
CREATE OR REPLACE VIEW public_tours_view AS
SELECT 
  t.*,
  prof.name as creator_name,
  prof.email as creator_email,
  CASE 
    WHEN t.original_price > t.price THEN 
      ROUND(((t.original_price - t.price)::DECIMAL / t.original_price) * 100)
    ELSE 0 
  END as discount_percentage,
  jsonb_array_length(t.itinerary) as total_days
FROM tours t
LEFT JOIN profiles prof ON t.created_by = prof.id
WHERE t.status = 'active' 
  AND t.is_active = true 
  AND t.is_available = true
ORDER BY t.featured DESC, t.rating DESC, t.created_at DESC;

-- Grant access to public tours view
GRANT SELECT ON public_tours_view TO anon, authenticated;

-- Create function to get tour statistics
CREATE OR REPLACE FUNCTION get_tour_stats()
RETURNS TABLE(
  total_tours BIGINT,
  active_tours BIGINT,
  featured_tours BIGINT,
  avg_rating DECIMAL,
  total_categories BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tours,
    COUNT(*) FILTER (WHERE status = 'active' AND is_active = true) as active_tours,
    COUNT(*) FILTER (WHERE featured = true) as featured_tours,
    ROUND(AVG(rating), 2) as avg_rating,
    COUNT(DISTINCT category) as total_categories
  FROM tours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;