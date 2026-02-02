
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
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-[#d35132] via-[#e57d4a] to-[#d35132] font-['Hind_Siliguri']">
      
      {/* Top Header - Glass Effect */}
      <header className="flex-none px-6 pt-[calc(env(safe-area-inset-top)+14px)] pb-4 flex items-center gap-4 z-50 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/40 bg-white/20 shadow-xl shrink-0">
          {madrasah?.logo_url ? (
            <img src={madrasah.logo_url} className="w-full h-full object-cover" alt="Logo" />
          ) : (
            <BookOpen size={28} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate leading-tight tracking-tight drop-shadow-md font-noto">
            {madrasah?.name || 'মাদরাসা কন্টাক্ট'}
          </h1>
          <p className="text-[12px] font-bold text-white/80 uppercase tracking-[0.15em] leading-none mt-1">
            {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          </p>
        </div>
      </header>

      {/* Main Content Area - This is where internal scrolling happens */}
      <main className="flex-1 overflow-y-auto px-6 pt-5 pb-28 w-full max-w-md mx-auto no-select scroll-smooth">
        {children}
      </main>

      {/* Bottom Navigation - Glass Effect */}
      <nav className="flex-none bg-white/10 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center py-3 px-6 pb-[calc(env(safe-area-inset-bottom,16px)+10px)] z-50 shadow-[0_-15px_50px_rgba(0,0,0,0.15)]">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 p-2 ${isTabActive('home') ? 'text-white' : 'text-white/40'}`}
        >
          <Home size={26} strokeWidth={isTabActive('home') ? 2.5 : 2} />
          <span className={`text-[12px] font-black uppercase tracking-wider ${isTabActive('home') ? 'opacity-100' : 'opacity-70'}`}>{t('home', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('classes')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 p-2 ${isTabActive('classes') ? 'text-white' : 'text-white/40'}`}
        >
          <Users size={26} strokeWidth={isTabActive('classes') ? 2.5 : 2} />
          <span className={`text-[12px] font-black uppercase tracking-wider ${isTabActive('classes') ? 'opacity-100' : 'opacity-70'}`}>{t('classes', lang)}</span>
        </button>
        
        <button 
          onClick={() => setView('account')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 p-2 ${isTabActive('account') ? 'text-white' : 'text-white/40'}`}
        >
          <User size={26} strokeWidth={isTabActive('account') ? 2.5 : 2} />
          <span className={`text-[12px] font-black uppercase tracking-wider ${isTabActive('account') ? 'opacity-100' : 'opacity-70'}`}>{t('account', lang)}</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
