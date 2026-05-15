import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  GraduationCap, 
  Search,
  Plus
} from 'lucide-react';
import { useGoogleSheets } from './hooks/useGoogleSheets';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  const [activeGid, setActiveGid] = useState('1535230545'); // Default to Tagme3at
  const [activeLabel, setActiveLabel] = useState('تجميعات');
  const { data: liveData, loading } = useGoogleSheets(activeGid);
  const [searchQuery, setSearchQuery] = useState('');

  const stages = [
    { label: 'تجميعات', gid: '1535230545', icon: Layers },
    { label: 'Junior 4', gid: '0', icon: GraduationCap },
    { label: 'Junior 5', gid: '1', icon: GraduationCap },
    { label: 'Junior 6', gid: '2', icon: GraduationCap },
    { label: 'Middle 1', gid: '3', icon: GraduationCap },
    { label: 'Middle 2', gid: '4', icon: GraduationCap },
    { label: 'Middle 3', gid: '5', icon: GraduationCap },
    { label: 'Senior 1', gid: '6', icon: GraduationCap },
    { label: 'Senior 2', gid: '7', icon: GraduationCap },
    { label: 'Senior 3', gid: '8', icon: GraduationCap },
  ];

  const filteredData = useMemo(() => {
    return liveData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.extra.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [liveData, searchQuery]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-6 flex flex-col gap-8 glass">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <LayoutDashboard className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Marketing Hub</h1>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 px-4">القوائم الرئيسية</p>
          {stages.map((stage) => (
            <SidebarItem 
              key={stage.gid}
              icon={stage.icon} 
              label={stage.label} 
              active={activeGid === stage.gid} 
              onClick={() => {
                setActiveGid(stage.gid);
                setActiveLabel(stage.label);
              }} 
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold arabic-text">{activeLabel}</h2>
            <p className="text-muted-foreground mt-1">متابعة البيانات المسحوبة من شيت جوجل بشكل حي.</p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              <Plus size={20} />
              <span>تحديث يدوي</span>
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Search Bar */}
          <div className="relative glass p-4 rounded-2xl">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو التفاصيل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all arabic-text"
            />
          </div>

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden border border-border">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">جاري تحميل البيانات من Google Sheets...</div>
            ) : (
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="px-6 py-4 font-semibold text-sm">المعرف / التاريخ (C)</th>
                    <th className="px-6 py-4 font-semibold text-sm">الاسم (G)</th>
                    <th className="px-6 py-4 font-semibold text-sm">القيمة (H)</th>
                    <th className="px-6 py-4 font-semibold text-sm">إضافي (E)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.length > 0 ? filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.id}</td>
                      <td className="px-6 py-4 font-medium arabic-text">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold border border-primary/20">
                          {item.val}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm arabic-text">{item.extra}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        لا توجد بيانات متاحة في هذا القسم حالياً.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
