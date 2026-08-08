# Supabase Setup

## 1) Create database table

Run the SQL in [supabase-schema.sql](supabase-schema.sql) inside Supabase SQL Editor.

## 2) Create storage bucket

In Supabase Storage, create bucket name:

- complaints-files

Keep bucket private.

## 3) Generate service role key

From Supabase project settings:

- Project URL -> SUPABASE_URL
- service_role key -> SUPABASE_SERVICE_ROLE_KEY

Never expose service role key in frontend code.

## 4) Configure environment variables

Set these in Vercel Project Settings -> Environment Variables:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET (optional, defaults to complaints-files)
- SESSION_SECRET
- ADMIN_USERNAME
- ADMIN_PASSWORD or ADMIN_PASSWORD_HASH

## 5) Verify deployment

- Submit one complaint with ID proof + photo
- Login admin dashboard
- Open file links from dashboard

If links open, signed URL flow is working.
