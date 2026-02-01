
import React from 'react';
import { Home, Users, User, BookOpen } from 'lucide-react';
import { View, Language, Madrasah } from '../types';
import { t } from '../translations';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  lang: Language;
  madrasah: Madrasah | null;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, lang, madrasah }) => {
  const isTabActive = (tab: string) => {
    if (tab === 'home' && currentView === 'home') return true;
    if (tab === 'classes' && (currentView === 'classes' || currentView === 'students' || currentView === 'student-details' || currentView === 'student-form')) return true;
    if (tab === 'account' && currentView === 'account') return true;
    return false;
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-white overflow-hidden font-['Hind_Siliguri']">
      {/* Top Header - Adjusted for Mobile App (Safe Area) */}
      <header className="flex-none bg-white border-b border-slate-50 px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 flex items-center gap-3 z-50">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-50 shadow-sm shrink-0">
          {madrasah?.logo_url ? (
            <img src={madrasah.logo_url} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <BookOpen size={24} className="text-emerald-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-slate-800 truncate leading-tight tracking-tight">
            {madrasah?.name || 'মাদরাসা কন্টাক্ট'}
          </h1>
          <p className="text-[11px] text-emerald-500 font-bold uppercase tracking-wide leading-none mt-0.5">
            {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-20 w-full max-w-md mx-auto no-select scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-white border-t border-slate-100 flex justify-around items-center py-2 px-6 pb-[calc(env(safe-area-inset-bottom,16px)+8px)] z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-2 ${isTabActive('home') ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Home size={24} strokeWidth={isTabActive('home') ? 2.5 : 2} />
          <span className={`text-[11px] font-bold ${isTabActive('home') ? 'opacity-100' : 'opacity-70'}`}>{t('home', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('classes')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-2 ${isTabActive('classes') ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Users size={24} strokeWidth={isTabActive('classes') ? 2.5 : 2} />
          <span className={`text-[11px] font-bold ${isTabActive('classes') ? 'opacity-100' : 'opacity-70'}`}>{t('classes', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('account')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-2 ${isTabActive('account') ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <User size={24} strokeWidth={isTabActive('account') ? 2.5 : 2} />
          <span className={`text-[11px] font-bold ${isTabActive('account') ? 'opacity-100' : 'opacity-70'}`}>{t('account', lang)}</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
