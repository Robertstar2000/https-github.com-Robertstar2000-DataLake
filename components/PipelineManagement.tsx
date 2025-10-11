import React, { useState } from 'react';
import Card from './Card';
import { initialPipelines } from '../data/pipelines';
import type { Pipeline, PipelineStage, PipelineStatus } from '../types';

const STAGES: PipelineStage[] = ['Design', 'Testing', 'Production'];

const statusColors: Record<PipelineStatus, { bg: string; text: string; dot: string }> = {
  Healthy: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
  Failing: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  Paused: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
};

const stageColors: Record<PipelineStage, string> = {
    Design: 'border-purple-500/50',
    Testing: 'border-blue-500/50',
    Production: 'border-cyan-500/50',
}

// Sub-component for a single pipeline card
const PipelineCard: React.FC<{ pipeline: Pipeline; onDragStart: (pipeline: Pipeline) => void, onEdit: (pipeline: Pipeline) => void }> = ({ pipeline, onDragStart, onEdit }) => {
  const statusStyle = statusColors[pipeline.status];
  
  return (
    <Card 
      className="p-4 mb-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={() => onDragStart(pipeline)}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-white mb-2">{pipeline.name}</h4>
        <button onClick={() => onEdit(pipeline)} className="text-xs text-slate-400 hover:text-white">Edit</button>
      </div>
      <div className="text-xs text-slate-400 space-y-2">
        <p><span className="font-semibold">Source:</span> {pipeline.source}</p>
        <p><span className="font-semibold">Dest:</span> {pipeline.destination}</p>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/50">
         <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${statusStyle.dot}`}></span>
          {pipeline.status}
        </div>
        <p className="text-xs text-slate-500">Last run: {pipeline.lastRun}</p>
      </div>
    </Card>
  );
};

// Sub-component for a single column in the Kanban board
const PipelineColumn: React.FC<{
  stage: PipelineStage;
  pipelines: Pipeline[];
  isDragOver: boolean;
  onDragEnter: (stage: PipelineStage) => void;
  onDragLeave: () => void;
  onDrop: (stage: PipelineStage) => void;
  children: React.ReactNode;
}> = ({ stage, pipelines, isDragOver, onDragEnter, onDragLeave, onDrop, children }) => {
  return (
    <div
      className={`flex-1 bg-slate-900/50 rounded-lg p-4 transition-colors duration-200 ${isDragOver ? 'bg-slate-700/50' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); onDragEnter(stage); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(stage); }}
    >
      <h3 className={`text-lg font-bold text-white mb-4 pb-2 border-b-2 ${stageColors[stage]}`}>{stage} ({pipelines.length})</h3>
      <div className="space-y-4 overflow-y-auto h-[calc(100vh-250px)] pr-2">
        {children}
      </div>
    </div>
  );
};

const PipelineModal: React.FC<{ pipeline: Partial<Pipeline>, onSave: (p: Pipeline) => void, onCancel: () => void, onDelete?: (id: string) => void }> = ({ pipeline, onSave, onCancel, onDelete }) => {
    const [edited, setEdited] = useState(pipeline);
    const isNew = !pipeline.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(edited as Pipeline);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEdited({ ...edited, [e.target.name]: e.target.value });
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
            <Card className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">{isNew ? 'Create Pipeline' : 'Edit Pipeline'}</h2>
                    <div>
                        <label className="block text-slate-400 mb-1">Pipeline Name</label>
                        <input name="name" value={edited.name || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 mb-1">Source</label>
                            <input name="source" value={edited.source || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                         <div>
                            <label className="block text-slate-400 mb-1">Destination</label>
                            <input name="destination" value={edited.destination || ''} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 mb-1">Stage</label>
                            <select name="stage" value={edited.stage || 'Design'} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-slate-400 mb-1">Status</label>
                            <select name="status" value={edited.status || 'Paused'} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                                {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        <div className="space-x-2">
                             <button type="submit" className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">Save</button>
                             <button type="button" onClick={onCancel} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500">Cancel</button>
                        </div>
                         {!isNew && onDelete && (
                             <button type="button" onClick={() => onDelete(pipeline.id!)} className="bg-red-800/80 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-800">Delete</button>
                         )}
                    </div>
                </form>
            </Card>
        </div>
    )
}

// Main component for the page
const PipelineManagement: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>(initialPipelines);
  const [draggedItem, setDraggedItem] = useState<Pipeline | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Partial<Pipeline> | null>(null);

  const handleDragStart = (pipeline: Pipeline) => {
    setDraggedItem(pipeline);
  };
  
  const handleDrop = (targetStage: PipelineStage) => {
    if (!draggedItem) return;
    setPipelines(pipelines.map(p => 
      p.id === draggedItem.id ? { ...p, stage: targetStage } : p
    ));
    setDraggedItem(null);
    setDragOverStage(null);
  };
  
  const handleDragEnter = (stage: PipelineStage) => {
      if (draggedItem && draggedItem.stage !== stage) {
          setDragOverStage(stage);
      }
  };

  const handleDragLeave = () => {
      setDragOverStage(null);
  }

  const handleOpenModal = (pipeline: Partial<Pipeline> | null) => {
      setEditingPipeline(pipeline || { name: '', stage: 'Design', status: 'Paused', lastRun: 'N/A' });
      setIsModalOpen(true);
  }
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingPipeline(null);
  }

  const handleSavePipeline = (pipelineToSave: Pipeline) => {
    if (pipelineToSave.id) {
        // Update
        setPipelines(pipelines.map(p => p.id === pipelineToSave.id ? pipelineToSave : p));
    } else {
        // Create
        const newPipeline = { ...pipelineToSave, id: `pipe-${Date.now()}`};
        setPipelines([...pipelines, newPipeline]);
    }
    handleCloseModal();
  }
  
  const handleDeletePipeline = (id: string) => {
      if (window.confirm('Are you sure you want to delete this pipeline?')) {
          setPipelines(pipelines.filter(p => p.id !== id));
          handleCloseModal();
      }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Pipeline Management</h1>
            <button onClick={() => handleOpenModal(null)} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                + Create Pipeline
            </button>
        </div>
      <div className="flex-grow flex gap-6">
        {STAGES.map(stage => (
          <PipelineColumn
            key={stage}
            stage={stage}
            pipelines={pipelines.filter(p => p.stage === stage)}
            isDragOver={dragOverStage === stage}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {pipelines
              .filter(p => p.stage === stage)
              .map(p => <PipelineCard key={p.id} pipeline={p} onDragStart={handleDragStart} onEdit={() => handleOpenModal(p)} />)}
          </PipelineColumn>
        ))}
      </div>
      {isModalOpen && editingPipeline && (
          <PipelineModal 
            pipeline={editingPipeline}
            onSave={handleSavePipeline}
            onCancel={handleCloseModal}
            onDelete={handleDeletePipeline}
          />
      )}
    </div>
  );
};

export default PipelineManagement;
