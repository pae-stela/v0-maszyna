-- Migration: add media columns to recipes table
-- Run this once in your Supabase Dashboard → SQL Editor

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images    JSONB,
  ADD COLUMN IF NOT EXISTS recipe_url        TEXT;
