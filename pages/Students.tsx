
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Phone, Search } from 'lucide-react';
import { supabase } from '../supabase';
import { Class, Student, Language } from '../types';
import { t } from '../translations';

interface StudentsProps {
  selectedClass: Class;
  onStudentClick: (student: Student) => void;
  onAddClick: () => void;
  onBack: () => void;
  lang: Language;
}

const Students: React.FC<StudentsProps> = ({ selectedClass, onStudentClick, onAddClick, onBack, lang }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [selectedClass.id]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(
        students.filter(s => s.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*, classes(*)')
      .eq('class_id', selectedClass.id)
      .order('roll', { ascending: true, nullsFirst: false })
      .order('student_name', { ascending: true });
    if (data) {
      setStudents(data);
      setFilteredStudents(data);
    }
    setLoading(false);
  };

  const recordCall = async (student: Student) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('recent_calls').insert({
      student_id: student.id,
      guardian_phone: student.guardian_phone,
      madrasah_id: user.id
    });
  };

  const initiateCall = async (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    await recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-white truncate drop-shadow-sm">{selectedClass.class_name}</h1>
            <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">{students.length} {t('students_count', lang)}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" size={20} />
          <input
            type="text"
            placeholder={t('search_placeholder', lang)}
            className="w-full pl-14 pr-6 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full outline-none text-white placeholder:text-white/50 font-bold focus:bg-white/30 transition-all shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-white/10 animate-pulse rounded-[2rem]"></div>
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-4">
          {filteredStudents.map(student => (
            <div 
              key={student.id} 
              onClick={() => onStudentClick(student)}
              className="bg-white/15 backdrop-blur-md p-5 rounded-[2rem] border border-white/20 shadow-lg flex items-center justify-between active:bg-white/30 transition-all animate-in slide-in-from-bottom-2"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm border border-white/10">
                  {student.roll || '-'}
                </div>
                <h3 className="font-bold text-white text-lg">{student.student_name}</h3>
              </div>
              <button 
                onClick={(e) => initiateCall(e, student)}
                className="bg-white text-[#d35132] p-3.5 rounded-2xl shadow-xl active:scale-90 transition-all"
              >
                <Phone size={20} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/20">
          <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">{t('no_students', lang)}</p>
        </div>
      )}

      <button 
        onClick={onAddClick}
        className="fixed bottom-28 right-6 bg-white text-[#d35132] p-5 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.2)] active:scale-90 transition-all z-40 border border-white/50"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
  );
};

export default Students;
