/*
  # Complete Properties Table Schema Based on Current UI

  1. New Tables
    - Updated `properties` table with all UI fields
    - Support for single and multiple property listings
    - Complete property information capture
    - Document management system
    - Enhanced verification workflow

  2. Property Information
    - Basic details (name, description, location, address)
    - Property specifications (type, bedrooms, bathrooms, guests)
    - Pricing and booking settings
    - Contact information
    - Property rules and policies
    - Multiple property support

  3. Multiple Properties Support
    - Bulk listing capabilities
    - Same/different address handling
    - Individual property details
    - Property count management

  4. Document Management
    - JSONB storage for document metadata
    - Support for multiple document types
    - File tracking and verification

  5. Security
    - Row Level Security enabled
    - User-based access control
    - Admin verification workflow
    - Secure document handling

  6. Performance
    - Optimized indexes for search
    - Efficient data types
    - Proper constraints
*/

-- Drop existing properties table to recreate with complete schema
DROP TABLE IF EXISTS properties CASCADE;

-- Create comprehensive properties table based on UI
CREATE TABLE properties (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic property information (from Step 3 form)
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL, -- City, State format
  address TEXT NOT NULL, -- Full street address
  property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'apartment', 'villa')),
  
  -- Property specifications (from Step 3 form)
  bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  property_size TEXT, -- e.g., "1200 sq ft"
  floor_number INTEGER,
  
  -- Pricing (from Step 3 form)
  price_per_night INTEGER NOT NULL CHECK (price_per_night > 0),
  cleaning_fee INTEGER DEFAULT 0 CHECK (cleaning_fee >= 0),
  security_deposit INTEGER DEFAULT 0 CHECK (security_deposit >= 0),
  extra_guest_fee INTEGER DEFAULT 0 CHECK (extra_guest_fee >= 0),
  
  -- Contact information (from Step 3 form)
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  emergency_contact TEXT,
  
  -- Property features and amenities (from Step 3 form)
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  
  -- Property rules and policies (from Step 3 form)
  property_rules TEXT[] DEFAULT '{}',
  cancellation_policy TEXT DEFAULT 'Flexible cancellation up to 24 hours before check-in',
  check_in_time TEXT DEFAULT '3:00 PM',
  check_out_time TEXT DEFAULT '11:00 AM',
  minimum_stay INTEGER DEFAULT 1 CHECK (minimum_stay > 0),
  maximum_stay INTEGER DEFAULT 30 CHECK (maximum_stay > 0),
  
  -- Booking settings (from Step 3 form)
  instant_book BOOLEAN DEFAULT false,
  advance_booking_days INTEGER DEFAULT 365,
  
  -- Multiple properties support (from Steps 1-2)
  is_multiple_properties BOOLEAN DEFAULT false,
  property_count INTEGER DEFAULT 1 CHECK (property_count >= 1 AND property_count <= 50),
  same_address BOOLEAN DEFAULT true,
  listing_type TEXT DEFAULT 'single' CHECK (listing_type IN ('single', 'multiple_same_address', 'multiple_different_address')),
  
  -- Multiple property details (JSONB for flexibility)
  property_addresses JSONB DEFAULT '[]'::jsonb, -- Array of addresses for different locations
  individual_property_details JSONB DEFAULT '[]'::jsonb, -- Details for each property unit
  bulk_listing_notes TEXT, -- Additional notes for bulk listings
  
  -- Document management (from DocumentUpload component)
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Verification and admin workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  admin_notes TEXT,
  verification_notes TEXT,
  rejection_reason TEXT,
  
  -- Availability and booking
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  blocked_dates DATE[] DEFAULT '{}',
  
  -- Location details (for search and mapping)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  nearby_attractions TEXT[] DEFAULT '{}',
  transportation_info TEXT,
  
  -- SEO and marketing
  seo_title TEXT,
  seo_description TEXT,
  featured BOOLEAN DEFAULT false,
  priority_listing BOOLEAN DEFAULT false,
  
  -- Pricing details
  weekly_discount DECIMAL(5,2) DEFAULT 0 CHECK (weekly_discount >= 0 AND weekly_discount <= 100),
  monthly_discount DECIMAL(5,2) DEFAULT 0 CHECK (monthly_discount >= 0 AND monthly_discount <= 100),
  
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

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all properties" ON properties
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

-- Create optimized indexes for search and performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties USING gin(to_tsvector('english', location));
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_price_range ON properties(price_per_night);
CREATE INDEX idx_properties_approved_at ON properties(approved_at);
CREATE INDEX idx_properties_featured ON properties(featured) WHERE featured = true;
CREATE INDEX idx_properties_active ON properties(is_active, is_available) WHERE is_active = true;
CREATE INDEX idx_properties_is_multiple ON properties(is_multiple_properties);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_property_count ON properties(property_count);
CREATE INDEX idx_properties_same_address ON properties(same_address);
CREATE INDEX idx_properties_documents ON properties USING gin(documents);

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

-- Create function to validate property addresses structure
CREATE OR REPLACE FUNCTION validate_property_addresses(addresses JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  address_item JSONB;
BEGIN
  -- Check if addresses is an array
  IF jsonb_typeof(addresses) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each address structure
  FOR address_item IN SELECT jsonb_array_elements(addresses)
  LOOP
    -- Check required fields for each address
    IF NOT (
      address_item ? 'address' AND
      address_item ? 'city' AND
      address_item ? 'state'
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate individual property details structure
CREATE OR REPLACE FUNCTION validate_individual_property_details(details JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  property_item JSONB;
BEGIN
  -- Check if details is an array
  IF jsonb_typeof(details) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each property structure
  FOR property_item IN SELECT jsonb_array_elements(details)
  LOOP
    -- Check required fields for each property
    IF NOT (
      property_item ? 'property_number' AND
      property_item ? 'bedrooms' AND
      property_item ? 'bathrooms' AND
      property_item ? 'max_guests'
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate documents structure
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
    IF NOT (doc->>'type' IN ('aadhar', 'pan', 'property_details', 'bank_details', 'gst', 'other')) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraints to validate JSON structures
ALTER TABLE properties 
ADD CONSTRAINT valid_property_addresses_structure 
CHECK (validate_property_addresses(property_addresses));

ALTER TABLE properties 
ADD CONSTRAINT valid_individual_property_details_structure 
CHECK (validate_individual_property_details(individual_property_details));

ALTER TABLE properties 
ADD CONSTRAINT valid_documents_structure 
CHECK (validate_property_documents(documents));

-- Add constraint to ensure property_count matches listing type
ALTER TABLE properties 
ADD CONSTRAINT valid_property_count_for_type 
CHECK (
  (listing_type = 'single' AND property_count = 1) OR
  (listing_type IN ('multiple_same_address', 'multiple_different_address') AND property_count > 1)
);

-- Add constraint to ensure same_address matches listing type
ALTER TABLE properties 
ADD CONSTRAINT valid_same_address_for_type 
CHECK (
  (listing_type = 'single') OR
  (listing_type = 'multiple_same_address' AND same_address = true) OR
  (listing_type = 'multiple_different_address' AND same_address = false)
);

-- Create function to automatically set listing_type based on other fields
CREATE OR REPLACE FUNCTION set_listing_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set listing_type based on other fields
  IF NEW.is_multiple_properties = false OR NEW.property_count = 1 THEN
    NEW.listing_type = 'single';
    NEW.is_multiple_properties = false;
    NEW.property_count = 1;
    NEW.same_address = true;
  ELSIF NEW.is_multiple_properties = true AND NEW.property_count > 1 THEN
    IF NEW.same_address = true THEN
      NEW.listing_type = 'multiple_same_address';
    ELSE
      NEW.listing_type = 'multiple_different_address';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set listing_type
CREATE TRIGGER set_properties_listing_type
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_type();

-- Create view for properties with enhanced details
CREATE OR REPLACE VIEW properties_with_details AS
SELECT 
  p.*,
  prof.name as owner_name,
  prof.email as owner_email,
  CASE 
    WHEN p.is_multiple_properties = true THEN 
      p.property_count 
    ELSE 1 
  END as total_units,
  CASE 
    WHEN p.listing_type = 'single' THEN 'Single Property'
    WHEN p.listing_type = 'multiple_same_address' THEN 'Multiple Properties - Same Address'
    WHEN p.listing_type = 'multiple_different_address' THEN 'Multiple Properties - Different Addresses'
    ELSE 'Unknown'
  END as listing_type_display,
  jsonb_array_length(COALESCE(p.documents, '[]'::jsonb)) as document_count,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(COALESCE(p.documents, '[]'::jsonb)) as doc
    WHERE doc->>'type' IN ('aadhar', 'pan', 'property_details', 'bank_details')
  ) as required_documents_count
FROM properties p
LEFT JOIN profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC;

-- Grant access to the view
GRANT SELECT ON properties_with_details TO authenticated;

-- Create function to check if property has all required documents
CREATE OR REPLACE FUNCTION has_required_documents(property_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  docs JSONB;
  required_types TEXT[] := ARRAY['aadhar', 'pan', 'property_details', 'bank_details'];
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

-- Create function to get property statistics
CREATE OR REPLACE FUNCTION get_property_stats()
RETURNS TABLE(
  total_properties BIGINT,
  pending_properties BIGINT,
  approved_properties BIGINT,
  multiple_properties BIGINT,
  avg_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_properties,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_properties,
    COUNT(*) FILTER (WHERE is_multiple_properties = true) as multiple_properties,
    ROUND(AVG(price_per_night), 2) as avg_price
  FROM properties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;