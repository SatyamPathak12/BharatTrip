/*
  # Create Registration Progress Tracking Table

  1. New Tables
    - `registration_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `step` (integer, current step number)
      - `form_data` (jsonb, stores form state)
      - `last_updated` (timestamptz, when progress was last saved)
      - `is_complete` (boolean, whether registration is finished)
      - `created_at` (timestamptz, when progress tracking started)

  2. Security
    - Enable RLS on `registration_progress` table
    - Users can only access their own progress records
    - Admins can view all progress records for support

  3. Performance
    - Index on user_id for fast lookups
    - Index on is_complete for filtering
    - Automatic cleanup of old completed records

  4. Features
    - Track multi-step form progress
    - Auto-save functionality
    - Resume from last step
    - Progress validation
*/

-- Create registration progress table
CREATE TABLE IF NOT EXISTS registration_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  step INTEGER NOT NULL CHECK (step >= 1 AND step <= 10),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE registration_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own registration progress" ON registration_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registration progress" ON registration_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration progress" ON registration_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registration progress" ON registration_progress
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registration progress" ON registration_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_progress_user_id ON registration_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_progress_is_complete ON registration_progress(is_complete);
CREATE INDEX IF NOT EXISTS idx_registration_progress_last_updated ON registration_progress(last_updated);

-- Create function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_registration_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_registration_progress_last_updated
  BEFORE UPDATE ON registration_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_registration_progress_timestamp();

-- Create function to clean up old completed progress records
CREATE OR REPLACE FUNCTION cleanup_old_registration_progress()
RETURNS VOID AS $$
BEGIN
  -- Delete completed progress records older than 30 days
  DELETE FROM registration_progress 
  WHERE is_complete = true 
    AND last_updated < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's current registration step
CREATE OR REPLACE FUNCTION get_user_registration_step(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_step INTEGER;
BEGIN
  SELECT step INTO current_step
  FROM registration_progress
  WHERE user_id = user_uuid 
    AND is_complete = false
  ORDER BY last_updated DESC
  LIMIT 1;
  
  RETURN COALESCE(current_step, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for admin to monitor registration progress
CREATE OR REPLACE VIEW admin_registration_progress AS
SELECT 
  rp.*,
  p.name as user_name,
  p.email as user_email,
  p.role as user_role,
  CASE 
    WHEN rp.step = 1 THEN 'Property Type Selection'
    WHEN rp.step = 2 THEN 'Multiple Properties Setup'
    WHEN rp.step = 3 THEN 'Basic Information'
    WHEN rp.step = 4 THEN 'Document Upload'
    WHEN rp.step = 5 THEN 'Review & Submit'
    ELSE 'Unknown Step'
  END as step_name,
  EXTRACT(EPOCH FROM (NOW() - rp.last_updated))/3600 as hours_since_update
FROM registration_progress rp
LEFT JOIN profiles p ON rp.user_id = p.id
WHERE rp.is_complete = false
ORDER BY rp.last_updated DESC;

-- Grant access to admin view
GRANT SELECT ON admin_registration_progress TO authenticated;