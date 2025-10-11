
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { unstructuredData } from '../data/unstructuredData';
import { getTableSchemas } from './be-db';
import { schemaMetadata } from '../data/schemaMetadata';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
  // We don't throw an error here to allow the UI to render and show a more user-friendly error.
}

// Instantiate the AI client only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// --- From former geminiService.ts ---
export const processUnstructuredData = async (
  request: string, 
  documentId: string
): Promise<string> => {
  if (!ai) {
    return Promise.resolve("Error: Gemini API key is not configured.");
  }
  
  const document = unstructuredData.find(d => d.id === documentId);
  if (!document) {
    return Promise.resolve("Error: Document not found.");
  }

  const model = 'gemini-2.5-flash';
  
  const contextPrompt = `
    You are an advanced data processing AI. You will be given an unstructured text document and a user request.
    Your task is to precisely fulfill the user's request based *only* on the provided document content.

    - If the user asks for a summary or to answer a question, provide a concise, natural language response.
    - If the user asks to extract information into JSON, format your entire response as a single, valid JSON object. Do not include any explanatory text, code block formatting (like \`\`\`json), or anything outside of the JSON structure itself.

    Document Content:
    ---
    ${document.content}
    ---

    User's Request: "${request}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contextPrompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for unstructured data:", error);
    return "The AI is currently unavailable due to a connection issue or high demand. Please try your request again in a moment.";
  }
};

// --- From AIAnalyst.tsx ---
let analystChat: Chat | null = null;

export const initializeAiAnalyst = (): { displaySchema: string } => {
    if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }
    const schemas = getTableSchemas();
    
    const displaySchema = Object.entries(schemas)
        .map(([table, cols]) => `Table **${table}**:\n${cols.split(', ').map(c => `  - \`${c}\``).join('\n')}`)
        .join('\n\n');
        
    const contextSchema = Object.entries(schemas)
        .map(([table, cols]) => `Table "${table}" has columns: ${cols}`)
        .join('\n');
    
    const systemInstruction = `You are an expert data analyst for an e-commerce company. Your task is to answer questions based on the provided SQL table schemas. Be concise and clear in your answers. If the question cannot be answered from the schemas, state that clearly. Analyze the relationships between customers, products, and orders to provide insightful answers. Do not attempt to run or generate SQL. Here are the table schemas: ${contextSchema}`;

    analystChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction
      },
    });
      
    return { displaySchema };
};

export const getAiAnalystResponseStream = (query: string) => {
    if (!analystChat) {
        throw new Error("AI Analyst chat not initialized.");
    }
    return analystChat.sendMessageStream({ message: query });
};


// --- From StructuredDataExplorer.tsx ---
export const searchSchemaWithAi = async (searchQuery: string) => {
    if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }

    const tableSchemas = getTableSchemas();
    
    const schemaContext = Object.entries(tableSchemas).map(([tableName, columns]) => {
        const tableMeta = schemaMetadata[tableName];
        const columnMeta = (typeof columns === 'string' ? columns : '').split(', ').map(colStr => {
            const colName = colStr.split(' ')[0];
            const colDescription = tableMeta?.columns[colName]?.description || '';
            return `  - ${colName}: ${colDescription}`;
        }).join('\n');
        return `Table: ${tableName}\nDescription: ${tableMeta?.description || 'N/A'}\nColumns:\n${columnMeta}`;
    }).join('\n\n');

    const prompt = `
        You are a database schema expert. Analyze the following database schema context and the user's query.
        Identify the most relevant tables and columns for answering the user's query.
        Return a JSON object with two keys: "tables" (an array of relevant table names) and "columns" (an array of relevant, fully-qualified 'table.column' names).

        Schema Context:
        ---
        ${schemaContext}
        ---

        User Query: "${searchQuery}"
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tables: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    columns: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    }
                }
            }
        }
    });

    return JSON.parse(response.text);
};
