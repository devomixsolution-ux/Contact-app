
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Check, Smartphone, Copy, Camera, Globe, Loader2, AlertCircle } from 'lucide-react';
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
  const [phoneError, setPhoneError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setMadrasah(data);
        setNewName(data.name);
        setNewPhone(data.phone || '');
        localStorage.setItem('m_name', data.name);
        if (data.logo_url) localStorage.setItem('m_logo', data.logo_url);
      }
    }
    setLoading(false);
  };

  const validatePhone = (num: string) => {
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    return bdPhoneRegex.test(num);
  };

  const handleUpdate = async () => {
    if (!madrasah) return;
    setPhoneError('');

    if (newPhone && !validatePhone(newPhone)) {
      setPhoneError(t('invalid_phone', lang));
      return;
    }

    setSaving(true);
    try {
      const { error: tableError } = await supabase
        .from('madrasahs')
        .update({ 
          name: newName.trim(),
          phone: newPhone.trim() 
        })
        .eq('id', madrasah.id);
      
      if (tableError) throw tableError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: newName.trim(), 
          madrasah_name: newName.trim(),
          madrasah_phone: newPhone.trim()
        }
      });
      
      if (authError) throw authError;

      localStorage.setItem('m_name', newName.trim());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      if (onProfileUpdate) onProfileUpdate();
      await fetchProfile();
    } catch (err: any) {
      console.error("Update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !madrasah) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'bn' ? 'ফাইল সাইজ ২ মেগাবাইটের কম হতে হবে' : 'File must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${madrasah.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('madrasahs')
        .update({ logo_url: publicUrl })
        .eq('id', madrasah.id);

      if (updateError) throw updateError;

      localStorage.setItem('m_logo', publicUrl);
      if (onProfileUpdate) onProfileUpdate();
      await fetchProfile();
    } catch (err: any) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyId = () => {
    if (madrasah?.id) {
      navigator.clipboard.writeText(madrasah.id);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={32} />
      <p className="text-slate-400">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
      <h1 className="text-2xl font-bold text-slate-800">{t('account', lang)}</h1>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col items-center gap-4 py-4">
          <div 
            className="relative cursor-pointer group"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="bg-emerald-100 text-emerald-600 w-28 h-28 rounded-full flex items-center justify-center ring-8 ring-emerald-50 overflow-hidden relative border-2 border-white shadow-inner">
              {uploading ? (
                <Loader2 className="animate-spin text-emerald-600" size={32} />
              ) : madrasah?.logo_url ? (
                <img src={madrasah.logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <Camera size={40} className="text-emerald-400" />
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">{madrasah?.name || 'Unknown'}</h2>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 border border-slate-100">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('madrasah_id', lang)}</label>
          <div className="flex items-center justify-between gap-3">
            <code className="text-[11px] font-mono text-slate-500 truncate bg-white px-2 py-1 rounded border border-slate-200 flex-1">
              {madrasah?.id}
            </code>
            <button onClick={copyId} className="p-2 bg-white text-slate-400 rounded-lg hover:text-emerald-600 border border-slate-200 active:scale-90 transition-all">
              {copying ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase px-1 mb-1.5">{t('madrasah_name', lang)}</label>
            <input
              type="text"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 font-medium"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase px-1 mb-1.5">{t('madrasah_phone', lang)}</label>
            <input
              type="tel"
              className={`w-full px-4 py-3.5 bg-slate-50 border ${phoneError ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 font-medium`}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
          </div>

          <button 
            onClick={handleUpdate}
            disabled={saving}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? t('saving', lang) : showSuccess ? t('success', lang) : t('update_info', lang)}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLang('bn')}
            className={`py-3 rounded-xl font-bold transition-all border ${lang === 'bn' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'}`}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLang('en')}
            className={`py-3 rounded-xl font-bold transition-all border ${lang === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'}`}
          >
            English
          </button>
        </div>
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 py-4 text-red-600 font-bold bg-white border border-red-100 rounded-2xl"
      >
        <LogOut size={20} />
        {t('logout', lang)}
      </button>
    </div>
  );
};

export default Account;

