
-- 1. Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 2. Create or Update 'madrasahs' table
create table if not exists madrasahs (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'নতুন মাদরাসা',
  phone text, -- মোবাইল নম্বর কলাম
  logo_url text, -- লোগো ইউআরএল কলাম
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- কলামগুলো যদি আগে থেকে না থাকে তবে সেগুলো যুক্ত করার জন্য নিচের অল্টার কমান্ডগুলো কাজ করবে
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='madrasahs' and column_name='phone') then
    alter table madrasahs add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='madrasahs' and column_name='logo_url') then
    alter table madrasahs add column logo_url text;
  end if;
end $$;

-- 3. Create 'classes' table
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null,
  madrasah_id uuid not null references madrasahs(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create 'students' table
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  student_name text not null,
  roll integer,
  guardian_phone text not null,
  class_id uuid not null references classes(id) on delete cascade,
  madrasah_id uuid not null references madrasahs(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create 'recent_calls' table
create table if not exists recent_calls (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  guardian_phone text not null,
  madrasah_id uuid not null references madrasahs(id) on delete cascade,
  called_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Enable Row Level Security (RLS)
alter table madrasahs enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table recent_calls enable row level security;

-- 7. Define RLS Policies
drop policy if exists "Admins can manage their own madrasah profile" on madrasahs;
create policy "Admins can manage their own madrasah profile" on madrasahs for all using (auth.uid() = id);

drop policy if exists "Admins can manage their own classes" on classes;
create policy "Admins can manage their own classes" on classes for all using (auth.uid() = madrasah_id);

drop policy if exists "Admins can manage their own students" on students;
create policy "Admins can manage their own students" on students for all using (auth.uid() = madrasah_id);

drop policy if exists "Admins can manage their own call history" on recent_calls;
create policy "Admins can manage their own call history" on recent_calls for all using (auth.uid() = madrasah_id);

-- 8. AUTOMATIC PROFILE TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.madrasahs (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'নতুন মাদরাসা'), new.raw_user_meta_data->>'madrasah_phone');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
