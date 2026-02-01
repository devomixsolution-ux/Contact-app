
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Mail, Lock, Loader2, Phone, User as UserIcon, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { t } from '../translations';

interface AuthProps {
  lang: Language;
}

const Auth: React.FC<AuthProps> = ({ lang }) => {
  const [emailInput, setEmailInput] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brandInfo, setBrandInfo] = useState({ name: 'Deenora App', logo: '' });

  useEffect(() => {
    const name = localStorage.getItem('m_name');
    const logo = localStorage.getItem('m_logo');
    if (name) setBrandInfo({ name, logo: logo || '' });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: emailInput.trim(), 
        password: code 
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('madrasahs')
          .select('name, logo_url')
          .eq('id', data.user.id)
          .single();
        
        if (profile) {
          localStorage.setItem('m_name', profile.name);
          if (profile.logo_url) localStorage.setItem('m_logo', profile.logo_url);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(t('login_error', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d35132] via-[#e57d4a] to-[#d35132] flex flex-col items-center justify-start p-6 overflow-hidden relative">
      
      <div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none z-0">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="w-full h-80">
           <path fill="#000000" d="M0,400 L1440,400 L1440,350 Q720,300 0,350 Z" />
           <path fill="#000000" d="M100,350 Q200,150 300,350 Z" />
           <path fill="#000000" d="M500,350 Q720,100 940,350 Z" />
           <rect x="1100" y="50" width="30" height="300" fill="#000000" />
           <circle cx="1115" cy="50" r="25" fill="#000000" />
           <rect x="1090" y="80" width="50" height="10" rx="5" fill="#000000" />
           <rect x="1090" y="150" width="50" height="10" rx="5" fill="#000000" />
        </svg>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-10 pt-10 z-10">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black text-white drop-shadow-lg leading-tight">
            Welcome to<br />{brandInfo.name}
          </h1>
          <p className="text-white/95 font-bold text-lg tracking-tight drop-shadow">Log in here.</p>
        </div>

        <div className="relative">
          <div className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center p-4 border border-white/30 shadow-2xl relative">
             <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden relative">
                <div className="relative">
                    <UserIcon size={80} className="text-[#d65b35]" strokeWidth={1.5} />
                    <div className="absolute -top-2 -right-2 bg-green-500 p-2.5 rounded-full border-4 border-white shadow-lg animate-pulse">
                        <Phone size={20} className="text-white" fill="currentColor" />
                    </div>
                </div>
                <div className="absolute bottom-6 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400/60"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400/30"></div>
                </div>
             </div>
          </div>
          <div className="absolute -top-4 -left-4 bg-blue-500/90 backdrop-blur-sm px-3 py-2 rounded-2xl border-2 border-white shadow-xl transform -rotate-12">
            <div className="w-8 h-1 bg-white/40 rounded-full mb-1"></div>
            <div className="w-12 h-1 bg-white/60 rounded-full"></div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="w-full space-y-7 px-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] ml-1 drop-shadow-sm">
              {t('login_phone', lang)}
            </label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md z-10 border border-white/20">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="hello@reallygreatsite.com"
                className="w-full pl-15 pr-5 py-4 bg-[#f5d9c3]/30 backdrop-blur-lg border border-white/40 rounded-full outline-none text-white placeholder:text-white/60 font-semibold focus:bg-[#f5d9c3]/40 transition-all shadow-lg"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] ml-1 drop-shadow-sm">
              {t('madrasah_code', lang)}
            </label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md z-10 border border-white/20">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-15 pr-5 py-4 bg-[#f5d9c3]/30 backdrop-blur-lg border border-white/40 rounded-full outline-none text-white placeholder:text-white/60 font-semibold focus:bg-[#f5d9c3]/40 transition-all shadow-lg"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={16} />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white text-[#d65b35] font-black rounded-full shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : t('login_btn', lang)}
            </button>
          </div>
        </form>

        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
          {brandInfo.name} &copy; 2024
        </p>
      </div>

      <style>{`
        .pl-15 { padding-left: 3.75rem; }
      `}</style>
    </div>
  );
};

export default Auth;
