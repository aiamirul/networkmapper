import React from 'react';
import { Device, MacFormat, View, TopologyLink, Connection, Room, Rack, DevicePlacement } from '../types';
import { NetworkDiagram } from './NetworkDiagram';
import { DeviceDetails } from './DeviceDetails';
import { PhysicalView } from './PhysicalView';

interface MainContentProps {
  view: View;
  selectedDevice: Device | null;
  macFormat: MacFormat;
  addConnection: (deviceId: string, connection: Omit<Connection, 'id'>) => void;
  updateConnection: (deviceId: string, connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (deviceId: string, connectionId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Omit<Device, 'id' | 'connections' | 'changeLog'>>) => void;
  deleteDevice: (deviceId: string) => void;
  devices: Device[];
  topology: TopologyLink[];
  addTopologyLink: (from: string, to: string) => void;
  deleteTopologyLink: (linkId: string) => void;
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

export const MainContent: React.FC<MainContentProps> = ({
  view,
  selectedDevice,
  macFormat,
  addConnection,
  updateConnection,
  deleteConnection,
  updateDevice,
  deleteDevice,
  devices,
  topology,
  addTopologyLink,
  deleteTopologyLink,
  rooms,
  racks,
  addRoom,
  updateRoom,
  deleteRoom,
  addRack,
  updateRack,
  deleteRack,
  updateDevicePlacement,
}) => {
  if (view === View.DEVICE_DETAILS && selectedDevice) {
    return (
      <DeviceDetails
        device={selectedDevice}
        macFormat={macFormat}
        addConnection={addConnection}
        updateConnection={updateConnection}
        deleteConnection={deleteConnection}
        updateDevice={updateDevice}
        deleteDevice={deleteDevice}
        rooms={rooms}
        racks={racks}
        updateDevicePlacement={updateDevicePlacement}
      />
    );
  }

  if (view === View.PHYSICAL) {
    return (
      <PhysicalView
        devices={devices}
        rooms={rooms}
        racks={racks}
        addRoom={addRoom}
        updateRoom={updateRoom}
        deleteRoom={deleteRoom}
        addRack={addRack}
        updateRack={updateRack}
        deleteRack={deleteRack}
        updateDevicePlacement={updateDevicePlacement}
      />
    );
  }

  return (
    <NetworkDiagram
      devices={devices}
      topology={topology}
      addTopologyLink={addTopologyLink}
      deleteTopologyLink={deleteTopologyLink}
    />
  );
};