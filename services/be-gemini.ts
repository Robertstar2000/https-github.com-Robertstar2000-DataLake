

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
const MIN_API_CALL_INTERVAL_MS = 5000; // 5 seconds

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
  } catch (error: any) {
    console.error("Error calling Gemini API for unstructured data:", error);
    const errorString = JSON.stringify(error);
    if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        return "The AI service is currently experiencing high demand or your quota has been exceeded. Please check your API plan or try again in a few moments.";
    }
    return "The AI is currently unavailable due to a connection issue. Please try again in a moment.";
  }
};

// --- From AIAnalyst.tsx ---
let analystChat: Chat | null = null;

export const initializeAiAnalyst = async (): Promise<{ displaySchema: string }> => {
    if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }
    const schemas = await getTableSchemas();
    
// FIX: `cols` is an object { columns: string, ... }. Access the `columns` property.
    const displaySchema = Object.entries(schemas)
        .map(([table, cols]) => `Table **${table}**:\n${cols.columns.split(', ').map(c => `  - \`${c}\``).join('\n')}`)
        .join('\n\n');
        
// FIX: `cols` is an object. Access the `columns` property for the string value.
    const contextSchema = Object.entries(schemas)
        .map(([table, cols]) => `Table "${table}" has columns: ${cols.columns}`)
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

    const displayChartDeclaration: FunctionDeclaration = {
      name: 'displayChart',
      parameters: {
          type: Type.OBJECT,
          description: 'Displays a chart to the user. Use this after you have retrieved data with executeQuerySql.',
          properties: {
              chartType: { type: Type.STRING, description: "The type of chart to display. Can be 'Bar', 'Line', or 'Pie'." },
              title: { type: Type.STRING, description: 'A descriptive title for the chart.' },
              data: {
                  type: Type.ARRAY,
                  description: 'The data for the chart, which must be an array of objects with "name" and "value" keys. This usually comes from executeQuerySql.',
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.NUMBER }
                    }
                  }
              }
          },
          required: ['chartType', 'title', 'data'],
      },
    };

    const systemInstruction = `You are an expert data analyst. Your task is to answer user questions based on the provided SQL table schemas.
- When asked a question that requires specific data from the database, you MUST use the \`executeQuerySql\` tool to get the information.
- Construct a valid SQL query based on the user's question and the available schemas.
- Do not make up data.
- Once you receive the data from the tool, summarize the result in a clear, user-friendly, natural language response.
- When calling \`executeQuerySql\` for a chart, you MUST alias the columns to 'name' for the label axis and 'value' for the data axis. For example: \`SELECT product_name as name, SUM(price) as value FROM ... GROUP BY name\`.
- After you receive data from a query that was for a chart, you MUST call the \`displayChart\` tool to show the visualization to the user. You should also provide a brief text summary of the chart's findings.
- Here are the table schemas: ${contextSchema}`;

    analystChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [executeQuerySqlDeclaration, displayChartDeclaration] }],
      },
    });
      
    return { displaySchema };
};

export async function* getAiAnalystResponseStream(query: string) {
    if (!analystChat) {
        throw new Error("AI Analyst chat not initialized.");
    }

    try {
        yield { status: 'thinking', text: 'Analyzing your question...' };
        await ensureApiRateLimit();
        const response = await analystChat.sendMessage({ message: query });
    
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0];
            if (fc.name === 'executeQuerySql') {
                const sqlQuery = fc.args.query;
                yield { status: 'generating_sql', text: `I've generated the following SQL query:\n\n\`\`\`sql\n${sqlQuery}\n\`\`\`` };
                
                yield { status: 'querying', text: 'Executing query against the database...' };
                const dbResult = await executeDbQuery(sqlQuery);
    
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
    
                for await (const chunk of toolResponseStream) {
                    if (chunk.text) {
                      yield { status: 'final_answer', text: chunk.text };
                    }
                    if (chunk.functionCalls) {
                      for (const toolCall of chunk.functionCalls) {
                        if (toolCall.name === 'displayChart') {
                          yield { status: 'chart_data', chart: toolCall.args };
                        }
                      }
                    }
                }
            } else {
                 yield { status: 'error', text: `Error: The AI called an unsupported tool: ${fc.name}.` };
            }
        } else {
            yield { status: 'final_answer', text: response.text };
        }
    } catch (error: any) {
        console.error("Error in AI Analyst stream:", error);
        let userFriendlyMessage = `An unexpected error occurred while communicating with the AI: ${error.message}`;
        const errorString = JSON.stringify(error);

        if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
            userFriendlyMessage = "The AI service is currently experiencing high demand or your quota has been exceeded. Please check your API plan or try again in a few moments.";
        }
        yield { status: 'error', text: userFriendlyMessage };
    }
}


// --- From StructuredDataExplorer.tsx ---
export const searchSchemaWithAi = async (searchQuery: string) => {
    if (!ai) {
        throw new Error("Gemini API key is not configured.");
    }

    const tableSchemas = await getTableSchemas();
    
    const schemaContext = Object.entries(tableSchemas).map(([tableName, tableData]) => {
        const tableMeta = schemaMetadata[tableName];
// FIX: `tableData` is an object { columns: string, ... }. Access its `columns` property. The old code was a logic bug.
        const columnMeta = tableData.columns.split(', ').map(colStr => {
            const colName = colStr.split(' ')[0];
// FIX: `tableMeta` can be undefined. Use optional chaining to prevent a runtime error.
            const colDescription = tableMeta?.columns?.[colName]?.description || '';
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
    
    try {
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
    } catch (error: any) {
        console.error("Error calling Gemini API for schema search:", error);
        const errorString = JSON.stringify(error);
        if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("The AI service is currently experiencing high demand or your quota has been exceeded. Please try again in a few moments.");
        }
        throw new Error(`The AI is currently unavailable due to a connection issue: ${error.message}`);
    }
};