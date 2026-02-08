-- ১. প্রয়োজনীয় এক্সটেনশন চালু করা
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ২. মাদরাসা টেবিল তৈরি (মেইন প্রোফাইল)
CREATE TABLE IF NOT EXISTS public.madrasahs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'নতুন মাদরাসা',
    phone TEXT,
    logo_url TEXT,
    login_code TEXT, 
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. ক্লাস টেবিল
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    madrasah_id UUID REFERENCES public.madrasahs(id) ON DELETE CASCADE NOT NULL,
    class_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৪. ছাত্র টেবিল
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    madrasah_id UUID REFERENCES public.madrasahs(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    guardian_name TEXT,
    roll INTEGER,
    guardian_phone TEXT NOT NULL,
    guardian_phone_2 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৫. কল হিস্ট্রি টেবিল
CREATE TABLE IF NOT EXISTS public.recent_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    madrasah_id UUID REFERENCES public.madrasahs(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    guardian_phone TEXT NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৬. ডিভাইস সেশন টেবিল (ডিভাইস ট্র্যাকিং এর জন্য)
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    madrasah_id UUID REFERENCES public.madrasahs(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL, 
    device_info TEXT, 
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(madrasah_id, device_id)
);

-- RLS চালু করা
ALTER TABLE public.madrasahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- ৭. রিকারশন-সেফ সুপার অ্যাডমিন চেক ফাংশন
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.madrasahs
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ৮. মাদরাসা টেবিলের পলিসি (আপনার দেওয়া কোড অনুযায়ী)
DROP POLICY IF EXISTS "madrasahs_select_all" ON public.madrasahs;
CREATE POLICY "madrasahs_select_all" ON public.madrasahs 
FOR SELECT USING (auth.uid() = id OR public.check_is_super_admin());

DROP POLICY IF EXISTS "madrasahs_update_all" ON public.madrasahs;
CREATE POLICY "madrasahs_update_all" ON public.madrasahs 
FOR UPDATE USING (auth.uid() = id OR public.check_is_super_admin());

DROP POLICY IF EXISTS "madrasahs_insert_self" ON public.madrasahs;
CREATE POLICY "madrasahs_insert_self" ON public.madrasahs 
FOR INSERT WITH CHECK (auth.uid() = id);

-- ৯. ফিচার টেবিলের পলিসি
CREATE POLICY "Classes access" ON public.classes FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());
CREATE POLICY "Students access" ON public.students FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());
CREATE POLICY "Calls access" ON public.recent_calls FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());

-- ১০. ডিভাইস সেশন পলিসি
DROP POLICY IF EXISTS "Sessions: Access Policy" ON public.device_sessions;
CREATE POLICY "Sessions: Access Policy" 
ON public.device_sessions 
FOR ALL 
USING (auth.uid() = madrasah_id OR public.check_is_super_admin());

-- ১১. নিজেকে সুপার অ্যাডমিন বানানো (আপনার আইডি এখানে দিন)
-- UPDATE public.madrasahs SET is_super_admin = true WHERE id = 'YOUR_UUID_HERE';
