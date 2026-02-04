
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Classes from './pages/Classes';
import Students from './pages/Students';
import StudentDetails from './pages/StudentDetails';
import StudentForm from './pages/StudentForm';
import Account from './pages/Account';
import AdminPanel from './pages/AdminPanel';
import { View, Class, Student, Language, Madrasah } from './types';
import { WifiOff, AlertCircle } from 'lucide-react';
import { t } from './translations';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'bn';
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMadrasahProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMadrasahProfile(session.user.id);
      else setMadrasah(null);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMadrasahProfile = async (userId: string) => {
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        // SECURITY CHECK: If account is disabled, force logout
        if (data.is_active === false) {
          alert(t('account_disabled', lang));
          await supabase.auth.signOut();
          setMadrasah(null);
          setSession(null);
          return;
        }

        setMadrasah(data);
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        localStorage.setItem('m_name', data.name);
        if (data.logo_url) localStorage.setItem('m_logo', data.logo_url);
      }
    } else {
      const cachedProfile = localStorage.getItem(`profile_${userId}`);
      if (cachedProfile) setMadrasah(JSON.parse(cachedProfile));
    }
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const navigateToStudents = (cls: Class) => {
    setSelectedClass(cls);
    setView('students');
  };

  const navigateToStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setView('student-details');
  };

  const navigateToStudentForm = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      setIsEditing(true);
    } else {
      setSelectedStudent(null);
      setIsEditing(false);
    }
    setView('student-form');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d35132]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth lang={lang} />;
  }

  const isSuperAdmin = madrasah?.is_super_admin === true;

  return (
    <div className="relative h-full w-full">
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-md text-white text-[10px] font-black py-1 px-4 z-[60] flex items-center justify-center gap-2 uppercase tracking-widest border-b border-white/10">
          <WifiOff size={10} />
          {lang === 'bn' ? 'অফলাইন মোড' : 'Offline Mode'}
        </div>
      )}
      <Layout currentView={view} setView={setView} lang={lang} madrasah={madrasah}>
        {view === 'home' && (
          isSuperAdmin ? (
            <AdminPanel lang={lang} isStandalone={true} />
          ) : (
            <Home onStudentClick={navigateToStudentDetails} lang={lang} />
          )
        )}
        
        {!isSuperAdmin && (
          <>
            {view === 'classes' && (
              <Classes onClassClick={navigateToStudents} lang={lang} />
            )}
            {view === 'students' && selectedClass && (
              <Students 
                selectedClass={selectedClass} 
                onStudentClick={navigateToStudentDetails} 
                onAddClick={() => navigateToStudentForm()}
                onBack={() => setView('classes')}
                lang={lang}
              />
            )}
            {view === 'student-details' && selectedStudent && (
              <StudentDetails 
                student={selectedStudent} 
                onEdit={() => navigateToStudentForm(selectedStudent)}
                onBack={() => setView(selectedClass ? 'students' : 'home')}
                lang={lang}
              />
            )}
            {view === 'student-form' && (
              <StudentForm 
                student={selectedStudent} 
                defaultClassId={selectedClass?.id}
                isEditing={isEditing} 
                onSuccess={() => {
                  if (session) fetchMadrasahProfile(session.user.id);
                  setView(selectedClass ? 'students' : 'home');
                }}
                onCancel={() => {
                  setView(selectedStudent ? 'student-details' : 'students');
                }}
                lang={lang}
              />
            )}
          </>
        )}

        {view === 'account' && (
          <Account 
            lang={lang} 
            setLang={changeLanguage} 
            onProfileUpdate={() => session && fetchMadrasahProfile(session.user.id)}
            setView={setView}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </Layout>
    </div>
  );
};

export default App;
