
import React, { useState } from 'react';
import { Device, TopologyLink } from '../types';
import { decryptData } from '../services/cryptoService';
import { XIcon } from './icons/Icons';

interface ImportDecryptionModalProps {
  onClose: () => void;
  encryptedData: { salt: string; data: string };
  onSuccess: (config: { devices: Device[], topology: TopologyLink[] }) => void;
}

export const ImportDecryptionModal: React.FC<ImportDecryptionModalProps> = ({ onClose, encryptedData, onSuccess }) => {
  const [passphrase, setPassphrase] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) {
      setError("A passphrase is required to decrypt the file.");
      return;
    }

    setIsDecrypting(true);
    setError(null);
    try {
      const decryptedData = await decryptData(encryptedData.data, passphrase, encryptedData.salt);
      if (Array.isArray(decryptedData.devices) && Array.isArray(decryptedData.topology)) {
        onSuccess(decryptedData);
        onClose();
      } else {
        throw new Error('Decrypted data is not in the expected format.');
      }
    } catch (decryptionError) {
      console.error("Decryption failed:", decryptionError);
      setError("Decryption failed. Please check your passphrase and try again.");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Decrypt Configuration</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleDecrypt} className="p-6 space-y-4">
          <p className="text-sm text-slate-400">
            This configuration file is encrypted. Enter the passphrase to decrypt and import it.
          </p>
          <div>
            <label htmlFor="passphrase-import" className="block text-sm font-medium text-slate-400 mb-1">Passphrase</label>
            <input
              type="password"
              id="passphrase-import"
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value);
                setError(null);
              }}
              className={`w-full bg-slate-700/50 border rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={isDecrypting || !passphrase} className="px-4 py-2 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
              {isDecrypting ? 'Decrypting...' : 'Decrypt & Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
