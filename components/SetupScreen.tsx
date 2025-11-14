
import React, { useRef, useState } from 'react';
import { UploadIcon, DiagramIcon, AlertTriangleIcon, LinkIcon } from './icons/Icons';

interface SetupScreenProps {
    onStartNew: () => void;
    onImportFromFile: (config: any) => void;
    initializationError: string | null;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartNew, onImportFromFile, initializationError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [urlError, setUrlError] = useState<string | null>(null);

    const handleFileImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = e => {
                try {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                        const parsedData = JSON.parse(result);
                        onImportFromFile(parsedData);
                    } else {
                        throw new Error("Could not read file content.");
                    }
                } catch (error) {
                    alert(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
                } finally {
                    if (event.target) event.target.value = '';
                }
            };
            fileReader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Error reading the selected file.");
            };
        }
    };

    const handleUrlImport = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!url.trim()) {
            setUrlError("Please enter a valid URL.");
            return;
        }

        setIsLoadingUrl(true);
        setUrlError(null);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch from URL (${response.status}): ${response.statusText}`);
            }
            const data = await response.json();
            onImportFromFile(data);
        } catch (error) {
             if (error instanceof TypeError) { // This often indicates a network or CORS error
                setUrlError("Network error or CORS issue. Please check the URL and browser console.");
            } else {
                setUrlError(error instanceof Error ? error.message : "An unknown error occurred.");
            }
        } finally {
            setIsLoadingUrl(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-slate-100 tracking-tight">NetDiagram AI</h1>
                </div>
                <p className="text-xl text-slate-400 mb-8">Welcome! Let's get your network visualized.</p>

                {initializationError && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-8 flex items-center gap-3">
                        <AlertTriangleIcon className="w-6 h-6 shrink-0"/>
                        <p className="text-left"><strong>Initialization Error:</strong> {initializationError}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={onStartNew} className="group bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-cyan-500 hover:bg-slate-700/50 transition-all duration-300 text-left">
                        <DiagramIcon className="w-10 h-10 mb-4 text-cyan-500" />
                        <h2 className="text-xl font-semibold text-slate-100 mb-2">Start New Project</h2>
                        <p className="text-slate-400">Begin with a blank canvas and build your network diagram from scratch.</p>
                    </button>

                    <button onClick={handleFileImportClick} className="group bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-cyan-500 hover:bg-slate-700/50 transition-all duration-300 text-left">
                        <UploadIcon className="w-10 h-10 mb-4 text-cyan-500" />
                        <h2 className="text-xl font-semibold text-slate-100 mb-2">Import from JSON</h2>
                        <p className="text-slate-400">Load your existing network configuration from an unencrypted JSON file.</p>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                </div>

                <div className="mt-8 pt-8 border-t border-slate-700/50">
                     <h3 className="text-xl text-slate-400 mb-4">Or Load from a URL</h3>
                     <form onSubmit={handleUrlImport} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-lg mx-auto">
                        <div className="relative flex-grow w-full">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                                placeholder="https://example.com/config.json"
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoadingUrl}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-md font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed shrink-0"
                        >
                            {isLoadingUrl ? (
                                <>
                                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                                </>
                            ) : 'Load from URL'}
                        </button>
                     </form>
                     {urlError && (
                        <p className="text-red-400 mt-3 text-sm">{urlError}</p>
                     )}
                </div>
            </div>
        </div>
    );
};
