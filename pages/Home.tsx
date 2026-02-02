
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
    const { data } = await supabase
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
    const { data } = await supabase
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
    
    await fetchRecentCalls();
  };

  const initiateCall = async (student: Student) => {
    await recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" size={24} />
        <input
          type="text"
          placeholder={t('search_placeholder', lang)}
          className="w-full pl-14 pr-6 py-5 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full focus:bg-white/30 focus:border-white/50 outline-none shadow-2xl text-white placeholder:text-white/50 font-bold text-lg transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[13px] font-black text-white/70 uppercase tracking-[0.25em] px-3 drop-shadow-sm">
            {lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results'}
          </h2>
          {loadingSearch ? (
            <div className="text-center py-6 text-white/50 text-lg">{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(student => (
              <div 
                key={student.id} 
                className="bg-white/20 backdrop-blur-lg p-5 rounded-[2.5rem] border border-white/25 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2"
              >
                <div onClick={() => onStudentClick(student)} className="flex-1 cursor-pointer pr-4">
                  <h3 className="font-black text-white text-xl font-noto">{student.student_name}</h3>
                  <p className="text-sm text-white/75 font-bold mt-1 uppercase tracking-wide">{student.classes?.class_name || 'N/A'}</p>
                </div>
                <button 
                  onClick={() => initiateCall(student)}
                  className="bg-white text-[#d35132] p-4 rounded-3xl hover:scale-110 active:scale-90 transition-all shadow-2xl"
                >
                  <Phone size={24} strokeWidth={3} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-white/50 text-lg">{t('no_students', lang)}</div>
          )}
        </div>
      )}

      <div className="space-y-5">
        <h2 className="text-[13px] font-black text-white/70 uppercase tracking-[0.25em] px-3 drop-shadow-sm">
          {t('recent_calls', lang)}
        </h2>
        {loadingRecent ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/10 animate-pulse rounded-[2.5rem]"></div>
            ))}
          </div>
        ) : recentCalls.length > 0 ? (
          recentCalls.map(call => (
            <div 
              key={call.id} 
              className="bg-white/20 backdrop-blur-lg p-5 rounded-[2.5rem] border border-white/25 shadow-xl flex items-center justify-between active:bg-white/30 transition-all animate-in slide-in-from-bottom-4"
            >
              <div 
                onClick={() => call.students && onStudentClick(call.students)} 
                className="flex items-center gap-5 cursor-pointer"
              >
                <div className="bg-white/15 p-4 rounded-2xl text-white shadow-inner">
                  <UserIcon size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-white text-xl leading-tight font-noto tracking-tight">{call.students?.student_name || 'Unknown'}</h3>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/70 mt-1.5 font-black uppercase tracking-wider">
                    <Clock size={14} />
                    {new Date(call.called_at).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => call.students && initiateCall(call.students)}
                className="bg-white text-[#d35132] p-4 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                <Phone size={22} strokeWidth={3} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white/5 rounded-[3.5rem] border-2 border-dashed border-white/20 backdrop-blur-sm">
            <p className="text-white/40 text-[12px] font-black uppercase tracking-[0.3em]">{t('no_calls', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
