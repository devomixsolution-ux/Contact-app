
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Check, Smartphone, Copy, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language } from '../types';
import { t } from '../translations';

interface AccountProps {
  lang: Language;
  setLang: (l: Language) => void;
  onProfileUpdate?: () => void;
}

const Account: React.FC<AccountProps> = ({ lang, setLang, onProfileUpdate }) => {
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copying, setCopying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('madrasahs').select('*').eq('id', user.id).single();
      if (data) {
        setMadrasah(data);
        setNewName(data.name);
        setNewPhone(data.phone || '');
      }
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!madrasah) return;
    setSaving(true);
    try {
      await supabase.from('madrasahs').update({ name: newName.trim(), phone: newPhone.trim() }).eq('id', madrasah.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !madrasah) return;
    setUploading(true);
    try {
      const fileName = `${madrasah.id}/${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('logos').upload(fileName, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      await supabase.from('madrasahs').update({ logo_url: publicUrl }).eq('id', madrasah.id);
      if (onProfileUpdate) onProfileUpdate();
      await fetchProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      <h1 className="text-2xl font-black text-white drop-shadow-sm">{t('account', lang)}</h1>

      <div className="bg-white/20 backdrop-blur-xl rounded-[3rem] p-8 border border-white/30 shadow-2xl space-y-10">
        <div className="flex flex-col items-center gap-5">
          <div 
            className="relative cursor-pointer group"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="bg-white/20 w-32 h-32 rounded-full flex items-center justify-center ring-8 ring-white/10 overflow-hidden border-2 border-white/50 shadow-2xl">
              {uploading ? <Loader2 className="animate-spin text-white" size={32} /> : madrasah?.logo_url ? <img src={madrasah.logo_url} className="w-full h-full object-cover" /> : <Camera size={40} className="text-white/60" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <h2 className="text-2xl font-black text-white">{madrasah?.name}</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">{t('madrasah_name', lang)}</label>
            <input
              type="text"
              className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl text-white font-bold outline-none focus:bg-white/20 transition-all"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">{t('madrasah_phone', lang)}</label>
            <input
              type="tel"
              className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl text-white font-bold outline-none focus:bg-white/20 transition-all"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <button 
            onClick={handleUpdate}
            className="w-full py-6 bg-white text-[#d35132] font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all text-lg"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : showSuccess ? t('success', lang) : t('update_info', lang)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setLang('bn')} className={`py-5 rounded-[2rem] font-black transition-all border ${lang === 'bn' ? 'bg-white text-[#d35132]' : 'bg-white/10 text-white border-white/20'}`}>বাংলা</button>
        <button onClick={() => setLang('en')} className={`py-5 rounded-[2rem] font-black transition-all border ${lang === 'en' ? 'bg-white text-[#d35132]' : 'bg-white/10 text-white border-white/20'}`}>English</button>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-3 py-6 text-white font-black bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] active:scale-95 transition-all"
      >
        <LogOut size={24} />
        {t('logout', lang)}
      </button>
    </div>
  );
};

export default Account;
