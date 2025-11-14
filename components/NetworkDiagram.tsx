import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Device, DeviceType, TopologyLink } from '../types';
import { RouterIcon, SwitchIcon, LinkIcon, XIcon, TrashIcon, PCIcon, ServerIcon, APIcon, PrinterIcon, SettingsIcon, SearchIcon, PlusIcon, MinusIcon, ZoomResetIcon, DuplicateIcon, CloudServerIcon, EyeIcon, CutIcon, ChevronDownIcon, ChevronUpIcon } from './icons/Icons';
import { ConfirmationModal } from './ConfirmationModal';
import * as d3 from 'd3';

// FIX: Renamed Node to D3Node to avoid conflict with the global DOM Node type.
interface D3Node extends d3.SimulationNodeDatum {
    id: string;
    device: Device;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

// FIX: Changed source and target to `any` to resolve a type conflict.
// The `d3.SimulationLinkDatum<Node>` interface expects `source` and `target` to be of type `Node`,
// but they are initialized as strings. This conflict can lead to unexpected runtime errors in d3, such as the one reported.
// FIX: Renamed Link to D3Link and updated to use D3Node.
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    id: string;
    source: any;
    target: any;
}

interface NetworkDiagramProps {
    devices: Device[];
    topology: TopologyLink[];
    onSelectDevice: (id: string) => void;
    addTopologyLink: (from: string, to: string) => void;
    deleteTopologyLink: (linkId: string) => void;
    deleteAllLinksForDevice: (deviceId: string) => void;
    deleteDevice: (deviceId: string) => void;
    duplicateDevice: (deviceId: string) => void;
}

const DEVICE_TYPE_COLORS: Record<DeviceType, string> = {
    [DeviceType.SWITCH]: '#3b82f6', // blue-500
    [DeviceType.ROUTER]: '#22c55e', // green-500
    [DeviceType.PC]: '#8b5cf6', // violet-500
    [DeviceType.SERVER]: '#f97316', // orange-500
    [DeviceType.CLOUD_SERVER]: '#a5b4fc', // indigo-300
    [DeviceType.AP]: '#eab308', // yellow-500
    [DeviceType.PRINTER]: '#64748b', // slate-500
    [DeviceType.OTHER]: '#ec4899', // pink-500
};

const getDeviceIconSvg = (type: DeviceType): string => {
    // Returns a group with a transformed path for centering/scaling
    const size = 24; // viewBox size
    const scale = 1.4;
    const translation = -(size / 2);
    const transform = `scale(${scale}) translate(${translation}, ${translation})`;

    const paths: Record<DeviceType, string> = {
        [DeviceType.SWITCH]: `<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.ROUTER]: `<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" /><rect x="3" y="10" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>`,
        [DeviceType.PC]: `<path d="M12 18.5v-3.5m-4.5 3.5h9M5.625 5.5h12.75a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H5.625a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.SERVER]: `<path d="M3.375 6.375h17.25M6.375 9.375h1.5m-1.5 6h1.5m1.5-6h1.5m4.5 0h1.5m-9 9h9m-12-15a2 2 0 0 1 2-2h13.25a2 2 0 0 1 2 2v13.25a2 2 0 0 1-2 2H5.375a2 2 0 0 1-2-2V4.375Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.CLOUD_SERVER]: `<path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.5 4.5 0 002.25 15z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.AP]: `<path d="M12 5c3.866 0 7 1.79 7 4m-14 0c0-2.21 3.134-4 7-4m-9 8h2m14 0h2m-10-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.PRINTER]: `<path d="M8.625 15.375v4.5m6.75-4.5v4.5m-10.5-9h14.25v-6a1 1 0 0 0-1-1H6.375a1 1 0 0 0-1 1v6Zm0 0h14.25m-14.25 0a2 2 0 0 0-2 2v4.5a1 1 0 0 0 1 1h16.25a1 1 0 0 0 1-1v-4.5a2 2 0 0 0-2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
        [DeviceType.OTHER]: `<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,
    };

    const path = paths[type] || paths[DeviceType.SWITCH];
    return `<g transform="${transform}">${path}</g>`;
};

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ devices, topology, onSelectDevice, addTopologyLink, deleteTopologyLink, deleteAllLinksForDevice, deleteDevice, duplicateDevice }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [linking, setLinking] = useState<string | null>(null);
    const [topologySearchQuery, setTopologySearchQuery] = useState('');
    // FIX: Updated state to use D3Node type.
    const [menuData, setMenuData] = useState<{ x: number; y: number; node: D3Node } | null>(null);
    const [isConnectionsSubMenuOpen, setConnectionsSubMenuOpen] = useState(false);
    const connectionsSubMenuTimeoutRef = useRef<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Device | null>(null);
    const [cutConfirm, setCutConfirm] = useState<Device | null>(null);

    const [isDevicesOpen, setDevicesOpen] = useState(false);
    const [isLinksOpen, setLinksOpen] = useState(false);
    const [deviceFilter, setDeviceFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const devicesDropdownRef = useRef<HTMLDivElement>(null);
    const linksDropdownRef = useRef<HTMLDivElement>(null);

    // FIX: Updated useMemo to use D3Node and D3Link types.
    const nodes = useMemo<D3Node[]>(() => devices.map(device => ({ id: device.id, device })), [devices]);
    const links = useMemo<D3Link[]>(() => topology.map(link => ({ id: link.id, source: link.from, target: link.to })), [topology]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuData && (!event.target || !(event.target as Element).closest('.absolute.z-30'))) {
                setMenuData(null);
                setConnectionsSubMenuOpen(false);
            }
            // FIX: The type cast to Node now correctly refers to the global DOM Node type due to renaming our custom interface.
            if (devicesDropdownRef.current && !devicesDropdownRef.current.contains(event.target as Node)) {
                setDevicesOpen(false);
            }
            if (linksDropdownRef.current && !linksDropdownRef.current.contains(event.target as Node)) {
                setLinksOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuData]);


    useEffect(() => {
        if (!svgRef.current || dimensions.width === 0) return;

        // FIX: Updated d3 simulation to use D3Node and D3Link types.
        const simulation = d3.forceSimulation<D3Node>(nodes)
            .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(200))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .on("tick", ticked);

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render
        
        const g = svg.append("g");

        const linkedDeviceIds = new Set(topology.flatMap(link => [link.from, link.to]));

        // FIX: Updated function signature to use D3Node type.
        const isSearched = (d: D3Node) => {
            if (!topologySearchQuery) return false;
            return d.device.name.toLowerCase().includes(topologySearchQuery.toLowerCase()) || d.device.ipAddress.toLowerCase().includes(topologySearchQuery.toLowerCase());
        };
        
        const searchedIds = new Set(nodes.filter(isSearched).map(n => n.id));


        const link = g.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", d => {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                return topologySearchQuery && (searchedIds.has(sourceId) || searchedIds.has(targetId)) ? '#06b6d4' : '#475569';
            })
            .attr("stroke-opacity", d => {
                 const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                if (!topologySearchQuery) return 0.6;
                return searchedIds.has(sourceId) || searchedIds.has(targetId) ? 0.9 : 0.1;
            })
            .attr("stroke-width", d => {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                return topologySearchQuery && (searchedIds.has(sourceId) || searchedIds.has(targetId)) ? 4 : 2.5;
            })
            .attr("data-link-id", d => d.id);
            
        const node = g.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "cursor-pointer")
            // FIX: Updated d3 drag behavior to use D3Node type.
            .call(d3.drag<SVGGElement, D3Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", 30)
            .attr("fill", d => DEVICE_TYPE_COLORS[d.device.type] || '#64748b')
            .attr("fill-opacity", d => {
                if(topologySearchQuery) return isSearched(d) ? 0.4 : 0.1;
                return linkedDeviceIds.has(d.id) ? 0.4 : 0.2;
            })
            .attr("stroke", d => isSearched(d) ? '#06b6d4' : DEVICE_TYPE_COLORS[d.device.type] || '#64748b')
            .attr("stroke-width", d => isSearched(d) ? 4 : 2)
            .attr("stroke-opacity", d => {
                if(topologySearchQuery) return isSearched(d) ? 1 : 0.2;
                return linkedDeviceIds.has(d.id) ? 1 : 0.6
            });

        // Icon Handling
        const nodeIcon = node.append("g").attr("class", "node-icon");

        nodeIcon.filter(d => !!d.device.iconUrl)
            .append("image")
            .attr("href", d => d.device.iconUrl!)
            .attr("x", -20)
            .attr("y", -20)
            .attr("height", 40)
            .attr("width", 40)
            .attr("clip-path", "circle(20px)")
            .style("opacity", d => {
                if(topologySearchQuery) return isSearched(d) ? 1 : 0.3;
                return linkedDeviceIds.has(d.id) ? 1 : 0.7;
            })
            // FIX: Cast this.parentNode to Element to satisfy d3.select's type requirements.
            .on("error", function(event, d_unknown) {
                // FIX: Cast datum from unknown to D3Node to safely access properties.
                const d = d_unknown as D3Node;
                const parent = d3.select(this.parentNode as Element);
                d3.select(this).remove();
                parent.append("g")
                    .html(getDeviceIconSvg(d.device.type))
                    .attr("color", "#e2e8f0")
                    .style("opacity", () => {
                        if(topologySearchQuery) return isSearched(d) ? 1 : 0.3;
                        return linkedDeviceIds.has(d.id) ? 1 : 0.7;
                    });
            });
        
        nodeIcon.filter(d => !d.device.iconUrl)
            .append("g")
            .html(d => getDeviceIconSvg(d.device.type))
            .attr("color", "#e2e8f0")
            .style("opacity", d => {
                if(topologySearchQuery) return isSearched(d) ? 1 : 0.3;
                return linkedDeviceIds.has(d.id) ? 1 : 0.7;
            });

        node.append("text")
            .attr("y", 45)
            .attr("text-anchor", "middle")
            .attr("fill", d => isSearched(d) ? "#67e8f9" : "#94a3b8")
            .attr("font-size", "12px")
            .attr("font-weight", d => isSearched(d) ? "bold" : "normal")
            .style("opacity", d => topologySearchQuery && !isSearched(d) ? 0.3 : 1)
            .text(d => d.device.name);
        
        // FIX: Explicitly typed the datum 'd' to D3Node to fix type inference issues.
        node.on("click", (event, d_unknown) => {
            // FIX: Cast datum from unknown to D3Node to safely access properties.
            const d = d_unknown as D3Node;
            if (linking) {
                addTopologyLink(linking, d.id);
                setLinking(null);
            }
        }).on("dblclick", (event, d_unknown) => {
            // FIX: Cast datum from unknown to D3Node to safely access properties.
            const d = d_unknown as D3Node;
            event.preventDefault();
            simulation.alphaTarget(0);
            d.fx = d.x ?? null;
            d.fy = d.y ?? null;
            setConnectionsSubMenuOpen(false);
            setMenuData({ x: event.pageX, y: event.pageY, node: d });
        });
        
        function ticked() {
            link
                // FIX: Cast source and target to D3Node to access x/y properties safely.
                .attr("x1", d => (d.source as D3Node).x ?? 0)
                .attr("y1", d => (d.source as D3Node).y ?? 0)
                .attr("x2", d => (d.target as D3Node).x ?? 0)
                .attr("y2", d => (d.target as D3Node).y ?? 0);

            node.attr("transform", d_unknown => {
                // FIX: Cast datum from unknown to D3Node and add nullish coalescing for safety.
                const d = d_unknown as D3Node;
                return `translate(${d.x ?? 0}, ${d.y ?? 0})`;
            });
        }

        // FIX: Updated drag handler signatures to use D3Node type.
        function dragstarted(event: d3.D3DragEvent<any, D3Node, any>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: d3.D3DragEvent<any, D3Node, any>, d: D3Node) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<any, D3Node, any>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0);
            if (!menuData || menuData.node.id !== d.id) {
                d.fx = null;
                d.fy = null;
            }
        }

        const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            g.attr('transform', event.transform.toString());
        };

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on('zoom', zoomed);
        
        zoomRef.current = zoom;
        svg.call(zoom).on("dblclick.zoom", null);


    }, [nodes, links, dimensions, linking, addTopologyLink, topologySearchQuery]);

    const handleNodeLinkClick = (nodeId: string) => {
        setLinking(nodeId);
    };
    
    const deviceTypeIcons: Record<DeviceType, React.FC<{className?: string}>> = {
        [DeviceType.ROUTER]: RouterIcon,
        [DeviceType.SWITCH]: SwitchIcon,
        [DeviceType.PC]: PCIcon,
        [DeviceType.SERVER]: ServerIcon,
        [DeviceType.CLOUD_SERVER]: CloudServerIcon,
        [DeviceType.AP]: APIcon,
        [DeviceType.PRINTER]: PrinterIcon,
        [DeviceType.OTHER]: SettingsIcon,
    };

    const handleZoomIn = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 1.2);
        }
    };

    const handleZoomOut = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, 0.8);
        }
    };

    const handleZoomReset = () => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.transform, d3.zoomIdentity);
        }
    };

    const filteredDevicesForDropdown = useMemo(() => {
        return devices.filter(device =>
            device.name.toLowerCase().includes(deviceFilter.toLowerCase())
        );
    }, [devices, deviceFilter]);

    const filteredLinksForDropdown = useMemo(() => {
        return topology.map(link => {
            const fromDevice = devices.find(d => d.id === link.from);
            const toDevice = devices.find(d => d.id === link.to);
            return { ...link, fromDevice, toDevice };
        }).filter(({ fromDevice, toDevice }) => {
            if (!fromDevice || !toDevice) return false;
            if (!linkFilter) return true;
            const filter = linkFilter.toLowerCase();
            return fromDevice.name.toLowerCase().includes(filter) || toDevice.name.toLowerCase().includes(filter);
        });
    }, [topology, devices, linkFilter]);

    const ContextMenu = () => {
        if (!menuData) return null;
    
        const deviceId = menuData.node.id;
        const deviceName = menuData.node.device.name;
        const deviceConnections = topology.filter(link => link.from === deviceId || link.to === deviceId);
    
        const handleConnectionsMouseEnter = () => {
            if (connectionsSubMenuTimeoutRef.current) {
                clearTimeout(connectionsSubMenuTimeoutRef.current);
            }
            setConnectionsSubMenuOpen(true);
        };
    
        const handleConnectionsMouseLeave = () => {
            connectionsSubMenuTimeoutRef.current = window.setTimeout(() => {
                setConnectionsSubMenuOpen(false);
            }, 300);
        };
    
        const closeAllMenus = () => {
            setMenuData(null);
            setConnectionsSubMenuOpen(false);
        }
        
        return (
            <div
                style={{ top: menuData.y, left: menuData.x }}
                className="absolute z-30 bg-slate-700 rounded-md shadow-lg border border-slate-600 w-52"
            >
                <div className="p-2 flex justify-between items-center font-semibold text-slate-200 border-b border-slate-600">
                    <span className="truncate pr-2" title={deviceName}>{deviceName}</span>
                    <button onClick={closeAllMenus} className="p-1 -mr-1 rounded-full hover:bg-slate-600 transition-colors" title="Close">
                        <XIcon className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <ul className="py-1">
                    {/* View Device */}
                    <li>
                        <button onClick={() => { onSelectDevice(deviceId); closeAllMenus(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors">
                            <EyeIcon className="w-4 h-4" />
                            <span>View Device</span>
                        </button>
                    </li>
                    {/* Add Connection */}
                    <li>
                        <button onClick={() => { handleNodeLinkClick(deviceId); closeAllMenus(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors">
                            <LinkIcon className="w-4 h-4" />
                            <span>Add Connection</span>
                        </button>
                    </li>
                    {/* Connections Submenu */}
                    <li onMouseEnter={handleConnectionsMouseEnter} onMouseLeave={handleConnectionsMouseLeave} className="relative">
                        <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 cursor-default">
                            <CutIcon className="w-4 h-4" />
                            <span>Connections</span>
                        </div>
                        {isConnectionsSubMenuOpen && (
                            <div
                                className="absolute left-full -top-1 ml-1 w-64 bg-slate-700 rounded-md shadow-lg border border-slate-600"
                                onMouseEnter={handleConnectionsMouseEnter}
                                onMouseLeave={handleConnectionsMouseLeave}
                            >
                                <ul className="py-1 max-h-60 overflow-y-auto">
                                    {deviceConnections.length === 0 && (
                                        <li className="px-3 py-2 text-sm text-slate-400 italic">No connections</li>
                                    )}
                                    {deviceConnections.map(link => {
                                        const otherDeviceId = link.from === deviceId ? link.to : link.from;
                                        const otherDevice = devices.find(d => d.id === otherDeviceId);
                                        return (
                                            <li key={link.id} className="flex items-center justify-between px-3 py-1 text-sm text-slate-300 group">
                                                <span className="truncate pr-2">
                                                    Link to: <strong>{otherDevice?.name || 'Unknown'}</strong>
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        deleteTopologyLink(link.id);
                                                    }}
                                                    className="p-1 rounded-full text-slate-500 group-hover:bg-red-500/20 group-hover:text-red-400"
                                                    title={`Delete link to ${otherDevice?.name}`}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                    {deviceConnections.length > 0 && <hr className="border-slate-600 my-1" />}
                                    <li>
                                        <button
                                            onClick={() => {
                                                setCutConfirm(menuData.node.device);
                                                closeAllMenus();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                        >
                                            <CutIcon className="w-4 h-4" />
                                            <span>Cut All Connections</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </li>
                    {/* Duplicate Device */}
                    <li>
                        <button onClick={() => { duplicateDevice(deviceId); closeAllMenus(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors">
                            <DuplicateIcon className="w-4 h-4" />
                            <span>Duplicate Device</span>
                        </button>
                    </li>
                    {/* Delete Device */}
                    <li>
                        <button onClick={() => { setDeleteConfirm(menuData.node.device); closeAllMenus(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete Device</span>
                        </button>
                    </li>
                </ul>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-slate-800/50 rounded-lg flex flex-col relative">
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center gap-4">
                <h3 className="text-xl font-semibold text-slate-200 shrink-0">Network Topology</h3>
                <div className="relative w-full max-w-xs">
                    <input
                      type="text"
                      placeholder="Search topology..."
                      value={topologySearchQuery}
                      onChange={(e) => setTopologySearchQuery(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>
            {linking && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-cyan-900/80 backdrop-blur-sm text-cyan-200 px-4 py-2 rounded-lg z-20 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 animate-pulse" />
                    <span>Select a device to link to...</span>
                    <button onClick={() => setLinking(null)} className="p-1 hover:bg-cyan-700 rounded-full">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex-grow relative p-4" ref={containerRef}>
                <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
                <ContextMenu />
                <div className="absolute bottom-4 right-4 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50 flex flex-col z-10">
                    <button onClick={handleZoomIn} className="p-2 text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors" title="Zoom In">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleZoomOut} className="p-2 text-slate-300 hover:bg-slate-700 transition-colors border-y border-slate-700/50" title="Zoom Out">
                        <MinusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleZoomReset} className="p-2 text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors" title="Reset Zoom">
                        <ZoomResetIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="p-4 border-t border-slate-700/50 flex flex-wrap gap-4">
                 {/* Devices Dropdown */}
                <div className="relative" ref={devicesDropdownRef}>
                    <button onClick={() => setDevicesOpen(prev => !prev)} className="flex items-center gap-2 font-semibold px-3 py-2 bg-slate-700/50 rounded-md hover:bg-slate-600 transition-colors">
                        <span>Devices ({devices.length})</span>
                        {isDevicesOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    {isDevicesOpen && (
                        <div className="absolute bottom-full mb-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-20">
                            <div className="p-2 border-b border-slate-600">
                                <input
                                    type="text"
                                    placeholder="Filter devices..."
                                    value={deviceFilter}
                                    onChange={e => setDeviceFilter(e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                {filteredDevicesForDropdown.map(device => {
                                    const Icon = deviceTypeIcons[device.type] || deviceTypeIcons.OTHER;
                                    return (
                                        <div key={device.id} className="bg-slate-700/50 rounded-md px-3 py-1 flex items-center gap-2">
                                            <Icon className="w-4 h-4"/>
                                            <span className="text-sm flex-grow truncate">{device.name}</span>
                                            <button
                                                onClick={() => { handleNodeLinkClick(device.id); setDevicesOpen(false); }}
                                                disabled={!!linking}
                                                className="p-1 rounded-full hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                                title={`Create link from ${device.name}`}
                                            >
                                                <LinkIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    )
                                })}
                                {filteredDevicesForDropdown.length === 0 && <p className="text-sm text-slate-500 text-center p-2">No devices found.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Links Dropdown */}
                <div className="relative" ref={linksDropdownRef}>
                        <button onClick={() => setLinksOpen(prev => !prev)} className="flex items-center gap-2 font-semibold px-3 py-2 bg-slate-700/50 rounded-md hover:bg-slate-600 transition-colors">
                        <span>Links ({topology.length})</span>
                        {isLinksOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    {isLinksOpen && (
                        <div className="absolute bottom-full mb-2 w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-20">
                            <div className="p-2 border-b border-slate-600">
                                <input
                                    type="text"
                                    placeholder="Filter by device name..."
                                    value={linkFilter}
                                    onChange={e => setLinkFilter(e.target.value)}
                                    className="w-full bg-slate-700/50 border border-slate-600 rounded-md px-3 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                {filteredLinksForDropdown.map(link => (
                                    <div key={link.id} className="bg-slate-700/50 rounded-md px-3 py-1 flex items-center gap-2 text-sm">
                                        <span className="truncate">{link.fromDevice?.name}</span>
                                        <span className="text-slate-400 shrink-0">&lt;-&gt;</span>
                                        <span className="truncate flex-grow">{link.toDevice?.name}</span>
                                        <button onClick={() => deleteTopologyLink(link.id)} className="p-1 rounded-full hover:bg-red-500/50 shrink-0" title="Delete link">
                                            <TrashIcon className="w-4 h-4 text-red-400"/>
                                        </button>
                                    </div>
                                ))}
                                {topology.length === 0 && <p className="text-sm text-slate-400 text-center p-2">No links created.</p>}
                                {topology.length > 0 && filteredLinksForDropdown.length === 0 && <p className="text-sm text-slate-500 text-center p-2">No links found.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {deleteConfirm && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={() => {
                        if (deleteConfirm) {
                            deleteDevice(deleteConfirm.id);
                        }
                        setDeleteConfirm(null);
                    }}
                    title="Confirm Device Deletion"
                    message={<>Are you sure you want to move <strong>"{deleteConfirm.name}"</strong> to the recycle bin? This will also remove it from the topology.</>}
                    confirmButtonText="Move to Bin"
                    confirmButtonVariant="danger"
                />
            )}
             {cutConfirm && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setCutConfirm(null)}
                    onConfirm={() => {
                        if (cutConfirm) {
                            deleteAllLinksForDevice(cutConfirm.id);
                        }
                        setCutConfirm(null);
                    }}
                    title="Confirm Cut Connections"
                    message={<>Are you sure you want to delete all connections for <strong>"{cutConfirm.name}"</strong>? This action cannot be undone.</>}
                    confirmButtonText="Cut Connections"
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
