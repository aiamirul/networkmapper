
import React from 'react';
import { Device, MacFormat, View, TopologyLink } from '../types';
import { NetworkDiagram } from './NetworkDiagram';
import { DeviceDetails } from './DeviceDetails';

interface MainContentProps {
  view: View;
  selectedDevice: Device | null;
  macFormat: MacFormat;
  addConnection: (deviceId: string, connection: any) => void;
  updateConnection: (deviceId: string, connectionId: string, updates: any) => void;
  deleteConnection: (deviceId: string, connectionId: string) => void;
  updateDevice: (deviceId: string, updates: any) => void;
  deleteDevice: (deviceId: string) => void;
  devices: Device[];
  topology: TopologyLink[];
  addTopologyLink: (from: string, to: string) => void;
  deleteTopologyLink: (linkId: string) => void;
}

export const MainContent: React.FC<MainContentProps> = (props) => {
  if (props.view === View.DEVICE_DETAILS && props.selectedDevice) {
    return <DeviceDetails device={props.selectedDevice} {...props} />;
  }

  return <NetworkDiagram devices={props.devices} topology={props.topology} addTopologyLink={props.addTopologyLink} deleteTopologyLink={props.deleteTopologyLink} />;
};
