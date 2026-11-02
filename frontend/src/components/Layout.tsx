import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, AlertTriangle, Menu, Bell, User, Users, Search, Command, X, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { theme, setTheme, isDark } = useTheme();

  const navItems = [
    { path: '/nagar-mirror', name: 'Digital Twin', icon: LayoutDashboard },
    { path: '/swachh-track', name: 'AI Routes', icon: Truck },
    { path: '/dump-spot', name: 'Risk Analytics', icon: AlertTriangle },
    { path: '/citizen', name: 'Citizen Portal', icon: Users },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchNav = (path: string) => {
    setCmdOpen(false);
    navigate(path);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-primary selection:bg-success/30 transition-colors duration-200">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-success/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none z-0"></div>

      {/* Sidebar - Glassmorphism */}
      <div className="w-64 glass-panel text-primary flex flex-col z-20 border-r border-border relative">
        <div className="h-16 flex items-center px-6 border-b border-border bg-surface/40">
          <div className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-success to-info flex items-center">
            <div className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></div>
            SwachhDisha AI
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-3 flex items-center">
            Command Center
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-success-bg text-success border border-success/20 shadow-sm'
                      : 'text-secondary hover:bg-surface-2 hover:text-primary border border-transparent'
                  }`
                }
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* User / Status */}
        <div className="p-4 border-t border-border bg-surface/20">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center border border-border shadow-inner">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-primary">MCD Admin</p>
              <p className="text-[10px] uppercase tracking-wider text-success font-bold">● System Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Header - Glassmorphism */}
        <header className="h-16 glass-panel border-b border-border flex items-center justify-between px-6 z-20">
          <div className="flex items-center">
            <button className="text-secondary hover:text-primary md:hidden mr-4 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-primary flex items-center">
              <span className="text-muted font-normal mr-2">New Delhi /</span> 
              <span>Live Operations</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search Trigger */}
            <button 
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center bg-surface/50 hover:bg-surface-2 border border-border text-secondary px-3 py-1.5 rounded-lg text-sm transition-all premium-hover"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search...</span>
              <kbd className="ml-4 text-[10px] font-mono bg-surface-2 border border-border px-1.5 py-0.5 rounded text-primary">Ctrl+K</kbd>
            </button>

            {/* Theme Toggle */}
            <div className="relative group">
              <button 
                onClick={() => setTheme(isDark ? 'light' : 'dark')} 
                className="p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface-2"
                aria-label="Toggle theme"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            <button className="relative p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface-2">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* COMMAND PALETTE OVERLAY */}
      {cmdOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setCmdOpen(false)}></div>
          
          {/* Modal */}
          <div className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center px-4 py-3 border-b border-border">
              <Search className="h-5 w-5 text-secondary mr-3" />
              <input 
                autoFocus
                type="text"
                placeholder="Search sectors, vehicles, AI alerts..."
                className="flex-1 bg-transparent border-none text-primary placeholder-muted focus:outline-none focus:ring-0 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-surface-2 border border-border px-1.5 py-0.5 rounded text-secondary">ESC</kbd>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2">Quick Actions</div>
              <button onClick={() => handleSearchNav('/nagar-mirror')} className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-surface-2 text-left transition-colors group">
                <div className="bg-success-bg p-2 rounded-md mr-3 text-success">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">View Digital Twin Map</p>
                  <p className="text-xs text-muted">Live command center & hotspots</p>
                </div>
              </button>
              
              <button onClick={() => handleSearchNav('/swachh-track')} className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-surface-2 text-left transition-colors group mt-1">
                <div className="bg-info-bg p-2 rounded-md mr-3 text-info">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Optimize Routes</p>
                  <p className="text-xs text-muted">AI prediction and dispatch</p>
                </div>
              </button>

              <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 mt-2 border-t border-border pt-3">AI Suggestions</div>
              <button onClick={() => setCmdOpen(false)} className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-surface-2 text-left transition-colors">
                <AlertTriangle className="h-4 w-4 text-warning mr-3" />
                <span className="text-sm text-primary">Investigate Sector 14 Risk Zone</span>
              </button>
              <button onClick={() => setCmdOpen(false)} className="w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-surface-2 text-left transition-colors">
                <Truck className="h-4 w-4 text-success mr-3" />
                <span className="text-sm text-primary">Track Vehicle TRK-002</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
