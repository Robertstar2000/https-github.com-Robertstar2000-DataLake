import React, { useState, useMemo } from 'react';
import Card from './Card';
import { initialPipelines } from '../data/pipelines';

type Role = 'Admin' | 'Analyst' | 'Viewer';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface Policy {
  id: string;
  name: string;
  enabled: boolean;
}

const mockUsers: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Analyst' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Analyst' },
];

const mockPolicies: Policy[] = [
  { id: 'pol1', name: "Enforce PII Masking on 'customers' table", enabled: true },
  { id: 'pol2', name: 'Require Schema Validation for new pipelines', enabled: true },
  { id: 'pol3', name: 'Data Retention: Auto-delete raw data after 90 days', enabled: false },
  { id: 'pol4', name: 'Audit all queries against financial data', enabled: true },
];

const mockCosts = {
  storage: 450,
  compute: 850,
  api: 120,
};


const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);


const DlControls: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [policies, setPolicies] = useState<Policy[]>(mockPolicies);
  const [optimizing, setOptimizing] = useState(false);

  const handleRoleChange = (userId: number, newRole: Role) => {
    setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handlePolicyToggle = (policyId: string) => {
    setPolicies(policies.map(p => (p.id === policyId ? { ...p, enabled: !p.enabled } : p)));
  };
  
  const handleOptimize = () => {
      setOptimizing(true);
      setTimeout(() => setOptimizing(false), 1500);
  }

  const pipelineStatusCounts = useMemo(() => {
    return initialPipelines.reduce((acc, pipeline) => {
      acc[pipeline.status] = (acc[pipeline.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [initialPipelines]);

  const totalCost = Object.values(mockCosts).reduce((sum, cost) => sum + cost, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Data Lake Controls</h1>
      <p className="text-slate-400 max-w-3xl">
        This console provides centralized control over the entire platform. Manage user access, set global data policies, monitor pipeline health, and oversee costs from a single command center.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">User & Access Management</h2>
          <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-200">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value as Role)}
                  className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option>Admin</option>
                  <option>Analyst</option>
                  <option>Viewer</option>
                </select>
              </div>
            ))}
          </div>
        </Card>

        {/* Data Governance */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">Global Data Policies</h2>
           <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
            {policies.map(policy => (
                <div key={policy.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-slate-300 mr-4">{policy.name}</p>
                    <ToggleSwitch enabled={policy.enabled} onChange={() => handlePolicyToggle(policy.id)} />
                </div>
            ))}
          </div>
        </Card>

        {/* Pipeline Oversight */}
        <Card>
            <h2 className="text-xl font-bold text-white mb-4">Pipeline Oversight</h2>
            <p className="text-sm text-slate-400 mb-4">A high-level overview of all data pipelines across the system.</p>
            <div className="flex justify-around text-center">
                <div>
                    <p className="text-4xl font-bold text-green-400">{pipelineStatusCounts.Healthy || 0}</p>
                    <p className="text-slate-400">Healthy</p>
                </div>
                 <div>
                    <p className="text-4xl font-bold text-red-400">{pipelineStatusCounts.Failing || 0}</p>
                    <p className="text-slate-400">Failing</p>
                </div>
                 <div>
                    <p className="text-4xl font-bold text-slate-500">{pipelineStatusCounts.Paused || 0}</p>
                    <p className="text-slate-400">Paused</p>
                </div>
            </div>
            <p className="text-xs text-center mt-4 text-slate-500">
                These statuses reflect the operational state of data flows from sources to destinations.
            </p>
        </Card>

        {/* Cost Management */}
        <Card>
            <h2 className="text-xl font-bold text-white mb-4">Simulated Monthly Cloud Costs</h2>
            <div className="flex justify-between items-baseline mb-4">
                <span className="text-slate-400">Total Estimated Cost</span>
                <span className="text-3xl font-bold text-cyan-400">${totalCost.toLocaleString()}</span>
            </div>
            <div className="space-y-2 mb-4">
                {Object.entries(mockCosts).map(([key, value]) => (
                    <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-slate-300">{key}</span>
                            <span className="text-slate-400">${value}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${(value / totalCost) * 100}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <button 
              onClick={handleOptimize} 
              disabled={optimizing}
              className="w-full bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {optimizing ? 'Analyzing...' : 'Run Cost Optimization'}
            </button>
        </Card>
      </div>
    </div>
  );
};

export default DlControls;
