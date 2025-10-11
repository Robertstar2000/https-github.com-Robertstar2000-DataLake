
import React, { useState, useEffect, useRef } from 'react';
import Card from './Card';
import type { Dashboard, WidgetConfig, ChartType } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { executeQuery } from '../services/db';

const LOCAL_STORAGE_KEY = 'app_dashboards';

const initialDashboards: Dashboard[] = [
    {
        id: 'sales-overview-1',
        name: 'Sales Overview',
        description: 'A high-level look at sales performance and key metrics.',
        widgets: [
            { id: 'w1', title: 'Total Revenue', type: 'Metric', colSpan: 1, dataKey: 'totalRevenue' },
            { id: 'w2', title: 'Total Orders', type: 'Metric', colSpan: 1, dataKey: 'totalOrders' },
            { id: 'w3', title: 'Unique Customers', type: 'Metric', colSpan: 1, dataKey: 'uniqueCustomers' },
            { id: 'w4', title: 'Avg. Order Value', type: 'Metric', colSpan: 1, dataKey: 'avgOrderValue' },
            { id: 'w5', title: 'Revenue by Product', type: 'Bar', colSpan: 4, dataKey: 'revenueByProduct' },
            { id: 'w6', title: 'Orders Over Time', type: 'Line', colSpan: 2, dataKey: 'ordersOverTime' },
            { id: 'w7', title: 'Top Product Revenue (Pie)', type: 'Pie', colSpan: 2, dataKey: 'revenueByProduct' },
        ]
    }
];

const DATA_SOURCES: Record<string, { name: string; compatible: ChartType[] }> = {
    totalRevenue: { name: 'Total Revenue', compatible: ['Metric'] },
    totalOrders: { name: 'Total Orders', compatible: ['Metric'] },
    uniqueCustomers: { name: 'Unique Customers', compatible: ['Metric'] },
    avgOrderValue: { name: 'Avg. Order Value', compatible: ['Metric'] },
    revenueByProduct: { name: 'Revenue by Product', compatible: ['Bar', 'Pie'] },
    ordersOverTime: { name: 'Orders Over Time', compatible: ['Line', 'Bar'] },
};
const CHART_TYPES: ChartType[] = ['Metric', 'Bar', 'Line', 'Pie'];
const COLORS = ['#06b6d4', '#818cf8', '#f87171', '#fbbf24', '#a3e635', '#f472b6'];

// A single widget component with edit mode controls
const Widget: React.FC<{ 
    config: WidgetConfig, 
    data: any,
    isEditing: boolean,
    onRemove: () => void,
    onUpdate: (newConfig: Partial<WidgetConfig>) => void
}> = ({ config, data, isEditing, onRemove, onUpdate }) => {

    const renderContent = () => {
        if (!data) return <div className="text-slate-400">Loading data...</div>;
        
        switch (config.type) {
            case 'Metric':
                return <div className="text-4xl lg:text-5xl font-bold text-white text-center">{data}</div>;
            case 'Bar':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} interval={0} tick={{ transform: 'translate(0, 5)' }} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Bar dataKey="value" fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'Line':
                return (
                     <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                );
             case 'Pie':
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                             <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                 {data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                             <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                             <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default: return null;
        }
    };

    return (
        <Card className="flex flex-col relative group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                {isEditing && (
                    <div className="flex items-center gap-2">
                        <select 
                            value={config.colSpan}
                            onChange={(e) => onUpdate({ colSpan: parseInt(e.target.value, 10) as WidgetConfig['colSpan']})}
                            className="bg-slate-700 text-xs rounded border border-slate-600 focus:ring-cyan-500 focus:outline-none"
                        >
                            <option value={1}>1 col</option>
                            <option value={2}>2 col</option>
                            <option value={3}>3 col</option>
                            <option value={4}>4 col</option>
                        </select>
                        <button onClick={onRemove} className="w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center hover:bg-red-500">&times;</button>
                    </div>
                )}
            </div>
            <div className="flex-grow flex items-center justify-center">{renderContent()}</div>
        </Card>
    );
};


const DashboardBuilder: React.FC = () => {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
    const [processedData, setProcessedData] = useState<any>(null);
    const draggedWidgetId = useRef<string | null>(null);

    useEffect(() => {
        try {
            const savedDashboards = localStorage.getItem(LOCAL_STORAGE_KEY);
            const loadedDashboards = savedDashboards ? JSON.parse(savedDashboards) : initialDashboards;
            setDashboards(loadedDashboards);
            if (loadedDashboards.length > 0) {
                setActiveDashboardId(loadedDashboards[0].id);
            }
        } catch (error) {
            console.error("Failed to load dashboards:", error);
            setDashboards(initialDashboards);
            setActiveDashboardId(initialDashboards[0]?.id || null);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dashboards));
        } catch (error) {
            console.error("Failed to save dashboards:", error);
        }
    }, [dashboards]);
    
    useEffect(() => {
        const fetchData = () => {
            const totalRevenueResult = executeQuery('SELECT SUM(p.price * o.quantity) as total FROM orders o JOIN products p ON o.product_id = p.product_id');
            const totalOrdersResult = executeQuery('SELECT COUNT(*) as count FROM orders');
            const uniqueCustomersResult = executeQuery('SELECT COUNT(DISTINCT customer_id) as count FROM customers');
            const revenueByProductResult = executeQuery(`SELECT p.product_name as name, SUM(p.price * o.quantity) as value FROM orders o JOIN products p ON o.product_id = p.product_id GROUP BY p.product_name ORDER BY value DESC`);
            const ordersOverTimeResult = executeQuery(`SELECT order_date as name, COUNT(order_id) as value FROM orders GROUP BY order_date ORDER BY order_date`);
            const totalRevenue = totalRevenueResult.data[0]?.total || 0;
            const totalOrders = totalOrdersResult.data[0]?.count || 0;

            setProcessedData({
                totalRevenue: `$${totalRevenue.toLocaleString()}`,
                totalOrders,
                uniqueCustomers: uniqueCustomersResult.data[0]?.count || 0,
                avgOrderValue: totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : '$0.00',
                revenueByProduct: revenueByProductResult.data,
                ordersOverTime: ordersOverTimeResult.data,
            });
        };
        fetchData();
    }, []);

    const activeDashboard = dashboards.find(d => d.id === activeDashboardId);
    
    const updateActiveDashboard = (updatedDashboard: Dashboard) => {
        setDashboards(dashboards.map(d => d.id === updatedDashboard.id ? updatedDashboard : d));
    }

    const handleAddDashboard = () => {
        const name = prompt("Enter new dashboard name:", "New Dashboard");
        if(name) {
            const newDashboard: Dashboard = {
                id: `db-${Date.now()}`,
                name,
                description: 'A new dashboard.',
                widgets: []
            };
            setDashboards([...dashboards, newDashboard]);
            setActiveDashboardId(newDashboard.id);
            setIsEditing(true);
        }
    }
    
    const handleDeleteDashboard = () => {
        if (!activeDashboard || !window.confirm(`Are you sure you want to delete "${activeDashboard.name}"?`)) return;
        const newDashboards = dashboards.filter(d => d.id !== activeDashboard.id);
        setDashboards(newDashboards);
        setActiveDashboardId(newDashboards[0]?.id || null);
        setIsEditing(false);
    }

    const handleAddWidget = (config: Omit<WidgetConfig, 'id'>) => {
        if (!activeDashboard) return;
        const newWidget: WidgetConfig = { ...config, id: `w-${Date.now()}` };
        updateActiveDashboard({ ...activeDashboard, widgets: [...activeDashboard.widgets, newWidget] });
        setIsWidgetModalOpen(false);
    }
    
    const handleRemoveWidget = (widgetId: string) => {
        if (!activeDashboard) return;
        updateActiveDashboard({ ...activeDashboard, widgets: activeDashboard.widgets.filter(w => w.id !== widgetId) });
    }

    const handleUpdateWidget = (widgetId: string, newConfig: Partial<WidgetConfig>) => {
        if (!activeDashboard) return;
        const updatedWidgets = activeDashboard.widgets.map(w => w.id === widgetId ? {...w, ...newConfig} : w);
        updateActiveDashboard({ ...activeDashboard, widgets: updatedWidgets });
    }

    const handleDragStart = (e: React.DragEvent, widgetId: string) => {
        draggedWidgetId.current = widgetId;
        e.dataTransfer.effectAllowed = 'move';
    }

    const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
        e.preventDefault();
        if (!activeDashboard || !draggedWidgetId.current) return;

        const widgets = [...activeDashboard.widgets];
        const draggedIndex = widgets.findIndex(w => w.id === draggedWidgetId.current);
        const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedItem] = widgets.splice(draggedIndex, 1);
        widgets.splice(targetIndex, 0, draggedItem);
        
        updateActiveDashboard({ ...activeDashboard, widgets });
        draggedWidgetId.current = null;
        e.currentTarget.classList.remove('border-cyan-500');
    }
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }
    
    const handleDragEnter = (e: React.DragEvent) => {
        (e.currentTarget as HTMLDivElement).classList.add('border-cyan-500');
    }

    const handleDragLeave = (e: React.DragEvent) => {
        (e.currentTarget as HTMLDivElement).classList.remove('border-cyan-500');
    }


    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-700 items-center">
                {dashboards.map(db => (
                    <button key={db.id} onClick={() => { setActiveDashboardId(db.id); setIsEditing(false); }} className={`px-4 py-2 -mb-px font-medium text-lg border-b-2 transition-colors duration-200 ${activeDashboardId === db.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
                        {db.name}
                    </button>
                ))}
                <button onClick={handleAddDashboard} className="px-3 py-1 ml-2 text-sm rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300">+</button>
            </div>
            
            {activeDashboard ? (
                <div className="flex-grow flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 flex-none">
                        <div>
                            {isEditing ? (
                                <>
                                    <input type="text" value={activeDashboard.name} onChange={e => updateActiveDashboard({...activeDashboard, name: e.target.value})} className="text-3xl font-bold text-white bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 outline-none" />
                                    <input type="text" value={activeDashboard.description} onChange={e => updateActiveDashboard({...activeDashboard, description: e.target.value})} className="text-slate-400 bg-transparent border-b border-slate-700 focus:border-cyan-500 outline-none w-full mt-1" />
                                </>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-white">{activeDashboard.name}</h1>
                                    <p className="text-slate-400">{activeDashboard.description}</p>
                                </>
                            )}
                        </div>
                        <div className="space-x-2">
                           {isEditing ? (
                               <button onClick={() => setIsEditing(false)} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">Done</button>
                           ) : (
                                <button onClick={() => setIsEditing(true)} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600">Edit</button>
                           )}
                           {isEditing && <button onClick={() => setIsWidgetModalOpen(true)} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600">+ Add Widget</button>}
                           {isEditing && <button onClick={handleDeleteDashboard} className="bg-red-800/80 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700">Delete Dashboard</button>}
                        </div>
                    </div>
                    
                    {/* Dashboard Grid */}
                    <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                        {activeDashboard.widgets.length > 0 ? (
                             <div className="grid grid-cols-4 gap-6">
                                {activeDashboard.widgets.map(widget => (
                                    <div 
                                        key={widget.id} 
                                        className={`col-span-4 md:col-span-${widget.colSpan} border-2 border-transparent transition-all ${isEditing ? 'cursor-grab rounded-lg' : ''}`}
                                        draggable={isEditing}
                                        onDragStart={(e) => handleDragStart(e, widget.id)}
                                        onDrop={(e) => handleDrop(e, widget.id)}
                                        onDragOver={handleDragOver}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                    >
                                        <Widget 
                                            config={widget} 
                                            data={processedData ? processedData[widget.dataKey] : null}
                                            isEditing={isEditing}
                                            onRemove={() => handleRemoveWidget(widget.id)}
                                            onUpdate={(newConfig) => handleUpdateWidget(widget.id, newConfig)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-700 rounded-lg">
                                <div className="text-center">
                                    <p className="text-slate-400 mb-4">This dashboard is empty.</p>
                                    <button onClick={() => { setIsEditing(true); setIsWidgetModalOpen(true); }} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                                        + Add Your First Widget
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                 <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-700 rounded-lg">
                    <div className="text-center">
                        <p className="text-slate-400 mb-4">You have no dashboards.</p>
                        <button onClick={handleAddDashboard} className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">
                            Create Your First Dashboard
                        </button>
                    </div>
                </div>
            )}
            {isWidgetModalOpen && <AddWidgetModal onAdd={handleAddWidget} onClose={() => setIsWidgetModalOpen(false)} />}
        </div>
    );
};

const AddWidgetModal: React.FC<{onClose: ()=>void, onAdd: (config: Omit<WidgetConfig, 'id'>)=>void}> = ({ onClose, onAdd }) => {
    const [type, setType] = useState<ChartType>('Metric');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onAdd({
            title: formData.get('title') as string,
            type: formData.get('type') as ChartType,
            dataKey: formData.get('dataKey') as string,
            colSpan: parseInt(formData.get('colSpan') as string, 10) as WidgetConfig['colSpan'],
        });
    }

    const compatibleDataSources = Object.entries(DATA_SOURCES).filter(([, val]) => val.compatible.includes(type));
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Add New Widget</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 mb-1">Title</label>
                        <input name="title" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" />
                    </div>
                     <div>
                        <label className="block text-slate-400 mb-1">Widget Type</label>
                        <select name="type" value={type} onChange={e => setType(e.target.value as ChartType)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                            {CHART_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-slate-400 mb-1">Data Source</label>
                        <select name="dataKey" required className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white" disabled={compatibleDataSources.length === 0}>
                            {compatibleDataSources.length > 0 ? compatibleDataSources.map(([key, val]) => <option key={key} value={key}>{val.name}</option>) : <option>No sources for this type</option>}
                        </select>
                    </div>
                     <div>
                        <label className="block text-slate-400 mb-1">Width (Columns)</label>
                        <select name="colSpan" defaultValue={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white">
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                        </select>
                    </div>
                     <div className="flex gap-2 pt-2">
                         <button type="submit" className="bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600">Add Widget</button>
                         <button type="button" onClick={onClose} className="bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-500">Cancel</button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default DashboardBuilder;
