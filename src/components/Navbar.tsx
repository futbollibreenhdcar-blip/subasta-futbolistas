import React from 'react';
import { AppView } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  totalPlayersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  totalPlayersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('setup')} 
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-sm shadow-amber-400/25 shrink-0 group-hover:scale-105 transition-transform">
            ⚽
          </div>

          <div className="truncate">
            <h1 className="font-black tracking-tight text-sm sm:text-base uppercase text-slate-900 flex items-center gap-1.5 font-display">
              <span>SUBASTA</span>
              <span className="text-amber-500">A CIEGAS</span>
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-amber-600 font-black">{totalPlayersCount}</span>
            <span className="text-slate-500">CARTAS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 text-xs font-bold font-display">
          <button
            onClick={() => onNavigate('setup')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              currentView === 'setup' || currentView === 'auction' || currentView === 'gameover'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-sm shadow-amber-400/20'
                : 'bg-slate-100/80 border border-slate-200/80 text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
            }`}
          >
            PARTIDA
          </button>
        </nav>
      </div>
    </header>
  );
};
