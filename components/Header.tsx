
import React from 'react';
import { MacFormat } from '../types';
import { BrainCircuitIcon, SettingsIcon } from './icons/Icons';

interface HeaderProps {
  macFormat: MacFormat;
  setMacFormat: (format: MacFormat) => void;
  onAnalyzeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ macFormat, setMacFormat, onAnalyzeClick }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">NetDiagram AI</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-400 hidden sm:inline">MAC Format:</span>
            <select
                value={macFormat}
                onChange={(e) => setMacFormat(e.target.value as MacFormat)}
                className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <option value={MacFormat.HYPHEN}>00-11-22.._</option>
                <option value={MacFormat.COLON}>00:11:22.._</option>
                <option value={MacFormat.DOT}>0011.2233.._</option>
                <option value={MacFormat.NONE}>001122.._</option>
            </select>
        </div>
        <button 
            onClick={onAnalyzeClick}
            className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-md font-semibold text-sm hover:bg-cyan-500/20 transition-colors duration-200"
        >
          <BrainCircuitIcon className="w-5 h-5" />
          <span className="hidden md:inline">Analyze Network</span>
        </button>
      </div>
    </header>
  );
};
