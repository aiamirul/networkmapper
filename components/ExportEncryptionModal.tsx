
import React, { useState } from 'react';
import { Device, TopologyLink, EncryptedConfig, Room, Rack } from '../types';
import { encryptData } from '../services/cryptoService';
import { XIcon } from './icons/Icons';

interface ExportEncryptionModalProps {
  onClose: () => void;
  networkState: { devices: Device[], topology: TopologyLink[], rooms: Room[], racks: Rack[] };
}

export const ExportEncryptionModal: React.FC<ExportEncryptionModalProps> = ({ onClose, networkState }) => {
  const [passphrase, setPassphrase] = useState('');
  const [salt, setSalt] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const generateSalt = () => {
    const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setSalt(saltHex);
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || !salt) {
      alert("Passphrase and Salt are required for encryption.");
      return;
    }

    setIsExporting(true);
    try {
      const encryptedDataString = await encryptData(networkState, passphrase, salt);
      const exportPayload: EncryptedConfig = {
        salt,
        data: encryptedDataString,
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportPayload, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "netdiagram-ai-config.encrypted.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Failed to encrypt and export configuration. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Export Encrypted Configuration</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleExport} className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Your configuration will be encrypted client-side before being saved. You will need the same passphrase and salt to decrypt it later.
          </p>
          <div>
            <label htmlFor="passphrase" className="block text-sm font-medium text-slate-400 mb-1">Passphrase</label>
            <input
              type="password"
              id="passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div>
            <label htmlFor="salt" className="block text-sm font-medium text-slate-400 mb-1">Salt</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="salt"
                value={salt}
                onChange={(e) => setSalt(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
              <button
                type="button"
                onClick={generateSalt}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-600 hover:bg-slate-500 transition-colors shrink-0"
              >
                Generate
              </button>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={isExporting || !passphrase || !salt} className="px-4 py-2 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
              {isExporting ? 'Exporting...' : 'Encrypt & Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
