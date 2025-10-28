/*
  # Fix Tours Table Schema - Add Missing Columns

  1. Problem
    - Missing 'published_at' column causing tour creation to fail
    - Inconsistent schema between migrations
    - Need to ensure all required columns exist

  2. Solution
    - Add missing columns safely using IF NOT EXISTS
    - Ensure all columns from tourService are present
    - Maintain backward compatibility

  3. Columns Added
    - published_at (TIMESTAMPTZ)
    - last_modified_at (TIMESTAMPTZ) 
    - last_modified_by (UUID)
    - seo_title (TEXT)
    - seo_description (TEXT)
    - max_bookings_per_day (INTEGER)
    - advance_booking_days (INTEGER)
    - is_available (BOOLEAN)
    - priority_listing (BOOLEAN)
    - admin_notes (TEXT)

  4. Safety
    - Uses IF NOT EXISTS to prevent errors
    - Preserves existing data
    - Sets appropriate defaults
*/

-- Add missing published_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE tours ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add missing last_modified_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'last_modified_at'
  ) THEN
    ALTER TABLE tours ADD COLUMN last_modified_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add missing last_modified_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'last_modified_by'
  ) THEN
    ALTER TABLE tours ADD COLUMN last_modified_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Add missing seo_title column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'seo_title'
  ) THEN
    ALTER TABLE tours ADD COLUMN seo_title TEXT;
  END IF;
END $$;

-- Add missing seo_description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'seo_description'
  ) THEN
    ALTER TABLE tours ADD COLUMN seo_description TEXT;
  END IF;
END $$;

-- Add missing max_bookings_per_day column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'max_bookings_per_day'
  ) THEN
    ALTER TABLE tours ADD COLUMN max_bookings_per_day INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add missing advance_booking_days column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'advance_booking_days'
  ) THEN
    ALTER TABLE tours ADD COLUMN advance_booking_days INTEGER DEFAULT 90;
  END IF;
END $$;

-- Add missing is_available column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE tours ADD COLUMN is_available BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add missing priority_listing column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'priority_listing'
  ) THEN
    ALTER TABLE tours ADD COLUMN priority_listing BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add missing admin_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE tours ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Update the timestamp trigger to handle new columns
CREATE OR REPLACE FUNCTION update_tour_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Only update last_modified_at if column exists
  IF TG_TABLE_NAME = 'tours' THEN
    NEW.last_modified_at = NOW();
    NEW.last_modified_by = auth.uid();
    
    -- Set published_at when tour becomes active for the first time
    IF OLD.status != 'active' AND NEW.status = 'active' AND NEW.published_at IS NULL THEN
      NEW.published_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_tours_timestamps ON tours;
CREATE TRIGGER update_tours_timestamps
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_timestamps();

-- Update existing active tours to have published_at if they don't
UPDATE tours 
SET published_at = created_at 
WHERE status = 'active' 
  AND is_active = true 
  AND published_at IS NULL;