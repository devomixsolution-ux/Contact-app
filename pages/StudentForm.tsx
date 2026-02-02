
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User as UserIcon, Phone, List, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { Student, Class, Language } from '../types';
import { t } from '../translations';

interface StudentFormProps {
  student?: Student | null;
  defaultClassId?: string;
  isEditing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  lang: Language;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, defaultClassId, isEditing, onSuccess, onCancel, lang }) => {
  const [name, setName] = useState(student?.student_name || '');
  const [roll, setRoll] = useState(student?.roll?.toString() || '');
  const [phone, setPhone] = useState(student?.guardian_phone || '');
  const [classId, setClassId] = useState(student?.class_id || defaultClassId || '');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('class_name');
    if (data) setClasses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !classId) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        student_name: name.trim(),
        roll: roll ? parseInt(roll) : null,
        guardian_phone: phone.trim(),
        class_id: classId,
        madrasah_id: user.id
      };
      if (isEditing && student) {
        await supabase.from('students').update(payload).eq('id', student.id);
      } else {
        await supabase.from('students').insert(payload);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500 pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-black text-white drop-shadow-sm">
          {isEditing ? t('edit_student', lang) : t('add_student', lang)}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/15 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 shadow-2xl space-y-8">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest px-1">
                <UserIcon size={14} />
                {t('student_name', lang)}
              </label>
              <input
                type="text"
                required
                className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl outline-none text-white font-bold focus:bg-white/20 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="col-span-1 space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest px-1">
                <Hash size={14} />
                {t('roll', lang)}
              </label>
              <input
                type="number"
                className="w-full px-4 py-5 bg-white/10 border border-white/20 rounded-3xl outline-none text-white font-bold focus:bg-white/20 transition-all text-center"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest px-1">
              <Phone size={14} />
              {t('guardian_phone', lang)}
            </label>
            <input
              type="tel"
              required
              maxLength={11}
              className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl outline-none text-white font-bold focus:bg-white/20 transition-all tracking-wider"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest px-1">
              <List size={14} />
              {t('class_select', lang)}
            </label>
            <select
              required
              className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-3xl outline-none text-white font-bold focus:bg-white/20 transition-all appearance-none"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="" className="text-slate-900">{t('class_choose', lang)}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id} className="text-slate-900">{cls.class_name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-white text-[#d35132] font-black rounded-[2.5rem] shadow-2xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} strokeWidth={3} /> {t('save', lang)}</>}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;
