import { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  Clock,
  BarChart3,
  Briefcase,
  User,
  Bell,
  MonitorPlay,
  PieChart,
  TrendingUp,
  Award,
  Users,
  Undo2,
  Redo2,
  Copy,
  Pencil,
  Link,
  LogOut,
  Shield,
  Settings,
  MapPin
} from 'lucide-react';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { UserManagement } from './components/UserManagement';
import { supabase, PERMISSIONS, ROLE_LABELS, ROLE_COLORS, DEFAULT_ROLE_PERMISSIONS, setRuntimeRolePermissions } from './lib/supabase';


const generateKey = (item: any) => {
  let hash = 0;
  const str = String(item?.name || '') + String(item?.id || '') + String(item?.val || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  return 'row-' + Math.abs(hash);
};

const HistoryInput = ({ itemKey, fieldKey, value, onChange, placeholder }: any) => {
  const historyKey = `hist_${fieldKey}_${itemKey}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(historyKey);
    return saved ? JSON.parse(saved) : (value ? [value] : []);
  });
  
  const [currentIndex, setCurrentIndex] = useState(history.length > 0 ? history.length - 1 : -1);
  const [localValue, setLocalValue] = useState(value);

  // Sync external value if it changes independently
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localValue]);

  const commitValue = (newVal: string) => {
    if (newVal !== history[currentIndex] && newVal !== history[history.length - 1]) {
      const newHistory = [...history.slice(0, currentIndex + 1), newVal].slice(-20);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
      onChange(newVal);
    } else if (newVal !== value) {
      onChange(newVal);
    }
  };

  const handleBlur = () => {
    commitValue(localValue);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  };

  const undo = () => {
    if (currentIndex > 0) {
      const prevVal = history[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      setLocalValue(prevVal);
      onChange(prevVal);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      const nextVal = history[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setLocalValue(nextVal);
      onChange(nextVal);
    }
  };

  const hasValue = !!localValue;

  return (
    <div className="relative flex items-center justify-center group mx-auto w-full min-w-[130px] max-w-[160px]">
      {history.length > 1 && (
        <button 
          onClick={undo} 
          disabled={currentIndex <= 0}
          className={`absolute -left-6 p-1.5 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 ${currentIndex <= 0 ? 'text-white/20' : 'text-blue-400 hover:bg-blue-500/20 hover:scale-110 shadow-lg'}`}
          title="تراجع (السابق)"
        >
          <Undo2 size={12} />
        </button>
      )}
      
      <textarea
        ref={textareaRef}
        rows={1}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full min-w-[130px] resize-none overflow-hidden rounded-xl px-3 py-2 text-xs font-bold text-white text-center outline-none transition-all shadow-inner text-[11px] placeholder:text-[10px] placeholder:text-muted/60 ${
          hasValue 
            ? 'bg-emerald-500/5 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] text-emerald-300' 
            : 'bg-white/5 border border-white/10 hover:border-white/20'
        } focus:bg-[#0b1019] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30`}
        style={{ minHeight: '34px', lineHeight: '1.3' }}
      />

      {history.length > 1 && (
        <button 
          onClick={redo} 
          disabled={currentIndex >= history.length - 1}
          className={`absolute -right-6 p-1.5 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 ${currentIndex >= history.length - 1 ? 'text-white/20' : 'text-emerald-400 hover:bg-emerald-500/20 hover:scale-110 shadow-lg'}`}
          title="تقدم (التالي)"
        >
          <Redo2 size={12} />
        </button>
      )}
    </div>
  );
};

const CustomSelect = ({ value, onChange, options, placeholder, isColumn = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer transition-all ${isColumn ? 'bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-1.5 min-w-[100px] justify-between shadow-lg text-white/90' : 'bg-transparent border-none text-muted hover:text-white px-1'}`}
      >
        <span className="truncate max-w-[100px]">{value === 'All' ? placeholder : value}</span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 bg-[#0a0e16]/95 border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 z-[250] scrollbar-hide backdrop-blur-xl w-max min-w-[130px] max-w-[200px] max-h-48 overflow-y-auto animate-fadeIn ${isColumn ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}
          >
            <button
              onClick={() => { onChange('All'); setIsOpen(false); }}
              className={`w-full text-right px-4 py-2 text-[10px] font-bold block transition-all text-muted hover:bg-white/5 hover:text-white ${value === 'All' ? 'text-primary bg-primary/5' : ''}`}
            >
              الكل
            </button>
            {options.map((o: string) => (
              <button
                key={o}
                onClick={() => { onChange(o); setIsOpen(false); }}
                className={`w-full text-right px-4 py-2 text-[10px] font-bold block transition-all arabic-text truncate ${value === o ? 'text-primary bg-primary/5 font-black border-r-2 border-primary' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                {o}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  if (v.includes('POSTPONED')) return { bg: 'bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]', text: 'text-yellow-400 font-extrabold uppercase', border: 'border-yellow-500/40 animate-pulse' };
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

const formatDuration = (val: string | number) => {
  const str = String(val || '').trim();
  if (!str) return '';
  if (str.includes(':')) return str;
  const totalMinutes = parseFloat(str);
  if (isNaN(totalMinutes) || totalMinutes <= 0) return str;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const secs = Math.round((totalMinutes % 1) * 60);
  const formattedHrs = hrs > 0 ? `${hrs}:` : '';
  const formattedMins = String(mins).padStart(hrs > 0 ? 2 : 1, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  return `${formattedHrs}${formattedMins}:${formattedSecs}`;
};

const VideoDuration = ({ url, fallback }: { url: string; fallback: string }) => {
  const [duration, setDuration] = useState(fallback);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;
    fetch(`http://localhost:3001/api/duration?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.duration) {
          setDuration(data.duration);
        }
      })
      .catch(err => console.error('Error fetching duration:', err));

    return () => {
      isMounted = false;
    };
  }, [url, fallback]);

  return <span className="whitespace-nowrap">⏱️ {duration}</span>;
};

// ─── Operations Row ───────────────────────────────────────────────────────────
const OperationsRow = ({ item, index, youtubeItems, onYoutubeToggle, isSelectedForMerge, onToggleMergeSelect, isGlowing, onOpenBunnyLinkModal }: any) => {
  const { profile } = useAuth();
  const stage = getTargetStageGid(item);
  const itemKey = generateKey(item);
  const isYoutubeChecked = (youtubeItems?.[stage.gid] || []).some((i: any) => 
    i.uniqueKey === ('yt-' + itemKey) || (i.mergedItemKeys && i.mergedItemKeys.includes(itemKey))
  );

  const finalM = (item.finalMinutes && String(item.finalMinutes).trim() !== '0') ? item.finalMinutes : item.rawMinutes;
  const duration = item.exactDuration || formatDuration(finalM);

  const isPostponed = Object.values(item).some(
    val => typeof val === 'string' && val.toUpperCase().includes('POSTPONED')
  );

  return (
    <motion.tr
      id={itemKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.01 }}
      className={`transition-all duration-500 border-b border-white/[0.03] row-hover ${
        isGlowing 
          ? 'bg-emerald-500/20 shadow-[inset_0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/50 border-emerald-500/50 animate-pulse relative z-10' 
          : isPostponed
            ? 'bg-yellow-500/10 shadow-[inset_0_0_25px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/30 border-yellow-500/30'
            : isYoutubeChecked 
              ? 'bg-purple-600/[0.08]' 
              : isSelectedForMerge 
                ? 'bg-purple-500/[0.04]' 
                : ''
      }`}
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
      <td className="px-3 py-5 text-center">
        {item.linkBunny ? (
          <a
            href={item.linkBunny}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all inline-block shadow-sm cursor-pointer"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-black text-purple-400 leading-none">{item.date || 'فيديو'}</span>
              {duration && (
                <span className="text-[11px] font-black text-purple-300 leading-none mt-1.5 whitespace-nowrap">
                  <VideoDuration url={item.linkBunny} fallback={duration} />
                </span>
              )}
            </div>
          </a>
        ) : (
          <button
            onClick={() => {
              if (profile?.role && PERMISSIONS.canEditBunnyLinks(profile.role)) {
                onOpenBunnyLinkModal(item.uniqueKey || generateKey(item), item.name, item.linkBunny || '');
              }
            }}
            className={`px-3.5 py-2 rounded-xl transition-all inline-block shadow-sm text-center ${profile?.role && PERMISSIONS.canEditBunnyLinks(profile.role) ? 'bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 active:scale-95 cursor-pointer' : 'bg-white/5 border border-white/10 text-muted opacity-50 cursor-not-allowed'}`}
            title="اضغط لإضافة رابط فيديو Bunny"
            disabled={!(profile?.role && PERMISSIONS.canEditBunnyLinks(profile.role))}
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-black text-purple-400 leading-none">{item.date || '---'}</span>
              {duration && (
                <span className="text-[11px] font-black text-purple-300 leading-none mt-1.5 whitespace-nowrap">
                  ⏱️ {duration}
                </span>
              )}
            </div>
          </button>
        )}
      </td>
      <td className="px-4 py-5 text-center">
        <button
          onClick={() => onYoutubeToggle(item, !isYoutubeChecked)}
          disabled={!(profile?.role && PERMISSIONS.canAddEntry(profile.role))}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 ${
            isYoutubeChecked 
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110 ring-2 ring-purple-400' 
              : 'bg-white/5 text-muted'
          } ${profile?.role && PERMISSIONS.canAddEntry(profile.role) ? 'cursor-pointer hover:bg-purple-500/20 hover:text-purple-400' : 'opacity-50 cursor-not-allowed'}`}
        >
          <MonitorPlay size={22} className={isYoutubeChecked ? 'animate-pulse' : ''} />
        </button>
      </td>
      <td className="px-4 py-5 text-center">
        <input
          type="checkbox"
          checked={isSelectedForMerge}
          onChange={() => onToggleMergeSelect(item)}
          disabled={!(profile?.role && PERMISSIONS.canAddEntry(profile.role))}
          className={`w-5 h-5 accent-purple-600 rounded transition-transform ${profile?.role && PERMISSIONS.canAddEntry(profile.role) ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
          title="تحديد لإضافتها لتجميعة يوتيوب"
        />
      </td>
    </motion.tr>
  );
};

// ─── Tagme3at Row ─────────────────────────────────────────────────────────────
const TagmeRow = ({ item, index, onUpdateEditor, editorsList, onUpdateEditorNotes, onUpdateMarketingNotes, opSheetsList, branchesList, onUpdateOpSheet, onUpdateBranch, onUpdateDate, isGlowing, liveData, canRaisePriority, priorityLimit, onStatusChange, isSubscribed, onToggleSubscribe, priorityOverride, statusOverride }: any) => {
  const { profile } = useAuth();
  const [done, setDone] = useState(item.done);
  const [cancel, setCancel] = useState(false);
  const [priority, setPriority] = useState(item.priority);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (priorityOverride !== undefined) setPriority(priorityOverride);
  }, [priorityOverride]);

  useEffect(() => {
    if (statusOverride !== undefined) {
       setDone(statusOverride.done);
       setCancel(statusOverride.cancel);
    }
  }, [statusOverride]);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.name || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toInputDate = (dStr: string) => {
    if (!dStr || dStr === '---') return '';
    const parts = dStr.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const fromInputDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10).toString();
      const day = parseInt(parts[2], 10).toString();
      return `${month}/${day}/${year}`;
    }
    return '';
  };

  const originalKey = item.uniqueKey ? String(item.uniqueKey).replace('tgm-', '') : '';
  const matchedItem = liveData?.find((i: any) => (i.uniqueKey || generateKey(i)) === originalKey);
  const date = item.date || matchedItem?.date || '---';

  return (
    <motion.tr
      id={item.uniqueKey || generateKey(item)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`transition-all duration-500 border-b border-white/[0.03] row-hover ${
        isGlowing 
          ? 'bg-emerald-500/20 shadow-[inset_0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/50 border-emerald-500/50 animate-pulse relative z-10' 
          : done 
            ? 'bg-emerald-500/[0.03]' 
            : priority 
              ? 'bg-purple-600/[0.05]' 
              : cancel 
                ? 'bg-rose-500/[0.03]' 
                : ''
      }`}
    >
      <td className="px-8 py-6" dir="rtl">
        <div className="flex items-center justify-end gap-4 min-w-[280px] text-right">
          <div className="flex flex-col text-right">
            <span className="text-base font-bold arabic-text mb-1 whitespace-pre-wrap leading-relaxed tracking-wide text-white/95">{item.name}</span>
            {item.filingName && item.filingName !== item.name && (
              <span className="text-[10px] text-muted font-black opacity-40 uppercase tracking-[0.15em]">{item.filingName}</span>
            )}
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className={`w-2.5 h-12 rounded-full transition-all duration-500 ${
              done 
                ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
                : priority 
                ? 'bg-purple-600 shadow-[0_0_16px_rgba(147,51,234,0.9)] animate-pulse' 
                : cancel 
                ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                : 'bg-white/15'
            }`} />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className={`transition-all duration-300 cursor-pointer p-0.5 ${copied ? 'text-emerald-400 opacity-100 scale-110' : 'text-white opacity-10 hover:opacity-80'}`}
                title="نسخ المسارات"
              >
                {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              </button>
              <button 
                onClick={onToggleSubscribe}
                className={`transition-all duration-300 cursor-pointer p-0.5 ${
                  isSubscribed 
                    ? 'text-rose-500 opacity-100 scale-115' 
                    : 'text-white/20 hover:text-white/60'
                }`}
                title={isSubscribed ? 'إلغاء المتابعة' : 'متابعة هذه التجميعة'}
              >
                <Bell size={12} />
              </button>
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-6 text-center">
        <select
          value={item.opSheet || ''}
          onChange={(e) => onUpdateOpSheet(item.uniqueKey || generateKey(item), e.target.value)}
          disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
          className={`bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none transition-all shadow-lg focus:ring-2 focus:ring-emerald-500/50 min-w-[90px] ${profile?.role && PERMISSIONS.canEditEditors(profile.role) ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-50'}`}
        >
          <option value="" className="bg-[#0b1019] text-muted">غير محدد</option>
          {opSheetsList?.map((sheet: string) => (
            <option key={sheet} value={sheet} className="bg-[#0b1019] text-white font-bold">{sheet}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-6 text-center">
        <input
          type="date"
          value={toInputDate(date)}
          onChange={(e) => {
            const newDate = fromInputDate(e.target.value);
            onUpdateDate(item.uniqueKey || generateKey(item), newDate);
          }}
          style={{ colorScheme: 'dark' }}
          disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
          className={`bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-xl px-2 py-1 text-xs font-bold text-white text-center outline-none focus:bg-[#0b1019] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner font-mono max-w-[125px] ${profile?.role && PERMISSIONS.canEditEditors(profile.role) ? '' : 'cursor-not-allowed opacity-50'}`}
        />
      </td>
      <td className="px-3 py-6 text-center">
        <select
          value={item.branch || ''}
          onChange={(e) => onUpdateBranch(item.uniqueKey || generateKey(item), e.target.value)}
          disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
          className={`bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none transition-all shadow-lg focus:ring-2 focus:ring-emerald-500/50 min-w-[90px] ${profile?.role && PERMISSIONS.canEditEditors(profile.role) ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-50'}`}
        >
          <option value="" className="bg-[#0b1019] text-muted">غير محدد</option>
          {branchesList?.map((branch: string) => (
            <option key={branch} value={branch} className="bg-[#0b1019] text-white font-bold">{branch}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-6 text-center">
        <HistoryInput
          itemKey={item.uniqueKey || generateKey(item)}
          fieldKey="mktg_notes"
          value={item.notesMarketing || ''}
          onChange={(val: string) => onUpdateMarketingNotes(item.uniqueKey || generateKey(item), val)}
          placeholder="أضف ملاحظة..."
          disabled={!(profile?.role && PERMISSIONS.canEditNotes(profile.role))}
        />
      </td>
      <td className="px-3 py-6 text-center">
        <select
          value={item.editor || 'غير محدد'}
          onChange={(e) => onUpdateEditor(item.uniqueKey || generateKey(item), e.target.value)}
          disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
          className={`bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none transition-all shadow-lg focus:ring-2 focus:ring-emerald-500/50 ${profile?.role && PERMISSIONS.canEditEditors(profile.role) ? 'cursor-pointer hover:bg-white/10' : 'cursor-not-allowed opacity-50'}`}
        >
          <option value="غير محدد" className="bg-[#0b1019] text-muted">غير محدد</option>
          {editorsList.map((editor: string) => (
            <option key={editor} value={editor} className="bg-[#0b1019] text-white font-bold">{editor}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-6 text-center">
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              const newDone = !done;
              setDone(newDone);
              if (newDone) { setCancel(false); }
              const editor = item.editor;
              if (editor && editor !== 'غير محدد' && onStatusChange) {
                onStatusChange(item.uniqueKey || generateKey(item), item.name, editor, newDone ? 'done' : 'undone');
              }
            }}
            disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'bg-white/5 text-muted hover:bg-emerald-500/10 hover:text-emerald-400'} ${!(profile?.role && PERMISSIONS.canEditEditors(profile.role)) && 'opacity-50 cursor-not-allowed'}`}
          >
            <CheckCircle2 size={20} />
          </button>
          <button
            onClick={() => {
              const newCancel = !cancel;
              setCancel(newCancel);
              if (newCancel) { setDone(false); }
              const editor = item.editor;
              if (editor && editor !== 'غير محدد' && onStatusChange) {
                onStatusChange(item.uniqueKey || generateKey(item), item.name, editor, newCancel ? 'cancel' : 'uncancel');
              }
            }}
            disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role))}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${cancel ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' : 'bg-white/5 text-muted hover:bg-rose-500/10 hover:text-rose-400'} ${!(profile?.role && PERMISSIONS.canEditEditors(profile.role)) && 'opacity-50 cursor-not-allowed'}`}
          >
            <XCircle size={20} />
          </button>
        </div>
      </td>
      <td className="px-3 py-6 text-center">
        <HistoryInput
          itemKey={item.uniqueKey || generateKey(item)}
          fieldKey="editor_notes"
          value={item.notesEditors || ''}
          onChange={(val: string) => onUpdateEditorNotes(item.uniqueKey || generateKey(item), val)}
          placeholder="اكتب ملاحظة..."
          disabled={!(profile?.role && PERMISSIONS.canEditNotes(profile.role))}
        />
      </td>
      <td className="px-6 py-6 text-center">
          <button
            onClick={() => {
              const newPriority = !priority;
              setPriority(newPriority);
              const editor = item.editor;
              if (onStatusChange) {
                onStatusChange(item.uniqueKey || generateKey(item), item.name, editor || 'غير محدد', newPriority ? 'priority' : 'unpriority');
              }
            }}
            disabled={!(profile?.role && PERMISSIONS.canEditEditors(profile.role)) || (!priority && !canRaisePriority)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 ${
              priority 
                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] ring-2 ring-purple-400 scale-110 animate-pulse' 
                : 'bg-white/5 text-muted hover:bg-purple-500/20 hover:text-purple-400'
            } ${!(profile?.role && PERMISSIONS.canEditEditors(profile.role)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={!priority && !canRaisePriority ? `تم الوصول للحد اليومي (${priorityLimit})` : 'Priority'}
          >
            <AlertCircle size={20} />
          </button>
      </td>
    </motion.tr>
  );
};

// ─── Stage Row (Junior/Middle/Senior) ─────────────────────────────────────────
const StageRow = ({ item, index, tagmeTransfers, onTagmeToggle, activeLabel, isGlowing }: any) => {
  const { profile } = useAuth();
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
      className={`transition-all duration-300 border-b border-white/[0.03] row-hover ${
        isGlowing 
          ? 'bg-emerald-500/20 shadow-[inset_0_0_25px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/50 border-emerald-500/50 animate-pulse relative z-10' 
          : isTagmeChecked 
            ? 'bg-emerald-500/[0.08]' 
            : ''
      }`}
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
      <td className="px-3 py-5 text-center"><Chip value={item.isYoutubeTransfer ? 'العمليات' : (item.opSheet || item.val)} /></td>
      <td className="px-6 py-5 text-center">
        <button
          onClick={() => onTagmeToggle(item, activeLabel, !isTagmeChecked)}
          disabled={!(profile?.role && PERMISSIONS.canAddEntry(profile.role))}
          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-300 ${isTagmeChecked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400 scale-110' : 'bg-white/5 text-muted hover:bg-emerald-500/10 hover:text-emerald-400'} ${!(profile?.role && PERMISSIONS.canAddEntry(profile.role)) && 'opacity-50 cursor-not-allowed'}`}
        >
          <CheckCircle2 size={18} />
        </button>
      </td>
      <td className="px-6 py-5 text-center">
        <button
          onClick={() => setReceived(!received)}
          disabled={!(profile?.role && PERMISSIONS.canAddEntry(profile.role))}
          className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-300 ${received ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-muted hover:bg-blue-500/10 hover:text-blue-400'} ${!(profile?.role && PERMISSIONS.canAddEntry(profile.role)) && 'opacity-50 cursor-not-allowed'}`}
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
    const completed = combined.filter(i => {
      const key = i.uniqueKey || generateKey(i);
      if (taskStatuses && taskStatuses[key] !== undefined) return taskStatuses[key].done;
      return String(i.done) === 'true' || i.done === true;
    }).length;
    const pending = total - completed;
    const priority = combined.filter(i => {
      const key = i.uniqueKey || generateKey(i);
      if (taskPriorities && taskPriorities[key] !== undefined) return taskPriorities[key];
      return String(i.priority) === 'true' || i.priority === true;
    }).length;
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

    // Branch breakdown
    const branchMap: Record<string, { count: number, completed: number }> = {};
    combined.forEach(i => {
      const branch = (i.branch || 'غير محدد').trim();
      if (!branchMap[branch]) branchMap[branch] = { count: 0, completed: 0 };
      branchMap[branch].count++;
      if (String(i.done) === 'true' || i.done === true) branchMap[branch].completed++;
    });

    return { 
      total, 
      completed, 
      pending, 
      priority, 
      transfersCount, 
      stageMap: Object.entries(stageMap).sort((a,b) => b[1].count - a[1].count), 
      editorMap: Object.entries(editorMap).sort((a,b) => b[1].count - a[1].count),
      branchMap: Object.entries(branchMap).sort((a,b) => b[1].count - a[1].count)
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    <span className="text-white">{completed} / {count} تجميعة كاملة</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-l from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(completed/count)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <h3 className="text-xl font-black text-white arabic-text">توزيع التجميعات حسب الفروع</h3>
            </div>
            <span className="text-xs text-muted font-bold">{stats.branchMap.length} فروع نشطة</span>
          </div>
          <div className="space-y-5 max-h-[360px] overflow-y-auto pr-2">
            {stats.branchMap.map(([branch, { count, completed }]) => (
              <div key={branch} className="space-y-2">
                <div className="flex justify-between text-sm arabic-text font-bold">
                  <span className="text-white/90">{branch}</span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-blue-400">{completed} مكتمل</span>
                    <span className="text-muted">/</span>
                    <span className="text-white">{count} إجمالي</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden p-0.5 flex">
                  <div className="bg-gradient-to-l from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${(completed/count)*100}%` }} />
                  <div className="bg-white/15 h-full transition-all duration-1000 rounded-full" style={{ width: `${((count-completed)/count)*100}%` }} />
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
function App() {
  const { profile, signOut, session } = useAuth();
  const [rolePermissions, setRolePermissions] = useState<any>(DEFAULT_ROLE_PERMISSIONS);
  const [activeGid, setActiveGid] = useState('1476192399');
  const [activeLabel, setActiveLabel] = useState('Operations');
  const isUsersPage = activeGid === '__users__';

  const isOperations = activeGid === '1476192399';
  const isTagme3at = activeGid === '1535230545';
  const isAnalyticsTagme = activeGid === 'analytics_tagme3at';
  const isStage = !isOperations && !isTagme3at && !isAnalyticsTagme;

  const sheetGidToFetch = isAnalyticsTagme ? '1535230545' : activeGid;
  const { data: liveData, loading, refresh } = useGoogleSheets(sheetGidToFetch);

  const [itemToasts, setItemToasts] = useState<{ id: string, name: string, filingName?: string }[]>([]);

  // Background polling every 45 seconds to fetch changes silently
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        refresh(true); // silent refresh
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [refresh, loading]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const [newItems, setNewItems] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // ─── Personal Notifications via Supabase Realtime Broadcast ───────────────
  type PersonalNotif = { id: string; taskName: string; message: string; type: string; from: string; at: number; read: boolean; };
  const [myNotifs, setMyNotifs] = useState<PersonalNotif[]>([]);
  const [showMyNotifs, setShowMyNotifs] = useState(false);
  const unreadCount = myNotifs.filter(n => !n.read).length;




  const [youtubeItems, setYoutubeItems] = useState<{ [gid: string]: any[] }>({});
  const [bunnyLinkModal, setBunnyLinkModal] = useState<{ isOpen: boolean, itemKey: string, itemName: string, initialUrl: string } | null>(null);
  const [activeToast, setActiveToast] = useState<{ item: any, stage: { gid: string, label: string }, uniqueKey: string } | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<any[]>([]);

  const [tagmeTransfers, setTagmeTransfers] = useState<any[]>([]);
  const [activeTagmeToast, setActiveTagmeToast] = useState<{ item: any, stage: { gid: string, label: string }, uniqueKey: string } | null>(null);

  const [assignedEditors, setAssignedEditors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('assigned_editors');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [editorNotes, setEditorNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('editor_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [marketingNotes, setMarketingNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('marketing_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [assignedOpSheets, setAssignedOpSheets] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('assigned_opsheets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [assignedBranches, setAssignedBranches] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('assigned_branches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [assignedDates, setAssignedDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('assigned_dates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [taskPriorities, setTaskPriorities] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('task_priorities');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [taskStatuses, setTaskStatuses] = useState<Record<string, { done: boolean, cancel: boolean }>>(() => {
    const saved = localStorage.getItem('task_statuses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [assignedBunnyLinks, setAssignedBunnyLinks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('assigned_bunny_links');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const handleUpdateDate = (itemKey: string, val: string) => {
    setAssignedDates(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_dates', updated, itemKey, taskName, 'date', `📅 تم تعديل التاريخ إلى: ${val || 'غير محدد'}`);
      return updated;
    });
  };

  const handleUpdateBunnyLink = (itemKey: string, val: string) => {
    setAssignedBunnyLinks(prev => {
      const updated = { ...prev, [itemKey]: val };
      localStorage.setItem('assigned_bunny_links', JSON.stringify(updated));
      return updated;
    });
  };

  const syncState = async (field: string, dict: any, itemKey: string, taskName: string, type: string, message: string) => {
    localStorage.setItem(field, JSON.stringify(dict));
    if (session?.access_token) {
      fetch('/api/task-metadata', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
         body: JSON.stringify({ field, metadata: dict })
      }).catch(e => console.error(e));
    }

    if (globalChannelRef.current && profile?.name) {
       globalChannelRef.current.send({
          type: 'broadcast',
          event: 'update',
          payload: { itemKey, taskName, message, type, from: profile.name, field, dict }
       });
    }
  };

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/task-metadata', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
      .then(res => res.json())
      .then(data => {
         if (data?.metadata) {
            const m = data.metadata;
            if (m.assigned_editors) { setAssignedEditors(m.assigned_editors); localStorage.setItem('assigned_editors', JSON.stringify(m.assigned_editors)); }
            if (m.editor_notes) { setEditorNotes(m.editor_notes); localStorage.setItem('editor_notes', JSON.stringify(m.editor_notes)); }
            if (m.marketing_notes) { setMarketingNotes(m.marketing_notes); localStorage.setItem('marketing_notes', JSON.stringify(m.marketing_notes)); }
            if (m.assigned_opsheets) { setAssignedOpSheets(m.assigned_opsheets); localStorage.setItem('assigned_opsheets', JSON.stringify(m.assigned_opsheets)); }
            if (m.assigned_branches) { setAssignedBranches(m.assigned_branches); localStorage.setItem('assigned_branches', JSON.stringify(m.assigned_branches)); }
            if (m.assigned_dates) { setAssignedDates(m.assigned_dates); localStorage.setItem('assigned_dates', JSON.stringify(m.assigned_dates)); }
            if (m.task_priorities) { setTaskPriorities(m.task_priorities); localStorage.setItem('task_priorities', JSON.stringify(m.task_priorities)); }
            if (m.task_statuses) { setTaskStatuses(m.task_statuses); localStorage.setItem('task_statuses', JSON.stringify(m.task_statuses)); }
         }
      })
      .catch(e => console.error(e));
  }, [session?.access_token]);

  const [subscribedTasks, setSubscribedTasks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('subscribed_tasks') || '[]');
    } catch (e) {
      return [];
    }
  });

  const toggleSubscribe = (itemKey: string) => {
    setSubscribedTasks(prev => {
      const next = prev.includes(itemKey) ? prev.filter(k => k !== itemKey) : [...prev, itemKey];
      localStorage.setItem('subscribed_tasks', JSON.stringify(next));
      return next;
    });
  };

  const globalChannelRef = useRef<any>(null);
  const subscribedTasksRef = useRef<string[]>([]);
  const assignedEditorsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    subscribedTasksRef.current = subscribedTasks;
  }, [subscribedTasks]);

  useEffect(() => {
    assignedEditorsRef.current = assignedEditors;
  }, [assignedEditors]);

  useEffect(() => {
    if (!profile?.name) return;
    
    // Subscribe to user-specific channel
    const userChannelName = `notif:${profile.name.toLowerCase()}`;
    const userCh = supabase.channel(userChannelName);
    userCh.on('broadcast', { event: 'notify' }, ({ payload }: any) => {
      const notif: PersonalNotif = {
        id: String(Date.now() + Math.random()),
        taskName: payload.taskName || '',
        message: payload.message || '',
        type: payload.type || 'note',
        from: payload.from || '',
        at: Date.now(),
        read: false,
      };
      setMyNotifs(prev => [notif, ...prev].slice(0, 50));
    }).subscribe();

    // Subscribe to global channel for tasks
    const globalCh = supabase.channel('tasks:global');
    globalChannelRef.current = globalCh;
    globalCh.on('broadcast', { event: 'update' }, ({ payload }: any) => {
      const { itemKey, taskName, message, type, from, field, dict } = payload;
      
      if (field && dict) {
         localStorage.setItem(field, JSON.stringify(dict));
         if (field === 'assigned_editors') setAssignedEditors(dict);
         else if (field === 'editor_notes') setEditorNotes(dict);
         else if (field === 'marketing_notes') setMarketingNotes(dict);
         else if (field === 'assigned_opsheets') setAssignedOpSheets(dict);
         else if (field === 'assigned_branches') setAssignedBranches(dict);
         else if (field === 'assigned_dates') setAssignedDates(dict);
         else if (field === 'task_priorities') setTaskPriorities(dict);
         else if (field === 'task_statuses') setTaskStatuses(dict);
      }
      if (!from || from.toLowerCase() === profile.name.toLowerCase()) return;

      const currentEditor = assignedEditorsRef.current[itemKey];
      const isSub = subscribedTasksRef.current.includes(itemKey) || (currentEditor && currentEditor.toLowerCase() === profile.name.toLowerCase());

      if (isSub) {
        const notif: PersonalNotif = {
          id: String(Date.now() + Math.random()),
          taskName,
          message,
          type,
          from,
          at: Date.now(),
          read: false,
        };
        setMyNotifs(prev => [notif, ...prev].slice(0, 50));
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(userCh);
      supabase.removeChannel(globalCh);
    };
  }, [profile?.name]);

  const broadcastTaskUpdate = async (itemKey: string, taskName: string, message: string, type: string) => {
    if (!profile?.name || !globalChannelRef.current) return;
    try {
      await globalChannelRef.current.send({
        type: 'broadcast',
        event: 'update',
        payload: { itemKey, taskName, message, type, from: profile.name },
      });
    } catch (e) {
      console.error('Failed to broadcast task update:', e);
    }
  };

  function findTaskName(itemKey: string) {
    const found = combinedData.find(i => (i.uniqueKey || generateKey(i)) === itemKey || 'tgm-' + (i.uniqueKey || generateKey(i)) === itemKey);
    return found?.name || itemKey;
  }

  const handleUpdateEditor = (itemKey: string, newEditor: string) => {
    setAssignedEditors(prev => {
      const updated = { ...prev, [itemKey]: newEditor };
      const taskName = findTaskName(itemKey);
      syncState('assigned_editors', updated, itemKey, taskName, 'editor', `👤 تم إسناد التجميعة للمحرر: ${newEditor}`);
      return updated;
    });
  };

  const handleUpdateEditorNotes = (itemKey: string, noteText: string, editorName?: string) => {
    setEditorNotes(prev => {
      const updated = { ...prev, [itemKey]: noteText };
      if (noteText.trim()) {
        const taskName = findTaskName(itemKey);
        syncState('editor_notes', updated, itemKey, taskName, 'note', `📝 ملاحظة جديدة: "${noteText.slice(0, 60)}${noteText.length > 60 ? '...' : ''}"`);
      } else {
        localStorage.setItem('editor_notes', JSON.stringify(updated));
        fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ field: 'editor_notes', metadata: updated }) }).catch(e => console.error(e));
      }
      return updated;
    });
  };

  const handleUpdateMarketingNotes = (itemKey: string, noteText: string, editorName?: string) => {
    setMarketingNotes(prev => {
      const updated = { ...prev, [itemKey]: noteText };
      if (noteText.trim()) {
        const taskName = findTaskName(itemKey);
        syncState('marketing_notes', updated, itemKey, taskName, 'marketing_note', `💬 ملاحظة تسويق: "${noteText.slice(0, 60)}${noteText.length > 60 ? '...' : ''}"`);
      } else {
        localStorage.setItem('marketing_notes', JSON.stringify(updated));
        fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` }, body: JSON.stringify({ field: 'marketing_notes', metadata: updated }) }).catch(e => console.error(e));
      }
      return updated;
    });
  };

  const handleStatusChange = (itemKey: string, taskName: string, editorName: string, type: string) => {
    const msgMap: Record<string, string> = {
      done: '✅ تم تحديد التجميعة كـ مكتملة',
      undone: '↩️ تم إلغاء تحديد التجميعة كمكتملة',
      cancel: '❌ تم تحديد التجميعة كـ ملغاة',
      uncancel: '↩️ تم إلغاء تحديد التجميعة كملغاة',
      priority: '⚠️ تم تحديد التجميعة كأولوية قصوى',
      unpriority: '➖ تم إزالة الأولوية القصوى عن التجميعة',
    };
    const message = msgMap[type] || `تغيير في التجميعة`;

    if (type === 'priority' || type === 'unpriority') {
       const isPri = type === 'priority';
       setTaskPriorities(prev => {
          const n = { ...prev, [itemKey]: isPri };
          syncState('task_priorities', n, itemKey, taskName, type, message);
          return n;
       });
    } else {
       const done = (type === 'done' || type === 'uncancel') ? true : false;
       const cancel = type === 'cancel';
       setTaskStatuses(prev => {
          const n = { ...prev, [itemKey]: { done, cancel } };
          syncState('task_statuses', n, itemKey, taskName, type, message);
          return n;
       });
    }
  };

  const handleUpdateOpSheet = (itemKey: string, val: string) => {
    setAssignedOpSheets(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_opsheets', updated, itemKey, taskName, 'opsheet', `📂 تم تعديل المرحلة إلى: ${val || 'غير محدد'}`);
      return updated;
    });
  };

  const handleUpdateBranch = (itemKey: string, val: string) => {
    setAssignedBranches(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_branches', updated, itemKey, taskName, 'branch', `🏢 تم تحويل الفرع إلى: ${val || 'غير محدد'}`);
      return updated;
    });
  };

  const opSheetsList = useMemo(() => {
    const set = new Set<string>();
    const sourceData = activeGid === '1535230545' ? liveData : [];
    
    const normalizeYearLocal = (val: string) => {
      const clean = (val || '').trim();
      const match = clean.match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (match) {
        return `${match[1]} - ${match[2]}`;
      }
      return clean;
    };

    sourceData.forEach((i: any) => {
      if (i.opSheet) {
        const norm = normalizeYearLocal(i.opSheet);
        if (/^\d{4}\s*-\s*\d{4}$/.test(norm)) {
          set.add(norm);
        }
      }
    });

    const defaults = ['2023 - 2024', '2024 - 2025', '2025 - 2026', '2026 - 2027'];
    defaults.forEach(d => set.add(d));
    return Array.from(set).sort();
  }, [liveData, activeGid]);

  const branchesList = useMemo(() => {
    const set = new Set<string>();
    const sourceData = activeGid === '1535230545' ? liveData : [];
    sourceData.forEach((i: any) => {
      if (i.branch && i.branch.trim() !== '') set.add(i.branch.trim());
    });
    const defaults = ['القاهرة', 'اسكندرية', 'دسوق'];
    defaults.forEach(d => set.add(d));
    return Array.from(set).sort();
  }, [liveData, activeGid]);

  const editorsList = useMemo(() => {
    const set = new Set<string>();
    const sourceData = activeGid === '1535230545' ? liveData : [];
    sourceData.forEach((i: any) => {
      if (i.editor && i.editor !== 'محرر' && i.editor !== 'غير محدد') {
        set.add(i.editor.trim());
      }
    });
    const defaults = ['HASSANEN', 'ABANOUB', 'SHIHAB', 'MAGED', 'KIRO', 'MOHAMED'];
    defaults.forEach(d => set.add(d));
    return Array.from(set).sort();
  }, [liveData, activeGid]);

  const [localEntries, setLocalEntries] = useState<{ [gid: string]: any[] }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', filingName: '', val: '', id: '', subject: '', extra: '', editor: '', notesMarketing: '' });
  const [colorfulTabs, setColorfulTabs] = useState(false);
  const [stageWeekFilter, setStageWeekFilter] = useState('All');
  const [glowingKeys, setGlowingKeys] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'date' | 'addedDate'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
          date: item.date || '',
          notesMarketing: item.notesMarketing || '',
          editor: item.editor || 'غير محدد',
          notesEditors: item.notesEditors || '',
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
    
    const combinedCodes = selectedForMerge.map(i => i.filingName || i.name).join('\n');
    const combinedNames = selectedForMerge.map(i => i.name).join(' | ');
    const uniqueKey = 'merge-' + Date.now();

    const mergedItem = {
      name: combinedCodes,
      filingName: combinedNames,
      val: sample.year || sample.term || 'YouTube Merge',
      id: sample.date || sample.teacher || '---',
      subject: getSubjectFromFiling(combinedCodes),
      extra: 'يوتيوب العمليات (تجميعة)',
      opSheet: 'العمليات',
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
          opSheet: 'العمليات',
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
    if (isOperations && item.teacher) {
      setTeacherFilter(item.teacher);
    } else {
      setTeacherFilter('All');
    }
    setYearFilter('All');
    setColFilters({});
    setShowNotifications(false);

    const key = item.uniqueKey || generateKey(item);
    setGlowingKeys(prev => [...prev, key]);
    setTimeout(() => {
      setGlowingKeys(prev => prev.filter(k => k !== key));
    }, 4000);

    setTimeout(() => {
      const el = document.getElementById(key);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);

    dismissNotification(key);
  };

  const stages = [
    { label: 'Operations', gid: '1476192399', icon: Briefcase, colorHex: '#8b5cf6' },
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
    let baseList = [];
    if (isOperations) baseList = [...currentLocal, ...liveData];
    else if (isTagme3at) baseList = [...currentLocal, ...tagmeTransfers, ...liveData];
    else {
      const transfers = youtubeItems[activeGid] || [];
      baseList = [...currentLocal, ...transfers, ...liveData];
    }

    return baseList.map(item => {
      const key = item.uniqueKey || generateKey(item);
      const updated = { ...item };
      if (assignedEditors[key] !== undefined) {
        updated.editor = assignedEditors[key];
      }
      if (editorNotes[key] !== undefined) {
        updated.notesEditors = editorNotes[key];
      }
      if (marketingNotes[key] !== undefined) {
        updated.notesMarketing = marketingNotes[key];
      }
      if (assignedOpSheets[key] !== undefined) {
        updated.opSheet = assignedOpSheets[key];
      }
      if (assignedBranches[key] !== undefined) {
        updated.branch = assignedBranches[key];
      }
      if (assignedDates[key] !== undefined) {
        updated.date = assignedDates[key];
      }
      if (assignedBunnyLinks[key] !== undefined) {
        updated.linkBunny = assignedBunnyLinks[key];
      }
      return updated;
    });
  }, [liveData, youtubeItems, tagmeTransfers, localEntries, activeGid, isOperations, isTagme3at, assignedEditors, editorNotes, marketingNotes, assignedOpSheets, assignedBranches, assignedDates, assignedBunnyLinks]);

  useEffect(() => {
    if (combinedData.length === 0) return;
    const SEEN_KEY = `seen_items_${activeGid}`;
    const NEW_KEY = `new_items_${activeGid}`;
    
    const seenStr = localStorage.getItem(SEEN_KEY);
    
    const currentNames = new Set<string>();
    combinedData.forEach(item => {
      currentNames.add(item.uniqueKey || generateKey(item));
    });

    if (!seenStr) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(currentNames)));
      return;
    }
    
    const seenSet = new Set(JSON.parse(seenStr));
    const newlyAdded: any[] = [];

    combinedData.forEach((item) => {
      const key = item.uniqueKey || generateKey(item);
      if (!seenSet.has(key)) {
        newlyAdded.push({ ...item, uniqueKey: key });
      }
    });

    if (newlyAdded.length > 0 && newlyAdded.length < 30) {
      const keysToGlow = newlyAdded.map(item => item.uniqueKey);
      setGlowingKeys(prev => [...prev, ...keysToGlow]);
      keysToGlow.forEach(key => {
        setTimeout(() => {
          setGlowingKeys(prev => prev.filter(k => k !== key));
        }, 10000);
      });

      setNewItems(prev => {
        const map = new Map(prev.map(p => [p.uniqueKey, p]));
        newlyAdded.forEach(n => map.set(n.uniqueKey, n));
        const finalNew = Array.from(map.values());
        localStorage.setItem(NEW_KEY, JSON.stringify(finalNew));
        return finalNew;
      });

      newlyAdded.forEach(item => {
        const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
        setItemToasts(prev => [...prev, { id: toastId, name: item.name, filingName: item.filingName }]);
        setTimeout(() => {
          setItemToasts(prev => prev.filter(t => t.id !== toastId));
        }, 8000);
      });
    }

    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(currentNames)));
  }, [combinedData, activeGid]);

  const teachers = useMemo(() => {
    if (!isOperations) return [];
    const source = yearFilter !== 'All'
      ? combinedData.filter((i: any) => i.year === yearFilter)
      : combinedData;
    const set = new Set(source.map((i: any) => i.teacher).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [combinedData, isOperations, yearFilter]);

  const years = useMemo(() => {
    if (!isOperations) return [];
    const source = teacherFilter !== 'All'
      ? combinedData.filter((i: any) => i.teacher === teacherFilter)
      : combinedData;
    const set = new Set(source.map((i: any) => i.year).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [combinedData, isOperations, teacherFilter]);

  useEffect(() => {
    if (isOperations && yearFilter !== 'All' && years.length > 0 && !years.includes(yearFilter)) {
      setYearFilter('All');
    }
  }, [teacherFilter, years, yearFilter, isOperations]);

  useEffect(() => {
    if (isOperations && teacherFilter !== 'All' && teachers.length > 0 && !teachers.includes(teacherFilter)) {
      setTeacherFilter('All');
    }
  }, [yearFilter, teachers, teacherFilter, isOperations]);

  const availableWeeks = useMemo(() => {
    if (isOperations || isTagme3at || isAnalyticsTagme) return [];
    const set = new Set(liveData.map((i: any) => i.week ? String(i.week).trim() : '').filter(Boolean));
    return Array.from(set) as string[];
  }, [liveData, isOperations, isTagme3at, isAnalyticsTagme]);


  const filteredData = useMemo(() => {
    const filtered = combinedData.filter((item: any) => {
      const searchVal = searchQuery.trim().toLowerCase();
      const matchesSearch = !searchVal ||
        (item.name && String(item.name).toLowerCase().includes(searchVal)) ||
        (item.filingName && String(item.filingName).toLowerCase().includes(searchVal)) ||
        (item.id && String(item.id).toLowerCase().includes(searchVal)) ||
        (item.val && String(item.val).toLowerCase().includes(searchVal)) ||
        (item.teacher && String(item.teacher).toLowerCase().includes(searchVal)) ||
        (item.editor && String(item.editor).toLowerCase().includes(searchVal)) ||
        (item.subject && String(item.subject).toLowerCase().includes(searchVal)) ||
        (item.branch && String(item.branch).toLowerCase().includes(searchVal)) ||
        (item.notesMarketing && String(item.notesMarketing).toLowerCase().includes(searchVal)) ||
        (item.notesEditors && String(item.notesEditors).toLowerCase().includes(searchVal));

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

    if (sortBy === 'name') {
      const sorted = [...filtered];
      sorted.sort((a: any, b: any) => {
        const nameA = String(a.name || '').trim();
        const nameB = String(b.name || '').trim();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB, 'ar') : nameB.localeCompare(nameA, 'ar');
      });
      return sorted;
    } else if (sortBy === 'date') {
      const getResolvedDate = (item: any) => {
        if (item.date) return item.date;
        if (item.uniqueKey && String(item.uniqueKey).startsWith('tgm-')) {
          const originalKey = String(item.uniqueKey).replace('tgm-', '');
          const matched = liveData?.find((i: any) => (i.uniqueKey || generateKey(i)) === originalKey);
          if (matched?.date) return matched.date;
        }
        return '';
      };
      const parseDate = (dStr: string) => {
        if (!dStr) return 0;
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month - 1, day).getTime();
          }
        }
        const t = Date.parse(dStr);
        return isNaN(t) ? 0 : t;
      };
      const sorted = [...filtered];
      sorted.sort((a: any, b: any) => {
        const dateA = parseDate(getResolvedDate(a));
        const dateB = parseDate(getResolvedDate(b));
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      return sorted;
    } else if (sortBy === 'addedDate') { // New sorting logic for 'addedDate'
      const parseDate = (dStr: string) => {
        if (!dStr) return 0;
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month - 1, day).getTime();
          }
        }
        const t = Date.parse(dStr);
        return isNaN(t) ? 0 : t;
      };
      const sorted = [...filtered];
      sorted.sort((a: any, b: any) => {
        const dateA = parseDate(a.addedDate || '');
        const dateB = parseDate(b.addedDate || '');
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      return sorted;
    }

    return filtered;
  }, [combinedData, searchQuery, statusFilter, teacherFilter, yearFilter, colFilters, isOperations, isTagme3at, isStage, stageWeekFilter, sortBy, sortOrder, liveData]);

  // Column Filter Component
  const ColFilter = ({ colKey, label }: { colKey: string, label: string }) => {
    const options = useMemo(() => {
      const set = new Set(liveData.map(i => String(i[colKey] || '')).filter(v => v !== 'false' && v !== 'true' && v.trim() !== ''));
      if (colKey === 'branch' || colKey === 'extra') {
        set.add('القاهرة');
        set.add('اسكندرية');
        set.add('دسوق');
      }
      return Array.from(set).sort();
    }, [liveData, colKey]);

    const handleSelectChange = (val: string) => {
      setColFilters(p => {
        const updated = { ...p };
        if (val === 'All') delete updated[colKey];
        else updated[colKey] = val;
        return updated;
      });
    };

    return (
      <div className="flex flex-col items-center justify-center my-1 relative min-h-[30px]">
        {options.length > 0 && options.length < 50 ? (
          <CustomSelect
            value={colFilters[colKey] || 'All'}
            onChange={handleSelectChange}
            options={options}
            placeholder={label}
            isColumn={true}
          />
        ) : (
          <span className="text-[10px] font-black uppercase tracking-wider text-white/50">{label}</span>
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
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="date" label="LINK BUNNY" /></th>
        <th className="px-4 py-4 text-center th-style text-purple-400 font-bold">نشر يوتيوب</th>
        <th className="px-4 py-4 text-center th-style text-purple-400 font-bold">
          <div className="flex items-center justify-center gap-1.5">
            <span>تجميعة 🔗</span>
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
        <th className="px-3 py-4 text-center th-style"><ColFilter colKey="date" label="التاريخ" /></th>
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

  const colSpan = isOperations ? 7 : isTagme3at ? 9 : 7;

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
          {stages.filter(stage => !profile?.role || PERMISSIONS.canViewTab(profile.role, stage.label, profile.allowed_tabs || [])).map((stage) => (
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
          {/* Users tab for admin and manager */}
          {profile?.role && PERMISSIONS.canManageUsers(profile.role) && (
            <SidebarItem
              key="users"
              icon={Users}
              label="المستخدمين 👥"
              colorHex="#f43f5e"
              colorful={colorfulTabs}
              active={activeGid === '__users__'}
              onClick={() => {
                setActiveGid('__users__');
                setActiveLabel('المستخدمين');
              }}
            />
          )}
        </nav>

        {/* User Profile Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 ${
              profile?.role === 'admin' ? 'bg-gradient-to-br from-rose-600 to-pink-600' :
              profile?.role === 'manager' ? 'bg-gradient-to-br from-purple-600 to-violet-600' :
              profile?.role === 'supervisor' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
              'bg-gradient-to-br from-emerald-600 to-teal-600'
            }`}>
              {profile?.name ? profile.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate arabic-text">{profile?.name || 'مستخدم'}</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${profile?.role ? ROLE_COLORS[profile.role] : 'bg-white/5 text-white/40 border-white/10'}`}>
                {profile?.role ? ROLE_LABELS[profile.role] : ''}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/30 flex items-center justify-center transition-all cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Users Management Page */}
      {isUsersPage ? (
        <main className="flex-1 flex flex-col min-w-0 bg-[#05070a] p-12 overflow-y-auto">
          <UserManagement />
        </main>
      ) : (
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
            {/* Personal Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => { setShowMyNotifs(!showMyNotifs); setShowNotifications(false); if (unreadCount > 0) setMyNotifs(prev => prev.map(n => ({ ...n, read: true }))); }}
                className={`relative p-3.5 rounded-2xl border transition-all flex items-center justify-center ${unreadCount > 0 ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]'}`}
                title="إشعاراتي"
              >
                <Bell size={20} className={`transition-all duration-300 ${unreadCount > 0 ? 'text-rose-400 animate-pulse' : 'text-white/20'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showMyNotifs && (
                <div className="absolute right-0 mt-3 w-96 bg-[#0a0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[480px]" dir="rtl">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <span className="font-bold text-sm flex items-center gap-2"><Bell size={14} className="text-rose-400" /> إشعاراتي ({myNotifs.length})</span>
                    {myNotifs.length > 0 && <button onClick={() => setMyNotifs([])} className="text-[10px] text-muted hover:text-rose-400 transition-colors">مسح الكل</button>}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {myNotifs.length === 0 ? (
                      <div className="p-10 text-center text-muted/50">
                        <Bell size={28} className="mx-auto mb-3 opacity-20" />
                        <p className="text-xs">لا توجد إشعارات</p>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-white/[0.04]">
                        {myNotifs.map((n) => (
                          <div key={n.id} className={`p-4 flex flex-col gap-1.5 transition-colors ${n.read ? 'opacity-60' : 'bg-white/[0.02]'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                n.type === 'done' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                n.type === 'cancel' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' :
                                'bg-blue-500/15 border-blue-500/30 text-blue-400'
                              }`}>
                                {n.type === 'done' ? '✅ مكتملة' : n.type === 'cancel' ? '❌ ملغاة' : n.type === 'undone' ? '↩️ تراجع' : '📝 ملاحظة'}
                              </span>
                              <span className="text-[10px] text-muted">من: {n.from}</span>
                            </div>
                            <p className="text-xs text-white font-bold arabic-text leading-relaxed">{n.message}</p>
                            {n.taskName && n.taskName !== n.message && (
                              <p className="text-[10px] text-muted truncate opacity-60 font-mono">{n.taskName}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sheet new items bell */}
            <div className="relative">
              <button 
                 onClick={() => { setShowNotifications(!showNotifications); setShowMyNotifs(false); }}
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

            {profile?.role && PERMISSIONS.canSync(profile.role) && (
              <button onClick={() => refresh()} className="btn-glass px-7 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest cursor-pointer hover:scale-105 active:scale-95 transition-all">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                <span>Synchronize</span>
              </button>
            )}
            {profile?.role && PERMISSIONS.canAddEntry(profile.role) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary px-8 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span>Add entry</span>
              </button>
            )}
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
                    <CustomSelect
                      value={teacherFilter}
                      onChange={setTeacherFilter}
                      options={teachers}
                      placeholder="Teachers"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 border-r border-white/10 mr-2 group">
                    <Clock size={16} className="text-muted group-hover:text-primary transition-colors" />
                    <CustomSelect
                      value={yearFilter}
                      onChange={setYearFilter}
                      options={years}
                      placeholder="Years"
                    />
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

          {/* Sort & Order Bar */}
          <div className="flex items-center justify-end gap-3 text-xs bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-2xl animate-fadeIn" dir="rtl">
            <span className="font-bold text-muted ml-2"> ترتيب حسب:</span>
            <button
              onClick={() => {
                if (sortBy !== 'name') {
                  setSortBy('name');
                  setSortOrder('asc');
                } else {
                  setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-primary/20 border-primary text-primary font-black scale-105 shadow-md shadow-primary/10'
                  : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'
              }`}
            >
              <span>الاسم (Name)</span>
              {sortBy === 'name' && (sortOrder === 'asc' ? '🔼' : '🔽')}
            </button>

            <button
              onClick={() => {
                if (sortBy !== 'date') {
                  setSortBy('date');
                  setSortOrder('asc');
                } else {
                  setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'date'
                  ? 'bg-primary/20 border-primary text-primary font-black scale-105 shadow-md shadow-primary/10'
                  : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'
              }`}
            >
              <span>التاريخ (Date)</span>
              {sortBy === 'date' && (sortOrder === 'asc' ? '🔼' : '🔽')}
            </button>
            <button
              onClick={() => {
                if (sortBy !== 'addedDate') {
                  setSortBy('addedDate');
                  setSortOrder('desc'); // Default to descending for "recent"
                } else {
                  setSortOrder(p => p === 'asc' ? 'desc' : 'asc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'addedDate'
                  ? 'bg-primary/20 border-primary text-primary font-black scale-105 shadow-md shadow-primary/10'
                  : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'
              }`}
            >
              <span>تاريخ الإضافة (Date Added)</span>
              {sortBy === 'addedDate' && (sortOrder === 'asc' ? '🔼' : '🔽')}
            </button>

            {sortBy !== 'default' && (
              <button
                onClick={() => setSortBy('default')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/20 transition-all cursor-pointer mr-auto"
              >
                إلغاء الترتيب ✕
              </button>
            )}
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
                    ) : isOperations && teacherFilter === 'All' && !searchQuery.trim() ? (
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
                      const itemKey = item.uniqueKey || generateKey(item);
                      const isGlowing = glowingKeys.includes(itemKey);

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
                            isGlowing={isGlowing}
                            onOpenBunnyLinkModal={(itemKey: string, itemName: string, initialUrl: string) => setBunnyLinkModal({ isOpen: true, itemKey, itemName, initialUrl })}
                          />
                        );
                      }
                      if (isTagme3at) {
                        const isJunior = profile?.role === 'junior';
                        const today = new Date().toDateString();
                        const myCountToday = combinedData.filter((i: any) =>
                          (String(i.priority) === 'true' || i.priority === true) &&
                          String(i.editor || '').toLowerCase() === String(profile?.name || '').toLowerCase() &&
                          new Date(i.updated_at || i.date || Date.now()).toDateString() === today
                        ).length;
                        const limit = Number(rolePermissions?.junior?.dailyPriorityLimit ?? 1);
                        const canRaisePriority = !isJunior || myCountToday < limit;
                        const key = item.uniqueKey || generateKey(item);
                        const isSubscribed = subscribedTasks.includes(key) || (item.editor && item.editor.toLowerCase() === profile?.name?.toLowerCase());
                        return <TagmeRow key={idx} item={item} index={idx} onUpdateEditor={handleUpdateEditor} editorsList={editorsList} onUpdateEditorNotes={handleUpdateEditorNotes} onUpdateMarketingNotes={handleUpdateMarketingNotes} opSheetsList={opSheetsList} branchesList={branchesList} onUpdateOpSheet={handleUpdateOpSheet} onUpdateBranch={handleUpdateBranch} onUpdateDate={handleUpdateDate} isGlowing={isGlowing} liveData={liveData} canRaisePriority={canRaisePriority} priorityLimit={limit} onStatusChange={handleStatusChange} isSubscribed={isSubscribed} onToggleSubscribe={() => toggleSubscribe(key)} priorityOverride={taskPriorities[key]} statusOverride={taskStatuses[key]} />;
                      }
                      return <StageRow key={idx} item={item} index={idx} tagmeTransfers={tagmeTransfers} onTagmeToggle={handleTagmeToggle} activeLabel={activeLabel} isGlowing={isGlowing} />;
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
                  <span className="text-base font-bold text-white arabic-text">تم تحديد عدة دروس لتجميعها معاً في يوتيوب 🔗</span>
                  <span className="text-xs text-purple-300 arabic-text line-clamp-1 mt-0.5">{selectedForMerge.map(i => i.name).join(' + ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExecuteMerge}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold arabic-text rounded-2xl shadow-lg shadow-purple-600/40 transition-all scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span>تجميع وتحويل للمرحلة 🚀</span>
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

        {/* Floating new item toasts container */}
        <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
          <AnimatePresence>
            {itemToasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 100 }}
                className="pointer-events-auto bg-[#0a0e14]/95 border border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.15)] rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden backdrop-blur-xl"
                dir="rtl"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bell size={20} className="animate-bounce" />
                </div>
                
                <div className="flex-1 min-w-0 text-right space-y-1">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">تمت إضافة درس جديد! 🎉</h4>
                  <p className="text-xs font-bold text-white leading-relaxed line-clamp-2 arabic-text">{toast.name}</p>
                  {toast.filingName && (
                    <p className="text-[9px] font-mono text-muted/60 truncate uppercase tracking-wider">{toast.filingName}</p>
                  )}
                </div>
                
                <button 
                  onClick={() => setItemToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-muted hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <XCircle size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Custom Premium Bunny Link Modal */}
        <AnimatePresence>
          {bunnyLinkModal && bunnyLinkModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[500] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0c0e14] border border-purple-500/20 rounded-3xl w-full max-w-md shadow-[0_0_80px_rgba(147,51,234,0.25)] overflow-hidden"
                dir="rtl"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                      <Link size={18} />
                    </div>
                    <div className="text-right">
                      <h3 className="font-black text-white arabic-text">رابط تشغيل الفيديو (Bunny)</h3>
                      <p className="text-[10px] text-purple-300 font-bold arabic-text mt-0.5">تحديث رابط تشغيل الدرس</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBunnyLinkModal(null)}
                    className="text-muted hover:text-white p-2 transition-colors cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('bunnyLinkInput') as HTMLInputElement;
                    handleUpdateBunnyLink(bunnyLinkModal.itemKey, input.value.trim());
                    setBunnyLinkModal(null);
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="space-y-2 text-right">
                    <label className="text-[11px] font-black text-muted uppercase tracking-wider arabic-text">اسم الدرس</label>
                    <p className="text-sm font-bold text-white arabic-text leading-relaxed bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">{bunnyLinkModal.itemName}</p>
                  </div>

                  <div className="space-y-2 text-right">
                    <label htmlFor="bunnyLinkInput" className="text-[11px] font-black text-muted uppercase tracking-wider arabic-text">رابط الفيديو (Bunny Link)</label>
                    <input
                      id="bunnyLinkInput"
                      name="bunnyLinkInput"
                      type="url"
                      defaultValue={bunnyLinkModal.initialUrl}
                      placeholder="https://iframe.mediadelivery.net/play/..."
                      autoFocus
                      required
                      className="w-full bg-[#070a10] border border-purple-500/20 focus:border-purple-500/50 rounded-2xl px-4 py-3.5 text-xs font-bold text-white outline-none transition-all shadow-inner text-left placeholder:text-muted/30"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold arabic-text py-3.5 px-6 rounded-2xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-center text-xs"
                    >
                      حفظ الرابط والتفعيل
                    </button>
                    <button
                      type="button"
                      onClick={() => setBunnyLinkModal(null)}
                      className="bg-white/5 hover:bg-white/10 text-muted hover:text-white font-bold arabic-text py-3.5 px-6 rounded-2xl transition-all cursor-pointer text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}
    </div>
  );
}

// ─── Auth Gate ─────────────────────────────────────────────────────────────────
function AppWithAuth() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-purple-400 uppercase tracking-[0.4em]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !profile) return <LoginPage />;
  return <App />;
}

// ─── Splash Screen ─────────────────────────────────────────────────────────────
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-blue-950 flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/20 opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-8xl md:text-[120px] font-black text-white tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] font-tajawal">
            الخطة
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="flex items-center gap-4 text-sm md:text-xl font-bold uppercase tracking-[0.4em] text-yellow-400"
        >
          <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-yellow-400/50" />
          <span>Marketing & Video Editing HUB</span>
          <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-yellow-400/50" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16"
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.2, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 0.6,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-yellow-400"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

function RootApp() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            <AppWithAuth />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthProvider>
  );
}

export default function Root() {
  return <RootApp />;
}
