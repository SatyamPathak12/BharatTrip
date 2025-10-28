/*
  # Create Property Documents Storage System

  1. Storage Bucket
    - Create `property-documents` bucket for storing property verification documents
    - Set file size limit to 10MB per document
    - Allow PDF, DOC, DOCX, JPG, PNG, WEBP formats
    - Private bucket for security (not publicly accessible)

  2. Storage Policies
    - Property owners can upload documents for their properties
    - Admins can view all property documents
    - Users can manage their own property documents
    - Secure folder structure: userId/propertyId/documentType_timestamp.ext

  3. Document Types
    - ownership: Property ownership documents (required)
    - license: Business license/permits (required)
    - tax_certificate: Tax certificates (optional)
    - identity: Identity proof documents (required)
    - other: Additional supporting documents (optional)

  4. Security
    - Documents are private and only accessible via signed URLs
    - Folder-based access control by user ID
    - Admin override for verification purposes
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
CREATE POLICY "Property owners can upload their documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Property owners can view their documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents' AND
    auth.role() = 'authenticated' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
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

CREATE POLICY "Admins can view all property documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add documents column to properties table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'documents'
  ) THEN
    ALTER TABLE properties ADD COLUMN documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Function to get property document signed URL
CREATE OR REPLACE FUNCTION get_property_document_signed_url(document_path TEXT)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This is a placeholder - in practice, you'd call the storage API
  -- The actual signed URL generation happens in the client-side code
  RETURN concat('/storage/v1/object/sign/property-documents/', document_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate document access
CREATE OR REPLACE FUNCTION can_access_property_document(
  property_id UUID,
  requesting_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  property_owner UUID;
  user_role TEXT;
BEGIN
  -- Get property owner
  SELECT user_id INTO property_owner FROM properties WHERE id = property_id;
  
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = requesting_user_id;
  
  -- Check if user is property owner or admin
  IF property_owner = requesting_user_id OR user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;