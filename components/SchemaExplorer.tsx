import React, { useState, useMemo } from 'react';
import Card from './Card';
import { schemas as initialSchemas, categories } from '../data/schemas';
import type { Schema, SchemaField } from '../data/schemas';

const SchemaExplorer: React.FC = () => {
  const [schemas, setSchemas] = useState<Schema[]>(initialSchemas);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);
  const [editingSchema, setEditingSchema] = useState<Schema | null>(null);

  const filteredSchemas = useMemo(() => {
    return schemas.filter(schema => {
      const categoryMatch = selectedCategory === 'All' || schema.category === selectedCategory;
      const searchMatch = schema.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          schema.fields.some(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return categoryMatch && searchMatch;
    });
  }, [schemas, searchTerm, selectedCategory]);

  const handleSelectSchema = (schema: Schema) => {
    setSelectedSchema(schema);
    setEditingSchema(null); // Exit edit mode when selecting a new schema
  };

  const handleEdit = () => {
    // Create a deep copy for editing to avoid mutating the original state directly
    setEditingSchema(JSON.parse(JSON.stringify(selectedSchema)));
  };

  const handleCancelEdit = () => {
    setEditingSchema(null);
  };
  
  const handleSaveEdit = () => {
    if (!editingSchema) return;

    // Update the main schemas list
    const updatedSchemas = schemas.map(s => s.id === editingSchema.id ? editingSchema : s);
    setSchemas(updatedSchemas);

    // Update the selected schema view and exit edit mode
    setSelectedSchema(editingSchema);
    setEditingSchema(null);
  };

  const handleFieldChange = (fieldIndex: number, fieldProp: keyof SchemaField, value: string) => {
    if (!editingSchema) return;
    const updatedFields = [...editingSchema.fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], [fieldProp]: value };
    setEditingSchema({ ...editingSchema, fields: updatedFields });
  };
  
  const handleAddFiel = () => {
    if (!editingSchema) return;
    const newField: SchemaField = { name: 'new_field', type: 'string' };
    setEditingSchema({ ...editingSchema, fields: [...editingSchema.fields, newField]});
  }
  
  const handleRemoveField = (fieldIndex: number) => {
    if (!editingSchema) return;
    const updatedFields = editingSchema.fields.filter((_, index) => index !== fieldIndex);
    setEditingSchema({...editingSchema, fields: updatedFields});
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white">Schema Explorer</h1>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column: Filters and Schema List */}
        <Card className="lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-4">Schemas</h2>
          <input
            type="text"
            placeholder="Search schemas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 mb-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            {['All', ...categories].map(category => (
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
          <ul className="flex-grow overflow-y-auto space-y-2 pr-2">
            {filteredSchemas.map(schema => (
              <li
                key={schema.id}
                onClick={() => handleSelectSchema(schema)}
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
        </Card>

        {/* Right Column: Schema Details / Editor */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2">
            {!selectedSchema ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Select a schema to view its details.</p>
              </div>
            ) : editingSchema ? (
              // Edit Mode
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Editing: {editingSchema.name}</h2>
                  <div className="space-x-2">
                    <button onClick={handleSaveEdit} className="px-4 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold text-sm">Save</button>
                    <button onClick={handleCancelEdit} className="px-4 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold text-sm">Cancel</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {editingSchema.fields.map((field, index) => (
                    <div key={index} className="grid grid-cols-10 gap-2 items-center">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                        className="col-span-5 bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white"
                      />
                      <input
                        type="text"
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        className="col-span-4 bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-white"
                      />
                       <button onClick={() => handleRemoveField(index)} className="col-span-1 text-red-400 hover:text-red-300">
                         &times;
                       </button>
                    </div>
                  ))}
                  <button onClick={handleAddFiel} className="mt-4 px-4 py-1 border-2 border-dashed border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-400 rounded-lg font-semibold text-sm w-full">
                    + Add Field
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedSchema.name}</h2>
                    <p className="text-slate-400">{selectedSchema.category}</p>
                  </div>
                  <button onClick={handleEdit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold">Edit</button>
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
