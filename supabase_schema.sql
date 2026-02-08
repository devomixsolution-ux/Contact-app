-- ১. প্রয়োজনীয় এক্সটেনশন
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ২. মাদরাসা টেবিল
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

-- ৫. ডিভাইস সেশন টেবিল
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
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- ৬. রিকারশন-সেফ সুপার অ্যাডমিন চেক (SECURITY DEFINER ব্যবহার করে সরাসরি টেবিল অ্যাক্সেস)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT is_super_admin INTO is_admin FROM public.madrasahs WHERE id = auth.uid();
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ৭. মাদরাসা টেবিলের পলিসি (রিকারশন মুক্ত)
DROP POLICY IF EXISTS "madrasahs_select" ON public.madrasahs;
CREATE POLICY "madrasahs_select" ON public.madrasahs 
FOR SELECT USING (auth.uid() = id OR (SELECT is_super_admin FROM public.madrasahs WHERE id = auth.uid()));

DROP POLICY IF EXISTS "madrasahs_update" ON public.madrasahs;
CREATE POLICY "madrasahs_update" ON public.madrasahs 
FOR UPDATE USING (auth.uid() = id OR (SELECT is_super_admin FROM public.madrasahs WHERE id = auth.uid()));

-- ৮. অন্যান্য টেবিলের পলিসি
DROP POLICY IF EXISTS "Classes: Access" ON public.classes;
CREATE POLICY "Classes: Access" ON public.classes FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());

DROP POLICY IF EXISTS "Students: Access" ON public.students;
CREATE POLICY "Students: Access" ON public.students FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());

DROP POLICY IF EXISTS "Sessions: Access" ON public.device_sessions;
CREATE POLICY "Sessions: Access" ON public.device_sessions FOR ALL USING (auth.uid() = madrasah_id OR public.check_is_super_admin());
