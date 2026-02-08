
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Smartphone, Shield, ShieldOff, ChevronRight, User as UserIcon, AlertCircle, Calendar, Users, CheckCircle2, Ban, RefreshCw, Copy, Check, Lock, Eye, EyeOff, Edit3, Save, X, GraduationCap } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language } from '../types';
import { t } from '../translations';

interface AdminPanelProps {
  lang: Language;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ lang }) => {
  const [madrasahs, setMadrasahs] = useState<Madrasah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedMadrasah, setSelectedMadrasah] = useState<any | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', login_code: '' });

  useEffect(() => {
    fetchAllMadrasahs();
  }, []);

  const fetchAllMadrasahs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("লগইন করা নেই");

      const { data, error: fetchError } = await supabase
        .from('madrasahs')
        .select('*')
        .neq('id', user.id) 
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setMadrasahs(data || []);
    } catch (err: any) {
      console.error(err);
      setError("মাদরাসা তালিকা লোড করা যায়নি। আরএলএস পলিসি চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCount = async (madrasahId: string) => {
    setLoadingCount(true);
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('madrasah_id', madrasahId);
      
      if (!error) setStudentCount(count || 0);
    } catch (err) {
      console.error("Error fetching student count:", err);
      setStudentCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSelectMadrasah = (m: Madrasah) => {
    setSelectedMadrasah(m);
    setStudentCount(null);
    setView('details');
    fetchStudentCount(m.id);
  };

  const handleEdit = (m: any) => {
    setSelectedMadrasah(m);
    setEditForm({
      name: m.name || '',
      phone: m.phone || '',
      login_code: m.login_code || ''
    });
    setIsEditing(true);
    setView('details');
  };

  const saveChanges = async () => {
    if (!selectedMadrasah) return;
    setUpdatingId(selectedMadrasah.id);
    try {
      const { error } = await supabase
        .from('madrasahs')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          login_code: editForm.login_code.trim()
        })
        .eq('id', selectedMadrasah.id);

      if (error) throw error;

      // Update local state
      const updatedMadrasah = { ...selectedMadrasah, ...editForm };
      setMadrasahs(prev => prev.map(m => m.id === selectedMadrasah.id ? updatedMadrasah : m));
      setSelectedMadrasah(updatedMadrasah);
      setIsEditing(false);
      alert('সফলভাবে আপডেট করা হয়েছে');
    } catch (err) {
      alert('আপডেট করা সম্ভব হয়নি');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopying(key);
    setTimeout(() => setCopying(null), 2000);
  };

  const toggleStatus = async (m: Madrasah) => {
    setUpdatingId(m.id);
    const newStatus = m.is_active === false;
    try {
      const { error } = await supabase.from('madrasahs').update({ is_active: newStatus }).eq('id', m.id);
      if (error) throw error;
      setMadrasahs(prev => prev.map(item => item.id === m.id ? { ...item, is_active: newStatus } : item));
      if (selectedMadrasah?.id === m.id) setSelectedMadrasah({ ...m, is_active: newStatus });
    } catch (err) {
      alert('স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return madrasahs.filter(m => 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [madrasahs, searchQuery]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-white" size={40} />
      <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">Fetching Data...</p>
    </div>
  );

  if (error) return (
    <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 text-center border border-white/20">
      <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
      <p className="text-white font-bold mb-6">{error}</p>
      <button onClick={fetchAllMadrasahs} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 mx-auto active:scale-95 transition-all">
        <RefreshCw size={18} /> পুনরায় চেষ্টা করুন
      </button>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/10 backdrop-blur-md">
            <Users size={16} className="mx-auto mb-1 text-white/40" />
            <div className="text-xl font-black text-white leading-none">{madrasahs.length}</div>
            <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Total</div>
          </div>
          <div className="bg-green-500/10 p-3 rounded-2xl text-center border border-green-500/20 backdrop-blur-md">
            <CheckCircle2 size={16} className="mx-auto mb-1 text-green-400" />
            <div className="text-xl font-black text-green-400 leading-none">{madrasahs.filter(m=>m.is_active!==false).length}</div>
            <div className="text-[8px] font-bold text-green-400/40 uppercase tracking-widest mt-1">Active</div>
          </div>
          <div className="bg-red-500/10 p-3 rounded-2xl text-center border border-red-500/20 backdrop-blur-md">
            <Ban size={16} className="mx-auto mb-1 text-red-400" />
            <div className="text-xl font-black text-red-400 leading-none">{madrasahs.filter(m=>m.is_active===false).length}</div>
            <div className="text-[8px] font-bold text-red-400/40 uppercase tracking-widest mt-1">Blocked</div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="মাদরাসার নাম লিখুন..."
            className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none text-white font-bold placeholder:text-white/30 backdrop-blur-md focus:bg-white/20 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map(m => (
            <button 
              key={m.id} 
              onClick={() => handleSelectMadrasah(m)}
              className={`w-full bg-white/10 border ${m.is_active === false ? 'border-red-500/30' : 'border-white/10'} rounded-[1.8rem] p-4 flex items-center justify-between active:scale-[0.98] transition-all backdrop-blur-md`}
            >
              <div className="flex items-center gap-4 text-left min-w-0">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                   {m.logo_url ? <img src={m.logo_url} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={20} className="text-white/30" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-white truncate text-sm font-noto">{m.name || 'নতুন মাদরাসা'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] font-black uppercase tracking-wider ${m.is_active !== false ? 'text-green-400' : 'text-red-400'}`}>
                      {m.is_active !== false ? 'Active' : 'Blocked'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-white/20" size={20} />
            </button>
          )) : (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">কোনো মাদরাসা পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('list'); setIsEditing(false); }} className="p-3 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 shadow-lg">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-xl font-black text-white font-noto">মাদরাসা প্রোফাইল</h1>
        </div>
        {!isEditing && (
          <button 
            onClick={() => handleEdit(selectedMadrasah)}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-white/20 active:scale-95 transition-all"
          >
            <Edit3 size={14} /> এডিট
          </button>
        )}
      </div>

      {selectedMadrasah && (
        <div className="bg-white/15 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl space-y-8 text-center relative overflow-hidden">
          <div className="w-24 h-24 bg-white/10 rounded-full mx-auto border-4 border-white/10 overflow-hidden relative">
            {selectedMadrasah.logo_url ? <img src={selectedMadrasah.logo_url} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-white/30 mx-auto mt-6" />}
          </div>
          
          {isEditing ? (
            <input 
              className="text-2xl font-black text-white font-noto leading-tight bg-white/10 border border-white/20 rounded-xl w-full text-center py-2 outline-none focus:bg-white/20"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl font-black text-white font-noto leading-tight">{selectedMadrasah.name}</h2>
          )}

          <div className="space-y-4 text-left">
            {/* UUID Section */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center relative">
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Unique ID (UUID)</p>
                <p className="text-[10px] font-mono text-white/70 truncate pr-2">{selectedMadrasah.id}</p>
              </div>
              <button 
                onClick={() => copyToClipboard(selectedMadrasah.id, 'uuid')}
                className="bg-white/10 p-2.5 rounded-xl text-white active:scale-90 transition-all border border-white/10"
              >
                {copying === 'uuid' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>

            {/* TOTAL STUDENTS STATS */}
            <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20 flex items-center justify-between shadow-inner">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white text-[#d35132] rounded-2xl flex items-center justify-center shadow-lg">
                    <GraduationCap size={24} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-0.5">মাদরাসার মোট ছাত্র</p>
                    <div className="text-2xl font-black text-white leading-none">
                      {loadingCount ? <Loader2 className="animate-spin" size={20} /> : (studentCount !== null ? studentCount : '0')}
                    </div>
                 </div>
               </div>
               <div className="bg-white/10 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Students</span>
               </div>
            </div>

            {/* PASSWORD / LOGIN CODE Section */}
            <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-3xl border border-white/20 space-y-4 shadow-inner">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <Lock size={12} /> লগইন কোড (Password)
              </h3>
              
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input 
                      className="text-xl font-black text-white tracking-widest bg-white/10 border border-white/20 rounded-xl w-full py-2 px-3 outline-none"
                      value={editForm.login_code}
                      placeholder="পাসওয়ার্ড লিখুন"
                      onChange={(e) => setEditForm({ ...editForm, login_code: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={`text-xl font-black tracking-widest ${selectedMadrasah.login_code ? 'text-white' : 'text-red-400/50 italic text-sm'}`}>
                        {selectedMadrasah.login_code 
                          ? (showPass ? selectedMadrasah.login_code : '••••••••') 
                          : 'Not Set'}
                      </p>
                      {selectedMadrasah.login_code && (
                        <button onClick={() => setShowPass(!showPass)} className="text-white/40 active:scale-90 transition-all">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      )}
                    </div>
                  )}
                  {!isEditing && <p className="text-[9px] text-white/40 italic mt-1">মাদরাসা এই কোড দিয়ে লগইন করবে</p>}
                </div>
                {selectedMadrasah.login_code && !isEditing && (
                  <button 
                    onClick={() => copyToClipboard(selectedMadrasah.login_code, 'code')}
                    className="bg-white text-[#d35132] p-3 rounded-xl shadow-xl active:scale-90 transition-all shrink-0"
                  >
                    {copying === 'code' ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Mobile</p>
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-white/20" />
                  {isEditing ? (
                    <input 
                      className="text-sm font-bold text-white bg-white/10 border border-white/10 rounded-md w-full px-1 outline-none"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-bold text-white truncate">{selectedMadrasah.phone || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Joined Date</p>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-white/20" />
                  <p className="text-sm font-bold text-white">{formatDate(selectedMadrasah.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 border border-white/20"
              >
                <X size={18} /> বাতিল
              </button>
              <button 
                onClick={saveChanges}
                disabled={!!updatingId}
                className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-xl"
              >
                {updatingId ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> সেভ করুন</>}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => toggleStatus(selectedMadrasah)}
              disabled={!!updatingId}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all shadow-2xl ${selectedMadrasah.is_active !== false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {updatingId === selectedMadrasah.id ? <Loader2 className="animate-spin" size={20} /> : selectedMadrasah.is_active !== false ? <><ShieldOff size={18} /> ব্লক করুন</> : <><Shield size={18} /> আনব্লক করুন</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
