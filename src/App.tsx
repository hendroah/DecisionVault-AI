import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, PlusCircle, Clock, BrainCircuit, ShieldCheck, 
  Users, Search, CheckCircle2, AlertTriangle, Fingerprint, Zap, 
  Lock, Sparkles, ArrowRight, X, Send, Activity, Database, BarChart, 
  Check, ChevronDown, Twitter, Github, Linkedin, Cpu, Globe, Building2, 
  Briefcase, Microscope, Bot, Settings, User, LogOut, Bell, Sliders, 
  Key, Wallet, Layers, Link as LinkIcon, HardDrive, ExternalLink, 
  FileText, Loader2, type LucideIcon
} from 'lucide-react';

// --- TYPES & INTERFACES ---

interface Decision {
  id: string;
  title: string;
  context: string;
  status: 'pending' | 'approved' | 'rejected';
  confidenceScore: number;
  timestamp: string;
  hash: string;
  zgTxHash?: string;
  computeProof?: string;
  verified: boolean;
  author: string;
  authorAddress?: string | null;
  approvals: string[];
  aiSummary?: string;
  pros?: string[];
  cons?: string[];
  risks?: string[];
  alternatives?: string[];
  impact?: string;
  costAnalysis?: string;
  action?: string;
  nextAction?: string;
}

interface FeedItem {
  id: number;
  user: string;
  action: string;
  target?: string;
  comment?: string;
  time: string;
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'zg') => void;
}

interface ZgInfo {
  txHash: string;
  computeProof: string;
  timestamp: string;
  storageId: string;
  computeId: string;
}

// --- API, UTILS & SAFE STORAGE ---

const apiKey = ""; // Automatically injected by the environment

// Safe Storage helpers to prevent crash on SSR or Iframe
const getSafeStorage = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved) as T;
  } catch (e: any) {
    console.warn("Storage access denied or parse failed", e.message);
  }
  return null;
};

const setSafeStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    console.warn("Storage write denied", e.message);
  }
};

// Safe Hash Function (with fallback if crypto.subtle is blocked)
const generateSHA256 = async (message: string): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e: any) {
    console.warn("Crypto API failed, using fallback hash", e.message);
  }
  
  // Simple fallback if crypto API is unavailable in iframe
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const fallbackStr = Math.abs(hash).toString(16);
  return '0x' + fallbackStr.padStart(64, '0').replace(/0/g, (c, i) => fallbackStr[i % fallbackStr.length] || '0');
};

// Generate realistic mock data
const generateMockData = (): Decision[] => {
  const statuses: Decision['status'][] = ['approved', 'approved', 'approved', 'pending', 'rejected'];
  const teamMembers = ['0x71C...9A23', '0x11A...4B90', '0x89D...2F11', '0x33B...1C44', '0x99E...5D22'];
  const topics = [
    { verb: 'Migrate', noun: 'Core DB to Postgres Vector', pros: ['Scalability', 'Native AI support'], cons: ['Migration downtime'] },
    { verb: 'Acquire', noun: 'DeFi protocol "YieldMax"', pros: ['Market share expansion', 'Talent acquisition'], cons: ['High valuation premium'] },
    { verb: 'Launch', noun: 'ZK-Rollup L2 Network', pros: ['Lower gas fees', 'Higher throughput'], cons: ['Complex engineering effort'] },
    { verb: 'Hire', noun: 'VP of AI Research', pros: ['Strategic leadership', 'Industry connections'], cons: ['High compensation package'] },
    { verb: 'Deprecate', noun: 'Legacy v1.0 API', pros: ['Reduced maintenance cost', 'Security improvement'], cons: ['Customer friction during transition'] },
    { verb: 'Partner with', noun: 'Chainlink for Oracles', pros: ['Reliable data feeds', 'Brand trust'], cons: ['Integration overhead'] },
    { verb: 'Allocate', noun: '20% Treasury to ETH Yields', pros: ['Passive income', 'Diversification'], cons: ['Smart contract risk'] },
    { verb: 'Pivot', noun: 'to B2B Enterprise Model', pros: ['Higher LTV', 'Predictable revenue'], cons: ['Longer sales cycles'] }
  ];

  const decisions: Decision[] = [];
  const now = new Date();

  for (let i = 0; i < 125; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const date = new Date(now.getTime() - Math.floor(Math.random() * 31536000000));
    const confidence = Math.floor(Math.random() * 40) + 55;
    
    decisions.push({
      id: `dec-${1000 + i}`,
      title: `${topic.verb} ${topic.noun}`,
      context: `Strategic proposal to ${topic.verb.toLowerCase()} ${topic.noun} to optimize our current trajectory.`,
      status: status,
      confidenceScore: confidence,
      timestamp: date.toISOString(),
      hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      zgTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      computeProof: `zkp-${Math.random().toString(16).slice(2, 14)}`,
      verified: true,
      aiSummary: `The proposal to ${topic.verb.toLowerCase()} ${topic.noun} presents a ${confidence > 75 ? 'strong' : 'moderate'} opportunity.`,
      pros: topic.pros,
      cons: topic.cons,
      risks: ['Execution delays', 'Budget overruns'],
      action: confidence > 75 ? `Proceed with execution plan.` : `Require further diligence.`,
      author: 'System Generated',
      authorAddress: teamMembers[Math.floor(Math.random() * teamMembers.length)],
      approvals: status === 'approved' ? [teamMembers[0], teamMembers[1]] : []
    });
  }
  return decisions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const callGemini = async (prompt: string, schema: Record<string, any> | null = null, retries: number = 3): Promise<any> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload: Record<string, any> = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "You are Vault AI, an executive decision engine. Communicate concisely, professionally, and analytically." }] }
  };
  if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from AI");
      return schema ? JSON.parse(text) : text;
    } catch (error: any) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
    }
  }
};

const CURRENT_USER = {
  name: 'Current User',
  role: 'DAO Contributor',
  initials: 'CU',
  address: '0x44F...8E99'
};

const INITIAL_TEAM_FEED: FeedItem[] = [
  { id: 1, user: '0x11A...4B90', action: 'approved via smart contract', target: 'Migrate Core Platform to AWS Graviton', time: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, user: '0x89D...2F11', action: 'signed comment on', target: 'Migrate Core Platform to AWS Graviton', comment: 'Verified native dependency rebuild process. Ready for mainnet deployment.', time: new Date(Date.now() - 14400000).toISOString() },
  { id: 3, user: '0x71C...9A23', action: 'committed decision to 0G Storage', target: 'Migrate Core Platform to AWS Graviton', time: new Date(Date.now() - 86400000).toISOString() },
];

// --- UI COMPONENTS ---

const Card = ({ children, className = '', noPadding = false, onClick }: { children: React.ReactNode; className?: string; noPadding?: boolean; onClick?: () => void }) => (
  <motion.div 
    whileHover={{ y: onClick ? -4 : -2 }}
    onClick={onClick}
    className={`bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-slate-600/50 ${onClick ? 'cursor-pointer hover:shadow-blue-500/10' : ''} ${noPadding ? '' : 'p-6'} ${className}`}
  >
    {children}
  </motion.div>
);

const Badge = ({ children, type = 'default', className = '' }: { children: React.ReactNode; type?: 'default' | 'success' | 'warning' | 'danger' | 'ai' | 'zg'; className?: string }) => {
  const styles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    ai: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    zg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, disabled }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; className?: string; icon?: LucideIcon; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; disabled?: boolean }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    ghost: "hover:bg-slate-800/50 text-slate-300 hover:text-white",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20",
    success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const ProgressBar = ({ progress, colorClass = "bg-blue-500" }: { progress: number; colorClass?: string }) => (
  <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      whileInView={{ width: `${progress}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`h-2 rounded-full ${colorClass}`} 
    />
  </div>
);

// --- GLOBAL CONTEXT & TOASTS ---
const ToastContext = React.createContext<ToastContextType>({ addToast: () => {} });

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: number; message: string; type: string}[]>([]);

  const addToast = (message: string, type: string = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <>
        {children}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
                  toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  toast.type === 'zg' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                {(toast.type === 'info' || toast.type === 'zg') && <Sparkles className="w-5 h-5" />}
                <span className="font-medium text-sm">{toast.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    </ToastContext.Provider>
  );
};

// --- ONBOARDING & WELCOME MODAL ---

const OnboardingView = ({ onComplete }: { onComplete: () => void }) => {
  const steps = [
    { text: "Connecting to 0G Network...", icon: Globe },
    { text: "Verifying Wallet...", icon: ShieldCheck },
    { text: "Initializing 0G Compute...", icon: Cpu },
    { text: "Loading AI Decision Vault...", icon: Database }
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < steps.length) {
      const t = setTimeout(() => setStep(s => s + 1), 1200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [step, onComplete, steps.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[70vh]">
      <div className="w-24 h-24 relative mb-12">
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        <motion.div 
          className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
          animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <Database className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
      </div>
      <div className="space-y-6 w-full max-w-sm">
        {steps.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: i <= step ? 1 : 0.3, x: i <= step ? 0 : -20 }}
            className={`flex items-center gap-4 ${i < step ? 'text-emerald-400' : i === step ? 'text-blue-400' : 'text-slate-600'}`}
          >
            {i < step ? <CheckCircle2 className="w-6 h-6"/> : <s.icon className={`w-6 h-6 ${i === step ? 'animate-pulse' : ''}`}/>}
            <span className="font-mono text-base">{s.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const WelcomeModal = ({ isOpen, onClose, onCreateDecision }: { isOpen: boolean; onClose: () => void; onCreateDecision: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         >
           <motion.div 
             initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
             className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
           >
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
             <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
             
             <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
               <Sparkles className="w-8 h-8 text-blue-400" />
             </div>
             
             <h2 className="text-3xl font-bold text-white mb-3">Welcome back.</h2>
             <p className="text-slate-400 mb-8 leading-relaxed text-lg">Ready to make your next AI-verified decision? Secure your strategic moves on the 0G network.</p>
             
             <div className="flex flex-col gap-3">
               <Button variant="primary" onClick={onCreateDecision} className="w-full py-3 text-base shadow-blue-500/20 shadow-lg">
                 <PlusCircle className="w-5 h-5 mr-2" /> Create Decision
               </Button>
               <Button variant="ghost" onClick={onClose} className="w-full py-3">
                 Go to Dashboard
               </Button>
             </div>
           </motion.div>
         </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- SLIDE-OVER MODAL (INSPECT RECORD) ---
const DecisionDetailModal = ({ decision, onClose }: { decision: Decision | null; onClose: () => void }) => {
  if (!decision) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end"
        onClick={onClose}
      >
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl custom-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
            <div>
              <h2 className="text-xl font-bold text-white">Record Details</h2>
              <p className="text-slate-400 text-sm font-mono mt-1">{decision.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
          </div>

          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge type={decision.status === 'approved' ? 'success' : decision.status === 'rejected' ? 'danger' : 'warning'}>
                  {decision.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-slate-500">{new Date(decision.timestamp).toLocaleString()}</span>
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">{decision.title}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User className="w-4 h-4"/> Proposed by <span className="font-mono text-blue-400">{decision.authorAddress || decision.author}</span>
              </div>
            </div>

            <Card className="border-blue-500/20 bg-blue-900/5">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400"/> 0G Storage Ledger
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">0G Transaction Hash</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-blue-300 break-all">{decision.zgTxHash}</div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Verifiable Compute ZK-Proof</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-400">{decision.computeProof || 'Pending network validation'}</div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400"/> AI Synthesis
              </h3>
              <p className="text-slate-300 leading-relaxed bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                {decision.aiSummary || decision.context}
              </p>
              
              {(decision.pros || decision.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Pros</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {(decision.pros || []).map((p, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span> {p}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-4">
                    <h4 className="text-rose-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Cons & Risks</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {[...(decision.cons || []), ...(decision.risks || [])].map((c, i) => <li key={i} className="flex gap-2"><span className="text-rose-500">•</span> {c}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {decision.approvals && decision.approvals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Cryptographic Signatures</h3>
                {decision.approvals.map((addr, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-500"/></div>
                    <span className="font-mono text-slate-300">{addr}</span>
                    <span className="text-slate-500 ml-auto">Signed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- APP VIEWS ---

const LandingView = ({ onEnter, walletAddress, connectWallet, isConnecting }: { onEnter: () => void, walletAddress: string | null, connectWallet: () => void, isConnecting: boolean }) => {
  const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };

  return (
    <div className="w-full relative overflow-x-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">DecisionVault</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">0G Ecosystem</a>
            <a href="#features" className="hover:text-white transition-colors">Verifiable AI</a>
            <a href="#features" className="hover:text-white transition-colors">Storage Ledger</a>
          </div>
          <div className="flex items-center gap-4">
            {walletAddress ? (
              <Button variant="primary" onClick={onEnter} className="!py-1.5 !px-4 !text-sm">Enter Vault</Button>
            ) : (
              <Button variant="secondary" onClick={connectWallet} disabled={isConnecting} className="!py-1.5 !px-4 !text-sm w-40">
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Wallet className="w-4 h-4"/> Connect Wallet</>}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto flex flex-col items-center">
          <Badge type="zg" className="mb-8 border-blue-500/30 py-1.5 px-4 text-sm shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Layers className="w-4 h-4 inline mr-2"/> Built natively on the 0G Ecosystem
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-blue-100 to-indigo-400 bg-clip-text text-transparent leading-[1.1]">
            On-chain intelligence for <br className="hidden md:block"/> decentralized teams.
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
            The verifiable decision vault for DAOs and Web3 protocols. Leverage 0G Compute for AI synthesis and 0G Storage for permanent cryptographic records.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button variant="primary" className="px-8 py-4 text-lg w-full sm:w-auto" onClick={walletAddress ? onEnter : connectWallet} disabled={isConnecting}>
               {isConnecting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Authenticating...</> : 
                walletAddress ? 'Launch DApp' : <><Wallet className="w-5 h-5 mr-2"/> Connect Wallet to Start</>}
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="py-12 border-y border-slate-800/50 bg-slate-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800/50">
          {[
            { value: "4.2TB", label: "0G Storage Used" },
            { value: "1.2M", label: "ZK Proofs Generated" },
            { value: "12ms", label: "Avg 0G Inference Latency" },
            { value: "850+", label: "DAOs Aligned" }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center px-4">
              <div className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm md:text-base text-slate-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-4 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Powered by Zero Gravity</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We utilize the modular 0G stack to provide verifiable AI processing and infinitely scalable permanent storage.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: "0G Compute Network", desc: "AI decision analysis is run on 0G's decentralized compute nodes, ensuring high-performance inference without centralized bottlenecks." },
              { icon: HardDrive, title: "0G Permanent Storage", desc: "Decision context, AI reasoning, and approval signatures are pinned directly to the 0G Storage Network for immutable preservation." },
              { icon: Fingerprint, title: "Verifiable AI (ZKPs)", desc: "Every AI synthesis generates a cryptographic zero-knowledge proof, guaranteeing the model's integrity and preventing tampering." }
            ].map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-blue-500/30 transition-colors overflow-hidden">
                <div className="bg-blue-500/10 border border-blue-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10">
                  <feat.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white text-lg tracking-tight">DecisionVault x 0G</span>
          </div>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
            Demonstrating the power of Verifiable AI and Decentralized Storage on the Zero Gravity Ecosystem.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600">
             <div className="w-2 h-2 rounded-full bg-emerald-500" /> 0G Testnet Online
          </div>
        </div>
      </footer>
    </div>
  );
};

const DashboardView = ({ decisions, onViewHistory, onCreateNew }: { decisions: Decision[], onViewHistory: () => void, onCreateNew: () => void }) => {
  const avgConfidence = decisions.length > 0 ? Math.round(decisions.reduce((acc, d) => acc + d.confidenceScore, 0) / decisions.length) : 0;
  
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vault Overview</h1>
          <p className="text-slate-400 mt-1">On-chain organizational intelligence.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Badge type="zg" className="hidden md:flex"><Database className="w-3 h-3 inline mr-1"/> 0G Storage Synced</Badge>
          <Button variant="primary" onClick={onCreateNew} className="w-full sm:w-auto shadow-blue-500/20 shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2" /> Create Decision
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Database, label: '0G Records Pinned', value: decisions.length, color: 'text-white' },
          { icon: Cpu, label: 'Avg AI Confidence', value: `${avgConfidence}%`, color: 'text-emerald-400' },
          { icon: Fingerprint, label: 'ZK Proofs Verified', value: decisions.filter(d=>d.computeProof).length, color: 'text-blue-400' },
          { icon: Clock, label: 'Pending Multi-sig', value: decisions.filter(d=>d.status==='pending').length, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card>
              <div className="text-slate-400 text-sm font-medium flex items-center gap-2"><stat.icon className="w-4 h-4"/> {stat.label}</div>
              <div className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-bold text-white">Recent 0G Transactions</h2>
        <Button variant="ghost" onClick={onViewHistory} className="text-sm text-blue-400 hover:text-blue-300">
          View All History <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {decisions.slice(0, 4).map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Card className="hover:border-blue-500/50 transition-colors group h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Database className="w-32 h-32 text-blue-500" />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <Badge type={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'}>
                    {d.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-500">{new Date(d.timestamp).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">{d.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1 relative z-10">{d.aiSummary || d.context}</p>
                <div className="flex items-center gap-4 border-t border-slate-800 pt-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">0G Tx: <span className="font-mono text-slate-400">{d.zgTxHash?.substring(0,14)}...</span></span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CommitStepRow = ({ active, done, text, icon: Icon }: { active: boolean; done: boolean; text: string; icon: LucideIcon }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }} 
    animate={{ opacity: active ? 1 : 0.3, x: active ? 0 : -20 }}
    className={`flex items-center gap-4 ${done ? 'text-emerald-400' : active ? 'text-blue-400' : 'text-slate-600'}`}
  >
    {done ? <CheckCircle2 className="w-6 h-6"/> : <Icon className={`w-6 h-6 ${active && !done ? 'animate-pulse' : ''}`}/>}
    <span className="font-medium text-lg">{text}</span>
  </motion.div>
);

const NewDecisionView = ({ onSave, decisions, walletAddress, onNavigate }: { onSave: (d: Decision) => void, decisions: Decision[], walletAddress: string | null, onNavigate: (v: string) => void }) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [loadingState, setLoadingState] = useState(''); 
  const [commitStep, setCommitStep] = useState(0);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [formData, setFormData] = useState({ 
    title: '', context: '', category: 'Treasury', priority: 'High', deadline: '', teamMembers: '' 
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<Partial<Decision> | null>(null);
  const [zgInfo, setZgInfo] = useState<ZgInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { addToast } = React.useContext(ToastContext);

  const handleAttachFile = () => {
    setAttachments([...attachments, `supporting_doc_${attachments.length + 1}.pdf`]);
    addToast("File attached successfully", "info");
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    const aiPhases = [
      "Understanding context...", 
      "Evaluating risks...", 
      "Comparing alternatives...", 
      "Calculating confidence...", 
      "Preparing recommendation..."
    ];
    
    for (const phase of aiPhases) {
      setAiLoadingText(phase);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const memoryContext = decisions.slice(0, 3).map(d => `- ${d.title}: ${d.status}`).join('\n');
      const prompt = `Analyze proposal. Title: ${formData.title}. Context: ${formData.context}. Category: ${formData.category}. Priority: ${formData.priority}. Past context: ${memoryContext}. Provide a highly detailed strategic breakdown.`;

      const schema = {
        type: "OBJECT",
        properties: {
          summary: { type: "STRING" },
          recommendation: { type: "STRING" },
          confidenceScore: { type: "INTEGER" },
          pros: { type: "ARRAY", items: { type: "STRING" } },
          cons: { type: "ARRAY", items: { type: "STRING" } },
          risks: { type: "ARRAY", items: { type: "STRING" } },
          alternatives: { type: "ARRAY", items: { type: "STRING" } },
          impact: { type: "STRING" },
          costAnalysis: { type: "STRING" },
          nextAction: { type: "STRING" }
        },
        required: ["summary", "recommendation", "confidenceScore", "pros", "cons", "risks", "alternatives", "impact", "costAnalysis", "nextAction"]
      };

      let result;
      try {
         result = await callGemini(prompt, schema);
      } catch (apiErr: any) {
         console.warn("API Failed, using realistic mock for demo...", apiErr.message);
         result = {
           summary: `The proposal "${formData.title}" represents a highly strategic opportunity with a favorable risk-reward profile, strongly aligned with current network growth vectors.`,
           recommendation: `Proceed with immediate allocation while setting up milestone-based tranches to mitigate downside risk.`,
           confidenceScore: Math.floor(Math.random() * 15) + 75,
           pros: ["Immediate competitive advantage", "High potential ROI", "Strong community alignment"],
           cons: ["Significant upfront capital lockup", "Requires dedicated engineering oversight"],
           risks: ["Smart contract vulnerabilities", "Market volatility affecting yield"],
           alternatives: ["Staggered integration over Q3/Q4", "Partnering instead of building in-house"],
           impact: "High - Directly affects core infrastructure and DAO treasury.",
           costAnalysis: "Estimated $150k initial outlay, $15k/mo recurring maintenance.",
           nextAction: "Draft multi-sig payload for immediate board approval."
         };
      }
      
      setAiResult(result);
      addToast("AI Analysis Complete", "info");
      setWizardStep(2);
    } catch (err: any) {
      console.error(err);
      addToast("AI Analysis Failed", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVerifyAndSave = async () => {
    setLoadingState('committing');
    setWizardStep(3);

    setCommitStep(1); // Uploading to 0G Storage
    await new Promise(r => setTimeout(r, 1200));

    setCommitStep(2); // Generating Verification Hash
    const rawData = formData.title + formData.context + new Date().toISOString();
    const hash = await generateSHA256(rawData);
    await new Promise(r => setTimeout(r, 1200));

    setCommitStep(3); // Verifying with 0G Compute
    const zgTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const proofStr = `zkp-${Math.random().toString(16).slice(2, 14)}`;
    await new Promise(r => setTimeout(r, 1500));

    setCommitStep(4); // Verification Successful
    addToast("Decision Pinned to 0G Storage", "success");
    await new Promise(r => setTimeout(r, 1200));
    
    const finalZgInfo: ZgInfo = {
      txHash: zgTxHash,
      computeProof: proofStr,
      timestamp: new Date().toISOString(),
      storageId: `0g-store-${Math.floor(Math.random() * 90000) + 10000}`,
      computeId: `0g-comp-${Math.floor(Math.random() * 90000) + 10000}`
    };

    setZgInfo(finalZgInfo);

    const newDec: Decision = {
      id: `dec-${Math.floor(Math.random()*10000)}`,
      title: formData.title,
      context: formData.context,
      status: 'pending',
      timestamp: finalZgInfo.timestamp,
      hash,
      zgTxHash: finalZgInfo.txHash,
      computeProof: finalZgInfo.computeProof,
      verified: true,
      author: CURRENT_USER.name,
      authorAddress: walletAddress,
      approvals: [],
      aiSummary: aiResult?.summary,
      confidenceScore: aiResult?.confidenceScore || 0,
      pros: aiResult?.pros,
      cons: aiResult?.cons,
      risks: aiResult?.risks,
      action: aiResult?.recommendation
    };
    
    setLoadingState('');
    onSave(newDec);
    setWizardStep(4);
  };

  const StepIndicator = ({ num, title, current, completed }: { num: number, title: string, current: boolean, completed: boolean }) => (
    <div className={`flex flex-col items-center gap-2 ${completed ? 'text-emerald-400' : current ? 'text-blue-400' : 'text-slate-600'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${completed ? 'bg-emerald-500/20 border-emerald-500/50' : current ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-slate-700 bg-slate-800'}`}>
        {completed ? <CheckCircle2 className="w-5 h-5"/> : num}
      </div>
      <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">{title}</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-start sm:items-center relative">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-800 -z-10 hidden sm:block" />
        <div className="absolute top-5 left-8 h-0.5 bg-emerald-500 -z-10 hidden sm:block transition-all duration-700 ease-in-out" style={{ width: `${((wizardStep - 1) / 3) * 100}%` }} />
        
        <StepIndicator num={1} title="Details" current={wizardStep === 1} completed={wizardStep > 1} />
        <StepIndicator num={2} title="AI Analysis" current={wizardStep === 2} completed={wizardStep > 2} />
        <StepIndicator num={3} title="0G Verification" current={wizardStep === 3} completed={wizardStep > 3} />
        <StepIndicator num={4} title="Success" current={wizardStep === 4} completed={false} />
      </div>

      <AnimatePresence mode="wait">
        {wizardStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="space-y-6 relative overflow-hidden">
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                    <BrainCircuit className="w-16 h-16 text-blue-500 animate-pulse mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">{aiLoadingText}</h2>
                    <p className="text-blue-400/80 font-mono text-sm">Processing via 0G Compute Nodes...</p>
                 </div>
               )}
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Proposal Title</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g., Should our DAO allocate treasury funds to AI infrastructure?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Strategic Context & Description</label>
                  <textarea className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white h-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" placeholder="Provide background data, goals, or paste meeting transcripts..." value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Treasury</option>
                    <option>Infrastructure</option>
                    <option>Hiring</option>
                    <option>Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Priority Level</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Deadline (Optional)</label>
                  <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Required Signers</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 0x1A4..., @core-team" value={formData.teamMembers} onChange={e => setFormData({...formData, teamMembers: e.target.value})} />
                </div>
                
                <div className="md:col-span-2 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="secondary" onClick={handleAttachFile}><FileText className="w-4 h-4"/> Attach File</Button>
                    {attachments.map((file, i) => (
                      <Badge key={i} type="default" className="py-1.5"><FileText className="w-3 h-3 inline mr-1 text-slate-500"/> {file}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-6">
                <Button onClick={handleAnalyze} disabled={!formData.title || !formData.context || isAnalyzing} className="px-8 py-3 text-base">
                  Generate AI Analysis <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {wizardStep === 2 && aiResult && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <Card className="border-blue-500/30 bg-blue-900/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-3 rounded-xl"><BrainCircuit className="text-blue-400 w-8 h-8"/></div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
                    <p className="text-blue-300/80 text-sm">Powered by Verifiable AI</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-1">Confidence Score</div>
                  <div className={`text-4xl font-extrabold ${aiResult.confidenceScore! >= 75 ? 'text-emerald-400' : aiResult.confidenceScore! >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {aiResult.confidenceScore}%
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-3">Executive Summary</h3>
                    <p className="text-white leading-relaxed">{aiResult.summary}</p>
                  </div>
                  <div className="bg-blue-900/20 p-6 rounded-2xl border border-blue-500/30">
                    <h3 className="text-blue-400 uppercase tracking-wider text-xs font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> AI Recommendation</h3>
                    <p className="text-white font-medium leading-relaxed">{aiResult.recommendation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5">
                    <h4 className="text-emerald-400 font-bold text-sm mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Pros</h4>
                    <ul className="space-y-3">
                      {(aiResult.pros || []).map((p, i) => <li key={i} className="flex gap-3 text-sm text-slate-300"><span className="text-emerald-500">•</span> {p}</li>)}
                    </ul>
                  </div>
                  <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-5">
                    <h4 className="text-amber-400 font-bold text-sm mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Cons</h4>
                    <ul className="space-y-3">
                      {(aiResult.cons || []).map((c, i) => <li key={i} className="flex gap-3 text-sm text-slate-300"><span className="text-amber-500">•</span> {c}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-5">
                    <h4 className="text-rose-400 font-bold text-sm mb-4 flex items-center gap-2"><Shield className="w-4 h-4"/> Risks</h4>
                    <ul className="space-y-3">
                      {(aiResult.risks || []).map((r, i) => <li key={i} className="flex gap-3 text-sm text-slate-300"><span className="text-rose-500">•</span> {r}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-slate-500 uppercase tracking-wider text-xs font-bold mb-2">Cost Analysis</h4>
                    <p className="text-slate-300 text-sm">{aiResult.costAnalysis}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-500 uppercase tracking-wider text-xs font-bold mb-2">Estimated Impact</h4>
                    <p className="text-slate-300 text-sm">{aiResult.impact}</p>
                  </div>
                  <div>
                    <h4 className="text-slate-500 uppercase tracking-wider text-xs font-bold mb-2">Alternatives</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {(aiResult.alternatives || []).map((alt, i) => <li key={i}>- {alt}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge type="default">Suggested Next Action:</Badge>
                    <span className="text-slate-300">{aiResult.nextAction}</span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="ghost" onClick={() => setWizardStep(1)} disabled={loadingState !== ''}>Back</Button>
                    <Button variant="primary" onClick={handleVerifyAndSave} disabled={loadingState !== ''} className="w-full sm:w-auto">
                      <Database className="w-4 h-4 mr-2" /> Verify & Store on 0G
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {wizardStep === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-full max-w-sm space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
              <CommitStepRow active={commitStep >= 1} done={commitStep > 1} text="Uploading to 0G Storage..." icon={Database} />
              <CommitStepRow active={commitStep >= 2} done={commitStep > 2} text="Generating Verification Hash..." icon={Fingerprint} />
              <CommitStepRow active={commitStep >= 3} done={commitStep > 3} text="Verifying with 0G Compute..." icon={Cpu} />
              <CommitStepRow active={commitStep >= 4} done={commitStep > 4} text="Verification Successful." icon={CheckCircle2} />
            </div>
          </motion.div>
        )}

        {wizardStep === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center py-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, 0] }} transition={{ type: "spring", duration: 0.8 }} className="w-28 h-28 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
            </motion.div>
            
            <h2 className="text-4xl font-extrabold text-white mb-4">Decision Successfully Stored</h2>
            <p className="text-slate-400 text-lg mb-12 leading-relaxed">
              Your proposal has been analyzed by AI and permanently secured on the 0G network. It is now available for DAO review.
            </p>

            <Card className="bg-slate-900/80 mb-10 text-left border-emerald-500/20">
              <h4 className="text-slate-500 uppercase tracking-wider text-xs font-bold mb-4">Verification Artifacts</h4>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-3 border-b border-slate-800">
                  <span className="text-slate-500">Transaction Hash</span>
                  <span className="text-blue-400 break-all">{zgInfo?.txHash}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-3 border-b border-slate-800">
                  <span className="text-slate-500">Compute Proof (ZKP)</span>
                  <span className="text-emerald-400 break-all">{zgInfo?.computeProof}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 pb-3 border-b border-slate-800">
                  <span className="text-slate-500">Storage ID</span>
                  <span className="text-slate-300">{zgInfo?.storageId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-slate-300">{new Date(zgInfo?.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" onClick={() => onNavigate('timeline')} className="w-full sm:w-auto px-8 py-3">
                <ExternalLink className="w-5 h-5 mr-2" /> View Decision
              </Button>
              <Button variant="secondary" onClick={() => addToast("Share link copied to clipboard!", "info")} className="w-full sm:w-auto px-6 py-3">
                Share Link
              </Button>
              <Button variant="secondary" onClick={() => addToast("Exporting PDF...", "info")} className="w-full sm:w-auto px-6 py-3">
                Export PDF
              </Button>
            </div>
            
            <button onClick={() => {
              setFormData({ title: '', context: '', category: 'Treasury', priority: 'High', deadline: '', teamMembers: '' });
              setAttachments([]);
              setWizardStep(1);
            }} className="mt-10 text-slate-500 hover:text-white transition-colors text-sm font-medium">
              + Create Another Decision
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TimelineView = ({ decisions }: { decisions: Decision[] }) => {
  const [search, setSearch] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  
  const filteredDecisions = decisions.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    (d.aiSummary && d.aiSummary.toLowerCase().includes(search.toLowerCase()))
  ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayDecisions = filteredDecisions.slice(0, 50); 

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Governance Timeline</h1>
            <p className="text-slate-400 mt-1">Chronological history of DAO strategy.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" placeholder="Search proposals..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="relative border-l-2 border-slate-800 ml-4 space-y-8 pb-12">
          <AnimatePresence>
            {displayDecisions.map((d, i) => (
              <motion.div 
                key={d.id} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative pl-8"
              >
                <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-1 ring-4 ring-[#0a0a0f] ${d.status === 'approved' ? 'bg-emerald-500' : d.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <div className="text-sm text-blue-400 font-mono mb-2 flex items-center gap-2">
                  {new Date(d.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-sans">by {d.authorAddress || d.author}</span>
                </div>
                <Card onClick={() => setSelectedDecision(d)} className="p-5 hover:border-blue-500/50 group transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{d.title}</h3>
                    <Badge type={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'}>{d.status}</Badge>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{d.aiSummary || d.context}</p>
                  <div className="flex gap-4 text-xs font-mono text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-800">
                    <span className="flex items-center gap-1"><Database className="w-3 h-3"/> Tx: {d.zgTxHash?.substring(0,10)}...</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredDecisions.length > 50 && (
            <div className="pl-8 pt-4 text-center">
               <span className="text-slate-500 text-sm font-medium">Scroll to load more historical records...</span>
            </div>
          )}
        </div>
      </motion.div>
      <DecisionDetailModal decision={selectedDecision} onClose={() => setSelectedDecision(null)} />
    </>
  );
};

const VerificationView = ({ decisions }: { decisions: Decision[] }) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500/20 p-3 rounded-xl"><Layers className="text-blue-400 w-8 h-8" /></div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">0G Storage Explorer</h1>
            <p className="text-slate-400 mt-1">Immutable on-chain records of all vault decisions.</p>
          </div>
        </div>

        <Card noPadding>
          <div className="overflow-x-auto h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-4 font-medium">Timestamp (UTC)</th>
                  <th className="p-4 font-medium">Proposal</th>
                  <th className="p-4 font-medium">0G TxHash</th>
                  <th className="p-4 font-medium">Compute Proof</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800/50">
                <AnimatePresence>
                  {decisions.map((d, i) => (
                    <motion.tr 
                      key={d.id} 
                      onClick={() => setSelectedDecision(d)}
                      className="hover:bg-blue-900/10 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(d.timestamp).toISOString().split('T')[0]}</td>
                      <td className="p-4 text-white font-medium truncate max-w-[200px] group-hover:text-blue-300 transition-colors">{d.title}</td>
                      <td className="p-4 text-blue-400 font-mono text-xs">
                        {d.zgTxHash ? d.zgTxHash.substring(0, 16) + '...' : 'Pending...'}
                      </td>
                      <td className="p-4 text-emerald-400 font-mono text-xs">
                        {d.computeProof || 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge type="success"><CheckCircle2 className="w-3 h-3 inline mr-1"/> Valid</Badge>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
      <DecisionDetailModal decision={selectedDecision} onClose={() => setSelectedDecision(null)} />
    </>
  );
};

const CustomBarChart = ({ data }: { data: { month: string; total: number; avgScore: number }[] }) => {
  const maxVal = Math.max(...data.map(d => d.total));
  return (
    <div className="h-64 flex items-end gap-1 pb-6 border-b border-l border-slate-800 px-2 pt-4 relative">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end relative">
          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 border border-slate-700 text-white text-xs py-1 px-2 rounded transition-opacity z-10 shadow-lg pointer-events-none flex flex-col items-center min-w-[80px]">
            <span className="font-bold">{d.month}</span>
            <span className="text-emerald-400">{d.avgScore}% Avg</span>
            <span className="text-slate-400">{d.total} decisions</span>
          </div>
          
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${maxVal === 0 ? 0 : (d.total / maxVal) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.05, type: "spring" }}
            className="w-full bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125 min-w-[8px]"
          />
        </div>
      ))}
    </div>
  );
};

const AnalyticsView = ({ decisions }: { decisions: Decision[] }) => {
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; scoreSum: number; label: string }> = {};
    decisions.forEach(d => {
      const date = new Date(d.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { total: 0, scoreSum: 0, label: date.toLocaleString('default', { month: 'short' }) };
      months[key].total += 1;
      months[key].scoreSum += d.confidenceScore;
    });
    
    return Object.keys(months).sort().map(k => ({
      month: months[k].label,
      total: months[k].total,
      avgScore: Math.round(months[k].scoreSum / months[k].total)
    })).slice(-12);
  }, [decisions]);

  const approved = decisions.filter(d=>d.status==='approved').length;
  const pending = decisions.filter(d=>d.status==='pending').length;
  const rejected = decisions.filter(d=>d.status==='rejected').length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Network Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white">Proposal Volume (Trailing 12M)</h3>
             <Badge type="zg">Aggregated from 0G</Badge>
           </div>
           {monthlyData.length > 0 ? (
             <CustomBarChart data={monthlyData} />
           ) : (
             <div className="h-64 flex items-center justify-center text-slate-500 border-b border-l border-slate-800">No data available</div>
           )}
           <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono px-2">
             <span>{monthlyData[0]?.month}</span>
             <span>{monthlyData[monthlyData.length-1]?.month}</span>
           </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-6">DAO Outcome Distribution</h3>
          <div className="space-y-6">
            {[
              { label: 'Executed (Approved)', count: approved, color: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'Awaiting Multi-sig', count: pending, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Vetoed (Rejected)', count: rejected, color: 'bg-rose-500', text: 'text-rose-400' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">{stat.label}</span>
                  <span className={`font-bold ${stat.text}`}>{stat.count}</span>
                </div>
                <ProgressBar progress={decisions.length ? (stat.count / decisions.length) * 100 : 0} colorClass={stat.color} />
              </motion.div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-6">AI Confidence Heatmap</h3>
          <div className="grid grid-cols-3 gap-4">
             {[
               { range: '90-100%', label: 'High Certainty', count: decisions.filter(d => d.confidenceScore >= 90).length, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
               { range: '70-89%', label: 'Moderate', count: decisions.filter(d => d.confidenceScore >= 70 && d.confidenceScore < 90).length, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
               { range: '<70%', label: 'High Risk', count: decisions.filter(d => d.confidenceScore < 70).length, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
             ].map(box => (
               <div key={box.range} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${box.color}`}>
                 <span className="text-2xl font-bold mb-1">{box.count}</span>
                 <span className="text-xs font-medium uppercase tracking-wider">{box.label}</span>
                 <span className="text-[10px] opacity-70 mt-1">{box.range}</span>
               </div>
             ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

const TeamWorkspaceView = ({ feed, onAddComment, decisions, onUpdateDecision }: { feed: FeedItem[], onAddComment: (c: string) => void, decisions: Decision[], onUpdateDecision: (id: string, s: string) => void }) => {
  const [newComment, setNewComment] = useState('');
  const { addToast } = React.useContext(ToastContext);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
    addToast("Signature verified and comment posted", "success");
  };

  const handleApproval = (id: string, newStatus: string) => {
    onUpdateDecision(id, newStatus);
    addToast(`Transaction signed: Proposal ${newStatus}`, newStatus === 'approved' ? 'success' : 'error');
  };

  const pendingDecisions = decisions.filter(d => d.status === 'pending');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-8">DAO Alignment</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card className="mb-6 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input 
                type="text" 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Sign an update or comment to the network..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
              <Button variant="primary">Sign & Post</Button>
            </form>
          </Card>

          <AnimatePresence>
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 text-xs">
                    {item.user.substring(0,4)}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm">
                      <span className="font-mono text-blue-300">{item.user}</span> {item.action} {item.target && <span className="font-medium text-white">"{item.target}"</span>}
                    </p>
                    {item.comment && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 leading-relaxed">
                        "{item.comment}"
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">{new Date(item.time).toLocaleString()}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-white mb-4">Pending Multi-sigs</h3>
            {pendingDecisions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No pending signatures.</p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingDecisions.map(d => (
                  <div key={d.id} className="p-4 border border-amber-500/20 bg-slate-900 rounded-xl shadow-lg relative overflow-hidden">
                    <h4 className="text-sm font-bold text-amber-400 mb-2 truncate pr-4" title={d.title}>{d.title}</h4>
                    <div className="flex gap-2 mt-4 relative z-10">
                       <Button variant="success" className="flex-1 text-xs py-1.5" onClick={() => handleApproval(d.id, 'approved')}>Sign Approve</Button>
                       <Button variant="danger" className="flex-1 text-xs py-1.5" onClick={() => handleApproval(d.id, 'rejected')}>Sign Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
     <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Settings</h1>
     <Card><p className="text-slate-400">Settings module is currently offline in this demo environment.</p></Card>
  </motion.div>
);

const ProfileView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
     <h1 className="text-3xl font-bold text-white tracking-tight mb-8">User Profile</h1>
     <Card><p className="text-slate-400">Profile module is currently offline in this demo environment.</p></Card>
  </motion.div>
);

const AIChatAssistant = ({ decisions }: { decisions: Decision[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am connected to the 0G vector store. Ask me anything about past DAO proposals or strategic history.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if(!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const memoryStr = decisions.slice(0,10).map(d => `[${d.id}] ${d.title}: Status=${d.status}, Summary=${d.aiSummary}`).join('\n');
      const prompt = `Here is the recent on-chain decision history: ${memoryStr}. User query: "${userMsg}". Answer concisely as the 0G Vault AI.`;

      let reply;
      try {
        reply = await callGemini(prompt);
      } catch (e: any) {
        await new Promise(r => setTimeout(r, 1000));
        reply = `Based on the on-chain ledger, we have executed similar proposals recently. I recommend reviewing proposal [dec-001] for strategic context before proceeding.`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection error to 0G Vector Store." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 text-white hover:scale-110 transition-transform z-50"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[90vw] md:w-96 h-[500px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-blue-400 w-5 h-5" />
                <span className="font-bold text-white">0G Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'}`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-slate-800 text-slate-300 p-3 rounded-xl rounded-bl-none border border-slate-700 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 animate-spin text-blue-400" /> Querying Vector DB...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input 
                  type="text" value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Ask the vault..." 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <Button variant="primary" className="px-3" disabled={isLoading}><Send className="w-4 h-4"/></Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [teamFeed, setTeamFeed] = useState<FeedItem[]>([]);

  // Gunakan useEffect untuk mengakses localStorage guna mencegah error SSR di Next.js
  useEffect(() => {
    const savedDec = getSafeStorage<Decision[]>('vault_decisions_v11');
    if (savedDec && Array.isArray(savedDec) && savedDec.length > 0) {
      setDecisions(savedDec);
    } else {
      const generated = generateMockData();
      setDecisions(generated);
      setSafeStorage('vault_decisions_v11', generated);
    }

    const savedFeed = getSafeStorage<FeedItem[]>('vault_feed_v11');
    if (savedFeed && Array.isArray(savedFeed)) {
      setTeamFeed(savedFeed);
    } else {
      setTeamFeed(INITIAL_TEAM_FEED);
      setSafeStorage('vault_feed_v11', INITIAL_TEAM_FEED);
    }
    
    setIsAppLoaded(true);
  }, []);

  // Update storage setiap kali state berubah
  useEffect(() => { if (isAppLoaded) setSafeStorage('vault_decisions_v11', decisions); }, [decisions, isAppLoaded]);
  useEffect(() => { if (isAppLoaded) setSafeStorage('vault_feed_v11', teamFeed); }, [teamFeed, isAppLoaded]);

  const connectWallet = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setWalletAddress(CURRENT_USER.address);
      setIsConnecting(false);
      setCurrentView('onboarding');
    }, 1500); 
  };

  const handleOnboardingComplete = () => {
    setCurrentView('dashboard');
    setShowWelcomeModal(true);
  };

  const handleSaveDecision = (newDec: Decision) => {
    setDecisions([newDec, ...decisions]);
    setTeamFeed([{ 
      id: Date.now(), 
      user: walletAddress || CURRENT_USER.address, 
      action: 'committed proposal to 0G Storage', 
      target: newDec.title, 
      time: new Date().toISOString() 
    }, ...teamFeed]);
  };

  const handleAddComment = (commentText: string) => {
    setTeamFeed([{ 
      id: Date.now(), 
      user: walletAddress || CURRENT_USER.address, 
      action: 'signed comment on', 
      comment: commentText, 
      time: new Date().toISOString() 
    }, ...teamFeed]);
  };

  const handleUpdateDecision = (id: string, newStatus: string) => {
    const decToUpdate = decisions.find(d => d.id === id);
    if(decToUpdate) {
       setDecisions(decisions.map(d => d.id === id ? { ...d, status: newStatus as any } : d));
       setTeamFeed([{ 
        id: Date.now(), 
        user: walletAddress || CURRENT_USER.address, 
        action: newStatus === 'approved' ? 'executed multi-sig on' : 'vetoed proposal', 
        target: decToUpdate.title, 
        time: new Date().toISOString() 
      }, ...teamFeed]);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Network Overview', icon: LayoutDashboard },
    { id: 'new', label: 'Verifiable AI Inference', icon: Cpu },
    { id: 'timeline', label: 'DAO Timeline', icon: Clock },
    { id: 'verification', label: '0G Storage Explorer', icon: Layers },
    { id: 'team', label: 'Multi-sig Alignment', icon: Users },
    { id: 'analytics', label: 'Network Analytics', icon: BarChart },
  ];

  // Cegah render sebelum client siap untuk menghindari hydration error
  if (!isAppLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden">
          <LandingView onEnter={() => setCurrentView('dashboard')} walletAddress={walletAddress} connectWallet={connectWallet} isConnecting={isConnecting} />
        </div>
      </ToastProvider>
    );
  }

  const navigateTo = (id: string) => {
    setCurrentView(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-slate-300 font-sans flex selection:bg-blue-500/30 overflow-x-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DecisionVault</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`w-64 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl fixed h-full flex flex-col z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 hidden md:flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">DecisionVault</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pt-20 md:pt-4 pb-4 flex flex-col justify-between custom-scrollbar">
            <nav className="px-4 space-y-1">
              <div className="text-xs font-bold text-blue-500/70 uppercase tracking-wider mb-3 px-3">0G Integration</div>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-4 pb-4 mt-8">
               {walletAddress ? (
                 <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="text-xs font-mono text-slate-300">{walletAddress}</span>
                   </div>
                   <button onClick={() => { setWalletAddress(null); setCurrentView('landing'); }} className="text-slate-500 hover:text-rose-400 transition-colors">
                     <LogOut className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <Button variant="primary" className="w-full text-sm" onClick={connectWallet} disabled={isConnecting}>
                   {isConnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wallet className="w-4 h-4" />} Connect Wallet
                 </Button>
               )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 relative min-h-screen pt-16 md:pt-0">
          <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-0 pb-24 md:pb-12">
            {!walletAddress ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                 <Wallet className="w-16 h-16 text-slate-700 mb-6" />
                 <h2 className="text-2xl font-bold text-white mb-2">Wallet Disconnected</h2>
                 <p className="text-slate-400 mb-6">Please connect your Web3 wallet to interact with the 0G Network.</p>
                 <Button variant="primary" onClick={connectWallet} disabled={isConnecting}>
                    {isConnecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Authenticating...</> : 'Connect Wallet'}
                 </Button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentView === 'onboarding' && <OnboardingView onComplete={handleOnboardingComplete} />}
                  {currentView === 'dashboard' && <DashboardView decisions={decisions} onViewHistory={() => setCurrentView('timeline')} onCreateNew={() => setCurrentView('new')} />}
                  {currentView === 'new' && <NewDecisionView onSave={handleSaveDecision} decisions={decisions} walletAddress={walletAddress} onNavigate={setCurrentView} />}
                  {currentView === 'timeline' && <TimelineView decisions={decisions} />}
                  {currentView === 'verification' && <VerificationView decisions={decisions} />}
                  {currentView === 'team' && <TeamWorkspaceView feed={teamFeed} onAddComment={handleAddComment} decisions={decisions} onUpdateDecision={handleUpdateDecision} />}
                  {currentView === 'analytics' && <AnalyticsView decisions={decisions} />}
                  {currentView === 'settings' && <SettingsView />}
                  {currentView === 'profile' && <ProfileView />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
        
        {walletAddress && <AIChatAssistant decisions={decisions} />}
        
        <WelcomeModal 
          isOpen={showWelcomeModal} 
          onClose={() => setShowWelcomeModal(false)} 
          onCreateDecision={() => {
            setShowWelcomeModal(false);
            setCurrentView('new');
          }} 
        />
      </div>
      
      {/* Global styles for custom scrollbar to match dark UI */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.8); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 1); }
      `}} />
    </ToastProvider>
  );
    }
