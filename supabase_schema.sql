
-- 1. Enable extensions
create extension if not exists "uuid-ossp";

-- 2. Madrasahs Table
create table if not exists madrasahs (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'নতুন মাদরাসা',
  phone text,
  logo_url text,
  login_code text, -- Used to store and display login password in admin panel
  is_active boolean default true,
  is_super_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table madrasahs enable row level security;

-- Function to avoid recursion in RLS
CREATE OR REPLACE FUNCTION check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM madrasahs
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies (Cleaning up old ones before creating)
drop policy if exists "madrasahs_select_all" on madrasahs;
create policy "madrasahs_select_all" on madrasahs 
for select using (auth.uid() = id or check_is_super_admin());

drop policy if exists "madrasahs_update_all" on madrasahs;
create policy "madrasahs_update_all" on madrasahs 
for update using (auth.uid() = id or check_is_super_admin());

drop policy if exists "madrasahs_insert_self" on madrasahs;
create policy "madrasahs_insert_self" on madrasahs 
for insert with check (auth.uid() = id);

-- Ensure login_code column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='madrasahs' AND column_name='login_code') THEN
        ALTER TABLE madrasahs ADD COLUMN login_code TEXT;
    END IF;
END $$;
