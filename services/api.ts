
import * as beDb from './be-db';
import * as beGemini from './be-gemini';
import * as bePipelines from './be-pipelines';
import type { UnstructuredDocument } from '../data/unstructuredData';
import type { Workflow } from '../types';

/**
 * This file acts as the frontend's API client.
 * In a real application, the functions in this file would be making `fetch` calls
 * to a remote backend server. Here, they call the `be-*.ts` files directly
 * but simulate the asynchronous nature of network requests with a delay.
 */

const simulateLatency = (ms: number = 200) => new Promise(resolve => setTimeout(resolve, ms));

// --- DB API ---
export const initializeDatabase = async (dbBytes?: Uint8Array) => {
    await simulateLatency(1000); // DB init can be slow
    return beDb.initializeDatabase(dbBytes);
};

export const executeQuery = async (query: string): Promise<{ headers: string[], data: any[] } | { error: string }> => {
    await simulateLatency(300);
    return beDb.executeQuery(query);
};

export const getTableSchemas = async (): Promise<Record<string, string>> => {
    await simulateLatency();
    return beDb.getTableSchemas();
};

export const findSimilarDocuments = async (docId: string, count: number = 3): Promise<UnstructuredDocument[]> => {
    await simulateLatency();
    return beDb.findSimilarDocuments(docId, count);
};

export const getDbStatistics = async () => {
    await simulateLatency();
    return beDb.getDbStatistics();
};

export const exportDb = async (): Promise<Uint8Array> => {
    await simulateLatency(500);
    return beDb.exportDb();
};

export const runMaintenance = async (): Promise<{ success: boolean, message: string }> => {
    await simulateLatency(500);
    return beDb.runMaintenance();
};

export const getVectorStoreStats = async () => {
    await simulateLatency();
    return beDb.getVectorStoreStats();
};

export const rebuildVectorStore = async (): Promise<void> => {
    await simulateLatency(500);
    return beDb.rebuildVectorStore();
}

export const getDashboardStats = async () => {
    await simulateLatency(400);
    return beDb.getDashboardStats();
}


// --- Gemini API ---
export const processUnstructuredData = async (request: string, documentId: string): Promise<string> => {
    await simulateLatency(800);
    return beGemini.processUnstructuredData(request, documentId);
};

export const initializeAiAnalyst = async (): Promise<{ displaySchema: string }> => {
    await simulateLatency(500);
    return beGemini.initializeAiAnalyst();
};

// For streaming, we pass the call through directly. In a real app, this would be a WebSocket or Server-Sent Events stream setup.
export const getAiAnalystResponseStream = (query: string) => {
    return beGemini.getAiAnalystResponseStream(query);
};

export const searchSchemaWithAi = async (searchQuery: string) => {
    await simulateLatency(800);
    return beGemini.searchSchemaWithAi(searchQuery);
};


// --- Pipeline API ---
// This is already an async function that simulates its own delays, so we can call it directly.
export const executeWorkflow = (workflow: Workflow, logCallback: (message: string) => void): Promise<boolean> => {
    return bePipelines.executeWorkflow(workflow, logCallback);
};
