

import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { initializeAiAnalyst, getAiAnalystResponseStream } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Loader: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

interface HistoryMessage {
  role: 'user' | 'model';
  parts: string;
  chart?: {
    chartType: 'Bar' | 'Line' | 'Pie';
    title: string;
    data: any[];
  };
}

const COLORS = ['#06b6d4', '#818cf8', '#f87171', '#fbbf24', '#a3e635', '#f472b6'];

const ChartRenderer: React.FC<{chart: HistoryMessage['chart']}> = ({ chart }) => {
    if (!chart || !chart.data || chart.data.length === 0) return null;
    
    return (
        <div className="my-4 bg-slate-950/50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-200 mb-4">{chart.title}</h4>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    { chart.chartType === 'Bar' ? (
                        <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} interval={0} angle={-30} textAnchor="end" />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} />
                            <Bar dataKey="value" fill="#06b6d4" />
                        </BarChart>
                    ) : chart.chartType === 'Line' ? (
                        <LineChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} interval={'preserveStartEnd'} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    ) : chart.chartType === 'Pie' ? (
                        <PieChart>
                            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {chart.data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Legend />
                        </PieChart>
                    ) : null}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const AIAnalyst: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [error, setError] = useState('');
  const [isSchemaAnalyzed, setIsSchemaAnalyzed] = useState(false);
  const [schemaDisplay, setSchemaDisplay] = useState('');
  
  const chatInitialized = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const exampleQueries = [
    "Which customer has spent the most money?",
    "What is our best-selling product by revenue?",
    "Show total order value by date as a line chart.",
    "List all orders for 'Innovate Corp'.",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleAnalyzeSchema = async () => {
    setIsLoading(true);
    setError('');
    setHistory([]);
    
    try {
      const { displaySchema } = await initializeAiAnalyst();
      setSchemaDisplay(`I have analyzed the following table schemas and am ready for your questions:\n\n${displaySchema}`);
      chatInitialized.current = true;
      setIsSchemaAnalyzed(true);
    } catch (err: any) {
      const userFriendlyError = "An unexpected error occurred while analyzing the database schema. Please check the console for details or try again later.";
      setError(err.message || userFriendlyError);
      console.error("Failed to analyze table schemas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent | null, prompt?: string) => {
    if (e) e.preventDefault();
    const userQuery = prompt || query;

    if (!userQuery.trim() || !chatInitialized.current) {
        if(!chatInitialized.current) setError("Please analyze the schema first.");
        return;
    };

    setIsLoading(true);
    setError('');
    setQuery('');

    setHistory(prev => [...prev, { role: 'user', parts: userQuery }, { role: 'model', parts: '', chart: undefined }]);
    
    try {
      const stream = await getAiAnalystResponseStream(userQuery);
      
      let isFinalAnswerStage = false;
      for await (const chunk of stream) {
        setHistory(prev => {
            const newHistory = [...prev];
            const lastMessage = newHistory[newHistory.length - 1];
            
            if (chunk.status === 'chart_data' && chunk.chart) {
              lastMessage.chart = chunk.chart;
            } else if (chunk.status && chunk.text) {
                 if (chunk.status === 'error') {
                     lastMessage.parts = `Error: ${chunk.text}`;
                     setError(chunk.text);
                 } else if (chunk.status === 'final_answer') {
                    if (!isFinalAnswerStage) {
                        lastMessage.parts = chunk.text;
                        isFinalAnswerStage = true;
                    } else {
                        lastMessage.parts += chunk.text;
                    }
                } else {
                    lastMessage.parts = chunk.text;
                }
            }
            return newHistory;
        });
      }
    } catch (err: any) {
      setError('Failed to get response from AI Analyst: ' + err.message);
      console.error(err);
      setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length-1].parts = 'An error occurred while processing your request.';
          return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExampleClick = (exampleQuery: string) => {
      setQuery(exampleQuery);
      handleQuerySubmit(null, exampleQuery);
  }

  const renderResponse = (content: string) => {
      const sqlRegex = /```sql\n([\s\S]*?)\n```/g;
      const parts = content.split(sqlRegex);
  
      return parts.map((part, i) => {
          if (i % 2 === 1) {
              return (
                  <pre key={i} className="bg-slate-950 p-3 rounded-md text-cyan-300 font-mono text-sm my-2 overflow-x-auto">
                      <code>{part.trim()}</code>
                  </pre>
              );
          }
          const textParts = part.split(/(\*\*.*?\*\*)/g).filter(Boolean);
          return textParts.map((textPart, j) => {
            if (textPart.startsWith('**') && textPart.endsWith('**')) {
                return <strong key={`${i}-${j}`}>{textPart.slice(2, -2)}</strong>;
            }
            return textPart.split('\n').map((line, k) => {
              if (line.trim().startsWith('- ')) {
                  return <li key={`${i}-${j}-${k}`} className="ml-4 list-disc">{line.substring(2)}</li>;
              }
              return <p key={`${i}-${j}-${k}`} className="inline">{line}</p>;
            });
          });
      });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <h1 className="text-3xl font-bold text-white">AI Data Analyst</h1>
      <p className="text-slate-400">
        {isSchemaAnalyzed 
          ? "Ask questions about your data in plain English. The AI will generate SQL queries, find the answer, and create charts."
          : "Start by analyzing the schema to provide the AI with context about your database tables."
        }
      </p>

      {isSchemaAnalyzed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exampleQueries.map((q) => (
              <button key={q} onClick={() => handleExampleClick(q)} disabled={isLoading} className="p-3 bg-slate-800 rounded-lg text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {q}
              </button>
          ))}
        </div>
      )}

      <Card className="flex-grow flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {schemaDisplay && !history.length && (
               <div className="p-4 bg-slate-900/50 rounded-lg">
                <h3 className="font-semibold text-cyan-400 mb-2">AI Analyst Ready:</h3>
                <div className="prose prose-invert prose-p:text-slate-300 whitespace-pre-wrap">{schemaDisplay}</div>
              </div>
          )}
          {history.map((msg, index) => (
             <div key={index} className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-cyan-900/50' : 'bg-slate-900/50'}`}>
                <h3 className="font-semibold mb-2 capitalize">{msg.role === 'model' ? <span className="text-cyan-400">AI Analyst</span> : 'You'}</h3>
                {msg.parts && <div className="prose prose-invert prose-p:text-slate-300 prose-strong:text-white whitespace-pre-wrap">{renderResponse(msg.parts)}</div>}
                {msg.chart && <ChartRenderer chart={msg.chart} />}
                 {isLoading && index === history.length - 1 && msg.role === 'model' && <div className="mt-2"><Loader /></div>}
            </div>
          ))}
          {error && !isLoading && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-300">An Error Occurred</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
           {!isSchemaAnalyzed && !isLoading && !history.length && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" /></svg>
                  <p className="text-slate-400 mb-4">Click the button below to provide the AI with your table schemas as context.</p>
                  <button
                      onClick={handleAnalyzeSchema}
                      disabled={isLoading}
                      className="bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                      {isLoading ? 'Analyzing...' : 'Analyze Table Schema'}
                  </button>
              </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {isSchemaAnalyzed && (
            <form onSubmit={handleQuerySubmit} className="mt-4 flex gap-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Which product is the most popular?"
                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
                Ask
            </button>
            </form>
        )}
      </Card>
    </div>
  );
};

export default AIAnalyst;