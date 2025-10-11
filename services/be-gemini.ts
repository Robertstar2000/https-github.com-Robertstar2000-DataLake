
import { GoogleGenAI, Chat, Type, FunctionDeclaration } from "@google/genai";
import { unstructuredData } from '../data/unstructuredData';
import { executeQuery as executeDbQuery, getTableSchemas } from './be-db';
import { schemaMetadata } from '../data/schemaMetadata';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
  // We don't throw an error here to allow the UI to render and show a more user-friendly error.
}

// Instantiate the AI client only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// --- Rate Limiting ---
let lastApiCallTimestamp = 0;
const MIN_API_CALL_INTERVAL_MS = 2000; // 2 seconds

async function ensureApiRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTimestamp;
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL_MS) {
    const delay = MIN_API_CALL_INTERVAL_MS - timeSinceLastCall;
    console.log(`Rate limiting API call. Waiting for ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastApiCallTimestamp = Date.now();
}
// --- End Rate Limiting ---


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
    await ensureApiRateLimit();
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
    
    const executeQuerySqlDeclaration: FunctionDeclaration = {
      name: 'executeQuerySql',
      parameters: {
          type: Type.OBJECT,
          description: 'Executes a read-only SQL query against the database and returns the result as a JSON object array. Use this tool to answer any questions about data.',
          properties: {
              query: {
                  type: Type.STRING,
                  description: 'The SQL query to execute. Must be a SELECT statement.',
              },
          },
          required: ['query'],
      },
    };

    const systemInstruction = `You are an expert data analyst. Your task is to answer user questions based on the provided SQL table schemas.
- When asked a question that requires specific data from the database, you MUST use the \`executeQuerySql\` tool to get the information.
- Construct a valid SQL query based on the user's question and the available schemas.
- Do not make up data.
- Once you receive the data from the tool, summarize the result in a clear, user-friendly, natural language response.
- If the result is a list of items, format it as a markdown list.
- If the query returns no results, state that clearly.
- Here are the table schemas: ${contextSchema}`;

    analystChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [executeQuerySqlDeclaration] }],
      },
    });
      
    return { displaySchema };
};

export async function* getAiAnalystResponseStream(query: string) {
    if (!analystChat) {
        throw new Error("AI Analyst chat not initialized.");
    }

    try {
        // Step 1: Send user query to the model
        yield { status: 'thinking', text: 'Analyzing your question...' };
        await ensureApiRateLimit();
        const response = await analystChat.sendMessage({ message: query });
    
        // Step 2: Check for a function call from the model
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0];
            if (fc.name === 'executeQuerySql') {
                const sqlQuery = fc.args.query;
                yield { status: 'generating_sql', text: `I've generated the following SQL query:\n\n\`\`\`sql\n${sqlQuery}\n\`\`\`` };
                
                // Step 3: Execute the SQL query
                yield { status: 'querying', text: 'Executing query against the database...' };
                const dbResult = executeDbQuery(sqlQuery);
    
                // Step 4: Send the database results back to the model
                yield { status: 'summarizing', text: 'Interpreting database results...' };
                await ensureApiRateLimit();
                const toolResponseStream = await analystChat.sendMessageStream({
                    toolResponses: [{
                        functionResponse: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: JSON.stringify(dbResult) },
                        }
                    }],
                });
    
                // Step 5: Stream the final natural language answer
                for await (const chunk of toolResponseStream) {
                    yield { status: 'final_answer', text: chunk.text };
                }
            } else {
                 yield { status: 'error', text: `Error: The AI called an unsupported tool: ${fc.name}.` };
            }
        } else {
            // If the model replies directly without a tool call
            yield { status: 'final_answer', text: response.text };
        }
    } catch (error: any) {
        console.error("Error in AI Analyst stream:", error);
        yield { status: 'error', text: `An error occurred while communicating with the AI: ${error.message}` };
    }
}


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
    
    await ensureApiRateLimit();
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
