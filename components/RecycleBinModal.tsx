import React from 'react';
import { Device } from '../types';
import { XIcon, TrashIcon, RefreshIcon } from './icons/Icons';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedDevices: Device[];
  onRestore: (deviceId: string) => void;
  onPermanentlyDelete: (deviceId: string) => void;
  onEmpty: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  deletedDevices,
  onRestore,
  onPermanentlyDelete,
  onEmpty,
}) => {
  if (!isOpen) return null;

  const handleEmptyBin = () => {
    if (window.confirm('Are you sure you want to permanently delete all items in the recycle bin? This action cannot be undone.')) {
        onEmpty();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recycle Bin</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {deletedDevices.length === 0 ? (
            <div className="text-center py-12">
              <TrashIcon className="w-16 h-16 mx-auto text-slate-600" />
              <p className="mt-4 text-slate-500">The recycle bin is empty.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-700">
              {deletedDevices.sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()).map(device => (
                <li key={device.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-200">{device.name}</p>
                    <p className="text-sm text-slate-400">
                      Deleted on: {device.deletedAt ? new Date(device.deletedAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onRestore(device.id)}
                      className="flex items-center gap-2 text-cyan-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-cyan-500/10 transition-colors"
                      title="Restore Device"
                    >
                      <RefreshIcon className="w-5 h-5" />
                      Restore
                    </button>
                    <button 
                      onClick={() => onPermanentlyDelete(device.id)}
                      className="flex items-center gap-2 text-red-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-red-500/10 transition-colors"
                      title="Delete Permanently"
                    >
                      <TrashIcon className="w-5 h-5" />
                      Delete Forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 flex justify-between items-center">
            <p className="text-sm text-slate-500">{deletedDevices.length} item(s) in the bin.</p>
            <button 
                onClick={handleEmptyBin}
                disabled={deletedDevices.length === 0}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-red-800 hover:bg-red-700 text-white transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                Empty Recycle Bin
            </button>
        </div>
      </div>
    </div>
  );
};