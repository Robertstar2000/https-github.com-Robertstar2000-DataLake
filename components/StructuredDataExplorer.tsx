import React, { useState, useEffect } from 'react';
import { customers, orders, products } from '../data';
import { executeQuery } from '../services/db';

const DataTable = ({ headers, data }: { headers: string[], data: any[] }) => {
  return (
    <div className="overflow-auto flex-grow">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-slate-800 z-10">
          <tr>
            {headers.map(h => <th key={h} className="p-3 font-semibold text-slate-300 capitalize">{h.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-800/50">
              {headers.map(header => <td key={`${rowIndex}-${header}`} className="p-3 font-mono text-sm">{String(row[header])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const StructuredDataExplorer: React.FC = () => {
    const [query, setQuery] = useState('SELECT * FROM customers;');
    const [queryResult, setQueryResult] = useState<{ headers: string[], data: any[] } | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('sqlQueryHistory');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const updateHistory = (newQuery: string) => {
        const updatedHistory = [newQuery, ...history.filter(h => h !== newQuery)].slice(0, 10); // Keep last 10
        setHistory(updatedHistory);
        localStorage.setItem('sqlQueryHistory', JSON.stringify(updatedHistory));
    };
  
    const handleRunQuery = () => {
      setIsLoading(true);
      setQueryError(null);
      setQueryResult(null);
      
      // Artificial delay to show loading state, as sql.js is very fast
      setTimeout(() => {
          const result = executeQuery(query);
          if ('error' in result) {
            setQueryError(result.error);
            setQueryResult(null);
          } else {
            setQueryResult(result);
            setQueryError(null);
            updateHistory(query);
          }
          setIsLoading(false);
      }, 300);
    };
    
    const tableSchemas = {
        customers: Object.keys(customers[0] || {}),
        products: Object.keys(products[0] || {}),
        orders: Object.keys(orders[0] || {}),
    }

    return (
        <div className="h-full flex gap-6">
            {/* Left Panel: Schema and Query */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="flex-none">
                    <h3 className="text-lg font-semibold text-white mb-2">Query Editor</h3>
                    <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-3 font-mono text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        placeholder="SELECT * FROM customers;"
                    />
                    <button 
                        onClick={handleRunQuery}
                        disabled={isLoading}
                        className="w-full mt-2 bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Running...' : 'Run Query'}
                    </button>
                </div>
                 <div className="flex-grow flex flex-col min-h-0 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Available Tables</h3>
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                            {Object.entries(tableSchemas).map(([tableName, columns]) => (
                                <div key={tableName} className="mb-2 last:mb-0">
                                    <h4 className="font-bold text-slate-300">{tableName}</h4>
                                    <ul className="list-disc list-inside pl-2">
                                        {columns.map(col => <li key={col} className="text-sm text-slate-400 font-mono">{col}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col min-h-0">
                        <h3 className="text-lg font-semibold text-white mb-2">Query History</h3>
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 overflow-y-auto flex-grow">
                            {history.length > 0 ? (
                                history.map((h, i) => (
                                    <button key={i} onClick={() => setQuery(h)} className="w-full text-left p-2 rounded-md hover:bg-slate-700/50 text-sm font-mono text-slate-400 truncate">
                                        {h}
                                    </button>
                                ))
                            ) : <p className="text-sm text-slate-500 p-2">No history yet.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Results */}
            <div className="w-2/3 flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="flex-none p-4 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white">Results</h3>
                </div>
                <div className="flex-grow relative min-h-0">
                    {isLoading && <div className="p-4 text-slate-400">Executing query...</div>}
                    {queryError && <div className="p-4 text-red-400 font-mono bg-red-500/10">{queryError}</div>}
                    {queryResult && queryResult.data.length > 0 && <DataTable headers={queryResult.headers} data={queryResult.data} />}
                    {queryResult && queryResult.data.length === 0 && <div className="p-4 text-slate-400">Query returned 0 rows.</div>}
                    {!queryResult && !queryError && !isLoading && <div className="p-4 text-slate-400">Run a query to see results.</div>}
                </div>
                 <div className="flex-none p-2 border-t border-slate-700 text-xs text-slate-400">
                    {queryResult && `${queryResult.data.length} rows returned.`}
                </div>
            </div>
        </div>
    );
};

export default StructuredDataExplorer;
