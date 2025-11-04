
import React, { useState, useEffect } from 'react';
import { getNetworkAnalysis } from '../services/geminiService';
import { XIcon } from './icons/Icons';

interface NetworkAnalysisModalProps {
  onClose: () => void;
  networkState: object;
}

export const NetworkAnalysisModal: React.FC<NetworkAnalysisModalProps> = ({ onClose, networkState }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      try {
        const result = await getNetworkAnalysis(networkState);
        setAnalysis(result);
      } catch (error) {
        setAnalysis("Failed to retrieve network analysis. Please check your API key and network connection.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkState]);

  // A simple markdown to HTML converter for basic formatting
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 text-cyan-300 rounded px-1 py-0.5 font-mono text-sm">$1</code>')
      .replace(/^\* (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">AI Network Analysis</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
                <svg className="animate-spin h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-slate-400">Analyzing your network configuration...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }}></div>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
