import React, { useState } from 'react';
import Card from './Card';

// Define types for our diagram components
interface DiagramNode {
  id: string;
  title: string;
  // FIX: Changed JSX.Element to React.ReactNode to resolve namespace issue.
  icon: React.ReactNode;
  description: string;
}

interface Hotspot {
  id: string;
  title: string;
  description: string;
  top: string;
  left: string;
}

// SVG Icons for diagram nodes
const icons = {
  database: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>,
  api: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  files: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
  stream: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  ai: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-cyan-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m1.5-4.5V21m6-18v1.5m3.75-1.5v1.5m3.75 1.5v1.5m0 3.75v1.5m0 3.75v1.5m0 3.75v1.5M12 3v1.5m0 3.75v1.5m0 3.75v1.5m0 3.75v1.5" /></svg>,
};

// Data for the diagram
const sources: DiagramNode[] = [
  { id: 'db', title: 'Databases', icon: icons.database, description: 'Structured data from transactional systems like ERP, CRM, etc.' },
  { id: 'apis', title: 'External APIs', icon: icons.api, description: 'Data from third-party services and partners.' },
  { id: 'files', title: 'File Systems', icon: icons.files, description: 'Unstructured or semi-structured data like logs, CSVs, and images.' },
  { id: 'streams', title: 'Event Streams', icon: icons.stream, description: 'Real-time data from IoT devices, applications, and message queues.' },
];

const consumption: DiagramNode[] = [
    { id: 'dashboard', title: 'App Dashboard', icon: icons.dashboard, description: 'Real-time monitoring of application performance, usage, and data sources.' },
    { id: 'bi', title: 'BI & Reporting', icon: icons.dashboard, description: 'Interactive dashboards and reports for business users.' },
    { id: 'explorer', title: 'Data Exploration', icon: icons.database, description: 'Ad-hoc querying and analysis by data analysts and scientists.' },
    { id: 'ai', title: 'AI Analyst', icon: icons.ai, description: 'Natural language querying and automated insights powered by Gemini.' },
];

const toolHotspots: Hotspot[] = [
  { id: 'workflow-builder', title: 'Workflow Builder', description: 'The Workflow Builder is used to design, schedule, and monitor the data pipelines that move and transform data from the sources into the various storage zones of the data lake.', top: '50%', left: '37.5%' },
  { id: 'schema-explorer', title: 'Schema Explorer', description: 'The Schema Explorer provides a user-friendly interface to browse, search, and manage the technical metadata stored in the Data Catalog. It is the central source of truth for all data assets in the lake.', top: '80%', left: '62.5%' },
  { id: 'dashboard-builder', title: 'Dashboard Builder', description: 'The Dashboard Builder allows users to create custom visualizations and dashboards by connecting directly to the Curated Zone. It empowers business users to perform self-service analytics.', top: '35%', left: '87.5%' },
  { id: 'dl-maintenance', title: 'DL Maintenance', description: 'DL Maintenance tools interact with all layers of the data lake to ensure data quality, manage partitioning strategies, handle data lifecycle policies, and perform optimizations for cost and performance.', top: '5%', left: '62.5%' },
  { id: 'dl-controls', title: 'DL Controls', description: 'The Data Lake Controls console provides centralized control over the entire platform, including user access, security policies, cost management, and auditing across all architectural components.', top: '95%', left: '50%' },
];

// Reusable component for diagram nodes
const DiagramCard: React.FC<{ title: string; children?: React.ReactNode; className?: string; }> = ({ title, children, className }) => (
  <div className={`bg-slate-800/70 border border-slate-700/80 rounded-lg p-4 text-center ${className}`}>
    <h3 className="text-lg font-bold text-cyan-400 mb-2">{title}</h3>
    {children}
  </div>
);

const Node: React.FC<{ node: DiagramNode }> = ({ node }) => (
    <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer" title={node.description}>
        {node.icon}
        <h4 className="font-semibold text-slate-300 text-sm">{node.title}</h4>
    </div>
);

const Architecture: React.FC = () => {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white">Interactive Data Flow Architecture</h1>
      <p className="text-slate-400">
        This diagram illustrates the flow of data through the internal corporate data lake. Click on the pulsating dots to learn how this application's functions map to the architecture.
      </p>
      
      <div className="flex-grow p-4 md:p-8 rounded-lg bg-slate-900/30 border border-slate-700/50 relative overflow-x-auto">
        {/* Main container for the diagram */}
        <div className="flex items-center justify-between min-w-[1000px] h-full relative">

            {/* Stage 1: Data Sources */}
            <DiagramCard title="Data Sources" className="w-1/5 h-full !flex flex-col justify-around">
                <div className="space-y-3">
                    {sources.map(s => <Node key={s.id} node={s} />)}
                </div>
            </DiagramCard>

            <Arrow />

            {/* Stage 2: Processing */}
            <DiagramCard title="Processing" className="w-1/5 h-3/4">
                 <div className="flex items-center justify-center h-full text-slate-300">
                    <p>Ingestion & ETL/ELT Pipelines</p>
                </div>
            </DiagramCard>
            
            <Arrow />
            
            {/* Stage 3: Storage */}
            <DiagramCard title="Data Lake Storage" className="w-1/5 h-full !flex flex-col justify-around">
                <div className="space-y-3 text-slate-300">
                    <div className="p-3 border border-dashed border-slate-600 rounded-lg">Raw Zone</div>
                    <div className="p-3 border border-dashed border-slate-600 rounded-lg">Processed Zone</div>
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300">Data Catalog</div>
                </div>
            </DiagramCard>

            <Arrow />

            {/* Stage 4: Consumption */}
            <DiagramCard title="Consumption" className="w-1/5 h-full !flex flex-col justify-around">
                <div className="space-y-3">
                    {consumption.map(c => <Node key={c.id} node={c} />)}
                </div>
            </DiagramCard>

            {/* Overlay Hotspots */}
            {toolHotspots.map(spot => (
                <div
                key={spot.id}
                className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ top: spot.top, left: spot.left }}
                onClick={() => setActiveHotspot(spot)}
                title={spot.title}
                >
                <div className="w-full h-full rounded-full bg-cyan-400 animate-ping absolute"></div>
                <div className="w-full h-full rounded-full bg-cyan-400 border-2 border-slate-900"></div>
                </div>
            ))}
        </div>
      </div>

      {/* Modal for Hotspot Info */}
      {activeHotspot && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setActiveHotspot(null)}
        >
          <Card 
            className="max-w-2xl w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">{activeHotspot.title}</h2>
                <button onClick={() => setActiveHotspot(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <p className="text-slate-300">{activeHotspot.description}</p>
          </Card>
        </div>
      )}
    </div>
  );
};

const Arrow: React.FC = () => (
    <div className="text-slate-600 w-16">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
        </svg>
    </div>
);

export default Architecture;
