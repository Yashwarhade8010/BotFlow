import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  BotsAPI,
  ConversationsAPI,
  AnalyticsAPI,
  KnowledgeAPI,
} from "../services/api";
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { KPICard, BotStatusBadge, ConvStatusBadge, EmptyState, Spinner, Toggle, Modal, Button, Input } from '../components/ui/index';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { joinBot, joinConversation, on } = useSocket();
  const [page, setPage] = useState("overview");
  const [bots, setBots] = useState([]);
  const [activeBotId, setActiveBotId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const res = await BotsAPI.list();
      const list = res.data.data.bots || [];
      setBots(list);
      const active = list.find((b) => b.status === "active") || list[0];
      if (active) {
        setActiveBotId(active.id);
        joinBot(active.id);
      }
    } catch {
      toast.error("Failed to load bots");
    } finally {
      setLoading(false);
    }
  };

  const switchBot = (id) => {
    setActiveBotId(id);
    joinBot(id);
  };
  const activeBot = bots.find((b) => b.id === activeBotId);

  if (loading)
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  const pageMap = {
    overview: (
      <OverviewPanel
        bots={bots}
        activeBotId={activeBotId}
        user={user}
        setPage={setPage}
      />
    ),
    conversations: (
      <ConversationsPanel
        activeBotId={activeBotId}
        on={on}
        joinConversation={joinConversation}
      />
    ),
    analytics: <AnalyticsPanel activeBotId={activeBotId} />,
    knowledge: <KnowledgePanel activeBotId={activeBotId} />,
    bots: (
      <BotsPanel
        bots={bots}
        setBots={setBots}
        switchBot={switchBot}
        activeBotId={activeBotId}
      />
    ),
    settings: <SettingsPanel bot={activeBot} setBots={setBots} bots={bots} />,
  };

  return (
    <DashboardLayout
      page={page}
      setPage={setPage}
      bots={bots}
      activeBotId={activeBotId}
      setActiveBotId={switchBot}
    >
      {pageMap[page] || pageMap.overview}
    </DashboardLayout>
  );
}

// ── Overview ───────────────────────────────────────
function OverviewPanel({ bots, activeBotId, user, setPage }) {
  const [stats, setStats] = useState(null);
  const [volume, setVolume] = useState([]);
  const [convos, setConvos] = useState([]);

  useEffect(() => {
    AnalyticsAPI.overview(30)
      .then((r) => setStats(r.data.data))
      .catch(() => {});
    AnalyticsAPI.volume(activeBotId, 7)
      .then((r) => setVolume(r.data.data.volume || []))
      .catch(() => {});
    ConversationsAPI.list({ limit: 4 })
      .then((r) => setConvos(r.data.data || []))
      .catch(() => {});
  }, [activeBotId]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeUp">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white">
          {greeting}, <span className="text-green">{user?.firstName}</span> 👋
        </h2>
        <p className="text-muted2 mt-1 text-sm">
          Here's what's happening across your bots today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          icon="💬"
          label="Conversations"
          value={(stats?.totalConversations || 0).toLocaleString()}
          change={`${stats?.activeConversations || 0} active`}
        />
        <KPICard
          icon="✅"
          label="Resolution"
          value={`${stats?.resolutionRate || 0}%`}
        />
        <KPICard
          icon="⚡"
          label="Avg Response"
          value={`${stats?.avgResponseTimeSec || 0}s`}
        />
        <KPICard
          icon="⭐"
          label="Satisfaction"
          value={stats?.avgSatisfaction || "—"}
        />
      </div>

      {volume.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-syne font-bold text-white mb-4 text-sm sm:text-base">
            Conversation Volume — Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volume}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B8C80", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B8C80", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "#131C18",
                  border: "1px solid #1E2D27",
                  borderRadius: 8,
                  color: "#C8DDD6",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="conversations"
                fill="rgba(0,212,106,0.5)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="resolved"
                fill="rgba(0,212,106,0.15)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-syne font-bold text-white text-sm sm:text-base">
            My Bots
          </h3>
          <button
            onClick={() => setPage("bots")}
            className="text-green text-xs sm:text-sm hover:opacity-70"
          >
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bots.slice(0, 3).map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onClick={() => setPage("conversations")}
            />
          ))}
          {bots.length === 0 && (
            <EmptyState
              icon="🤖"
              title="No bots yet"
              description="Create your first bot"
              action={
                <a
                  href="/onboarding"
                  className="btn-primary inline-block px-5 py-2.5 text-sm"
                >
                  Create Bot →
                </a>
              }
            />
          )}
        </div>
      </div>

      {convos.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-syne font-bold text-white text-sm sm:text-base">
              Recent Conversations
            </h3>
            <button
              onClick={() => setPage("conversations")}
              className="text-green text-xs sm:text-sm hover:opacity-70"
            >
              View all →
            </button>
          </div>
          <div className="card overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold text-muted uppercase tracking-widest border-b border-border">
              <span className="col-span-2">Customer</span>
              <span>Last Message</span>
              <span>Status</span>
              <span>Bot</span>
            </div>
            {convos.map((c) => (
              <div
                key={c.id}
                onClick={() => setPage("conversations")}
                className="cursor-pointer hover:bg-dark3/50 transition-colors border-b border-border/50 last:border-0"
              >
                {/* Mobile layout */}
                <div className="sm:hidden flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-green/20 rounded-full flex items-center justify-center text-green font-bold text-sm shrink-0">
                    {(c.customerName ||
                      c.customerWaId ||
                      "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {c.customerName || "Unknown"}
                      </span>
                      <ConvStatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-muted2 truncate mt-0.5">
                      {c.messages?.[c.messages.length - 1]?.content?.substring(
                        0,
                        50
                      ) || "—"}
                    </div>
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-4">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green/20 rounded-full flex items-center justify-center text-green font-bold text-sm shrink-0">
                      {(c.customerName ||
                        c.customerWaId ||
                        "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {c.customerName || "Unknown"}
                      </div>
                      <div className="text-xs text-muted">{c.customerWaId}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted2 truncate self-center">
                    {c.messages?.[c.messages.length - 1]?.content?.substring(
                      0,
                      40
                    ) || "—"}
                  </div>
                  <div className="self-center">
                    <ConvStatusBadge status={c.status} />
                  </div>
                  <div className="text-sm text-muted2 self-center truncate">
                    {c.bot?.name || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Conversations ──────────────────────────────────
function ConversationsPanel({ activeBotId, on, joinConversation }) {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showChat, setShowChat] = useState(false); // mobile: show chat pane
  const bodyRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (activeBotId) params.botId = activeBotId;
      if (filter !== "all") params.status = filter;
      const res = await ConversationsAPI.list(params);
      const list = res.data.data || [];
      setConvos(list);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeBotId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!on) return;
    const unsub = on("conversation:message", (data) => {
      if (data.conversationId === active?.id) {
        setMessages((m) => [...m, data.message]);
        setTimeout(
          () => bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight),
          50
        );
      }
      load();
    });
    return unsub;
  }, [on, active, load]);

  const openConvo = async (c) => {
    setActive(c);
    setShowChat(true);
    joinConversation?.(c.id);
    try {
      const res = await ConversationsAPI.get(c.id);
      setMessages(res.data.data.conversation.messages || []);
      setTimeout(
        () => bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight),
        50
      );
    } catch {}
  };

  const sendReply = async () => {
    if (!input.trim() || !active) return;
    const text = input;
    setInput("");
    setReplying(true);
    try {
      await ConversationsAPI.reply(active.id, text);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send");
      setInput(text);
    } finally {
      setReplying(false);
    }
  };

  const resolve = async () => {
    if (!active) return;
    try {
      await ConversationsAPI.resolve(active.id);
      toast.success("Resolved ✓");
      load();
    } catch {}
  };

  const handoff = async () => {
    if (!active) return;
    try {
      await ConversationsAPI.handoff(active.id);
      toast.success("Escalated");
      load();
    } catch {}
  };

  const FILTERS = ["all", "active", "resolved", "escalated"];

  return (
    <div className="animate-fadeUp">
      {/* ── Mobile: show list OR chat ── */}
      <div className="lg:hidden">
        {!showChat ? (
          /* Mobile list */
          <div className="space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    filter === f
                      ? "bg-green text-dark"
                      : "bg-dark3 text-muted2 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
            {!loading && convos.length === 0 && (
              <EmptyState
                icon="💬"
                title="No conversations"
                description="Conversations will appear here once customers message your bot."
              />
            )}
            <div className="space-y-2">
              {convos.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openConvo(c)}
                  className="card p-4 cursor-pointer hover:border-green/20 transition-colors active:bg-dark3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green/15 rounded-full flex items-center justify-center font-bold text-green shrink-0">
                      {(c.customerName ||
                        c.customerWaId ||
                        "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-white truncate">
                          {c.customerName || c.customerWaId || "Unknown"}
                        </span>
                        <span className="text-xs text-muted shrink-0">
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="text-xs text-muted2 truncate mb-1">
                        {c.messages?.[
                          c.messages.length - 1
                        ]?.content?.substring(0, 50) || "No messages"}
                      </div>
                      <div className="flex items-center gap-2">
                        <ConvStatusBadge status={c.status} />
                        {c.platform === "telegram" && (
                          <span className="text-xs text-blue-400">✈️</span>
                        )}
                      </div>
                    </div>
                    <span className="text-muted text-xs shrink-0">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Mobile chat */
          <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Back button */}
            <button
              onClick={() => setShowChat(false)}
              className="flex items-center gap-2 text-sm text-muted2 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft size={16} /> Back to conversations
            </button>

            <div className="card flex flex-col flex-1 overflow-hidden">
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green/15 rounded-full flex items-center justify-center font-bold text-green text-sm shrink-0">
                    {(active?.customerName || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {active?.customerName || active?.customerWaId}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {active?.customerWaId}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {active?.status !== "resolved" && (
                    <button
                      onClick={resolve}
                      className="flex-1 btn-secondary text-xs py-1.5"
                    >
                      ✓ Resolve
                    </button>
                  )}
                  {active?.status !== "escalated" && (
                    <button
                      onClick={handoff}
                      className="flex-1 btn-secondary text-xs py-1.5"
                    >
                      ⚡ Handoff
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role !== "user" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-green text-dark font-medium rounded-br-sm"
                          : m.role === "assistant"
                          ? "bg-dark3 border border-border text-text rounded-bl-sm"
                          : "bg-yellow/10 border border-yellow/30 text-text rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                      <div
                        className={`text-xs mt-1 opacity-60 ${
                          m.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {m.role === "agent" ? "🧑 · " : ""}
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-border flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Reply as agent..."
                  className="flex-1 bg-dark3 border border-border rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-green transition-colors placeholder:text-muted"
                />
                <button
                  onClick={sendReply}
                  disabled={replying || !input.trim()}
                  className="w-10 h-10 bg-green text-dark rounded-xl font-bold text-sm hover:bg-[#00ff7f] transition-colors disabled:opacity-50 shrink-0"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden lg:flex gap-4 h-[calc(100vh-7rem)]">
        {/* List */}
        <div className="w-80 shrink-0 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    filter === f
                      ? "bg-green text-dark"
                      : "bg-dark3 text-muted2 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
            {!loading && convos.length === 0 && (
              <EmptyState
                icon="💬"
                title="No conversations"
                description="Conversations will appear here once customers message your bot."
              />
            )}
            {convos.map((c) => (
              <div
                key={c.id}
                onClick={() => openConvo(c)}
                className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${
                  active?.id === c.id
                    ? "bg-green/5 border-l-2 border-l-green"
                    : "hover:bg-dark3/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green/15 rounded-full flex items-center justify-center font-bold text-green text-sm shrink-0">
                    {(c.customerName ||
                      c.customerWaId ||
                      "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-sm text-white truncate">
                        {c.customerName || c.customerWaId || "Unknown"}
                      </span>
                      <span className="text-xs text-muted shrink-0 ml-2">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="text-xs text-muted2 truncate mb-1">
                      {c.messages?.[c.messages.length - 1]?.content?.substring(
                        0,
                        40
                      ) || "No messages"}
                    </div>
                    <div className="flex items-center gap-2">
                      <ConvStatusBadge status={c.status} />
                      {c.platform === "telegram" && (
                        <span className="text-xs text-blue-400">✈️</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {active ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 bg-green/15 rounded-full flex items-center justify-center font-bold text-green shrink-0">
                  {(active.customerName || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">
                    {active.customerName || active.customerWaId}
                  </div>
                  <div className="text-xs text-muted">
                    {active.customerWaId} · {active.bot?.name}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {active.status !== "resolved" && (
                    <button
                      onClick={resolve}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      ✓ Resolve
                    </button>
                  )}
                  {active.status !== "escalated" && (
                    <button
                      onClick={handoff}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      ⚡ Handoff
                    </button>
                  )}
                </div>
              </div>
              <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto p-5 space-y-3"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      m.role !== "user" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-green text-dark font-medium rounded-br-sm"
                          : m.role === "assistant"
                          ? "bg-dark3 border border-border text-text rounded-bl-sm"
                          : "bg-yellow/10 border border-yellow/30 text-text rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                      <div
                        className={`text-xs mt-1 opacity-60 ${
                          m.role === "user" ? "text-right" : ""
                        }`}
                      >
                        {m.role === "agent" ? "🧑 Agent · " : ""}
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-border flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Reply as agent (overrides bot)..."
                  className="flex-1 bg-dark3 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-green transition-colors placeholder:text-muted"
                />
                <button
                  onClick={sendReply}
                  disabled={replying || !input.trim()}
                  className="w-10 h-10 bg-green text-dark rounded-xl font-bold text-sm hover:bg-[#00ff7f] transition-colors disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon="💬"
              title="Select a conversation"
              description="Click a conversation on the left to view messages."
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Analytics ──────────────────────────────────────
function AnalyticsPanel({ activeBotId }) {
  const [overview, setOverview] = useState(null);
  const [botStats, setBotStats] = useState(null);
  const [volume, setVolume] = useState([]);

  useEffect(() => {
    AnalyticsAPI.overview(30).then(r => setOverview(r.data.data)).catch(() => {});
    if (activeBotId) {
      AnalyticsAPI.bot(activeBotId, 30).then(r => setBotStats(r.data.data)).catch(() => {});
      AnalyticsAPI.volume(activeBotId, 30)
        .then((r) => setVolume(r.data.data.volume || []))
        .catch(() => {});
    }
  }, [activeBotId]);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeUp">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white">
          Analytics
        </h2>
        <p className="text-muted2 text-sm">
          Performance metrics · Last 30 days
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          icon="💬"
          label="Conversations"
          value={(overview?.totalConversations || 0).toLocaleString()}
        />
        <KPICard
          icon="✅"
          label="Resolution"
          value={`${overview?.resolutionRate || 0}%`}
        />
        <KPICard
          icon="⚡"
          label="Avg Response"
          value={`${overview?.avgResponseTimeSec || 0}s`}
        />
        <KPICard
          icon="⚠"
          label="Handoffs"
          value={`${overview?.escalatedConversations || 0}`}
        />
      </div>
      {volume.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-syne font-bold text-white mb-4 text-sm sm:text-base">
            30-Day Volume
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volume}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#6B8C80", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B8C80", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "#131C18",
                  border: "1px solid #1E2D27",
                  borderRadius: 8,
                  color: "#C8DDD6",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="conversations"
                fill="rgba(0,212,106,0.5)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {botStats && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-syne font-bold text-white mb-4 text-sm sm:text-base">
            Bot Stats — {botStats.bot?.name}
          </h3>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                label: "Conversations",
                value: botStats.totals?.conversations || 0,
              },
              { label: "Messages", value: botStats.totals?.messages || 0 },
              {
                label: "Tokens Used",
                value: (botStats.totals?.tokensUsed || 0).toLocaleString(),
              },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xl sm:text-2xl font-extrabold font-syne text-white">
                  {value}
                </div>
                <div className="text-xs text-muted2 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Knowledge Base ─────────────────────────────────
function KnowledgePanel({ activeBotId }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("file");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [textName, setTextName] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!activeBotId) return setLoading(false);
    try {
      const res = await KnowledgeAPI.list(activeBotId);
      setSources(res.data.data.sources || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeBotId]);

  const handleUpload = async () => {
    setUploading(true);
    try {
      if (tab === "file" && file) await KnowledgeAPI.upload(activeBotId, file);
      else if (tab === "text" && text.length >= 20)
        await KnowledgeAPI.addText(
          activeBotId,
          text,
          textName || "Pasted text"
        );
      else if (tab === "url" && url)
        await KnowledgeAPI.addUrl(activeBotId, url, url);
      else {
        toast.error("Please fill the required field");
        setUploading(false);
        return;
      }
      toast.success("Source added — indexing in background");
      setShowModal(false);
      setFile(null);
      setText("");
      setUrl("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteSource = async (srcId) => {
    if (!confirm("Delete this source?")) return;
    try {
      await KnowledgeAPI.delete(activeBotId, srcId);
      load();
      toast.success("Deleted");
    } catch {}
  };

  const typeIcon = {
    pdf: "📄",
    txt: "📝",
    docx: "📄",
    csv: "📊",
    url: "🌐",
    text: "📝",
  };
  const statusClass = {
    indexed: "text-green",
    processing: "text-yellow",
    pending: "text-yellow",
    failed: "text-red",
  };
  const statusLabel = {
    indexed: "✓ Indexed",
    processing: "⟳ Processing",
    pending: "⏳ Pending",
    failed: "✗ Failed",
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeUp">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white">
            Knowledge Base
          </h2>
          <p className="text-muted2 text-sm">
            Files and content your bots learn from
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0 text-sm">
          + Add Source
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No sources yet"
          description="Upload files, paste text or add a URL to train your bot."
          action={
            <Button onClick={() => setShowModal(true)}>Add First Source</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sources.map((s) => (
            <div key={s.id} className="card p-4 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                {typeIcon[s.type] || "📄"}
              </div>
              <div className="font-semibold text-white text-sm mb-1 truncate">
                {s.name}
              </div>
              <div className="flex justify-between text-xs text-muted mb-2">
                <span>
                  {s.fileSize ? `${(s.fileSize / 1024).toFixed(1)} KB` : s.type}
                </span>
                <span>{timeAgo(s.createdAt)}</span>
              </div>
              <div
                className={`text-xs font-semibold mb-3 ${
                  statusClass[s.status] || ""
                }`}
              >
                {statusLabel[s.status] || s.status}
                {s.chunkCount > 0 && ` · ${s.chunkCount} chunks`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    KnowledgeAPI.reindex(activeBotId, s.id).then(() => {
                      toast.success("Re-indexing...");
                      setTimeout(load, 2000);
                    })
                  }
                  className="flex-1 text-xs bg-dark3 border border-border text-muted2 py-1.5 rounded-lg hover:text-white transition-colors"
                >
                  Re-index
                </button>
                <button
                  onClick={() => deleteSource(s.id)}
                  className="text-xs border border-red/30 text-red py-1.5 px-3 rounded-lg hover:bg-red/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Knowledge Source" onClose={() => setShowModal(false)}>
          <div className="flex gap-1 bg-dark3 p-1 rounded-xl mb-5">
            {[
              ["file", "📄 File"],
              ["text", "📝 Text"],
              ["url", "🌐 URL"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-2 rounded-lg text-sm font-syne font-bold transition-colors ${
                  tab === id
                    ? "bg-green text-dark"
                    : "text-muted2 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "file" && (
            <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-green/40 transition-colors">
              <input
                type="file"
                accept=".pdf,.txt,.docx,.csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <span className="text-3xl block mb-2">📂</span>
              {file ? (
                <p className="text-green font-medium text-sm">{file.name}</p>
              ) : (
                <p className="text-muted text-sm">Tap to choose file</p>
              )}
            </label>
          )}
          {tab === "text" && (
            <div className="space-y-3">
              <Input
                placeholder="Source name..."
                value={textName}
                onChange={(e) => setTextName(e.target.value)}
              />
              <textarea
                className="input min-h-[120px]"
                placeholder="Paste FAQ, product info..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}
          {tab === "url" && (
            <Input
              type="url"
              placeholder="https://yoursite.com/faq"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}
          <Button
            loading={uploading}
            onClick={handleUpload}
            className="w-full mt-5"
          >
            Add Source
          </Button>
        </Modal>
      )}
    </div>
  );
}

// ── Bots ───────────────────────────────────────────
function BotsPanel({ bots, setBots, switchBot }) {
  const toggleStatus = async (bot) => {
    const newStatus = bot.status === "active" ? "paused" : "active";
    try {
      await BotsAPI.setStatus(bot.id, newStatus);
      setBots((prev) =>
        prev.map((b) => (b.id === bot.id ? { ...b, status: newStatus } : b))
      );
      toast.success(`Bot ${newStatus}`);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  const deleteBot = async (bot) => {
    if (!confirm(`Delete "${bot.name}"? This cannot be undone.`)) return;
    try {
      await BotsAPI.delete(bot.id);
      setBots((prev) => prev.filter((b) => b.id !== bot.id));
      toast.success("Bot deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeUp">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white">
          My Bots
        </h2>
        <p className="text-muted2 text-sm">Manage all your bots</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {bots.map((bot) => (
          <BotCard
            key={bot.id}
            bot={bot}
            showActions
            onToggle={() => toggleStatus(bot)}
            onDelete={() => deleteBot(bot)}
          />
        ))}
        <a
          href="/onboarding"
          className="card p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] border-dashed hover:border-green/40 transition-colors no-underline"
        >
          <span className="text-3xl sm:text-4xl mb-3">+</span>
          <div className="font-syne font-bold text-muted2 text-sm sm:text-base">
            Create New Bot
          </div>
          <div className="text-xs sm:text-sm text-muted mt-1">
            Set up in 3 minutes
          </div>
        </a>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────
function SettingsPanel({ bot, setBots, bots }) {
  const [form, setForm] = useState({
    name: "",
    welcomeMessage: "",
    aiModel: "claude-3-5-sonnet-20241022",
    settings: {},
  });
  const [saving, setSaving] = useState(false);
  const [tgToken, setTgToken] = useState("");
  const [tgConnecting, setTgConnecting] = useState(false);

  useEffect(() => {
    if (bot)
      setForm({
        name: bot.name || "",
        welcomeMessage: bot.welcomeMessage || "",
        aiModel: bot.aiModel || "claude-3-5-sonnet-20241022",
        settings: bot.settings || {},
      });
  }, [bot]);

  const save = async () => {
    if (!bot) return;
    setSaving(true);
    try {
      const res = await BotsAPI.update(bot.id, form);
      const updated = res.data.data.bot;
      setBots((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success("Settings saved ✓");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const connectTelegram = async () => {
    if (!tgToken) return toast.error("Enter a bot token");
    setTgConnecting(true);
    try {
      await BotsAPI.connectTelegram(bot.id, { botToken: tgToken });
      toast.success("Telegram connected!");
      setTgToken("");
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setTgConnecting(false);
    }
  };

  const disconnectTelegram = async () => {
    try {
      await BotsAPI.disconnectTelegram(bot.id);
      toast.success("Telegram disconnected");
      setBots((prev) =>
        prev.map((b) =>
          b.id === bot.id
            ? { ...b, tgConnected: false, tgBotUsername: null }
            : b
        )
      );
    } catch (e) {
      toast.error(e.message);
    }
  };

  const setSetting = (k, v) =>
    setForm((f) => ({ ...f, settings: { ...f.settings, [k]: v } }));

  if (!bot)
    return (
      <EmptyState
        icon="⚙"
        title="No bot selected"
        description="Select a bot from the sidebar."
      />
    );

  const modelNames = {
    "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
    "gpt-4o": "GPT-4o",
    "groq-llama-3.3-70b-versatile": "Llama 3.3 70B (Groq)",
    "groq-mixtral-8x7b-32768": "Mixtral 8x7B (Groq)",
    "gemini-1.5-flash": "Gemini Flash",
  };

  return (
    <div className="max-w-2xl space-y-5 sm:space-y-6 animate-fadeUp">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white">
          Settings
        </h2>
        <p className="text-muted2 text-sm">Configure {bot.name}</p>
      </div>

      {/* Bot config */}
      <div className="card p-4 sm:p-6 space-y-4">
        <h3 className="font-syne font-bold text-white">Bot Configuration</h3>
        <Input
          label="Bot Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <div>
          <label className="label">AI Model</label>
          <select
            className="input"
            value={form.aiModel}
            onChange={(e) =>
              setForm((f) => ({ ...f, aiModel: e.target.value }))
            }
          >
            {Object.entries(modelNames).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Welcome Message</label>
          <textarea
            className="input min-h-[90px] sm:min-h-[100px]"
            value={form.welcomeMessage}
            onChange={(e) =>
              setForm((f) => ({ ...f, welcomeMessage: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Behaviour */}
      <div className="card p-4 sm:p-6 space-y-3">
        <h3 className="font-syne font-bold text-white mb-1">Behaviour</h3>
        {[
          {
            k: "autoLanguageDetection",
            label: "Auto Language Detection",
            sub: "Reply in the customer's language",
          },
          {
            k: "humanHandoff",
            label: "Human Handoff",
            sub: "Escalate when bot is unsure",
          },
          {
            k: "collectLeadInfo",
            label: "Collect Lead Info",
            sub: "Ask for name & email first",
          },
          {
            k: "afterHoursEnabled",
            label: "After-hours Message",
            sub: "Send custom message outside hours",
          },
        ].map(({ k, label, sub }) => (
          <div
            key={k}
            className="flex items-center justify-between p-3.5 sm:p-4 bg-dark3/60 rounded-xl gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-muted2 hidden sm:block">{sub}</div>
            </div>
            <Toggle
              checked={!!form.settings?.[k]}
              onChange={(v) => setSetting(k, v)}
            />
          </div>
        ))}
      </div>

      {/* Telegram */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-syne font-bold text-white mb-1">Telegram</h3>
        <p className="text-muted2 text-sm mb-4">
          Connect a Telegram bot to receive and reply to messages.
        </p>
        {bot.telegram?.connected ? (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-dark3/60 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green shrink-0" />
              <span className="text-white text-sm font-semibold">
                @{bot.telegram.username} connected
              </span>
            </div>
            <button
              onClick={disconnectTelegram}
              className="btn-danger text-sm px-4 py-2 w-full sm:w-auto"
            >
              Disconnect Telegram
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Telegram Bot Token"
              placeholder="7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              className="font-mono text-xs"
            />
            <button
              onClick={connectTelegram}
              disabled={tgConnecting}
              className="btn-primary text-sm px-4 py-2 w-full sm:w-auto disabled:opacity-50"
            >
              {tgConnecting ? "Connecting..." : "Connect Telegram"}
            </button>
          </div>
        )}
      </div>
      {/* WhatsApp Webhook Info */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-syne font-bold text-white mb-1">
          WhatsApp Webhook
        </h3>
        <p className="text-muted2 text-sm mb-4">
          Use these values in Meta App → WhatsApp → Configuration.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">Callback URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-dark3 border border-border rounded-lg px-3 py-2 text-xs text-green font-mono truncate">
                {bot.whatsapp?.webhookUrl || "—"}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bot.whatsapp?.webhookUrl || "");
                  toast.success("Copied!");
                }}
                className="btn-secondary text-xs px-3 py-2 shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="label">Verify Token</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-dark3 border border-border rounded-lg px-3 py-2 text-xs text-green font-mono truncate">
                {bot.whatsapp?.verifyToken || "—"}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    bot.whatsapp?.verifyToken || ""
                  );
                  toast.success("Copied!");
                }}
                className="btn-secondary text-xs px-3 py-2 shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Danger zone */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-syne font-bold text-red mb-4 flex items-center gap-2 text-sm sm:text-base">
          <AlertTriangle size={16} /> Danger Zone
        </h3>
        <button
          onClick={async () => {
            const ns = bot.status === "active" ? "paused" : "active";
            await BotsAPI.setStatus(bot.id, ns);
            setBots((prev) =>
              prev.map((b) => (b.id === bot.id ? { ...b, status: ns } : b))
            );
            toast.success(`Bot ${ns}`);
          }}
          className="btn-danger text-sm px-4 py-2 w-full sm:w-auto"
        >
          {bot.status === "active" ? "Pause Bot" : "Resume Bot"}
        </button>
      </div>

      <Button loading={saving} onClick={save} className="w-full">
        Save Changes
      </Button>
    </div>
  );
}

// ── BotCard ────────────────────────────────────────
function BotCard({ bot, onClick, showActions, onToggle, onDelete }) {
  const modelIcon = {
    "claude-3-5-sonnet-20241022": "✦",
    "gpt-4o": "🧠",
    "gemini-1.5-flash": "💎",
    "groq-llama-3.3-70b-versatile": "⚡",
  };
  const modelName = {
    "claude-3-5-sonnet-20241022": "Claude 3.5",
    "gpt-4o": "GPT-4o",
    "gemini-1.5-flash": "Gemini",
    "groq-llama-3.3-70b-versatile": "Llama 3.3",
  };
  return (
    <div
      className="card p-4 sm:p-5 cursor-pointer hover:border-border2 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green/15 rounded-xl flex items-center justify-center font-syne font-bold text-green text-sm sm:text-base shrink-0">
          {bot.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-bold text-white text-sm truncate">
            {bot.name}
          </div>
          <div className="text-xs text-muted truncate">
            {bot.businessName || "—"}
          </div>
        </div>
        <BotStatusBadge status={bot.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-dark3/60 rounded-lg p-2 sm:p-2.5 text-center">
          <div className="font-syne font-bold text-white text-sm sm:text-base">
            {(bot.stats?.totalConversations || 0).toLocaleString()}
          </div>
          <div className="text-xs text-muted">Conversations</div>
        </div>
        <div className="bg-dark3/60 rounded-lg p-2 sm:p-2.5 text-center">
          <div className="font-syne font-bold text-white text-sm sm:text-base">
            {bot.stats?.resolutionRate || 0}%
          </div>
          <div className="text-xs text-muted">Resolved</div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted2 truncate">
          {modelIcon[bot.aiModel] || "🤖"}{" "}
          {modelName[bot.aiModel] || bot.aiModel}
        </span>
        {showActions && (
          <div
            className="flex gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onToggle}
              className="text-xs bg-dark3 border border-border px-2 py-1 rounded text-muted2 hover:text-white"
            >
              {bot.status === "active" ? "⏸" : "▶"}
            </button>
            <button
              onClick={onDelete}
              className="text-xs border border-red/20 px-2 py-1 rounded text-red/70 hover:text-red hover:border-red/40"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}