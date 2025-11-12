import { useState, useEffect, useCallback } from 'react';
import { Device, Connection, DeviceType, TopologyLink, ConnectionType, ChangeLogEntry, KeyFile, Room, Rack, DevicePlacement } from '../types';

const INITIAL_ROOMS: Room[] = [
    { id: 'room-1', name: 'Server Room' },
    { id: 'room-2', name: 'Main Office' }
];

const INITIAL_RACKS: Rack[] = [
    { id: 'rack-1', name: 'Rack A-01', roomId: 'room-1', uHeight: 42 },
    { id: 'rack-2', name: 'Rack B-01', roomId: 'room-1', uHeight: 24 }
];

const INITIAL_DEVICES: Device[] = [
    {
        id: 'sw-01',
        name: 'Core Switch 1',
        type: DeviceType.SWITCH,
        ipAddress: '192.168.1.1',
        model: 'Cisco Catalyst 9300',
        uSize: 1,
        placement: { roomId: 'room-1', rackId: 'rack-1', uPosition: 38 },
        connections: [
            { id: 'conn-1', port: 1, type: ConnectionType.STATIC, ipAddress: '192.168.1.10', macAddress: '00A0C914C829', hostname: 'server-db-01' },
            { id: 'conn-2', port: 2, type: ConnectionType.DHCP, ipAddress: '192.168.1.101', macAddress: '00B0D063C226', hostname: 'workstation-dev-05' },
        ],
        username: 'admin',
        details: 'Main core switch for the primary office network. Located in rack A-01.',
        changeLog: [{ id: 'log-init-1', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'sw-02',
        name: 'Access Switch 1',
        type: DeviceType.SWITCH,
        ipAddress: '192.168.1.2',
        model: 'Juniper EX2300',
        uSize: 1,
        connections: [],
        changeLog: [{ id: 'log-init-2', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'rtr-01',
        name: 'Edge Router',
        type: DeviceType.ROUTER,
        ipAddress: '203.0.113.1',
        model: 'Cisco ISR 4000',
        uSize: 2,
        connections: [],
        changeLog: [{ id: 'log-init-3', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'srv-01',
        name: 'Database Server',
        type: DeviceType.SERVER,
        ipAddress: '192.168.1.50',
        model: 'Dell PowerEdge R740',
        uSize: 2,
        placement: { roomId: 'room-1', rackId: 'rack-1', uPosition: 40 },
        connections: [],
        changeLog: [{ id: 'log-init-4', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'pc-01',
        name: 'Dev Workstation',
        type: DeviceType.PC,
        ipAddress: '192.168.1.102',
        model: 'Custom Build',
        uSize: 4, // Represents a tower PC
        connections: [],
        changeLog: [{ id: 'log-init-5', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'cloud-srv-01',
        name: 'Web App Server',
        type: DeviceType.CLOUD_SERVER,
        ipAddress: '104.18.30.124',
        model: 'Cloudflare Hosted',
        uSize: 0, // Cloud servers don't have a U size
        connections: [],
        changeLog: [{ id: 'log-init-6', timestamp: new Date().toISOString(), change: 'Device created.' }]
    }
];

const INITIAL_TOPOLOGY: TopologyLink[] = [
    { id: 'link-1', from: 'rtr-01', to: 'sw-01' },
    { id: 'link-2', from: 'sw-01', to: 'sw-02' },
    { id: 'link-3', from: 'sw-01', to: 'srv-01' },
    { id: 'link-4', from: 'sw-02', to: 'pc-01' },
    { id: 'link-5', from: 'rtr-01', to: 'cloud-srv-01' },
];

const createLogEntry = (change: string): ChangeLogEntry => ({
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    change,
});

interface NetworkState {
    devices: Device[];
    topology: TopologyLink[];
    deletedDevices: Device[];
    rooms: Room[];
    racks: Rack[];
}

const INITIAL_STATE: NetworkState = {
    devices: INITIAL_DEVICES,
    topology: INITIAL_TOPOLOGY,
    deletedDevices: [],
    rooms: INITIAL_ROOMS,
    racks: INITIAL_RACKS,
};

export const useNetworkManager = () => {
    const [networkState, setNetworkState] = useState<NetworkState>(() => {
        try {
            const localState = localStorage.getItem('networkState');
            if (localState) {
                const parsedState = JSON.parse(localState);
                if (Array.isArray(parsedState.devices) && Array.isArray(parsedState.topology)) {
                    return {
                        ...parsedState,
                        deletedDevices: parsedState.deletedDevices || [],
                        rooms: parsedState.rooms || INITIAL_ROOMS,
                        racks: parsedState.racks || INITIAL_RACKS,
                    };
                }
            }
            localStorage.setItem('networkState', JSON.stringify(INITIAL_STATE));
            return INITIAL_STATE;
        } catch (error) {
            console.error("Failed to load or parse network state from localStorage:", error);
            localStorage.setItem('networkState', JSON.stringify(INITIAL_STATE));
            return INITIAL_STATE;
        }
    });

  useEffect(() => {
    localStorage.setItem('networkState', JSON.stringify(networkState));
  }, [networkState]);

  const addDevice = useCallback((device: Omit<Device, 'id' | 'connections' | 'changeLog' | 'placement'>) => {
    const newDevice: Device = {
      ...device,
      id: `${device.type.toLowerCase()}-${Date.now()}`,
      connections: [],
      changeLog: [createLogEntry('Device created.')]
    };
    setNetworkState(prev => ({ ...prev, devices: [...prev.devices, newDevice] }));
  }, []);

  const updateDevice = useCallback((deviceId: string, updates: Partial<Omit<Device, 'id' | 'connections' | 'changeLog'>>) => {
    setNetworkState(prev => ({
        ...prev,
        devices: prev.devices.map(d => {
            if (d.id === deviceId) {
                const changes: string[] = [];
                for (const key in updates) {
                    const typedKey = key as keyof typeof updates;
                    if (typedKey === 'password') continue;

                    if (typedKey === 'keyFile') {
                        const oldFileName = d.keyFile?.name || '';
                        const newFileName = (updates.keyFile as KeyFile | undefined)?.name || '';
                        if (oldFileName !== newFileName) {
                            changes.push(`Updated keyFile from "${oldFileName || 'None'}" to "${newFileName || 'None'}".`);
                        }
                        continue;
                    }
                    
                    if (d[typedKey] !== updates[typedKey]) {
                        changes.push(`Updated ${key} from "${d[typedKey] || ''}" to "${updates[typedKey] || ''}".`);
                    }
                }
                if (changes.length > 0) {
                    const newLogEntry = createLogEntry(changes.join(' '));
                    const newLog = [newLogEntry, ...(d.changeLog || [])];
                    return { ...d, ...updates, changeLog: newLog };
                }
                return { ...d, ...updates };
            }
            return d;
        })
    }));
  }, []);

  const deleteDevice = useCallback((deviceId: string) => {
    setNetworkState(prev => {
        const deviceToDelete = prev.devices.find(d => d.id === deviceId);
        if (!deviceToDelete) return prev;

        const updatedDevice = { ...deviceToDelete, deletedAt: new Date().toISOString() };

        return {
            ...prev,
            devices: prev.devices.filter(d => d.id !== deviceId),
            topology: prev.topology.filter(link => link.from !== deviceId && link.to !== deviceId),
            deletedDevices: [...prev.deletedDevices, updatedDevice]
        };
    });
  }, []);

  const duplicateDevice = useCallback((deviceId: string) => {
    setNetworkState(prev => {
        const originalDevice = prev.devices.find(d => d.id === deviceId);
        if (!originalDevice) return prev;

        const newDevice: Device = {
            ...originalDevice,
            id: `${originalDevice.type.toLowerCase()}-${Date.now()}`,
            name: `${originalDevice.name} (Copy)`,
            ipAddress: '', // IP should be unique, clear it
            connections: [], // Don't copy connections
            placement: undefined, // Don't copy placement
            changeLog: [createLogEntry(`Device duplicated from ${originalDevice.name} (${originalDevice.id}).`)],
        };

        return { ...prev, devices: [...prev.devices, newDevice] };
    });
  }, []);

  const restoreDevice = useCallback((deviceId: string) => {
    setNetworkState(prev => {
        const deviceToRestore = prev.deletedDevices.find(d => d.id === deviceId);
        if (!deviceToRestore) return prev;
        const { deletedAt, ...restoredDevice } = deviceToRestore;
        return {
            ...prev,
            devices: [...prev.devices, restoredDevice],
            deletedDevices: prev.deletedDevices.filter(d => d.id !== deviceId)
        };
    });
  }, []);

  const permanentlyDeleteDevice = useCallback((deviceId: string) => {
    setNetworkState(prev => ({
        ...prev,
        deletedDevices: prev.deletedDevices.filter(d => d.id !== deviceId)
    }));
  }, []);

  const emptyRecycleBin = useCallback(() => {
    setNetworkState(prev => ({
        ...prev,
        deletedDevices: []
    }));
  }, []);

  const addConnection = useCallback((deviceId: string, connection: Omit<Connection, 'id'>) => {
    const newConnection: Connection = { ...connection, id: `conn-${Date.now()}` };
    const logEntry = createLogEntry(`Added connection on port ${connection.port} (${connection.hostname}).`);
    setNetworkState(prev => ({
      ...prev,
      devices: prev.devices.map(d => d.id === deviceId ? { ...d, connections: [...d.connections, newConnection], changeLog: [logEntry, ...(d.changeLog || [])] } : d)
    }));
  }, []);

  const updateConnection = useCallback((deviceId: string, connectionId: string, updates: Partial<Connection>) => {
    setNetworkState(prev => ({
        ...prev,
        devices: prev.devices.map(d => {
            if (d.id === deviceId) {
                let logEntry: ChangeLogEntry | null = null;
                const oldConnection = d.connections.find(c => c.id === connectionId);
                if (oldConnection) {
                    const changes: string[] = [];
                    for (const key in updates) {
                        const typedKey = key as keyof typeof updates;
                        if (oldConnection[typedKey] !== updates[typedKey]) changes.push(`${key} changed to "${updates[typedKey]}"`);
                    }
                    if (changes.length > 0) logEntry = createLogEntry(`Updated connection on port ${oldConnection.port}: ${changes.join(', ')}.`);
                }
                const updatedConnections = d.connections.map(c => c.id === connectionId ? { ...c, ...updates } : c);
                return { ...d, connections: updatedConnections, changeLog: logEntry ? [logEntry, ...(d.changeLog || [])] : d.changeLog };
            }
            return d;
        })
    }));
  }, []);

  const deleteConnection = useCallback((deviceId: string, connectionId: string) => {
    setNetworkState(prev => ({
        ...prev,
        devices: prev.devices.map(d => {
            if (d.id === deviceId) {
                const connToDelete = d.connections.find(c => c.id === connectionId);
                if (connToDelete) {
                    const logEntry = createLogEntry(`Removed connection on port ${connToDelete.port} (${connToDelete.hostname}).`);
                    return { ...d, connections: d.connections.filter(c => c.id !== connectionId), changeLog: [logEntry, ...(d.changeLog || [])] };
                }
            }
            return d;
        })
    }));
  }, []);

  const addTopologyLink = useCallback((from: string, to: string) => {
    setNetworkState(prev => {
        if (from === to || prev.topology.some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from))) return prev;
        const newLink: TopologyLink = { id: `link-${Date.now()}`, from, to };
        return { ...prev, topology: [...prev.topology, newLink] };
    });
  }, []);

  const deleteTopologyLink = useCallback((linkId: string) => {
    setNetworkState(prev => ({ ...prev, topology: prev.topology.filter(l => l.id !== linkId) }));
  }, []);

  const deleteAllLinksForDevice = useCallback((deviceId: string) => {
    setNetworkState(prev => ({
      ...prev,
      topology: prev.topology.filter(link => link.from !== deviceId && link.to !== deviceId)
    }));
  }, []);

  const importConfiguration = useCallback((config: { devices: Device[], topology: TopologyLink[], rooms?: Room[], racks?: Rack[] }) => {
    if (config && Array.isArray(config.devices) && Array.isArray(config.topology)) {
        setNetworkState({ 
            devices: config.devices, 
            topology: config.topology, 
            deletedDevices: [],
            rooms: config.rooms || INITIAL_ROOMS,
            racks: config.racks || INITIAL_RACKS,
        });
    } else {
        throw new Error("Invalid configuration file format.");
    }
  }, []);

  // --- Physical Layout Handlers ---
  const addRoom = useCallback((name: string) => {
      const newRoom: Room = { id: `room-${Date.now()}`, name };
      setNetworkState(prev => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
      setNetworkState(prev => ({ ...prev, rooms: prev.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r) }));
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
      setNetworkState(prev => {
          const updatedDevices = prev.devices.map(d => (d.placement && d.placement.roomId === roomId) ? { ...d, placement: undefined } : d);
          return {
              ...prev,
              devices: updatedDevices,
              racks: prev.racks.filter(r => r.roomId !== roomId),
              rooms: prev.rooms.filter(r => r.id !== roomId)
          };
      });
  }, []);

  const addRack = useCallback((rack: Omit<Rack, 'id'>) => {
      const newRack: Rack = { ...rack, id: `rack-${Date.now()}` };
      setNetworkState(prev => ({ ...prev, racks: [...prev.racks, newRack] }));
  }, []);

  const updateRack = useCallback((rackId: string, updates: Partial<Rack>) => {
      setNetworkState(prev => ({ ...prev, racks: prev.racks.map(r => r.id === rackId ? { ...r, ...updates } : r) }));
  }, []);

  const deleteRack = useCallback((rackId: string) => {
      setNetworkState(prev => {
          const updatedDevices = prev.devices.map(d => (d.placement && d.placement.rackId === rackId) ? { ...d, placement: undefined } : d);
          return { ...prev, devices: updatedDevices, racks: prev.racks.filter(r => r.id !== rackId) };
      });
  }, []);

  const updateDevicePlacement = useCallback((deviceId: string, placement: DevicePlacement | undefined) => {
    setNetworkState(prev => {
        const device = prev.devices.find(d => d.id === deviceId);
        if (!device) return prev;
        
        const rack = placement ? prev.racks.find(r => r.id === placement.rackId) : undefined;
        const change = placement && rack
            ? `Placed device in rack ${rack.name} at U${placement.uPosition}.`
            : `Unassigned device from physical rack.`;
        const logEntry = createLogEntry(change);

        return {
            ...prev,
            devices: prev.devices.map(d => d.id === deviceId ? { ...d, placement, changeLog: [logEntry, ...(d.changeLog || [])] } : d)
        };
    });
  }, []);


  return { 
    devices: networkState.devices, 
    topology: networkState.topology,
    deletedDevices: networkState.deletedDevices,
    rooms: networkState.rooms,
    racks: networkState.racks,
    addDevice, 
    updateDevice, 
    deleteDevice,
    duplicateDevice,
    restoreDevice,
    permanentlyDeleteDevice,
    emptyRecycleBin,
    addConnection, 
    updateConnection, 
    deleteConnection, 
    addTopologyLink, 
    deleteTopologyLink,
    deleteAllLinksForDevice,
    importConfiguration,
    addRoom,
    updateRoom,
    deleteRoom,
    addRack,
    updateRack,
    deleteRack,
    updateDevicePlacement,
  };
};