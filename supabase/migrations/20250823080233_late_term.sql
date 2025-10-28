/*
  # Create property storage bucket and enhanced property management

  1. Storage
    - Create `property-images` bucket for storing property photos
    - Set up storage policies for authenticated users
    - Allow public read access for approved property images

  2. Enhanced Properties Table
    - Add additional fields for better property management
    - Add verification workflow fields
    - Add image storage references

  3. Security
    - Storage policies for property image uploads
    - Enhanced RLS policies for property management
    - Admin-specific policies for verification workflow

  4. Functions
    - Helper functions for property management
    - Image URL generation functions
*/

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Users can update their own property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add additional columns to properties table if they don't exist
DO $$
BEGIN
  -- Add verification fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE properties ADD COLUMN verification_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE properties ADD COLUMN verified_by UUID REFERENCES profiles(id);
  END IF;

  -- Add property details fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_rules'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_rules TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'cancellation_policy'
  ) THEN
    ALTER TABLE properties ADD COLUMN cancellation_policy TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'check_in_time'
  ) THEN
    ALTER TABLE properties ADD COLUMN check_in_time TEXT DEFAULT '3:00 PM';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'check_out_time'
  ) THEN
    ALTER TABLE properties ADD COLUMN check_out_time TEXT DEFAULT '11:00 AM';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'minimum_stay'
  ) THEN
    ALTER TABLE properties ADD COLUMN minimum_stay INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'instant_book'
  ) THEN
    ALTER TABLE properties ADD COLUMN instant_book BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create function to get property image URLs
CREATE OR REPLACE FUNCTION get_property_image_url(bucket_name TEXT, image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    image_path
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to handle property status updates
CREATE OR REPLACE FUNCTION update_property_status(
  property_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL,
  admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE properties 
  SET 
    status = new_status,
    admin_notes = COALESCE(admin_notes, admin_notes),
    updated_at = NOW(),
    verified_at = CASE WHEN new_status = 'approved' THEN NOW() ELSE verified_at END,
    verified_by = CASE WHEN new_status = 'approved' THEN COALESCE(admin_id, auth.uid()) ELSE verified_by END
  WHERE id = property_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for admin property management
CREATE OR REPLACE VIEW admin_properties_view AS
SELECT 
  p.*,
  prof.name as owner_name,
  prof.email as owner_email,
  verifier.name as verified_by_name
FROM properties p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN profiles verifier ON p.verified_by = verifier.id
ORDER BY p.created_at DESC;

-- Grant access to admin view
GRANT SELECT ON admin_properties_view TO authenticated;

-- Create policy for admin view
CREATE POLICY "Admins can view admin properties view" ON admin_properties_view
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );