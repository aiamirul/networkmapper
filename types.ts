
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

export interface ChangeLogEntry {
    id: string;
    timestamp: string; // ISO 8601 format
    change: string;
}

export interface KeyFile {
    name: string;
    content: string; // Base64 encoded content
}

export interface Device {
  id:string;
  name: string;
  type: DeviceType;
  ipAddress: string;
  model: string;
  connections: Connection[];
  iconUrl?: string; // Optional URL for a custom icon
  username?: string;
  password?: string;
  details?: string;
  changeLog?: ChangeLogEntry[];
  keyFile?: KeyFile;
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

export interface EncryptedConfig {
  salt: string;
  data: string; // Base64 encoded encrypted string (IV + Ciphertext) for local files
}

export interface RemoteEncryptedPayload {
  salt: string;
  nonce: string; // base64
  ciphertext: string; // base64
}

export interface RemoteConfig {
  date: string;
  data: RemoteEncryptedPayload;
}
