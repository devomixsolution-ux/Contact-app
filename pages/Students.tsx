
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

  const initiateCall = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{selectedClass.class_name}</h1>
            <p className="text-xs text-slate-500">{students.length} {t('students_count', lang)}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t('search_placeholder', lang)}
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm text-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map(student => (
            <div 
              key={student.id} 
              onClick={() => onStudentClick(student)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                  {student.roll || '-'}
                </div>
                <h3 className="font-semibold text-slate-800">{student.student_name}</h3>
              </div>
              <button 
                onClick={(e) => initiateCall(e, student)}
                className="bg-emerald-50 text-emerald-600 p-2.5 rounded-full"
              >
                <Phone size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400">{t('no_students', lang)}</p>
        </div>
      )}

      <button 
        onClick={onAddClick}
        className="fixed bottom-24 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-200 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} />
      </button>
    </div>
  );
};

export default Students;
