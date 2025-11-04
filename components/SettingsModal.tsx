import React, { useState, useEffect, useCallback } from 'react';
import { XIcon, UploadIcon, DownloadIcon, RefreshIcon } from './icons/Icons';
import { RemoteConfig, Device, TopologyLink, Room, Rack } from '../types';
import { encryptForRemote, decryptFromRemote } from '../services/cryptoService';
import { fetchRemoteConfigs, saveRemoteConfig } from '../services/api';

interface SettingsModalProps {
  onClose: () => void;
  networkState: { devices: Device[], topology: TopologyLink[], rooms: Room[], racks: Rack[] };
  importConfiguration: (config: { devices: Device[], topology: TopologyLink[], rooms: Room[], racks: Rack[] }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, networkState, importConfiguration }) => {
  const [serverUrl, setServerUrl] = useState<string>(() => localStorage.getItem('netdiagram_serverUrl') || 'https://shabpltsystem.com/app/networkmap/networkmap.php');
  const [username, setUsername] = useState<string>(() => localStorage.getItem('netdiagram_username') || '');
  const [salt, setSalt] = useState<string>(() => localStorage.getItem('netdiagram_salt') || '');
  const [passphrase, setPassphrase] = useState<string>('');
  
  const [configs, setConfigs] = useState<RemoteConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('netdiagram_serverUrl', serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    localStorage.setItem('netdiagram_username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('netdiagram_salt', salt);
  }, [salt]);

  const handleFetchConfigs = useCallback(async () => {
    if (!serverUrl || !username) {
      setConfigs([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRemoteConfigs(serverUrl, username);
      setConfigs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching configurations.');
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, username]);

  useEffect(() => {
    handleFetchConfigs();
  }, [handleFetchConfigs]);

  const handleSave = async () => {
    if (!serverUrl || !passphrase || !salt || !username) {
      setError("Server URL, Username, Passphrase, and Salt are required to save.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setStatus('Encrypting configuration...');
    try {
      const { nonce, ciphertext } = await encryptForRemote(networkState, passphrase, salt);
      const payload = { salt, nonce, ciphertext };
      
      setStatus('Saving to server...');
      await saveRemoteConfig(serverUrl, username, payload);

      setStatus('Save successful! Refreshing list...');
      await handleFetchConfigs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during save.');
    } finally {
      setIsLoading(false);
      setPassphrase('');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleLoad = async (config: RemoteConfig) => {
    if (!passphrase) {
        setError("A passphrase is required to load a configuration.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setStatus(`Loading configuration from ${config.date}...`);

    try {
        setStatus('Decrypting configuration...');
        const decryptedData = await decryptFromRemote(config.data, passphrase);

        if (decryptedData && Array.isArray(decryptedData.devices) && Array.isArray(decryptedData.topology)) {
            importConfiguration(decryptedData as any);
            setStatus('Configuration loaded successfully!');
            setTimeout(onClose, 1000);
        } else {
            throw new Error("Decrypted data is not in the expected format. Check passphrase.");
        }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during load. Check your passphrase.');
      setStatus('');
    } finally {
      setIsLoading(false);
      setPassphrase('');
      setTimeout(() => setStatus(''), 3000);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Settings & Remote Storage</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-4 bg-slate-900/50 rounded-lg">
                 <h3 className="text-lg font-semibold mb-3">API & Encryption</h3>
                 <div className="space-y-4">
                     <div>
                        <label htmlFor="serverUrl" className="block text-sm font-medium text-slate-400 mb-1">Server URL</label>
                        <input type="text" id="serverUrl" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="https://api.example.com/configs" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-1">Username</label>
                            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Your username for storage" />
                        </div>
                        <div>
                            <label htmlFor="salt" className="block text-sm font-medium text-slate-400 mb-1">Encryption Salt (for saving)</label>
                            <input type="text" id="salt" value={salt} onChange={(e) => setSalt(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="A random string" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="passphrase" className="block text-sm font-medium text-slate-400 mb-1">Passphrase</label>
                        <input type="password" id="passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Enter for saving/loading" />
                    </div>
                 </div>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">Saved Configurations</h3>
                        <button onClick={handleFetchConfigs} disabled={isLoading} className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50" title="Refresh list">
                           <RefreshIcon className={`w-5 h-5 text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <button onClick={handleSave} disabled={isLoading || !passphrase || !serverUrl || !salt || !username} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-md font-semibold text-sm transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                        <UploadIcon className="w-4 h-4" /> Save Current to Server
                    </button>
                </div>
                 <div className="bg-slate-800 rounded-md min-h-[150px] max-h-[300px] overflow-y-auto">
                    {isLoading && !status && <p className="p-4 text-center text-slate-400">Loading...</p>}
                    {status && <p className="p-4 text-center text-cyan-400">{status}</p>}
                    {error && <p className="p-4 text-center text-red-400">{error}</p>}
                    {!isLoading && !error && configs.length === 0 && <p className="p-4 text-center text-slate-500">No saved configurations found for this user at this URL.</p>}
                    {!isLoading && !error && configs.length > 0 && (
                        <ul className="divide-y divide-slate-700">
                           {configs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(config => (
                               <li key={config.date} className="p-3 flex justify-between items-center">
                                   <div>
                                       <p className="font-semibold text-slate-300">{new Date(config.date).toLocaleString()}</p>
                                   </div>
                                   <button onClick={() => handleLoad(config)} disabled={isLoading || !passphrase} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-md font-semibold text-sm transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed">
                                        <DownloadIcon className="w-4 h-4" /> Load
                                   </button>
                               </li>
                           ))}
                        </ul>
                    )}
                 </div>
            </div>
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};