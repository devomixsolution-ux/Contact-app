
import React, { useState } from 'react';
import { ArrowLeft, Phone, Edit3, Trash2, User as UserIcon, Smartphone, UserCheck, ShieldCheck, Loader2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../supabase';
import { Student, Language } from '../types';
import { t } from '../translations';

interface StudentDetailsProps {
  student: Student;
  onEdit: () => void;
  onBack: () => void;
  lang: Language;
  triggerRefresh: () => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onEdit, onBack, lang, triggerRefresh }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const recordCall = async (phoneNumber: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('recent_calls').insert({
      student_id: student.id,
      guardian_phone: phoneNumber,
      madrasah_id: user.id
    });
    triggerRefresh();
  };

  const initiateCall = async (phoneNumber: string) => {
    await recordCall(phoneNumber);
    window.location.href = `tel:${phoneNumber}`;
  };

  const performDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error(lang === 'bn' ? 'সেশন পাওয়া যায়নি' : 'Session not found');
      }

      const { error, count } = await supabase
        .from('students')
        .delete({ count: 'exact' })
        .eq('id', student.id)
        .eq('madrasah_id', session.user.id);

      if (error) throw error;
      
      triggerRefresh(); // Signal global update
      setShowDeleteModal(false);
      onBack();
    } catch (err: any) {
      console.error('Delete operation failed:', err);
      alert(lang === 'bn' ? `ডিলিট করা সম্ভব হয়নি: ${err.message}` : `Could not delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2.5 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2.5 bg-red-500/20 text-red-200 rounded-xl active:scale-90 transition-all border border-red-500/20"
          >
            <Trash2 size={18} />
          </button>
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white font-bold rounded-xl border border-white/20 active:scale-90 transition-all text-sm">
            <Edit3 size={16} />
            {t('edit', lang)}
          </button>
        </div>
      </div>

      <div className="bg-white/15 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden">
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
                    <span className="text-base font-bold text-white tracking-wider font-mono">{student.guardian_phone_2}</span>
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 text-center relative">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 font-noto">
              {t('confirm_delete', lang)}
            </h2>
            <p className="text-slate-500 text-sm mb-8 font-medium">
              {lang === 'bn' ? 'এই ছাত্রের সকল তথ্য চিরতরে মুছে যাবে।' : 'All information will be deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-sm rounded-2xl active:scale-95 transition-all"
              >
                {t('cancel', lang)}
              </button>
              <button
                onClick={performDelete}
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-500 text-white font-black text-sm rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : t('delete', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
