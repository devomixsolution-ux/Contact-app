
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Check, Smartphone, Copy, Camera, Loader2, Hash, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language, View } from '../types';
import { t } from '../translations';

interface AccountProps {
  lang: Language;
  setLang: (l: Language) => void;
  onProfileUpdate?: () => void;
  setView: (view: View) => void;
  isSuperAdmin?: boolean;
}

const Account: React.FC<AccountProps> = ({ lang, setLang, onProfileUpdate, setView, isSuperAdmin }) => {
  const [madrasah, setMadrasah] = useState<Madrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error: fetchError } = await supabase
          .from('madrasahs')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setMadrasah(data);
          setNewName(data.name);
          setNewPhone(data.phone || '');
        }
      }
    } catch (err: any) {
      setError('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!madrasah) return;
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.from('madrasahs').update({ name: newName.trim(), phone: newPhone.trim() }).eq('id', madrasah.id);
      if (updateError) throw updateError;
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !madrasah) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Max 2MB allowed.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${madrasah.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('madrasahs').update({ logo_url: publicUrl }).eq('id', madrasah.id);
      if (dbError) throw dbError;
      if (onProfileUpdate) onProfileUpdate();
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const copyUUID = () => {
    if (!madrasah) return;
    navigator.clipboard.writeText(madrasah.id);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10">
      <h1 className="text-2xl font-black text-white drop-shadow-sm">{t('account', lang)}</h1>

      <div className="bg-white/20 backdrop-blur-xl rounded-[3rem] p-8 border border-white/30 shadow-2xl space-y-8">
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-white font-bold text-sm animate-shake">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-5">
          <div className="relative cursor-pointer group" onClick={() => !uploading && fileInputRef.current?.click()}>
            <div className="bg-white/20 w-32 h-32 rounded-full flex items-center justify-center ring-8 ring-white/10 overflow-hidden border-2 border-white/50 shadow-2xl relative">
              {uploading ? (
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center z-20">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              ) : madrasah?.logo_url ? (
                <img src={madrasah.logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Camera size={40} className="text-white/60" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white text-[#d35132] p-2 rounded-full shadow-lg border border-white/50 group-active:scale-90 transition-transform z-30">
              <Camera size={18} />
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white leading-tight font-noto">{madrasah?.name}</h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Profile Settings</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">{t('madrasah_id', lang)}</label>
            <div className="relative group">
              <input readOnly className="w-full pl-6 pr-14 py-5 bg-white/5 border border-white/10 rounded-3xl text-white/60 font-mono text-xs outline-none cursor-default" value={madrasah?.id || ''} />
              <button onClick={copyUUID} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 p-3 rounded-2xl text-white active:scale-90 transition-all">
                {copying ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">{t('madrasah_name', lang)}</label>
            <input type="text" className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl text-white font-bold outline-none focus:bg-white/20 transition-all" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">{t('madrasah_phone', lang)}</label>
            <input type="tel" className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl text-white font-bold outline-none focus:bg-white/20 transition-all" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>

          <button onClick={handleUpdate} disabled={saving} className="w-full py-6 bg-white text-[#d35132] font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
            {saving ? <Loader2 className="animate-spin" size={24} /> : showSuccess ? <Check size={24} /> : t('update_info', lang)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setLang('bn')} className={`py-5 rounded-[2rem] font-black transition-all border shadow-lg ${lang === 'bn' ? 'bg-white text-[#d35132] border-white' : 'bg-white/10 text-white border-white/20'}`}>বাংলা</button>
        <button onClick={() => setLang('en')} className={`py-5 rounded-[2rem] font-black transition-all border shadow-lg ${lang === 'en' ? 'bg-white text-[#d35132] border-white' : 'bg-white/10 text-white border-white/20'}`}>English</button>
      </div>

      <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-3 py-6 text-white font-black bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-[2rem] active:scale-95 transition-all shadow-xl">
        <LogOut size={24} />
        {t('logout', lang)}
      </button>
    </div>
  );
};

export default Account;
