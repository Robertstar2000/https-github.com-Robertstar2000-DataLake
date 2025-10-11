
import React, { useState, useEffect } from 'react';
import { executeQuery, getTableSchemas, searchSchemaWithAi } from '../services/api';
import { schemaMetadata } from '../data/schemaMetadata';

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

const SchemaSidebarSkeleton: React.FC = () => (
    <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="p-2 rounded-md bg-slate-800/50 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-3/4"></div>
            </div>
        ))}
    </div>
);

const StructuredDataExplorer: React.FC = () => {
    const [query, setQuery] = useState('SELECT * FROM p21_customers;');
    const [executedQuery, setExecutedQuery] = useState<string | null>(null);
    const [queryResult, setQueryResult] = useState<{ headers: string[], data: any[] } | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [tableSchemas, setTableSchemas] = useState<Record<string, string>>({});
    const [isSchemaLoading, setIsSchemaLoading] = useState(true);
    
    // State for AI search
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<{ tables: string[], columns: string[] }>({ tables: [], columns: [] });

    useEffect(() => {
        const loadInitialData = async () => {
            setIsSchemaLoading(true);
            try {
                const savedHistory = localStorage.getItem('sqlQueryHistory');
                if (savedHistory) {
                    setHistory(JSON.parse(savedHistory));
                }
                const schemas = await getTableSchemas();
                setTableSchemas(schemas);
            } catch (e) {
                console.error("Failed to load initial data", e);
            } finally {
                setIsSchemaLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const updateHistory = (newQuery: string) => {
        const updatedHistory = [newQuery, ...history.filter(h => h !== newQuery)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('sqlQueryHistory', JSON.stringify(updatedHistory));
    };
  
    const handleRunQuery = async () => {
      setIsLoading(true);
      setQueryError(null);
      setQueryResult(null);
      setExecutedQuery(query);
      
      try {
        const result = await executeQuery(query);
        if ('error' in result) {
            setQueryError(result.error);
        } else {
            setQueryResult(result);
            updateHistory(query);
        }
      } catch (e: any) {
        setQueryError(e.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setSearchResults({ tables: [], columns: [] });

        try {
            const resultJson = await searchSchemaWithAi(searchQuery);
            setSearchResults(resultJson);
        } catch (e: any) {
            console.error("AI Search Error:", e);
            setSearchError(`Failed to perform AI search. ${e.message}`);
        } finally {
            setIsSearching(false);
        }
    };
    
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults({ tables: [], columns: [] });
        setSearchError(null);
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
                        placeholder="SELECT * FROM p21_customers;"
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
                    <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="text-lg font-semibold text-white mb-2">AI Schema Search</h3>
                        <div className="flex gap-2 mb-2">
                             <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="e.g., 'customer contact info'"
                                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                            {searchQuery && <button onClick={clearSearch} className="text-slate-400 hover:text-white">&times;</button>}
                            <button onClick={handleSearch} disabled={isSearching} className="bg-slate-600 text-white font-semibold px-4 rounded-lg hover:bg-slate-500 disabled:opacity-50">
                                {isSearching ? '...' : 'Search'}
                            </button>
                        </div>
                        {searchError && <p className="text-xs text-red-400">{searchError}</p>}
                        
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 overflow-y-auto flex-1">
                            {isSchemaLoading ? <SchemaSidebarSkeleton /> : Object.entries(tableSchemas).map(([tableName, columns]) => {
                                const tableMeta = schemaMetadata[tableName];
                                const isTableHighlighted = searchResults.tables.includes(tableName);
                                const hasVector = tableMeta?.inVectorStore;
                                return (
                                    <details key={tableName} open={isTableHighlighted} className="mb-1 last:mb-0">
                                        <summary className={`p-2 rounded-md cursor-pointer hover:bg-slate-800/50 ${isTableHighlighted ? 'bg-cyan-500/10' : ''}`}>
                                            <h4 className={`font-bold inline ${isTableHighlighted ? 'text-cyan-300' : 'text-slate-300'}`}>
                                                {tableName}
                                                {hasVector && (
                                                    <span title="Included in Vector Store" className="inline-block ml-2 text-fuchsia-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-slate-400 pl-2">{tableMeta?.description}</p>
                                        </summary>
                                        <div className="pl-4 border-l-2 border-slate-700 ml-2 mt-1">
                                            {(typeof columns === 'string' ? columns : '').split(', ').map(colStr => {
                                                const [colName, colType] = colStr.replace(')', '').split(' (');
                                                const colMeta = tableMeta?.columns[colName];
                                                const isColHighlighted = searchResults.columns.includes(`${tableName}.${colName}`);
                                                return (
                                                    <div key={colName} className={`py-1 px-2 rounded ${isColHighlighted ? 'bg-cyan-500/20' : ''}`}>
                                                        <div className="flex justify-between items-center">
                                                            <span className={`font-mono text-sm ${isColHighlighted ? 'text-cyan-300' : 'text-slate-300'}`}>{colName}</span>
                                                            <span className="font-mono text-xs text-slate-500">{colType}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400">{colMeta?.description}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </details>
                                );
                            })}
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
                <div className="flex-grow flex flex-col min-h-0">
                    {executedQuery && (
                        <div className="flex-none p-3 bg-slate-900/40 border-b border-slate-700">
                            <h4 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Executed SQL</h4>
                            <pre className="text-sm font-mono text-cyan-300 whitespace-pre-wrap">{executedQuery}</pre>
                        </div>
                    )}
                    <div className="flex-grow relative flex">
                        {isLoading && <div className="p-4 text-slate-400 w-full text-center mt-4">Executing query...</div>}
                        {queryError && <div className="p-4 text-red-400 font-mono bg-red-500/10 w-full overflow-auto">{queryError}</div>}
                        {queryResult && queryResult.data.length > 0 && <DataTable headers={queryResult.headers} data={queryResult.data} />}
                        {queryResult && queryResult.data.length === 0 && <div className="p-4 text-slate-400 w-full text-center mt-4">Query returned 0 rows.</div>}
                        {!executedQuery && !isLoading && !queryError && <div className="p-4 text-slate-400 w-full text-center mt-4">Run a query to see results.</div>}
                    </div>
                </div>
                 <div className="flex-none p-2 border-t border-slate-700 text-xs text-slate-400">
                    {!isLoading && queryResult && `${queryResult.data.length} rows returned.`}
                </div>
            </div>
        </div>
    );
};

export default StructuredDataExplorer;
