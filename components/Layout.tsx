
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
    <div 
      className="flex flex-col overflow-hidden bg-gradient-to-br from-[#d35132] via-[#e57d4a] to-[#d35132] font-['Hind_Siliguri'] w-full"
      style={{ height: 'var(--app-height, 100%)' }}
    >
      
      {/* Refined Header - More Compact */}
      <header className="flex-none px-5 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 flex items-center gap-3 z-50 border-b border-white/10 bg-white/10 backdrop-blur-md">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden border border-white/30 bg-white/20 shadow-lg shrink-0">
          {madrasah?.logo_url ? (
            <img src={madrasah.logo_url} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <BookOpen size={22} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-white truncate leading-none tracking-tight font-noto">
            {madrasah?.name || 'মাদরাসা কন্টাক্ট'}
          </h1>
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.1em] mt-1">
            {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          </p>
        </div>
      </header>

      {/* Main Content Area - Refined Padding */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 w-full max-w-md mx-auto no-select scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation - Compact Height */}
      <nav className="flex-none bg-white/10 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center py-2 px-4 pb-[calc(env(safe-area-inset-bottom,12px)+8px)] z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-1.5 ${isTabActive('home') ? 'text-white' : 'text-white/40'}`}
        >
          <Home size={22} strokeWidth={isTabActive('home') ? 2.5 : 2} />
          <span className={`text-[10px] font-black uppercase tracking-wider ${isTabActive('home') ? 'opacity-100' : 'opacity-70'}`}>{t('home', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('classes')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-1.5 ${isTabActive('classes') ? 'text-white' : 'text-white/40'}`}
        >
          <Users size={22} strokeWidth={isTabActive('classes') ? 2.5 : 2} />
          <span className={`text-[10px] font-black uppercase tracking-wider ${isTabActive('classes') ? 'opacity-100' : 'opacity-70'}`}>{t('classes', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('account')}
          className={`flex flex-col items-center gap-1 transition-all active:scale-90 p-1.5 ${isTabActive('account') ? 'text-white' : 'text-white/40'}`}
        >
          <User size={22} strokeWidth={isTabActive('account') ? 2.5 : 2} />
          <span className={`text-[10px] font-black uppercase tracking-wider ${isTabActive('account') ? 'opacity-100' : 'opacity-70'}`}>{t('account', lang)}</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
