/*
  # Fix Properties Table ID Default Value

  1. Problem
    - Properties table missing DEFAULT value for id column
    - Causing "null value in column id violates not-null constraint" error

  2. Solution
    - Add DEFAULT gen_random_uuid() to id column
    - Ensure all inserts automatically generate UUID

  3. Safety
    - Use IF NOT EXISTS to prevent errors
    - Preserve existing data
*/

-- Add default value to properties id column if not already set
DO $$
BEGIN
  -- Check if the id column already has a default value
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    -- Add default value for id column
    ALTER TABLE properties 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Ensure the id column is properly configured
ALTER TABLE properties 
ALTER COLUMN id SET NOT NULL;

-- Verify the constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'properties' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE properties ADD PRIMARY KEY (id);
  END IF;
END $$;