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
          <div className="glass rounded-2xl overflow-x-auto border border-border shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground font-medium">جاري تحميل البيانات من Google Sheets...</div>
            ) : (
              <table className="w-full text-right border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    {activeGid === '1535230545' ? (
                      <th className="px-6 py-4 font-semibold text-sm">الاسم (Name)</th>
                    ) : (
                      <>
                        <th className="px-4 py-4 font-semibold text-sm w-16 text-center">تجميعه</th>
                        <th className="px-4 py-4 font-semibold text-sm w-16 text-center">اتسلمت للـ V.E</th>
                        <th className="px-4 py-4 font-semibold text-sm w-28 text-center">التاريخ</th>
                        <th className="px-4 py-4 font-semibold text-sm w-32 text-center">المادة</th>
                        <th className="px-4 py-4 font-semibold text-sm w-32 text-center">الفرع</th>
                        <th className="px-6 py-4 font-semibold text-sm">اسم الدرس (OP NAME)</th>
                        <th className="px-4 py-4 font-semibold text-sm w-36 text-center">OP SHEET</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white/40 backdrop-blur-sm">
                  {filteredData.length > 0 ? filteredData.map((item, idx) => {
                    
                    const getChipColor = (val: string) => {
                      if (!val) return 'bg-gray-100 text-gray-600 border-gray-200';
                      if (val.includes('اسكندريه') || val.includes('علوم')) return 'bg-blue-100 text-blue-800 border-blue-200';
                      if (val.includes('القاهره') || val.includes('ماث') || val.includes('2025')) return 'bg-red-100 text-red-800 border-red-200';
                      if (val.includes('رياضه')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      if (val.includes('ساينس')) return 'bg-green-100 text-green-800 border-green-200';
                      if (val.includes('دراسات')) return 'bg-orange-100 text-orange-800 border-orange-200';
                      return 'bg-gray-100 text-gray-700 border-gray-200';
                    };

                    const DropdownChip = ({ value }: { value: string }) => (
                      <div className="relative inline-flex items-center w-full max-w-[120px] mx-auto">
                        <select 
                          className={`w-full appearance-none px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 text-center ${getChipColor(value)}`}
                          defaultValue={value}
                        >
                          <option value={value}>{value}</option>
                          <option value="تعديل...">تعديل...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-current opacity-70">
                          <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    );

                    return (
                    <tr key={idx} className="hover:bg-white/50 transition-colors group">
                      {activeGid === '1535230545' ? (
                        <td className="px-6 py-4 font-medium arabic-text">{item.name}</td>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-center">
                            <input type="checkbox" defaultChecked={item.check1} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input type="checkbox" defaultChecked={item.check2} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                          </td>
                          <td className="px-4 py-4 text-sm text-center text-muted-foreground font-medium">{item.id}</td>
                          <td className="px-4 py-4 text-center"><DropdownChip value={item.subject} /></td>
                          <td className="px-4 py-4 text-center"><DropdownChip value={item.extra} /></td>
                          <td className="px-6 py-4 text-sm font-semibold arabic-text leading-relaxed max-w-md">{item.name}</td>
                          <td className="px-4 py-4 text-center"><DropdownChip value={item.val} /></td>
                        </>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
