import React from 'react';
import { XIcon } from './icons/Icons';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ url, onClose }) => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Share Configuration Link</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <img src={qrApiUrl} alt="QR Code for configuration link" width="256" height="256" className="rounded-lg bg-white p-2"/>
          <p className="text-xs text-slate-400 text-center break-all bg-slate-900/50 p-2 rounded-md">{url}</p>
        </div>
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
