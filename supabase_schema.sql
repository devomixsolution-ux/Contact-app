
-- 1. Enable extensions
create extension if not exists "uuid-ossp";

-- 2. Madrasahs Table
create table if not exists madrasahs (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'নতুন মাদরাসা',
  phone text,
  logo_url text,
  login_code text, 
  is_active boolean default true,
  is_super_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Classes Table
create table if not exists classes (
  id uuid default uuid_generate_v4() primary key,
  madrasah_id uuid references madrasahs(id) on delete cascade not null,
  class_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Students Table
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  madrasah_id uuid references madrasahs(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  student_name text not null,
  guardian_name text,
  roll integer,
  guardian_phone text not null,
  guardian_phone_2 text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Recent Calls Table
create table if not exists recent_calls (
  id uuid default uuid_generate_v4() primary key,
  madrasah_id uuid references madrasahs(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  guardian_phone text not null,
  called_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for all tables
alter table madrasahs enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table recent_calls enable row level security;

-- Helper function for Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM madrasahs
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Madrasahs
drop policy if exists "Madrasah: Select self or as super" on madrasahs;
create policy "Madrasah: Select self or as super" on madrasahs for select using (auth.uid() = id or is_super_admin());

drop policy if exists "Madrasah: Update self or as super" on madrasahs;
create policy "Madrasah: Update self or as super" on madrasahs for update using (auth.uid() = id or is_super_admin());

-- Policies for Classes
drop policy if exists "Classes: Madrasah owner access" on classes;
create policy "Classes: Madrasah owner access" on classes for all using (auth.uid() = madrasah_id);

-- Policies for Students
drop policy if exists "Students: Madrasah owner access" on students;
create policy "Students: Madrasah owner access" on students for all using (auth.uid() = madrasah_id);

-- Policies for Recent Calls
drop policy if exists "Calls: Madrasah owner access" on recent_calls;
create policy "Calls: Madrasah owner access" on recent_calls for all using (auth.uid() = madrasah_id);
