
import React from 'react';
import { ArrowLeft, Phone, Edit3, User as UserIcon, Book, Smartphone, Hash } from 'lucide-react';
import { Student, Language } from '../types';
import { t } from '../translations';

interface StudentDetailsProps {
  student: Student;
  onEdit: () => void;
  onBack: () => void;
  lang: Language;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onEdit, onBack, lang }) => {
  const initiateCall = async () => {
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-12">
      <div className="flex items-center gap-5 mb-10">
        <button onClick={onBack} className="p-4 bg-white/10 rounded-[1.5rem] text-white active:scale-90 transition-all border border-white/25 backdrop-blur-md shadow-lg">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-white drop-shadow-lg font-noto">{t('student_info', lang)}</h1>
      </div>

      <div className="bg-white/20 backdrop-blur-2xl rounded-[4rem] p-10 border border-white/30 shadow-[0_40px_80px_rgba(0,0,0,0.2)] space-y-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex flex-col items-center text-center gap-6 relative">
          <div className="bg-white/25 text-white p-10 rounded-full border-2 border-white/40 shadow-2xl scale-110">
            <UserIcon size={80} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight font-noto drop-shadow-md">{student.student_name}</h2>
            <p className="text-white/80 font-black uppercase tracking-[0.3em] text-[13px] mt-3 bg-white/15 px-5 py-1.5 rounded-full inline-block">{student.classes?.class_name || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-6 p-6 bg-white/10 rounded-[2.5rem] border border-white/15 shadow-inner">
            <div className="p-3 bg-white/10 rounded-2xl text-white/60"><Hash size={28} /></div>
            <div>
              <p className="text-[12px] text-white/50 uppercase font-black tracking-[0.2em] mb-0.5">{t('roll', lang)}</p>
              <p className="text-2xl font-black text-white">{student.roll || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 p-6 bg-white/10 rounded-[2.5rem] border border-white/15 shadow-inner">
            <div className="p-3 bg-white/10 rounded-2xl text-white/60"><Smartphone size={28} /></div>
            <div>
              <p className="text-[12px] text-white/50 uppercase font-black tracking-[0.2em] mb-0.5">{t('guardian_phone', lang)}</p>
              <p className="text-2xl font-black text-white tracking-widest">{student.guardian_phone}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-4">
          <button 
            onClick={initiateCall}
            className="flex items-center justify-center gap-4 py-7 px-8 bg-white text-[#d35132] font-black rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.25)] active:scale-95 transition-all text-2xl font-noto"
          >
            <Phone size={28} strokeWidth={3} />
            {t('call_now', lang)}
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center justify-center gap-3 py-6 px-6 bg-white/15 text-white font-black rounded-[2.5rem] border border-white/30 active:scale-95 transition-all text-xl"
          >
            <Edit3 size={24} strokeWidth={2.5} />
            {t('edit', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
