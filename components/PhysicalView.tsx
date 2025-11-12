import React, { useState, useMemo } from 'react';
import { Device, Room, Rack, DevicePlacement, DeviceType } from '../types';
import { PlusIcon, TrashIcon, ServerIcon, SwitchIcon, RouterIcon, PCIcon, APIcon, PrinterIcon, SettingsIcon, XIcon, CloudServerIcon } from './icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';

interface PhysicalViewProps {
    devices: Device[];
    rooms: Room[];
    racks: Rack[];
    addRoom: (name: string) => void;
    updateRoom: (roomId: string, updates: Partial<Room>) => void;
    deleteRoom: (roomId: string) => void;
    addRack: (rack: Omit<Rack, 'id'>) => void;
    updateRack: (rackId: string, updates: Partial<Rack>) => void;
    deleteRack: (rackId: string) => void;
    updateDevicePlacement: (deviceId: string, placement: DevicePlacement | undefined) => void;
}

const UnplacedDevice: React.FC<{ device: Device, onClick: () => void, isSlotSelected: boolean }> = ({ device, onClick, isSlotSelected }) => {
    const baseClasses = "p-2 bg-slate-700 rounded-md flex items-center gap-2";
    const interactionClasses = isSlotSelected 
        ? "cursor-pointer hover:bg-slate-600" 
        : "cursor-not-allowed opacity-60";
    
    return (
        <div 
            onClick={onClick}
            title={isSlotSelected ? `Place ${device.name} in selected slot (top U)` : 'Select a slot in a rack to place this device'}
            className={`${baseClasses} ${interactionClasses}`}
        >
            <DeviceTypeIcon type={device.type} className="w-4 h-4 text-slate-400 shrink-0"/>
            <span className="text-sm truncate">{device.name} {device.uSize > 0 && `(${device.uSize}U)`}</span>
        </div>
    );
};


const DeviceTypeIcon = ({ type, className }: { type: DeviceType, className?: string }) => {
  const baseClass = "w-5 h-5 text-slate-300 shrink-0";
  const finalClassName = `${baseClass} ${className}`;
  switch (type) {
    case DeviceType.ROUTER: return <RouterIcon className={finalClassName} />;
    case DeviceType.PC: return <PCIcon className={finalClassName} />;
    case DeviceType.SERVER: return <ServerIcon className={finalClassName} />;
    case DeviceType.CLOUD_SERVER: return <CloudServerIcon className={finalClassName} />;
    case DeviceType.AP: return <APIcon className={finalClassName} />;
    case DeviceType.PRINTER: return <PrinterIcon className={finalClassName} />;
    case DeviceType.OTHER: return <SettingsIcon className={finalClassName} />;
    case DeviceType.SWITCH:
    default: return <SwitchIcon className={finalClassName} />;
  }
};


export const PhysicalView: React.FC<PhysicalViewProps> = ({ devices, rooms, racks, addRoom, updateRoom, deleteRoom, addRack, updateRack, deleteRack, updateDevicePlacement }) => {
    const [newRoomName, setNewRoomName] = useState('');
    const [newRackForms, setNewRackForms] = useState<{[key: string]: {name: string, uHeight: number}}>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{type: 'room' | 'rack', id: string, name: string} | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<{ roomId: string, rackId: string, uPosition: number } | null>(null);

    const unplacedDevices = useMemo(() => devices.filter(d => !d.placement), [devices]);
    
    const handleSlotClick = (roomId: string, rackId: string, uPosition: number) => {
        if (selectedSlot?.rackId === rackId && selectedSlot.uPosition === uPosition) {
            setSelectedSlot(null); // Deselect
        } else {
            setSelectedSlot({ roomId, rackId, uPosition });
        }
    };

    const handlePlaceDevice = (deviceId: string) => {
        if (!selectedSlot) return;

        const { rackId, uPosition: uSlot, roomId } = selectedSlot;
        const deviceToPlace = devices.find(d => d.id === deviceId);
        if (!deviceToPlace || deviceToPlace.uSize === 0) return;

        // uPosition is the bottom-most U. User clicks the top-most U.
        const targetUPosition = Math.max(1, uSlot - deviceToPlace.uSize + 1);

        const devicesToPush = devices
            .filter(d =>
                d.id !== deviceId &&
                d.placement?.rackId === rackId &&
                d.placement.uPosition >= targetUPosition
            )
            .sort((a, b) => b.placement!.uPosition - a.placement!.uPosition); // Process top-down

        devicesToPush.forEach(device => {
            const currentPosition = device.placement!.uPosition;
            updateDevicePlacement(device.id, { ...device.placement!, uPosition: currentPosition + deviceToPlace.uSize });
        });

        updateDevicePlacement(deviceId, { roomId, rackId, uPosition: targetUPosition });
        setSelectedSlot(null);
    };
    
    const handleRemoveDevice = (deviceId: string) => {
        const deviceToRemove = devices.find(d => d.id === deviceId);
        if (!deviceToRemove || !deviceToRemove.placement) return;
        
        const { rackId, uPosition } = deviceToRemove.placement;

        updateDevicePlacement(deviceId, undefined);

        const devicesToShiftDown = devices
            .filter(d =>
                d.id !== deviceId &&
                d.placement?.rackId === rackId &&
                d.placement.uPosition > uPosition
            )
            .sort((a, b) => a.placement!.uPosition - b.placement!.uPosition); // Process bottom-up

        devicesToShiftDown.forEach(device => {
            const newPos = device.placement!.uPosition - deviceToRemove.uSize;
            updateDevicePlacement(device.id, { ...device.placement!, uPosition: newPos });
        });
    };

    const handleAddRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            addRoom(newRoomName.trim());
            setNewRoomName('');
        }
    };

    const handleAddRack = (e: React.FormEvent, roomId: string) => {
        e.preventDefault();
        const form = newRackForms[roomId];
        if (form && form.name.trim() && form.uHeight > 0) {
            addRack({ name: form.name.trim(), uHeight: form.uHeight, roomId });
            setNewRackForms(prev => ({...prev, [roomId]: {name: '', uHeight: 42}}));
        }
    };
    
    const startEditing = (id: string, currentValue: string) => {
        setEditingId(id);
        setEditingValue(currentValue);
    };

    const handleEditBlur = () => {
        if (editingId && editingValue.trim()) {
            if (editingId.startsWith('room-')) {
                updateRoom(editingId, { name: editingValue.trim() });
            } else if (editingId.startsWith('rack-')) {
                updateRack(editingId, { name: editingValue.trim() });
            }
        }
        setEditingId(null);
        setEditingValue('');
    };
    
    return (
        <>
        <div className="h-full flex gap-6">
            <aside className="w-64 bg-slate-800/50 p-4 rounded-lg flex flex-col shrink-0">
                <h3 className="text-lg font-semibold mb-4">Unplaced Devices</h3>
                 { !selectedSlot && <p className="text-xs text-slate-500 mb-2 italic">Select a rack slot to enable placement.</p> }
                <div className="space-y-2 overflow-y-auto flex-grow">
                    {unplacedDevices.length > 0 ? (
                        unplacedDevices.map(d => <UnplacedDevice key={d.id} device={d} onClick={() => handlePlaceDevice(d.id)} isSlotSelected={!!selectedSlot} />)
                    ) : (
                        <p className="text-sm text-slate-500 text-center pt-4">All devices are placed.</p>
                    )}
                </div>
            </aside>

            <main className="flex-grow space-y-8 overflow-y-auto">
                 {rooms.map(room => (
                    <section key={room.id} className="bg-slate-800/50 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                           {editingId === room.id ? (
                               <input type="text" value={editingValue} onChange={e => setEditingValue(e.target.value)} onBlur={handleEditBlur} onKeyDown={e => e.key === 'Enter' && handleEditBlur()} autoFocus className="text-2xl font-bold bg-slate-700 outline-none rounded-md px-2 py-1 -ml-2"/>
                           ) : (
                            <h2 className="text-2xl font-bold cursor-pointer" onClick={() => startEditing(room.id, room.name)}>{room.name}</h2>
                           )}
                            <button onClick={() => setConfirmDelete({type: 'room', id: room.id, name: room.name})} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {racks.filter(r => r.roomId === room.id).map(rack => {
                                const devicesInRack = devices.filter(d => d.placement?.rackId === rack.id);
                                return (
                                <div key={rack.id} className="bg-slate-900/40 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        {editingId === rack.id ? (
                                            <input type="text" value={editingValue} onChange={e => setEditingValue(e.target.value)} onBlur={handleEditBlur} onKeyDown={e => e.key === 'Enter' && handleEditBlur()} autoFocus className="font-semibold bg-slate-700 outline-none rounded-md px-1"/>
                                        ) : (
                                            <h4 className="font-semibold cursor-pointer" onClick={() => startEditing(rack.id, rack.name)}>{rack.name} ({rack.uHeight}U)</h4>
                                        )}
                                        <button onClick={() => setConfirmDelete({type: 'rack', id: rack.id, name: rack.name})} className="p-1 text-slate-500 hover:text-red-400 rounded-full"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    <div className="bg-slate-800 rounded-md p-1 grid grid-cols-[auto,1fr]">
                                        <div className="flex flex-col-reverse text-right text-xs text-slate-500 pr-1 border-r border-slate-700">
                                           {Array.from({ length: rack.uHeight }, (_, i) => i + 1).map(u => <div key={u} className="h-5 flex items-center justify-end">{u}</div>)}
                                        </div>
                                        <div className="grid grid-cols-1 auto-rows-[20px]" style={{ gridTemplateRows: `repeat(${rack.uHeight}, 20px)`}}>
                                            {Array.from({ length: rack.uHeight }, (_, i) => i + 1).reverse().map(u => {
                                                const isSelected = selectedSlot?.rackId === rack.id && selectedSlot.uPosition === u;
                                                return (
                                                    <div 
                                                        key={u} 
                                                        className={`h-5 border-b border-slate-700/50 cursor-pointer hover:bg-cyan-500/30 ${isSelected ? 'bg-cyan-500/50' : ''}`} 
                                                        onClick={() => handleSlotClick(room.id, rack.id, u)}
                                                        title={`Select U${u} as top position`}
                                                    ></div>
                                                );
                                            })}
                                            {devicesInRack.map(device => {
                                                const isOutOfBounds = device.placement!.uPosition + device.uSize - 1 > rack.uHeight;
                                                const borderClass = isOutOfBounds
                                                    ? 'border-2 border-dashed border-red-500'
                                                    : 'border-2 border-cyan-600';
                                                
                                                return (
                                                    <div 
                                                        key={device.id}
                                                        className={`bg-cyan-800 rounded-md m-[-1px] text-white text-xs p-1 flex items-center justify-center overflow-hidden group relative ${borderClass}`}
                                                        style={{ gridRowStart: rack.uHeight - device.placement!.uPosition - device.uSize + 2, gridRowEnd: `span ${device.uSize}` }}
                                                        title={`${device.name} (${device.uSize}U)${isOutOfBounds ? ' - WARNING: Out of rack bounds!' : ''}`}
                                                    >
                                                        <span className="truncate">{device.name}</span>
                                                        <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-10 rounded-bl-md">
                                                            <button
                                                                onClick={() => handleRemoveDevice(device.id)}
                                                                className="p-1 rounded-full bg-slate-900/50 hover:bg-red-500/50 text-slate-300 hover:text-red-300"
                                                                title="Unassign from rack"
                                                            >
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )})}
                            <form onSubmit={(e) => handleAddRack(e, room.id)} className="bg-slate-900/40 p-4 rounded-lg flex flex-col gap-2 items-start">
                                <input type="text" placeholder="New Rack Name" value={newRackForms[room.id]?.name || ''} onChange={e => setNewRackForms(p => ({...p, [room.id]: {...(p[room.id] || {uHeight: 42}), name: e.target.value}}))} className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm" required />
                                <input type="number" placeholder="U Height" value={newRackForms[room.id]?.uHeight || 42} onChange={e => setNewRackForms(p => ({...p, [room.id]: {...(p[room.id] || {name: ''}), uHeight: parseInt(e.target.value, 10)}}))} min="1" className="w-24 bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-sm" required />
                                <button type="submit" className="flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-md font-semibold text-sm hover:bg-cyan-500/20"><PlusIcon className="w-4 h-4"/> Add Rack</button>
                            </form>
                        </div>
                    </section>
                ))}
                <form onSubmit={handleAddRoom} className="p-4 flex items-center gap-2">
                    <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="New Room Name" className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2" required />
                    <button type="submit" className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md font-semibold"><PlusIcon className="w-5 h-5"/> Add Room</button>
                </form>
            </main>
        </div>
        {confirmDelete && (
             <ConfirmationModal
                isOpen={true}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete.type === 'room') deleteRoom(confirmDelete.id);
                    if (confirmDelete.type === 'rack') deleteRack(confirmDelete.id);
                    setConfirmDelete(null);
                }}
                title={`Delete ${confirmDelete.type}`}
                message={<>Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? This will also unassign all devices within it. This action cannot be undone.</>}
                confirmButtonText="Delete Permanently"
                confirmButtonVariant="danger"
            />
        )}
        </>
    );
};
