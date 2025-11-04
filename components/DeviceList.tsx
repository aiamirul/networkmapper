
import React from 'react';
import { Device, DeviceType, TopologyLink, View } from '../types';
import { RouterIcon, SwitchIcon, DiagramIcon, PlusIcon, UploadIcon, DownloadIcon, PCIcon, ServerIcon, APIcon, PrinterIcon, SettingsIcon } from './icons/Icons';

interface DeviceListProps {
  devices: Device[];
  topology: TopologyLink[];
  importConfiguration: (config: { devices: Device[], topology: TopologyLink[] }) => void;
  onSelectDevice: (id: string) => void;
  selectedDeviceId: string | null;
  onAddDevice: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const DeviceIcon = ({ type }: { type: DeviceType }) => {
  const className = "w-5 h-5 text-slate-400 shrink-0";
  switch (type) {
    case DeviceType.ROUTER:
      return <RouterIcon className={className} />;
    case DeviceType.PC:
      return <PCIcon className={className} />;
    case DeviceType.SERVER:
      return <ServerIcon className={className} />;
    case DeviceType.AP:
      return <APIcon className={className} />;
    case DeviceType.PRINTER:
      return <PrinterIcon className={className} />;
    case DeviceType.OTHER:
      return <SettingsIcon className={className} />;
    case DeviceType.SWITCH:
    default:
      return <SwitchIcon className={className} />;
  }
};

export const DeviceList: React.FC<DeviceListProps> = ({ devices, topology, importConfiguration, onSelectDevice, selectedDeviceId, onAddDevice, currentView, setCurrentView }) => {

  const handleExport = () => {
    const dataToExport = {
        devices,
        topology,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "netdiagram-ai-config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = e => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const parsedData = JSON.parse(result);
                    // Basic validation
                    if (Array.isArray(parsedData.devices) && Array.isArray(parsedData.topology)) {
                        importConfiguration(parsedData);
                        alert('Configuration imported successfully!');
                    } else {
                        throw new Error('Invalid file format: "devices" and "topology" arrays not found.');
                    }
                }
            } catch (error) {
                console.error("Failed to import configuration:", error);
                alert(`Failed to import configuration. Please check the file format and console for details. Error: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                event.target.value = '';
            }
        };
        fileReader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Error reading the selected file.");
        };
    }
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-200">Network Devices</h2>
        <div className="flex items-center gap-2">
            <input
              type="file"
              id="import-json"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <label
              htmlFor="import-json"
              className="p-2 rounded-full bg-slate-700 hover:bg-cyan-500 text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
              title="Import from JSON"
            >
              <UploadIcon className="w-5 h-5" />
            </label>
            <button
                onClick={handleExport}
                className="p-2 rounded-full bg-slate-700 hover:bg-cyan-500 text-slate-300 hover:text-slate-900 transition-colors"
                title="Export to JSON"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={onAddDevice}
                className="p-2 rounded-full bg-slate-700 hover:bg-cyan-500 text-slate-300 hover:text-slate-900 transition-colors"
                aria-label="Add new device"
                title="Add new device"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

      <nav className="flex-grow">
        <ul>
          <li className="mb-2">
            <button
              onClick={() => setCurrentView(View.DIAGRAM)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-slate-300 ${
                currentView === View.DIAGRAM ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'
              }`}
            >
              <DiagramIcon className="w-5 h-5" />
              <span className="font-medium">Topology Diagram</span>
            </button>
          </li>
          <hr className="border-t border-slate-700 my-2" />
          {devices.map(device => (
            <li key={device.id} className="mb-1">
              <button
                onClick={() => onSelectDevice(device.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-slate-300 ${
                  selectedDeviceId === device.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                }`}
              >
                <DeviceIcon type={device.type} />
                <div className="flex-grow overflow-hidden">
                    <p className="font-medium truncate">{device.name}</p>
                    <p className="text-xs text-slate-400 truncate">{device.ipAddress}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
