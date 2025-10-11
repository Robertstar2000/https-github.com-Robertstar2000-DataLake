
import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { getTableSchemas } from '../services/api';

// Local type definitions, as they are no longer in a shared file
interface SchemaField {
  name: string;
  type: string;
}

interface Schema {
  id: string;
  name:string;
  category: string;
  fields: SchemaField[];
}

// Helper to categorize tables based on name prefix
const getCategoryForTable = (tableName: string): string => {
    if (tableName.startsWith('p21_')) return 'P21 ERP';
    if (tableName.startsWith('por_')) return 'Point of Rental';
    if (tableName.startsWith('qc_')) return 'Quality Control';
    if (tableName.startsWith('wordpress_')) return 'WordPress CMS';
    if (tableName.startsWith('teams_')) return 'Microsoft Teams';
    if (tableName.startsWith('gdrive_')) return 'Google Drive';
    if (tableName.startsWith('stackoverflow_')) return 'Stack Overflow';
    if (tableName.startsWith('daily_sales_metrics')) return 'Reporting';
    return 'General';
};

// Helper to parse the schema string from the DB service
const parseSchemaString = (columns: string): SchemaField[] => {
    if (!columns) return [];
    return columns.split(', ').map(colStr => {
        const match = colStr.match(/(.+)\s\((.+)\)/);
        if (match) {
            return { name: match[1], type: match[2] };
        }
        // Fallback for columns without a clear type in the string
        return { name: colStr, type: 'unknown' };
    });
};

const SchemaListSkeleton: React.FC = () => (
    <div className="space-y-2 pr-2">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-700/50 animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            </div>
        ))}
    </div>
);

const SchemaDetailSkeleton: React.FC = () => (
    <div>
        <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-slate-700/50 rounded w-1/4 mb-6 animate-pulse"></div>
        <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3">
                    <div className="h-4 bg-slate-700/50 rounded w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-1/4 animate-pulse"></div>
                </div>
            ))}
        </div>
    </div>
);

const SchemaExplorer: React.FC = () => {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load and process schemas on component mount
  useEffect(() => {
    const loadSchemas = async () => {
      setIsLoading(true);
      try {
        const dbSchemas = await getTableSchemas();
        const processedSchemas = Object.entries(dbSchemas).map(([tableName, columns]) => ({
            id: tableName,
            name: tableName,
            category: getCategoryForTable(tableName),
            fields: parseSchemaString(columns)
        }));
        
        setSchemas(processedSchemas);
        const uniqueCategories = [...new Set(processedSchemas.map(s => s.category))].sort();
        setCategories(uniqueCategories);

        if(processedSchemas.length > 0) {
            setSelectedSchema(processedSchemas[0]);
        }
      } catch (e) {
        console.error("Failed to load schemas", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchemas();
  }, []);

  const filteredSchemas = useMemo(() => {
    return schemas.filter(schema => {
      const categoryMatch = selectedCategory === 'All' || schema.category === selectedCategory;
      const searchMatch = schema.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (schema.fields && schema.fields.some(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())));
      return categoryMatch && searchMatch;
    });
  }, [schemas, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white">Schema Explorer</h1>
      <p className="text-slate-400 max-w-3xl">
        Explore the live database schema. The tables and columns listed here are dynamically pulled from the active data lake, representing the schemas for all connected MCPs.
      </p>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column: Filters and Schema List */}
        <Card className="lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Schemas</h2>
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 mb-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <button
                key="All"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-cyan-500 text-white font-semibold'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                All
              </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-cyan-500 text-white font-semibold'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {isLoading ? <SchemaListSkeleton /> : (
            <ul className="flex-grow overflow-y-auto space-y-2 pr-2">
                {filteredSchemas.map(schema => (
                <li
                    key={schema.id}
                    onClick={() => setSelectedSchema(schema)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSchema?.id === schema.id
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                >
                    <h3 className="font-semibold">{schema.name}</h3>
                    <p className="text-sm text-slate-400">{schema.category}</p>
                </li>
                ))}
            </ul>
          )}
        </Card>

        {/* Right Column: Schema Details */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2">
            {isLoading ? <SchemaDetailSkeleton /> : !selectedSchema ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Select a schema to view its details.</p>
              </div>
            ) : (
              // View Mode Only
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedSchema.name}</h2>
                    <p className="text-slate-400">{selectedSchema.category}</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-700">
                  <div className="grid grid-cols-2 gap-4 font-semibold text-slate-300 p-3 bg-slate-900/50">
                    <div>Field Name</div>
                    <div>Data Type</div>
                  </div>
                  {selectedSchema.fields.map((field, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-3 hover:bg-slate-800/50">
                      <div className="text-slate-200 font-mono">{field.name}</div>
                      <div className="text-cyan-400 font-mono">{field.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SchemaExplorer;
