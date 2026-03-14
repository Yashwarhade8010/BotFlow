import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BotsAPI } from '../../services/api';
import { BotStatusBadge } from '../ui/index';
import { Menu, X } from 'lucide-react';

const NAV = [
  { key:'overview',       icon:'⬡', label:'Overview' },
  { key:'conversations',  icon:'💬', label:'Conversations', badgeKey:'active' },
  { key:'analytics',      icon:'📊', label:'Analytics' },
  { key:'knowledge',      icon:'📚', label:'Knowledge Base', badgeKey:'processing' },
  { key:'bots',           icon:'🤖', label:'My Bots' },
  { key:'settings',       icon:'⚙',  label:'Settings' },
];

export function DashboardLayout({ page, setPage, bots, activeBotId, setActiveBotId, badges = {}, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeBot = bots?.find(b => b.id === activeBotId);

  return (
    <div className="flex min-h-screen bg-dark">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[260px] bg-dark2 border-r border-border z-50 flex flex-col
        transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-7">
          <div className="flex items-center gap-2.5 font-syne font-extrabold text-lg text-white mb-6">
            <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-sm">💬</div>
            BotFlow
          </div>

          {/* Bot Switcher */}
          <button className="w-full bg-dark3 border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-border2 transition-colors mb-7"
            onClick={() => { setPage('bots'); setSidebarOpen(false); }}>
            <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm shrink-0">
              {activeBot?.name[0]?.toUpperCase() || '🤖'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold font-syne text-white truncate">{activeBot?.name || 'Select a bot...'}</div>
              {activeBot && <BotStatusBadge status={activeBot.status} />}
            </div>
            <span className="text-muted text-xs">⌄</span>
          </button>

          {/* Nav */}
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Main</p>
          <nav className="space-y-0.5 mb-6">
            {NAV.slice(0,4).map(n => (
              <NavItem key={n.key} item={n} active={page===n.key} badge={badges[n.badgeKey]}
                onClick={() => { setPage(n.key); setSidebarOpen(false); }} />
            ))}
          </nav>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">Bot</p>
          <nav className="space-y-0.5">
            {NAV.slice(4).map(n => (
              <NavItem key={n.key} item={n} active={page===n.key}
                onClick={() => { setPage(n.key); setSidebarOpen(false); }} />
            ))}
            <a href="#" onClick={e=>{e.preventDefault();window.location.href='/onboarding';}}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted2 hover:text-text hover:bg-dark3 transition-colors text-sm font-medium">
              <span>+</span> New Bot
            </a>
          </nav>
        </div>

        {/* User card */}
        <div className="mt-auto p-5 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted capitalize">{user?.plan} Plan</div>
            </div>
            <button onClick={logout} className="text-muted hover:text-text text-sm" title="Sign out">⏻</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-[260px] flex flex-col">
        {/* Topbar */}
        <div className="h-14 bg-dark/90 backdrop-blur-md border-b border-border sticky top-0 z-30 px-6 flex items-center gap-4">
          <button className="lg:hidden text-muted hover:text-text" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="font-syne font-bold text-white capitalize text-lg">{page}</h1>
          <div className="flex-1" />
          <button onClick={() => window.location.href='/onboarding'}
            className="bg-green text-dark font-syne font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#00ff7f] transition-colors">
            + New Bot
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function NavItem({ item, active, badge, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-green/10 text-white' : 'text-muted2 hover:text-text hover:bg-dark3'
      }`}>
      <span className="text-base">{item.icon}</span>
      <span className="flex-1 text-left font-syne">{item.label}</span>
      {badge > 0 && (
        <span className="bg-green/20 text-green text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}
