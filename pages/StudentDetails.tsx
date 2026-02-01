
import React from 'react';
import { ArrowLeft, Phone, Edit3, User as UserIcon, Book, Smartphone, Hash } from 'lucide-react';
import { Student, Language } from '../types';
import { supabase } from '../supabase';
import { t } from '../translations';

interface StudentDetailsProps {
  student: Student;
  onEdit: () => void;
  onBack: () => void;
  lang: Language;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onEdit, onBack, lang }) => {
  const initiateCall = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('recent_calls').insert({
        student_id: student.id,
        guardian_phone: student.guardian_phone,
        madrasah_id: user.id
      });
    }
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">{t('student_info', lang)}</h1>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
        
        <div className="flex flex-col items-center text-center gap-4 relative">
          <div className="bg-emerald-100 text-emerald-600 p-6 rounded-full">
            <UserIcon size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{student.student_name}</h2>
            <p className="text-emerald-600 font-medium">{student.classes?.class_name || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <Hash className="text-slate-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('roll', lang)}</p>
              <p className="text-lg font-bold text-slate-800">{student.roll || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <Smartphone className="text-slate-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('guardian_phone', lang)}</p>
              <p className="text-lg font-bold text-slate-800">{student.guardian_phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <Book className="text-slate-400" size={24} />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{lang === 'bn' ? 'শ্রেণী' : 'Class'}</p>
              <p className="text-lg font-bold text-slate-800">{student.classes?.class_name || '-'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <button 
            onClick={onEdit}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 text-slate-700 font-bold rounded-2xl active:scale-95 transition-transform"
          >
            <Edit3 size={20} />
            {t('edit', lang)}
          </button>
          <button 
            onClick={initiateCall}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
          >
            <Phone size={20} />
            {t('call_now', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
