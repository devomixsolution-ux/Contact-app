
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
import { View, Class, Student, Language, Madrasah } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'bn';
  });

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, []);

  const fetchMadrasahProfile = async (userId: string) => {
    const { data } = await supabase
      .from('madrasahs')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setMadrasah(data);
      localStorage.setItem('m_name', data.name);
      if (data.logo_url) localStorage.setItem('m_logo', data.logo_url);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth lang={lang} />;
  }

  return (
    <Layout currentView={view} setView={setView} lang={lang} madrasah={madrasah}>
      {view === 'home' && (
        <Home onStudentClick={navigateToStudentDetails} lang={lang} />
      )}
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
            fetchMadrasahProfile(session.user.id);
            setView(selectedClass ? 'students' : 'home');
          }}
          onCancel={() => {
            setView(selectedStudent ? 'student-details' : 'students');
          }}
          lang={lang}
        />
      )}
      {view === 'account' && (
        <Account lang={lang} setLang={changeLanguage} onProfileUpdate={() => fetchMadrasahProfile(session.user.id)} />
      )}
    </Layout>
  );
};

export default App;
