import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { BotStatusBadge } from "../ui/index";
import { Menu, X, ChevronDown, LogOut, Plus, Hexagon } from "lucide-react";

const NAV = [
  { key: "overview", icon: "⬡", label: "Overview" },
  {
    key: "conversations",
    icon: "💬",
    label: "Conversations",
    badgeKey: "active",
  },
  { key: "analytics", icon: "📊", label: "Analytics" },
  {
    key: "knowledge",
    icon: "📚",
    label: "Knowledge Base",
    badgeKey: "processing",
  },
  { key: "bots", icon: "🤖", label: "My Bots" },
  { key: "settings", icon: "⚙", label: "Settings" },
];

const PAGE_ICONS = {
  overview: "⬡",
  conversations: "💬",
  analytics: "📊",
  knowledge: "📚",
  bots: "🤖",
  settings: "⚙",
};

export function DashboardLayout({
  page,
  setPage,
  bots,
  activeBotId,
  setActiveBotId,
  badges = {},
  children,
}) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const botMenuRef = useRef(null);
  const activeBot = bots?.find((b) => b.id === activeBotId);

  // Close bot menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (botMenuRef.current && !botMenuRef.current.contains(e.target)) {
        setBotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [page]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const navigate = (key) => {
    setPage(key);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-syne font-extrabold text-lg text-white">
          <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,212,106,0.4)]">
            💬
          </div>
          BotFlow
        </div>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden text-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-dark3"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Bot Switcher */}
      <div className="px-4 mb-5" ref={botMenuRef}>
        <div className="relative">
          <button
            onClick={() => setBotMenuOpen(!botMenuOpen)}
            className="w-full bg-dark3 border border-border rounded-xl px-3.5 py-3 flex items-center gap-3 hover:border-green/30 transition-all group"
          >
            <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm shrink-0">
              {activeBot?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold font-syne text-white truncate">
                {activeBot?.name || "Select a bot..."}
              </div>
              {activeBot && <BotStatusBadge status={activeBot.status} />}
            </div>
            <ChevronDown
              size={14}
              className={`text-muted shrink-0 transition-transform duration-200 ${
                botMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Bot dropdown */}
          {botMenuOpen && bots?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-dark2 border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
              {bots.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    setActiveBotId(bot.id);
                    setBotMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-dark3 transition-colors text-left ${
                    bot.id === activeBotId ? "bg-green/5" : ""
                  }`}
                >
                  <div className="w-7 h-7 bg-green/15 rounded-full flex items-center justify-center font-syne font-bold text-green text-xs shrink-0">
                    {bot.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {bot.name}
                    </div>
                    <BotStatusBadge status={bot.status} />
                  </div>
                  {bot.id === activeBotId && (
                    <span className="text-green text-xs">✓</span>
                  )}
                </button>
              ))}
              <div className="border-t border-border">
                <button
                  onClick={() => {
                    window.location.href = "/onboarding";
                    setBotMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-dark3 transition-colors text-muted2 hover:text-white text-sm"
                >
                  <div className="w-7 h-7 bg-dark3 border border-border rounded-full flex items-center justify-center text-xs">
                    +
                  </div>
                  New Bot
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="px-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 px-2">
          Main
        </p>
        <nav className="space-y-0.5 mb-5">
          {NAV.slice(0, 4).map((n) => (
            <NavItem
              key={n.key}
              item={n}
              active={page === n.key}
              badge={badges[n.badgeKey]}
              onClick={() => navigate(n.key)}
            />
          ))}
        </nav>

        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 px-2">
          Bot
        </p>
        <nav className="space-y-0.5">
          {NAV.slice(4).map((n) => (
            <NavItem
              key={n.key}
              item={n}
              active={page === n.key}
              onClick={() => navigate(n.key)}
            />
          ))}
          <button
            onClick={() => (window.location.href = "/onboarding")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted2 hover:text-white hover:bg-dark3 transition-colors text-sm font-medium font-syne"
          >
            <span className="text-base w-5 text-center">+</span>
            <span>New Bot</span>
          </button>
        </nav>
      </div>

      {/* User card */}
      <div className="mt-auto p-4 border-t border-border mx-2 mb-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-dark3 transition-colors group">
          <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm shrink-0">
            {user?.firstName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted capitalize">
              {user?.plan || "free"} Plan
            </div>
          </div>
          <button
            onClick={logout}
            className="text-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-dark">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static, mobile: slide-in drawer */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-[260px] bg-dark2 border-r border-border z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-dark/90 backdrop-blur-md border-b border-border sticky top-0 z-30 px-4 sm:px-6 flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden text-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-dark3 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2">
            <span className="text-base hidden sm:block">
              {PAGE_ICONS[page]}
            </span>
            <h1 className="font-syne font-bold text-white capitalize text-base sm:text-lg">
              {page}
            </h1>
          </div>

          {/* Active bot indicator — mobile */}
          {activeBot && (
            <div className="flex items-center gap-1.5 ml-1 sm:hidden">
              <span className="text-muted text-xs">·</span>
              <span className="text-xs text-muted2 truncate max-w-[80px]">
                {activeBot.name}
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Active bot badge — tablet+ */}
            {activeBot && (
              <div className="hidden sm:flex items-center gap-2 bg-dark3 border border-border rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                <span className="text-xs font-semibold text-white font-syne truncate max-w-[120px]">
                  {activeBot.name}
                </span>
              </div>
            )}

            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="bg-green text-dark font-syne font-bold text-xs px-3 py-2 sm:px-4 rounded-lg hover:bg-[#00ff7f] transition-colors flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(0,212,106,0.2)]"
            >
              <Plus size={12} />
              <span className="hidden sm:inline">New Bot</span>
              <span className="sm:hidden">Bot</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ item, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium font-syne transition-all
        ${
          active
            ? "bg-green/10 text-white border border-green/20 shadow-[inset_0_1px_0_rgba(0,212,106,0.1)]"
            : "text-muted2 hover:text-white hover:bg-dark3 border border-transparent"
        }
      `}
    >
      <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {badge > 0 && (
        <span className="bg-green/20 text-green text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
