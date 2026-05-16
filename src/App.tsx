import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Layers, 
  GraduationCap, 
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Clock,
  Filter,
  BarChart3,
  Briefcase,
  User
} from 'lucide-react';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group sidebar-glow ${
      active 
        ? 'bg-primary/10 text-primary sidebar-active' 
        : 'text-muted hover:bg-white/5 hover:text-foreground'
    }`}
  >
    <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-primary text-white' : 'bg-white/5 text-muted group-hover:bg-primary/20 group-hover:text-primary'}`}>
      <Icon size={20} />
    </div>
    <span className={`font-bold text-sm tracking-tight ${active ? 'text-foreground' : 'text-muted'}`}>{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto"><ChevronRight size={16} /></motion.div>}
  </button>
);

const DropdownChip = ({ value, isEditor, getChipColor }: { value: string, isEditor?: boolean, getChipColor: (v: string) => any }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const colors = getChipColor(currentValue);
  
  return (
    <div className={`relative inline-flex items-center w-full mx-auto ${isEditor ? 'max-w-[150px]' : 'max-w-[130px]'}`}>
      <select 
        className={`w-full appearance-none px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/10 text-center uppercase tracking-widest ${colors.bg} ${colors.text} ${colors.border}`}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
      >
        <option value={currentValue}>{currentValue || '---'}</option>
        {isEditor ? (
          <>
            <option value="KIRO">KIRO</option>
            <option value="HASSANEN">HASSANEN</option>
            <option value="BASEL">BASEL</option>
          </>
        ) : (
          <option value="EDIT">EDIT RECORD</option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center opacity-30">
        <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};

const TaskRow = ({ item, index, getChipColor, isOperations }: any) => {
  const [done, setDone] = useState(item.done);
  const [cancel, setCancel] = useState(false);
  const [priority, setPriority] = useState(item.priority);

  if (isOperations) {
    return (
      <motion.tr 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.01 }}
        className="transition-all duration-300 border-b border-white/[0.03] row-hover"
      >
        <td className="px-6 py-5">
          <div className="flex flex-col">
            <span className="text-sm font-bold arabic-text mb-0.5">{item.name}</span>
            <span className="text-[10px] text-muted font-black opacity-30 uppercase tracking-[0.2em]">{item.filingName || 'NO-FILING'}</span>
          </div>
        </td>
        <td className="px-3 py-5 text-center"><DropdownChip value={item.teacher} getChipColor={getChipColor} /></td>
        <td className="px-3 py-5 text-center">
          <div className="flex flex-col gap-1 items-center">
            <span className="chip-base bg-white/5 border-white/10 text-muted">{item.term}</span>
            <span className="chip-base bg-primary/10 border-primary/20 text-primary">{item.year}</span>
          </div>
        </td>
        <td className="px-3 py-5 text-center"><DropdownChip value={item.smartboard} getChipColor={getChipColor} /></td>
        <td className="px-3 py-5 text-center text-[10px] font-bold text-muted opacity-40">{item.date || '---'}</td>
      </motion.tr>
    );
  }

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`transition-all duration-500 border-b border-white/[0.03] row-hover ${cancel ? 'bg-rose-500/[0.03]' : done ? 'bg-emerald-500/[0.03]' : ''}`}
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-4 min-w-[320px]">
          <div className={`w-2 h-10 rounded-full transition-all duration-500 ${cancel ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : done ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`} />
          <div className="flex flex-col">
            <span className="text-base font-bold arabic-text tracking-wide mb-0.5">{item.name}</span>
            <span className="text-[10px] text-muted font-black uppercase tracking-[0.2em] opacity-40">{item.id || 'TASK-UNIDENTIFIED'}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-6 text-center"><DropdownChip value={item.opSheet} getChipColor={getChipColor} /></td>
      <td className="px-3 py-6 text-center"><DropdownChip value={item.branch} getChipColor={getChipColor} /></td>
      <td className="px-3 py-6 text-center">
        <div className="max-w-[180px] px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.05] mx-auto">
          <p className="text-[11px] text-muted arabic-text leading-tight text-center line-clamp-2">{item.notesMarketing || '---'}</p>
        </div>
      </td>
      <td className="px-3 py-6 text-center"><DropdownChip value={item.editor} isEditor={true} getChipColor={getChipColor} /></td>
      <td className="px-3 py-6 text-center">
        <div className="flex justify-center gap-3">
          <button 
            onClick={() => { setDone(!done); if(!done) setCancel(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white/5 text-muted hover:bg-emerald-500/10 hover:text-emerald-400'}`}
          >
            <CheckCircle2 size={20} />
          </button>
          <button 
            onClick={() => { setCancel(!cancel); if(!cancel) setDone(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${cancel ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' : 'bg-white/5 text-muted hover:bg-rose-500/10 hover:text-rose-400'}`}
          >
            <XCircle size={20} />
          </button>
        </div>
      </td>
      <td className="px-3 py-6 text-center">
        <div className="max-w-[180px] text-center mx-auto italic opacity-60">
          <span className="text-[11px] arabic-text">{item.notesEditors || 'Waiting...'}</span>
        </div>
      </td>
      <td className="px-6 py-6 text-center">
        <button 
          onClick={() => setPriority(!priority)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 ${priority ? 'bg-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse' : 'bg-white/5 text-muted hover:bg-primary/20 hover:text-primary'}`}
        >
          <AlertCircle size={20} />
        </button>
      </td>
    </motion.tr>
  );
};

export default function App() {
  const [activeGid, setActiveGid] = useState('2086331904'); // Default to Operations as requested
  const [activeLabel, setActiveLabel] = useState('Operations');
  const { data: liveData, loading, refresh } = useGoogleSheets(activeGid);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');

  const stages = [
    { label: 'Operations', gid: '2086331904', icon: Briefcase },
    { label: 'تجميعات', gid: '1535230545', icon: Layers },
    { label: 'Junior 4', gid: '497207661', icon: GraduationCap },
    { label: 'Junior 5', gid: '96752860', icon: GraduationCap },
    { label: 'Junior 6', gid: '346788121', icon: GraduationCap },
    { label: 'Middle 1', gid: '458352282', icon: GraduationCap },
    { label: 'Middle 2', gid: '2113852114', icon: GraduationCap },
    { label: 'Middle 3', gid: '2089699920', icon: GraduationCap },
    { label: 'Senior 1', gid: '1640460225', icon: GraduationCap },
    { label: 'Senior 2', gid: '595027661', icon: GraduationCap },
    { label: 'Senior 3', gid: '286303232', icon: GraduationCap },
  ];

  const teachers = useMemo(() => {
    if (activeGid !== '2086331904') return [];
    const set = new Set(liveData.map(i => i.teacher).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [liveData, activeGid]);

  const getChipColor = (val: string) => {
    if (!val) return { bg: 'bg-white/5', text: 'text-muted', border: 'border-white/5' };
    const v = val.toUpperCase();
    if (v.includes('اسكندريه') || v.includes('علوم') || v.includes('KIRO') || v.includes('COMPLETED') || v.includes('SMARTBOARD')) return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' };
    if (v.includes('القاهره') || v.includes('ماث') || v.includes('2025') || v.includes('BASEL') || v.includes('URGENT') || v.includes('CANCEL')) return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
    if (v.includes('رياضه') || v.includes('PENDING') || v.includes('IN PROGRESS')) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
    if (v.includes('ساينس') || v.includes('HASSANEN') || v.includes('DONE')) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
    if (v.includes('دراسات') || v.includes('LOW')) return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
    return { bg: 'bg-white/10', text: 'text-foreground', border: 'border-white/10' };
  };

  const filteredData = useMemo(() => {
    return liveData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.filingName && item.filingName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || 
                           (item.status && item.status.toUpperCase() === statusFilter.toUpperCase()) ||
                           (item.done && statusFilter === 'Completed');

      const matchesTeacher = teacherFilter === 'All' || item.teacher === teacherFilter;
      
      return matchesSearch && matchesStatus && matchesTeacher;
    });
  }, [liveData, searchQuery, statusFilter, teacherFilter]);

  return (
    <div className="flex min-h-screen bg-[#05070a] text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 p-8 flex flex-col gap-12 glass-panel shrink-0 z-20 sticky top-0 h-screen">
        <div className="flex items-center gap-4 px-2">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/40 relative group">
            <LayoutDashboard className="text-white group-hover:rotate-12 transition-transform duration-500" size={28} />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none italic uppercase tracking-[0.1em]">NOVA <span className="text-primary">X</span></h1>
            <p className="text-[9px] text-muted mt-2 uppercase tracking-[0.4em] font-black opacity-40">Marketing Intelligence</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted font-black mb-6 px-5 opacity-30">Operational Hub</p>
          {stages.map((stage) => (
            <SidebarItem 
              key={stage.gid}
              icon={stage.icon} 
              label={stage.label} 
              active={activeGid === stage.gid} 
              onClick={() => {
                setActiveGid(stage.gid);
                setActiveLabel(stage.label);
                setStatusFilter('All');
                setTeacherFilter('All');
              }} 
            />
          ))}
        </nav>

        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-5 relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">System</p>
                <p className="text-[10px] text-muted mt-0.5">Optimized Sync V3.1</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#05070a]">
        <header className="px-12 py-10 flex justify-between items-end bg-background/30 backdrop-blur-3xl sticky top-0 z-10 border-b border-white/[0.03]">
          <motion.div key={activeLabel} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
            <div className="flex items-center gap-3 text-primary mb-1 uppercase tracking-[0.3em] font-black text-[10px]">
              <Clock size={12} />
              <span>Real-time Operational Link</span>
            </div>
            <h2 className="text-5xl font-black arabic-text tracking-tighter">{activeLabel}</h2>
          </motion.div>
          
          <div className="flex gap-4">
            <button onClick={() => refresh()} className="btn-glass px-7 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>Synchronize</span>
            </button>
            <button className="btn-primary px-8 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl">
              <Plus size={20} />
              <span>Add entry</span>
            </button>
          </div>
        </header>

        <div className="p-12 space-y-10">
          {/* Filters Bar */}
          <div className="flex gap-6 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search across nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold arabic-text"
              />
            </div>
            
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
              {activeGid === '2086331904' && (
                <div className="flex items-center gap-2 px-4 border-r border-white/10 mr-2 group">
                  <User size={16} className="text-muted group-hover:text-primary transition-colors" />
                  <select 
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted focus:ring-0 cursor-pointer hover:text-foreground transition-colors max-w-[120px]"
                  >
                    <option value="All">All Teachers</option>
                    {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {['All', 'Pending', 'In Progress', 'Done'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted hover:bg-white/5 hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Visual */}
          <div className="table-container bg-glass-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/[0.05]">
                    {activeGid === '2086331904' ? (
                      <>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-right">Operation Detail</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Teacher Entity</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Lifecycle</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Smartboard</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Timestamp</th>
                      </>
                    ) : activeGid === '1535230545' ? (
                      <>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-right">Task Detail</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Sheet</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Loc</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Intel</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Lead</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Workflow</th>
                        <th className="px-3 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Notes</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-primary text-center">Priority</th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">V1</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">V2</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">ID</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Module</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Node</th>
                        <th className="px-10 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-right">Data Payload</th>
                        <th className="px-8 py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted/50 text-center">Target</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={9} className="py-40 text-center">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Decrypting Sheet {activeLabel}...</p>
                        </td>
                      </motion.tr>
                    ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                      <TaskRow 
                        key={idx} 
                        index={idx} 
                        item={item} 
                        getChipColor={getChipColor} 
                        isOperations={activeGid === '2086331904'} 
                      />
                    )) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={9} className="py-40 text-center opacity-30">
                          <AlertCircle size={48} className="mx-auto mb-6 stroke-1" />
                          <p className="text-xs font-black uppercase tracking-[0.3em]">No Match Found</p>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
