/*
  # Create Property Documents Storage Bucket

  1. Storage Bucket
    - Create `property-documents` bucket for storing property documents
    - Set file size limit to 10MB per document
    - Allow PDF, DOC, DOCX, JPG, PNG formats
    - Enable secure access for property owners and admins

  2. Storage Policies
    - Property owners can upload their own documents
    - Admins can view all property documents
    - Users can manage their own property documents
    - Secure folder structure by user ID and property ID

  3. Document Types
    - Property ownership documents
    - Government licenses
    - Tax certificates
    - Identity proofs
    - Property photos for verification
*/

-- Create storage bucket for property documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-documents',
  'property-documents',
  false, -- Private bucket for security
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for property documents
CREATE POLICY "Property owners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Property owners can view their documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all property documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Property owners can update their documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Property owners can delete their documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add documents column to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'documents'
  ) THEN
    ALTER TABLE properties ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Function to get property document URL
CREATE OR REPLACE FUNCTION get_property_document_url(document_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/sign/property-documents/',
    document_path
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate document upload
CREATE OR REPLACE FUNCTION validate_property_document(
  property_id UUID,
  document_type TEXT,
  file_path TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  property_owner UUID;
BEGIN
  -- Get property owner
  SELECT user_id INTO property_owner FROM properties WHERE id = property_id;
  
  -- Check if current user is the property owner or admin
  IF property_owner = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;