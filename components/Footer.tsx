import React from 'react';
import { Cpu, Twitter, Github, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-nexus-600 rounded-md">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Nexus AI</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              Empowering humanity through advanced artificial intelligence. 
              From free tiers to god-mode, we have the compute you need.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">API</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Showcase</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-nexus-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-nexus-400 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Nexus AI Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
             <span>System Status: <span className="text-green-500">Operational</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
};