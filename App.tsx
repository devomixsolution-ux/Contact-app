
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
import { WifiOff, Loader2 } from 'lucide-react';
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
  const [dataVersion, setDataVersion] = useState(0); 
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'bn';
  });

  const triggerRefresh = () => {
    setDataVersion(prev => prev + 1);
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        fetchMadrasahProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchMadrasahProfile(session.user.id);
      } else {
        setMadrasah(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const fetchMadrasahProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile missing - create it
          const { data: newData, error: insertError } = await supabase
            .from('madrasahs')
            .insert([{ id: userId, name: 'নতুন মাদরাসা' }])
            .select().single();
          
          if (insertError) throw insertError;
          setMadrasah(newData);
        } else {
          console.error("Profile load error:", error);
        }
      } else {
        if (data.is_active === false && !data.is_super_admin) {
          alert(t('account_disabled', lang));
          await supabase.auth.signOut();
          return;
        }
        setMadrasah(data);
      }
    } catch (e) {
      console.error("Profile exception:", e);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (newView: View) => {
    if (newView !== view) triggerRefresh();
    setView(newView);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#d35132] text-white">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">System Synchronizing...</p>
      </div>
    );
  }

  if (!session) return <Auth lang={lang} />;

  const isSuperAdmin = madrasah?.is_super_admin === true;

  return (
    <div className="relative h-full w-full bg-[#d35132]">
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-md text-white text-[10px] font-black py-1.5 px-4 z-[60] flex items-center justify-center gap-2 uppercase tracking-widest border-b border-white/10">
          <WifiOff size={10} /> {lang === 'bn' ? 'অফলাইন মোড' : 'Offline Mode'}
        </div>
      )}
      
      <Layout currentView={view} setView={navigateTo} lang={lang} madrasah={madrasah}>
        {view === 'home' && (
          isSuperAdmin ? <AdminPanel lang={lang} /> : 
          <Home 
            onStudentClick={(s) => { setSelectedStudent(s); navigateTo('student-details'); }} 
            lang={lang} 
            dataVersion={dataVersion}
            triggerRefresh={triggerRefresh}
          />
        )}
        
        {view === 'classes' && <Classes onClassClick={(cls) => { setSelectedClass(cls); navigateTo('students'); }} lang={lang} dataVersion={dataVersion} />}
        
        {view === 'students' && selectedClass && (
          <Students 
            selectedClass={selectedClass} 
            onStudentClick={(s) => { setSelectedStudent(s); navigateTo('student-details'); }} 
            onAddClick={() => { setSelectedStudent(null); setIsEditing(false); navigateTo('student-form'); }}
            onBack={() => navigateTo('classes')}
            lang={lang}
            dataVersion={dataVersion}
            triggerRefresh={triggerRefresh}
          />
        )}

        {view === 'student-details' && selectedStudent && (
          <StudentDetails 
            student={selectedStudent} 
            onEdit={() => { setIsEditing(true); navigateTo('student-form'); }}
            onBack={() => navigateTo(selectedClass ? 'students' : 'home')}
            lang={lang}
            triggerRefresh={triggerRefresh}
          />
        )}

        {view === 'student-form' && (
          <StudentForm 
            student={selectedStudent} 
            defaultClassId={selectedClass?.id}
            isEditing={isEditing} 
            onSuccess={() => navigateTo(selectedClass ? 'students' : 'home')}
            onCancel={() => navigateTo(selectedStudent ? 'student-details' : (selectedClass ? 'students' : 'home'))}
            lang={lang}
          />
        )}

        {view === 'account' && (
          <Account 
            lang={lang} 
            setLang={(l) => { setLang(l); localStorage.setItem('app_lang', l); }} 
            onProfileUpdate={() => session && fetchMadrasahProfile(session.user.id)}
            setView={navigateTo}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </Layout>
    </div>
  );
};

export default App;
