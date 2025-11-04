
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DeviceList } from './components/DeviceList';
import { MainContent } from './components/MainContent';
import { useNetworkManager } from './hooks/useNetworkManager';
import { AddDeviceModal } from './components/AddDeviceModal';
import { NetworkAnalysisModal } from './components/NetworkAnalysisModal';
import { MacFormat, View } from './types';

const App: React.FC = () => {
  const {
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
  } = useNetworkManager();

  const [macFormat, setMacFormat] = useState<MacFormat>(MacFormat.HYPHEN);
  const [currentView, setCurrentView] = useState<View>(View.DIAGRAM);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
  const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;

  const handleSelectDevice = useCallback((id: string | null) => {
    setSelectedDeviceId(id);
    if (id) {
      setCurrentView(View.DEVICE_DETAILS);
    }
  }, []);
  
  const handleSetView = (view: View) => {
    if (view === View.DIAGRAM) {
        setSelectedDeviceId(null);
    }
    setCurrentView(view);
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-300">
      <Header 
        macFormat={macFormat} 
        setMacFormat={setMacFormat} 
        onAnalyzeClick={() => setAnalysisModalOpen(true)}
      />
      <main className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <aside className="w-full md:w-80 lg:w-96 bg-slate-800/50 border-r border-slate-700/50 p-4 overflow-y-auto shrink-0">
          <DeviceList
            devices={devices}
            topology={topology}
            importConfiguration={importConfiguration}
            onSelectDevice={handleSelectDevice}
            selectedDeviceId={selectedDeviceId}
            onAddDevice={() => setAddDeviceModalOpen(true)}
            currentView={currentView}
            setCurrentView={handleSetView}
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
            deleteDevice={deleteDevice}
            devices={devices}
            topology={topology}
            addTopologyLink={addTopologyLink}
            deleteTopologyLink={deleteTopologyLink}
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
    </div>
  );
};

export default App;