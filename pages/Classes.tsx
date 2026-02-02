
import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { Class, Language } from '../types';
import { t } from '../translations';

interface ClassesProps {
  onClassClick: (cls: Class) => void;
  lang: Language;
}

const Classes: React.FC<ClassesProps> = ({ onClassClick, lang }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    // 1. Load from cache first
    const cached = localStorage.getItem('cache_classes');
    if (cached) {
      setClasses(JSON.parse(cached));
      setLoading(false);
    }

    // 2. Refresh from server if online
    if (navigator.onLine) {
      const { data } = await supabase.from('classes').select('*').order('class_name');
      if (data) {
        setClasses(data);
        localStorage.setItem('cache_classes', JSON.stringify(data));
      }
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !navigator.onLine) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const { error: insertError } = await supabase.from('classes').insert({
        class_name: newClassName.trim(),
        madrasah_id: user.id
      });
      if (insertError) throw insertError;
      setNewClassName('');
      setShowAddModal(false);
      fetchClasses();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-3xl font-black text-white drop-shadow-lg font-noto">{t('classes_title', lang)}</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          disabled={!navigator.onLine}
          className={`bg-white text-[#d35132] px-6 py-3.5 rounded-2xl text-[15px] font-black flex items-center gap-2 shadow-2xl active:scale-95 transition-all ${!navigator.onLine ? 'opacity-50' : ''}`}
        >
          <Plus size={20} strokeWidth={3.5} />
          {t('new_class', lang)}
        </button>
      </div>

      {loading && classes.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/10 animate-pulse rounded-[2.5rem]"></div>
          ))}
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => onClassClick(cls)}
              className="bg-white/15 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white/30 shadow-2xl flex items-center justify-between active:bg-white/30 transition-all text-left group"
            >
              <div className="flex items-center gap-5">
                <div className="bg-white/20 text-white p-4 rounded-[1.5rem] shadow-inner">
                  <BookOpen size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-white text-2xl leading-tight font-noto tracking-tight">{cls.class_name}</h3>
                  <p className="text-[12px] text-white/60 font-black uppercase tracking-[0.2em] mt-1.5">{t('view_students', lang)}</p>
                </div>
              </div>
              <ChevronRight className="text-white/40 group-active:text-white" size={28} strokeWidth={3} />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/5 rounded-[4rem] border-2 border-dashed border-white/20 backdrop-blur-sm">
          <BookOpen className="mx-auto text-white/10 mb-6" size={72} />
          <p className="text-white/60 font-black text-xl">{t('no_classes', lang)}</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#e57d4a] w-full max-w-sm rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-10 border border-white/30 animate-in zoom-in-95">
            <h2 className="text-3xl font-black text-white mb-10 text-center font-noto">{t('new_class', lang)}</h2>
            <form onSubmit={handleAddClass} className="space-y-8">
              <div>
                <label className="block text-[12px] font-black text-white/70 uppercase tracking-[0.25em] mb-4 px-2">{t('class_name_label', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? '১ম শ্রেণি' : 'e.g. Class 1'}
                  className="w-full px-8 py-6 bg-white/20 border border-white/30 rounded-[2rem] outline-none text-white placeholder:text-white/40 font-black text-xl focus:bg-white/30 transition-all shadow-inner"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-6 bg-white/10 text-white font-black text-lg rounded-[1.8rem] border border-white/20 active:scale-95 transition-all"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-6 bg-white text-[#d35132] font-black text-lg rounded-[1.8rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={24} /> : t('save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
