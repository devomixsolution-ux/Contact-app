
import React from 'react';
import { ArrowLeft, Phone, Edit3, User as UserIcon, Smartphone, Hash, UserCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import { Student, Language } from '../types';
import { t } from '../translations';

interface StudentDetailsProps {
  student: Student;
  onEdit: () => void;
  onBack: () => void;
  lang: Language;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onEdit, onBack, lang }) => {
  const recordCall = async (phoneNumber: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('recent_calls').insert({
      student_id: student.id,
      guardian_phone: phoneNumber,
      madrasah_id: user.id
    });
  };

  const initiateCall = async (phoneNumber: string) => {
    await recordCall(phoneNumber);
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2.5 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 active:scale-90 transition-all text-sm">
          <Edit3 size={16} />
          {t('edit', lang)}
        </button>
      </div>

      <div className="bg-white/15 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden">
        {/* Profile Banner */}
        <div className="bg-gradient-to-br from-white/10 to-transparent p-6 text-center border-b border-white/10 relative">
          <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center border-2 border-white/30 shadow-xl mb-4 text-white">
            <UserIcon size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-white font-noto tracking-tight drop-shadow-sm truncate px-4">{student.student_name}</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full mt-2 border border-white/10">
            <ShieldCheck size={12} className="text-white/60" />
            <span className="text-[10px] text-white font-black uppercase tracking-wider">{student.classes?.class_name || 'N/A'}</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center text-center">
              <span className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-1">{t('roll', lang)}</span>
              <span className="text-lg font-black text-white">{student.roll || '-'}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center text-center">
              <span className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-1">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</span>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                {lang === 'bn' ? 'সক্রিয়' : 'Active'}
              </span>
            </div>
          </div>

          {student.guardian_name && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60 shrink-0"><UserCheck size={20} /></div>
              <div className="min-w-0">
                <span className="text-[9px] text-white/50 font-black uppercase tracking-widest block leading-none mb-1">{t('guardian_name', lang)}</span>
                <span className="text-base font-bold text-white truncate block">{student.guardian_name}</span>
              </div>
            </div>
          )}

          {/* Contact Actions */}
          <div className="space-y-3 pt-2">
            <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] px-1">{lang === 'bn' ? 'কল করার মাধ্যম' : 'Calling Options'}</label>
            
            <button 
              onClick={() => initiateCall(student.guardian_phone)}
              className="w-full bg-white p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-xl group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#d35132]/10 rounded-xl flex items-center justify-center text-[#d35132]"><Smartphone size={20} /></div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">{t('guardian_phone', lang)}</span>
                  <span className="text-base font-black text-slate-800 tracking-wider leading-none">{student.guardian_phone}</span>
                </div>
              </div>
              <div className="bg-[#d35132] text-white p-2.5 rounded-xl group-active:rotate-12 transition-transform">
                <Phone size={18} fill="currentColor" />
              </div>
            </button>

            {student.guardian_phone_2 && (
              <button 
                onClick={() => initiateCall(student.guardian_phone_2!)}
                className="w-full bg-white/10 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all border border-white/10 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60"><Smartphone size={20} /></div>
                  <div className="text-left">
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest block leading-none mb-1">{t('guardian_phone_2', lang)}</span>
                    <span className="text-base font-bold text-white tracking-wider leading-none">{student.guardian_phone_2}</span>
                  </div>
                </div>
                <div className="bg-white text-[#d35132] p-2.5 rounded-xl shadow-lg">
                  <Phone size={18} fill="currentColor" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-center text-white/30 text-[9px] mt-6 font-black uppercase tracking-[0.3em] px-8">
        {lang === 'bn' ? 'তথ্য হালনাগাদ করা হয়েছে' : 'Information updated recently'}
      </p>
    </div>
  );
};

export default StudentDetails;
