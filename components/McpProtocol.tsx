
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { getMcpServers, saveMcpServer } from '../services/api';
import type { McpServer } from '../types';

const generateMcpCode = (server: McpServer): string => {
    let endpoints = [];
    if (server.name.toLowerCase().includes('p21') || server.name.toLowerCase().includes('erp')) {
        endpoints = [
            { path: "/customers", methods: ["GET"], description: "Fetch customer data" },
            { path: "/orders", methods: ["GET", "POST"], description: "Fetch and create sales orders" },
            { path: "/inventory", methods: ["GET"], description: "Fetch item stock levels" }
        ];
    } else if (server.name.toLowerCase().includes('wordpress') || server.name.toLowerCase().includes('cms')) {
        endpoints = [
            { path: "/posts", methods: ["GET"], description: "Fetch all posts" },
            { path: "/products", methods: ["GET"], description: "Fetch all products" }
        ];
    } else if (server.type === 'DocumentCollection') {
        endpoints = [
            { path: "/search", methods: ["POST"], description: "Perform a semantic search query." },
            { path: "/documents/{id}", methods: ["GET"], description: "Retrieve a specific document by its ID." }
        ];
    } else if (server.type === 'ExternalAPI') {
         endpoints = [
            { path: "/records", methods: ["GET"], description: "Fetch a list of records." },
            { path: "/records", methods: ["POST"], description: "Create a new record." }
        ];
    } else {
        endpoints = [
            { path: "/health", methods: ["GET"], description: "Health check endpoint" },
            { path: "/data", methods: ["GET", "POST"], description: "Generic data endpoint" }
        ];
    }

    const config = {
      mcpVersion: "1.1.0",
      serverInfo: {
        id: server.id,
        name: server.name,
        url: server.url,
        description: server.description,
        type: server.type
      },
      endpoints,
      auth: {
        type: server.type === 'Official' ? "OAUTH2" : "API_KEY"
      }
    };
    return JSON.stringify(config, null, 2);
};

const McpCodeViewerModal: React.FC<{ server: McpServer, onClose: () => void }> = ({ server, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <Card className="max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">MCP Code: <span className="text-cyan-400">{server.name}</span></h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold">&times;</button>
                </div>
                <pre className="h-96 bg-slate-900/50 p-3 rounded-lg overflow-y-auto font-mono text-sm text-cyan-300">
                    <code>{generateMcpCode(server)}</code>
                </pre>
            </Card>
        </div>
    );
};

const McpExampleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const exampleCode = `{
  "mcpVersion": "1.1.0",
  "serverInfo": {
    "name": "Example Data Source",
    "url": "mcp://example-data.internal:9090",
    "description": "A sample MCP for demonstration.",
    "type": "Custom"
  },
  "endpoints": [
    {
      "path": "/health",
      "methods": ["GET"],
      "description": "Health check endpoint"
    }
  ],
  "auth": {
    "type": "API_KEY"
  }
}`;
     return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <Card className="max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Working MCP Example</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white font-bold">&times;</button>
                </div>
                <p className="text-slate-400 mb-4">This is an example of a simple, valid custom MCP server configuration. Your URL must begin with `mcp://`, `http://`, or `https://`.</p>
                <pre className="bg-slate-900/50 p-3 rounded-lg overflow-y-auto font-mono text-sm text-cyan-300">
                    <code>{exampleCode}</code>
                </pre>
            </Card>
        </div>
    );
};

const ServerList: React.FC<{ servers: McpServer[], onToggleLoad: (s: McpServer) => void, onShowCode: (s: McpServer) => void, isLoading: boolean }> = 
({ servers, onToggleLoad, onShowCode, isLoading }) => (
    <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2 max-h-[200px]">
        {isLoading ? <p className="text-slate-400">Loading...</p> : servers.map(server => (
            <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg">
                <p className="font-semibold text-slate-200">{server.name}</p>
                <p className="text-sm text-slate-400 mb-3">{server.description}</p>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-700/50">
                    <button 
                        onClick={() => onShowCode(server)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sm rounded font-semibold text-white"
                    >
                        View Code
                    </button>
                    <button 
                        onClick={() => onToggleLoad(server)}
                        disabled={server.isLoaded}
                        className="px-3 py-1 bg-cyan-500 text-sm rounded font-semibold text-white hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {server.isLoaded ? 'Loaded' : 'Load'}
                    </button>
                </div>
            </div>
        ))}
    </div>
);

const McpProtocol: React.FC = () => {
    const [allServers, setAllServers] = useState<McpServer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newServerName, setNewServerName] = useState('');
    const [newServerUrl, setNewServerUrl] = useState('');
    const [addServerError, setAddServerError] = useState<string | null>(null);

    const [viewingServer, setViewingServer] = useState<McpServer | null>(null);
    const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);

    useEffect(() => {
        const loadServers = async () => {
            setIsLoading(true);
            const servers = await getMcpServers();
            setAllServers(servers);
            setIsLoading(false);
        };
        loadServers();
    }, []);

    const handleToggleLoad = async (server: McpServer) => {
        const isCurrentlyLoaded = server.isLoaded;
        const updatedServer = { ...server, isLoaded: !isCurrentlyLoaded };
        
        setAllServers(allServers.map(s => s.id === server.id ? updatedServer : s));
        
        await saveMcpServer(server, !isCurrentlyLoaded);
    };

    const handleAddCustomServer = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddServerError(null); // Clear previous errors

        // --- Validation Logic ---
        if (!newServerName.trim()) {
            setAddServerError("Error: Server Name cannot be empty.");
            return;
        }
        if (!newServerUrl.trim()) {
            setAddServerError("Error: Server URL cannot be empty.");
            return;
        }
        if (!/^(mcp|https|http):\/\//.test(newServerUrl.trim())) {
            setAddServerError("Compliance Error: URL must start with mcp://, https://, or http://.");
            return;
        }
        if (allServers.some(s => s.name.trim().toLowerCase() === newServerName.trim().toLowerCase())) {
            setAddServerError("Formatting Error: A server with this name already exists.");
            return;
        }
        // --- End Validation ---

        const newServer: McpServer = {
            id: `custom-${Date.now()}`,
            name: newServerName.trim(),
            url: newServerUrl.trim(),
            description: 'A custom user-added server.',
            type: 'Custom',
            isLoaded: true,
        };

        setAllServers([...allServers, newServer]);
        setNewServerName('');
        setNewServerUrl('');
        
        await saveMcpServer(newServer, true);
    };

    const libraryServers = allServers.filter(s => s.type === 'Official');
    const documentCollections = allServers.filter(s => s.type === 'DocumentCollection');
    const externalApis = allServers.filter(s => s.type === 'ExternalAPI');
    const installedServers = allServers.filter(s => s.isLoaded);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Model Content Protocol (MCP)</h1>
            <p className="text-slate-400 max-w-3xl">
                MCPs are the interfaces for all inputs and outputs. Manage connections to your model libraries, data sources, and application servers. Load servers from the official library or add your own custom endpoints to integrate them into your data lake workflows.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Side: Installed & Custom */}
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-4">Loaded Servers</h2>
                        <div className="space-y-3">
                            {isLoading ? <p className="text-slate-400">Loading...</p> : installedServers.length > 0 ? (
                                installedServers.map(server => (
                                    <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div>
                                              <p className="font-semibold text-slate-200">{server.name}</p>
                                              <p className="text-sm text-cyan-400 font-mono">{server.url}</p>
                                          </div>
                                          <button 
                                              onClick={() => setViewingServer(server)}
                                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sm rounded font-semibold text-white"
                                          >
                                              View Code
                                          </button>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                                            <button 
                                                onClick={() => handleToggleLoad(server)}
                                                className="px-3 py-1 bg-red-800/80 hover:bg-red-800 text-sm rounded font-semibold text-white"
                                            >
                                                Unload
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-4">No servers loaded. Load one from the library.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Add Custom Server</h2>
                            <button onClick={() => setIsExampleModalOpen(true)} className="text-sm text-cyan-400 hover:underline">Show Example</button>
                        </div>
                        <form onSubmit={handleAddCustomServer} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 mb-1 text-sm">Server Name</label>
                                <input 
                                    type="text"
                                    value={newServerName}
                                    onChange={e => setNewServerName(e.target.value)}
                                    placeholder="e.g., My Internal Model Server"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-1 text-sm">Server URL</label>
                                <input 
                                    type="text"
                                    value={newServerUrl}
                                    onChange={e => setNewServerUrl(e.target.value)}
                                    placeholder="mcp://my-models.internal"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            {addServerError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
                                    {addServerError}
                                </div>
                            )}
                            <button type="submit" className="w-full bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                                Add & Load Server
                            </button>
                        </form>
                    </Card>
                </div>
                
                {/* Right Side: Libraries */}
                <div className="space-y-6">
                    <Card className="flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-4">Server Library</h2>
                        <ServerList servers={libraryServers} onToggleLoad={handleToggleLoad} onShowCode={setViewingServer} isLoading={isLoading} />
                    </Card>
                    <Card className="flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-4">Indexed Document Collections</h2>
                        <ServerList servers={documentCollections} onToggleLoad={handleToggleLoad} onShowCode={setViewingServer} isLoading={isLoading} />
                    </Card>
                    <Card className="flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-4">External API Connectors</h2>
                        <ServerList servers={externalApis} onToggleLoad={handleToggleLoad} onShowCode={setViewingServer} isLoading={isLoading} />
                    </Card>
                </div>
            </div>
            {viewingServer && <McpCodeViewerModal server={viewingServer} onClose={() => setViewingServer(null)} />}
            {isExampleModalOpen && <McpExampleModal onClose={() => setIsExampleModalOpen(false)} />}
        </div>
    );
};

export default McpProtocol;