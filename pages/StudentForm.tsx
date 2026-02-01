
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User as UserIcon, Phone, List, Hash, AlertCircle } from 'lucide-react';
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

  const validatePhone = (num: string) => {
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    return bdPhoneRegex.test(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    if (!name || !phone || !classId) return;

    if (!validatePhone(phone)) {
      setPhoneError(t('invalid_phone', lang));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        student_name: name,
        roll: roll ? parseInt(roll) : null,
        guardian_phone: phone,
        class_id: classId,
        madrasah_id: user.id
      };

      if (isEditing && student) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', student.id);
        if (!error) onSuccess();
      } else {
        const { error } = await supabase
          .from('students')
          .insert(payload);
        if (!error) onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEditing ? t('edit_student', lang) : t('add_student', lang)}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <UserIcon size={16} />
                {t('student_name', lang)}
              </label>
              <input
                type="text"
                required
                placeholder={t('student_name', lang)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-slate-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                <Hash size={16} />
                {t('roll', lang)}
              </label>
              <input
                type="number"
                placeholder={t('roll', lang)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-slate-900"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
              <Phone size={16} />
              {t('guardian_phone', lang)}
            </label>
            <input
              type="tel"
              required
              maxLength={11}
              placeholder="017xxxxxxxx"
              className={`w-full px-4 py-4 bg-slate-50 border ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'} rounded-2xl outline-none text-lg text-slate-900`}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 11) setPhone(val);
                if (phoneError) setPhoneError('');
              }}
            />
            {phoneError && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle size={14} />
                {phoneError}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
              <List size={16} />
              {t('class_select', lang)}
            </label>
            <select
              required
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg appearance-none text-slate-900"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="" className="text-slate-400">{t('class_choose', lang)}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id} className="text-slate-900">{cls.class_name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white font-bold rounded-3xl shadow-xl shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Save size={24} />
          {loading ? t('saving', lang) : t('save', lang)}
        </button>
      </form>
    </div>
  );
};

export default StudentForm;
