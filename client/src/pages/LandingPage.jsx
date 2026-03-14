import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI-Powered Responses",
    desc: "Claude, GPT-4o, and Gemini Pro. Auto-switches to the right model.",
  },
  {
    icon: "📚",
    title: "Smart Knowledge Base",
    desc: "Upload PDFs, docs or URLs. Your bot learns everything instantly.",
  },
  {
    icon: "⚡",
    title: "Human Handoff",
    desc: "Bot escalates to your team when it's not confident.",
  },
  {
    icon: "📊",
    title: "Deep Analytics",
    desc: "Track conversations, resolutions, and customer satisfaction.",
  },
  {
    icon: "🌍",
    title: "Auto Language Detection",
    desc: "Your bot replies in the customer's language, automatically.",
  },
  {
    icon: "🔗",
    title: "Meta Cloud API",
    desc: "Official WhatsApp Business API. No unofficial clients.",
  },
];

const STATS = [
  { value: "10k+", label: "Messages / day" },
  { value: "98%", label: "Uptime" },
  { value: "3 min", label: "Setup time" },
  { value: "5★", label: "Avg rating" },
];

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark text-text font-dm">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-dark/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 font-syne font-extrabold text-lg text-white">
            <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-sm shadow-[0_0_12px_rgba(0,212,106,0.4)]">
              💬
            </div>
            BotFlow
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary py-2 px-5 text-sm">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-muted2 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary py-2 px-5 text-sm">
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-muted hover:text-white p-1.5 rounded-lg hover:bg-dark3 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-border bg-dark2 px-4 py-4 space-y-3">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="btn-primary w-full py-3 text-sm text-center block"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-center text-muted2 hover:text-white text-sm font-medium py-2 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary w-full py-3 text-sm text-center block"
                  onClick={() => setMenuOpen(false)}
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <div className="relative text-center py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-green/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,212,106,.03) 1px, transparent 1px), linear-gradient(90deg,rgba(0,212,106,.03) 1px,transparent 1px)",
              backgroundSize: "40px 40px sm:60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block bg-green/10 border border-green/30 text-green text-xs font-semibold px-3 py-1.5 rounded-full mb-5 sm:mb-6 tracking-wider font-syne">
            🚀 WHATSAPP AI CHATBOT PLATFORM
          </span>

          <h1 className="font-syne font-extrabold text-4xl sm:text-5xl lg:text-7xl text-white leading-tight mb-5 sm:mb-6">
            Turn WhatsApp into your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green to-[#00ff7f]">
              24/7 sales team
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted2 max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
            Build AI-powered WhatsApp bots trained on your own data. Handle
            customer queries, collect leads, and book appointments —
            automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              to="/signup"
              className="btn-primary px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base inline-block w-full sm:w-auto"
            >
              Start for Free — No Credit Card →
            </Link>
            <a
              href="#features"
              className="btn-secondary px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base inline-block w-full sm:w-auto"
            >
              See How It Works ↓
            </a>
          </div>

          <p className="text-muted text-xs sm:text-sm mt-4 sm:mt-5">
            14-day free trial · Set up in 3 minutes · Cancel anytime
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mt-12 sm:mt-16 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-dark2 border border-border rounded-xl p-3 sm:p-4"
              >
                <div className="font-syne font-extrabold text-xl sm:text-2xl text-white">
                  {s.value}
                </div>
                <div className="text-xs text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20"
      >
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-syne font-extrabold text-2xl sm:text-4xl text-white mb-3 sm:mb-4">
            Everything you need
          </h2>
          <p className="text-muted2 text-sm sm:text-lg">
            A complete platform to build, train, and deploy WhatsApp AI bots.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-5 sm:p-7 hover:border-border2 transition-colors"
            >
              <span className="text-2xl sm:text-3xl block mb-3 sm:mb-4">
                {f.icon}
              </span>
              <h3 className="font-syne font-bold text-white text-base sm:text-lg mb-1.5 sm:mb-2">
                {f.title}
              </h3>
              <p className="text-muted2 text-xs sm:text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-syne font-extrabold text-2xl sm:text-4xl text-white mb-3 sm:mb-4">
            Up and running in minutes
          </h2>
          <p className="text-muted2 text-sm sm:text-lg">No code required.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          {[
            {
              n: "01",
              title: "Connect WhatsApp",
              desc: "Link your Meta Business number via the official Cloud API.",
            },
            {
              n: "02",
              title: "Train your bot",
              desc: "Upload your FAQs, product docs, and policies.",
            },
            {
              n: "03",
              title: "Go live",
              desc: "Your bot handles customer queries 24/7 automatically.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="card p-5 sm:p-6 flex sm:flex-col gap-4 sm:gap-0"
            >
              <div className="font-syne font-extrabold text-3xl sm:text-4xl text-green/20 shrink-0 sm:mb-3">
                {s.n}
              </div>
              <div>
                <h3 className="font-syne font-bold text-white text-base sm:text-lg mb-1 sm:mb-2">
                  {s.title}
                </h3>
                <p className="text-muted2 text-xs sm:text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <div className="card p-8 sm:p-14">
          <h2 className="font-syne font-extrabold text-2xl sm:text-4xl text-white mb-3 sm:mb-4">
            Ready to start?
          </h2>
          <p className="text-muted2 text-sm sm:text-base mb-6 sm:mb-8">
            Join businesses already using BotFlow to automate their WhatsApp
            support.
          </p>
          <Link
            to="/signup"
            className="btn-primary px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base inline-block w-full sm:w-auto"
          >
            Create Your Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-6 sm:py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted">
          <div className="flex items-center gap-2 font-syne font-bold text-white">
            <div className="w-5 h-5 bg-green rounded-full flex items-center justify-center text-xs">
              💬
            </div>
            BotFlow
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {["Privacy", "Terms", "API Docs", "Support"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-white transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
          <span className="text-xs sm:text-sm">© 2025 BotFlow</span>
        </div>
      </footer>
    </div>
  );
}
