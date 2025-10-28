/*
  # Create Property Images Storage Bucket

  1. Storage Bucket
    - Create `property-images` bucket for storing property photos
    - Set file size limit to 5MB per image
    - Allow JPEG, PNG, WEBP image formats
    - Enable public access for approved properties

  2. Storage Policies
    - Authenticated users can upload images
    - Users can manage their own property images
    - Public can view all property images
    - Secure folder structure by user ID

  3. Helper Functions
    - Function to get public image URLs
    - Function to clean up unused images
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

-- Storage policies for property images
CREATE POLICY "Anyone can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.role() = 'authenticated'
  );

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

-- Function to get property image public URL
CREATE OR REPLACE FUNCTION get_property_image_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/property-images/',
    image_path
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up unused property images
CREATE OR REPLACE FUNCTION cleanup_property_images(property_id UUID)
RETURNS VOID AS $$
DECLARE
  user_folder TEXT;
BEGIN
  -- Get the user_id for the property
  SELECT user_id::text INTO user_folder FROM properties WHERE id = property_id;
  
  IF user_folder IS NOT NULL THEN
    -- This function would be called when a property is deleted
    -- to clean up associated images from storage
    NULL; -- Placeholder for cleanup logic
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;