
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Clock, User as UserIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { Student, RecentCall, Language } from '../types';
import { t } from '../translations';

interface HomeProps {
  onStudentClick: (student: Student) => void;
  lang: Language;
}

const Home: React.FC<HomeProps> = ({ onStudentClick, lang }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  const fetchRecentCalls = async () => {
    setLoadingRecent(true);
    const { data, error } = await supabase
      .from('recent_calls')
      .select('*, students(*, classes(*))')
      .order('called_at', { ascending: false })
      .limit(10);
    
    if (data) setRecentCalls(data);
    setLoadingRecent(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    setLoadingSearch(true);
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(*)')
      .ilike('student_name', `%${query}%`)
      .limit(10);
    
    if (data) setSearchResults(data);
    setLoadingSearch(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const recordCall = async (student: Student) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('recent_calls').insert({
      student_id: student.id,
      guardian_phone: student.guardian_phone,
      madrasah_id: user.id
    });
    
    fetchRecentCalls();
  };

  const initiateCall = (student: Student) => {
    recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder={t('search_placeholder', lang)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm text-slate-900"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            {lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results'}
          </h2>
          {loadingSearch ? (
            <div className="text-center py-4 text-slate-400">{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(student => (
              <div 
                key={student.id} 
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div onClick={() => onStudentClick(student)} className="flex-1 cursor-pointer">
                  <h3 className="font-semibold text-slate-800">{student.student_name}</h3>
                  <p className="text-xs text-slate-500">{student.classes?.class_name || 'N/A'}</p>
                </div>
                <button 
                  onClick={() => initiateCall(student)}
                  className="bg-emerald-50 text-emerald-600 p-3 rounded-full hover:bg-emerald-100 active:scale-90 transition-all"
                >
                  <Phone size={20} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-slate-400">{t('no_students', lang)}</div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          {t('recent_calls', lang)}
        </h2>
        {loadingRecent ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : recentCalls.length > 0 ? (
          recentCalls.map(call => (
            <div 
              key={call.id} 
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
            >
              <div 
                onClick={() => call.students && onStudentClick(call.students)} 
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">{call.students?.student_name || 'Unknown'}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock size={10} />
                    {new Date(call.called_at).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => call.students && initiateCall(call.students)}
                className="bg-emerald-600 text-white p-2 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
              >
                <Phone size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t('no_calls', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
