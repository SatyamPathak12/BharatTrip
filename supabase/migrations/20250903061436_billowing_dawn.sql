/*
  # Complete Properties Table Schema Based on UI Flow

  1. New Tables
    - Updated `properties` table with complete UI flow tracking
    - Support for all property types and selection paths
    - Complete property listing journey capture
    - Enhanced verification workflow

  2. Entry Point & Account Setup
    - Track how user entered the flow (Get Started vs Continue Registration)
    - Property owner information and account details
    - Partner account creation tracking

  3. Property Type Selection Flow
    - Main category selection (Apartment, Homes, Hotels & B&Bs, Alternative Places)
    - Sub-category selections for each main type
    - Room type selections (Entire place, Private room)
    - Multiple property handling for all types

  4. Property Information
    - Basic details (name, description, location, address)
    - Property specifications (type, bedrooms, bathrooms, guests)
    - Pricing and booking settings
    - Contact information
    - Property rules and policies

  5. Multiple Properties Support
    - Property count tracking (1-50)
    - Same/different address handling
    - Individual property details
    - Bulk listing management

  6. Document Management
    - JSONB storage for document metadata
    - Support for multiple document types
    - File tracking and verification

  7. Security
    - Row Level Security enabled
    - User-based access control
    - Admin verification workflow
    - Secure document handling

  8. Performance
    - Optimized indexes for search
    - Efficient data types
    - Proper constraints
*/

-- Drop existing properties table to recreate with complete UI-based schema
DROP TABLE IF EXISTS properties CASCADE;

-- Create comprehensive properties table based on UI flow
CREATE TABLE properties (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Entry Point Tracking
  entry_method TEXT CHECK (entry_method IN ('get_started_now', 'continue_registration')) DEFAULT 'get_started_now',
  registration_step TEXT DEFAULT 'entry_point', -- Track current step in registration
  
  -- Property Owner Information (from Account Setup)
  property_owner_id UUID REFERENCES profiles(id), -- Partner account if different from user_id
  owner_email TEXT,
  owner_password_hash TEXT, -- For partner accounts
  is_partner_account BOOLEAN DEFAULT false,
  
  -- Main Property Category Selection
  main_category TEXT CHECK (main_category IN ('apartment', 'homes', 'hotels_bnbs', 'alternative_places')),
  
  -- Apartment Flow
  apartment_type TEXT CHECK (apartment_type IN ('one_apartment', 'multiple_apartments')),
  apartment_same_address BOOLEAN, -- For multiple apartments
  
  -- Homes Flow
  homes_accommodation_type TEXT CHECK (homes_accommodation_type IN ('entire_place', 'private_room')),
  
  -- Homes - Entire Place Categories
  homes_entire_category TEXT CHECK (homes_entire_category IN (
    'apartment', 'holiday_home', 'villa', 'chalet', 'holiday_park', 'aparthotel'
  )),
  homes_entire_property_count TEXT CHECK (homes_entire_property_count IN ('one', 'multiple')),
  
  -- Homes - Private Room Categories  
  homes_private_category TEXT CHECK (homes_private_category IN (
    'guest_house', 'bed_breakfast', 'homestay', 'country_house', 'aparthotel', 'farm_stay', 'lodge'
  )),
  homes_private_property_count TEXT CHECK (homes_private_property_count IN ('one', 'multiple')),
  
  -- Hotels & B&Bs Flow
  hotel_type TEXT CHECK (hotel_type IN (
    'hotel', 'guest_house', 'bed_breakfast', 'homestay', 'hostel', 'aparthotel',
    'capsule_hotel', 'country_house', 'farm_stay', 'inn', 'love_hotel', 'motel',
    'resort', 'riad', 'ryokan', 'lodge'
  )),
  hotel_property_count TEXT CHECK (hotel_property_count IN ('one', 'multiple')),
  
  -- Alternative Places Flow
  alternative_booking_type TEXT CHECK (alternative_booking_type IN ('entire_place', 'private_room')),
  alternative_category TEXT CHECK (alternative_category IN ('campsite', 'boat', 'luxury_tent')),
  alternative_tent_count TEXT CHECK (alternative_tent_count IN ('one', 'multiple')),
  
  -- Multiple Properties Configuration
  is_multiple_properties BOOLEAN DEFAULT false,
  property_count INTEGER DEFAULT 1 CHECK (property_count >= 1 AND property_count <= 50),
  same_address BOOLEAN DEFAULT true,
  listing_type TEXT DEFAULT 'single' CHECK (listing_type IN ('single', 'multiple_same_address', 'multiple_different_address')),
  
  -- Property addresses for multiple locations
  property_addresses JSONB DEFAULT '[]'::jsonb,
  individual_property_details JSONB DEFAULT '[]'::jsonb,
  bulk_listing_notes TEXT,
  
  -- Basic property information (from Basic Info page)
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL, -- City, State format
  address TEXT NOT NULL, -- Full street address
  property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'apartment', 'villa')),
  
  -- Property specifications
  bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  property_size TEXT, -- e.g., "1200 sq ft"
  floor_number INTEGER,
  
  -- Pricing
  price_per_night INTEGER NOT NULL CHECK (price_per_night > 0),
  cleaning_fee INTEGER DEFAULT 0 CHECK (cleaning_fee >= 0),
  security_deposit INTEGER DEFAULT 0 CHECK (security_deposit >= 0),
  extra_guest_fee INTEGER DEFAULT 0 CHECK (extra_guest_fee >= 0),
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  emergency_contact TEXT,
  
  -- Property features and amenities
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  
  -- Property rules and policies
  property_rules TEXT[] DEFAULT '{}',
  cancellation_policy TEXT DEFAULT 'Flexible cancellation up to 24 hours before check-in',
  check_in_time TEXT DEFAULT '3:00 PM',
  check_out_time TEXT DEFAULT '11:00 AM',
  minimum_stay INTEGER DEFAULT 1 CHECK (minimum_stay > 0),
  maximum_stay INTEGER DEFAULT 30 CHECK (maximum_stay > 0),
  
  -- Booking settings
  instant_book BOOLEAN DEFAULT false,
  advance_booking_days INTEGER DEFAULT 365,
  
  -- Pricing details
  weekly_discount DECIMAL(5,2) DEFAULT 0 CHECK (weekly_discount >= 0 AND weekly_discount <= 100),
  monthly_discount DECIMAL(5,2) DEFAULT 0 CHECK (monthly_discount >= 0 AND monthly_discount <= 100),
  
  -- Document management
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
  
  -- Location details
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  nearby_attractions TEXT[] DEFAULT '{}',
  transportation_info TEXT,
  
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
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = property_owner_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = property_owner_id);

CREATE POLICY "Users can delete own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = property_owner_id);

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
CREATE INDEX idx_properties_property_owner_id ON properties(property_owner_id);
CREATE INDEX idx_properties_main_category ON properties(main_category);
CREATE INDEX idx_properties_apartment_type ON properties(apartment_type);
CREATE INDEX idx_properties_homes_accommodation_type ON properties(homes_accommodation_type);
CREATE INDEX idx_properties_hotel_type ON properties(hotel_type);
CREATE INDEX idx_properties_alternative_category ON properties(alternative_category);
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
CREATE INDEX idx_properties_registration_step ON properties(registration_step);

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

-- Add constraint to ensure property_count matches multiple properties flag
ALTER TABLE properties 
ADD CONSTRAINT valid_property_count_for_multiple 
CHECK (
  (is_multiple_properties = false AND property_count = 1) OR
  (is_multiple_properties = true AND property_count > 1)
);

-- Create function to automatically set property flags based on selections
CREATE OR REPLACE FUNCTION set_property_flags()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_multiple_properties based on selections
  IF NEW.apartment_type = 'multiple_apartments' OR
     NEW.homes_entire_property_count = 'multiple' OR
     NEW.homes_private_property_count = 'multiple' OR
     NEW.hotel_property_count = 'multiple' OR
     NEW.alternative_tent_count = 'multiple' THEN
    NEW.is_multiple_properties = true;
  ELSE
    NEW.is_multiple_properties = false;
    NEW.property_count = 1;
  END IF;
  
  -- Set listing_type based on multiple properties and address settings
  IF NEW.is_multiple_properties = false THEN
    NEW.listing_type = 'single';
    NEW.same_address = true;
  ELSIF NEW.is_multiple_properties = true THEN
    IF NEW.apartment_same_address = true OR NEW.same_address = true THEN
      NEW.listing_type = 'multiple_same_address';
      NEW.same_address = true;
    ELSE
      NEW.listing_type = 'multiple_different_address';
      NEW.same_address = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set property flags
CREATE TRIGGER set_properties_flags
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_flags();

-- Create view for properties with enhanced UI flow details
CREATE OR REPLACE VIEW properties_with_ui_flow AS
SELECT 
  p.*,
  prof.name as owner_name,
  prof.email as owner_email,
  owner_prof.name as property_owner_name,
  owner_prof.email as property_owner_email,
  
  -- UI Flow Summary
  CASE 
    WHEN p.main_category = 'apartment' THEN 
      CASE 
        WHEN p.apartment_type = 'one_apartment' THEN 'Single Apartment'
        WHEN p.apartment_type = 'multiple_apartments' AND p.apartment_same_address = true THEN 'Multiple Apartments - Same Building'
        WHEN p.apartment_type = 'multiple_apartments' AND p.apartment_same_address = false THEN 'Multiple Apartments - Different Buildings'
        ELSE 'Apartment'
      END
    WHEN p.main_category = 'homes' THEN
      CASE 
        WHEN p.homes_accommodation_type = 'entire_place' THEN 
          CONCAT('Entire ', COALESCE(p.homes_entire_category, 'Home'), 
                 CASE WHEN p.homes_entire_property_count = 'multiple' THEN ' (Multiple)' ELSE '' END)
        WHEN p.homes_accommodation_type = 'private_room' THEN 
          CONCAT('Private Room in ', COALESCE(p.homes_private_category, 'Home'),
                 CASE WHEN p.homes_private_property_count = 'multiple' THEN ' (Multiple)' ELSE '' END)
        ELSE 'Home'
      END
    WHEN p.main_category = 'hotels_bnbs' THEN 
      CONCAT(COALESCE(p.hotel_type, 'Hotel'), 
             CASE WHEN p.hotel_property_count = 'multiple' THEN ' (Multiple)' ELSE '' END)
    WHEN p.main_category = 'alternative_places' THEN
      CASE 
        WHEN p.alternative_category = 'luxury_tent' THEN 
          CONCAT('Luxury Tent', CASE WHEN p.alternative_tent_count = 'multiple' THEN 's' ELSE '' END)
        ELSE COALESCE(p.alternative_category, 'Alternative Place')
      END
    ELSE 'Unknown'
  END as property_flow_summary,
  
  -- Property count summary
  CASE 
    WHEN p.is_multiple_properties = true THEN p.property_count 
    ELSE 1 
  END as total_units,
  
  -- Document count
  jsonb_array_length(COALESCE(p.documents, '[]'::jsonb)) as document_count,
  
  -- Required documents count
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(COALESCE(p.documents, '[]'::jsonb)) as doc
    WHERE doc->>'type' IN ('aadhar', 'pan', 'property_details', 'bank_details')
  ) as required_documents_count
  
FROM properties p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN profiles owner_prof ON p.property_owner_id = owner_prof.id
ORDER BY p.created_at DESC;

-- Grant access to the view
GRANT SELECT ON properties_with_ui_flow TO authenticated;

-- Create function to get property listing statistics by category
CREATE OR REPLACE FUNCTION get_property_category_stats()
RETURNS TABLE(
  main_category TEXT,
  total_properties BIGINT,
  pending_properties BIGINT,
  approved_properties BIGINT,
  multiple_properties BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.main_category,
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE p.status = 'pending') as pending_properties,
    COUNT(*) FILTER (WHERE p.status = 'approved') as approved_properties,
    COUNT(*) FILTER (WHERE p.is_multiple_properties = true) as multiple_properties
  FROM properties p
  WHERE p.main_category IS NOT NULL
  GROUP BY p.main_category
  ORDER BY total_properties DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track registration progress
CREATE OR REPLACE FUNCTION update_registration_step(
  property_id UUID,
  step_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE properties 
  SET 
    registration_step = step_name,
    updated_at = NOW(),
    last_modified_at = NOW(),
    last_modified_by = auth.uid()
  WHERE id = property_id 
    AND (user_id = auth.uid() OR property_owner_id = auth.uid());
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get incomplete registrations for user
CREATE OR REPLACE FUNCTION get_incomplete_registrations(user_uuid UUID)
RETURNS TABLE(
  property_id UUID,
  registration_step TEXT,
  main_category TEXT,
  created_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.registration_step,
    p.main_category,
    p.created_at,
    p.last_modified_at
  FROM properties p
  WHERE (p.user_id = user_uuid OR p.property_owner_id = user_uuid)
    AND p.status = 'pending'
    AND p.registration_step != 'completed'
  ORDER BY p.last_modified_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;