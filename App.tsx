
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Architecture from './components/Architecture';
import DataExplorer from './components/DataExplorer';
import AIAnalyst from './components/AIAnalyst';
import SchemaExplorer from './components/SchemaExplorer';
import DashboardBuilder from './components/DashboardBuilder';
import WorkflowBuilder from './components/WorkflowBuilder';
import DlControls from './components/DlControls';
import DbMaintenance from './components/DbMaintenance';
import PipelineManagement from './components/PipelineManagement';
import McpProtocol from './components/McpProtocol';
import { initializeDatabase } from './services/db';

export type View = 'dashboard' | 'architecture' | 'explorer' | 'ai-analyst' | 'schema-explorer' | 'dashboard-builder' | 'workflow-builder' | 'dl-controls' | 'db-maintenance' | 'pipeline-management' | 'mcp-protocol';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setDbError("Could not load the database. Some features might not work correctly.");
      } finally {
        setIsDbLoading(false);
      }
    };
    init();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'architecture':
        return <Architecture />;
      case 'explorer':
        return <DataExplorer />;
      case 'ai-analyst':
        return <AIAnalyst />;
      case 'schema-explorer':
        return <SchemaExplorer />;
      case 'dashboard-builder':
        return <DashboardBuilder />;
      case 'workflow-builder':
        return <WorkflowBuilder />;
      case 'dl-controls':
        return <DlControls />;
      case 'db-maintenance':
        return <DbMaintenance />;
      case 'pipeline-management':
        return <PipelineManagement />;
      case 'mcp-protocol':
        return <McpProtocol />;
      default:
        return <Dashboard />;
    }
  };

  if (isDbLoading) {
    return (
      <div className="flex h-screen bg-slate-900 text-slate-200 items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-cyan-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl mt-4">Initializing Data Lake...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
     return (
      <div className="flex h-screen bg-slate-900 text-slate-200 items-center justify-center">
        <div className="text-center max-w-md p-8 bg-slate-800 rounded-lg">
           <h2 className="text-2xl font-bold text-red-400 mb-4">Initialization Failed</h2>
          <p className="text-slate-300">{dbError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;