
import React, { useState } from 'react';
import Card from './Card';
import { initialMcpServers, initialCustomServers } from '../data/mcpServers';
import type { McpServer } from '../types';

// Let's create unique IDs for the library servers
const libraryServers: McpServer[] = initialMcpServers.map((s, i) => ({
    ...s,
    id: `lib-server-${i}`,
    type: 'Official',
}));

const McpProtocol: React.FC = () => {
    const [installedServers, setInstalledServers] = useState<McpServer[]>(initialCustomServers);
    const [newServerName, setNewServerName] = useState('');
    const [newServerUrl, setNewServerUrl] = useState('');

    const handleLoadServer = (server: McpServer) => {
        if (!installedServers.some(s => s.id === server.id)) {
            setInstalledServers([...installedServers, server]);
        }
    };

    const handleUnloadServer = (serverId: string) => {
        setInstalledServers(installedServers.filter(s => s.id !== serverId));
    };

    const handleAddCustomServer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServerName.trim() || !newServerUrl.trim()) return;

        const newServer: McpServer = {
            id: `custom-${Date.now()}`,
            name: newServerName,
            url: newServerUrl,
            description: 'A custom user-added server.',
            type: 'Custom',
        };

        setInstalledServers([...installedServers, newServer]);
        setNewServerName('');
        setNewServerUrl('');
    };
    
    const isLoaded = (serverId: string) => installedServers.some(s => s.id === serverId);

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
                        <h2 className="text-xl font-bold text-white mb-4">Installed Servers</h2>
                        <div className="space-y-3">
                            {installedServers.length > 0 ? (
                                installedServers.map(server => (
                                    <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-200">{server.name}</p>
                                            <p className="text-sm text-cyan-400 font-mono">{server.url}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleUnloadServer(server.id)}
                                            className="px-3 py-1 bg-red-800/80 hover:bg-red-800 text-sm rounded font-semibold text-white"
                                        >
                                            Unload
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-4">No servers installed. Load one from the library.</p>
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
                        {libraryServers.map(server => (
                             <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between gap-4">
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-200">{server.name}</p>
                                    <p className="text-sm text-slate-400">{server.description}</p>
                                </div>
                                <button 
                                    onClick={() => handleLoadServer(server)}
                                    disabled={isLoaded(server.id)}
                                    className="px-3 py-1 bg-cyan-500 text-sm rounded font-semibold text-white hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isLoaded(server.id) ? 'Loaded' : 'Load'}
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
