# Supabase Setup for Unduck

This directory contains the database schema and migrations for the Unduck search engine history feature.

## Setup Instructions

1. Create a new Supabase project at [https://supabase.com/](https://supabase.com/)

2. Run the migration file `migrations/001_create_searches_table.sql` in your Supabase SQL editor:
   - Go to the SQL editor in your Supabase dashboard
   - Copy and paste the contents of the migration file
   - Run the SQL commands

3. Update your `.env` file with your Supabase project URL and anon key:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Schema

The `searches` table has the following structure:

- `id` (UUID, primary key) - Unique identifier for each search
- `query` (TEXT) - The search query text
- `created_at` (TIMESTAMP) - When the search was performed

## Security

The table uses Row Level Security (RLS) with policies that allow all users to insert and select their own searches.

## Indexes

- Index on `query` column for faster text searches
- Index on `created_at` column for ordering results
