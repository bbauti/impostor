-- Add is_public column to rooms table
-- Defaults to false for backward compatibility
ALTER TABLE rooms ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient querying of public rooms
-- Partial index only indexes rows where is_public = true
CREATE INDEX idx_rooms_is_public ON rooms(is_public) WHERE is_public = true;

-- Create composite index for pagination (newest first)
-- Supports efficient ordering and filtering for public room listing
CREATE INDEX idx_rooms_public_created ON rooms(is_public, created_at DESC) WHERE is_public = true;
