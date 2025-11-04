
export enum DeviceType {
  SWITCH = 'SWITCH',
  ROUTER = 'ROUTER',
  PC = 'PC',
  AP = 'AP',
  SERVER = 'SERVER',
  PRINTER = 'PRINTER',
  OTHER = 'OTHER',
}

export enum ConnectionType {
    STATIC = 'STATIC',
    DHCP = 'DHCP',
}

export enum MacFormat {
  HYPHEN = 'HYPHEN', // 00-00-00-00-00-00
  COLON = 'COLON',   // 00:00:00:00:00:00
  DOT = 'DOT',       // 0000.0000.0000
  NONE = 'NONE'      // 000000000000
}

export interface Connection {
  id: string;
  port: number;
  type: ConnectionType;
  ipAddress: string;
  macAddress: string; // Stored normalized (e.g., 000000000000)
  hostname: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress: string;
  model: string;
  connections: Connection[];
  iconUrl?: string; // Optional URL for a custom icon
}

export interface TopologyLink {
    id: string;
    from: string; // deviceId
    to: string;   // deviceId
}

export enum View {
    DIAGRAM = 'DIAGRAM',
    DEVICE_DETAILS = 'DEVICE_DETAILS'
}
