import React from 'react';
import { Shield, Zap, Server, Database, Globe, Lock, Cpu, Brain, Network, BarChart3, TrendingUp, Activity, PieChart, Download, MessageSquare } from 'lucide-react';
import { UserAnalytics } from '../types';

export const FeaturesView: React.FC = () => (
  <div className="container mx-auto px-4 py-16 text-white">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold mb-4">Nexus v2 Capabilities</h2>
      <p className="text-slate-400 max-w-2xl mx-auto">Explore the cutting-edge features of the Singularity Update.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { icon: <Brain className="w-8 h-8 text-nexus-400" />, title: "Cognitive Reasoning v2", desc: "Multi-step chain-of-thought processing for complex problem solving." },
        { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Quantum Latency", desc: "Sub-500ms time-to-first-token on supported tiers." },
        { icon: <Globe className="w-8 h-8 text-green-400" />, title: "Universal Translation", desc: "Fluent in over 200 languages and 50 programming dialects." },
        { icon: <Lock className="w-8 h-8 text-vault-500" />, title: "Nexus Vault", desc: "Zero-retention environment for sensitive enterprise data." },
        { icon: <Database className="w-8 h-8 text-purple-400" />, title: "1M+ Context", desc: "Recall entire codebases or books with near-perfect accuracy." },
        { icon: <Network className="w-8 h-8 text-orange-400" />, title: "Neural Uplink", desc: "Direct multimodal injection for image and audio analysis." }
      ].map((f, i) => (
        <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-nexus-500/50 transition-colors">
          <div className="mb-4">{f.icon}</div>
          <h3 className="text-xl font-bold mb-2">{f.title}</h3>
          <p className="text-slate-400 text-sm">{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export const ModelsView: React.FC = () => (
  <div className="container mx-auto px-4 py-16 text-white">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold mb-4">The Model Garden</h2>
      <p className="text-slate-400">Choose the perfect neural engine for your specific task.</p>
    </div>
    <div className="space-y-6 max-w-4xl mx-auto">
      {[
        { name: "Nexus 0.1", params: "Standard", use: "General purpose assistance, warmth, and creativity." },
        { name: "Nexus 0.2", params: "Flagship", use: "Complex reasoning, coding, math, and vision. Uses Thinking logic." },
        { name: "Nexus Pro", params: "Enterprise", use: "High-accuracy business logic and structured data output." },
        { name: "Nexus Agent", params: "Web-Connected", use: "Real-time deep research on specific URLs." },
      ].map((m, i) => (
        <div key={i} className="flex items-center justify-between p-6 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/50 transition-colors">
          <div>
            <h3 className="text-xl font-bold text-nexus-400">{m.name}</h3>
            <p className="text-slate-500">{m.use}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700">{m.params}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EnterpriseView: React.FC = () => (
  <div className="container mx-auto px-4 py-16 text-white">
    <div className="grid lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 className="text-4xl font-bold mb-6">Nexus Enterprise Core</h2>
        <p className="text-lg text-slate-400 mb-8">
          Deploy Nexus AI within your secure VPC. Maintain full control over your data while leveraging the world's most advanced intelligence.
        </p>
        <ul className="space-y-4 mb-8">
          {[
            "SOC 2 Type II Certified",
            "HIPAA Compliant Data Handling",
            "Dedicated Support Engineers (24/7)",
            "Custom Model Fine-tuning",
            "99.99% Uptime SLA"
          ].map((item, i) => (
            <li key={i} className="flex items-center text-slate-300">
              <Shield className="w-5 h-5 text-nexus-500 mr-3" />
              {item}
            </li>
          ))}
        </ul>
        <button className="bg-white text-slate-950 px-6 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors">
          Contact Sales
        </button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-nexus-500/20 blur-3xl rounded-full"></div>
        <div className="relative p-8 rounded-3xl bg-slate-900 border border-slate-800/50 backdrop-blur-xl">
           <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-lg bg-nexus-900/50 flex items-center justify-center">
                 <Activity className="w-5 h-5 text-nexus-400" />
              </div>
              <div>
                 <div className="font-bold text-white">System Status</div>
                 <div className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Operational
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="text-xs text-slate-500 mb-1">Latency</div>
                 <div className="text-xl font-mono text-white">42ms</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                 <div className="text-xs text-slate-500 mb-1">Requests/sec</div>
                 <div className="text-xl font-mono text-white">8,492</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
);

interface DashboardViewProps {
  analytics?: UserAnalytics;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ analytics }) => {
  // Use real analytics if available, otherwise default
  const stats = analytics || {
    totalTokens: 0,
    totalMessages: 0,
    totalCost: 0,
    activeChats: 0,
    modelUsage: {},
    history: new Array(24).fill(0)
  };

  const formatTokens = (num: number) => {
    return num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num;
  };

  const totalUsage = Object.values(stats.modelUsage).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="container mx-auto px-4 py-8 text-white h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Activity className="w-6 h-6 text-nexus-400" /> Live Analytics
           </h2>
           <p className="text-slate-400 text-sm">Real-time usage monitoring and cost analysis.</p>
         </div>
         <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
         {[
           { label: "Total Tokens", val: formatTokens(stats.totalTokens), icon: <Database className="w-4 h-4 text-purple-400" />, color: "purple" },
           { label: "Total Messages", val: stats.totalMessages.toLocaleString(), icon: <MessageSquare className="w-4 h-4 text-blue-400" />, color: "blue" },
           { label: "Est. Cost", val: `$${stats.totalCost.toFixed(4)}`, icon: <BarChart3 className="w-4 h-4 text-green-400" />, color: "green" },
           { label: "Efficiency", val: "99.1%", icon: <TrendingUp className="w-4 h-4 text-orange-400" />, color: "orange" },
         ].map((stat, i) => (
           <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-slate-500 text-xs uppercase font-bold">{stat.label}</span>
                 {stat.icon}
              </div>
              <div className="text-2xl font-bold font-mono">{stat.val}</div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
               <Activity className="w-4 h-4 text-nexus-400" /> Token Usage (Last 24h)
            </h3>
            <div className="h-64 flex items-end gap-2 border-b border-slate-800 pb-2">
               {stats.history.map((h, i) => {
                  const max = Math.max(...stats.history) || 100;
                  const height = (h / max) * 100;
                  return (
                    <div key={i} className="flex-1 bg-nexus-900/50 hover:bg-nexus-500 transition-colors rounded-t-sm relative group" style={{height: `${Math.max(5, height)}%`}}>
                        <div className="absolute bottom-full w-full text-[8px] text-center text-nexus-300 opacity-0 group-hover:opacity-100 mb-1">
                            {h}
                        </div>
                    </div>
                  );
               })}
            </div>
         </div>
         
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
               <PieChart className="w-4 h-4 text-nexus-400" /> Model Distribution
            </h3>
            <div className="space-y-4">
               {Object.entries(stats.modelUsage).length > 0 ? Object.entries(stats.modelUsage).map(([model, count], i) => (
                 <div key={i}>
                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                       <span className="capitalize">{model.replace('nexus-', '')}</span>
                       <span>{Math.round((count / totalUsage) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div className={`h-full ${i % 2 === 0 ? 'bg-nexus-500' : 'bg-purple-500'}`} style={{width: `${(count / totalUsage) * 100}%`}}></div>
                    </div>
                 </div>
               )) : (
                 <div className="text-center text-slate-500 text-sm py-10">No usage data yet.</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};