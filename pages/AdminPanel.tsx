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
      setError("মাদরাসা তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCount = async (madrasahId: string) => {
    setLoadingCount(true);
    try {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('madrasah_id', madrasahId);
      setStudentCount(count || 0);
    } catch (err) {
      setStudentCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  const fetchDevices = async (madrasahId: string) => {
    setLoadingDevices(true);
    try {
      const { data } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('madrasah_id', madrasahId)
        .order('last_active', { ascending: false });
      setDevices(data || []);
    } catch (err) {
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
      const { error } = await supabase
        .from('madrasahs')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          login_code: editForm.login_code.trim()
        })
        .eq('id', selectedMadrasah.id);

      if (error) throw error;
      const updated = { ...selectedMadrasah, ...editForm };
      setMadrasahs(prev => prev.map(m => m.id === selectedMadrasah.id ? updated : m));
      setSelectedMadrasah(updated);
      setIsEditing(false);
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
      await supabase.from('madrasahs').update({ is_active: newStatus }).eq('id', m.id);
      setMadrasahs(prev => prev.map(item => item.id === m.id ? { ...item, is_active: newStatus } : item));
      if (selectedMadrasah?.id === m.id) setSelectedMadrasah({ ...m, is_active: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return madrasahs.filter(m => 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [madrasahs, searchQuery]);

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-white" size={40} />
      <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">Loading...</p>
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
          {filtered.map(m => (
            <button key={m.id} onClick={() => handleSelectMadrasah(m)} className="w-full bg-white/10 border border-white/10 rounded-[1.8rem] p-4 flex items-center justify-between active:scale-[0.98] transition-all backdrop-blur-md">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                   {m.logo_url ? <img src={m.logo_url} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={20} className="text-white/30" />}
                </div>
                <div>
                  <h3 className="font-black text-white truncate text-sm font-noto">{m.name}</h3>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${m.is_active !== false ? 'text-green-400' : 'text-red-400'}`}>
                    {m.is_active !== false ? 'Active' : 'Blocked'}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-white/20" size={20} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('list'); setIsEditing(false); }} className="p-3 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-xl font-black text-white font-noto">মাদরাসা ডিটেইলস</h1>
        </div>
        {!isEditing && (
          <button onClick={() => { setEditForm({ name: selectedMadrasah.name, phone: selectedMadrasah.phone || '', login_code: selectedMadrasah.login_code || '' }); setIsEditing(true); }} className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
            <Edit3 size={14} /> এডিট
          </button>
        )}
      </div>

      <div className="bg-white/15 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl space-y-8 text-center">
        <div className="w-24 h-24 bg-white/10 rounded-full mx-auto border-4 border-white/10 overflow-hidden">
          {selectedMadrasah.logo_url ? <img src={selectedMadrasah.logo_url} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-white/30 mt-6" />}
        </div>
        
        {isEditing ? (
          <div className="space-y-4 text-left">
            <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} placeholder="নাম" />
            <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} placeholder="ফোন" />
            <input className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white font-bold" value={editForm.login_code} onChange={e=>setEditForm({...editForm, login_code: e.target.value})} placeholder="লগইন কোড" />
            <div className="flex gap-2">
              <button onClick={()=>setIsEditing(false)} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold">বাতিল</button>
              <button onClick={saveChanges} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold">সেভ করুন</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-white font-noto">{selectedMadrasah.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <GraduationCap className="mx-auto mb-2 text-white/40" />
                <div className="text-xl font-black text-white">{studentCount}</div>
                <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Students</div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <MonitorSmartphone className="mx-auto mb-2 text-white/40" />
                <div className="text-xl font-black text-white">{devices.length}</div>
                <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Devices</div>
              </div>
            </div>

            <div className="space-y-3 text-left">
              {devices.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Smartphone size={14} className="text-white/40" />
                    <div>
                      <p className="text-[11px] font-bold text-white">{d.device_info}</p>
                      <p className="text-[9px] text-white/40">{new Date(d.last_active).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
              ))}
            </div>

            <button onClick={() => toggleStatus(selectedMadrasah)} className={`w-full py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all ${selectedMadrasah.is_active !== false ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
              {updatingId ? <Loader2 className="animate-spin" size={20} /> : selectedMadrasah.is_active !== false ? <><ShieldOff size={18} /> ব্লক করুন</> : <><Shield size={18} /> আনব্লক করুন</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
