
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
import { WifiOff } from 'lucide-react';
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

  const triggerRefresh = () => setDataVersion(prev => prev + 1);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Force refresh when window/app is focused (helpful for WebView)
    const handleFocus = () => triggerRefresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMadrasahProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMadrasahProfile(session.user.id);
      else {
        setMadrasah(null);
        setView('home');
        setLoading(false);
      }
    });

    // Supabase Realtime for instant UI sync
    const studentsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => triggerRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recent_calls' }, () => triggerRefresh())
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(studentsChannel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchMadrasahProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: createError } = await supabase
            .from('madrasahs')
            .insert([{ id: userId, name: 'নতুন মাদরাসা' }])
            .select()
            .single();
          if (newData) setMadrasah(newData);
        }
      } else if (data) {
        if (data.is_active === false && !data.is_super_admin) {
          alert(t('account_disabled', lang));
          await supabase.auth.signOut();
          return;
        }
        setMadrasah(data);
      }
    } catch (e) {
      console.error("Profile fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = madrasah?.is_super_admin === true;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#d35132] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-widest opacity-60">Initializing System...</p>
      </div>
    );
  }

  if (!session) return <Auth lang={lang} />;

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
            <AdminPanel lang={lang} />
          ) : (
            <Home 
              onStudentClick={(s) => { setSelectedStudent(s); setView('student-details'); }} 
              lang={lang} 
              dataVersion={dataVersion}
              triggerRefresh={triggerRefresh}
            />
          )
        )}
        
        {!isSuperAdmin && (
          <>
            {view === 'classes' && (
              <Classes onClassClick={(cls) => { setSelectedClass(cls); setView('students'); }} lang={lang} dataVersion={dataVersion} />
            )}
            {view === 'students' && selectedClass && (
              <Students 
                selectedClass={selectedClass} 
                onStudentClick={(s) => { setSelectedStudent(s); setView('student-details'); }} 
                onAddClick={() => { setSelectedStudent(null); setIsEditing(false); setView('student-form'); }}
                onBack={() => setView('classes')}
                lang={lang}
                dataVersion={dataVersion}
                triggerRefresh={triggerRefresh}
              />
            )}
            {view === 'student-details' && selectedStudent && (
              <StudentDetails 
                student={selectedStudent} 
                onEdit={() => { setIsEditing(true); setView('student-form'); }}
                onBack={() => { triggerRefresh(); setView(selectedClass ? 'students' : 'home'); }}
                lang={lang}
                triggerRefresh={triggerRefresh}
              />
            )}
            {view === 'student-form' && (
              <StudentForm 
                student={selectedStudent} 
                defaultClassId={selectedClass?.id}
                isEditing={isEditing} 
                onSuccess={() => { triggerRefresh(); setView(selectedClass ? 'students' : 'home'); }}
                onCancel={() => setView(selectedStudent ? 'student-details' : 'students')}
                lang={lang}
              />
            )}
          </>
        )}

        {view === 'account' && (
          <Account 
            lang={lang} 
            setLang={(l) => { setLang(l); localStorage.setItem('app_lang', l); }} 
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
