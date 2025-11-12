import React, { useState } from 'react';
import { DeviceType, Device } from '../types';
import { XIcon } from './icons/Icons';

interface AddDeviceModalProps {
  onClose: () => void;
  onAddDevice: (device: Omit<Device, 'id' | 'connections' | 'changeLog' | 'placement'>) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ onClose, onAddDevice }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>(DeviceType.SWITCH);
  const [ipAddress, setIpAddress] = useState('');
  const [model, setModel] = useState('');
  const [uSize, setUSize] = useState(1);
  const [iconUrl, setIconUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [details, setDetails] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && ipAddress && model) {
      onAddDevice({ 
        name, 
        type, 
        ipAddress, 
        model, 
        uSize: type === DeviceType.CLOUD_SERVER ? 0 : uSize, 
        iconUrl: iconUrl || undefined, 
        username, 
        password, 
        details 
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add New Device</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Device Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-1">Device Type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as DeviceType)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" >
                <option value={DeviceType.SWITCH}>Switch</option>
                <option value={DeviceType.ROUTER}>Router</option>
                <option value={DeviceType.PC}>PC</option>
                <option value={DeviceType.SERVER}>Server</option>
                <option value={DeviceType.CLOUD_SERVER}>Cloud Server</option>
                <option value={DeviceType.AP}>Access Point</option>
                <option value={DeviceType.PRINTER}>Printer</option>
                <option value={DeviceType.OTHER}>Other</option>
              </select>
            </div>
             {type !== DeviceType.CLOUD_SERVER && (
                <div>
                    <label htmlFor="uSize" className="block text-sm font-medium text-slate-400 mb-1">U Size</label>
                    <input type="number" id="uSize" value={uSize} onChange={(e) => setUSize(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                </div>
             )}
            <div>
              <label htmlFor="ipAddress" className="block text-sm font-medium text-slate-400 mb-1">IP Address</label>
              <input type="text" id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
            </div>
             <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-400 mb-1">Model</label>
              <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
            </div>
          </div>
          <hr className="border-slate-700" />
          <h3 className="text-md font-semibold text-slate-300">Optional Details</h3>
           <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-1">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
           <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
           <div>
            <label htmlFor="details" className="block text-sm font-medium text-slate-400 mb-1">Details / Notes</label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
           <div>
            <label htmlFor="iconUrl" className="block text-sm font-medium text-slate-400 mb-1">Icon URL</label>
            <input
              type="text"
              id="iconUrl"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="https://example.com/icon.png"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">Add Device</button>
          </div>
        </form>
      </div>
    </div>
  );
};