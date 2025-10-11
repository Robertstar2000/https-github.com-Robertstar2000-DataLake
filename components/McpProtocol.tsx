
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { getMcpServers, saveMcpServer } from '../services/api';
import type { McpServer } from '../types';

const McpProtocol: React.FC = () => {
    const [allServers, setAllServers] = useState<McpServer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newServerName, setNewServerName] = useState('');
    const [newServerUrl, setNewServerUrl] = useState('');

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
        
        // Update local state immediately for responsiveness
        setAllServers(allServers.map(s => s.id === server.id ? updatedServer : s));
        
        // Persist change to the database
        await saveMcpServer(server, !isCurrentlyLoaded);
    };

    const handleAddCustomServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServerName.trim() || !newServerUrl.trim()) return;

        const newServer: McpServer = {
            id: `custom-${Date.now()}`,
            name: newServerName,
            url: newServerUrl,
            description: 'A custom user-added server.',
            type: 'Custom',
            isLoaded: true, // Custom servers are loaded by default
        };

        setAllServers([...allServers, newServer]);
        setNewServerName('');
        setNewServerUrl('');
        
        await saveMcpServer(newServer, true);
    };

    const libraryServers = allServers.filter(s => s.type === 'Official');
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
                                    <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-200">{server.name}</p>
                                            <p className="text-sm text-cyan-400 font-mono">{server.url}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleLoad(server)}
                                            className="px-3 py-1 bg-red-800/80 hover:bg-red-800 text-sm rounded font-semibold text-white"
                                        >
                                            Unload
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-4">No servers loaded. Load one from the library.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold text-white mb-4">Add Custom Server</h2>
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
                                    placeholder="https://my-models.internal"
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <button type="submit" className="w-full bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
                                Add Server
                            </button>
                        </form>
                    </Card>
                </div>
                
                {/* Right Side: Library */}
                <Card className="flex flex-col">
                    <h2 className="text-xl font-bold text-white mb-4">Server Library</h2>
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2 max-h-[calc(100vh-250px)]">
                       {isLoading ? <p className="text-slate-400">Loading...</p> : libraryServers.map(server => (
                             <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-200">{server.name}</p>
                                    <p className="text-sm text-slate-400">{server.description}</p>
                                </div>
                                <button 
                                    onClick={() => handleToggleLoad(server)}
                                    disabled={server.isLoaded}
                                    className="px-3 py-1 bg-cyan-500 text-sm rounded font-semibold text-white hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {server.isLoaded ? 'Loaded' : 'Load'}
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default McpProtocol;
