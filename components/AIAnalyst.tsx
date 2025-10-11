import React, { useState, useRef } from 'react';
import Card from './Card';
import { getTableSchemas } from '../services/db';
import { GoogleGenAI, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

const Loader: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    <span className="text-slate-400">AI Analyst is thinking...</span>
  </div>
);

const AIAnalyst: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isSchemaAnalyzed, setIsSchemaAnalyzed] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);

  const exampleQueries = [
    "Which customer has spent the most money?",
    "What is our best-selling product by revenue?",
    "How many orders did we have in January 2023?",
    "List all orders for 'Alice Johnson'.",
  ];

  const handleAnalyzeSchema = () => {
    setIsLoading(true);
    setError('');
    setResponse('');
    
    try {
      if (!API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }

      const schemas = getTableSchemas();
      
      const displaySchema = Object.entries(schemas)
        .map(([table, cols]) => `Table **${table}**:\n${cols.split(', ').map(c => `  - \`${c}\``).join('\n')}`)
        .join('\n\n');
        
      const contextSchema = Object.entries(schemas)
        .map(([table, cols]) => `Table "${table}" has columns: ${cols}`)
        .join('\n');
      
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const systemInstruction = `You are an expert data analyst for an e-commerce company. Your task is to answer questions based on the provided SQL table schemas. Be concise and clear in your answers. If the question cannot be answered from the schemas, state that clearly. Analyze the relationships between customers, products, and orders to provide insightful answers. Do not attempt to run or generate SQL. Here are the table schemas: ${contextSchema}`;

      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction
        },
      });
      
      setResponse(`I have analyzed the following table schemas and am ready for your questions:\n\n${displaySchema}`);
      setIsSchemaAnalyzed(true);
    } catch (err: any) {
      const userFriendlyError = "An unexpected error occurred while analyzing the database schema. Please check the console for details or try again later.";
      setError(err.message || userFriendlyError);
      console.error("Failed to analyze table schemas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !chatRef.current) {
        if(!chatRef.current) setError("Please analyze the schema first.");
        return;
    };

    setIsLoading(true);
    setError('');
    setResponse('');
    
    try {
      const stream = await chatRef.current.sendMessageStream({ message: query });
      let text = '';
      for await (const chunk of stream) {
        text += chunk.text;
        setResponse(text);
      }
    } catch (err: any) {
      setError('Failed to get response from AI Analyst: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };
  
  const handleExampleClick = (exampleQuery: string) => {
      setQuery(exampleQuery);
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <h1 className="text-3xl font-bold text-white">AI Data Analyst</h1>
      <p className="text-slate-400">
        {isSchemaAnalyzed 
          ? "Ask questions about your data in plain English. The AI has been provided with the table schemas for context."
          : "Start by analyzing the schema to provide the AI with context about your database tables."
        }
      </p>

      {isSchemaAnalyzed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exampleQueries.map((q) => (
              <button key={q} onClick={() => handleExampleClick(q)} className="p-3 bg-slate-800 rounded-lg text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors duration-200">
                  {q}
              </button>
          ))}
        </div>
      )}

      <Card className="flex-grow flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2">
          {response && (
            <div className="p-4 bg-slate-900/50 rounded-lg">
                <h3 className="font-semibold text-cyan-400 mb-2">AI Analyst Response:</h3>
                <div className="prose prose-invert prose-p:text-slate-300 whitespace-pre-wrap">{response}{isLoading && '...'}</div>
            </div>
          )}
          {isLoading && !response && <Loader />}
          {error && <p className="text-red-400 p-4">{error}</p>}
           {!isSchemaAnalyzed && !isLoading && !response && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" /></svg>
                  <p className="text-slate-400 mb-4">Click the button below to provide the AI with your table schemas as context.</p>
                  <button
                      onClick={handleAnalyzeSchema}
                      disabled={isLoading}
                      className="bg-cyan-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                      Analyze Table Schema
                  </button>
              </div>
          )}
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
