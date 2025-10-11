
import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { getDashboardStats, getLoadedMcpServers } from '../services/api';
import type { WorkflowStatus, McpServer } from '../types';

interface StatusData {
  mcpCount: number;
  workflowCounts: Record<WorkflowStatus, number>;
  dbStats: any; 
  vectorStats: any; 
}

const SkeletonBox: React.FC<{className?: string}> = ({ className }) => <div className={`bg-slate-700/50 rounded-lg animate-pulse ${className}`} />;

const StatCardSkeleton: React.FC = () => (
    <Card>
        <div className="flex items-center">
            <SkeletonBox className="w-12 h-12 rounded-lg mr-4" />
            <div className="flex-1">
                <SkeletonBox className="h-4 w-2/3 mb-2" />
                <SkeletonBox className="h-8 w-1/3" />
            </div>
        </div>
    </Card>
);

const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-9 w-1/3" />
          <SkeletonBox className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-1 h-60"><SkeletonBox className="w-full h-full" /></Card>
            <Card className="lg:col-span-1 h-60"><SkeletonBox className="w-full h-full" /></Card>
        </div>
        <Card className="h-60"><SkeletonBox className="w-full h-full" /></Card>
    </div>
);


const Dashboard: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loadedMcps, setLoadedMcps] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const stats = await getDashboardStats();
        const mcpServers = await getLoadedMcpServers();
        setLoadedMcps(mcpServers);

        setStatusData({
            mcpCount: stats.mcpCount,
            workflowCounts: stats.workflowCounts as Record<WorkflowStatus, number>,
            dbStats: stats.dbStats,
            vectorStats: stats.vectorStats,
        });
    } catch(e) {
        console.error("Failed to fetch dashboard data", e)
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };
  
  const StatCard: React.FC<{title: string, value: string | number, icon: React.ReactNode, tooltipText: string}> = ({ title, value, icon, tooltipText }) => (
    <div className="relative group">
      <Card>
        <div className="flex items-center">
          <div className="p-3 bg-slate-700/50 rounded-lg mr-4">
              {icon}
          </div>
          <div>
              <h3 className="text-lg font-semibold text-slate-400">{title}</h3>
              <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        </div>
      </Card>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltipText}
      </div>
    </div>
  );

  if (isLoading || !statusData) {
    return <DashboardSkeleton />;
  }

  const workflowStatusOrder: WorkflowStatus[] = ['Live', 'Test', 'Hold'];
  const totalRows = Object.values(statusData.dbStats.tableCounts).reduce((sum: number, count: number) => sum + count, 0);
  const statusColors: Record<WorkflowStatus, { text: string; dot: string; }> = {
    Live: { text: 'text-green-400', dot: 'bg-green-500' },
    Test: { text: 'text-blue-400', dot: 'bg-blue-500' },
    Hold: { text: 'text-yellow-400', dot: 'bg-yellow-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Hub Status Board</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10.5M20 20l-1.5-1.5A9 9 0 003.5 13.5" /></svg>
          {isLoading ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active MCPs" value={statusData.mcpCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>} tooltipText="Number of custom MCPs connected to the data lake." />
        <StatCard title="Live Workflows" value={statusData.workflowCounts.Live || 0} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>} tooltipText="Data pipelines currently in a 'Live' operational state." />
        <StatCard title="DB Tables" value={Object.keys(statusData.dbStats.tableCounts).length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" /></svg>} tooltipText="Total number of tables in the SQL data warehouse." />
        <StatCard title="Indexed Docs" value={statusData.vectorStats.documentCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} tooltipText="Documents indexed in the vector store for AI search." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-semibold text-white mb-4">Workflow Status</h3>
          <div className="space-y-4">
            {workflowStatusOrder.map(status => (
                <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-3 ${statusColors[status].dot}`}></span>
                        <span className={`font-semibold ${statusColors[status].text}`}>{status}</span>
                    </div>
                    <span className="font-mono text-xl text-white">{statusData.workflowCounts[status] || 0}</span>
                </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-semibold text-white mb-4">Data Store Health</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Total SQL DB Size</span>
                    <span className="font-mono text-xl text-white">{(statusData.dbStats.dbSizeBytes / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Total SQL Rows</span>
                    <span className="font-mono text-xl text-white">{totalRows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-slate-700/50">
                    <span className="text-slate-400">Vector Indexed Documents</span>
                    <span className="font-mono text-xl text-white">{statusData.vectorStats.documentCount}</span>
                </div>
            </div>
        </Card>
      </div>
      
       <Card>
          <h3 className="text-xl font-semibold text-white mb-4">MCP Connections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadedMcps.map(server => (
                <div key={server.id} className="p-3 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        <p className="font-semibold text-slate-200">{server.name}</p>
                    </div>
                    <p className="text-xs text-cyan-400 font-mono truncate" title={server.url}>{server.url}</p>
                </div>
            ))}
          </div>
        </Card>
    </div>
  );
};

export default Dashboard;
