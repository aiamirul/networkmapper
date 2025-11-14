
import React, { useState } from 'react';
import { XIcon, LinkIcon } from './icons/Icons';

interface UrlImportModalProps {
  onClose: () => void;
  onConfigLoaded: (config: any) => void;
}

export const UrlImportModal: React.FC<UrlImportModalProps> = ({ onClose, onConfigLoaded }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a valid URL.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL (${response.status}): ${response.statusText}`);
      }
      const data = await response.json();
      onConfigLoaded(data);
      onClose();
    } catch (err) {
      if (err instanceof TypeError) { // Network or CORS error
        setError("Network error or CORS issue. Please check the URL and browser console.");
      } else {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Import from URL</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Enter the URL of your JSON configuration file. Both plain and encrypted files are supported.
          </p>
          <div>
            <label htmlFor="import-url" className="block text-sm font-medium text-slate-400 mb-1">Configuration URL</label>
            <div className="relative">
                <input
                    type="url"
                    id="import-url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                    }}
                    className={`w-full bg-slate-700/50 border rounded-md pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`}
                    required
                    autoFocus
                    placeholder="https://example.com/config.json"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="w-5 h-5 text-slate-400" />
                </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading || !url} className="px-4 py-2 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed w-32 text-center">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
