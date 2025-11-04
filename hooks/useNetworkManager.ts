
import { useState, useEffect, useCallback } from 'react';
import { Device, Connection, DeviceType, TopologyLink, ConnectionType, ChangeLogEntry, KeyFile } from '../types';

const INITIAL_DEVICES: Device[] = [
    {
        id: 'sw-01',
        name: 'Core Switch 1',
        type: DeviceType.SWITCH,
        ipAddress: '192.168.1.1',
        model: 'Cisco Catalyst 9300',
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
        connections: [],
        changeLog: [{ id: 'log-init-2', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'rtr-01',
        name: 'Edge Router',
        type: DeviceType.ROUTER,
        ipAddress: '203.0.113.1',
        model: 'Cisco ISR 4000',
        connections: [],
        changeLog: [{ id: 'log-init-3', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'srv-01',
        name: 'Database Server',
        type: DeviceType.SERVER,
        ipAddress: '192.168.1.50',
        model: 'Dell PowerEdge R740',
        connections: [],
        changeLog: [{ id: 'log-init-4', timestamp: new Date().toISOString(), change: 'Device created.' }]
    },
    {
        id: 'pc-01',
        name: 'Dev Workstation',
        type: DeviceType.PC,
        ipAddress: '192.168.1.102',
        model: 'Custom Build',
        connections: [],
        changeLog: [{ id: 'log-init-5', timestamp: new Date().toISOString(), change: 'Device created.' }]
    }
];

const INITIAL_TOPOLOGY: TopologyLink[] = [
    { id: 'link-1', from: 'rtr-01', to: 'sw-01' },
    { id: 'link-2', from: 'sw-01', to: 'sw-02' },
    { id: 'link-3', from: 'sw-01', to: 'srv-01' },
    { id: 'link-4', from: 'sw-02', to: 'pc-01' },
];

const createLogEntry = (change: string): ChangeLogEntry => ({
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
    change,
});

export const useNetworkManager = () => {
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
        const localData = localStorage.getItem('networkDevices');
        return localData ? JSON.parse(localData) : INITIAL_DEVICES;
    } catch (error) {
        return INITIAL_DEVICES;
    }
  });

  const [topology, setTopology] = useState<TopologyLink[]>(() => {
    try {
        const localData = localStorage.getItem('networkTopology');
        return localData ? JSON.parse(localData) : INITIAL_TOPOLOGY;
    } catch (error) {
        return INITIAL_TOPOLOGY;
    }
  });

  useEffect(() => {
    localStorage.setItem('networkDevices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('networkTopology', JSON.stringify(topology));
  }, [topology]);

  const addDevice = useCallback((device: Omit<Device, 'id' | 'connections' | 'changeLog'>) => {
    const newDevice: Device = {
      ...device,
      id: `${device.type.toLowerCase()}-${Date.now()}`,
      connections: [],
      changeLog: [createLogEntry('Device created.')]
    };
    setDevices(prev => [...prev, newDevice]);
  }, []);

  const updateDevice = useCallback((deviceId: string, updates: Partial<Omit<Device, 'id' | 'connections' | 'changeLog'>>) => {
    setDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
            const changes: string[] = [];
            for (const key in updates) {
                const typedKey = key as keyof typeof updates;
                // Don't log password changes for security
                if (typedKey === 'password') continue;

                // Special handling for keyFile logging
                if (typedKey === 'keyFile') {
                    const oldFileName = d.keyFile?.name || '';
                    const newFileName = (updates.keyFile as KeyFile | undefined)?.name || '';
                    if (oldFileName !== newFileName) {
                        changes.push(`Updated keyFile from "${oldFileName}" to "${newFileName}".`);
                    }
                    continue; // Prevent default logging for this key
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
    }));
  }, []);

  const deleteDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    setTopology(prev => prev.filter(link => link.from !== deviceId && link.to !== deviceId));
  }, []);

  const addConnection = useCallback((deviceId: string, connection: Omit<Connection, 'id'>) => {
    const newConnection: Connection = { ...connection, id: `conn-${Date.now()}` };
    const logEntry = createLogEntry(`Added connection on port ${connection.port} (${connection.hostname}).`);
    
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { 
            ...d, 
            connections: [...d.connections, newConnection],
            changeLog: [logEntry, ...(d.changeLog || [])]
        };
      }
      return d;
    }));
  }, []);

  const updateConnection = useCallback((deviceId: string, connectionId: string, updates: Partial<Connection>) => {
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        let logEntry: ChangeLogEntry | null = null;
        const oldConnection = d.connections.find(c => c.id === connectionId);

        if (oldConnection) {
            const changes: string[] = [];
            for (const key in updates) {
                 const typedKey = key as keyof typeof updates;
                 if (oldConnection[typedKey] !== updates[typedKey]) {
                    changes.push(`${key} changed to "${updates[typedKey]}"`);
                 }
            }
            if (changes.length > 0) {
                 logEntry = createLogEntry(`Updated connection on port ${oldConnection.port}: ${changes.join(', ')}.`);
            }
        }
        
        const updatedConnections = d.connections.map(c => c.id === connectionId ? { ...c, ...updates } : c);
        
        return {
          ...d,
          connections: updatedConnections,
          changeLog: logEntry ? [logEntry, ...(d.changeLog || [])] : d.changeLog,
        };
      }
      return d;
    }));
  }, []);

  const deleteConnection = useCallback((deviceId: string, connectionId: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const connToDelete = d.connections.find(c => c.id === connectionId);
        if (connToDelete) {
             const logEntry = createLogEntry(`Removed connection on port ${connToDelete.port} (${connToDelete.hostname}).`);
             return { 
                ...d, 
                connections: d.connections.filter(c => c.id !== connectionId),
                changeLog: [logEntry, ...(d.changeLog || [])]
            };
        }
      }
      return d;
    }));
  }, []);

  const addTopologyLink = useCallback((from: string, to: string) => {
    if (from === to) return;
    const linkExists = topology.some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
    if (linkExists) return;

    const newLink: TopologyLink = { id: `link-${Date.now()}`, from, to };
    setTopology(prev => [...prev, newLink]);
  }, [topology]);

  const deleteTopologyLink = useCallback((linkId: string) => {
    setTopology(prev => prev.filter(l => l.id !== linkId));
  }, []);

  const importConfiguration = useCallback((config: { devices: Device[], topology: TopologyLink[] }) => {
    if (config && Array.isArray(config.devices) && Array.isArray(config.topology)) {
        setDevices(config.devices);
        setTopology(config.topology);
    } else {
        throw new Error("Invalid configuration file format.");
    }
  }, []);

  return { 
    devices, 
    addDevice, 
    updateDevice, 
    deleteDevice, 
    addConnection, 
    updateConnection, 
    deleteConnection, 
    topology, 
    addTopologyLink, 
    deleteTopologyLink,
    importConfiguration,
  };
};
