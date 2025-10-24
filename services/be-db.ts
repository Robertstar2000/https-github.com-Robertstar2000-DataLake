import * as dbLogic from './db-logic';
import type { UnstructuredDocument } from '../data/unstructuredData';
import type { Workflow, McpServer, Dashboard as DashboardType, WidgetConfig, User } from '../types';

let dbWorker: Worker | null = null;
const pendingRequests = new Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void }>();
let nextRequestId = 0;

let useFallback = false;
let fallbackInitialized = false;
let workerInitialized = false;

function callWorker(action: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!dbWorker) {
            return reject(new Error("Worker is not available."));
        }
        const id = `req-${nextRequestId++}`;
        pendingRequests.set(id, { resolve, reject });
        dbWorker.postMessage({ id, action, payload });
    });
}

function getOrCreateWorker(): Worker | null {
    if (dbWorker) return dbWorker;
    if (useFallback) return null;

    try {
        const worker = new Worker('/services/db.worker.ts', { type: 'module' });

        worker.onmessage = (e: MessageEvent) => {
            const { id, result, error } = e.data;
            if (pendingRequests.has(id)) {
                const { resolve, reject } = pendingRequests.get(id)!;
                if (error) {
                    console.error(`DB Worker Error for request ${id}:`, error);
                    reject(new Error(error));
                } else {
                    resolve(result);
                }
                pendingRequests.delete(id);
            }
        };

        worker.onerror = (e: ErrorEvent) => {
            console.error("An error occurred in the DB worker:", e);
            for (const [id, { reject }] of pendingRequests.entries()) {
                reject(new Error(`Worker error: ${e.message}`));
                pendingRequests.delete(id);
            }
        };
        
        dbWorker = worker;
        return dbWorker;
    } catch (e) {
        console.warn("Failed to create DB worker. Falling back to main-thread, in-memory database. Persistence will be disabled.", e);
        useFallback = true;
        return null;
    }
}

let initializationPromise: Promise<string> | null = null;

export const initializeDatabase = (dbBytes?: Uint8Array): Promise<string> => {
    if (initializationPromise) {
        return initializationPromise;
    }

    const worker = getOrCreateWorker();
    
    if (worker) {
        initializationPromise = callWorker('initializeDatabase', { dbBytes }).then(result => {
            workerInitialized = true;
            return result;
        });
    } else {
        useFallback = true;
        initializationPromise = dbLogic.initializeDatabase(dbBytes).then(result => {
            fallbackInitialized = true;
            return result;
        });
    }
    
    return initializationPromise;
};

// --- API functions with fallback logic ---

export const executeQuery = (query: string, params: (string|number)[] = []): Promise<{ headers: string[], data: any[] } | { error: string }> => {
    if (useFallback) {
        if (!fallbackInitialized) return Promise.reject(new Error("Database not initialized"));
        return Promise.resolve(dbLogic.executeQuery(query, params));
    }
    if (!workerInitialized) return Promise.reject(new Error("Worker not initialized"));
    return callWorker('executeQuery', { query, params });
};

export const getTableSchemas = (): Promise<Record<string, { columns: string; mcpSource: string | null; }>> => {
    if (useFallback) return Promise.resolve(dbLogic.getTableSchemas());
    return callWorker('getTableSchemas');
};

export const createTableFromMcp = (payload: { tableName: string; columns: string; mcpSource: string; }): Promise<{ success: boolean; message: string; }> => {
    if (useFallback) return Promise.resolve(dbLogic.createTableFromMcp(payload));
    return callWorker('createTableFromMcp', payload);
}

export const findSimilarDocuments = (docId: string, count: number = 3): Promise<UnstructuredDocument[]> => {
    if (useFallback) return Promise.resolve(dbLogic.findSimilarDocuments(docId, count));
    return callWorker('findSimilarDocuments', { docId, count });
};

export const getDbStatistics = (): Promise<any> => {
    if (useFallback) return Promise.resolve(dbLogic.getDbStatistics());
    return callWorker('getDbStatistics');
};

export const exportDb = (): Promise<Uint8Array> => {
    if (useFallback) return Promise.resolve(dbLogic.exportDb());
    return callWorker('exportDb');
};

export const runMaintenance = (): Promise<{ success: boolean, message: string }> => {
    if (useFallback) return Promise.resolve(dbLogic.runMaintenance());
    return callWorker('runMaintenance');
};

export const getVectorStoreStats = (): Promise<any> => {
    if (useFallback) return Promise.resolve(dbLogic.getVectorStoreStats());
    return callWorker('getVectorStoreStats');
};

export const rebuildVectorStore = (): Promise<void> => {
    if (useFallback) {
        dbLogic.rebuildVectorStore();
        return Promise.resolve();
    }
    return callWorker('rebuildVectorStore');
}

export const getDashboardStats = (): Promise<any> => {
    if (useFallback) return Promise.resolve(dbLogic.getDashboardStats());
    return callWorker('getDashboardStats');
}

export const getMcpServers = (): Promise<McpServer[]> => {
    if (useFallback) return Promise.resolve(dbLogic.getMcpServers());
    return callWorker('getMcpServers');
}
export const getWorkflows = (): Promise<Workflow[]> => {
    if (useFallback) return Promise.resolve(dbLogic.getWorkflows());
    return callWorker('getWorkflows');
}
export const getLoadedMcpServers = (): Promise<McpServer[]> => {
    if (useFallback) return Promise.resolve(dbLogic.getLoadedMcpServers());
    return callWorker('getLoadedMcpServers');
}
export const saveMcpServer = (server: McpServer, isLoaded: boolean): Promise<void> => {
    if (useFallback) {
        dbLogic.saveMcpServer(server, isLoaded);
        return Promise.resolve();
    }
    return callWorker('saveMcpServer', { server, isLoaded });
}
export const saveWorkflow = (workflow: Workflow): Promise<void> => {
    if (useFallback) {
        dbLogic.saveWorkflow(workflow);
        return Promise.resolve();
    }
    return callWorker('saveWorkflow', { workflow });
}
export const deleteWorkflow = (id: string): Promise<void> => {
    if (useFallback) {
        dbLogic.deleteWorkflow(id);
        return Promise.resolve();
    }
    return callWorker('deleteWorkflow', { id });
}
export const getDashboards = (): Promise<DashboardType[]> => {
    if (useFallback) return Promise.resolve(dbLogic.getDashboards());
    return callWorker('getDashboards');
}
export const saveDashboard = (dashboard: DashboardType): Promise<void> => {
    if (useFallback) {
        dbLogic.saveDashboard(dashboard);
        return Promise.resolve();
    }
    return callWorker('saveDashboard', { dashboard });
}
export const deleteDashboard = (id: string): Promise<void> => {
    if (useFallback) {
        dbLogic.deleteDashboard(id);
        return Promise.resolve();
    }
    return callWorker('deleteDashboard', { id });
}
export const getUsers = (): Promise<User[]> => {
    if (useFallback) return Promise.resolve(dbLogic.getUsers());
    return callWorker('getUsers');
}
export const saveUser = (user: User): Promise<void> => {
    if (useFallback) {
        dbLogic.saveUser(user);
        return Promise.resolve();
    }
    return callWorker('saveUser', { user });
}
export const deleteUser = (userId: number): Promise<void> => {
    if (useFallback) {
        dbLogic.deleteUser(userId);
        return Promise.resolve();
    }
    return callWorker('deleteUser', { userId });
}