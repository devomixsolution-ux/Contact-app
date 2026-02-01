
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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('class_name');
    
    if (data) setClasses(data);
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setSaving(true);
    setError('');
    
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
      setError('Something went wrong!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t('classes_title', lang)}</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-md shadow-emerald-100 active:scale-95 transition-transform"
        >
          <Plus size={18} />
          {t('new_class', lang)}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {classes.map(cls => (
            <button
              key={cls.id}
              onClick={() => onClassClick(cls)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{cls.class_name}</h3>
                  <p className="text-xs text-slate-500">{t('view_students', lang)}</p>
                </div>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="mx-auto text-slate-200 mb-2" size={48} />
          <p className="text-slate-400">{t('no_classes', lang)}</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-emerald-600 text-sm font-semibold underline"
          >
            {t('first_class', lang)}
          </button>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{t('new_class', lang)}</h2>
            <form onSubmit={handleAddClass} className="space-y-6">
              <div className="">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t('class_name_label', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: ১ম শ্রেণি...' : 'e.g. Class 1...'}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 font-medium"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-500 text-center font-bold">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-all"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  {saving ? t('saving', lang) : t('save', lang)}
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
