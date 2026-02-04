
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User as UserIcon, Phone, List, Hash, Loader2, UserCheck } from 'lucide-react';
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
  const [guardianName, setGuardianName] = useState(student?.guardian_name || '');
  const [roll, setRoll] = useState(student?.roll?.toString() || '');
  const [phone, setPhone] = useState(student?.guardian_phone || '');
  const [phone2, setPhone2] = useState(student?.guardian_phone_2 || '');
  const [classId, setClassId] = useState(student?.class_id || defaultClassId || '');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

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
        guardian_name: guardianName.trim(),
        roll: roll ? parseInt(roll) : null,
        guardian_phone: phone.trim(),
        guardian_phone_2: phone2.trim() || null,
        class_id: classId,
        madrasah_id: user.id
      };
      if (isEditing && student) {
        await supabase.from('students').update(payload).eq('id', student.id);
      } else {
        await supabase.from('students').insert(payload);
      }
      onSuccess();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="animate-in slide-in-from-bottom-6 duration-500 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-2.5 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-black text-white">
          {isEditing ? t('edit_student', lang) : t('add_student', lang)}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-xl space-y-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
              <UserIcon size={12} />
              {t('student_name', lang)}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
              <UserCheck size={12} />
              {t('guardian_name', lang)}
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all text-sm"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
                <Hash size={12} />
                {t('roll', lang)}
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all text-center text-sm"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
                <Phone size={12} />
                {t('guardian_phone', lang)}
              </label>
              <input
                type="tel"
                required
                maxLength={11}
                className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all tracking-wider text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
              <Phone size={12} />
              {t('guardian_phone_2', lang)}
            </label>
            <input
              type="tel"
              maxLength={11}
              className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all tracking-wider text-sm"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder={lang === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-widest px-1">
              <List size={12} />
              {t('class_select', lang)}
            </label>
            <select
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl outline-none text-white font-bold focus:bg-white/20 transition-all appearance-none text-sm"
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
          className="w-full py-4 bg-white text-[#d35132] font-black rounded-2xl shadow-xl active:scale-95 transition-all text-base flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {t('save', lang)}</>}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;
