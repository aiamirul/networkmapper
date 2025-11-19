import React from 'react';
import { View } from '../types';
import { DiagramIcon, ViewGridIcon } from './icons/Icons';

interface ViewNavigatorProps {
  currentView: View;
  setView: (view: View) => void;
}

export const ViewNavigator: React.FC<ViewNavigatorProps> = ({ currentView, setView }) => {
  const isDetailsView = currentView === View.DEVICE_DETAILS;
  
  const views = [
    { id: View.DIAGRAM, label: 'Topology Diagram', icon: DiagramIcon },
    { id: View.PHYSICAL, label: 'Physical Layout', icon: ViewGridIcon },
  ];

  return (
    <div className="flex items-center border-b border-slate-700/50 shrink-0">
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => setView(view.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
            currentView === view.id && !isDetailsView
              ? 'border-b-2 border-cyan-400 text-cyan-300'
              : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <view.icon className="w-5 h-5" />
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
      {isDetailsView && (
         <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-cyan-400 text-cyan-300">
            {/* You could add a specific icon for details view here */}
            <span>Device Details</span>
         </div>
      )}
    </div>
  );
};
