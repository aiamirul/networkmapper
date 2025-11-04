
import React, { useState } from 'react';
import { Device, MacFormat, Connection, ConnectionType } from '../types';
import { normalizeMac, formatMac, isValidMac } from '../utils/macFormatter';
import { PlusIcon, TrashIcon } from './icons/Icons';

interface DeviceDetailsProps {
  device: Device;
  macFormat: MacFormat;
  addConnection: (deviceId: string, connection: Omit<Connection, 'id'>) => void;
  updateConnection: (deviceId: string, connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (deviceId: string, connectionId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Omit<Device, 'id' | 'connections'>>) => void;
  deleteDevice: (deviceId: string) => void;
}

const ConnectionRow: React.FC<{
    connection: Connection,
    macFormat: MacFormat,
    onDelete: () => void,
    onUpdate: (updates: Partial<Connection>) => void
}> = ({ connection, macFormat, onDelete, onUpdate }) => {
    const [macInput, setMacInput] = useState(formatMac(connection.macAddress, macFormat));

    const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizeMac(e.target.value);
        setMacInput(e.target.value);
        if (isValidMac(normalized)) {
            onUpdate({ macAddress: normalized });
        }
    };

    const handleMacBlur = () => {
        const normalized = normalizeMac(macInput);
        if (isValidMac(normalized)) {
             setMacInput(formatMac(normalized, macFormat));
        }
    };
    
    return (
        <tr className="border-b border-slate-700/50 hover:bg-slate-800/30">
            <td className="p-3"><input type="number" value={connection.port} onChange={e => onUpdate({ port: parseInt(e.target.value) || 0 })} className="w-16 bg-transparent rounded p-1 focus:bg-slate-700 outline-none" /></td>
            <td className="p-3">
                <select value={connection.type} onChange={e => onUpdate({ type: e.target.value as ConnectionType })} className="bg-transparent rounded p-1 focus:bg-slate-700 outline-none border-none">
                    <option className="bg-slate-800" value={ConnectionType.STATIC}>STATIC</option>
                    <option className="bg-slate-800" value={ConnectionType.DHCP}>DHCP</option>
                </select>
            </td>
            <td className="p-3"><input type="text" value={connection.ipAddress} onChange={e => onUpdate({ ipAddress: e.target.value })} className="w-full bg-transparent rounded p-1 focus:bg-slate-700 outline-none" /></td>
            <td className="p-3"><input type="text" value={macInput} onChange={handleMacChange} onBlur={handleMacBlur} className="w-full font-mono bg-transparent rounded p-1 focus:bg-slate-700 outline-none" /></td>
            <td className="p-3"><input type="text" value={connection.hostname} onChange={e => onUpdate({ hostname: e.target.value })} className="w-full bg-transparent rounded p-1 focus:bg-slate-700 outline-none" /></td>
            <td className="p-3 text-right">
                <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </td>
        </tr>
    );
};


export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, macFormat, addConnection, updateConnection, deleteConnection, updateDevice, deleteDevice }) => {

    const handleAddNewConnection = () => {
        const newConnection: Omit<Connection, 'id'> = {
            port: device.connections.length > 0 ? Math.max(...device.connections.map(c => c.port)) + 1 : 1,
            type: ConnectionType.STATIC,
            ipAddress: '0.0.0.0',
            macAddress: '000000000000',
            hostname: 'new-device'
        };
        addConnection(device.id, newConnection);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <input value={device.name} onChange={e => updateDevice(device.id, { name: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 mt-2">
                             <input value={device.ipAddress} onChange={e => updateDevice(device.id, { ipAddress: e.target.value })} className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                            <span>|</span>
                            <input value={device.model} onChange={e => updateDevice(device.id, { model: e.target.value })} className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                             <span>|</span>
                            <input value={device.iconUrl || ''} onChange={e => updateDevice(device.id, { iconUrl: e.target.value })} placeholder="Icon URL (optional)" className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                        </div>
                    </div>
                    <button onClick={() => deleteDevice(device.id)} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-red-500/20 transition-colors">
                        <TrashIcon className="w-4 h-4"/> Delete Device
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-slate-700/50">
                    <h3 className="text-lg font-semibold">Connections</h3>
                    <button onClick={handleAddNewConnection} className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-cyan-500/20 transition-colors">
                        <PlusIcon className="w-5 h-5"/> Add Connection
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-3">Port</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">IP Address</th>
                                <th className="p-3">MAC Address</th>
                                <th className="p-3">Hostname</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {device.connections.map(conn => (
                                <ConnectionRow
                                    key={conn.id}
                                    connection={conn}
                                    macFormat={macFormat}
                                    onDelete={() => deleteConnection(device.id, conn.id)}
                                    onUpdate={(updates) => updateConnection(device.id, conn.id, updates)}
                                />
                            ))}
                        </tbody>
                    </table>
                     {device.connections.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            <p>No connections found for this device.</p>
                            <p>Click "Add Connection" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
