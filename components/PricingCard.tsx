import React from 'react';
import { Check, Clock, CheckCircle2, Star } from 'lucide-react';
import { PricingCardProps } from '../types';

export const PricingCard: React.FC<PricingCardProps> = ({ plan, onSelect, onStartTrial, trialStatus, icon, isPopular }) => {
  // Dynamic color generation based on the plan's color property
  const borderColor = `border-${plan.color}-500`;
  const btnBgColor = `bg-${plan.color}-600`;
  const btnHoverColor = `hover:bg-${plan.color}-500`;
  const glowColor = `shadow-${plan.color}-500/20`;

  const isCurrent = trialStatus === 'current';
  const isUsed = trialStatus === 'used';
  const hasTrial = !!plan.trialDuration;

  return (
    <div 
      className={`
        relative flex flex-col p-6 rounded-2xl border bg-slate-900 transition-all duration-300 hover:-translate-y-2 h-full
        ${plan.id === 'full-max-premium' ? 'border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)]' : isCurrent ? 'border-2 border-nexus-400 shadow-[0_0_30px_rgba(56,189,248,0.3)]' : 'border-slate-800 hover:border-slate-600'}
        ${isPopular && !isCurrent ? 'ring-2 ring-nexus-400 ring-offset-2 ring-offset-slate-950 shadow-xl' : ''}
      `}
    >
      {isPopular && !isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-nexus-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap z-10 animate-pulse">
          Most Popular
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1 whitespace-nowrap z-10">
          <CheckCircle2 className="w-3 h-3" /> Current Plan
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-slate-400 mt-1 h-10 line-clamp-2">{plan.description}</p>
        </div>
        <div className={`p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 ${plan.id === 'full-max-premium' ? 'animate-pulse text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}`}>
          {icon}
        </div>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-white tracking-tight">{plan.currency}{plan.price}</span>
        <span className="text-slate-500 font-medium ml-1">{plan.period}</span>
      </div>

      {plan.highlightFeature && (
         <div className={`mb-4 px-3 py-2 rounded-lg bg-${plan.color}-900/20 border border-${plan.color}-500/30 flex items-center gap-2 shadow-inner`}>
            <Star className={`w-4 h-4 text-${plan.color}-400 fill-${plan.color}-400`} />
            <span className={`text-xs font-bold text-${plan.color}-300 uppercase tracking-wide`}>
              {plan.highlightFeature}
            </span>
         </div>
      )}

      <div className="flex-1 min-h-[180px] mb-6 relative bg-slate-950/50 rounded-lg border border-slate-800/50">
         <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-3">
            <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                    <Check className={`w-4 h-4 mr-3 shrink-0 mt-0.5 ${plan.id === 'full-max-premium' ? 'text-rose-500' : 'text-nexus-500'}`} />
                    <span className="text-sm text-slate-300 leading-tight">{feature}</span>
                </li>
                ))}
            </ul>
         </div>
      </div>

      <div className="space-y-3 mt-auto pt-4 border-t border-slate-800">
        {isCurrent ? (
           <button
             disabled
             className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-slate-400 cursor-default border border-slate-700"
           >
             Active
           </button>
        ) : (
          <button
            onClick={() => onSelect(plan.id)}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg transform hover:-translate-y-0.5 hover:shadow-xl
              ${plan.id === 'free' ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' : ''}
              ${plan.id === 'full-max-premium' ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-rose-500/20' : ''}
              ${plan.id !== 'free' && plan.id !== 'full-max-premium' ? 'bg-nexus-600 hover:bg-nexus-500 text-white shadow-nexus-500/20' : ''}
            `}
          >
            {plan.buttonText}
          </button>
        )}

        {hasTrial && !isCurrent && !isUsed && (
          <button
            onClick={() => onStartTrial(plan.id)}
            className="w-full py-2 px-4 rounded-xl font-semibold text-xs border border-slate-600 hover:border-nexus-400 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 group bg-slate-950 hover:bg-slate-900"
          >
            <Clock className="w-3 h-3 group-hover:text-nexus-400" />
            Try Free for {plan.trialDuration}
          </button>
        )}
      </div>
    </div>
  );
};