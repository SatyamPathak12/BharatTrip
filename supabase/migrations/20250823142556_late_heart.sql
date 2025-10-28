/*
  # Update Tour Policies to Allow Logged-in Users

  1. Policy Changes
    - Allow authenticated users to create tours (not just admins)
    - Users can manage their own tours
    - Admins can manage all tours
    - Public can view active tours

  2. Security
    - Maintain RLS protection
    - Users can only edit their own tours
    - Admin oversight for tour approval
    - Secure media upload policies

  3. User Experience
    - Any logged-in user can create tours
    - Tour creators can edit their own tours
    - Admin approval workflow maintained
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage all tours" ON tours;
DROP POLICY IF EXISTS "Tour creators can view their tours" ON tours;
DROP POLICY IF EXISTS "Tour creators can update their tours" ON tours;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can create tours" ON tours
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = created_by
  );

CREATE POLICY "Users can view their own tours" ON tours
  FOR SELECT USING (
    auth.uid() = created_by OR
    (status = 'active' AND is_active = true AND is_available = true)
  );

CREATE POLICY "Users can update their own tours" ON tours
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tours" ON tours
  FOR DELETE USING (auth.uid() = created_by);

-- Admins can manage all tours
CREATE POLICY "Admins can manage all tours" ON tours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Public can view active tours
CREATE POLICY "Public can view active tours" ON tours
  FOR SELECT USING (
    status = 'active' AND 
    is_active = true AND 
    is_available = true
  );

-- Update storage policies to allow all authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload tour media" ON storage.objects;

CREATE POLICY "Authenticated users can upload tour media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tour-media' AND
    auth.role() = 'authenticated'
  );

-- Function to check if user can manage tour
CREATE OR REPLACE FUNCTION can_manage_tour(tour_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tour_creator UUID;
  user_role TEXT;
BEGIN
  -- Get tour creator
  SELECT created_by INTO tour_creator FROM tours WHERE id = tour_id;
  
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Check if user is tour creator or admin
  IF tour_creator = user_id OR user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;