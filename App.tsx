import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PricingCard } from './components/PricingCard';
import { ChatInterface } from './components/ChatInterface';
import { FeaturesView, ModelsView, EnterpriseView, DashboardView } from './components/Views';
import { EnterpriseBuilder } from './components/EnterpriseBuilder';
import { CreditModal } from './components/CreditModal';
import { AuthModal } from './components/AuthModal';
import { SUBSCRIPTION_PLANS, APP_VERSION } from './constants';
import { View, CustomPlanConfig, UserProfile, UserAnalytics, ChatSession } from './types';
import { GoogleCloudSync } from './services/GoogleCloudSync';
import { Sparkles, Zap, ShieldCheck, Crown, Cpu, Box, Star, Globe, Infinity as InfinityIcon, Activity, Key, X, CheckCircle } from 'lucide-react';

const REDEEM_CODES: Record<string, string> = {
  '1426': 'free', '6241': 'go', '4263': 'plus', '3624': 'pro', '2637': 'premium',
  '7362': 'pro-premium', '637': 'super-premium', '736': 'max', '37': 'super-max',
  '142637-736241': 'full-max-premium'
};

export const App: React.FC = () => {
  // Boot Sequence State
  const [isBooting, setIsBooting] = useState(true);
  const [bootLog, setBootLog] = useState<string[]>([]);

  // App State
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Analytics State (Now synchronized via User)
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalTokens: 0, totalMessages: 0, totalCost: 0, activeChats: 0, modelUsage: {}, history: []
  });
  
  const [cloudSessions, setCloudSessions] = useState<ChatSession[] | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [trialExpiry, setTrialExpiry] = useState<number | null>(null);
  const [usedTrials, setUsedTrials] = useState<string[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [customPlan, setCustomPlan] = useState<CustomPlanConfig | undefined>(undefined);
  
  // Modals
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isEnterpriseBuilderOpen, setIsEnterpriseBuilderOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Boot Effect
  useEffect(() => {
    const sequence = [
      "Initializing Nexus Core...",
      "Loading Neural Vectors...",
      "Connecting to Quantum Cluster...",
      `System v${APP_VERSION} Ready.`
    ];
    let delay = 0;
    sequence.forEach((text, i) => {
      delay += (Math.random() * 500) + 300;
      setTimeout(() => {
        setBootLog(prev => [...prev, text]);
        if (i === sequence.length - 1) setTimeout(() => setIsBooting(false), 800);
      }, delay);
    });
  }, []);

  // Load local state initially if not logged in
  useEffect(() => {
    if (!user) {
      setSelectedPlan(localStorage.getItem('nexus_plan') || 'free');
      const storedExpiry = localStorage.getItem('nexus_trial_expiry');
      setTrialExpiry(storedExpiry ? parseInt(storedExpiry) : null);
      setUsedTrials(JSON.parse(localStorage.getItem('nexus_used_trials') || '[]'));
      setCredits(parseInt(localStorage.getItem('nexus_credits') || '0'));
      const storedCustom = localStorage.getItem('nexus_custom_plan');
      setCustomPlan(storedCustom ? JSON.parse(storedCustom) : undefined);
    }
  }, [user]);

  // Sync Data when User Changes
  useEffect(() => {
    if (user) {
      GoogleCloudSync.syncUserData(user.id).then(data => {
        setAnalytics(data.analytics);
        setCredits(data.credits);
        setSelectedPlan(data.planId);
        setCloudSessions(data.sessions);
      });
    } else {
        setCloudSessions(null);
    }
  }, [user]);

  // Handle Analytics Update from ChatInterface
  const handleUsageUpdate = (tokens: number, costEstimate: number, modelId: string) => {
    setAnalytics(prev => {
       const newHistory = [...(prev.history || [])];
       if (newHistory.length >= 24) newHistory.shift();
       newHistory.push(tokens);

       const newStats = {
          ...prev,
          totalTokens: prev.totalTokens + tokens,
          totalMessages: prev.totalMessages + 1,
          totalCost: prev.totalCost + costEstimate,
          modelUsage: { ...prev.modelUsage, [modelId]: (prev.modelUsage[modelId] || 0) + 1 },
          history: newHistory
       };

       // Sync to cloud if logged in
       if (user) {
           GoogleCloudSync.saveUserData(user.id, {
               analytics: newStats,
               sessions: [], // Sessions handled by ChatInterface directly now
               credits,
               planId: selectedPlan
           });
       }
       return newStats;
    });
  };

  // Trial Expiry Check
  useEffect(() => {
    if (!trialExpiry) return;
    const interval = setInterval(() => {
      if (Date.now() > trialExpiry) {
        setSelectedPlan('free');
        setTrialExpiry(null);
        localStorage.removeItem('nexus_trial_expiry');
        alert("Trial expired. Reverting to Free tier.");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [trialExpiry]);

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      setSelectedPlan('free');
      setTrialExpiry(null);
      localStorage.removeItem('nexus_trial_expiry');
      setCurrentView('chat');
      return;
    }
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsRedeemOpen(true);
    }
  };

  const handleStartTrial = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan || !plan.trialDurationMs) return;
    if (usedTrials.includes(planId)) { alert("Trial already used."); return; }

    const expiryTime = Date.now() + plan.trialDurationMs;
    setUsedTrials(prev => [...prev, planId]);
    setSelectedPlan(planId);
    setTrialExpiry(expiryTime);
    localStorage.setItem('nexus_trial_expiry', expiryTime.toString());
    localStorage.setItem('nexus_used_trials', JSON.stringify([...usedTrials, planId]));
    setCurrentView('chat');
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = redeemInput.trim();
    if (code === 'root142637-37') {
       setIsRedeemOpen(false); setRedeemInput(''); setIsEnterpriseBuilderOpen(true); return;
    }
    const planId = REDEEM_CODES[code];
    if (planId) {
      setTrialExpiry(null); localStorage.removeItem('nexus_trial_expiry');
      setSelectedPlan(planId); 
      // Sync plan to user profile
      if (user) {
         GoogleCloudSync.saveUserData(user.id, { analytics, sessions: [], credits, planId });
      }
      setCurrentView('chat');
      setIsRedeemOpen(false); setRedeemInput('');
    } else {
      setRedeemError("Invalid code.");
    }
  };

  const getIconForPlan = (index: number) => {
    const icons = [<Box/>, <Zap/>, <Activity/>, <ShieldCheck/>, <Star/>, <Crown/>, <Sparkles/>, <Cpu/>, <Globe/>, <InfinityIcon/>];
    return icons[index] || <Box/>;
  };

  const renderContent = () => {
    switch(currentView) {
      case 'chat': return (
        <ChatInterface 
          selectedPlanId={selectedPlan} 
          customPlanConfig={customPlan} 
          credits={credits} 
          onDeductCredits={(a) => setCredits(c => Math.max(0, c - a))} 
          onUsageUpdate={handleUsageUpdate}
          user={user}
          cloudSessions={cloudSessions}
        />
      );
      case 'dashboard': return <DashboardView analytics={analytics} />;
      case 'pricing': return (
        <div className="container mx-auto px-4 py-24 bg-slate-900/50">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {SUBSCRIPTION_PLANS.map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} onSelect={handleSelectPlan} onStartTrial={handleStartTrial} trialStatus={selectedPlan === plan.id ? 'current' : usedTrials.includes(plan.id) ? 'used' : 'available'} icon={getIconForPlan(i)} isPopular={plan.id === 'pro' || plan.id === 'max'} />
             ))}
           </div>
        </div>
      );
      case 'features': return <FeaturesView />;
      case 'models': return <ModelsView />;
      case 'enterprise': return <EnterpriseView />;
      default: return (
        <section className="relative overflow-hidden py-32 text-center">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-nexus-900/40 via-slate-950 to-slate-950 -z-10"></div>
           <h1 className="text-6xl font-bold text-white mb-6 animate-float">Nexus AI <span className="text-nexus-400">v2.0</span></h1>
           <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">The Singularity Update. Multimodal reasoning, instant coding, and the infinite context vault.</p>
           <button onClick={() => setCurrentView('pricing')} className="bg-white text-slate-950 px-8 py-3 rounded-full font-bold hover:bg-nexus-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">Enter the Nexus</button>
        </section>
      );
    }
  };

  if (isBooting) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center font-mono text-nexus-500">
         <div className="w-64 space-y-2">
            {bootLog.map((log, i) => <div key={i} className="text-xs border-l-2 border-nexus-500 pl-2 animate-pulse">{log}</div>)}
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-nexus-500 selection:text-white">
      <Navbar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onRedeemClick={() => setIsRedeemOpen(true)} 
        onAddCreditsClick={() => setIsCreditModalOpen(true)} 
        trialExpiry={trialExpiry} 
        credits={credits} 
        planName={SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name} 
        customTitle={customPlan?.teamName} 
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={() => setUser(null)}
      />
      <main className="flex-grow">{renderContent()}</main>
      {currentView !== 'chat' && <Footer />}
      
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={setUser} />}

      {isRedeemOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full relative">
              <button onClick={() => setIsRedeemOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-nexus-400"/> Authenticate</h3>
              <form onSubmit={handleRedeemSubmit} className="space-y-4">
                 <input autoFocus type="text" value={redeemInput} onChange={e => setRedeemInput(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-3 text-center font-mono tracking-widest text-white focus:border-nexus-500 outline-none" placeholder="ACCESS CODE" />
                 {redeemError && <p className="text-red-500 text-xs text-center">{redeemError}</p>}
                 <button type="submit" className="w-full bg-nexus-600 hover:bg-nexus-500 text-white py-3 rounded font-bold">Unlock</button>
              </form>
           </div>
        </div>
      )}
      {isEnterpriseBuilderOpen && <EnterpriseBuilder onClose={() => setIsEnterpriseBuilderOpen(false)} onActivate={(c) => { setCustomPlan(c); setSelectedPlan('enterprise-custom'); setIsEnterpriseBuilderOpen(false); setCurrentView('chat'); }} />}
      {isCreditModalOpen && <CreditModal onClose={() => setIsCreditModalOpen(false)} onAddCredits={(a) => { setCredits(p => p + a); setIsCreditModalOpen(false); }} />}
    </div>
  );
};