
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, Smartphone, Shield, ShieldOff, ChevronRight, User as UserIcon, AlertCircle, Calendar, Users, CheckCircle2, Ban, RefreshCw, Copy, Check, Lock, Eye, EyeOff, Edit3, Save, X, GraduationCap, MonitorSmartphone, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language } from '../types';
import { t } from '../translations';

interface AdminPanelProps {
  lang: Language;
}

interface DeviceSession {
  id: string;
  device_info: string;
  last_active: string;
  device_id: string;
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
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loadingCount, setLoadingCount] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', login_code: '' });

  useEffect(() => {
    fetchAllMadrasahs();
  }, []);

  useEffect(() => {
    if (view === 'details' && selectedMadrasah?.id) {
      fetchStudentCount(selectedMadrasah.id);
      fetchDevices(selectedMadrasah.id);
    }
  }, [view, selectedMadrasah?.id]);

  const fetchAllMadrasahs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('madrasahs')
        .select('*')
        .neq('is_super_admin', true) 
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setMadrasahs(data || []);
    } catch (err: any) {
      console.error("Fetch Madrasahs Error:", err);
      setError("মাদরাসা তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCount = async (madrasahId: string) => {
    if (!madrasahId) return;
    setLoadingCount(true);
    setStudentCount(0); // Reset count
    try {
      // Robust counting: Select only 'id' and use count option
      const { count, error: countError } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('madrasah_id', madrasahId);
      
      if (countError) {
        console.error("Student count RLS error:", countError);
        throw countError;
      }
      
      setStudentCount(count || 0);
    } catch (err) {
      console.error("Error fetching student count:", err);
      setStudentCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  const fetchDevices = async (madrasahId: string) => {
    if (!madrasahId) return;
    setLoadingDevices(true);
    setDevices([]);
    try {
      const { data, error: devError } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('madrasah_id', madrasahId)
        .order('last_active', { ascending: false });
      
      if (devError) {
        console.error("Device session RLS error:", devError);
        throw devError;
      }
      
      setDevices(data || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectMadrasah = (m: Madrasah) => {
    setSelectedMadrasah(m);
    setView('details');
  };

  const saveChanges = async () => {
    if (!selectedMadrasah) return;
    setUpdatingId(selectedMadrasah.id);
    try {
      const { error: updateError } = await supabase
        .from('madrasahs')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          login_code: editForm.login_code.trim()
        })
        .eq('id', selectedMadrasah.id);

      if (updateError) throw updateError;
      
      const updated = { ...selectedMadrasah, ...editForm };
      setMadrasahs(prev => prev.map(m => m.id === selectedMadrasah.id ? updated : m));
      setSelectedMadrasah(updated);
      setIsEditing(false);
      alert("সফলভাবে আপডেট হয়েছে!");
    } catch (err) {
      alert('আপডেট ব্যর্থ হয়েছে');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleStatus = async (m: Madrasah) => {
    setUpdatingId(m.id);
    const newStatus = m.is_active === false;
    try {
      const { error: statusError } = await supabase
        .from('madrasahs')
        .update({ is_active: newStatus })
        .eq('id', m.id);
        
      if (statusError) throw statusError;
      
      setMadrasahs(prev => prev.map(item => item.id === m.id ? { ...item, is_active: newStatus } : item));
      if (selectedMadrasah?.id === m.id) setSelectedMadrasah({ ...m, is_active: newStatus });
    } catch (e) {
      alert("স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে");
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

  const filtered = useMemo(() => {
    return madrasahs.filter(m => 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [madrasahs, searchQuery]);

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-white" size={40} />
      <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">মাদরাসা তালিকা লোড হচ্ছে...</p>
    </div>
  );

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/10 backdrop-blur-md">
            <Users size={16} className="mx-auto mb-1 text-white/40" />
            <div className="text-xl font-black text-white">{madrasahs.length}</div>
            <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Total</div>
          </div>
          <div className="bg-green-500/10 p-3 rounded-2xl text-center border border-green-500/20">
            <CheckCircle2 size={16} className="mx-auto mb-1 text-green-400" />
            <div className="text-xl font-black text-green-400">{madrasahs.filter(m=>m.is_active!==false).length}</div>
            <div className="text-[8px] font-bold text-green-400/40 uppercase tracking-widest mt-1">Active</div>
          </div>
          <div className="bg-red-500/10 p-3 rounded-2xl text-center border border-red-500/20">
            <Ban size={16} className="mx-auto mb-1 text-red-400" />
            <div className="text-xl font-black text-red-400">{madrasahs.filter(m=>m.is_active===false).length}</div>
            <div className="text-[8px] font-bold text-red-400/40 uppercase tracking-widest mt-1">Blocked</div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="মাদরাসা খুঁজুন..."
            className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none text-white font-bold backdrop-blur-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map(m => (
            <button key={m.id} onClick={() => handleSelectMadrasah(m)} className="w-full bg-white/10 border border-white/10 rounded-[1.8rem] p-4 flex items-center justify-between active:scale-[0.98] transition-all backdrop-blur-md">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                   {m.logo_url ? <img src={m.logo_url} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={20} className="text-white/30" />}
                </div>
                <div>
                  <h3 className="font-black text-white truncate text-sm font-noto">{m.name || 'নতুন মাদরাসা'}</h3>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${m.is_active !== false ? 'text-green-400' : 'text-red-400'}`}>
                    {m.is_active !== false ? 'Active' : 'Blocked'}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-white/20" size={20} />
            </button>
          )) : (
            <div className="text-center py-20 text-white/30 font-bold uppercase tracking-widest text-xs">
              মাদরাসা পাওয়া যায়নি
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('list'); setIsEditing(false); }} className="p-3 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 shadow-lg">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-xl font-black text-white font-noto">মাদরাসা প্রোফাইল</h1>
        </div>
        {!isEditing && (
          <button onClick={() => { setEditForm({ name: selectedMadrasah.name, phone: selectedMadrasah.phone || '', login_code: selectedMadrasah.login_code || '' }); setIsEditing(true); }} className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/20 shadow-md">
            <Edit3 size={14} /> এডিট
          </button>
        )}
      </div>

      <div className="bg-white/15 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl space-y-8 text-center">
        <div className="w-24 h-24 bg-white/10 rounded-full mx-auto border-4 border-white/10 overflow-hidden shadow-inner">
          {selectedMadrasah.logo_url ? <img src={selectedMadrasah.logo_url} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-white/30 mt-6" />}
        </div>
        
        {isEditing ? (
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">মাদরাসার নাম</label>
              <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold outline-none" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} placeholder="নাম" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">ফোন নম্বর</label>
              <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold outline-none" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} placeholder="ফোন" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">লগইন কোড (Password)</label>
              <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold outline-none" value={editForm.login_code} onChange={e=>setEditForm({...editForm, login_code: e.target.value})} placeholder="লগইন কোড" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={()=>setIsEditing(false)} className="flex-1 py-4 bg-white/10 text-white rounded-xl font-bold active:scale-95 transition-all">বাতিল</button>
              <button onClick={saveChanges} className="flex-1 py-4 bg-green-500 text-white rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2">
                {updatingId ? <Loader2 className="animate-spin" size={18} /> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-white font-noto">{selectedMadrasah.name}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20 shadow-inner flex flex-col items-center">
                <div className="w-10 h-10 bg-[#d35132]/20 rounded-xl flex items-center justify-center text-white mb-2">
                   <GraduationCap size={20} />
                </div>
                <div className="text-2xl font-black text-white">
                  {loadingCount ? <Loader2 className="animate-spin" size={18} /> : studentCount}
                </div>
                <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Students</div>
              </div>
              <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20 shadow-inner flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-white mb-2">
                   <MonitorSmartphone size={20} />
                </div>
                <div className="text-2xl font-black text-white">
                  {loadingDevices ? <Loader2 className="animate-spin" size={18} /> : devices.length}
                </div>
                <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Devices</div>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {/* Login Info Box */}
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">লগইন কোড</p>
                    <div className="flex items-center gap-2">
                       <p className="text-xl font-black text-white tracking-widest">
                         {showPass ? selectedMadrasah.login_code : '••••••••'}
                       </p>
                       <button onClick={() => setShowPass(!showPass)} className="text-white/40">
                         {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                    </div>
                  </div>
                  <button onClick={() => copyToClipboard(selectedMadrasah.login_code, 'code')} className="bg-white/10 p-3 rounded-xl text-white">
                    {copying === 'code' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Devices List */}
              {devices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">সক্রিয় ডিভাইসসমূহ</p>
                  <div className="space-y-2">
                    {devices.map(d => (
                      <div key={d.id} className="flex items-center justify-between bg-white/5 p-3.5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Smartphone size={14} className="text-white/40 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{d.device_info}</p>
                            <p className="text-[9px] text-white/40 flex items-center gap-1 mt-0.5">
                              <Clock size={10} /> {new Date(d.last_active).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] shrink-0"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button onClick={() => toggleStatus(selectedMadrasah)} className={`w-full py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all shadow-xl ${selectedMadrasah.is_active !== false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {updatingId ? <Loader2 className="animate-spin" size={20} /> : selectedMadrasah.is_active !== false ? <><ShieldOff size={18} /> ব্লক করুন</> : <><Shield size={18} /> আনব্লক করুন</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
