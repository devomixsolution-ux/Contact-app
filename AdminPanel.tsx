
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Search, Smartphone, Shield, ShieldOff, Fingerprint, Lock, ChevronRight, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabase';
import { Madrasah, Language } from '../types';
import { t } from '../translations';

interface AdminPanelProps {
  lang: Language;
  onBack?: () => void;
  isStandalone?: boolean;
}

type AdminView = 'list' | 'details';

const AdminPanel: React.FC<AdminPanelProps> = ({ lang, onBack, isStandalone }) => {
  const [madrasahs, setMadrasahs] = useState<Madrasah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Navigation State
  const [currentAdminView, setCurrentAdminView] = useState<AdminView>('list');
  const [selectedMadrasah, setSelectedMadrasah] = useState<Madrasah | null>(null);

  useEffect(() => {
    fetchAllMadrasahs();
  }, []);

  const fetchAllMadrasahs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('madrasahs')
        .select('*')
        .neq('id', user?.id) // Filter out the admin themselves
        .order('created_at', { ascending: false });
      
      if (data) setMadrasahs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (m: Madrasah) => {
    const id = m.id;
    const currentStatus = m.is_active !== false;
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('madrasahs')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      const updatedMadrasah = { ...m, is_active: !currentStatus };
      
      // Update local list
      setMadrasahs(prev => prev.map(item => 
        item.id === id ? updatedMadrasah : item
      ));

      // Update selected madrasah if in detail view
      if (selectedMadrasah?.id === id) {
        setSelectedMadrasah(updatedMadrasah);
      }
    } catch (err) {
      alert('স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = madrasahs.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDetails = (m: Madrasah) => {
    setSelectedMadrasah(m);
    setCurrentAdminView('details');
  };

  const handleGoBack = () => {
    if (currentAdminView === 'details') {
      setCurrentAdminView('list');
      setSelectedMadrasah(null);
    } else if (onBack) {
      onBack();
    }
  };

  // Render List View
  if (currentAdminView === 'list') {
    return (
      <div className="animate-in slide-in-from-left-4 duration-500 pb-20 space-y-6">
        {/* Header - Only show back button if not standalone */}
        <div className="flex items-center gap-4">
          {!isStandalone && (
            <button onClick={handleGoBack} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
              <ArrowLeft size={20} strokeWidth={3} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-white font-noto tracking-tight leading-none">
              {lang === 'bn' ? 'সকল মাদরাসা' : 'All Madrasahs'}
            </h1>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">User Directory</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder={t('search_madrasah', lang)}
            className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/20 rounded-[1.5rem] outline-none text-white font-bold placeholder:text-white/30 focus:bg-white/20 transition-all shadow-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-white/50" size={40} />
            <p className="text-white/30 font-black text-xs uppercase tracking-widest">Loading Users...</p>
          </div>
        ) : (
          <div className="space-y-3">
             <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{filtered.length} {t('total_users', lang)}</span>
                <span className="text-[10px] font-black text-green-400/60 uppercase tracking-widest">{madrasahs.filter(m => m.is_active !== false).length} {t('status_active', lang)}</span>
             </div>
             
            {filtered.map(m => (
              <button 
                key={m.id} 
                onClick={() => handleOpenDetails(m)}
                className={`w-full group relative bg-white/10 border ${m.is_active === false ? 'border-red-500/20' : 'border-white/10'} rounded-[1.8rem] p-4 backdrop-blur-xl flex items-center justify-between active:scale-[0.98] active:bg-white/20 transition-all shadow-md`}
              >
                <div className="flex items-center gap-4 min-w-0">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                      {m.logo_url ? (
                        <img src={m.logo_url} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        <UserIcon size={20} className="text-white/40" />
                      )}
                   </div>
                   <div className="text-left min-w-0">
                      <h3 className="text-[15px] font-black text-white font-noto truncate leading-tight mb-1">{m.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${m.is_active !== false ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-red-500'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-wider ${m.is_active !== false ? 'text-green-400/80' : 'text-red-400/80'}`}>
                          {m.is_active !== false ? t('status_active', lang) : t('status_inactive', lang)}
                        </span>
                      </div>
                   </div>
                </div>
                <ChevronRight className="text-white/20 group-active:text-white transition-colors" size={20} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Details View
  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-20 space-y-6">
      {/* Detail Header */}
      <div className="flex items-center gap-4">
        <button onClick={handleGoBack} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-all border border-white/20 backdrop-blur-md">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white font-noto tracking-tight leading-none">{lang === 'bn' ? 'মাদরাসা প্রোফাইল' : 'Madrasah Profile'}</h1>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Details & Controls</p>
        </div>
      </div>

      {selectedMadrasah && (
        <div className="space-y-6">
          <div className="bg-white/10 border border-white/20 rounded-[3rem] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden text-center">
            {/* Super Admin Badge */}
            {selectedMadrasah.is_super_admin && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-slate-900 text-[8px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-lg z-10">Master Admin</div>
            )}

            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-white/10 shadow-xl overflow-hidden p-1">
              {selectedMadrasah.logo_url ? (
                <img src={selectedMadrasah.logo_url} className="w-full h-full object-cover rounded-full" alt="Logo" />
              ) : (
                <UserIcon size={40} className="text-white/30" />
              )}
            </div>

            <h2 className="text-2xl font-black text-white font-noto mb-2">{selectedMadrasah.name}</h2>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
               <div className={`w-2 h-2 rounded-full ${selectedMadrasah.is_active !== false ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${selectedMadrasah.is_active !== false ? 'text-green-300' : 'text-red-300'}`}>
                 {selectedMadrasah.is_active !== false ? t('status_active', lang) : t('status_inactive', lang)}
               </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                <Fingerprint className="text-white/30 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">ID / UUID</p>
                  <p className="text-xs font-mono text-white/90 truncate">{selectedMadrasah.id}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                <Smartphone className="text-white/30 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Contact Phone</p>
                  <p className="text-base font-bold text-white tracking-wider">{selectedMadrasah.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 opacity-50">
                <Lock className="text-white/30 shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Login Status</p>
                  <p className="text-xs font-bold text-white italic">Protected by Supabase Auth</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!selectedMadrasah.is_super_admin && (
              <div className="mt-8 space-y-3">
                <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest text-center mb-4">Account Access Control</label>
                
                {selectedMadrasah.is_active !== false ? (
                  <button 
                    onClick={() => toggleStatus(selectedMadrasah)}
                    disabled={updatingId === selectedMadrasah.id}
                    className="w-full bg-red-500/20 text-red-100 border border-red-500/30 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {updatingId === selectedMadrasah.id ? <Loader2 className="animate-spin" size={20} /> : <><ShieldOff size={20} /> Disable Access</>}
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleStatus(selectedMadrasah)}
                    disabled={updatingId === selectedMadrasah.id}
                    className="w-full bg-green-500 text-white shadow-xl shadow-green-900/20 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {updatingId === selectedMadrasah.id ? <Loader2 className="animate-spin text-white" size={20} /> : <><Shield size={20} /> Restore Access</>}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <p className="text-center text-white/20 text-[9px] font-black uppercase tracking-[0.3em] px-10">
            Modifying user status will affect their ability to login instantly.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
