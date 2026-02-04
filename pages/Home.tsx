
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
      .limit(8);
    
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
      .limit(8);
    
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('recent_calls').insert({
        student_id: student.id,
        guardian_phone: student.guardian_phone,
        madrasah_id: user.id
      });
      await fetchRecentCalls();
    } catch (e) { console.error(e); }
  };

  const initiateCall = async (student: Student) => {
    await recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
        <input
          type="text"
          placeholder={t('search_placeholder', lang)}
          className="w-full pl-11 pr-5 py-3.5 bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl focus:bg-white/25 outline-none text-white placeholder:text-white/40 font-bold text-base transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[11px] font-black text-white/60 uppercase tracking-widest px-2">{lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results'}</h2>
          {loadingSearch ? (
            <div className="text-center py-4 text-white/40 text-sm italic">{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(student => (
              <div 
                key={student.id} 
                className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 flex items-center justify-between animate-in slide-in-from-bottom-1"
              >
                <div onClick={() => onStudentClick(student)} className="flex-1 pr-3 min-w-0">
                  <h3 className="font-bold text-white text-base font-noto truncate">{student.student_name}</h3>
                  <p className="text-[10px] text-white/60 font-black uppercase mt-0.5">{student.classes?.class_name || 'N/A'}</p>
                </div>
                <button onClick={() => initiateCall(student)} className="bg-white text-[#d35132] p-3 rounded-2xl active:scale-90 transition-all shadow-lg shrink-0">
                  <Phone size={18} strokeWidth={3} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-white/40 text-sm">{t('no_students', lang)}</div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-[11px] font-black text-white/60 uppercase tracking-widest px-2">{t('recent_calls', lang)}</h2>
        {loadingRecent ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : recentCalls.length > 0 ? (
          recentCalls.map(call => (
            <div 
              key={call.id} 
              className="bg-white/10 backdrop-blur-md p-3.5 rounded-3xl border border-white/15 flex items-center justify-between active:bg-white/20 transition-all animate-in slide-in-from-bottom-2"
            >
              <div onClick={() => call.students && onStudentClick(call.students)} className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0 pr-2">
                <div className="bg-white/10 p-2.5 rounded-xl text-white/80 shrink-0"><UserIcon size={20} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-[15px] font-noto truncate leading-tight w-full block">{call.students?.student_name || 'Unknown'}</h3>
                  <div className="flex items-center gap-1 text-[9px] text-white/50 mt-1 font-black uppercase">
                    <Clock size={11} />
                    {new Date(call.called_at).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button onClick={() => call.students && initiateCall(call.students)} className="bg-white text-[#d35132] p-2.5 rounded-xl shrink-0 active:scale-90 transition-transform shadow-md">
                <Phone size={16} strokeWidth={3} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('no_calls', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
