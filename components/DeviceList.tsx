
import React, { useState, useRef, useEffect } from 'react';
import { Device, DeviceType, TopologyLink, View, Room, Rack, MacFormat } from '../types';
import { RouterIcon, SwitchIcon, DiagramIcon, PlusIcon, UploadIcon, DownloadIcon, PCIcon, ServerIcon, APIcon, PrinterIcon, SettingsIcon, SearchIcon, PrintIcon, LockIcon, DotsVerticalIcon, TrashIcon, ViewGridIcon, CloudServerIcon } from './icons/Icons';
import { ExportEncryptionModal } from './ExportEncryptionModal';
import { ImportDecryptionModal } from './ImportDecryptionModal';
import { formatMac } from '../utils/macFormatter';

interface DeviceListProps {
  devices: Device[];
  topology: TopologyLink[];
  rooms: Room[];
  racks: Rack[];
  importConfiguration: (config: { devices: Device[], topology: TopologyLink[], rooms?: Room[], racks?: Rack[] }) => void;
  onSelectDevice: (id: string) => void;
  selectedDeviceId: string | null;
  onAddDevice: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPrint: () => void;
  onOpenRecycleBin: () => void;
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
    case DeviceType.CLOUD_SERVER:
      return <CloudServerIcon className={className} />;
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

export const DeviceList: React.FC<DeviceListProps> = ({ devices, topology, rooms, racks, importConfiguration, onSelectDevice, selectedDeviceId, onAddDevice, currentView, setCurrentView, searchQuery, setSearchQuery, onPrint, onOpenRecycleBin }) => {
  const [isExportEncryptModalOpen, setExportEncryptModalOpen] = useState(false);
  const [isImportDecryptModalOpen, setImportDecryptModalOpen] = useState(false);
  const [encryptedConfigToImport, setEncryptedConfigToImport] = useState<{ salt: string; data: string } | null>(null);
  const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
            setActionsMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleExport = () => {
    const dataToExport = {
        devices,
        topology,
        rooms,
        racks,
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
    setActionsMenuOpen(false);
  };

  const handleExportCsvSummary = () => {
    const headers = [
        'ID', 'Name', 'Type', 'IP Address', 'Model', 'U Size', 
        'Room', 'Rack', 'U Position', 'Username', 'Key File', 
        'Details', 'Connections', 'Last Change Timestamp', 'Last Change'
    ];

    const escapeCsvCell = (cell: any): string => {
        const stringCell = String(cell ?? '').trim();
        if (/[",\r\n]/.test(stringCell)) {
            return `"${stringCell.replace(/"/g, '""')}"`;
        }
        return stringCell;
    };

    const rows = devices.map(device => {
        const roomName = device.placement ? rooms.find(r => r.id === device.placement.roomId)?.name || '' : '';
        const rackName = device.placement ? racks.find(r => r.id === device.placement.rackId)?.name || '' : '';
        const uPosition = device.placement ? device.placement.uPosition : '';

        const connectionsSummary = device.connections.map(c => 
            `Port ${c.port} (${c.type}): ${c.hostname} [${c.ipAddress}] [${formatMac(c.macAddress, MacFormat.COLON)}]`
        ).join('; ');

        const lastChange = device.changeLog && device.changeLog.length > 0 ? device.changeLog[0] : null;

        const rowData = [
            device.id,
            device.name,
            device.type,
            device.ipAddress,
            device.model,
            device.uSize,
            roomName,
            rackName,
            uPosition,
            device.username || '',
            device.keyFile?.name || '',
            device.details || '',
            connectionsSummary,
            lastChange ? new Date(lastChange.timestamp).toLocaleString() : '',
            lastChange ? lastChange.change : ''
        ];
        return rowData.map(escapeCsvCell).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "netdiagram-ai-summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionsMenuOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = async e => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const parsedData = JSON.parse(result);
                    
                    if (parsedData.salt && typeof parsedData.data === 'string') {
                        setEncryptedConfigToImport(parsedData);
                        setImportDecryptModalOpen(true);
                    } 
                    else if (Array.isArray(parsedData.devices) && Array.isArray(parsedData.topology)) {
                        importConfiguration(parsedData);
                        alert('Configuration imported successfully!');
                    } 
                    else {
                        throw new Error('Invalid or unrecognized configuration file format.');
                    }
                }
            } catch (error) {
                console.error("Failed to import configuration:", error);
                alert(`Failed to import configuration. Please check the file format and console for details. Error: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                if(event.target) event.target.value = '';
                setActionsMenuOpen(false);
            }
        };
        fileReader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Error reading the selected file.");
        };
    }
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Network Devices</h2>
          <div className="relative" ref={actionsMenuRef}>
              <button
                  onClick={() => setActionsMenuOpen(prev => !prev)}
                  className="p-2 rounded-full bg-slate-700 hover:bg-cyan-500 text-slate-300 hover:text-slate-900 transition-colors"
                  title="Actions"
              >
                  <DotsVerticalIcon className="w-5 h-5" />
              </button>
              {isActionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-700 rounded-md shadow-lg z-20 border border-slate-600">
                      <ul className="py-1">
                          <li>
                              <label htmlFor="import-json" className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 cursor-pointer">
                                  <UploadIcon className="w-5 h-5" />
                                  <span>Import from JSON</span>
                              </label>
                              <input type="file" id="import-json" className="hidden" accept=".json" onChange={handleImport} />
                          </li>
                          <li>
                              <button onClick={handleExport} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                                  <DownloadIcon className="w-5 h-5" />
                                  <span>Export to JSON</span>
                              </button>
                          </li>
                           <li>
                              <button onClick={() => { setExportEncryptModalOpen(true); setActionsMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                                  <LockIcon className="w-5 h-5" />
                                  <span>Export Encrypted</span>
                              </button>
                          </li>
                          <li>
                              <button onClick={handleExportCsvSummary} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                                  <DownloadIcon className="w-5 h-5" />
                                  <span>Export to CSV Summary</span>
                              </button>
                          </li>
                          <hr className="border-slate-600 my-1" />
                           <li>
                              <button onClick={() => { onOpenRecycleBin(); setActionsMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                                  <TrashIcon className="w-5 h-5" />
                                  <span>Recycle Bin</span>
                              </button>
                          </li>
                          <li>
                              <button onClick={() => { onPrint(); setActionsMenuOpen(false); }} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-600">
                                  <PrintIcon className="w-5 h-5" />
                                  <span>Print Report</span>
                              </button>
                          </li>
                      </ul>
                  </div>
              )}
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </div>
        </div>


        <nav className="flex-grow overflow-y-auto">
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
            <li className="mb-2">
              <button
                onClick={() => setCurrentView(View.PHYSICAL)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-slate-300 ${
                  currentView === View.PHYSICAL ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-slate-700/50'
                }`}
              >
                <ViewGridIcon className="w-5 h-5" />
                <span className="font-medium">Physical Layout</span>
              </button>
            </li>
            <hr className="border-t border-slate-700 my-2" />
            {filteredDevices.map(device => (
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
        <div className="mt-4 shrink-0">
             <button 
                onClick={onAddDevice}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-md font-semibold text-sm transition-colors"
                aria-label="Add new device"
            >
                <PlusIcon className="w-5 h-5" />
                <span>Add New Device</span>
            </button>
        </div>
      </div>
      {isExportEncryptModalOpen && (
          <ExportEncryptionModal 
              onClose={() => setExportEncryptModalOpen(false)}
              networkState={{ devices, topology, rooms, racks }}
          />
      )}
      {isImportDecryptModalOpen && encryptedConfigToImport && (
        <ImportDecryptionModal
          onClose={() => {
            setImportDecryptModalOpen(false);
            setEncryptedConfigToImport(null);
          }}
          encryptedData={encryptedConfigToImport}
          onSuccess={(decryptedConfig) => {
            importConfiguration(decryptedConfig);
            alert('Encrypted configuration imported successfully!');
          }}
        />
      )}
    </>
  );
};
