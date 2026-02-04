
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
        const { data: profile } = await supabase.from('madrasahs').select('name, logo_url').eq('id', data.user.id).single();
        if (profile) {
          localStorage.setItem('m_name', profile.name);
          if (profile.logo_url) localStorage.setItem('m_logo', profile.logo_url);
        }
      }
    } catch (err: any) { setError(t('login_error', lang)); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d35132] via-[#e57d4a] to-[#d35132] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 opacity-10 pointer-events-none z-0">
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" className="w-full h-48">
           <path fill="#000000" d="M0,400 L1440,400 L1440,350 Q720,300 0,350 Z" />
        </svg>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center space-y-6 z-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white drop-shadow-lg leading-tight font-noto tracking-tighter">
            Welcome to<br />{brandInfo.name}
          </h1>
          <p className="text-white/80 font-bold text-sm">Log in here.</p>
        </div>

        <div className="relative">
          <div className="w-28 h-28 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center p-3 border-2 border-white/30 shadow-2xl relative">
             <div className="w-full h-full bg-white rounded-[1.5rem] flex items-center justify-center shadow-inner overflow-hidden">
                <div className="relative">
                    <UserIcon size={48} className="text-[#d65b35]" strokeWidth={1.5} />
                    <div className="absolute -top-1 -right-1 bg-green-500 p-1.5 rounded-full border border-white shadow-lg animate-pulse">
                        <Phone size={10} className="text-white" fill="currentColor" />
                    </div>
                </div>
             </div>
          </div>
        </div>

        <form onSubmit={handleAuth} className="w-full space-y-4 px-2">
          {error && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-white font-bold text-xs animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-white uppercase tracking-widest ml-2">{t('login_phone', lang)}</label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg z-10">
                <Mail size={14} />
              </div>
              <input
                type="email"
                required
                placeholder="email@address.com"
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl outline-none text-white placeholder:text-white/40 font-bold text-sm focus:bg-white/30 transition-all"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-white uppercase tracking-widest ml-2">{t('madrasah_code', lang)}</label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#bd2c5a] w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg z-10">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••"
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl outline-none text-white placeholder:text-white/40 font-bold text-sm focus:bg-white/30 transition-all"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-[#d65b35] font-black rounded-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-lg font-noto"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t('login_btn', lang)}
          </button>
        </form>

        <p className="text-white/50 text-[9px] pt-4 text-center px-4 leading-relaxed tracking-wider uppercase">
          © 2026 Deenora app by KM IBRAHIM
        </p>
      </div>
    </div>
  );
};

export default Auth;
