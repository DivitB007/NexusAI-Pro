import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, Globe, Cloud, CloudOff } from 'lucide-react';
import { GoogleCloudSync } from '../services/GoogleCloudSync';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudActive = GoogleCloudSync.isCloudActive();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await GoogleCloudSync.login(email, password);
      } else {
        user = await GoogleCloudSync.signup(email, password, name);
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        {/* Background Animation */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isCloudActive ? 'via-emerald-500' : 'via-nexus-500'} to-transparent animate-scanline opacity-50`}></div>
        
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-4 ${isCloudActive ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-nexus-900/30 border border-nexus-500/30'}`}>
             {isCloudActive ? <Cloud className="w-8 h-8 text-emerald-400 animate-pulse" /> : <CloudOff className="w-8 h-8 text-nexus-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isLogin ? 'Access Neural Cloud' : 'Initialize Identity'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm">
             <span className="text-slate-400">Status:</span>
             {isCloudActive ? (
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> ONLINE (Google Cloud)</span>
             ) : (
                <span className="text-orange-400 flex items-center gap-1 font-mono text-xs">LOCAL SIMULATION</span>
             )}
          </div>
          {!isCloudActive && (
             <p className="text-[10px] text-slate-500 mt-2 max-w-[250px] mx-auto">
               Config missing. Data will not sync across devices. Edit constants.ts to enable Cloud.
             </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-nexus-500 transition-colors"
                required
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-nexus-500 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-nexus-500 transition-colors"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-900/10 border border-red-900/30 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-2 ${isCloudActive ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-nexus-600 hover:bg-nexus-500 shadow-nexus-500/20'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {isLogin ? 'Establish Connection' : 'Create Uplink'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">{isLogin ? "New to Nexus?" : "Already linked?"}</span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className={`ml-2 font-medium ${isCloudActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-nexus-400 hover:text-nexus-300'}`}
          >
            {isLogin ? "Create Account" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};