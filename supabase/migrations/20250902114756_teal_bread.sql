/*
  # Add Multiple Apartments Support to Properties Table

  1. New Columns
    - `is_multiple_properties` (boolean) - Whether this is a multiple property listing
    - `property_count` (integer) - Number of properties in the listing
    - `same_address` (boolean) - Whether all properties share the same address
    - `property_addresses` (jsonb) - Array of addresses for different locations
    - `listing_type` (text) - Type of listing (single, multiple_same_address, multiple_different_address)

  2. Enhanced Features
    - Support for bulk property listings
    - Address management for multiple locations
    - Proper indexing for search and filtering
    - Validation constraints for data integrity

  3. Security
    - Maintain existing RLS policies
    - Add validation for multiple property data
    - Ensure data consistency

  4. Performance
    - Add indexes for new columns
    - Optimize queries for multiple property searches
*/

-- Add new columns for multiple apartments support
DO $$
BEGIN
  -- Add is_multiple_properties column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_multiple_properties'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_multiple_properties BOOLEAN DEFAULT false;
  END IF;

  -- Add property_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_count'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_count INTEGER DEFAULT 1 CHECK (property_count >= 1 AND property_count <= 50);
  END IF;

  -- Add same_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'same_address'
  ) THEN
    ALTER TABLE properties ADD COLUMN same_address BOOLEAN DEFAULT true;
  END IF;

  -- Add property_addresses column for storing multiple addresses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'property_addresses'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_addresses JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add listing_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'listing_type'
  ) THEN
    ALTER TABLE properties ADD COLUMN listing_type TEXT DEFAULT 'single' CHECK (listing_type IN ('single', 'multiple_same_address', 'multiple_different_address'));
  END IF;

  -- Add individual_property_details for storing details of each property in multiple listings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'individual_property_details'
  ) THEN
    ALTER TABLE properties ADD COLUMN individual_property_details JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add bulk_listing_notes for additional notes about the bulk listing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'bulk_listing_notes'
  ) THEN
    ALTER TABLE properties ADD COLUMN bulk_listing_notes TEXT;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_properties_is_multiple ON properties(is_multiple_properties);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_count ON properties(property_count);
CREATE INDEX IF NOT EXISTS idx_properties_same_address ON properties(same_address);

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

-- Add constraints to validate JSON structures
ALTER TABLE properties 
ADD CONSTRAINT valid_property_addresses_structure 
CHECK (validate_property_addresses(property_addresses));

ALTER TABLE properties 
ADD CONSTRAINT valid_individual_property_details_structure 
CHECK (validate_individual_property_details(individual_property_details));

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

-- Create view for multiple properties with expanded details
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
  END as listing_type_display
FROM properties p
LEFT JOIN profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC;

-- Grant access to the new view
GRANT SELECT ON properties_with_details TO authenticated;