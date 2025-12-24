import React, { useState, useEffect } from 'react';
import { Cpu, Menu, X, MessageSquare, Key, Plus, Coins, BarChart3, Settings, LogIn, LogOut, User as UserIcon, Building, CreditCard, RefreshCw } from 'lucide-react';
import { NavbarProps, View } from '../types';

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onRedeemClick, onAddCreditsClick, trialExpiry, credits = 0, planName, customTitle, isGodModeActive, user, onLoginClick, onLogoutClick, activeProfileMode, onSwitchProfileMode, onManageSubscription }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!trialExpiry) { setTimeLeft(null); return; }
    const updateTimer = () => {
      const now = Date.now();
      const diff = trialExpiry - now;
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft(`${Math.floor(diff / (36e5))}h ${Math.floor((diff % 36e5) / 6e4)}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [trialExpiry]);

  const navItemClass = (view: View) => `text-sm font-medium transition-colors cursor-pointer ${currentView === view ? 'text-white' : 'text-slate-400 hover:text-white'}`;

  const hasEnterpriseAccess = user?.enterpriseConfig || user?.planId === 'enterprise-custom';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className={`p-2 rounded-lg transition-all duration-300 ${isGodModeActive ? 'bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : activeProfileMode === 'enterprise' ? 'bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-nexus-600 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]'}`}>
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-none">
                {customTitle || <>Nexus<span className={isGodModeActive ? 'text-amber-400' : 'text-nexus-400'}>AI</span></>}
              </span>
              <div className="flex gap-2">
                 <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider mt-0.5">v2.0 SINGULARITY</span>
                 {timeLeft && <span className="text-[10px] font-bold text-nexus-400 font-mono animate-pulse mt-0.5">{timeLeft} LEFT</span>}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <span onClick={() => onNavigate('features')} className={navItemClass('features')}>Features</span>
            <span onClick={() => onNavigate('models')} className={navItemClass('models')}>Models</span>
            <span onClick={() => onNavigate('pricing')} className={navItemClass('pricing')}>Pricing</span>
            <span onClick={() => onNavigate('dashboard')} className={navItemClass('dashboard')}>Analytics</span>
            
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            
            <div className="flex items-center gap-3">
              {activeProfileMode === 'personal' && (
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={onAddCreditsClick}>
                     <Coins className="w-4 h-4 text-emerald-400" />
                     <span className="text-sm font-mono font-medium text-emerald-400">{credits.toLocaleString()}</span>
                     <Plus className="w-3 h-3 text-slate-500" />
                  </div>
              )}

              {user ? (
                <div className="relative">
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-full hover:border-nexus-500 transition-colors">
                    <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full bg-slate-800" />
                    <span className="text-sm text-slate-300 max-w-[80px] truncate">{user.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1">
                      <div className="px-3 py-3 border-b border-slate-800 mb-1">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-slate-500">Current Profile</div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${activeProfileMode === 'enterprise' ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-300'}`}>
                                {activeProfileMode}
                            </span>
                        </div>
                        <div className="text-sm font-bold text-white capitalize mt-1">{activeProfileMode === 'enterprise' ? (customTitle || 'Enterprise') : (planName || 'Free')}</div>
                      </div>

                      {hasEnterpriseAccess && (
                          <button onClick={() => { onSwitchProfileMode(); setIsProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
                             <RefreshCw className="w-4 h-4 text-nexus-400" /> 
                             Switch to {activeProfileMode === 'personal' ? 'Enterprise' : 'Personal'}
                          </button>
                      )}

                      <button onClick={() => { onManageSubscription(); setIsProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
                        {activeProfileMode === 'enterprise' ? <Building className="w-4 h-4 text-purple-400" /> : <CreditCard className="w-4 h-4 text-green-400" />}
                        Manage {activeProfileMode === 'enterprise' ? 'Enterprise' : 'Subscription'}
                      </button>

                      <button onClick={onRedeemClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg">
                        <Key className="w-4 h-4 text-yellow-500" /> Redeem Code
                      </button>
                      
                      <div className="h-px bg-slate-800 my-1"></div>
                      
                      <button onClick={onLogoutClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg">
                        <LogOut className="w-4 h-4" /> Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={onLoginClick} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              )}

              <button onClick={() => onNavigate('chat')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isGodModeActive ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white text-slate-900 hover:bg-slate-200'}`}>
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Omitted for brevity */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-4">
           {/* Simple mobile impl */}
           <div className="flex flex-col gap-2">
             <button onClick={() => onNavigate('features')} className="text-left text-slate-400 p-2">Features</button>
             <button onClick={() => onNavigate('pricing')} className="text-left text-slate-400 p-2">Pricing</button>
             {user ? (
                 <button onClick={onLogoutClick} className="text-left text-red-400 p-2">Log Out</button>
             ) : (
                 <button onClick={onLoginClick} className="text-left text-nexus-400 p-2">Sign In</button>
             )}
           </div>
        </div>
      )}
    </nav>
  );
};

// Missing ChevronDown import fix
const ChevronDown = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);