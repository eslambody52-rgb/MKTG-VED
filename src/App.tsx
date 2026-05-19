import { useState, useMemo, useEffect } from 'react';
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
  Clock,
  BarChart3,
  Briefcase,
  User,
  Bell,
  MonitorPlay,
  PieChart,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const generateKey = (item: any) => {
  let hash = 0;
  const str = String(item?.name || '') + String(item?.id || '') + String(item?.val || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  return 'row-' + Math.abs(hash);
};

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, active, onClick, colorHex, colorful }: any) => {
  const cHex = colorHex || '#3b82f6';

  const bgStyle = colorful
    ? (active 
        ? { backgroundColor: `${cHex}35`, color: '#ffffff', borderColor: `${cHex}80`, boxShadow: `0 0 25px ${cHex}40` } 
        : { backgroundColor: `${cHex}18`, color: '#ffffff', borderColor: `${cHex}30` })
    : (active
        ? { backgroundColor: `rgba(255,255,255,0.08)`, color: '#ffffff', borderColor: `rgba(255,255,255,0.15)` }
        : { backgroundColor: `transparent`, color: '#94a3b8', borderColor: `transparent` });

  const iconBgStyle = colorful
    ? (active 
        ? { backgroundColor: cHex, color: '#ffffff', boxShadow: `0 0 20px ${cHex}` } 
        : { backgroundColor: `${cHex}30`, color: cHex })
    : (active
        ? { backgroundColor: `#3b82f6`, color: '#ffffff', boxShadow: `0 0 20px rgba(59,130,246,0.5)` }
        : { backgroundColor: `rgba(255,255,255,0.05)`, color: '#94a3b8' });

  return (
    <button
      onClick={onClick}
      style={bgStyle}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 group cursor-pointer ${
        active 
          ? 'font-black scale-[1.03]' 
          : 'hover:scale-[1.01] hover:brightness-125 opacity-85 hover:opacity-100'
      }`}
    >
      <div style={iconBgStyle} className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <span className="font-bold text-sm tracking-tight truncate text-left text-white">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto text-white"><ChevronRight size={16} /></motion.div>}
    </button>
  );
};

// ─── Chip Colors ──────────────────────────────────────────────────────────────
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

// ─── Chip component ───────────────────────────────────────────────────────────
const Chip = ({ value }: { value: string }) => {
  const colors = getChipColor(value);
  return (
    <span className={`chip-base ${colors.bg} ${colors.text} ${colors.border}`}>
      {value || '---'}
    </span>
  );
};

const getTargetStageGid = (item: any) => {
  const str = String(item?.filingName || item?.name || '').toUpperCase();
  if (str.includes('J4') || str.includes('JUNIOR 4')) return { gid: '497207661', label: 'Junior 4' };
  if (str.includes('J5') || str.includes('JUNIOR 5')) return { gid: '96752860', label: 'Junior 5' };
  if (str.includes('J6') || str.includes('JUNIOR 6')) return { gid: '346788121', label: 'Junior 6' };
  if (str.includes('M1') || str.includes('MIDDLE 1')) return { gid: '458352282', label: 'Middle 1' };
  if (str.includes('M2') || str.includes('MIDDLE 2')) return { gid: '2113852114', label: 'Middle 2' };
  if (str.includes('M3') || str.includes('MIDDLE 3')) return { gid: '2089699920', label: 'Middle 3' };
  if (str.includes('S1') || str.includes('SENIOR 1')) return { gid: '1640460225', label: 'Senior 1' };
  if (str.includes('S2') || str.includes('SENIOR 2')) return { gid: '595027661', label: 'Senior 2' };
  if (str.includes('S3') || str.includes('SENIOR 3')) return { gid: '286303232', label: 'Senior 3' };
  return { gid: '497207661', label: 'Junior 4' };
};

const getSubjectFromFiling = (str: string) => {
  if (!str) return 'عام';
  const s = str.toUpperCase();
  if (s.includes('AR')) return 'عربي';
  if (s.includes('MATH')) return 'ماث';
  if (s.includes('SCI')) return 'ساينس';
  if (s.includes('SS') || s.includes('SOCIAL')) return 'دراسات';
  if (s.includes('EN')) return 'إنجليزي';
  return 'عام';
};

// ─── Operations Row ───────────────────────────────────────────────────────────
const OperationsRow = ({ item, index, youtubeItems, onYoutubeToggle, isSelectedForMerge, onToggleMergeSelect }: any) => {
  const stage = getTargetStageGid(item);
  const itemKey = generateKey(item);
  const isYoutubeChecked = (youtubeItems?.[stage.gid] || []).some((i: any) => 
    i.uniqueKey === ('yt-' + itemKey) || (i.mergedItemKeys && i.mergedItemKeys.includes(itemKey))
  );

  return (
    <motion.tr
      id={itemKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.01 }}
      className={`transition-all duration-300 border-b border-white/[0.03] row-hover ${isYoutubeChecked ? 'bg-purple-600/[0.08]' : isSelectedForMerge ? 'bg-purple-500/[0.04]' : ''}`}
    >
      <td className="px-8 py-5" dir="rtl">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold arabic-text mb-1 whitespace-pre-wrap leading-relaxed tracking-wide text-white/95">{item.name}</span>
          <span className="text-[10px] text-muted font-black opacity-40 uppercase tracking-[0.2em]">{item.filingName || 'NO-FILING'}</span>
        </div>
      </td>
      <td className="px-3 py-5 text-center"><Chip value={item.teacher} /></td>
      <td className="px-3 py-5 text-center">
        <div className="flex flex-col gap-1 items-center">
          <span className="chip-base bg-white/5 border-white/10 text-muted">{item.term}</span>
          <span className="chip-base bg-primary/10 border-primary/20 text-primary">{item.year}</span>
        </div>
      </td>
      <td className="px-3 py-5 text-center"><Chip value={item.smartboard} /></td>
      <td className="px-3 py-5 text-center text-[10px] font-bold text-muted opacity-40">{item.date || '---'}</td>
      <td className="px-4 py-5 text-center">
        <button
          onClick={() => onYoutubeToggle(item, !isYoutubeChecked)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 cursor-pointer ${
            isYoutubeChecked 
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110 ring-2 ring-purple-400' 
              : 'bg-white/5 text-muted hover:bg-purple-500/20 hover:text-purple-400'
          }`}
        >
          <MonitorPlay size={22} className={isYoutubeChecked ? 'animate-pulse' : ''} />
        </button>
      </td>
      <td className="px-4 py-5 text-center">
        <input
          type="checkbox"
          checked={isSelectedForMerge}
          onChange={() => onToggleMergeSelect(item)}
          className="w-5 h-5 accent-purple-600 rounded cursor-pointer transition-transform hover:scale-110"
          title="تحديد لدمج عدة دروس معاً في يوتيوب"
        />
      </td>
    </motion.tr>
  );
};

// ─── Tagme3at Row ─────────────────────────────────────────────────────────────
const TagmeRow = ({ item, index }: any) => {
  const [done, setDone] = useState(item.done);
  const [cancel, setCancel] = useState(false);
  const [priority, setPriority] = useState(item.priority);

  return (
    <motion.tr
      id={item.uniqueKey || generateKey(item)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`transition-all duration-500 border-b border-white/[0.03] row-hover ${done ? 'bg-emerald-500/[0.03]' : priority ? 'bg-purple-600/[0.05]' : cancel ? 'bg-rose-500/[0.03]' : ''}`}
    >
      <td className="px-8 py-6" dir="rtl">
        <div className="flex items-center justify-end gap-4 min-w-[280px] text-right">
          <span className="text-base font-bold arabic-text tracking-wide whitespace-pre-wrap leading-relaxed text-white/95">{item.name}</span>
          <div className={`w-2.5 h-12 rounded-full transition-all duration-500 flex-shrink-0 ${
            done 
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
              : priority 
              ? 'bg-purple-600 shadow-[0_0_16px_rgba(147,51,234,0.9)] animate-pulse' 
              : cancel 
              ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
              : 'bg-white/15'
          }`} />
        </div>
      </td>
      <td className="px-3 py-6 text-center"><Chip value={item.opSheet} /></td>
      <td className="px-3 py-6 text-center"><Chip value={item.branch} /></td>
      <td className="px-3 py-6 text-center">
        <div className="max-w-[180px] px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.05] mx-auto">
          <p className="text-[11px] text-muted arabic-text leading-tight text-center line-clamp-2">{item.notesMarketing || '---'}</p>
        </div>
      </td>
      <td className="px-3 py-6 text-center"><Chip value={item.editor} /></td>
      <td className="px-3 py-6 text-center">
        <div className="flex justify-center gap-3">
          <button
            onClick={() => { setDone(!done); if (!done) setCancel(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white/5 text-muted hover:bg-emerald-500/10 hover:text-emerald-400'}`}
          >
            <CheckCircle2 size={20} />
          </button>
          <button
            onClick={() => { setCancel(!cancel); if (!cancel) setDone(false); }}
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
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 cursor-pointer ${
            priority 
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] ring-2 ring-purple-400 scale-110 animate-pulse' 
              : 'bg-white/5 text-muted hover:bg-purple-500/20 hover:text-purple-400'
          }`}
        >
          <AlertCircle size={20} />
        </button>
      </td>
    </motion.tr>
  );
};

// ─── Stage Row (Junior/Middle/Senior) ─────────────────────────────────────────
const StageRow = ({ item, index, tagmeTransfers, onTagmeToggle, activeLabel }: any) => {
  const itemKey = 'tgm-' + (item.uniqueKey || generateKey(item));
  const isTagmeChecked = (tagmeTransfers || []).some((i: any) => i.uniqueKey === itemKey);
  const [received, setReceived] = useState(item.check2);

  const getWeekColor = (w: string) => {
    if (!w) return 'bg-white/5 border-white/10 text-muted';
    const num = w.replace(/\D/g, '');
    const code = parseInt(num) || (w.charCodeAt(w.length - 1) % 6);
    switch (code % 6) {
      case 1: return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 2: return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
      case 3: return 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      case 4: return 'bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
      case 5: return 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
      default: return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]';
    }
  };

  return (
    <motion.tr
      id={item.uniqueKey || generateKey(item)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.01 }}
      className={`transition-all duration-300 border-b border-white/[0.03] row-hover ${isTagmeChecked ? 'bg-emerald-500/[0.08]' : ''}`}
    >
      <td className="px-4 py-5 text-center">
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 whitespace-nowrap inline-block font-mono ${getWeekColor(item.week || '')}`}>
          {item.week || '---'}
        </span>
      </td>
      <td className="px-4 py-5 text-center">
        <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-blue-400 shrink-0">{item.date || item.id || '---'}</span>
      </td>
      <td className="px-8 py-5" dir="rtl">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold arabic-text mb-1 whitespace-pre-wrap leading-relaxed tracking-wide text-white/95">{item.name}</span>
          {item.filingName && item.filingName !== item.name && (
            <span className="text-[10px] text-muted font-black opacity-40 uppercase tracking-[0.15em]">{item.filingName}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-5 text-center"><Chip value={item.subject} /></td>
      <td className="px-3 py-5 text-center"><Chip value={item.branch || item.extra} /></td>
      <td className="px-3 py-5 text-center"><Chip value={item.opSheet || item.val} /></td>
      <td className="px-6 py-5 text-center">
        <button
          onClick={() => onTagmeToggle(item, activeLabel, !isTagmeChecked)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-300 cursor-pointer ${isTagmeChecked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400 scale-110' : 'bg-white/5 text-muted hover:bg-emerald-500/10 hover:text-emerald-400'}`}
        >
          <CheckCircle2 size={18} />
        </button>
      </td>
      <td className="px-6 py-5 text-center">
        <button
          onClick={() => setReceived(!received)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-300 ${received ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-muted hover:bg-blue-500/10 hover:text-blue-400'}`}
        >
          <CheckCircle2 size={18} />
        </button>
      </td>
    </motion.tr>
  );
};

// ─── Tagme3at Analytics Dashboard Component ──────────────────────────────────
const TagmeAnalyticsDashboard = ({ liveData, tagmeTransfers, loading }: any) => {
  const combined = useMemo(() => {
    return [...tagmeTransfers, ...liveData];
  }, [liveData, tagmeTransfers]);

  const stats = useMemo(() => {
    const total = combined.length;
    const completed = combined.filter(i => String(i.done) === 'true' || i.done === true).length;
    const pending = total - completed;
    const priority = combined.filter(i => String(i.priority) === 'true' || i.priority === true).length;
    const transfersCount = tagmeTransfers.length;

    // Stage breakdown
    const stageMap: Record<string, { count: number, completed: number }> = {};
    combined.forEach(i => {
      const stage = (i.opSheet || 'أخرى').trim();
      if (!stageMap[stage]) stageMap[stage] = { count: 0, completed: 0 };
      stageMap[stage].count++;
      if (String(i.done) === 'true' || i.done === true) stageMap[stage].completed++;
    });

    // Editor breakdown
    const editorMap: Record<string, { count: number, completed: number }> = {};
    combined.forEach(i => {
      const editor = (i.editor || 'غير محدد').trim();
      if (!editorMap[editor]) editorMap[editor] = { count: 0, completed: 0 };
      editorMap[editor].count++;
      if (String(i.done) === 'true' || i.done === true) editorMap[editor].completed++;
    });

    return { 
      total, 
      completed, 
      pending, 
      priority, 
      transfersCount, 
      stageMap: Object.entries(stageMap).sort((a,b) => b[1].count - a[1].count), 
      editorMap: Object.entries(editorMap).sort((a,b) => b[1].count - a[1].count) 
    };
  }, [combined, tagmeTransfers]);

  if (loading) {
    return (
      <div className="py-40 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.4em] text-emerald-400 animate-pulse">جاري جلب وتحليل بيانات التجميعات...</p>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-12 animate-fadeIn" dir="rtl">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-l from-emerald-600/20 via-teal-900/20 to-transparent border border-emerald-500/30 relative overflow-hidden flex items-center justify-between shadow-[0_0_50px_rgba(16,185,129,0.15)]">
        <div className="space-y-2 relative z-10">
          <h2 className="text-3xl font-black text-white arabic-text flex items-center gap-3">
            <span>لوحة تحكم إحصائيات التجميعات</span>
            <span className="text-xs px-3 py-1 bg-emerald-500 text-white rounded-full font-bold shadow-lg shadow-emerald-500/50">LIVE V3.2</span>
          </h2>
          <p className="text-sm text-emerald-300/80 arabic-text">تحليل فوري لحالة المونتاج، التوزيع على المراحل، وأداء المحررين في شيت التجميعات.</p>
        </div>
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <BarChart3 size={40} className="animate-pulse" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted group-hover:text-emerald-300 transition-colors arabic-text">إجمالي التجميعات</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-white">{stats.total}</h3>
          <p className="text-[10px] text-muted mt-2 arabic-text opacity-60">تشمل المحولة والمباشرة</p>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted group-hover:text-emerald-400 transition-colors arabic-text">المكتملة بنجاح</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-emerald-400">{stats.completed}</h3>
          <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.completed/stats.total)*100 : 0}%` }} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-amber-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted group-hover:text-amber-400 transition-colors arabic-text">قيد التنفيذ والمراجعة</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-amber-400">{stats.pending}</h3>
          <div className="mt-2 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.total > 0 ? (stats.pending/stats.total)*100 : 0}%` }} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(147,51,234,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted group-hover:text-purple-300 transition-colors arabic-text">أولوية قصوى</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.5)]">
              <AlertCircle size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-purple-400">{stats.priority}</h3>
          <p className="text-[10px] text-purple-300 mt-2 arabic-text opacity-80">دروس تتطلب تسليم فوري</p>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-blue-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black text-muted group-hover:text-blue-300 transition-colors arabic-text">محولة تلقائياً</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-blue-400">{stats.transfersCount}</h3>
          <p className="text-[10px] text-blue-300 mt-2 arabic-text opacity-80">من شيتات المراحل</p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stage Distribution */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <PieChart size={20} />
              </div>
              <h3 className="text-xl font-black text-white arabic-text">توزيع التجميعات على المراحل</h3>
            </div>
            <span className="text-xs text-muted font-bold">{stats.stageMap.length} مراحل نشطة</span>
          </div>
          <div className="space-y-5 max-h-[360px] overflow-y-auto pr-2">
            {stats.stageMap.map(([stage, { count, completed }]) => (
              <div key={stage} className="space-y-2">
                <div className="flex justify-between text-sm arabic-text font-bold">
                  <span className="text-white/90">{stage}</span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-emerald-400">{completed} مكتمل</span>
                    <span className="text-muted">/</span>
                    <span className="text-white">{count} إجمالي</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden p-0.5 flex">
                  <div className="bg-gradient-to-l from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(completed/count)*100}%` }} />
                  <div className="bg-white/15 h-full transition-all duration-1000 rounded-full" style={{ width: `${((count-completed)/count)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editors Performance */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-black text-white arabic-text">أداء المحررين وحالة المونتاج</h3>
            </div>
            <span className="text-xs text-muted font-bold">{stats.editorMap.length} محررين</span>
          </div>
          <div className="space-y-5 max-h-[360px] overflow-y-auto pr-2">
            {stats.editorMap.map(([editor, { count, completed }]) => (
              <div key={editor} className="space-y-2">
                <div className="flex justify-between text-sm arabic-text font-bold">
                  <span className="text-white/90 flex items-center gap-2">
                    <Award size={14} className="text-amber-400" />
                    <span>{editor}</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-lg">{Math.round((completed/count)*100)}% إنجاز</span>
                    <span className="text-white">{count} دروس</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-l from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(completed/count)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeGid, setActiveGid] = useState('2086331904');
  const [activeLabel, setActiveLabel] = useState('Operations');
  
  const isOperations = activeGid === '2086331904';
  const isTagme3at = activeGid === '1535230545';
  const isAnalyticsTagme = activeGid === 'analytics_tagme3at';
  const isStage = !isOperations && !isTagme3at && !isAnalyticsTagme;

  const sheetGidToFetch = isAnalyticsTagme ? '1535230545' : activeGid;
  const { data: liveData, loading, refresh } = useGoogleSheets(sheetGidToFetch);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const [newItems, setNewItems] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [youtubeItems, setYoutubeItems] = useState<{ [gid: string]: any[] }>({});
  const [activeToast, setActiveToast] = useState<{ item: any, stage: { gid: string, label: string }, uniqueKey: string } | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<any[]>([]);

  const [tagmeTransfers, setTagmeTransfers] = useState<any[]>([]);
  const [activeTagmeToast, setActiveTagmeToast] = useState<{ item: any, stage: { gid: string, label: string }, uniqueKey: string } | null>(null);

  const [localEntries, setLocalEntries] = useState<{ [gid: string]: any[] }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', filingName: '', val: '', id: '', subject: '', extra: '', editor: '', notesMarketing: '' });
  const [colorfulTabs, setColorfulTabs] = useState(false);
  const [stageWeekFilter, setStageWeekFilter] = useState('All');

  useEffect(() => {
    const savedLocal = localStorage.getItem('local_entries_v1');
    if (savedLocal) {
      try { setLocalEntries(JSON.parse(savedLocal)); } catch(e) {}
    }
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name) return;
    const newItem = {
      ...addForm,
      uniqueKey: 'local-' + Date.now(),
      check1: false,
      check2: false,
      done: false,
      priority: false,
      date: addForm.id || new Date().toLocaleDateString(),
      branch: addForm.extra,
      opSheet: addForm.val
    };
    setLocalEntries(prev => {
      const list = prev[activeGid] || [];
      const updated = [newItem, ...list];
      const map = { ...prev, [activeGid]: updated };
      localStorage.setItem('local_entries_v1', JSON.stringify(map));
      return map;
    });
    setShowAddModal(false);
    setAddForm({ name: '', filingName: '', val: '', id: '', subject: '', extra: '', editor: '', notesMarketing: '' });
  };

  useEffect(() => {
    const saved = localStorage.getItem('tagme3at_transfers');
    if (saved) {
      try { setTagmeTransfers(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleTagmeToggle = (item: any, sheetLabel: string, isChecked: boolean) => {
    const uniqueKey = 'tgm-' + (item.uniqueKey || generateKey(item));

    setTagmeTransfers(prev => {
      let updatedList;
      if (isChecked) {
        const newTagme = {
          name: item.name,
          filingName: item.filingName || '---',
          opSheet: sheetLabel,
          branch: item.extra || item.branch || 'الفرع',
          notesMarketing: 'تم تحويلها من شيت ' + sheetLabel,
          editor: item.editor || 'محرر',
          notesEditors: 'بانتظار المراجعة',
          done: false,
          priority: false,
          cancel: false,
          uniqueKey: uniqueKey,
          isTagmeTransfer: true
        };
        if (!prev.some(i => i.uniqueKey === uniqueKey)) {
          updatedList = [newTagme, ...prev];
        } else {
          updatedList = prev;
        }
      } else {
        updatedList = prev.filter(i => i.uniqueKey !== uniqueKey);
      }
      localStorage.setItem('tagme3at_transfers', JSON.stringify(updatedList));
      return updatedList;
    });

    if (isChecked) {
      const targetStage = { gid: '1535230545', label: 'تجميعات' };
      setActiveTagmeToast({ item, stage: targetStage, uniqueKey });
      setTimeout(() => {
        setActiveTagmeToast(prev => prev?.uniqueKey === uniqueKey ? null : prev);
      }, 10000);
    } else {
      if (activeTagmeToast?.uniqueKey === uniqueKey) setActiveTagmeToast(null);
    }
  };

  const navigateToTagmeTransfer = (toastData: any) => {
    setActiveGid(toastData.stage.gid);
    setActiveLabel(toastData.stage.label);
    setSearchQuery('');
    setStatusFilter('All');
    setTeacherFilter('All');
    setYearFilter('All');
    setColFilters({});
    setActiveTagmeToast(null);

    setTimeout(() => {
      const el = document.getElementById(toastData.uniqueKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-emerald-500/30', 'transition-colors', 'duration-1000', 'scale-[1.01]');
        setTimeout(() => el.classList.remove('bg-emerald-500/30', 'scale-[1.01]'), 3000);
      }
    }, 150);
  };

  const handleToggleMergeSelect = (item: any) => {
    const key = generateKey(item);
    setSelectedForMerge(prev => {
      if (prev.some(i => generateKey(i) === key)) {
        return prev.filter(i => generateKey(i) !== key);
      }
      return [...prev, item];
    });
  };

  const handleExecuteMerge = () => {
    if (selectedForMerge.length === 0) return;
    const sample = selectedForMerge[0];
    const stage = getTargetStageGid(sample);
    
    const combinedNames = selectedForMerge.map((i, idx) => `[حصة ${idx+1}] ${i.name}`).join(' + ');
    const combinedFiling = selectedForMerge.map(i => i.name).join(' | ');
    const uniqueKey = 'merge-' + Date.now();

    const mergedItem = {
      name: `[يوتيوب مدمج] ${combinedNames}`,
      filingName: combinedFiling,
      val: sample.year || sample.term || 'YouTube Merge',
      id: sample.date || sample.teacher || '---',
      subject: getSubjectFromFiling(combinedFiling),
      extra: 'يوتيوب العمليات (مدمج)',
      check1: false,
      check2: false,
      uniqueKey: uniqueKey,
      isYoutubeTransfer: true
    };

    setYoutubeItems(prev => {
      const list = prev[stage.gid] || [];
      const updated = [mergedItem, ...list];
      const map = { ...prev, [stage.gid]: updated };
      localStorage.setItem('youtube_transfers', JSON.stringify(map));
      return map;
    });

    setActiveToast({
      item: { name: combinedNames },
      stage: stage,
      uniqueKey: uniqueKey
    });

    setSelectedForMerge([]);
  };

  useEffect(() => {
    const saved = localStorage.getItem('youtube_transfers');
    if (saved) {
      try { setYoutubeItems(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleYoutubeToggle = (item: any, isChecked: boolean) => {
    const stage = getTargetStageGid(item);
    const uniqueKey = 'yt-' + generateKey(item);

    setYoutubeItems(prev => {
      const currentList = prev[stage.gid] || [];
      let updatedList;
      if (isChecked) {
        const newItem = {
          name: `[يوتيوب] ${item.filingName || item.name}`,
          filingName: item.name,
          val: item.year || item.term || 'YouTube',
          id: item.date || item.teacher || '---',
          subject: getSubjectFromFiling(item.filingName),
          extra: 'يوتيوب العمليات',
          check1: false,
          check2: false,
          uniqueKey: uniqueKey,
          isYoutubeTransfer: true
        };
        if (!currentList.some(i => i.uniqueKey === uniqueKey)) {
          updatedList = [newItem, ...currentList];
        } else {
          updatedList = currentList;
        }
      } else {
        updatedList = currentList.filter(i => i.uniqueKey !== uniqueKey);
      }
      
      const updatedMap = { ...prev, [stage.gid]: updatedList };
      localStorage.setItem('youtube_transfers', JSON.stringify(updatedMap));
      return updatedMap;
    });

    if (isChecked) {
      setActiveToast({ item, stage, uniqueKey });
      setTimeout(() => {
        setActiveToast(prev => prev?.uniqueKey === uniqueKey ? null : prev);
      }, 10000);
    } else {
      if (activeToast?.uniqueKey === uniqueKey) setActiveToast(null);
    }
  };

  const navigateToYoutubeTransfer = (toastData: any) => {
    setActiveGid(toastData.stage.gid);
    setActiveLabel(toastData.stage.label);
    setSearchQuery('');
    setStatusFilter('All');
    setTeacherFilter('All');
    setYearFilter('All');
    setColFilters({});
    setActiveToast(null);

    setTimeout(() => {
      const el = document.getElementById(toastData.uniqueKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-purple-600/30', 'transition-colors', 'duration-1000', 'scale-[1.01]');
        setTimeout(() => el.classList.remove('bg-purple-600/30', 'scale-[1.01]'), 3000);
      }
    }, 150);
  };

  useEffect(() => {
    const saved = localStorage.getItem(`new_items_${activeGid}`);
    if (saved) {
      try { setNewItems(JSON.parse(saved)); } catch (e) {}
    } else {
      setNewItems([]);
    }
  }, [activeGid]);

  useEffect(() => {
    if (liveData.length === 0) return;
    const SEEN_KEY = `seen_items_${activeGid}`;
    const NEW_KEY = `new_items_${activeGid}`;
    
    const seenStr = localStorage.getItem(SEEN_KEY);
    const seenSet = seenStr ? new Set(JSON.parse(seenStr)) : new Set();
    
    const currentNames = new Set<string>();
    const newlyAdded: any[] = [];

    liveData.forEach((item) => {
      const key = generateKey(item);
      currentNames.add(key);
      
      if (seenSet.size > 0 && !seenSet.has(key)) {
        newlyAdded.push({ ...item, uniqueKey: key });
      }
    });

    if (newlyAdded.length > 0) {
      setNewItems(prev => {
        const map = new Map(prev.map(p => [p.uniqueKey, p]));
        newlyAdded.forEach(n => map.set(n.uniqueKey, n));
        const finalNew = Array.from(map.values());
        localStorage.setItem(NEW_KEY, JSON.stringify(finalNew));
        return finalNew;
      });
    }

    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(currentNames)));
  }, [liveData, activeGid]);

  const dismissNotification = (uniqueKey: string) => {
    setNewItems(prev => {
      const updated = prev.filter(p => p.uniqueKey !== uniqueKey);
      localStorage.setItem(`new_items_${activeGid}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleNotificationClick = (item: any) => {
    setSearchQuery('');
    setStatusFilter('All');
    setTeacherFilter('All');
    setYearFilter('All');
    setColFilters({});
    setShowNotifications(false);

    setTimeout(() => {
      const el = document.getElementById(item.uniqueKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-primary/20', 'transition-colors', 'duration-1000');
        setTimeout(() => el.classList.remove('bg-primary/20'), 2000);
      }
    }, 100);

    dismissNotification(item.uniqueKey);
  };

  const stages = [
    { label: 'Operations', gid: '2086331904', icon: Briefcase, colorHex: '#8b5cf6' },
    { label: 'تجميعات', gid: '1535230545', icon: Layers, colorHex: '#10b981' },
    { label: 'Junior 4', gid: '497207661', icon: GraduationCap, colorHex: '#b49fee' },
    { label: 'Junior 5', gid: '96752860', icon: GraduationCap, colorHex: '#92dcf7' },
    { label: 'Junior 6', gid: '346788121', icon: GraduationCap, colorHex: '#ff7843' },
    { label: 'Middle 1', gid: '458352282', icon: GraduationCap, colorHex: '#ab4bbb' },
    { label: 'Middle 2', gid: '2113852114', icon: GraduationCap, colorHex: '#2563eb' },
    { label: 'Middle 3', gid: '2089699920', icon: GraduationCap, colorHex: '#2bb881' },
    { label: 'Senior 1', gid: '1640460225', icon: GraduationCap, colorHex: '#61c4be' },
    { label: 'Senior 2', gid: '595027661', icon: GraduationCap, colorHex: '#00a2ff' },
    { label: 'Senior 3', gid: '286303232', icon: GraduationCap, colorHex: '#8b5cf6' },
    { label: 'إحصائيات التجميعات 📊', gid: 'analytics_tagme3at', icon: BarChart3, colorHex: '#10b981' },
  ];

  const combinedData = useMemo(() => {
    const currentLocal = localEntries[activeGid] || [];
    if (isOperations) return [...currentLocal, ...liveData];
    if (isTagme3at) return [...currentLocal, ...tagmeTransfers, ...liveData];
    const transfers = youtubeItems[activeGid] || [];
    return [...currentLocal, ...transfers, ...liveData];
  }, [liveData, youtubeItems, tagmeTransfers, localEntries, activeGid, isOperations, isTagme3at]);

  const teachers = useMemo(() => {
    if (!isOperations) return [];
    const set = new Set(combinedData.map((i: any) => i.teacher).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [combinedData, isOperations]);

  const years = useMemo(() => {
    if (!isOperations) return [];
    const set = new Set(liveData.map((i: any) => i.year).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [liveData, isOperations]);

  const availableWeeks = useMemo(() => {
    if (isOperations || isTagme3at || isAnalyticsTagme) return [];
    const set = new Set(liveData.map((i: any) => i.week ? String(i.week).trim() : '').filter(Boolean));
    return Array.from(set) as string[];
  }, [liveData, isOperations, isTagme3at, isAnalyticsTagme]);


  const filteredData = useMemo(() => {
    return combinedData.filter((item: any) => {
      const searchVal = searchQuery.toLowerCase();
      const matchesSearch = !searchVal ||
        (item.name && String(item.name).toLowerCase().includes(searchVal)) ||
        (item.filingName && String(item.filingName).toLowerCase().includes(searchVal)) ||
        (item.id && String(item.id).toLowerCase().includes(searchVal)) ||
        (item.val && String(item.val).toLowerCase().includes(searchVal));

      if (!matchesSearch) return false;

      if (isOperations) {
        if (teacherFilter !== 'All' && item.teacher !== teacherFilter) return false;
        if (yearFilter !== 'All' && item.year !== yearFilter) return false;
      }
      
      if (isTagme3at && statusFilter !== 'All') {
        if (statusFilter === 'Done' && !item.done) return false;
        if (statusFilter === 'Pending' && item.done) return false;
      }

      if (isStage && stageWeekFilter !== 'All') {
        if (String(item.week).trim() !== stageWeekFilter) return false;
      }

      for (const key in colFilters) {
        const val = colFilters[key];
        if (val && val !== 'All') {
          if (String(item[key]) !== val) return false;
        }
      }

      return true;
    });
  }, [combinedData, searchQuery, statusFilter, teacherFilter, yearFilter, colFilters, isOperations, isTagme3at]);

  // Column Filter Component
  const ColFilter = ({ colKey, label }: { colKey: string, label: string }) => {
    const options = useMemo(() => {
      const set = new Set(liveData.map(i => String(i[colKey] || '')).filter(v => v !== 'false' && v !== 'true'));
      return Array.from(set).sort();
    }, [liveData, colKey]);

    return (
      <div className="flex flex-col items-center justify-center gap-1.5 my-1">
        <span className="text-xs font-black uppercase tracking-wider text-white/80">{label}</span>
        {options.length > 0 && options.length < 50 && (
          <select
            onChange={(e) => setColFilters(p => ({ ...p, [colKey]: e.target.value }))}
            value={colFilters[colKey] || 'All'}
            className="bg-white/10 border border-white/20 rounded-xl px-2.5 py-1 text-[10px] font-bold text-white outline-none max-w-[140px] cursor-pointer hover:bg-white/20 transition-all shadow-lg focus:ring-2 focus:ring-primary/50"
          >
            <option value="All">All {label}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>
    );
  };

  // Table headers per tab type
  const renderHeaders = () => {
    if (isOperations) return (
      <>
        <th className="px-8 py-4 text-right th-style"><ColFilter colKey="name" label="Operation Detail" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="teacher" label="Teacher" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="term" label="Term" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="smartboard" label="Smartboard" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="date" label="Date" /></th>
        <th className="px-4 py-4 text-center th-style text-purple-400 font-bold">يوتيوب فردي</th>
        <th className="px-4 py-4 text-center th-style text-purple-400 font-bold">
          <div className="flex items-center justify-center gap-1.5">
            <span>دمج 🔗</span>
            {selectedForMerge.length > 0 && (
              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{selectedForMerge.length}</span>
            )}
          </div>
        </th>
      </>
    );
    if (isTagme3at) return (
      <>
        <th className="px-8 py-4 text-right th-style">Task</th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="opSheet" label="Sheet" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="branch" label="Branch" /></th>
        <th className="px-3 py-4 text-center th-style">Marketing Notes</th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="editor" label="Editor" /></th>
        <th className="px-3 py-4 text-center th-style">Status</th>
        <th className="px-3 py-4 text-center th-style">Editor Notes</th>
        <th className="px-8 py-4 text-center th-style text-purple-400 font-bold">Priority</th>
      </>
    );
    // Stage tabs
    return (
      <>
        <th className="px-4 py-4 text-center th-style w-28"><ColFilter colKey="week" label="الأسبوع" /></th>
        <th className="px-4 py-4 text-center th-style w-32"><ColFilter colKey="date" label="التاريخ" /></th>
        <th className="px-8 py-4 text-right th-style">اسم الدرس / OP NAME</th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="subject" label="المادة" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="branch" label="الفرع" /></th>
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="opSheet" label="OP Sheet" /></th>
        <th className="px-6 py-4 text-center th-style">تجميعه ✓</th>
        <th className="px-6 py-4 text-center th-style">اتسلمت ✓</th>
      </>
    );
  };

  const colSpan = isOperations ? 7 : isTagme3at ? 8 : 7;

  return (
    <div className="flex min-h-screen bg-[#05070a] text-foreground selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 p-8 flex flex-col gap-12 glass-panel shrink-0 z-20 sticky top-0 h-screen">
        <div className="flex items-center gap-4 px-2">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/40 relative group">
            <LayoutDashboard className="text-white group-hover:rotate-12 transition-transform duration-500" size={28} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-tight">Marketing <span className="text-primary">&</span></h1>
            <h1 className="font-black text-lg tracking-tight leading-tight">Video Editors</h1>
            <p className="text-[9px] text-muted mt-1.5 uppercase tracking-[0.4em] font-black opacity-40">Operations Hub</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <div className="flex items-center justify-between px-4 py-2.5 mb-6 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">🎨 Colorful UI</span>
            <button
              onClick={() => setColorfulTabs(!colorfulTabs)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer ${colorfulTabs ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${colorfulTabs ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          {stages.map((stage) => (
            <SidebarItem
              key={stage.gid}
              icon={stage.icon}
              label={stage.label}
              colorHex={stage.colorHex}
              colorful={colorfulTabs}
              active={activeGid === stage.gid}
              onClick={() => {
                setActiveGid(stage.gid);
                setActiveLabel(stage.label);
                setStatusFilter('All');
                setTeacherFilter('All');
                setYearFilter('All');
                setStageWeekFilter('All');
                setColFilters({});
                setSearchQuery('');
              }}
            />
          ))}
        </nav>

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
            <p className="text-[10px] text-muted opacity-40 uppercase tracking-widest font-bold">
              {loading ? 'Syncing...' : `${filteredData.length} record${filteredData.length !== 1 ? 's' : ''} loaded`}
            </p>
          </motion.div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                 onClick={() => setShowNotifications(!showNotifications)}
                 className="relative p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <Bell size={20} className="text-muted hover:text-white transition-colors" />
                {newItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse">
                    {newItems.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0a0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[400px]">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <span className="font-bold text-sm">Notifications ({newItems.length})</span>
                    {newItems.length > 0 && (
                       <button onClick={() => { setNewItems([]); localStorage.removeItem(`new_items_${activeGid}`); }} className="text-[10px] text-muted hover:text-white transition-colors">Clear All</button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {newItems.length === 0 ? (
                      <div className="p-8 text-center text-muted text-xs">No new updates</div>
                    ) : (
                      <div className="flex flex-col">
                        {newItems.map((item, i) => (
                          <div 
                            key={i} 
                            onClick={() => handleNotificationClick(item)}
                            className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex flex-col gap-1.5"
                          >
                            <span className="text-xs font-bold text-white line-clamp-2 arabic-text whitespace-pre-wrap">{item.name}</span>
                            <span className="text-[10px] text-primary">{item.id || item.val || item.teacher || 'New entry added'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => refresh()} className="btn-glass px-7 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span>Synchronize</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary px-8 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={20} />
              <span>Add entry</span>
            </button>
          </div>
        </header>

        {/* Add Entry Glass Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0b1019] border border-white/10 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white arabic-text">إضافة درس / عملية جديدة</h3>
                      <p className="text-xs text-muted">سيتم إضافته فورياً إلى شيت [{activeLabel}]</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-white p-2 transition-colors cursor-pointer">
                    <XCircle size={22} />
                  </button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">اسم الدرس / العملية *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: الوحدة الرابعة - مراجعة عامة..."
                      value={addForm.name}
                      onChange={e => setAddForm({...addForm, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-bold arabic-text text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">التاريخ / المعرف</label>
                      <input
                        type="text"
                        placeholder="مثال: 4/25/2026"
                        value={addForm.id}
                        onChange={e => setAddForm({...addForm, id: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">المادة / التصنيف</label>
                      <input
                        type="text"
                        placeholder="مثال: لغة عربية"
                        value={addForm.subject}
                        onChange={e => setAddForm({...addForm, subject: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-bold arabic-text text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">الفرع / النطاق</label>
                      <input
                        type="text"
                        placeholder="مثال: القاهرة"
                        value={addForm.extra}
                        onChange={e => setAddForm({...addForm, extra: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-bold arabic-text text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">المحرر / المدرس</label>
                      <input
                        type="text"
                        placeholder="اسم المونتير أو المدرس"
                        value={addForm.editor}
                        onChange={e => setAddForm({...addForm, editor: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-bold arabic-text text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5 arabic-text">كود العملية (OP NAME) / تفاصيل إضافية</label>
                    <input
                      type="text"
                      placeholder="J4-T2-U3-..."
                      value={addForm.filingName}
                      onChange={e => setAddForm({...addForm, filingName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono text-xs text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors font-bold arabic-text text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold arabic-text text-xs shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <span>حفظ وإضافة 🚀</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
              {isOperations && (
                <>
                  <div className="flex items-center gap-2 px-4 border-r border-white/10 group">
                    <User size={16} className="text-muted group-hover:text-primary transition-colors" />
                    <select
                      value={teacherFilter}
                      onChange={(e) => setTeacherFilter(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted focus:ring-0 cursor-pointer hover:text-foreground transition-colors max-w-[120px]"
                    >
                      <option value="All">All Teachers</option>
                      {teachers.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-4 border-r border-white/10 mr-2 group">
                    <Clock size={16} className="text-muted group-hover:text-primary transition-colors" />
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-muted focus:ring-0 cursor-pointer hover:text-foreground transition-colors max-w-[120px]"
                    >
                      <option value="All">All Years</option>
                      {years.map((y: string) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              {isTagme3at && ['All', 'Pending', 'Done'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted hover:bg-white/5 hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
              {!isTagme3at && !isOperations && (
                <span className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted opacity-40">{activeLabel}</span>
              )}
            </div>
          </div>

          {/* Week Filter Pills Bar (For Stage Sheets) */}
          {isStage && availableWeeks.length > 0 && (
            <div className="flex flex-wrap gap-2.5 items-center bg-white/[0.02] border border-white/[0.05] p-3.5 rounded-2xl animate-fadeIn shadow-lg" dir="rtl">
              <span className="text-xs font-black text-muted ml-2">📌 تصفية بالأسبوع:</span>
              <button
                onClick={() => setStageWeekFilter('All')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  stageWeekFilter === 'All'
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50 font-black'
                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
                }`}
              >
                كل الأسابيع ({combinedData.length})
              </button>
              {availableWeeks.map((w) => (
                <button
                  key={w}
                  onClick={() => setStageWeekFilter(w)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    stageWeekFilter === w
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50 font-black'
                      : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${w.includes('1') ? 'bg-emerald-400' : w.includes('2') ? 'bg-cyan-400' : w.includes('3') ? 'bg-amber-400' : w.includes('4') ? 'bg-purple-400' : 'bg-rose-400'}`} />
                  <span>{w}</span>
                </button>
              ))}
            </div>
          )}

          {/* Main Content View (Table vs Analytics) */}
          {isAnalyticsTagme ? (
            <TagmeAnalyticsDashboard liveData={liveData} tagmeTransfers={tagmeTransfers} loading={loading} />
          ) : (
            <div className="table-container">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/[0.05]">
                      {renderHeaders()}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={colSpan} className="py-40 text-center">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Syncing {activeLabel}...</p>
                          </td>
                        </motion.tr>
                    ) : isOperations && teacherFilter === 'All' ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={colSpan} className="py-12">
                          <div className="text-center mb-10">
                            <h3 className="text-2xl font-black arabic-text mb-2">اختر المدرس</h3>
                            <p className="text-sm text-muted">يرجى اختيار المدرس لعرض العمليات الخاصة به</p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-8">
                            {teachers.map((teacher: string, idx: number) => (
                              <motion.button
                                key={teacher}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => setTeacherFilter(teacher)}
                                className="bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-300 rounded-2xl p-6 text-center group"
                              >
                                <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                                  <User size={24} className="text-muted group-hover:text-primary" />
                                </div>
                                <span className="font-bold arabic-text text-lg block truncate">{teacher}</span>
                                <span className="text-[10px] text-muted uppercase tracking-widest mt-2 block opacity-50 group-hover:opacity-100">
                                  {liveData.filter((i: any) => i.teacher === teacher).length} Records
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    ) : filteredData.length > 0 ? filteredData.slice(0, 200).map((item: any, idx: number) => {
                      if (isOperations) {
                        const isSelected = selectedForMerge.some(i => generateKey(i) === generateKey(item));
                        return (
                          <OperationsRow
                            key={idx}
                            item={item}
                            index={idx}
                            youtubeItems={youtubeItems}
                            onYoutubeToggle={handleYoutubeToggle}
                            isSelectedForMerge={isSelected}
                            onToggleMergeSelect={handleToggleMergeSelect}
                          />
                        );
                      }
                      if (isTagme3at) return <TagmeRow key={idx} item={item} index={idx} />;
                      return <StageRow key={idx} item={item} index={idx} tagmeTransfers={tagmeTransfers} onTagmeToggle={handleTagmeToggle} activeLabel={activeLabel} />;
                    }) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={colSpan} className="py-40 text-center opacity-30">
                          <AlertCircle size={48} className="mx-auto mb-6 stroke-1" />
                          <p className="text-xs font-black uppercase tracking-[0.3em]">No Records Found</p>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                  {filteredData.length > 200 && !(isOperations && teacherFilter === 'All') && (
                    <tr>
                      <td colSpan={colSpan} className="py-8 text-center">
                        <p className="text-xs text-muted font-bold uppercase tracking-widest">
                          Showing 200 of {filteredData.length} records. Please use search or filters to find specific entries.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        {/* Floating Bottom Toast & Merge Banners */}
        <AnimatePresence>
          {isOperations && selectedForMerge.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#0d121c]/95 border-2 border-purple-500/50 backdrop-blur-2xl px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.6)] flex items-center gap-8 text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-xl animate-pulse shrink-0">
                  {selectedForMerge.length}
                </div>
                <div className="flex flex-col text-right" dir="rtl">
                  <span className="text-base font-bold text-white arabic-text">تم تحديد عدة دروس لدمجها معاً في يوتيوب 🔗</span>
                  <span className="text-xs text-purple-300 arabic-text line-clamp-1 mt-0.5">{selectedForMerge.map(i => i.name).join(' + ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExecuteMerge}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold arabic-text rounded-2xl shadow-lg shadow-purple-600/40 transition-all scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span>دمج وتحويل للمرحلة 🚀</span>
                </button>
                <button
                  onClick={() => setSelectedForMerge([])}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-muted hover:text-white font-bold arabic-text rounded-2xl transition-all cursor-pointer text-xs"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          )}

          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] bg-gradient-to-r from-[#1b0f24] via-[#2d123e] to-[#1b0f24] border-2 border-purple-500/50 px-8 py-5 rounded-2xl shadow-[0_0_50px_rgba(147,51,234,0.5)] flex items-center gap-8 max-w-2xl w-full justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse shrink-0">
                  <MonitorPlay size={32} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white arabic-text">تم تحويل الدرس إلى [{activeToast.stage.label}] بنجاح! 🚀</span>
                  <span className="text-xs text-purple-300 arabic-text line-clamp-1 mt-0.5">{activeToast.item.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigateToYoutubeTransfer(activeToast)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-600/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <span>الانتقال للصف</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-muted hover:text-white p-2 transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTagmeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[150] bg-gradient-to-r from-[#061e14] via-[#092e1e] to-[#061e14] border-2 border-emerald-500/50 px-8 py-5 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center gap-8 max-w-2xl w-full justify-between text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse shrink-0">
                  <CheckCircle2 size={32} />
                </div>
                <div className="flex flex-col text-right" dir="rtl">
                  <span className="text-sm font-bold text-white arabic-text">تم تحويل الدرس إلى [شيت التجميعات] بنجاح! 🚀</span>
                  <span className="text-xs text-emerald-300 arabic-text line-clamp-1 mt-0.5">{activeTagmeToast.item.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigateToTagmeTransfer(activeTagmeToast)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <span>الانتقال للتجميعات</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setActiveTagmeToast(null)}
                  className="text-muted hover:text-white p-2 transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
