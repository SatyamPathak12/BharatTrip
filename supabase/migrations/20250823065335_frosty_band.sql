/*
  # Create properties table for property management

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text, not null)
      - `description` (text)
      - `location` (text, not null)
      - `address` (text, not null)
      - `property_type` (text, not null)
      - `price_per_night` (integer, not null)
      - `max_guests` (integer, not null)
      - `bedrooms` (integer, not null)
      - `bathrooms` (integer, not null)
      - `amenities` (text array)
      - `images` (text array)
      - `contact_name` (text, not null)
      - `contact_email` (text, not null)
      - `contact_phone` (text, not null)
      - `status` (text, default 'pending')
      - `admin_notes` (text)
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())
      - `approved_at` (timestamp with timezone)
      - `approved_by` (uuid, references profiles)

  2. Security
    - Enable RLS on `properties` table
    - Add policies for property owners and admins
    - Users can view their own properties
    - Admins can view and manage all properties
    - Public can view approved properties

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on status for admin filtering
    - Add index on location for search functionality
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'apartment', 'villa')),
  price_per_night INTEGER NOT NULL CHECK (price_per_night > 0),
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms > 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all properties" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view approved properties" ON properties
  FOR SELECT USING (status = 'approved');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_approved_at ON properties(approved_at);

-- Create trigger for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();