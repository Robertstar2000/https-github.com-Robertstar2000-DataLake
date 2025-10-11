
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Architecture from './components/Architecture';
import DataExplorer from './components/DataExplorer';
import AIAnalyst from './components/AIAnalyst';
import SchemaExplorer from './components/SchemaExplorer';
import DashboardBuilder from './components/DashboardBuilder';
import WorkflowManager from './components/WorkflowManager';
import DlControls from './components/DlControls';
import DbMaintenance from './components/DbMaintenance';
import McpProtocol from './components/McpProtocol';
import IoManagement from './components/IoManagement';
import { initializeDatabase } from './services/api';
import HelpModal from './components/HelpModal';

export type View = 'dashboard' | 'architecture' | 'explorer' | 'ai-analyst' | 'schema-explorer' | 'dashboard-builder' | 'workflow-builder' | 'dl-controls' | 'db-maintenance' | 'mcp-protocol' | 'io-management';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
        return <Dashboard setCurrentView={setCurrentView} />;
      case 'architecture':
        return <Architecture setCurrentView={setCurrentView} />;
      case 'explorer':
        return <DataExplorer />;
      case 'ai-analyst':
        return <AIAnalyst />;
      case 'schema-explorer':
        return <SchemaExplorer />;
      case 'dashboard-builder':
        return <DashboardBuilder />;
      case 'workflow-builder':
        return <WorkflowManager />;
      case 'dl-controls':
        return <DlControls />;
      case 'db-maintenance':
        return <DbMaintenance />;
      case 'mcp-protocol':
        return <McpProtocol />;
      case 'io-management':
        return <IoManagement />;
      default:
        return <Dashboard setCurrentView={setCurrentView} />;
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

      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 transition-all duration-200 transform hover:scale-110 z-40"
        aria-label="Open help guide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <HelpModal show={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
