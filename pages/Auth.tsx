
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
      setError(t('login_error', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d35132] via-[#e57d4a] to-[#d35132] flex flex-col items-center justify-start p-7 overflow-hidden relative">
      
      <div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none z-0">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="w-full h-96">
           <path fill="#000000" d="M0,400 L1440,400 L1440,350 Q720,300 0,350 Z" />
           <path fill="#000000" d="M100,350 Q200,150 300,350 Z" />
           <path fill="#000000" d="M500,350 Q720,100 940,350 Z" />
        </svg>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-12 pt-12 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black text-white drop-shadow-2xl leading-tight font-noto tracking-tighter">
            Welcome to<br />{brandInfo.name}
          </h1>
          <p className="text-white/95 font-black text-2xl tracking-tight drop-shadow-md">Log in here.</p>
        </div>

        <div className="relative">
          <div className="w-56 h-56 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center p-5 border-2 border-white/30 shadow-[0_25px_80px_rgba(0,0,0,0.3)] relative">
             <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden relative">
                <div className="relative">
                    <UserIcon size={96} className="text-[#d65b35]" strokeWidth={1.5} />
                    <div className="absolute -top-3 -right-3 bg-green-500 p-3.5 rounded-full border-4 border-white shadow-2xl animate-pulse">
                        <Phone size={24} className="text-white" fill="currentColor" />
                    </div>
                </div>
             </div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="w-full space-y-8 px-2">
          <div className="space-y-3">
            <label className="text-[13px] font-black text-white uppercase tracking-[0.3em] ml-2 drop-shadow-sm">
              {t('login_phone', lang)}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl z-10 border-2 border-white/30">
                <Mail size={22} />
              </div>
              <input
                type="email"
                required
                placeholder="hello@reallygreatsite.com"
                className="w-full pl-16 pr-6 py-5 bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-full outline-none text-white placeholder:text-white/50 font-black text-lg focus:bg-white/30 transition-all shadow-2xl"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[13px] font-black text-white uppercase tracking-[0.3em] ml-2 drop-shadow-sm">
              {t('madrasah_code', lang)}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl z-10 border-2 border-white/30">
                <Lock size={22} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-16 pr-6 py-5 bg-white/20 backdrop-blur-xl border-2 border-white/40 rounded-full outline-none text-white placeholder:text-white/50 font-black text-lg focus:bg-white/30 transition-all shadow-2xl"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-white text-[#d65b35] font-black rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 text-2xl font-noto"
          >
            {loading ? <Loader2 className="animate-spin" size={28} /> : t('login_btn', lang)}
          </button>
        </form>

        <p className="text-white/50 text-[12px] font-black uppercase tracking-[0.4em]">
          {brandInfo.name} &copy; 2024
        </p>
      </div>
    </div>
  );
};

export default Auth;
