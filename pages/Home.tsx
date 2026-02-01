
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
    
    fetchRecentCalls();
  };

  const initiateCall = (student: Student) => {
    recordCall(student);
    window.location.href = `tel:${student.guardian_phone}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Themed Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
        <input
          type="text"
          placeholder={t('search_placeholder', lang)}
          className="w-full pl-12 pr-5 py-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full focus:bg-white/30 focus:border-white/50 outline-none shadow-xl text-white placeholder:text-white/60 transition-all font-medium"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {searchQuery.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.2em] px-2 drop-shadow-sm">
            {lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results'}
          </h2>
          {loadingSearch ? (
            <div className="text-center py-4 text-white/50">{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(student => (
              <div 
                key={student.id} 
                className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2"
              >
                <div onClick={() => onStudentClick(student)} className="flex-1 cursor-pointer">
                  <h3 className="font-bold text-white text-lg">{student.student_name}</h3>
                  <p className="text-xs text-white/70 font-medium">{student.classes?.class_name || 'N/A'}</p>
                </div>
                <button 
                  onClick={() => initiateCall(student)}
                  className="bg-white text-[#d35132] p-3 rounded-full hover:scale-110 active:scale-90 transition-all shadow-xl"
                >
                  <Phone size={20} strokeWidth={2.5} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-white/50">{t('no_students', lang)}</div>
          )}
        </div>
      )}

      {/* Recent Calls Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.2em] px-2 drop-shadow-sm">
          {t('recent_calls', lang)}
        </h2>
        {loadingRecent ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/10 animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : recentCalls.length > 0 ? (
          recentCalls.map(call => (
            <div 
              key={call.id} 
              className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-lg flex items-center justify-between active:bg-white/30 transition-all animate-in slide-in-from-bottom-4"
            >
              <div 
                onClick={() => call.students && onStudentClick(call.students)} 
                className="flex items-center gap-4 cursor-pointer"
              >
                <div className="bg-white/10 p-3 rounded-2xl text-white">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">{call.students?.student_name || 'Unknown'}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-white/60 mt-1 font-bold">
                    <Clock size={12} />
                    {new Date(call.called_at).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => call.students && initiateCall(call.students)}
                className="bg-white text-[#d35132] p-3 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              >
                <Phone size={20} strokeWidth={2.5} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-[40px] border border-dashed border-white/20 backdrop-blur-sm">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{t('no_calls', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
