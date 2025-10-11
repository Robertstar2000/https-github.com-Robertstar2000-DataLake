
import React, { useState, useRef, useEffect } from 'react';
import Card from './Card';
import { initializeAiAnalyst, getAiAnalystResponseStream } from '../services/api';

const Loader: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

const AIAnalyst: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{role: 'user' | 'model', parts: string}>>([]);
  const [error, setError] = useState('');
  const [isSchemaAnalyzed, setIsSchemaAnalyzed] = useState(false);
  const [schemaDisplay, setSchemaDisplay] = useState('');
  
  const chatInitialized = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const exampleQueries = [
    "Which customer has spent the most money?",
    "What is our best-selling product by revenue?",
    "How many orders did we have in January 2023?",
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
    setQuery(''); // Clear input after submission

    // Add user query and a placeholder for the model's response
    setHistory(prev => [...prev, { role: 'user', parts: userQuery }, { role: 'model', parts: '' }]);
    
    try {
      const stream = await getAiAnalystResponseStream(userQuery);
      
      let isFinalAnswerStage = false;
      for await (const chunk of stream) {
        setHistory(prev => {
            const newHistory = [...prev];
            const lastMessage = newHistory[newHistory.length - 1];
            
            if (chunk.status && chunk.text) {
                 if (chunk.status === 'error') {
                     lastMessage.parts = `Error: ${chunk.text}`;
                     setError(chunk.text);
                 } else if (chunk.status === 'final_answer') {
                    if (!isFinalAnswerStage) {
                        lastMessage.parts = chunk.text; // Overwrite status message
                        isFinalAnswerStage = true;
                    } else {
                        lastMessage.parts += chunk.text; // Append subsequent chunks
                    }
                } else {
                    lastMessage.parts = chunk.text; // Show status update
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
          if (i % 2 === 1) { // SQL code block
              return (
                  <pre key={i} className="bg-slate-950 p-3 rounded-md text-cyan-300 font-mono text-sm my-2 overflow-x-auto">
                      <code>{part.trim()}</code>
                  </pre>
              );
          }
          // Regular text
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
          ? "Ask questions about your data in plain English. The AI will generate and run SQL queries to find the answer."
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
                <div className="prose prose-invert prose-p:text-slate-300 prose-strong:text-white whitespace-pre-wrap">{renderResponse(msg.parts)}</div>
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
