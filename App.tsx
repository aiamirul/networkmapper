
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DeviceList } from './components/DeviceList';
import { MainContent } from './components/MainContent';
import { useNetworkManager } from './hooks/useNetworkManager';
import { AddDeviceModal } from './components/AddDeviceModal';
import { NetworkAnalysisModal } from './components/NetworkAnalysisModal';
import { MacFormat, View } from './types';
import { formatMac } from './utils/macFormatter';
import { SettingsModal } from './components/SettingsModal';
import { RecycleBinModal } from './components/RecycleBinModal';

const App: React.FC = () => {
  const {
    devices,
    addDevice,
    updateDevice,
    deleteDevice: deleteDeviceFromHook,
    addConnection,
    updateConnection,
    deleteConnection,
    topology,
    addTopologyLink,
    deleteTopologyLink,
    importConfiguration,
    deletedDevices,
    restoreDevice,
    permanentlyDeleteDevice,
    emptyRecycleBin,
    rooms,
    racks,
    addRoom,
    updateRoom,
    deleteRoom,
    addRack,
    updateRack,
    deleteRack,
    updateDevicePlacement,
  } = useNetworkManager();

  const [macFormat, setMacFormat] = useState<MacFormat>(MacFormat.HYPHEN);
  const [currentView, setCurrentView] = useState<View>(View.DIAGRAM);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isRecycleBinOpen, setRecycleBinOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;

  const handleSelectDevice = useCallback((id: string | null) => {
    setSelectedDeviceId(id);
    if (id) {
      setCurrentView(View.DEVICE_DETAILS);
    }
  }, []);
  
  const handleSetView = (view: View) => {
    if (view === View.DIAGRAM || view === View.PHYSICAL) {
        setSelectedDeviceId(null);
    }
    setCurrentView(view);
  }

  const handleDeleteDevice = useCallback((deviceId: string) => {
    deleteDeviceFromHook(deviceId);
    setSelectedDeviceId(null);
    setCurrentView(View.DIAGRAM);
  }, [deleteDeviceFromHook]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 font-sans text-slate-300">
        <Header 
          macFormat={macFormat} 
          setMacFormat={setMacFormat} 
          onAnalyzeClick={() => setAnalysisModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />
        <main className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
          <aside className="w-full md:w-80 lg:w-96 bg-slate-900/30 border-r border-slate-700/50 p-4 overflow-y-auto shrink-0">
            <DeviceList
              devices={devices}
              topology={topology}
              importConfiguration={importConfiguration}
              onSelectDevice={handleSelectDevice}
              selectedDeviceId={selectedDeviceId}
              onAddDevice={() => setAddDeviceModalOpen(true)}
              currentView={currentView}
              setCurrentView={handleSetView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onPrint={handlePrint}
              onOpenRecycleBin={() => setRecycleBinOpen(true)}
            />
          </aside>
          <section className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
            <MainContent
              view={currentView}
              selectedDevice={selectedDevice}
              macFormat={macFormat}
              addConnection={addConnection}
              updateConnection={updateConnection}
              deleteConnection={deleteConnection}
              updateDevice={updateDevice}
              deleteDevice={handleDeleteDevice}
              devices={devices}
              topology={topology}
              addTopologyLink={addTopologyLink}
              deleteTopologyLink={deleteTopologyLink}
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
          </section>
        </main>
        {isAddDeviceModalOpen && (
          <AddDeviceModal 
            onClose={() => setAddDeviceModalOpen(false)} 
            onAddDevice={addDevice}
          />
        )}
        {isAnalysisModalOpen && (
          <NetworkAnalysisModal
            onClose={() => setAnalysisModalOpen(false)}
            networkState={{ devices, topology }}
          />
        )}
        {isSettingsModalOpen && (
            <SettingsModal
                onClose={() => setSettingsModalOpen(false)}
                networkState={{ devices, topology, rooms, racks }}
                importConfiguration={importConfiguration}
            />
        )}
        <RecycleBinModal
            isOpen={isRecycleBinOpen}
            onClose={() => setRecycleBinOpen(false)}
            deletedDevices={deletedDevices}
            onRestore={restoreDevice}
            onPermanentlyDelete={permanentlyDeleteDevice}
            onEmpty={emptyRecycleBin}
        />
      </div>
      <div id="printable-content" className="hidden">
        <div className="print-container">
            <h1 className="print-header">Network Devices Report</h1>
            <p className="print-subheader">Generated on: {new Date().toLocaleDateString()}</p>
            <div className="print-devices-list">
                {devices.map(device => (
                    <div key={device.id} className="print-device-card">
                        <h2 className="print-device-name">{device.name}</h2>
                        <div className="print-device-grid">
                            <p><strong>Type:</strong> {device.type}</p>
                            <p><strong>IP Address:</strong> {device.ipAddress}</p>
                            <p><strong>Model:</strong> {device.model}</p>
                            <p><strong>Username:</strong> {device.username || 'N/A'}</p>
                            <p><strong>Attached Key:</strong> {device.keyFile?.name || 'None'}</p>
                        </div>
                        {device.details && (
                          <div className="print-device-details-block">
                              <h4 className="print-section-header">Details:</h4>
                              <p className="print-details-text">{device.details}</p>
                          </div>
                        )}

                        <h3 className="print-section-header">Connections</h3>
                        {device.connections.length > 0 ? (
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Port</th>
                                        <th>Type</th>
                                        <th>IP Address</th>
                                        <th>MAC Address</th>
                                        <th>Hostname</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {device.connections.map(conn => (
                                        <tr key={conn.id}>
                                            <td>{conn.port}</td>
                                            <td>{conn.type}</td>
                                            <td>{conn.ipAddress}</td>
                                            <td className="print-table-mono">{formatMac(conn.macAddress, MacFormat.COLON)}</td>
                                            <td>{conn.hostname}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="print-no-items">No connections for this device.</p>
                        )}

                        <h3 className="print-section-header">Change Log</h3>
                        {(device.changeLog && device.changeLog.length > 0) ? (
                             <table className="print-table">
                                  <thead>
                                      <tr>
                                          <th style={{width: '25%'}}>Timestamp</th>
                                          <th style={{width: '75%'}}>Change</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {device.changeLog.map(log => (
                                          <tr key={log.id}>
                                              <td>{new Date(log.timestamp).toLocaleString()}</td>
                                              <td>{log.change}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                        ) : (
                            <p className="print-no-items">No change history for this device.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default App;