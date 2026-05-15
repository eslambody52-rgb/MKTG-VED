import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Layers, 
  Calendar, 
  Timer, 
  Filter, 
  ChevronRight,
  Plus,
  Search,
  MoreVertical,
  ArrowRightLeft
} from 'lucide-react';
import { mockTasks, mockCollections } from './data/mockData';
import type { Status, Task } from './types';
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

const Badge = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    'Completed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Review': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'Canceled': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function App() {
  const { data: liveTasks } = useGoogleSheets();
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');

  const tasksToDisplay = useMemo(() => {
    return liveTasks.length > 0 ? liveTasks : mockTasks;
  }, [liveTasks]);

  const filteredTasks = useMemo(() => {
    return tasksToDisplay.filter(task => {
      const matchesSearch = task.videoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.responsible.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = filterBranch === 'All' || task.branch === filterBranch;
      
      if (activeTab === '2024') return matchesSearch && matchesBranch && task.year === 2024;
      if (activeTab === '2025') return matchesSearch && matchesBranch && task.year === 2025;
      return matchesSearch && matchesBranch;
    });
  }, [activeTab, searchQuery, filterBranch]);

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

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem 
            icon={CheckSquare} 
            label="Tasks" 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
          />
          <SidebarItem 
            icon={Layers} 
            label="تجميعات" 
            active={activeTab === 'collections'} 
            onClick={() => setActiveTab('collections')} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="2024" 
            active={activeTab === '2024'} 
            onClick={() => setActiveTab('2024')} 
          />
          <SidebarItem 
            icon={Calendar} 
            label="2025" 
            active={activeTab === '2025'} 
            onClick={() => setActiveTab('2025')} 
          />
          <SidebarItem 
            icon={Timer} 
            label="Tracker" 
            active={activeTab === 'tracker'} 
            onClick={() => setActiveTab('tracker')} 
          />
        </nav>

        <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Connected to</p>
          <p className="text-sm font-semibold truncate">marketing_master_sheet</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-muted-foreground mt-1">Manage and track your video production workflow.</p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              <Plus size={20} />
              <span>New Task</span>
            </button>
            <button className="p-2.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-accent transition-colors">
              <ArrowRightLeft size={20} />
            </button>
          </div>
        </header>

        {activeTab === 'collections' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {mockCollections.map(collection => (
              <div key={collection.id} className="glass p-6 rounded-2xl glass-hover cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Layers size={24} />
                  </div>
                  <MoreVertical className="text-muted-foreground" size={20} />
                </div>
                <h3 className="text-xl font-bold mb-1 arabic-text">{collection.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{collection.type}</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">{collection.count}</span>
                  <span className="text-xs text-muted-foreground">Updated {collection.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'tracker' ? (
          <div className="glass p-8 rounded-3xl animate-fade-in flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold mb-2">Live Tracker Active</h3>
            <p className="text-muted-foreground max-w-md">Currently monitoring production status across all branches. All changes are synced in real-time to Vercel and GitHub.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Filters */}
            <div className="flex gap-4 items-center glass p-4 rounded-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  placeholder="Search tasks or editors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="bg-secondary/50 border border-border rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="All">All Branches</option>
                  <option value="Cairo">Cairo</option>
                  <option value="New Cairo">New Cairo</option>
                  <option value="Alexandria">Alexandria</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border hover:bg-accent transition-colors">
                  <Filter size={18} />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="px-6 py-4 font-semibold text-sm">Video Project</th>
                    <th className="px-6 py-4 font-semibold text-sm">Branch</th>
                    <th className="px-6 py-4 font-semibold text-sm">Editor</th>
                    <th className="px-6 py-4 font-semibold text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTasks.length > 0 ? filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium arabic-text">{task.videoName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 arabic-text">{task.requirements}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{task.branch}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{task.responsible}</td>
                      <td className="px-6 py-4">
                        <Badge status={task.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No tasks found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
