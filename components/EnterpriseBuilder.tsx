import React, { useState, useEffect } from 'react';
import { X, Server, Code, CheckCircle, ShieldCheck, Tag, Users, Globe, Lock, EyeOff, Plus, Trash2, CreditCard } from 'lucide-react';
import { AI_MODELS } from '../constants';
import { CustomPlanConfig, CodingCapability, SecurityLevel } from '../types';

interface EnterpriseBuilderProps {
  onClose: () => void;
  onActivate: (config: CustomPlanConfig) => void;
  existingConfig?: CustomPlanConfig;
  existingMembers?: string[];
  onCancelSubscription?: () => void;
  onAddMember?: (email: string) => void;
  onRemoveMember?: (email: string) => void;
}

export const EnterpriseBuilder: React.FC<EnterpriseBuilderProps> = ({ onClose, onActivate, existingConfig, existingMembers = [], onCancelSubscription, onAddMember, onRemoveMember }) => {
  const BASE_PRICE = 55;
  const CODING_PRICES = {
    none: 0,
    half: 30, // "Codding"
    full: 77  // "Advance Codding"
  };
  
  const SECURITY_PRICES = {
    none: 0,
    low: 2,
    medium: 3,
    high: 4,
    advance: 5
  };

  // State initialization
  const [selectedModels, setSelectedModels] = useState<string[]>(existingConfig?.allowedModels || []);
  const [codingTier, setCodingTier] = useState<CodingCapability>(existingConfig?.codingCapability || 'none');
  const [teamName, setTeamName] = useState(existingConfig?.teamName || '');
  const [companyContext, setCompanyContext] = useState(existingConfig?.companyContext || '');
  const [removeBranding, setRemoveBranding] = useState(existingConfig?.removeBranding || false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(existingConfig?.securityLevel || 'none');
  
  // Team Management State
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [redeemCode, setRedeemCode] = useState('');
  const [totalPrice, setTotalPrice] = useState(BASE_PRICE);
  const [error, setError] = useState<string | null>(null);

  const isUpdateMode = !!existingConfig;

  useEffect(() => {
    let price = BASE_PRICE;
    
    // Add model prices
    selectedModels.forEach(modelId => {
      const model = AI_MODELS.find(m => m.id === modelId);
      if (model) {
        price += model.builderPrice;
      }
    });

    // Add coding price
    if (codingTier === 'half') price += CODING_PRICES.half;
    if (codingTier === 'full') price += CODING_PRICES.full;

    // Add Security Price
    price += SECURITY_PRICES[securityLevel];

    // Add Branding Removal Price
    if (removeBranding) price += 1;

    setTotalPrice(price);
  }, [selectedModels, codingTier, securityLevel, removeBranding]);

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If updating, no code needed (or simplified check)
    if (isUpdateMode) {
        onActivate({
            allowedModels: selectedModels,
            codingCapability: codingTier,
            totalPrice: totalPrice,
            teamName: teamName.trim() || undefined,
            removeBranding,
            securityLevel,
            companyContext: companyContext.trim() || undefined
        });
        return;
    }

    const expectedCode = `EEE142637EEE${totalPrice}`;
    if (redeemCode === expectedCode) {
      onActivate({
        allowedModels: selectedModels,
        codingCapability: codingTier,
        totalPrice: totalPrice,
        teamName: teamName.trim() || undefined,
        removeBranding,
        securityLevel,
        companyContext: companyContext.trim() || undefined
      });
    } else {
      setError(`Invalid purchase code.`);
    }
  };

  const handleAddMemberClick = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberEmail || !newMemberEmail.includes('@')) return;
      if (onAddMember) {
          onAddMember(newMemberEmail);
          setNewMemberEmail('');
      }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-nexus-500/50 rounded-2xl w-full max-w-4xl shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-2xl">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-nexus-600 rounded-lg">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Enterprise Suite {isUpdateMode ? 'Manager' : 'Builder'}</h2>
                <p className="text-nexus-400 font-mono text-xs">{isUpdateMode ? 'Update Configuration' : 'Create your custom AI infrastructure'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Features */}
            <div className="space-y-8">
              
               {/* 1. Team & Identity */}
               <section>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Identity
                 </h3>
                 <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Team Name / Agent Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. Acme Corp Support"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500"
                        />
                    </div>
                    <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${removeBranding ? 'bg-nexus-600 border-nexus-500' : 'border-slate-600 bg-slate-800'}`}>
                                {removeBranding && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={removeBranding} onChange={(e) => setRemoveBranding(e.target.checked)} />
                            <div className="text-sm">
                                <div className="text-slate-200 font-medium">Remove Branding</div>
                                <div className="text-xs text-slate-500">Hide "Powered by Nexus AI"</div>
                            </div>
                        </div>
                        <span className="text-xs font-mono text-nexus-400">+$1/mo</span>
                    </label>
                 </div>
               </section>

               {/* 1.5 Team Seats Management (Only visible in Update Mode) */}
               {isUpdateMode && (
                   <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <CreditCard className="w-4 h-4" /> Team Seats ($5/seat)
                        </h3>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                             <div className="space-y-2">
                                 {existingMembers.length === 0 ? (
                                     <div className="text-xs text-slate-500 italic">No additional seats active.</div>
                                 ) : (
                                     existingMembers.map(email => (
                                         <div key={email} className="flex justify-between items-center text-sm p-2 bg-slate-900 rounded border border-slate-800">
                                             <span className="text-slate-300">{email}</span>
                                             <button onClick={() => onRemoveMember && onRemoveMember(email)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                         </div>
                                     ))
                                 )}
                             </div>
                             <div className="flex gap-2">
                                 <input 
                                    type="email" 
                                    placeholder="colleague@example.com"
                                    value={newMemberEmail}
                                    onChange={e => setNewMemberEmail(e.target.value)}
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                 />
                                 <button onClick={handleAddMemberClick} className="bg-nexus-600 hover:bg-nexus-500 text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
                                     <Plus className="w-4 h-4" /> Pay $5
                                 </button>
                             </div>
                        </div>
                   </section>
               )}

               {/* 2. Security Level */}
               <section>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Security Suite
                 </h3>
                 <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(SECURITY_PRICES) as SecurityLevel[]).map((level) => (
                        <button
                            key={level}
                            onClick={() => setSecurityLevel(level)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                securityLevel === level 
                                ? 'bg-nexus-900/40 border-nexus-500 text-white' 
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                        >
                            <span className="text-xs font-bold capitalize">{level}</span>
                            <span className="text-[10px] font-mono mt-1 opacity-70">+${SECURITY_PRICES[level]}</span>
                        </button>
                    ))}
                 </div>
               </section>

               {/* 3. Agent Training */}
               <section>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Agent Link & Context
                 </h3>
                 <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <label className="block text-xs text-slate-500 mb-1">Target Website URL or Company Name</label>
                    <input
                        type="text"
                        value={companyContext}
                        onChange={(e) => setCompanyContext(e.target.value)}
                        placeholder="e.g. https://www.example.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500 placeholder-slate-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Agent will utilize this URL/Context to answer user queries.
                    </p>
                 </div>
               </section>

            </div>

            {/* RIGHT COLUMN: Models & Logic */}
            <div className="space-y-8">
               {/* 4. Model Selection */}
                <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Server className="w-4 h-4" /> Compute Models
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 bg-slate-950/30 p-2 rounded-xl border border-slate-800">
                    {AI_MODELS.map(model => (
                    <label key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors group">
                        <div className="flex items-center gap-3">
                        <input 
                            type="checkbox"
                            checked={selectedModels.includes(model.id)}
                            onChange={() => toggleModel(model.id)}
                            className="w-4 h-4 rounded border-slate-600 text-nexus-500 focus:ring-nexus-500 bg-slate-700"
                        />
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">{model.name}</span>
                        </div>
                        <span className="text-xs font-mono text-nexus-500">+${model.builderPrice}</span>
                    </label>
                    ))}
                </div>
                </div>

                {/* 5. Coding Capability */}
                <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Code className="w-4 h-4" /> Coding Power
                </h3>
                <div className="space-y-2">
                    {['none', 'half', 'full'].map((tier) => (
                         <label key={tier} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${codingTier === tier ? 'bg-nexus-900/20 border-nexus-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                            <div className="flex items-center gap-3">
                                <input 
                                type="radio" 
                                name="coding" 
                                checked={codingTier === tier} 
                                onChange={() => setCodingTier(tier as CodingCapability)}
                                className="text-nexus-500 focus:ring-nexus-500 bg-slate-700"
                                />
                                <span className="text-sm font-medium text-slate-200 capitalize">
                                    {tier === 'none' ? 'No Coding' : tier === 'half' ? 'Standard Coding' : 'Advanced Coding'}
                                </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                                +${tier === 'none' ? 0 : tier === 'half' ? 30 : 77}
                            </span>
                        </label>
                    ))}
                </div>
                </div>

                {/* 6. Danger Zone */}
                {isUpdateMode && (
                     <div>
                        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Danger Zone
                        </h3>
                        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl">
                            <p className="text-xs text-red-300 mb-3">Canceling will immediately remove all enterprise configurations and revoke team access.</p>
                            <button onClick={onCancelSubscription} className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 py-2 rounded-lg text-sm font-medium transition-colors">
                                Cancel Enterprise Subscription
                            </button>
                        </div>
                     </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer: Price & Purchase */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 rounded-b-2xl">
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="text-center md:text-left">
                  <div className="text-sm text-slate-500 mb-1">Total Monthly Cost</div>
                  <div className="text-4xl font-bold text-white tracking-tight">${totalPrice}</div>
                </div>
                
                <div className="flex-1 w-full">
                     <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        {!isUpdateMode && (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={redeemCode}
                                    onChange={(e) => {
                                    setRedeemCode(e.target.value);
                                    setError(null);
                                    }}
                                    placeholder="Enter Purchase Code"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-nexus-500 font-mono text-center"
                                    required
                                />
                            </div>
                        )}
                        {error && <p className="text-red-400 text-xs text-center animate-pulse">{error}</p>}
                        
                        <button 
                            type="submit"
                            disabled={selectedModels.length === 0}
                            className="w-full bg-nexus-600 hover:bg-nexus-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-nexus-500/20 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-5 h-5" /> {isUpdateMode ? 'Update Configuration' : 'Initialize Enterprise Core'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};