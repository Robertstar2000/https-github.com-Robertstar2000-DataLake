import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import type { Workflow, WorkflowStatus } from '../types';
import { executeWorkflow } from '../services/pipelineService';


const initialWorkflows: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Ingest Customer Orders',
    lastExecuted: '2023-10-26 10:00:00 AM',
    status: 'Live',
    source: 'Kafka Topic: new_orders',
    transformer: 'Spark Job: process_order_data.py',
    destination: 'S3 Bucket: processed-orders-zone',
    repartition: 16,
    trigger: 'Runs every 1 hour',
  },
  {
    id: 'wf-2',
    name: 'Sync Product Catalog',
    lastExecuted: '2023-10-25 08:30:00 PM',
    status: 'Hold',
    source: 'API: external_product_service',
    transformer: 'Lambda: format_product_json',
    destination: 'Redshift Table: dim_products',
    repartition: 2,
    trigger: 'On demand',
  },
  {
    id: 'wf-3',
    name: 'Calculate Daily Sales Metrics',
    lastExecuted: '2023-10-26 01:15:00 AM',
    status: 'Test',
    source: 'S3 Bucket: processed-orders-zone',
    transformer: 'Spark Job: aggregate_sales.py',
    destination: 'S3 Bucket: curated-metrics-zone',
    repartition: 8,
    trigger: 'Runs daily at 1 AM',
  },
];

const statusColors: Record<WorkflowStatus, string> = {
  Live: 'bg-green-500/20 text-green-400 border-green-500/30',
  Hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Test: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// Mock data for form dropdowns
const SOURCES = ['Kafka Topic: new_orders', 'S3 Bucket: processed-orders-zone', 'API: external_product_service', 'S3 Bucket: raw-logs'];
const TRANSFORMERS = ['Spark Job: process_order_data.py', 'Lambda: format_product_json', 'Spark Job: aggregate_sales.py', 'None'];
const DESTINATIONS = ['S3 Bucket: processed-orders-zone', 'Redshift Table: dim_products', 'S3 Bucket: curated-metrics-zone'];
const STATUSES: WorkflowStatus[] = ['Live', 'Hold', 'Test'];


const WorkflowEditor: React.FC<{ workflow: Partial<Workflow>, onSave: (wf: Workflow) => void, onCancel: () => void }> = ({ workflow, onSave, onCancel }) => {
    const [editedWorkflow, setEditedWorkflow] = useState<Partial<Workflow>>(workflow);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add validation logic here if needed
        onSave(editedWorkflow as Workflow);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedWorkflow(prev => ({ ...prev, [name]: name === 'repartition' ? parseInt(value, 10) : value }));
    }

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-white">{workflow.id ? 'Edit Workflow' : 'Create New Workflow'}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-slate-400 mb-1">Workflow Name</label>
                        <input name="name" value={editedWorkflow.name || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                     <div>
                        <label className="block text-slate-400 mb-1">Status</label>
                        <select name="status" value={editedWorkflow.status || 'Test'} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t border-slate-700/50 pt-6 space-y-4">
                     <h3 className="text-lg font-semibold text-cyan-400">Pipeline</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
                         <div>
                            <label className="block text-slate-400 mb-1">Source</label>
                            <select name="source" value={editedWorkflow.source || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <div className="text-slate-500 font-bold text-2xl hidden md:block">→</div>
                         <div>
                            <label className="block text-slate-400 mb-1">Transformer</label>
                            <select name="transformer" value={editedWorkflow.transformer || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                                 {TRANSFORMERS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                         </div>
                         <div className="text-slate-500 font-bold text-2xl hidden md:block">→</div>
                         <div>
                            <label className="block text-slate-400 mb-1">Destination</label>
                            <select name="destination" value={editedWorkflow.destination || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                                 {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                         </div>
                     </div>
                </div>
                
                 <div className="border-t border-slate-700/50 pt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-cyan-400">Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-400 mb-1">Trigger / Schedule</label>
                            <input name="trigger" value={editedWorkflow.trigger || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-slate-400 mb-1">Repartition Partitions</label>
                            <input type="number" name="repartition" min="1" value={editedWorkflow.repartition || 2} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="bg-slate-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-slate-500 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors">
                        Save Workflow
                    </button>
                </div>
            </form>
        </Card>
    );
};

const ExecutionLogModal: React.FC<{ workflow: Workflow, onClose: () => void, logs: string[], isRunning: boolean }> = ({ workflow, onClose, logs, isRunning }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={!isRunning ? onClose : undefined}>
            <Card className="max-w-2xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-2">{isRunning ? 'Executing' : 'Execution Log'}: {workflow.name}</h2>
                <p className="text-slate-400 mb-4">This is the real-time log output from the pipeline execution.</p>
                <div ref={logContainerRef} className="h-64 bg-slate-900/50 p-3 rounded-lg overflow-y-auto font-mono text-sm text-slate-300 flex-grow">
                    {logs.map((log, i) => <p key={i} className="animate-fade-in">{log}</p>)}
                    {isRunning && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-2"></div>}
                </div>
                <button onClick={onClose} disabled={isRunning} className="mt-4 w-full bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed">
                    {isRunning ? 'Running...' : 'Close'}
                </button>
            </Card>
        </div>
    );
};

const WorkflowBuilder: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
    const [mode, setMode] = useState<'list' | 'edit' | 'create'>('list');
    const [activeWorkflow, setActiveWorkflow] = useState<Partial<Workflow> | null>(null);
    const [runningWorkflow, setRunningWorkflow] = useState<Workflow | null>(null);
    const [executionLogs, setExecutionLogs] = useState<string[]>([]);
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);

    const handleCreate = () => {
        setActiveWorkflow({ name: '', status: 'Test', source: SOURCES[0], transformer: TRANSFORMERS[0], destination: DESTINATIONS[0], trigger: 'On demand', repartition: 8});
        setMode('create');
    };

    const handleEdit = (workflow: Workflow) => {
        setActiveWorkflow(JSON.parse(JSON.stringify(workflow)));
        setMode('edit');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this workflow?')) {
            setWorkflows(workflows.filter(wf => wf.id !== id));
        }
    };

    const handleSave = (workflowToSave: Workflow) => {
        if (workflowToSave.id) {
            setWorkflows(workflows.map(wf => wf.id === workflowToSave.id ? workflowToSave : wf));
        } else {
            const newWorkflow = { ...workflowToSave, id: `wf-${Date.now()}`, lastExecuted: 'Never' };
            setWorkflows([...workflows, newWorkflow]);
        }
        setMode('list');
        setActiveWorkflow(null);
    };

    const handleCancel = () => {
        setMode('list');
        setActiveWorkflow(null);
    };

    const handleRunWorkflow = async (workflowToRun: Workflow) => {
        setRunningWorkflow(workflowToRun);
        setExecutionLogs([]);
        setIsPipelineRunning(true);

        const logCallback = (message: string) => {
            setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
        };

        const success = await executeWorkflow(workflowToRun, logCallback);

        if (success) {
            const updatedTime = new Date().toLocaleString('en-CA', { hour12: false }).replace(',', '');
            setWorkflows(prev => prev.map(wf => wf.id === workflowToRun.id ? { ...wf, lastExecuted: updatedTime } : wf));
        }
        setIsPipelineRunning(false);
    };

    const renderContent = () => {
        if (mode === 'edit' || mode === 'create') {
            return <WorkflowEditor workflow={activeWorkflow!} onSave={handleSave} onCancel={handleCancel} />;
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Workflow Builder</h1>
                    <button onClick={handleCreate} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                        Create New Workflow
                    </button>
                </div>
                <div className="space-y-4">
                    {workflows.map(wf => (
                        <Card key={wf.id}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-1">
                                    <h2 className="text-xl font-bold text-white">{wf.name}</h2>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusColors[wf.status]}`}>
                                        {wf.status}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-2">Last run: {wf.lastExecuted}</p>
                                </div>
                                <div className="md:col-span-2">
                                     <div className="flex flex-col space-y-2 text-sm">
                                        <div className="flex items-center"><span className="font-semibold text-slate-400 w-24">Source:</span> <span className="font-mono text-slate-300">{wf.source}</span></div>
                                        <div className="flex items-center"><span className="font-semibold text-slate-400 w-24">Transformer:</span> <span className="font-mono text-slate-300">{wf.transformer}</span></div>
                                        <div className="flex items-center"><span className="font-semibold text-slate-400 w-24">Destination:</span> <span className="font-mono text-slate-300">{wf.destination}</span></div>
                                     </div>
                                </div>
                                <div className="md:col-span-1 flex md:flex-col md:items-end gap-2">
                                    <button onClick={() => handleRunWorkflow(wf)} disabled={isPipelineRunning} className="w-full md:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-sm rounded-lg font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        Run
                                    </button>
                                    <button onClick={() => handleEdit(wf)} disabled={isPipelineRunning} className="w-full md:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(wf.id)} disabled={isPipelineRunning} className="w-full md:w-auto px-4 py-2 bg-red-800/80 hover:bg-red-800 text-sm rounded-lg font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {renderContent()}
            {runningWorkflow && <ExecutionLogModal workflow={runningWorkflow} onClose={() => setRunningWorkflow(null)} logs={executionLogs} isRunning={isPipelineRunning} />}
             <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default WorkflowBuilder;