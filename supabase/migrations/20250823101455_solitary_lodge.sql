/*
  # Updated Properties Table Schema

  1. Complete Properties Table
    - All basic property information fields
    - Pricing and capacity details
    - Contact and booking information
    - Document management with JSONB
    - Verification workflow fields
    - Admin tracking and timestamps

  2. Enhanced Features
    - Property rules and policies
    - Booking settings (check-in/out times, minimum stay)
    - Instant booking capability
    - Comprehensive amenities tracking
    - Image gallery support

  3. Document Management
    - JSONB column for storing document metadata
    - Support for multiple document types
    - File tracking with upload timestamps
    - Integration with storage bucket

  4. Security
    - Row Level Security enabled
    - Comprehensive policies for users and admins
    - Secure document access controls

  5. Performance
    - Optimized indexes for common queries
    - Efficient data types and constraints
*/

-- Drop existing table if you want to recreate (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS properties CASCADE;

-- Create comprehensive properties table
CREATE TABLE IF NOT EXISTS properties (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic property information
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'apartment', 'villa')),
  
  -- Pricing and capacity
  price_per_night INTEGER NOT NULL CHECK (price_per_night > 0),
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
  
  -- Property features
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  property_size TEXT, -- e.g., "1200 sq ft"
  floor_number INTEGER,
  total_floors INTEGER,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  emergency_contact TEXT,
  
  -- Booking and policies
  property_rules TEXT[] DEFAULT '{}',
  cancellation_policy TEXT DEFAULT 'Flexible cancellation up to 24 hours before check-in',
  check_in_time TEXT DEFAULT '3:00 PM',
  check_out_time TEXT DEFAULT '11:00 AM',
  minimum_stay INTEGER DEFAULT 1 CHECK (minimum_stay > 0),
  maximum_stay INTEGER DEFAULT 30 CHECK (maximum_stay > 0),
  instant_book BOOLEAN DEFAULT false,
  advance_booking_days INTEGER DEFAULT 365,
  
  -- Pricing details
  weekly_discount DECIMAL(5,2) DEFAULT 0 CHECK (weekly_discount >= 0 AND weekly_discount <= 100),
  monthly_discount DECIMAL(5,2) DEFAULT 0 CHECK (monthly_discount >= 0 AND monthly_discount <= 100),
  cleaning_fee INTEGER DEFAULT 0 CHECK (cleaning_fee >= 0),
  security_deposit INTEGER DEFAULT 0 CHECK (security_deposit >= 0),
  extra_guest_fee INTEGER DEFAULT 0 CHECK (extra_guest_fee >= 0),
  
  -- Location details
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  nearby_attractions TEXT[],
  transportation_info TEXT,
  
  -- Property status and verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  admin_notes TEXT,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Document management (JSONB for flexibility)
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Availability and booking
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  blocked_dates DATE[],
  
  -- SEO and marketing
  seo_title TEXT,
  seo_description TEXT,
  featured BOOLEAN DEFAULT false,
  priority_listing BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Admin tracking
  approved_by UUID REFERENCES profiles(id),
  verified_by UUID REFERENCES profiles(id),
  last_modified_by UUID REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view approved active properties" ON properties
  FOR SELECT USING (
    status = 'approved' AND 
    is_active = true AND 
    is_available = true
  );

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

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_price_range ON properties(price_per_night);
CREATE INDEX IF NOT EXISTS idx_properties_approved_at ON properties(approved_at);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active, is_available) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_properties_documents ON properties USING gin(documents);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_property_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_properties_timestamps
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_property_timestamps();

-- Create function to validate document structure
CREATE OR REPLACE FUNCTION validate_property_documents(docs JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  doc JSONB;
BEGIN
  -- Check if documents is an array
  IF jsonb_typeof(docs) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each document structure
  FOR doc IN SELECT jsonb_array_elements(docs)
  LOOP
    -- Check required fields
    IF NOT (
      doc ? 'id' AND
      doc ? 'name' AND
      doc ? 'type' AND
      doc ? 'file_path' AND
      doc ? 'file_size' AND
      doc ? 'uploaded_at'
    ) THEN
      RETURN FALSE;
    END IF;
    
    -- Check document type is valid
    IF NOT (doc->>'type' IN ('ownership', 'license', 'tax_certificate', 'identity', 'other')) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate documents JSON structure
ALTER TABLE properties 
ADD CONSTRAINT valid_documents_structure 
CHECK (validate_property_documents(documents));

-- Create view for admin property management with document counts
CREATE OR REPLACE VIEW admin_properties_detailed AS
SELECT 
  p.*,
  prof.name as owner_name,
  prof.email as owner_email,
  verifier.name as verified_by_name,
  approver.name as approved_by_name,
  jsonb_array_length(COALESCE(p.documents, '[]'::jsonb)) as document_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(COALESCE(p.documents, '[]'::jsonb)) as doc
    WHERE doc->>'type' IN ('ownership', 'license', 'identity')
  ) as required_documents_count
FROM properties p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN profiles verifier ON p.verified_by = verifier.id
LEFT JOIN profiles approver ON p.approved_by = approver.id
ORDER BY p.created_at DESC;

-- Grant access to admin view
GRANT SELECT ON admin_properties_detailed TO authenticated;

-- Create function to check if property has all required documents
CREATE OR REPLACE FUNCTION has_required_documents(property_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  docs JSONB;
  required_types TEXT[] := ARRAY['ownership', 'license', 'identity'];
  doc_type TEXT;
  has_all BOOLEAN := TRUE;
BEGIN
  -- Get property documents
  SELECT documents INTO docs FROM properties WHERE id = property_id;
  
  -- Check each required document type
  FOREACH doc_type IN ARRAY required_types
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(COALESCE(docs, '[]'::jsonb)) as doc
      WHERE doc->>'type' = doc_type
    ) THEN
      has_all := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN has_all;
END;
$$ LANGUAGE plpgsql;