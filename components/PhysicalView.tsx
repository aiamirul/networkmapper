
import React, { useState, useMemo, useCallback } from 'react';
import { Device, Room, Rack, DevicePlacement, DeviceType } from '../types';
import { PlusIcon, TrashIcon, ServerIcon, SwitchIcon, RouterIcon, PCIcon, APIcon, PrinterIcon, SettingsIcon, CloudServerIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
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

type DraggedItem = {
    id: string;
    uSize: number;
    isPlaced: boolean;
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

const DraggableDevice: React.FC<{device: Device, onDragStart: (e: React.DragEvent, item: DraggedItem) => void}> = ({ device, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, { id: device.id, uSize: device.uSize, isPlaced: !!device.placement })}
        className={`p-2 bg-slate-700 rounded-md flex items-center gap-2 cursor-grab active:cursor-grabbing ${device.uSize === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={device.uSize === 0 ? "Cloud devices cannot be placed in racks." : device.name}
    >
        <DeviceTypeIcon type={device.type} className="w-4 h-4 text-slate-400 shrink-0"/>
        <span className="text-sm truncate">{device.name} {device.uSize > 0 && `(${device.uSize}U)`}</span>
    </div>
);

const PlacedDevice: React.FC<{
    device: Device;
    rackUHeight: number;
    onDragStart: (e: React.DragEvent) => void;
}> = ({ device, rackUHeight, onDragStart }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const devicePlacement = device.placement!;

    const style: React.CSSProperties = {
        top: `${(rackUHeight - (devicePlacement.uPosition + device.uSize - 1)) * 20}px`,
        height: isExpanded ? 'auto' : `${device.uSize * 20}px`,
        zIndex: isExpanded ? 10 : 1,
    };

    const isCompact = device.uSize * 20 < 40; // True for 1U devices

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={() => { 
                if(isExpanded) setIsExpanded(false);
            }}
            className="absolute w-full bg-cyan-800 rounded-md text-white text-xs p-1 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing border-2 border-cyan-600 transition-all duration-200"
            style={style}
            title={device.name}
        >
            <div className="flex items-center gap-2 flex-shrink-0">
                <DeviceTypeIcon type={device.type} className="w-4 h-4 text-cyan-300 shrink-0"/>
                <div className={`flex-grow truncate ${isCompact ? 'flex items-center gap-2' : ''}`}>
                    <p className="font-semibold truncate">{device.name}</p>
                    {!isCompact && <p className="text-cyan-400 text-[10px] truncate">{device.ipAddress}</p>}
                </div>
                {isCompact && <p className="text-cyan-400 text-[10px] truncate shrink-0">{device.ipAddress}</p>}

                {device.details && (
                    <button 
                        onClick={handleToggle}
                        onMouseDown={e => e.stopPropagation()} // Prevent drag from starting on button click
                        className="p-1 rounded-full hover:bg-cyan-700 shrink-0"
                    >
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
                    </button>
                )}
            </div>
            {isExpanded && device.details && (
                <div className="mt-2 p-2 bg-slate-900/50 rounded text-slate-300 text-xs whitespace-pre-wrap">
                    <h5 className="font-bold mb-1">Details:</h5>
                    {device.details}
                </div>
            )}
        </div>
    );
};


export const PhysicalView: React.FC<PhysicalViewProps> = ({ devices, rooms, racks, addRoom, updateRoom, deleteRoom, addRack, updateRack, deleteRack, updateDevicePlacement }) => {
    const [newRoomName, setNewRoomName] = useState('');
    const [newRackForms, setNewRackForms] = useState<{[key: string]: {name: string, uHeight: number}}>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{type: 'room' | 'rack', id: string, name: string} | null>(null);
    
    const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
    const [dragOverInfo, setDragOverInfo] = useState<{rackId: string, uPosition: number} | null>(null);
    const [isOverUnplace, setIsOverUnplace] = useState(false);

    const unplacedDevices = useMemo(() => devices.filter(d => !d.placement), [devices]);
    
    const getOccupiedSlots = useCallback((rackId: string, excludeDeviceId?: string): Set<number> => {
        const occupied = new Set<number>();
        devices.forEach(d => {
            if (d.placement?.rackId === rackId && d.id !== excludeDeviceId) {
                for (let i = 0; i < d.uSize; i++) {
                    occupied.add(d.placement.uPosition + i);
                }
            }
        });
        return occupied;
    }, [devices]);

    const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
        if(item.uSize === 0) {
            e.preventDefault();
            return;
        }
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id); // Necessary for Firefox
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverInfo(null);
        setIsOverUnplace(false);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDragEnterSlot = (rackId: string, uPosition: number) => draggedItem && setDragOverInfo({ rackId, uPosition });
    const handleDragLeaveRack = () => setDragOverInfo(null);

    const handleDropOnRack = (e: React.DragEvent, roomId: string, rackId: string, uPosition: number) => {
        e.preventDefault();
        if (!draggedItem) return;

        const targetUPosition = Math.max(1, uPosition - draggedItem.uSize + 1);
        const occupiedSlots = getOccupiedSlots(rackId, draggedItem.isPlaced ? draggedItem.id : undefined);
        let isConflict = false;
        for (let i = 0; i < draggedItem.uSize; i++) {
            if (occupiedSlots.has(targetUPosition + i)) {
                isConflict = true;
                break;
            }
        }
        
        if (!isConflict) {
            updateDevicePlacement(draggedItem.id, { roomId, rackId, uPosition: targetUPosition });
        }
        
        handleDragEnd();
    };

    const handleDropOnUnplace = (e: React.DragEvent) => {
        e.preventDefault();
        if(draggedItem?.isPlaced) {
            updateDevicePlacement(draggedItem.id, undefined);
        }
        handleDragEnd();
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
    
    return (
        <>
        <div className="h-full flex gap-6" onDragEnd={handleDragEnd}>
            <aside className="w-64 bg-slate-800/50 p-4 rounded-lg flex flex-col shrink-0">
                <h3 className="text-lg font-semibold mb-2">Unplaced Devices</h3>
                <p className="text-xs text-slate-500 mb-4 italic">Drag devices onto a rack to place them.</p>
                <div className="space-y-2 overflow-y-auto flex-grow">
                    {unplacedDevices.length > 0 ? (
                        unplacedDevices.map(d => <DraggableDevice key={d.id} device={d} onDragStart={handleDragStart} />)
                    ) : (
                        <p className="text-sm text-slate-500 text-center pt-4">All devices are placed.</p>
                    )}
                </div>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnUnplace}
                  onDragEnter={() => draggedItem?.isPlaced && setIsOverUnplace(true)}
                  onDragLeave={() => setIsOverUnplace(false)}
                  className={`mt-4 p-4 border-2 border-dashed rounded-lg text-center transition-colors ${isOverUnplace ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700'}`}
                >
                    <p className={`text-sm transition-colors ${isOverUnplace ? 'text-cyan-400' : 'text-slate-500'}`}>Drop here to un-place device</p>
                </div>
            </aside>

            <main className="flex-grow space-y-8 overflow-y-auto pr-2">
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
                                
                                const isRackDraggedOver = draggedItem && dragOverInfo?.rackId === rack.id;
                                let dragHighlightInfo = null;

                                if (isRackDraggedOver) {
                                    const uPosition = dragOverInfo!.uPosition;
                                    const uSize = draggedItem!.uSize;
                                    const targetUPosition = Math.max(1, uPosition - uSize + 1);
                                    const occupiedSlots = getOccupiedSlots(rack.id, draggedItem!.isPlaced ? draggedItem!.id : undefined);
                                    
                                    let isConflict = false;
                                    for (let i = 0; i < uSize; i++) {
                                        if (occupiedSlots.has(targetUPosition + i)) {
                                            isConflict = true;
                                            break;
                                        }
                                    }
                                    
                                    dragHighlightInfo = {
                                        startU: targetUPosition,
                                        endU: targetUPosition + uSize - 1,
                                        isConflict,
                                    };
                                }


                                return (
                                <div key={rack.id} className="bg-slate-900/40 p-3 rounded-lg" onDragLeave={handleDragLeaveRack}>
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
                                        <div className="relative grid auto-rows-[20px]" style={{ gridTemplateRows: `repeat(${rack.uHeight}, 20px)`}}>
                                            {Array.from({ length: rack.uHeight }, (_, i) => rack.uHeight - i).map(u => {
                                                let slotClasses = "h-5 border-b border-slate-700/50 transition-colors duration-75";
                                                if (dragHighlightInfo && u >= dragHighlightInfo.startU && u <= dragHighlightInfo.endU) {
                                                    slotClasses += dragHighlightInfo.isConflict ? ' bg-red-500/40' : ' bg-green-500/40';
                                                }
                                                return (
                                                    <div 
                                                        key={u} 
                                                        className={slotClasses}
                                                        onDragOver={handleDragOver}
                                                        onDragEnter={() => handleDragEnterSlot(rack.id, u)}
                                                        onDrop={(e) => handleDropOnRack(e, room.id, rack.id, u)}
                                                    ></div>
                                                )
                                            })}
                                            {devicesInRack.map(device => (
                                                <PlacedDevice
                                                    key={device.id}
                                                    device={device}
                                                    rackUHeight={rack.uHeight}
                                                    onDragStart={(e) => handleDragStart(e, { id: device.id, uSize: device.uSize, isPlaced: true })}
                                                />
                                            ))}
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
