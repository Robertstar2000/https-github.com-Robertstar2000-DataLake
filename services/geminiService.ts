import { GoogleGenAI } from "@google/genai";
import { unstructuredData } from '../data/unstructuredData';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we'll throw an error if the API key is missing.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// This function has been moved into the AIAnalyst component to support conversational chat.
// It is removed from this shared service file.

export const processUnstructuredData = async (
  request: string, 
  documentId: string
): Promise<string> => {
  if (!API_KEY) {
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
