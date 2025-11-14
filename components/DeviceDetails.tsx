import React, { useState, useRef, useEffect } from 'react';
import { Device, MacFormat, Connection, ConnectionType, Room, Rack, DevicePlacement, DeviceType } from '../types';
import { normalizeMac, formatMac, isValidMac } from '../utils/macFormatter';
import { PlusIcon, TrashIcon, HistoryIcon, KeyIcon, DownloadIcon, UploadIcon } from './icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';

interface DeviceDetailsProps {
  device: Device;
  macFormat: MacFormat;
  addConnection: (deviceId: string, connection: Omit<Connection, 'id'>) => void;
  updateConnection: (deviceId: string, connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (deviceId: string, connectionId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Omit<Device, 'id' | 'connections' | 'changeLog'>>) => void;
  deleteDevice: (deviceId: string) => void;
  rooms: Room[];
  racks: Rack[];
  updateDevicePlacement: (deviceId: string, placement: DevicePlacement | undefined) => void;
}

const ConnectionRow: React.FC<{
    connection: Connection,
    macFormat: MacFormat,
    onDelete: () => void,
    onUpdate: (updates: Partial<Connection>) => void
}> = ({ connection, macFormat, onDelete, onUpdate }) => {
    const [macInput, setMacInput] = useState(formatMac(connection.macAddress, macFormat));

    useEffect(() => {
        setMacInput(formatMac(connection.macAddress, macFormat));
    }, [macFormat, connection.macAddress]);

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


export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, macFormat, addConnection, updateConnection, deleteConnection, updateDevice, deleteDevice, rooms, racks, updateDevicePlacement }) => {
    const [activeTab, setActiveTab] = useState<'connections' | 'changelog'>('connections');
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [placementRoomId, setPlacementRoomId] = useState(device.placement?.roomId || '');
    const [placementRackId, setPlacementRackId] = useState(device.placement?.rackId || '');
    const [placementUPosition, setPlacementUPosition] = useState(device.placement?.uPosition || 1);

    useEffect(() => {
        setPlacementRoomId(device.placement?.roomId || '');
        setPlacementRackId(device.placement?.rackId || '');
        setPlacementUPosition(device.placement?.uPosition || 1);
    }, [device]);

    const handlePlacementUpdate = () => {
        if (placementRoomId && placementRackId && device.uSize > 0) {
            updateDevicePlacement(device.id, {
                roomId: placementRoomId,
                rackId: placementRackId,
                uPosition: placementUPosition,
            });
        }
    };

    const handleUnassignPlacement = () => {
        updateDevicePlacement(device.id, undefined);
    };


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

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const base64Content = (loadEvent.target?.result as string)?.split(',')[1];
                if (base64Content) {
                    updateDevice(device.id, {
                        keyFile: { name: file.name, content: base64Content }
                    });
                }
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };

    const handleDownloadKey = () => {
        if (device.keyFile) {
            const link = document.createElement("a");
            link.href = `data:application/octet-stream;base64,${device.keyFile.content}`;
            link.download = device.keyFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDeleteKey = () => {
        updateDevice(device.id, { keyFile: undefined });
    };

    const handleConfirmDelete = () => {
        deleteDevice(device.id);
    };


    return (
        <>
            <div className="space-y-6">
                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <input value={device.name} onChange={e => updateDevice(device.id, { name: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-slate-400 mt-2">
                                <input value={device.ipAddress} onChange={e => updateDevice(device.id, { ipAddress: e.target.value })} className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2" placeholder="IP Address"/>
                                <input value={device.model} onChange={e => updateDevice(device.id, { model: e.target.value })} className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2" placeholder="Device Model"/>
                                <input value={device.iconUrl || ''} onChange={e => updateDevice(device.id, { iconUrl: e.target.value })} placeholder="Icon URL (optional)" className="bg-transparent focus:bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2 sm:col-span-2 md:col-span-1"/>
                            </div>
                        </div>
                        <button onClick={() => setDeleteConfirmOpen(true)} className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-red-500/20 transition-colors shrink-0">
                            <TrashIcon className="w-4 h-4"/> Delete Device
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 border-b border-slate-700 pb-3">Credentials & Notes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Username</label>
                            <input 
                                type="text"
                                value={device.username || ''}
                                onChange={e => updateDevice(device.id, { username: e.target.value })}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="e.g., admin"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Password</label>
                            <input 
                                type="password"
                                value={device.password || ''}
                                onChange={e => updateDevice(device.id, { password: e.target.value })}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-400 block mb-1">Details / Notes</label>
                            <textarea 
                                value={device.details || ''}
                                onChange={e => updateDevice(device.id, { details: e.target.value })}
                                rows={4}
                                className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Configuration details, physical location, etc."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Physical Placement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Room</label>
                            <select value={placementRoomId} onChange={e => { setPlacementRoomId(e.target.value); setPlacementRackId(''); }} disabled={device.uSize === 0} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50">
                                <option value="">-- Unassigned --</option>
                                {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-400 block mb-1">Rack</label>
                            <select value={placementRackId} onChange={e => setPlacementRackId(e.target.value)} disabled={!placementRoomId || device.uSize === 0} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50">
                                <option value="">-- Select Rack --</option>
                                {racks.filter(r => r.roomId === placementRoomId).map(rack => <option key={rack.id} value={rack.id}>{rack.name}</option>)}
                            </select>
                        </div>
                            <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div>
                                <label className="text-sm font-medium text-slate-400 block mb-1">U Size</label>
                                <input type="number" value={device.uSize} onChange={e => updateDevice(device.id, { uSize: Math.max(0, parseInt(e.target.value, 10) || 0) })} min="0" className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-400 block mb-1">U Position</label>
                                <input type="number" value={placementUPosition} onChange={e => setPlacementUPosition(parseInt(e.target.value, 10) || 1)} min="1" disabled={!placementRackId || device.uSize === 0} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50" />
                            </div>
                        </div>
                    </div>
                    {device.uSize === 0 && (
                        <p className="text-xs text-slate-500 mt-4">
                            Rack placement is disabled for 0U devices. Increase U Size to enable placement.
                        </p>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={handleUnassignPlacement} disabled={!device.placement} className="px-4 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50">Unassign</button>
                        <button onClick={handlePlacementUpdate} disabled={!placementRackId || device.uSize === 0} className="px-4 py-2 rounded-md text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Update Placement</button>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Device Key / Config File</h3>
                    {device.keyFile ? (
                        <div className="flex items-center justify-between bg-slate-700/50 rounded-md p-3">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <KeyIcon className="w-5 h-5 text-cyan-400 shrink-0" />
                                <span className="font-mono text-slate-300 truncate" title={device.keyFile.name}>{device.keyFile.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDownloadKey} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-full" title="Download Key">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                                <button onClick={handleDeleteKey} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full" title="Delete Key">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center">
                            <p className="text-slate-500 mb-3">No key or config file attached.</p>
                            <button 
                                onClick={handleUploadClick} 
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-md font-semibold text-sm transition-colors"
                            >
                                <UploadIcon className="w-5 h-5"/> Upload File
                            </button>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                    <div className="p-4 flex justify-between items-center border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveTab('connections')} className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 ${activeTab === 'connections' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                                Connections
                            </button>
                            <button onClick={() => setActiveTab('changelog')} className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 ${activeTab === 'changelog' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                                <HistoryIcon className="w-5 h-5" /> Change Log
                            </button>
                        </div>

                        {activeTab === 'connections' && (
                            <button onClick={handleAddNewConnection} className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-cyan-500/20 transition-colors">
                                <PlusIcon className="w-5 h-5"/> Add Connection
                            </button>
                        )}
                    </div>

                    {activeTab === 'connections' && (
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
                    )}

                    {activeTab === 'changelog' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 w-1/3">Timestamp</th>
                                        <th className="p-3 w-2/3">Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {device.changeLog?.map(log => (
                                        <tr key={log.id} className="border-b border-slate-700/50">
                                            <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="p-3">{log.change}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!device.changeLog || device.changeLog.length === 0) && (
                                <div className="text-center p-8 text-slate-500">
                                    <p>No change history for this device.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Device Deletion"
                message={<>Are you sure you want to move <strong>"{device.name}"</strong> to the recycle bin? This action can be undone.</>}
                confirmButtonText="Move to Bin"
                confirmButtonVariant="danger"
            />
        </>
    );
};