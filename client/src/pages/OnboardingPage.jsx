import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotsAPI, KnowledgeAPI } from '../services/api';
import { Input, Button, Card, Toggle } from '../components/ui/index';
import toast from 'react-hot-toast';

const STEPS = [
  { n: 1, title: 'Business Info',    sub: 'Name, type & greeting' },
  { n: 2, title: 'Knowledge Base',   sub: 'Upload your content' },
  { n: 3, title: 'AI Model & Tone',  sub: 'Choose your AI' },
  { n: 4, title: 'Connect Platform', sub: 'WhatsApp or Telegram' },
  { n: 5, title: 'Review & Launch',  sub: 'Go live!' },
];

const MODELS = [
  { id: 'gpt-4o',                    icon: '🧠', name: 'GPT-4o',      desc: "OpenAI's most capable.",      tag: '⚡ Premium',   tagColor: '#ffb400' },
  { id: 'claude-3-5-sonnet-20241022',icon: '✦',  name: 'Claude 3.5',  desc: 'Best for customer service.',  tag: '✓ Recommended', tagColor: '#00D46A' },
  { id: 'groq-mixtral-8x7b-32768',    icon: '🔥', name: 'Mixtral 8x7B',    desc: 'Great for multilingual.',     tag: '🚀 Fast',        tagColor: '#a855f7' },
];

const TONES = [
  { id: 'friendly',     emoji: '😊', name: 'Friendly',     desc: 'Warm & conversational' },
  { id: 'professional', emoji: '💼', name: 'Professional',  desc: 'Formal & precise' },
  { id: 'playful',      emoji: '🎉', name: 'Playful',       desc: 'Fun & energetic' },
  { id: 'concise',      emoji: '⚡', name: 'Concise',       desc: 'Short & direct' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [botId, setBotId] = useState(null);
  const [error, setError] = useState('');
  const [launched, setLaunched] = useState(false);

  // Step 1
  const [bizName, setBizName] = useState('');
  const [industry, setIndustry] = useState('');
  const [botName, setBotName] = useState('');
  const [welcome, setWelcome] = useState('');

  // Step 2
  const [files, setFiles] = useState([]);
  const [kbText, setKbText] = useState('');
  const [kbUrl, setKbUrl] = useState('');

  // Step 3
  const [model, setModel]         = useState('claude-3-5-sonnet-20241022');
  const [tone, setTone]           = useState('friendly');
  const [temp, setTemp]           = useState(40);
  const [langDetect, setLangDetect] = useState(true);
  const [handoff, setHandoff]       = useState(true);
  const [leads, setLeads]           = useState(false);

  // Step 4
  const [platform, setPlatform]   = useState('whatsapp'); // 'whatsapp' | 'telegram'
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken]     = useState('');
  const [waNumber, setWaNumber]   = useState('');
  const [tgToken, setTgToken]     = useState('');

  const go = (s) => { setError(''); setStep(s); };

  const handleStep1 = async () => {
    if (!botName) return setError('Please give your bot a name.');
    setLoading(true); setError('');
    try {
      if (!botId) {
        const res = await BotsAPI.create({ name: botName, businessName: bizName, industry, welcomeMessage: welcome || undefined });
        setBotId(res.data.data.bot.id);
      } else {
        await BotsAPI.update(botId, { name: botName, businessName: bizName, industry, welcomeMessage: welcome || undefined });
      }
      go(2);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    setLoading(true); setError('');
    try {
      for (const file of files) {
        await KnowledgeAPI.upload(botId, file).catch(e => toast.error(`Failed to upload ${file.name}`));
      }
      if (kbText.length >= 20) await KnowledgeAPI.addText(botId, kbText, 'Pasted FAQ').catch(() => {});
      if (kbUrl) await KnowledgeAPI.addUrl(botId, kbUrl, kbUrl).catch(() => {});
      go(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    setLoading(true); setError('');
    try {
      await BotsAPI.update(botId, {
        aiModel: model, personality: tone, temperature: temp / 100,
        settings: { autoLanguageDetection: langDetect, humanHandoff: handoff, collectLeadInfo: leads },
      });
      go(4);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStep4 = async () => {
    // Telegram path
    if (platform === 'telegram') {
      if (!tgToken) { go(5); return; }
      setLoading(true); setError('');
      try {
        await BotsAPI.connectTelegram(botId, { botToken: tgToken });
        toast.success('Telegram connected!');
        go(5);
      } catch (err) { setError(err.response?.data?.message || err.message); }
      finally { setLoading(false); }
      return;
    }
    // WhatsApp path
    if (!waPhoneId && !waToken && !waNumber) { go(5); return; }
    if (!waPhoneId || !waToken || !waNumber) return setError('Fill all 3 fields, or leave all empty to skip.');
    setLoading(true); setError('');
    try {
      await BotsAPI.connectWA(botId, { phoneNumberId: waPhoneId, accessToken: waToken, phoneNumber: waNumber });
      toast.success('WhatsApp connected!');
      go(5);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const handleLaunch = async () => {
    setLoading(true); setError('');
    try {
      await BotsAPI.setStatus(botId, 'active');
      setLaunched(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (launched) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center max-w-md p-8 animate-fadeUp">
        <div className="w-20 h-20 bg-green/15 border-2 border-green rounded-full flex items-center justify-center text-4xl mx-auto mb-8">🎉</div>
        <h2 className="text-4xl font-extrabold font-syne text-white mb-3">Your bot is live!</h2>
        <p className="text-muted2 mb-8"><strong className="text-green">{botName}</strong> is now active on WhatsApp.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary px-10 py-4 text-base">
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <aside className="w-72 bg-dark2 border-r border-border p-10 hidden lg:flex flex-col">
        <div className="font-syne font-extrabold text-lg text-white mb-9 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-green rounded-full flex items-center justify-center text-sm">💬</div>
          BotFlow
        </div>
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Setup Progress</p>
        <div className="space-y-1 flex-1">
          {STEPS.map(s => (
            <div key={s.n}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl cursor-pointer transition-colors ${
                step === s.n ? 'bg-green/8' : step > s.n ? 'opacity-80' : 'opacity-40 pointer-events-none'
              }`}
              onClick={() => step > s.n && go(s.n)}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step > s.n  ? 'bg-green/15 border-green text-green' :
                step === s.n ? 'bg-green border-green text-dark' :
                'border-border text-muted'
              }`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <div>
                <div className={`text-sm font-semibold font-syne ${step >= s.n ? 'text-white' : 'text-muted'}`}>{s.title}</div>
                <div className="text-xs text-muted">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Need help? <a href="#" className="text-green">Read the guide →</a></p>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Progress bar */}
        <div className="h-16 border-b border-border flex items-center px-10 gap-4 sticky top-0 bg-dark/85 backdrop-blur-sm z-10">
          <div className="flex-1 max-w-md bg-dark3 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-dim to-green rounded-full transition-all duration-500"
              style={{ width: `${step * 20}%` }} />
          </div>
          <span className="text-sm text-muted">Step {step} of 5</span>
          <div className="flex items-center gap-1.5 text-xs text-green ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Auto-saved
          </div>
        </div>

        <div className="flex-1 p-10 lg:p-16 max-w-2xl">
          {error && <div className="bg-red/10 border border-red/30 text-red text-sm px-4 py-2.5 rounded-xl mb-6">{error}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-fadeUp">
              <p className="text-xs font-semibold text-green uppercase tracking-widest mb-2">Step 1 — Business Info</p>
              <h2 className="text-4xl font-extrabold font-syne text-white mb-2">Tell us about your business</h2>
              <p className="text-muted2 text-base mb-10">This shapes your bot's personality and how it introduces itself.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Business Name" placeholder="Pizza Palace" value={bizName} onChange={e=>setBizName(e.target.value)} />
                <div className="mb-4">
                  <label className="label">Industry</label>
                  <select className="input" value={industry} onChange={e=>setIndustry(e.target.value)}>
                    <option value="">Select...</option>
                    {['Restaurant & Food','Retail & E-commerce','Healthcare & Clinic','Real Estate','Education & Coaching','Salon & Beauty','Travel & Hospitality','Finance & Insurance','Other'].map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Input label="Bot Name" placeholder="e.g. PizzaBot, Aria..." value={botName} onChange={e=>setBotName(e.target.value)} />
              <div className="mb-4">
                <label className="label">Welcome Message</label>
                <textarea className="input min-h-[120px]" placeholder="Hi! I'm your assistant. How can I help? 😊" value={welcome} onChange={e=>setWelcome(e.target.value)} />
              </div>
              <div className="flex justify-end mt-12 pt-8 border-t border-border">
                <Button loading={loading} onClick={handleStep1}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-fadeUp">
              <p className="text-xs font-semibold text-green uppercase tracking-widest mb-2">Step 2 — Knowledge Base</p>
              <h2 className="text-4xl font-extrabold font-syne text-white mb-2">What should your bot know?</h2>
              <p className="text-muted2 text-base mb-10">Upload documents or paste your FAQ.</p>

              <label className="block border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-green/40 transition-colors mb-4">
                <input type="file" multiple accept=".pdf,.txt,.doc,.docx,.csv" className="hidden"
                  onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                <span className="text-4xl block mb-3">📂</span>
                <p className="font-syne font-bold text-white mb-1">Drag & drop or click to upload</p>
                <p className="text-muted text-sm">PDF, DOCX, TXT, CSV</p>
                {files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {files.map((f,i) => (
                      <span key={i} className="bg-dark3 border border-border text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                        📄 {f.name}
                        <button onClick={e => { e.preventDefault(); setFiles(files.filter((_,j)=>j!==i)); }} className="text-muted hover:text-red">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </label>

              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted text-sm">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="mb-4">
                <label className="label">Paste your FAQ / Business Info</label>
                <textarea className="input min-h-[140px]" placeholder="Q: What are your hours?&#10;A: Mon-Sat 11am-11pm" value={kbText} onChange={e=>setKbText(e.target.value)} />
              </div>
              <Input label="Or enter a URL to scrape" type="url" placeholder="https://yoursite.com/faq" value={kbUrl} onChange={e=>setKbUrl(e.target.value)} />

              <div className="flex justify-between mt-12 pt-8 border-t border-border">
                <Button variant="secondary" onClick={() => go(1)}>← Back</Button>
                <Button loading={loading} onClick={handleStep2}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="animate-fadeUp">
              <p className="text-xs font-semibold text-green uppercase tracking-widest mb-2">Step 3 — AI Model & Tone</p>
              <h2 className="text-4xl font-extrabold font-syne text-white mb-2">Choose your AI brain</h2>
              <p className="text-muted2 text-base mb-10">Pick the model and personality that fits your brand.</p>

              <label className="label">AI Model</label>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {MODELS.map(m => (
                  <div key={m.id} onClick={() => setModel(m.id)}
                    className={`card p-5 cursor-pointer transition-all relative ${model===m.id ? 'border-green bg-green/5' : 'hover:border-green/30'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 absolute top-3 right-3 flex items-center justify-center text-xs font-bold ${model===m.id ? 'bg-green border-green text-dark' : 'border-border'}`}>
                      {model===m.id && '✓'}
                    </div>
                    <span className="text-2xl block mb-2">{m.icon}</span>
                    <div className="font-syne font-bold text-white text-sm mb-1">{m.name}</div>
                    <div className="text-xs text-muted2">{m.desc}</div>
                    <span className="text-xs font-semibold mt-2 inline-block" style={{ color: m.tagColor }}>{m.tag}</span>
                  </div>
                ))}
              </div>

              <label className="label">Personality</label>
              <div className="grid grid-cols-4 gap-3 mb-8">
                {TONES.map(t => (
                  <div key={t.id} onClick={() => setTone(t.id)}
                    className={`card p-4 cursor-pointer text-center transition-all ${tone===t.id ? 'border-green bg-green/5' : 'hover:border-green/30'}`}>
                    <span className="text-2xl block mb-2">{t.emoji}</span>
                    <div className="font-syne font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-xs text-muted mt-1">{t.desc}</div>
                  </div>
                ))}
              </div>

              <label className="label">Creativity — {temp}%</label>
              <input type="range" min="0" max="100" value={temp} onChange={e=>setTemp(Number(e.target.value))}
                className="w-full h-1.5 bg-dark3 rounded-full appearance-none cursor-pointer accent-green mb-8" />

              <div className="space-y-3">
                {[
                  { label:'Auto Language Detection', sub:'Reply in the customer\'s language', value:langDetect, set:setLangDetect },
                  { label:'Human Handoff',            sub:'Escalate to agent if unsure',      value:handoff, set:setHandoff },
                  { label:'Collect Lead Info',         sub:'Ask for name & email first',       value:leads, set:setLeads },
                ].map(({ label, sub, value, set }) => (
                  <div key={label} className="card px-5 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-xs text-muted2">{sub}</div>
                    </div>
                    <Toggle checked={value} onChange={set} />
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-12 pt-8 border-t border-border">
                <Button variant="secondary" onClick={() => go(2)}>← Back</Button>
                <Button loading={loading} onClick={handleStep3}>Continue →</Button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="animate-fadeUp">
              <p className="text-xs font-semibold text-green uppercase tracking-widest mb-2">Step 4 — Connect Platform</p>
              <h2 className="text-4xl font-extrabold font-syne text-white mb-2">Choose your channel</h2>
              <p className="text-muted2 text-base mb-8">Connect WhatsApp or Telegram. You can add more later.</p>

              {/* Platform tabs */}
              <div className="flex gap-3 mb-8">
                {[
                  { id: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                  { id: 'telegram', icon: '✈️', label: 'Telegram' },
                ].map(p => (
                  <button key={p.id} onClick={() => { setPlatform(p.id); setError(''); }}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border font-semibold text-sm transition-all ${
                      platform === p.id ? 'border-green bg-green/10 text-green' : 'border-border text-muted2 hover:border-green/30'
                    }`}>
                    <span>{p.icon}</span>{p.label}
                  </button>
                ))}
              </div>

              {/* WhatsApp panel */}
              {platform === 'whatsapp' && (
                <div>
                  <div className="card p-6 mb-6 space-y-4">
                    {[
                      { n:1, title:'Create a Meta App', desc:<>Go to <a href="https://developers.facebook.com" target="_blank" className="text-green">developers.facebook.com</a> → Create App → Business → Add WhatsApp.</> },
                      { n:2, title:'Get Phone Number ID & Token', desc:'In Meta App → WhatsApp → API Setup.' },
                      { n:3, title:'Set the Webhook URL', desc:'Paste your BotFlow webhook URL in Meta\'s webhook config.' },
                    ].map(({ n, title, desc }) => (
                      <div key={n} className="flex gap-4">
                        <div className="w-8 h-8 bg-green/10 border border-green/30 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm shrink-0">{n}</div>
                        <div><h4 className="font-semibold text-white text-sm mb-1">{title}</h4><p className="text-muted2 text-xs">{desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone Number ID" placeholder="123456789012345" value={waPhoneId} onChange={e=>setWaPhoneId(e.target.value)} />
                    <Input label="WhatsApp Number" type="tel" placeholder="+91 98765 43210" value={waNumber} onChange={e=>setWaNumber(e.target.value)} />
                  </div>
                  <Input label="Access Token" placeholder="EAABxxxxxx..." value={waToken} onChange={e=>setWaToken(e.target.value)} className="font-mono text-xs" />
                </div>
              )}

              {/* Telegram panel */}
              {platform === 'telegram' && (
                <div>
                  <div className="card p-6 mb-6 space-y-4">
                    {[
                      { n:1, title:'Open BotFather', desc:<>In Telegram search for <span className="text-green font-semibold">@BotFather</span> and send <span className="text-green font-mono">/newbot</span></> },
                      { n:2, title:'Create your bot', desc:'Enter a name and username (must end in "bot"). BotFather gives you a token.' },
                      { n:3, title:'Paste the token below', desc:'BotFlow will register the webhook with Telegram automatically.' },
                    ].map(({ n, title, desc }) => (
                      <div key={n} className="flex gap-4">
                        <div className="w-8 h-8 bg-green/10 border border-green/30 rounded-full flex items-center justify-center font-syne font-bold text-green text-sm shrink-0">{n}</div>
                        <div><h4 className="font-semibold text-white text-sm mb-1">{title}</h4><p className="text-muted2 text-xs">{desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <Input label="Telegram Bot Token" placeholder="7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={tgToken} onChange={e=>setTgToken(e.target.value)} className="font-mono text-xs" />
                  <p className="text-xs text-muted mt-2">Leave blank to skip and connect later from Settings.</p>
                </div>
              )}

              <div className="flex justify-between mt-12 pt-8 border-t border-border">
                <Button variant="secondary" onClick={() => go(3)}>← Back</Button>
                <Button loading={loading} onClick={handleStep4}>
                  {(platform === 'whatsapp' && !waPhoneId && !waToken) || (platform === 'telegram' && !tgToken)
                    ? 'Skip & Continue →' : 'Verify & Continue →'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="animate-fadeUp">
              <p className="text-xs font-semibold text-green uppercase tracking-widest mb-2">Step 5 — Launch</p>
              <h2 className="text-4xl font-extrabold font-syne text-white mb-2">Everything looks good?</h2>
              <p className="text-muted2 text-base mb-10">Review your configuration before going live.</p>

              <div className="space-y-3">
                {[
                  { icon:'🏢', label:'Business',     value: bizName || '—',   editStep: 1 },
                  { icon:'💬', label:'Bot Name',     value: botName || '—',   editStep: 1 },
                  { icon:'🧠', label:'AI Model',     value: MODELS.find(m=>m.id===model)?.name + ' · ' + tone, editStep: 3 },
                  { icon:'💬', label:'WhatsApp',     value: waNumber || (tgToken ? '—' : 'Skipped'), editStep: 4 },
                  { icon:'✈️', label:'Telegram',     value: tgToken ? 'Connected' : (waNumber ? '—' : 'Skipped'), editStep: 4 },
                ].map(({ icon, label, value, editStep }) => (
                  <div key={label} className="card px-5 py-4 flex items-center gap-4">
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-muted uppercase tracking-wider font-semibold">{label}</div>
                      <div className="text-white font-medium">{value}</div>
                    </div>
                    <button onClick={() => go(editStep)} className="text-green text-xs hover:opacity-70">Edit</button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-12 pt-8 border-t border-border">
                <Button variant="secondary" onClick={() => go(4)}>← Back</Button>
                <Button loading={loading} onClick={handleLaunch} className="px-12 py-4 text-base">
                  🚀 Launch Bot
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
