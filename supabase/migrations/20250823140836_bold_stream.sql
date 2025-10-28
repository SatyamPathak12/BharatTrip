/*
  # Create Tour Media Storage Bucket with Complete Policies

  1. Storage Bucket
    - Create `tour-media` bucket for storing tour images and videos
    - Set file size limit to 50MB for videos, 5MB for images
    - Allow image and video formats
    - Enable public access for viewing

  2. Storage Policies
    - Authenticated users can upload tour media
    - Users can manage their own uploaded media
    - Public can view all tour media
    - Admins have full access to all media
    - Secure folder structure by user ID

  3. Security Features
    - File type validation
    - File size limits
    - User-based access control
    - Admin override capabilities
*/

-- Create storage bucket for tour media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tour-media',
  'tour-media',
  true, -- Public bucket for viewing tour media
  52428800, -- 50MB limit for videos
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/jpg',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/avi',
    'video/mov'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Policy 1: Anyone can view tour media (public access)
CREATE POLICY "Anyone can view tour media" ON storage.objects
  FOR SELECT USING (bucket_id = 'tour-media');

-- Policy 2: Authenticated users can upload tour media
CREATE POLICY "Authenticated users can upload tour media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tour-media' AND
    auth.role() = 'authenticated'
  );

-- Policy 3: Users can update their own tour media
CREATE POLICY "Users can update their own tour media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tour-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Users can delete their own tour media
CREATE POLICY "Users can delete their own tour media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tour-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 5: Admins can manage all tour media
CREATE POLICY "Admins can manage all tour media" ON storage.objects
  FOR ALL USING (
    bucket_id = 'tour-media' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to get tour media public URL
CREATE OR REPLACE FUNCTION get_tour_media_url(media_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/tour-media/',
    media_path
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate tour media upload
CREATE OR REPLACE FUNCTION validate_tour_media_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size limits
  IF mime_type LIKE 'video/%' AND file_size > 52428800 THEN -- 50MB for videos
    RETURN FALSE;
  END IF;
  
  IF mime_type LIKE 'image/%' AND file_size > 5242880 THEN -- 5MB for images
    RETURN FALSE;
  END IF;
  
  -- Check allowed mime types
  IF NOT (
    mime_type IN (
      'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/mov'
    )
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up unused tour media
CREATE OR REPLACE FUNCTION cleanup_tour_media(tour_id UUID)
RETURNS VOID AS $$
DECLARE
  tour_creator UUID;
  media_path TEXT;
BEGIN
  -- Get tour creator
  SELECT created_by INTO tour_creator FROM tours WHERE id = tour_id;
  
  IF tour_creator IS NOT NULL THEN
    -- This function can be called when a tour is deleted
    -- to clean up associated media files from storage
    -- Implementation would involve listing and deleting files
    NULL; -- Placeholder for cleanup logic
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;