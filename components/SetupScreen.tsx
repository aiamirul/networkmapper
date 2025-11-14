
import React, { useRef } from 'react';
import { UploadIcon, DiagramIcon, AlertTriangleIcon } from './icons/Icons';

interface SetupScreenProps {
    onStartNew: () => void;
    onImportFromFile: (config: any) => void;
    initializationError: string | null;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartNew, onImportFromFile, initializationError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                        if (parsedData.salt && typeof parsedData.data === 'string') {
                            alert("Encrypted files are not supported during initial setup. Please start with a demo or a plain JSON file, then import the encrypted file from the main application settings.");
                        } else if (Array.isArray(parsedData.devices) && Array.isArray(parsedData.topology)) {
                            onImportFromFile(parsedData);
                        } else {
                            throw new Error('Invalid or unrecognized configuration file format.');
                        }
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
            </div>
        </div>
    );
};
