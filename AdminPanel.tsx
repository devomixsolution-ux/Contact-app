
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Search, Smartphone, Shield, ShieldOff, Mail, Info, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language } from '../types';
import { t } from '../translations';

interface AdminPanelProps {
  lang: Language;
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ lang, onBack }) => {
  const [madrasahs, setMadrasahs] = useState<Madrasah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllMadrasahs();
  }, []);

  const fetchAllMadrasahs = async () => {
    setLoading(true);
    // Note: To get emails, we'd need to join with auth.users if permissions allow, 
    // but typically we'll just show madrasah metadata.
    const { data, error } = await supabase
      .from('madrasahs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setMadrasahs(data);
    setLoading(false);
  };

  const toggleMadrasahStatus = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('madrasahs')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setMadrasahs(prev => prev.map(m => 
        m.id === id ? { ...m, is_active: !currentStatus } : m
      ));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMadrasahs = madrasahs.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(searchQuery))
  );

  const stats = {
    total: madrasahs.length,
    active: madrasahs.filter(m => m.is_active !== false).length,
    blocked: madrasahs.filter(m => m.is_active === false).length
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 bg-white/10 rounded-xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-black text-white font-noto">{t('admin_panel', lang)}</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-center">
          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">{t('total_users', lang)}</p>
          <p className="text-xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 p-3 rounded-2xl text-center">
          <p className="text-[8px] font-black text-green-200/50 uppercase tracking-widest mb-1">{t('active_users', lang)}</p>
          <p className="text-xl font-black text-green-300">{stats.active}</p>
        </div>
        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 p-3 rounded-2xl text-center">
          <p className="text-[8px] font-black text-red-200/50 uppercase tracking-widest mb-1">{t('blocked_users', lang)}</p>
          <p className="text-xl font-black text-red-300">{stats.blocked}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
        <input
          type="text"
          placeholder={t('search_madrasah', lang)}
          className="w-full pl-11 pr-5 py-3.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl outline-none text-white placeholder:text-white/40 font-bold text-sm focus:bg-white/25 transition-all shadow-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>
      ) : (
        <div className="space-y-4">
          {filteredMadrasahs.map(m => (
            <div key={m.id} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-5 shadow-xl relative overflow-hidden">
              {m.is_super_admin && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Super Admin</div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-white font-noto truncate">{m.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${m.is_active !== false ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${m.is_active !== false ? 'text-green-300' : 'text-red-300'}`}>
                      {m.is_active !== false ? t('status_active', lang) : t('status_inactive', lang)}
                    </span>
                  </div>
                </div>
                
                {!m.is_super_admin && (
                  <button 
                    onClick={() => toggleMadrasahStatus(m.id, m.is_active !== false)}
                    disabled={updatingId === m.id}
                    className={`relative w-12 h-6 rounded-full transition-colors ${m.is_active !== false ? 'bg-green-500' : 'bg-slate-600'} flex items-center p-1 shadow-inner`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${m.is_active !== false ? 'translate-x-6' : 'translate-x-0'} flex items-center justify-center`}>
                      {updatingId === m.id && <Loader2 size={10} className="animate-spin text-[#d35132]" />}
                    </div>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-white/60">
                <div className="flex items-center gap-2 text-[11px]">
                  <Hash size={12} className="shrink-0" />
                  <span className="font-mono truncate">{m.id}</span>
                </div>
                {m.phone && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Smartphone size={12} className="shrink-0" />
                    <span className="font-bold">{m.phone}</span>
                  </div>
                )}
                {/* Email is technically in auth.users, but if you've stored it or join it: */}
                <div className="flex items-center gap-2 text-[11px]">
                  <Mail size={12} className="shrink-0" />
                  <span className="italic">Login secured by Supabase Auth</span>
                </div>
              </div>

              {!m.is_super_admin && (
                <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
                   {m.is_active !== false ? (
                      <button 
                        onClick={() => toggleMadrasahStatus(m.id, true)}
                        className="flex-1 bg-red-500/20 text-red-200 border border-red-500/30 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <ShieldOff size={14} /> Block User
                      </button>
                   ) : (
                      <button 
                        onClick={() => toggleMadrasahStatus(m.id, false)}
                        className="flex-1 bg-green-500/20 text-green-200 border border-green-500/30 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Shield size={14} /> Activate User
                      </button>
                   )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Hash = ({ size, className }: any) => <span className={className}>#</span>;

export default AdminPanel;
