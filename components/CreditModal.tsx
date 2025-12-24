import React, { useState } from 'react';
import { X, Coins, ArrowRight, Wallet } from 'lucide-react';

interface CreditModalProps {
  onClose: () => void;
  onAddCredits: (amount: number) => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ onClose, onAddCredits }) => {
  const [dollarAmount, setDollarAmount] = useState<number>(50);
  const [redeemCode, setRedeemCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const CREDITS_PER_DOLLAR = 200;
  const creditAmount = dollarAmount * CREDITS_PER_DOLLAR;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (redeemCode === 'C736241') {
      onAddCredits(creditAmount);
    } else {
      setError("Invalid transaction code. Please use the authorized merchant code.");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
            <Coins className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Add Compute Credits</h3>
          <p className="text-sm text-slate-400 mt-1">
            Exchange currency for Nexus Compute Credits.
          </p>
        </div>

        <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
           <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Amount ($)</span>
              <span className="text-white font-bold text-xl">${dollarAmount}</span>
           </div>
           <input 
             type="range" 
             min="1" 
             max="500" 
             step="1"
             value={dollarAmount}
             onChange={(e) => setDollarAmount(Number(e.target.value))}
             className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2"
           />
           <div className="flex justify-between text-xs text-slate-500">
             <span>$1</span>
             <span>$500</span>
           </div>

           <div className="flex items-center justify-center gap-4 mt-6">
              <div className="text-center">
                 <div className="text-sm text-slate-500">Payment</div>
                 <div className="font-bold text-white">${dollarAmount}</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600" />
              <div className="text-center">
                 <div className="text-sm text-slate-500">Credits</div>
                 <div className="font-bold text-emerald-400">{creditAmount.toLocaleString()}</div>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transaction Code</label>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => {
                setRedeemCode(e.target.value);
                setError(null);
              }}
              placeholder="Enter Transaction Code"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono tracking-widest uppercase"
              required
            />
            {error && (
              <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" /> Add Funds
          </button>
        </form>
      </div>
    </div>
  );
};