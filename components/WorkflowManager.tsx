
import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import type { Workflow, WorkflowStatus } from '../types';
import { executeWorkflow, getWorkflows, saveWorkflow, deleteWorkflow as apiDeleteWorkflow } from '../services/api';

const statusColors: Record<WorkflowStatus, { bg: string; text: string; dot: string; border: string; }> = {
  Live: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500', border: 'border-green-500/50' },
  Test: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500', border: 'border-blue-500/50' },
  Hold: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500', border: 'border-yellow-500/50' },
};
const STATUSES: WorkflowStatus[] = ['Live', 'Test', 'Hold'];

const SOURCES = ["CRM: HubSpot/RubberTree", "P21: New Picklist", "P21: Work Order", "Customer Portal: Repair Request", "Teams/Email: Customer Issue", "Kafka Topic: new_orders", "Data Lake: p21_sales_orders", "S3 Bucket: raw-logs"];
const TRANSFORMERS = ["Power Automate: Qualify Lead", "Shop Floor System: Assign & Track", "MES: Track Production Steps", "Service Module: Track Repair Status", "CI Tool: Log & Analyze", "Spark Job: process_order_data.py", "Spark Job: aggregate_sales.py", "None"];
const DESTINATIONS = ["P21: Sales Order", "P21: Inventory Update", "P21: Finished Goods Inventory", "P21: Service Order & Billing", "P21/POR: Credit Memo or Follow-up", "Data Lake: p21_sales_orders", "Data Lake: daily_sales_metrics", "Redshift Table: dim_products"];

const WorkflowEditor: React.FC<{ workflow: Partial<Workflow>, onSave: (wf: Workflow) => void, onCancel: () => void }> = ({ workflow, onSave, onCancel }) => {
    const [editedWorkflow, setEditedWorkflow] = useState<Partial<Workflow>>(workflow);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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

const KanbanCard: React.FC<{ workflow: Workflow; onDragStart: (workflow: Workflow) => void, onEdit: (workflow: Workflow) => void, onRun: (workflow: Workflow) => void, isRunning: boolean }> = ({ workflow, onDragStart, onEdit, onRun, isRunning }) => {
  const statusStyle = statusColors[workflow.status];
  
  return (
    <Card 
      className="p-4 mb-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={() => onDragStart(workflow)}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-white mb-2">{workflow.name}</h4>
      </div>
      <div className="text-xs text-slate-400 space-y-2">
        <p><span className="font-semibold">Source:</span> {workflow.source}</p>
        <p><span className="font-semibold">Dest:</span> {workflow.destination}</p>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
         <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${statusStyle.dot}`}></span>
          {workflow.status}
        </div>
        <p className="text-xs text-slate-500">Last run: {workflow.lastExecuted}</p>
      </div>
       <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
            <button onClick={() => onRun(workflow)} disabled={isRunning} className="flex-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-xs rounded font-semibold disabled:bg-slate-600">Run</button>
            <button onClick={() => onEdit(workflow)} disabled={isRunning} className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded font-semibold disabled:bg-slate-600">Edit</button>
        </div>
    </Card>
  );
};

const WorkflowManager: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [mode, setMode] = useState<'list' | 'kanban' | 'edit' | 'create'>('list');
    const [activeWorkflow, setActiveWorkflow] = useState<Partial<Workflow> | null>(null);
    const [runningWorkflow, setRunningWorkflow] = useState<Workflow | null>(null);
    const [executionLogs, setExecutionLogs] = useState<string[]>([]);
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);
    const [draggedItem, setDraggedItem] = useState<Workflow | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<WorkflowStatus | null>(null);

    useEffect(() => {
        getWorkflows().then(setWorkflows);
    }, []);

    const handleCreate = () => {
        setActiveWorkflow({ name: '', status: 'Test', source: SOURCES[0], transformer: TRANSFORMERS[0], destination: DESTINATIONS[0], trigger: 'On demand', repartition: 8});
        setMode('create');
    };

    const handleEdit = (workflow: Workflow) => {
        setActiveWorkflow(JSON.parse(JSON.stringify(workflow)));
        setMode('edit');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this workflow?')) {
            await apiDeleteWorkflow(id);
            setWorkflows(workflows.filter(wf => wf.id !== id));
        }
    };

    const handleSave = async (workflowToSave: Workflow) => {
        let updatedWorkflows;
        if (workflowToSave.id) {
            updatedWorkflows = workflows.map(wf => wf.id === workflowToSave.id ? workflowToSave : wf);
        } else {
            const newWorkflow = { ...workflowToSave, id: `wf-${Date.now()}`, lastExecuted: 'Never' };
            workflowToSave = newWorkflow; // update to save the one with ID
            updatedWorkflows = [...workflows, newWorkflow];
        }
        setWorkflows(updatedWorkflows);
        await saveWorkflow(workflowToSave);

        setMode(mode === 'kanban' || mode === 'list' ? mode : 'list');
        setActiveWorkflow(null);
    };

    const handleCancel = () => {
        setMode(mode === 'kanban' || mode === 'list' ? mode : 'list');
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
            const updatedWorkflow = { ...workflowToRun, lastExecuted: updatedTime };
            await saveWorkflow(updatedWorkflow);
            setWorkflows(prev => prev.map(wf => wf.id === workflowToRun.id ? updatedWorkflow : wf));
        }
        setIsPipelineRunning(false);
    };

    const handleDragStart = (workflow: Workflow) => setDraggedItem(workflow);
    
    const handleDrop = async (targetStatus: WorkflowStatus) => {
        if (!draggedItem) return;
        const updatedWorkflow = { ...draggedItem, status: targetStatus };
        setWorkflows(workflows.map(p => p.id === draggedItem.id ? updatedWorkflow : p));
        await saveWorkflow(updatedWorkflow);
        setDraggedItem(null);
        setDragOverStatus(null);
    };
    
    const handleDragEnter = (status: WorkflowStatus) => {
        if (draggedItem && draggedItem.status !== status) setDragOverStatus(status);
    };
    
    const handleDragLeave = () => setDragOverStatus(null);
    
    const renderContent = () => {
        if (mode === 'edit' || mode === 'create') {
            return <WorkflowEditor workflow={activeWorkflow!} onSave={handleSave} onCancel={handleCancel} />;
        }

        if (mode === 'kanban') {
            return (
                <div className="flex-grow flex gap-6">
                    {STATUSES.map(status => (
                        <div
                            key={status}
                            className={`flex-1 bg-slate-900/50 rounded-lg p-4 transition-colors duration-200 ${dragOverStatus === status ? 'bg-slate-700/50' : ''}`}
                            onDragEnter={(e) => { e.preventDefault(); handleDragEnter(status); }}
                            onDragOver={(e) => e.preventDefault()}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
                        >
                            <h3 className={`text-lg font-bold text-white mb-4 pb-2 border-b-2 ${statusColors[status].border}`}>{status} ({workflows.filter(p => p.status === status).length})</h3>
                            <div className="space-y-4 overflow-y-auto h-[calc(100vh-300px)] pr-2">
                               {workflows.filter(p => p.status === status).map(p => <KanbanCard key={p.id} workflow={p} onDragStart={handleDragStart} onEdit={handleEdit} onRun={handleRunWorkflow} isRunning={isPipelineRunning} />)}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {workflows.map(wf => (
                    <Card key={wf.id}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                            <div className="md:col-span-1">
                                <h2 className="text-xl font-bold text-white">{wf.name}</h2>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusColors[wf.status].bg} ${statusColors[wf.status].text}`}>
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
        );
    };

    const isListView = mode !== 'edit' && mode !== 'create';

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Workflow Manager</h1>
                <div className="flex items-center gap-4">
                     {isListView && (
                        <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                            <button onClick={() => setMode('list')} className={`px-3 py-1 text-sm rounded-md ${mode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>List</button>
                            <button onClick={() => setMode('kanban')} className={`px-3 py-1 text-sm rounded-md ${mode === 'kanban' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Kanban</button>
                        </div>
                     )}
                    <button onClick={handleCreate} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                        Create New Workflow
                    </button>
                </div>
            </div>

            {renderContent()}

            {runningWorkflow && <ExecutionLogModal workflow={runningWorkflow} onClose={() => setRunningWorkflow(null)} logs={executionLogs} isRunning={isPipelineRunning} />}
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
}

export default WorkflowManager;
