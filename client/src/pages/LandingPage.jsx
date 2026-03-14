import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const FEATURES = [
    { icon:'🤖', title:'AI-Powered Responses',    desc:'Claude, GPT-4o, and Gemini Pro. Auto-switches to the right model.' },
    { icon:'📚', title:'Smart Knowledge Base',    desc:'Upload PDFs, docs or URLs. Your bot learns everything instantly.' },
    { icon:'⚡', title:'Human Handoff',           desc:'Bot escalates to your team when it\'s not confident.' },
    { icon:'📊', title:'Deep Analytics',          desc:'Track conversations, resolutions, and customer satisfaction.' },
    { icon:'🌍', title:'Auto Language Detection', desc:'Your bot replies in the customer\'s language, automatically.' },
    { icon:'🔗', title:'Meta Cloud API',          desc:'Official WhatsApp Business API. No unofficial clients.' },
  ];
  return (
    <div className="min-h-screen bg-dark text-text font-dm">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-dark/90 backdrop-blur-md flex items-center px-8 justify-between">
        <div className="flex items-center gap-2.5 font-syne font-extrabold text-lg text-white">
          <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-sm">💬</div>
          BotFlow
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-primary py-2 px-5 text-sm">Dashboard →</Link>
          ) : (
            <>
              <Link to="/login"  className="text-muted2 hover:text-text text-sm font-medium">Sign In</Link>
              <Link to="/signup" className="btn-primary py-2 px-5 text-sm">Start Free Trial</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative text-center py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[700px] h-[700px] bg-green/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute inset-0" style={{ backgroundImage:'linear-gradient(rgba(0,212,106,.03) 1px, transparent 1px), linear-gradient(90deg,rgba(0,212,106,.03) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block bg-green/10 border border-green/30 text-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wider font-syne">
            🚀 WHATSAPP AI CHATBOT PLATFORM
          </span>
          <h1 className="font-syne font-extrabold text-5xl lg:text-7xl text-white leading-tight mb-6">
            Turn WhatsApp into your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green to-[#00ff7f]">24/7 sales team</span>
          </h1>
          <p className="text-xl text-muted2 max-w-2xl mx-auto mb-10">
            Build AI-powered WhatsApp bots trained on your own data. Handle customer queries, collect leads, and book appointments — automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary px-8 py-4 text-base inline-block">
              Start for Free — No Credit Card →
            </Link>
            <a href="#features" className="btn-secondary px-8 py-4 text-base inline-block">
              See How It Works ↓
            </a>
          </div>
          <p className="text-muted text-sm mt-5">14-day free trial · Set up in 3 minutes · Cancel anytime</p>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-syne font-extrabold text-4xl text-white mb-4">Everything you need</h2>
          <p className="text-muted2 text-lg">A complete platform to build, train, and deploy WhatsApp AI bots.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-7 hover:border-border2 transition-colors">
              <span className="text-3xl block mb-4">{f.icon}</span>
              <h3 className="font-syne font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-muted2 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="card p-14">
          <h2 className="font-syne font-extrabold text-4xl text-white mb-4">Ready to start?</h2>
          <p className="text-muted2 mb-8">Join businesses already using BotFlow to automate their WhatsApp support.</p>
          <Link to="/signup" className="btn-primary px-10 py-4 text-base inline-block">
            Create Your Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-8 flex justify-between items-center text-sm text-muted">
        <div className="flex items-center gap-2 font-syne font-bold text-white">
          <div className="w-5 h-5 bg-green rounded-full flex items-center justify-center text-xs">💬</div>
          BotFlow
        </div>
        <div className="flex gap-6">
          {['Privacy','Terms','API Docs','Support'].map(l => (
            <a key={l} href="#" className="hover:text-text transition-colors">{l}</a>
          ))}
        </div>
        <span>© 2025 BotFlow</span>
      </footer>
    </div>
  );
}
